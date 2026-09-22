/* eslint-env node */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { test } = require("node:test");

const Decimal = require("break_eternity.js");

function setup(bestTime = 100) {
  const zero = new Decimal(0);
  const currency = () => ({
    value: new Decimal(0),
    add(value) {
      assert.ok(value.isFinite() && value.gte(0), `Invalid IP gain: ${value}`);
      this.value = this.value.add(value);
    },
  });
  const context = vm.createContext({
    Decimal,
    DC: { D0: zero, D1: new Decimal(1), E1: new Decimal(10), BEMAX: new Decimal("ee100") },
    player: {
      partInfinityPoint: 0,
      partInfinitied: 0,
      empowers: { past: { simulating: "Infinity" } },
      records: { bestInfinity: { time: new Decimal(bestTime) } },
    },
    Time: { bestInfinity: { totalMilliseconds: new Decimal(bestTime) } },
    InfinityUpgrade: { ipGen: { isBought: true, effectValue: new Decimal(2) } },
    BreakInfinityUpgrade: { ipGen: { effectOrDefault: () => zero } },
    Laitela: { isRunning: false },
    Currency: { infinityPoints: currency(), infinities: currency() },
    gainedInfinityPoints: () => new Decimal(5),
    gainedInfinities: () => new Decimal(1),
  });
  for (const file of ["big-crunch.js", "_MOD/empowers/past/pastEmpower.js"]) {
    const source = fs.readFileSync(path.join(__dirname, "../src/core", file), "utf8")
      .replace(/^import .*;\r?\n/gmu, "")
      .replace(/^export /gmu, "");
    vm.runInContext(source, context);
  }
  return context;
}

test("passive IP accumulates fractional generation periods", () => {
  const context = setup();
  for (let tick = 1; tick <= 4; tick++) {
    context.preProductionGenerateIP(new Decimal(100));
    assert.equal(context.player.partInfinityPoint, (tick % 4) / 4);
  }
  assert.ok(context.Currency.infinityPoints.value.eq(2));
});

test("instant Infinities keep a bounded remainder across passive and simulation payouts", () => {
  const context = setup(0);
  for (let tick = 0; tick < 10; tick++) {
    context.preProductionGenerateIP(new Decimal(33));
    assert.ok(context.player.partInfinityPoint >= 0 && context.player.partInfinityPoint < 1);
    vm.runInContext("PastEmpower.simulationConfig.giveRewards(new Decimal(1), new Decimal(0.001));", context);
    assert.ok(context.player.partInfinityPoint >= 0 && context.player.partInfinityPoint < 1);
  }
  assert.ok(context.Currency.infinityPoints.value.isFinite());
  assert.ok(context.Currency.infinityPoints.value.gt(0));
});

test("version 105 repairs legacy IP remainders once and preserves valid fractions", () => {
  const migrationSource = fs.readFileSync(path.join(__dirname, "../src/core/storage/migrations.js"), "utf8")
    .replace(/^import .*;\r?\n/gmu, "")
    .replace(/^export /gmu, "");
  for (const remainder of [-7.46e86, 4.66e85, NaN, Infinity, undefined, 0, 0.5]) {
    const context = setup();
    context.Player = { defaultStart: {} };
    context.deepmergeAll = objects => Object.assign({}, ...objects);
    context.player.version = 104;
    context.player.partInfinityPoint = remainder;
    vm.runInContext(migrationSource, context);
    vm.runInContext(`
      let repairs = 0;
      const repair = migrations.patches[105];
      migrations.patches[105] = save => { repairs++; repair(save); };
      player = migrations.patch(player, 106);
    `, context);
    const expected = remainder === 0.5 ? 0.5 : 0;
    assert.equal(context.player.partInfinityPoint, expected);
    assert.equal(context.player.version, 105);
    vm.runInContext("player = migrations.patch(player, 106);", context);
    assert.equal(vm.runInContext("repairs", context), 1);
    assert.equal(context.player.partInfinityPoint, expected);
    context.preProductionGenerateIP(new Decimal(100));
    assert.equal(context.player.partInfinityPoint, expected + 0.25);
    assert.ok(context.Currency.infinityPoints.value.eq(0));
  }
});

