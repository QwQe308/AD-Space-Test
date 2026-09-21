/* eslint-env node */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const { beforeEach, test } = require("node:test");
const { transformSync } = require("@babel/core");
const { parseComponent, compile } = require("vue-template-compiler");
const Vue = require("vue");
const Decimal = require("break_eternity.js");

global.Decimal = Decimal;
global.window = global;
global.GAME_EVENT = { GAME_TICK_AFTER: "tick", ETERNITY_RESET_AFTER: "eternity" };
const listeners = new Map();
global.EventHub = { logic: { on(event, callback) {
  if (!listeners.has(event)) listeners.set(event, []);
  listeners.get(event).push(callback);
} } };
function dispatch(event) {
  for (const callback of listeners.get(event) ?? []) callback();
}
global.mapGameDataToObject = (configs, create) => {
  const states = Object.fromEntries(Object.entries(configs).map(([id, config]) => [id, create(config)]));
  return { ...states, all: Object.values(states) };
};

let conditionsMet;
let inMirror;
let completions;
const config = (id, overrides = {}) => ({
  id, depth: "0", position: [0, 0], type: "single", cost: new Decimal(100),
  next: [], previous: [], tooltipTags: [], ...overrides,
});
global.GameDatabase = { space: { abyssResearches: {
  C0: config("C0", {
    type: "core", next: ["NEXT"], tooltipTags: ["Core"],
    onLevelUp: () => completions++,
    restrictions: [
      { requirement: () => conditionsMet },
      { type: "failable", completable: () => inMirror, resetOnEvent: GAME_EVENT.ETERNITY_RESET_AFTER },
    ],
  }),
  NEXT: config("NEXT"),
  SINGLE: config("SINGLE", { restrictions: [{ requirement: () => conditionsMet }] }),
  NO_CONDITIONS: config("NO_CONDITIONS", { type: "core" }),
  A6: config("A6"), A6B: config("A6B"),
} } };

const root = path.resolve(__dirname, "../src");
const DC = { D0: new Decimal(0), D1: new Decimal(1), BEMAX: new Decimal(Infinity) };
const modules = new Map();
function loadSource(filename) {
  if (modules.has(filename)) return modules.get(filename).exports;
  const loaded = new Module(filename, module);
  modules.set(filename, loaded);
  loaded.filename = filename;
  loaded.paths = module.paths;
  loaded.require = name => {
    const resolved = path.resolve(path.dirname(filename), name).replace(/\.js$/, "");
    if (resolved === path.join(root, "core/constants")) return { DC };
    if (resolved === path.join(root, "core/utils")) {
      return loadSource(path.join(root, "core/game-mechanics/game-mechanic.js"));
    }
    if (resolved === path.join(root, "core/_MOD/abyss/abyss-researches/abyssResearchSpawner")) {
      return { ...loadSource(`${resolved}.js`), abyssDepths: [["0"]],
        globalAbyssResearchSpeed: () => new Decimal(0) };
    }
    if (resolved === path.join(root, "env")) return { DEV: false };
    return loadSource(resolved.endsWith(".vue") ? resolved : `${resolved}.js`);
  };
  const source = fs.readFileSync(filename, "utf8");
  const component = filename.endsWith(".vue") ? parseComponent(source) : null;
  if (component) assert.deepEqual(compile(component.template.content).errors, []);
  const { code } = transformSync(component ? component.script.content : source, {
    configFile: false, babelrc: false, plugins: ["@babel/plugin-transform-modules-commonjs"],
  });
  loaded._compile(code, filename);
  return loaded.exports;
}
const { Currency } = loadSource(path.join(root, "core/currency.js"));
global.Currency = Currency;
global.TimeStudy = { boughtNormalTS: () => [], eternityChallenge: { current: () => undefined } };
global.Enslaved = { isRunning: false };
global.TimeTheorems = loadSource(path.join(root, "core/time-theorems.js")).TimeTheorems;
// These tests have no Time Studies; use real total and Corruption accounting with an empty tree.
TimeTheorems.calculateTimeStudiesCost = () => DC.D0;
const { AbyssResearchesDepth1: depth1 } = loadSource(
  path.join(root, "core/_MOD/abyss/abyss-researches/configs/abyss-research-depth-1.js")
);
Object.assign(GameDatabase.space.abyssResearches, {
  B3: config("B3", { ...depth1.B3, depth: "0", next: ["NEXT"], previous: [],
    onLevelUp: () => completions++ }),
  PST: config("PST", { ...depth1.PST, depth: "0" }),
  MULTI: config("MULTI", { type: "corruption", cost: {
    timeTheorems: 50, perkPoints: () => Currency.timeTheorems.value.div(10),
  } }),
});
const { AbyssResearches: researches, AbyssResearchHelperTools: helper } = loadSource(
  path.join(root, "core/_MOD/abyss/abyss-researches/abyssResearch.js")
);
global.AbyssResearches = researches;
global.getEffectiveSpace = () => new Decimal(0);

