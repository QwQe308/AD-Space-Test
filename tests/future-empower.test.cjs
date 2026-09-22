/* eslint-env node */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const { beforeEach, test } = require("node:test");
const { compileFunction } = require("node:vm");

const { parseSync, transformSync } = require("@babel/core");
const Decimal = require("break_eternity.js");

global.Decimal = Decimal;
global.window = global;
Array.range = (start, count) => Array.from({ length: count }, (_, index) => start + index);
global.mapGameDataToObject = (config, create) => {
  const states = Object.fromEntries(Object.entries(config).map(([id, entry]) => [id, create(entry)]));
  return { all: Object.values(states), ...states };
};

const root = path.resolve(__dirname, "../src");
const modules = new Map();
function loadSource(filename) {
  if (modules.has(filename)) return modules.get(filename).exports;
  const loaded = new Module(filename, module);
  modules.set(filename, loaded);
  loaded.filename = filename;
  loaded.paths = module.paths;
  loaded.require = name => (name.startsWith(".")
    ? loadSource(path.resolve(path.dirname(filename), `${name}.js`))
    : require(name));
  const { code } = transformSync(fs.readFileSync(filename, "utf8"), {
    configFile: false,
    babelrc: false,
    plugins: ["@babel/plugin-transform-modules-commonjs"],
  });
  loaded._compile(code, filename);
  return loaded.exports;
}

const { Currency } = loadSource(path.join(root, "core/currency.js"));
loadSource(path.join(root, "core/math.js"));
global.Currency = Currency;
const { createFutureEmpowerData, futureEmpowerConfig } = loadSource(
  path.join(root, "core/_MOD/empowers/future/future-empower-config.js")
);
const { FutureEmpower, FutureEmpowerOrbs, FutureEmpowerOrbState } = loadSource(
  path.join(root, "core/_MOD/empowers/future/futureEmpower.js")
);
const { deepmergeAll } = loadSource(path.join(root, "utility/deepmerge.js"));
const { PlayerProgress } = loadSource(path.join(root, "core/player-progress.js"));

beforeEach(() => {
  global.player = {
    empowers: { past: { frozenCurrency: null }, future: createFutureEmpowerData() },
    replicanti: { amount: new Decimal(0), unl: true },
    imaginaryInfluence: [],
    eternities: new Decimal(0),
    infinities: new Decimal(0),
    infinitiesBanked: new Decimal("1e1000"),
  };
  global.PlayerProgress = { infinityUnlocked: () => true, eternityUnlocked: () => true };
});

test("IP resets keep frozen IP eligible for Eternity and clear ordinary run records", t => {
  const previousPast = global.PastEmpower;
  const previousPelle = global.Pelle;
  t.after(() => {
    global.PastEmpower = previousPast;
    global.Pelle = previousPelle;
  });
  global.PastEmpower = { get freezing() { return player.empowers.past.frozenCurrency; } };
  global.Pelle = { isDisabled: () => true, isDoomed: false };
  player.infinityPoints = new Decimal("1e400");
  player.records = {
    thisEternity: { maxIP: new Decimal("1e500") },
    thisReality: { maxIP: new Decimal("1e500") },
  };
  player.empowers.past.frozenCurrency = "infinityPoints";
  for (let reset = 0; reset < 2; reset++) {
    Currency.infinityPoints.reset();
    assert.ok(Currency.infinityPoints.value.eq("1e400"));
    assert.ok(player.records.thisEternity.maxIP.eq("1e400"));
    assert.ok(player.records.thisEternity.maxIP.gte(Number.MAX_VALUE));
    Currency.infinityPoints.add(new Decimal("1e600"));
    assert.ok(player.records.thisEternity.maxIP.eq("1e400"));
  }
  player.empowers.past.frozenCurrency = null;
  Currency.infinityPoints.reset();
  assert.ok(Currency.infinityPoints.value.eq(0));
  assert.ok(player.records.thisEternity.maxIP.eq(0));
  assert.ok(player.records.thisReality.maxIP.eq("1e500"));
});

