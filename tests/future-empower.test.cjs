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
global.Currency = Currency;
const { createFutureEmpowerData, futureEmpowerConfig } = loadSource(
  path.join(root, "core/_MOD/empowers/future/future-empower-config.js")
);
const { FutureEmpower, FutureEmpowerOrbs, FutureEmpowerUpgrades } = loadSource(
  path.join(root, "core/_MOD/empowers/future/futureEmpower.js")
);
const { deepmergeAll } = loadSource(path.join(root, "utility/deepmerge.js"));

beforeEach(() => {
  global.player = {
    empowers: { past: { frozenCurrency: null }, future: createFutureEmpowerData() },
    replicanti: { amount: new Decimal(0), unl: true },
    eternities: new Decimal(0),
    infinities: new Decimal(0),
    infinitiesBanked: new Decimal("1e1000"),
  };
  global.PlayerProgress = { infinityUnlocked: () => true, eternityUnlocked: () => true };
});

test("each orb uses live resources, grants insight once per level, and spends no source resource", () => {
  for (const orb of FutureEmpower.orbs) {
    const resource = Currency[orb.id];
    assert.equal(orb.upgrade(), false);
    const requirement = orb.requirement;
    resource.value = requirement.div(2);
    assert.ok(Math.abs(orb.percentage - 0.5) < 1e-12);
    assert.equal(orb.fillStyle.transform, `scale(${orb.percentage})`);
    assert.equal(orb.canUpgrade, false);
    resource.value = requirement;
    assert.equal(orb.percentage, 1);
    assert.equal(orb.upgrade(), true);
    assert.ok(resource.value.eq(requirement));
    assert.ok(orb.level.eq(1));
    assert.equal(orb.upgrade(), false);
    resource.value = new Decimal(0);
    assert.equal(orb.percentage, 0);
    assert.equal(orb.canUpgrade, false);
    assert.ok(orb.level.eq(1));
  }
  assert.ok(FutureEmpower.insight.eq(3));
});

test("locked resources cannot earn insight and huge values produce a finite fill", () => {
  const orb = FutureEmpowerOrbs.replicanti;
  player.replicanti.amount = new Decimal("ee1000");
  player.replicanti.unl = false;
  assert.equal(orb.percentage, 0);
  assert.equal(orb.upgrade(), false);
  player.replicanti.unl = true;
  assert.equal(orb.percentage, 1);
  assert.equal(orb.upgrade(), true);
  assert.equal(FutureEmpowerOrbs.infinities.canUpgrade, false, "banked Infinities do not count");
});

test("upgrades share one balance and refunds reverse each price without creating insight", () => {
  Currency.insight.value = new Decimal(10);
  const upgrades = FutureEmpower.upgrades;
  for (const upgrade of upgrades) {
    assert.equal(upgrade.effectOrDefault(1), 1);
    assert.equal(upgrade.purchase(), true);
    assert.ok(upgrade.effectValue.eq(2));
    assert.equal(upgrade.purchase(), true);
    assert.ok(upgrade.effectValue.eq(4));
    assert.ok(upgrade.refund.eq(2));
  }
  assert.ok(Currency.insight.value.eq(1));
  assert.equal(upgrades[0].purchase(), false);
  for (const upgrade of upgrades) {
    assert.equal(upgrade.downgrade(), true);
    assert.ok(upgrade.effectValue.eq(2));
    assert.equal(upgrade.downgrade(), true);
    assert.equal(upgrade.downgrade(), false);
    assert.ok(upgrade.refund.eq(0));
    assert.ok(upgrade.level.eq(0));
    assert.equal(upgrade.effectOrDefault(1), 1);
  }
  assert.ok(Currency.insight.value.eq(10));
  for (let i = 0; i < 20; i++) {
    assert.equal(upgrades[0].purchase(), true);
    assert.equal(upgrades[0].downgrade(), true);
  }
  assert.ok(Currency.insight.value.eq(10));
});