beforeEach(() => {
  conditionsMet = true;
  inMirror = true;
  completions = 0;
  global.player = {
    abyssResearches: Object.fromEntries(researches.all.map(research => [research.id, {
      level: new Decimal(0), progress: new Decimal(0), unlocked: research.id !== "NEXT", shown: true,
      restrictionData: (research.restrictions ?? []).map(() => ({ completion: false, stillCompletable: true })),
    }])),
    activeAbyssResearches: new Set(),
    abyssResearchTooltipsShown: new Set(),
    space: new Decimal(0),
    records: { thisReality: { maxSpace: new Decimal(0), maxEffectiveSpace: new Decimal(0) } },
    timestudy: { theorem: new Decimal(100), maxTheorem: new Decimal(100) },
    reality: { perkPoints: new Decimal(10) },
  };
});

test("starting a Core with satisfied live requirements completes immediately at zero progress", () => {
  researches.C0.click();
  assert.equal(researches.C0.completed, true);
  assert.ok(researches.C0.progress.eq(0));
  assert.equal(researches.C0.isResearching, false);
  assert.equal(completions, 1);
  assert.equal(researches.NEXT.unlocked, true);
  assert.ok(player.abyssResearchTooltipsShown.has("Core"));
  researches.C0.click();
  helper.update(new Decimal(0));
  assert.equal(completions, 1);
});

test("an active Core completes when its last requirement is met even at zero research speed", () => {
  conditionsMet = false;
  researches.C0.start();
  assert.equal(researches.C0.completed, false);
  assert.equal(researches.C0.isResearching, true);
  conditionsMet = true;
  helper.update(new Decimal(0));
  assert.equal(researches.C0.completed, true);
  assert.equal(researches.C0.isResearching, false);
  assert.equal(researches.NEXT.unlocked, true);
});

test("stale completed conditions cannot grant a Core after a live requirement becomes false", () => {
  dispatch(GAME_EVENT.GAME_TICK_AFTER);
  conditionsMet = false;
  researches.C0.start();
  assert.equal(researches.C0.completed, false);
  assert.equal(researches.C0.isResearching, true);
});

test("failable requirements reject current and historical failures until their reset event", () => {
  dispatch(GAME_EVENT.GAME_TICK_AFTER);
  inMirror = false;
  researches.C0.start();
  assert.equal(researches.C0.completed, false);
  dispatch(GAME_EVENT.GAME_TICK_AFTER);
  inMirror = true;
  helper.update(new Decimal(0));
  assert.equal(researches.C0.completed, false);
  dispatch(GAME_EVENT.ETERNITY_RESET_AFTER);
  helper.update(new Decimal(0));
  assert.equal(researches.C0.completed, true);
});

test("a Core can still complete by paying its full research cost with unmet requirements", () => {
  conditionsMet = false;
  inMirror = false;
  researches.C0.start();
  researches.C0.addProgress(new Decimal(99));
  assert.equal(researches.C0.completed, false);
  researches.C0.addProgress(new Decimal(1));
  assert.equal(researches.C0.completed, true);
  assert.equal(researches.C0.isResearching, false);
  assert.equal(researches.NEXT.unlocked, true);
  assert.equal(completions, 1);
});

test("instant completion preserves unlock and concurrent research limits", () => {
  player.abyssResearches.C0.unlocked = false;
  researches.C0.start();
  assert.equal(researches.C0.completed, false);
  player.abyssResearches.C0.unlocked = true;
  researches.SINGLE.start();
  researches.C0.start();
  assert.equal(researches.C0.completed, false);
  assert.equal(researches.C0.isResearching, false);
  researches.SINGLE.stop();
  researches.C0.start();
  assert.equal(researches.C0.completed, true);
});

test("ordinary research and Cores without conditions still require research progress", () => {
  dispatch(GAME_EVENT.GAME_TICK_AFTER);
  researches.SINGLE.start();
  assert.equal(researches.SINGLE.completed, false);
  researches.SINGLE.addProgress(new Decimal(100));
  assert.equal(researches.SINGLE.completed, true);
  researches.NO_CONDITIONS.start();
  assert.equal(researches.NO_CONDITIONS.completed, false);
  researches.NO_CONDITIONS.addProgress(new Decimal(100));
  assert.equal(researches.NO_CONDITIONS.completed, true);
});