test("each orb uses live thresholds and resets only its source resource after upgrading", () => {
  for (const orb of FutureEmpower.orbs) {
    const resource = Currency[orb.id];
    assert.equal(orb.upgrade(), false);
    const requirement = orb.requirement;
    resource.value = requirement.div(2);
    assert.ok(Math.abs(orb.percentage - 0.5) < 1e-12);
    assert.equal(orb.fillStyle.clipPath, `inset(${(1 - orb.percentage) * 100}% 0 0)`);
    assert.equal(orb.canUpgrade, false);
    resource.value = requirement;
    assert.ok(orb.bulkLevels.eq(1));
    assert.ok(orb.percentage >= 0 && orb.percentage < 1);
    assert.equal(orb.upgrade(), true);
    assert.ok(resource.value.eq(0));
    assert.ok(orb.level.eq(1));
    assert.equal(orb.upgrade(), false);
    resource.value = new Decimal(0);
    assert.equal(orb.percentage, 0);
    assert.equal(orb.canUpgrade, false);
    assert.ok(orb.level.eq(1));
  }
});

test("locked resources cannot earn levels and huge values produce a finite fill", () => {
  const orb = FutureEmpowerOrbs.replicanti;
  player.replicanti.amount = new Decimal("ee1000");
  player.replicanti.unl = false;
  assert.equal(orb.percentage, 0);
  assert.equal(orb.upgrade(), false);
  player.replicanti.unl = true;
  assert.ok(Number.isFinite(orb.percentage));
  assert.equal(orb.satelliteCount, futureEmpowerConfig.satellites.capacity);
  assert.equal(orb.upgrade(), true);
  assert.ok(orb.level.eq(new Decimal("5e997")));
  assert.ok(player.replicanti.amount.eq(0));
  assert.equal(FutureEmpowerOrbs.infinities.canUpgrade, false, "banked Infinities do not count");
});

test("bulk upgrades use one resource snapshot rather than summed costs, and clear frozen resources", () => {
  for (const orb of FutureEmpower.orbs) {
    const resource = Currency[orb.id];
    resource.value = orb.costScale.calculateCost(new Decimal(2));
    assert.ok(orb.bulkLevels.eq(3));
    assert.equal(orb.satelliteCount, 3);
    const banked = player.infinitiesBanked;
    player.empowers.past.frozenCurrency = orb.id;
    assert.equal(orb.upgrade(), true);
    assert.ok(resource.value.eq(0));
    assert.ok(orb.level.eq(3));
    assert.ok(orb.effectValue.eq_tolerance(orb.config.effect(new Decimal(3)), 1e-12));
    assert.ok(player.infinitiesBanked.eq(banked));
    assert.equal(orb.satelliteCount, 0);
    assert.equal(orb.upgrade(), false);
    player.empowers.past.frozenCurrency = null;
  }
});

test("completed layers expose the next threshold and update immediately when resources fall", () => {
  const orb = new FutureEmpowerOrbState({
    ...futureEmpowerConfig.orbs.eternities,
    costScaling: { baseCost: new Decimal(10), baseIncrease: new Decimal(10),
      costScale: new Decimal(1), purchasesBeforeScaling: new Decimal(Infinity) },
  });
  for (const [amount, count, percentage, next] of [
    [5, 0, 0.5, 10], [10, 1, 0.1, 100], [50, 1, 0.5, 100],
    [100, 2, 0.1, 1000], [500, 2, 0.5, 1000], [0, 0, 0, 10],
  ]) {
    Currency.eternities.value = new Decimal(amount);
    assert.ok(orb.bulkLevels.eq(count));
    assert.ok(Math.abs(orb.percentage - percentage) < 1e-12);
    assert.ok(orb.nextRequirement.eq(next));
    assert.equal(orb.satelliteCount, count);
  }
  orb.data.level = new Decimal(2);
  Currency.eternities.value = new Decimal(10000);
  assert.ok(orb.bulkLevels.eq(2));
  assert.equal(orb.upgrade(), true);
  assert.ok(orb.level.eq(4));
});