test("maxed upgrades cannot charge insight and can still downgrade", () => {
  const upgrade = FutureEmpowerUpgrades.eternities;
  upgrade.data.level = upgrade.maxLevel;
  Currency.insight.value = new Decimal("1e100");
  const balance = Currency.insight.value;
  assert.equal(upgrade.isMaxed, true);
  assert.equal(upgrade.purchase(), false);
  assert.ok(Currency.insight.value.eq(balance));
  assert.equal(upgrade.downgrade(), true);
  assert.equal(upgrade.isMaxed, false);
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
  assert.ok(FutureEmpower.insight.eq(0));
  assert.ok(FutureEmpowerOrbs.eternities.level.eq(0));
  assert.deepEqual(FutureEmpower.orbitLayout(Infinity), swapped);
});

test("save merging fills old saves and restores Decimal levels, balance, and selection", () => {
  const oldSave = { empowers: { past: { frozenCurrency: "infinities" } } };
  const merged = deepmergeAll([{ empowers: { future: createFutureEmpowerData() } }, oldSave]);
  assert.ok(merged.empowers.future.insight.eq(0));
  assert.equal(merged.empowers.past.frozenCurrency, "infinities");
  Currency.insight.value = new Decimal(8);
  FutureEmpowerUpgrades.replicanti.purchase();
  FutureEmpower.selectOrb("infinities");
  player.empowers.future.orbs.infinities.level = new Decimal(5);
  const saved = JSON.parse(JSON.stringify(player.empowers.future));
  player.empowers.future = deepmergeAll([createFutureEmpowerData(), saved]);
  assert.ok(FutureEmpower.insight.eq(7));
  assert.ok(FutureEmpowerOrbs.infinities.level.eq(5));
  assert.equal(FutureEmpower.selectedOrb.id, "infinities");
  assert.equal(FutureEmpowerUpgrades.replicanti.downgrade(), true);
  assert.ok(FutureEmpower.insight.eq(8));
  player.empowers.future = createFutureEmpowerData();
  assert.ok(FutureEmpowerUpgrades.replicanti.level.eq(0));
  assert.ok(FutureEmpower.insight.eq(0));
});

test("purchases and refunds update real production formulas while existing restrictions still apply", () => {
  function productionFunction(file, name) {
    const source = fs.readFileSync(path.join(root, file), "utf8");
    const ast = parseSync(source, { configFile: false, babelrc: false, sourceType: "module" });
    const fn = ast.program.body.find(node => node.declaration?.id?.name === name).declaration;
    return compileFunction(source.slice(fn.body.start + 1, fn.body.end - 1), fn.params.map(param => param.name));
  }
  global.DC = loadSource(path.join(root, "core/constants.js")).DC;
  global.Effects = loadSource(path.join(root, "core/game-mechanics/effects.js")).Effects;
  const { Effect } = loadSource(path.join(root, "core/game-mechanics/effect.js"));
  const identity = new Effect(new Decimal(1));
  let restricted = false;
  global.FutureEmpowerUpgrades = FutureEmpowerUpgrades;
  global.Pelle = {
    isDisabled: () => restricted,
    specialGlyphEffect: { replication: new Decimal(1) },
  };
  global.PelleRifts = { decay: identity };
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
  global.SpaceResearchRifts = { r43: identity, r53: identity, r52: identity };
  global.AbyssResearches = { A12: identity, A18: identity, A19: identity };
  global.Ra = { unlocks: { continuousTTBoost: { effects: { infinity: identity, replicanti: identity } } } };
  global.SingularityMilestone = { infinitiedPow: identity };
  global.AlchemyResource = { eternity: identity, replication: identity };
  player.records = { thisInfinity: { time: new Decimal(0) } };
  const formulas = {
    replicanti: productionFunction("core/replicanti.js", "totalReplicantiSpeedMult"),
    eternities: productionFunction("core/eternity.js", "gainedEternities"),
    infinities: productionFunction("game.js", "gainedInfinities"),
  };
  Currency.insight.value = new Decimal(10);
  for (const [id, formula] of Object.entries(formulas)) {
    assert.ok(formula().eq(1), id);
    assert.equal(FutureEmpowerUpgrades[id].purchase(), true);
    assert.ok(formula().eq(2), id);
    restricted = true;
    assert.ok(formula().eq(1), `${id} restriction`);
    restricted = false;
    assert.equal(FutureEmpowerUpgrades[id].downgrade(), true);
    assert.ok(formula().eq(1), `${id} refund`);
  }
});