test("Corruption buys instantly with a full queue, spends actual Currency and completes only once", () => {
  const remaining = Currency.timeTheorems.value.sub(researches.B3.cost.timeTheorems);
  researches.SINGLE.start();
  assert.equal(player.activeAbyssResearches.size, researches.B3.maxConcurrent);
  assert.equal(researches.B3.canPurchase, true);
  assert.equal(researches.B3.canResearch, false);
  researches.B3.click();
  assert.ok(Currency.timeTheorems.value.eq(remaining));
  assert.ok(player.timestudy.maxTheorem.eq(100));
  assert.ok(Currency.timeTheorems.max.eq(100));
  assert.equal(researches.B3.completed, true);
  assert.equal(researches.B3.maxed, true);
  assert.equal(researches.B3.percentage, 1);
  assert.equal(researches.NEXT.unlocked, true);
  assert.equal(completions, 1);
  assert.deepEqual([...player.activeAbyssResearches], ["SINGLE"]);
  researches.B3.click();
  assert.equal(researches.B3.purchase(), false);
  assert.ok(Currency.timeTheorems.value.eq(remaining));
  assert.equal(completions, 1);
});

test("Corruption rejects locked and unaffordable nodes without spending or completing", () => {
  const cost = new Decimal(researches.B3.cost.timeTheorems);
  player.abyssResearches.B3.unlocked = false;
  assert.equal(researches.B3.canPurchase, false);
  assert.equal(researches.B3.purchase(), false);
  assert.ok(Currency.timeTheorems.value.eq(100));
  player.abyssResearches.B3.unlocked = true;
  Currency.timeTheorems.value = cost.sub(1);
  researches.B3.click();
  assert.equal(researches.B3.completed, false);
  assert.ok(Currency.timeTheorems.value.eq(cost.sub(1)));
  Currency.timeTheorems.value = cost;
  assert.equal(researches.B3.purchase(), true);
  assert.ok(Currency.timeTheorems.value.eq(0));
});

test("all Corruption prices are checked and snapshotted before any resource is deducted", () => {
  Currency.perkPoints.value = new Decimal(9);
  assert.equal(researches.MULTI.purchase(), false);
  assert.ok(TimeTheorems.corruptionTTSpent.eq(0));
  assert.ok(Currency.timeTheorems.value.eq(100));
  assert.ok(Currency.perkPoints.value.eq(9));
  Currency.perkPoints.value = new Decimal(10);
  assert.equal(researches.MULTI.purchase(), true);
  assert.ok(Currency.timeTheorems.value.eq(50));
  assert.ok(Currency.perkPoints.value.eq(0));
  assert.ok(TimeTheorems.corruptionTTSpent.eq(50));
  assert.ok(Currency.timeTheorems.max.eq(100));
});

test("PST's configured dynamic price works with missing future nodes and rechecks at purchase", () => {
  assert.equal(researches.PST.cost.timeTheorems, 100);
  assert.equal(researches.PST.canPurchase, true);
  researches.PRS = { completed: true };
  try {
    assert.equal(researches.PST.cost.timeTheorems, 150);
    assert.equal(researches.PST.purchase(), false);
    Currency.timeTheorems.value = new Decimal(150);
    assert.equal(researches.PST.purchase(), true);
    assert.ok(Currency.timeTheorems.value.eq(0));
    assert.ok(TimeTheorems.corruptionTTSpent.eq(150));
    assert.ok(Currency.timeTheorems.max.eq(150));
  } finally {
    delete researches.PRS;
  }
});

test("research progress and direct starts cannot award or enqueue Corruption nodes", () => {
  const node = researches.B3;
  node.start();
  node.addProgress(new Decimal("1e100"));
  node.updateLevel();
  assert.equal(node.completed, false);
  assert.equal(node.percentage, 0);
  assert.ok(node.progress.eq(0));
  assert.equal(node.isResearching, false);
  assert.equal(node.isAutoResearching, false);
  assert.equal(researches.NEXT.unlocked, false);
  assert.ok(Currency.timeTheorems.value.eq(100));
});

test("Corruption tooltips show live resource costs instead of research progress or time estimates", () => {
  const cost = new Decimal(researches.B3.cost.timeTheorems);
  Decimal.prototype.copyFrom = function(value) {
    this.sign = value.sign;
    this.layer = value.layer;
    this.mag = value.mag;
  };
  global.format = value => String(value);
  const component = loadSource(path.join(root, "components/tabs/_MOD/abyss/AbyssResearchNode.vue")).default;
  const vm = new (Vue.extend(component))({ propsData: { id: "B3" } });
  vm.update();
  assert.equal(vm.hasProgress, false);
  assert.ok(vm.getMainInfosTooltip.includes(`${cost} Time Theorems`));
  assert.equal(vm.canPurchase, true);
  assert.doesNotMatch(vm.getMainInfosTooltip, /Progress:|Forever/);
  Currency.timeTheorems.value = cost.sub(1);
  vm.update();
  assert.equal(vm.getContainerClass.unaffordable, true);
  assert.equal(vm.canPurchase, false);
  Currency.timeTheorems.value = cost;
  vm.handleClick();
  vm.update();
  assert.match(vm.getMainInfosTooltip, /Completed/);
  assert.equal(vm.getContainerClass.completed, true);
  vm.$destroy();
});