test("threshold boundaries and the satellite display cap do not change earned levels", () => {
  for (const orb of FutureEmpower.orbs) {
    for (const target of [1, 2, 3, 10, 25, 100]) {
      const threshold = orb.costScale.calculateCost(new Decimal(target - 1));
      Currency[orb.id].value = threshold.mul(0.99999);
      assert.ok(orb.bulkLevels.eq(target - 1), `${orb.id} below ${target}`);
      Currency[orb.id].value = threshold;
      assert.ok(orb.bulkLevels.eq(target), `${orb.id} at ${target}`);
      Currency[orb.id].value = threshold.mul(1.00001);
      assert.ok(orb.bulkLevels.eq(target), `${orb.id} above ${target}`);
    }
    assert.equal(orb.satelliteCount, futureEmpowerConfig.satellites.capacity);
    assert.equal(orb.upgrade(), true);
    assert.ok(orb.level.eq(100));
  }
});

test("clearing prestige counts retains bonuses and unlocks at the Imaginary progression stage", () => {
  global.PlayerProgress = PlayerProgress;
  player.realities = new Decimal(0);
  player.imaginaryInfluence = ["abyss"];
  for (const id of ["infinities", "eternities"]) {
    const orb = FutureEmpowerOrbs[id];
    Currency[id].value = orb.requirement;
    assert.equal(orb.upgrade(), true);
    assert.ok(Currency[id].value.eq(0));
    assert.ok(orb.effectValue.eq(orb.config.effect(new Decimal(1))));
    assert.equal(orb.canBeApplied, true);
  }
  assert.equal(PlayerProgress.infinityUnlocked(), true);
  assert.equal(PlayerProgress.eternityUnlocked(), true);
});

test("orb requirements support accelerated math.js scaling and matching bulk levels", () => {
  const orb = new FutureEmpowerOrbState({
    ...futureEmpowerConfig.orbs.eternities,
    costScaling: {
      baseCost: new Decimal(10),
      baseIncrease: new Decimal(10),
      costScale: new Decimal(10),
      purchasesBeforeScaling: new Decimal(2),
    },
  });
  const thresholds = [10, 100, 1000, 1e5, 1e8, 1e12];
  thresholds.forEach((threshold, level) => {
    orb.data.level = new Decimal(level);
    assert.ok(orb.requirement.eq(threshold));
    orb.data.level = new Decimal(0);
    Currency.eternities.value = new Decimal(threshold).mul(0.99999);
    assert.ok(orb.bulkLevels.eq(level));
    Currency.eternities.value = new Decimal(threshold);
    assert.ok(orb.bulkLevels.eq(level + 1));
  });
  assert.equal(orb.upgrade(), true);
  assert.ok(orb.level.eq(6));
  assert.ok(Currency.eternities.value.eq(0));
});

test("orb bonuses are independent, immediate, and not capped at the former purchase limit", () => {
  for (const orb of FutureEmpower.orbs) {
    assert.equal(orb.effectOrDefault(1), 1);
    assert.ok(orb.effectValue.eq(orb.config.effect(new Decimal(0))));
  }
  const orb = FutureEmpowerOrbs.eternities;
  Currency.eternities.value = orb.costScale.calculateCost(new Decimal(100));
  assert.equal(orb.upgrade(), true);
  assert.ok(orb.level.eq(101));
  assert.ok(orb.effectOrDefault(1).eq(Decimal.pow(1.5, 101)));
  assert.equal(FutureEmpowerOrbs.replicanti.effectOrDefault(1), 1);
  assert.equal(FutureEmpowerOrbs.infinities.effectOrDefault(1), 1);
  assert.equal(orb.upgrade(), false);
  assert.ok(orb.effectValue.eq(Decimal.pow(1.5, 101)));
});

