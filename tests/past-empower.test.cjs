/* eslint-env node */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { test } = require("node:test");

const Decimal = require("break_eternity.js");

function setup(name = "Infinity") {
  const currency = () => ({
    value: new Decimal(0),
    add(value) {
      assert.ok(value.isFinite() && value.gte(0));
      this.value = this.value.add(value);
    },
  });
  const context = vm.createContext({
    DC: { D1: new Decimal(1) },
    player: {
      empowers: { past: {
        simulating: name,
        simulationSpeed: new Decimal(10),
        simulationTimeThisReset: new Decimal(500000),
        simulationTrueTimeThisReset: 500000,
        simulationTickThisReset: 500000,
      } },
      partInfinityPoint: 0,
      partInfinitied: 0,
      reality: { partEternitied: new Decimal(0) },
    },
    Player: { canCrunch: true, canEternity: true },
    Currency: {
      infinityPoints: currency(),
      infinities: currency(),
      eternityPoints: currency(),
      eternities: currency(),
    },
    rewards: { points: new Decimal(5), count: new Decimal(1) },
    resets: { Infinity: 0, Eternity: 0 },
  });
  context.bigCrunchGiveRewardsList = () => ({
    infinityPoints: context.rewards.points,
    infinities: context.rewards.count,
  });
  context.eternityGiveRewardsList = () => ({
    eternityPoints: context.rewards.points,
    eternities: context.rewards.count,
  });
  context.bigCrunchReset = () => context.resets.Infinity++;
  context.eternity = () => context.resets.Eternity++;
  const source = fs.readFileSync(path.join(__dirname, "../src/core/_MOD/empowers/past/pastEmpower.js"), "utf8")
    .replace(/^import .*;\r?\n/gmu, "")
    .replace(/^export /gmu, "");
  vm.runInContext(source, context);
  context.past = vm.runInContext("PastEmpower", context);
  return context;
}

for (const [name, points, count, requirement] of [
  ["Infinity", "infinityPoints", "infinities", "canCrunch"],
  ["Eternity", "eternityPoints", "eternities", "canEternity"],
]) {
  test(`${name} simulation generates each tick at fixed speed without repeated resets`, () => {
    const context = setup(name);
    for (let tick = 0; tick < 100; tick++) {
      context.past.updateSimulationAfterTick(new Decimal(33));
    }
    assert.ok(context.Currency[points].value.eq_tolerance(500, 1e-12));
    assert.ok(context.Currency[count].value.eq_tolerance(100, 1e-12));
    assert.ok(context.past.simulationSpeed.eq(1));
    assert.equal(context.resets[name], 0);
    context.rewards.points = new Decimal(10);
    context.past.updateSimulationAfterTick(new Decimal(33));
    assert.ok(context.Currency[points].value.eq_tolerance(510, 1e-12));
  });

  test(`${name} simulation does not bank time while requirements are unmet or simulation is paused`, () => {
    const context = setup(name);
    context.Player[requirement] = false;
    context.past.updateSimulationAfterTick(new Decimal(10000));
    assert.ok(context.Currency[points].value.eq(0));
    assert.equal(Object.keys(context.past.simulationGain).length, 0);
    context.Player[requirement] = true;
    context.past.updateSimulationAfterTick(new Decimal(33));
    assert.ok(context.Currency[points].value.eq_tolerance(5, 1e-12));
    context.past.toggleSimulation(name);
    context.past.updateSimulationAfterTick(new Decimal(10000));
    assert.ok(context.Currency[points].value.eq_tolerance(5, 1e-12));
    assert.equal(context.past.simulating, null);
  });

  test(`${name} simulation preserves fractional counts and handles large offline ticks`, () => {
    const context = setup(name);
    for (let tick = 0; tick < 34; tick++) {
      context.past.updateSimulationAfterTick(new Decimal(1));
    }
    assert.ok(context.Currency[count].value.eq(1));
    const remainder = name === "Infinity" ? context.player.partInfinitied : context.player.reality.partEternitied;
    assert.ok(new Decimal(remainder).eq_tolerance(new Decimal(1).div(33), 1e-12));
    const pointsRemainder = name === "Infinity" ? context.player.partInfinityPoint : 0;
    assert.ok(context.Currency[points].value.add(pointsRemainder).eq_tolerance(new Decimal(170).div(33), 1e-12));
    context.past.updateSimulationAfterTick(new Decimal("1e400"));
    const expected = new Decimal("1e400").div(1000).div(0.033).mul(5);
    assert.ok(context.Currency[points].value.eq_tolerance(expected, 1e-12));
    assert.ok(context.past.simulationSpeed.eq(1));
    assert.equal(context.resets[name], 0);
  });
}

test("switching simulations retains the entry reset and pays only the selected prestige", () => {
  const context = setup();
  context.past.toggleSimulation("Eternity");
  assert.equal(context.resets.Eternity, 1);
  context.past.updateSimulationAfterTick(new Decimal(33));
  assert.ok(context.Currency.eternityPoints.value.eq_tolerance(5, 1e-12));
  assert.ok(context.Currency.infinityPoints.value.eq(0));
  assert.ok(context.past.simulationSpeed.eq(1));
});