test("large offline ticks retain Decimal generation without Number overflow", () => {
  const context = setup(0);
  context.preProductionGenerateIP(new Decimal("1e400"));
  assert.ok(context.Currency.infinityPoints.value.isFinite());
  assert.ok(context.Currency.infinityPoints.value.eq_tolerance(new Decimal("1e400").div(132).mul(2), 1e-12));
  assert.equal(context.player.partInfinityPoint, 0);
});

test("passive IP uses a 33 ms minimum Infinity time before its fourfold interval", () => {
  for (const duration of [0, 1, 32, 33, 100]) {
    const context = setup(duration);
    const period = Math.max(duration, 33) * 4;
    for (let tick = 0; tick < 4; tick++) context.preProductionGenerateIP(new Decimal(period / 4));
    assert.ok(context.Currency.infinityPoints.value.eq(2));
    assert.equal(context.player.partInfinityPoint, 0);
    assert.ok(context.player.records.bestInfinity.time.eq(duration));
  }
});

test("best-run passive IP handles zero-time and zero-reward runs with a 33 ms minimum", () => {
  const source = fs.readFileSync(path.join(__dirname, "../src/core/cache.js"), "utf8");
  const getter = source.slice(source.indexOf("bestRunIPPM: new Lazy("),
    source.indexOf("averageRealTimePerEternity:"));
  Decimal.maxReducer = (a, b) => Decimal.max(a, b);
  for (const duration of [0, 1, 32, 33, 100]) {
    for (const reward of [0, 5, "2.442055489550174e1023"]) {
      const context = setup(duration);
      context.player.records.recentInfinities = [
        [0, new Decimal(duration), new Decimal(0), new Decimal(reward)],
        [0, new Decimal(0), new Decimal(0), new Decimal(0)],
      ];
      context.Lazy = class {
        constructor(calculate) { this.value = calculate(); }
      };
      const rate = vm.runInContext(`({${getter}}).bestRunIPPM.value`, context);
      assert.ok(rate.isFinite());
      assert.ok(rate.eq_tolerance(new Decimal(reward).div(Math.max(duration, 33)).mul(60000), 1e-12));
      context.BreakInfinityUpgrade.ipGen.effectOrDefault = () => rate;
      context.preProductionGenerateIP(new Decimal(330505));
      context.preProductionGenerateIP(new Decimal("1e4000"));
      assert.ok(context.Currency.infinityPoints.value.isFinite());
    }
  }
});

test("prestige peak rates and history use the same 33 ms minimum", () => {
  const source = fs.readFileSync(path.join(__dirname, "../src/game.js"), "utf8");
  const history = source.slice(source.indexOf("export function ratePerMinute"),
    source.indexOf("// eslint-disable-next-line max-params", source.indexOf("export function ratePerMinute")))
    .replace("export ", "");
  const peaks = source.slice(source.indexOf("function updatePrestigeRates()"),
    source.indexOf("function passivePrestigeGen()"));
  for (const duration of [0, 1, 32, 33, 100]) {
    const context = setup(duration);
    const run = () => ({ totalMilliseconds: new Decimal(duration) });
    Object.assign(context.Time, {
      thisInfinityRealTime: run(), thisEternityRealTime: run(), thisRealityRealTime: run(),
    });
    Object.assign(context.player.records, {
      thisInfinity: { bestIPmin: new Decimal(0) },
      thisEternity: { bestEPmin: new Decimal(0) },
      thisReality: { bestRSmin: new Decimal(0) },
    });
    context.gainedEternityPoints = () => new Decimal(5);
    context.Effarig = { shardsGained: new Decimal(5) };
    context.Player = { canCrunch: true, canEternity: true };
    context.isRealityAvailable = () => true;
    vm.runInContext(`${history}\n${peaks}\nupdatePrestigeRates();`, context);
    const expected = new Decimal(5).div(Math.max(duration, 33)).mul(60000);
    assert.ok(context.player.records.thisInfinity.bestIPmin.eq_tolerance(expected, 1e-12));
    assert.ok(context.player.records.thisEternity.bestEPmin.eq_tolerance(expected, 1e-12));
    assert.ok(context.ratePerMinute(new Decimal(5), new Decimal(duration)).eq_tolerance(expected, 1e-12));
  }
});