test("selecting an orb swaps the center without upgrading and orbit positions advance in real time", () => {
  const initial = FutureEmpower.orbitLayout(0);
  assert.equal(initial.length, 3);
  assert.deepEqual(initial[0], { id: "replicanti", isCenter: true, x: 0, y: 0 });
  const quarter = FutureEmpower.orbitLayout(futureEmpowerConfig.orbit.period / 4);
  assert.ok(Math.abs(quarter[1].x) < 1e-10);
  assert.equal(quarter[1].y, futureEmpowerConfig.orbit.radius);
  assert.equal(FutureEmpowerOrbs.eternities.select(), true);
  assert.equal(FutureEmpower.selectedOrb.id, "eternities");
  assert.equal(FutureEmpower.selectOrb("all"), false);
  assert.equal(FutureEmpower.selectOrb("toString"), false);
  const swapped = FutureEmpower.orbitLayout(0);
  assert.equal(swapped[0].id, "eternities");
  assert.equal(new Set(swapped.map(entry => entry.id)).size, 3);
  assert.ok(FutureEmpowerOrbs.eternities.level.eq(0));
  assert.deepEqual(FutureEmpower.orbitLayout(Infinity), swapped);
});

test("save merging restores orb levels, bonuses, and selection without separate upgrades", () => {
  const oldSave = { empowers: { past: { frozenCurrency: "infinities" } } };
  const merged = deepmergeAll([{ empowers: { future: createFutureEmpowerData() } }, oldSave]);
  assert.equal("insight" in merged.empowers.future, false);
  assert.equal("upgrades" in merged.empowers.future, false);
  assert.equal(merged.empowers.past.frozenCurrency, "infinities");
  FutureEmpower.selectOrb("infinities");
  player.empowers.future.orbs.infinities.level = new Decimal(5);
  const saved = JSON.parse(JSON.stringify(player.empowers.future));
  player.empowers.future = deepmergeAll([createFutureEmpowerData(), saved]);
  assert.ok(FutureEmpowerOrbs.infinities.level.eq(5));
  assert.ok(FutureEmpowerOrbs.infinities.effectValue.eq_tolerance(0.05, 1e-12));
  assert.equal(FutureEmpower.selectedOrb.id, "infinities");
  player.empowers.future = createFutureEmpowerData();
  assert.ok(FutureEmpowerOrbs.infinities.level.eq(0));
  assert.equal(FutureEmpowerOrbs.infinities.effectOrDefault(1), 1);
});

test("migration removes obsolete insight data while preserving earned orb progress", () => {
  const migrationSource = fs.readFileSync(path.join(root, "core/storage/migrations.js"), "utf8");
  const ast = parseSync(migrationSource, { configFile: false, babelrc: false, sourceType: "module" });
  const migrations = ast.program.body.find(node => node.declaration?.declarations?.[0]?.id.name === "migrations")
    .declaration.declarations[0].init;
  const patches = migrations.properties.find(node => node.key.name === "patches").value;
  const patch = patches.properties.find(node => node.key.value === 104).value;
  const migrate = compileFunction(migrationSource.slice(patch.body.start + 1, patch.body.end - 1), ["player"]);
  const future = player.empowers.future;
  future.insight = new Decimal(999);
  future.upgrades = { replicanti: { level: new Decimal(10) } };
  future.orbs.replicanti.level = new Decimal(3);
  future.selectedOrb = "eternities";
  migrate(player);
  migrate(player);
  assert.equal("insight" in future, false);
  assert.equal("upgrades" in future, false);
  assert.ok(FutureEmpowerOrbs.replicanti.level.eq(3));
  assert.ok(FutureEmpowerOrbs.replicanti.effectValue.eq_tolerance(Decimal.log10(13), 1e-12));
  assert.equal(FutureEmpower.selectedOrb.id, "eternities");
  assert.doesNotThrow(() => migrate({}));
});

test("revised orb effects affect EP, ISU Power, and slowdown instead of prestige counts or flat speed", () => {
  function productionFunction(file, name) {
    const source = fs.readFileSync(path.join(root, file), "utf8");
    const ast = parseSync(source, { configFile: false, babelrc: false, sourceType: "module" });
    const fn = ast.program.body.map(node => node.declaration ?? node).find(node => node.id?.name === name);
    return compileFunction(source.slice(fn.body.start + 1, fn.body.end - 1), fn.params.map(param => param.name));
  }
  global.DC = loadSource(path.join(root, "core/constants.js")).DC;
  global.Effects = loadSource(path.join(root, "core/game-mechanics/effects.js")).Effects;
  const { Effect } = loadSource(path.join(root, "core/game-mechanics/effect.js"));
  const identity = new Effect(new Decimal(1));
  let restricted = false;
  global.FutureEmpowerOrbs = FutureEmpowerOrbs;
  global.Pelle = {
    isDisabled: () => restricted,
    specialGlyphEffect: { replication: new Decimal(1) },
  };
  global.PelleRifts = { decay: identity, vacuum: { milestones: [null, null, identity] } };
  Pelle.specialGlyphEffect.time = new Decimal(1);
  global.isSCRunningOnTier = () => false;
  global.EternityChallenge = () => ({ isRunning: false });
  global.Achievement = () => Object.assign(new Effect(new Decimal(1)), {
    isUnlocked: false, effects: { infinitiesGain: identity },
  });
  global.RealityUpgrade = () => identity;
  global.TimeStudy = () => identity;
  global.getAdjustedGlyphEffect = () => new Decimal(1);
  global.getPrismReplicantiNerf = () => new Decimal(1);
  global.GlyphAlteration = { isAdded: () => false };
  global.SpaceResearchRifts = { r43: identity, r53: identity, r52: identity, r51: identity };
  global.AbyssResearches = { A12: identity, A18: identity, A19: identity, A23: identity, B0: identity };
  global.Ra = { unlocks: { continuousTTBoost: { effects: { infinity: identity, replicanti: identity } } } };
  global.SingularityMilestone = { infinitiedPow: identity };
  global.AlchemyResource = { eternity: identity, replication: identity };
  global.EternityUpgrade = { epMult: identity, ISMultEternities: identity };
  global.GlyphEffect = { epMult: identity };
  player.records = { thisInfinity: { time: new Decimal(0) } };
  const formulas = {
    replicanti: productionFunction("core/replicanti.js", "totalReplicantiSpeedMult"),
    eternities: productionFunction("core/eternity.js", "gainedEternities"),
    infinities: productionFunction("game.js", "gainedInfinities"),
  };
  for (const [id, formula] of Object.entries(formulas)) {
    assert.ok(formula().eq(1), id);
    const orb = FutureEmpowerOrbs[id];
    Currency[id].value = orb.costScale.calculateCost(new Decimal(2));
    assert.equal(orb.upgrade(), true);
    assert.ok(formula().eq(1), `${id} no obsolete multiplier`);
    restricted = true;
    assert.ok(formula().eq(1), `${id} restriction`);
    restricted = false;
    assert.ok(formula().eq(1), `${id} no obsolete multiplier after restriction`);
  }
  EternityUpgrade.ISMultEternities = new Effect(new Decimal(4));
  assert.ok(formulas.infinities().eq(4));
  const totalEP = productionFunction("game.js", "totalEPMult");
  assert.ok(totalEP().eq_tolerance(3.375, 1e-12));
  AbyssResearches.A23 = new Effect(new Decimal(2.25));
  assert.ok(totalEP().eq_tolerance(7.59375, 1e-12));
  restricted = true;
  assert.ok(totalEP().eq(1));
  restricted = false;
  AbyssResearches.A23 = identity;
  assert.ok(totalEP().eq_tolerance(3.375, 1e-12));
  const isuPower = productionFunction("core/secret-formula/infinity/infinity-upgrades.js", "dimInfinityExponent");
  assert.ok(isuPower().eq_tolerance(1.03, 1e-12));
});
