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
  PORTAL_START: config("PORTAL_START", { next: ["SINK"] }),
  SINK: config("SINK", { type: "sink", cost: undefined, target: "FLOAT", previous: ["PORTAL_START"] }),
  FLOAT: config("FLOAT", {
    type: "float", cost: undefined, target: "SINK", depth: "1", position: [3, -2], next: ["DEST"],
  }),
  DEST: config("DEST", { depth: "1", previous: ["FLOAT"], next: ["FURTHER"] }),
  FURTHER: config("FURTHER", { depth: "1", previous: ["DEST"] }),
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
    const resolved = (name.startsWith("@/") ? path.resolve(root, name.slice(2))
      : path.resolve(path.dirname(filename), name)).replace(/\.js$/u, "");
    if (resolved === path.join(root, "core/constants")) return { DC };
    if (resolved === path.join(root, "core/globals")) {
      return { AbyssResearchHelperTools: global.AbyssResearchHelperTools };
    }
    if (resolved === path.join(root, "core/utils")) {
      return loadSource(path.join(root, "core/game-mechanics/game-mechanic.js"));
    }
    if (resolved === path.join(root, "core/_MOD/abyss/abyss-researches/abyssResearchSpawner")) {
      return { ...loadSource(`${resolved}.js`),
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
  "Past-Present": config("Past-Present", { ...depth1["Past-Present"], depth: "0", next: [], previous: [] }),
  "Present-Future": config("Present-Future", { ...depth1["Present-Future"], depth: "0", next: [], previous: [] }),
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
global.AbyssResearchHelperTools = helper;
global.getEffectiveSpace = () => new Decimal(0);
const { tabs } = loadSource(path.join(root, "core/secret-formula/tabs.js"));

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
    abyssResearchCanvas: { currentAbyssResearchDepth: "0" },
    abyssResearchTooltipsShown: new Set(),
    space: new Decimal(0),
    records: { thisReality: { maxSpace: new Decimal(0), maxEffectiveSpace: new Decimal(0) } },
    timestudy: { theorem: new Decimal(100), maxTheorem: new Decimal(100) },
    reality: { perkPoints: new Decimal(10) },
  };
});

test("unlocking either portal end unlocks its partner and neighboring research without recursive loops", () => {
  for (const first of ["SINK", "FLOAT"]) {
    for (const id of ["SINK", "FLOAT", "DEST", "FURTHER"]) {
      Object.assign(player.abyssResearches[id], { unlocked: false, shown: false });
    }
    researches[first].unlock();
    assert.equal(researches.SINK.unlocked, true);
    assert.equal(researches.FLOAT.unlocked, true);
    assert.equal(researches.DEST.unlocked, true);
    assert.equal(researches.FURTHER.unlocked, false);
    assert.equal(player.abyssResearches.FURTHER.shown, true);
  }
});

test("research completion propagates through portals to another depth", () => {
  for (const id of ["SINK", "FLOAT", "DEST", "FURTHER"]) {
    Object.assign(player.abyssResearches[id], { unlocked: false, shown: false });
  }
  researches.PORTAL_START.addProgress(new Decimal(100));
  assert.equal(researches.FLOAT.unlocked, true);
  assert.equal(researches.DEST.unlocked, true);
  assert.equal(researches.FURTHER.unlocked, false);
  // Loading a save with one end unlocked restores the same graph through normal status updates.
  player.abyssResearches.FLOAT.unlocked = false;
  researches.SINK.updateCompletionWithCondition();
  assert.equal(researches.FLOAT.unlocked, true);
});

test("portal navigation works both ways with a full queue and never starts research", () => {
  player.activeAbyssResearches.add("SINGLE");
  player.abyssResearches.SINK.unlocked = false;
  assert.equal(researches.SINK.click(), undefined);
  assert.equal(player.abyssResearchCanvas.currentAbyssResearchDepth, "0");
  researches.SINK.unlock();
  assert.equal(researches.SINK.click(), researches.FLOAT);
  assert.equal(player.abyssResearchCanvas.currentAbyssResearchDepth, "1");
  assert.equal(researches.FLOAT.click(), researches.SINK);
  assert.equal(player.abyssResearchCanvas.currentAbyssResearchDepth, "0");
  for (const node of [researches.SINK, researches.FLOAT]) {
    node.start();
    node.addProgress(new Decimal(100));
    assert.equal(node.canResearch, false);
    assert.equal(node.isAutoResearching, false);
    assert.equal(node.completed, false);
    assert.equal(node.percentage, 0);
    assert.ok(node.progress.eq(0));
  }
  assert.deepEqual([...player.activeAbyssResearches], ["SINGLE"]);
});

test("portal configs reject missing, same-type and non-reciprocal targets", () => {
  const { validateAbyssPortalTargets, NODE_TYPE } = loadSource(
    path.join(root, "core/_MOD/abyss/abyss-researches/abyssResearchSpawner.js")
  );
  const pair = {
    S: { type: NODE_TYPE.SINK, target: "F" },
    F: { type: NODE_TYPE.FLOAT, target: "S" },
  };
  assert.doesNotThrow(() => validateAbyssPortalTargets(pair));
  assert.throws(() => validateAbyssPortalTargets({ S: pair.S }), /must target/u);
  assert.throws(() => validateAbyssPortalTargets({ ...pair, F: { type: "sink", target: "S" } }), /must target/u);
  assert.throws(() => validateAbyssPortalTargets({ ...pair, F: { type: "float", target: "OTHER" } }), /must target/u);
});

test("portal navigation centers the destination at different zooms and stops dragging", () => {
  global.Vector = class {
    constructor(x, y) { this.x = x; this.y = y; }
  };
  const component = loadSource(path.join(root, "components/tabs/_MOD/abyss/AbyssResearchTab.vue")).default;
  for (const zoom of [0.33, 1, 3]) {
    const view = {
      depth: "0", zoomLevel: zoom, isDragging: true,
      $refs: { canvasContainer: { getBoundingClientRect: () => ({ width: 1200, height: 700 }) } },
      get getCurrentNodes() { return researches.all.filter(node => node.depth === this.depth).map(node => node.id); },
      endDrag: component.methods.endDrag,
      updateCanvasTransform: component.methods.updateCanvasTransform,
    };
    const originalOffset = { x: 120, y: -80 };
    view.offset = originalOffset;
    component.methods.navigateToNode.call(view, researches.FLOAT);
    assert.equal(view.depth, "1");
    assert.equal(view.offset, originalOffset);
    component.methods.navigateToNode.call(view, researches.SINK, false);
    assert.equal(view.depth, "0");
    assert.equal(view.offset, originalOffset);
    component.methods.navigateToNode.call(view, researches.FLOAT, true);
    assert.equal(view.depth, "1");
    assert.equal(view.isDragging, false);
    assert.equal(view.zoomLevel, zoom);
    assert.equal(view.offset.x + (researches.FLOAT.x - 5000) * zoom, 600);
    assert.equal(view.offset.y + (researches.FLOAT.y - 5000) * zoom, 350);
    assert.ok(view.shownNodes.includes("FLOAT"));
    component.watch.offset.call(view, view.offset);
    assert.equal(player.abyssResearchCanvas.offsetX, view.offset.x);
    assert.equal(player.abyssResearchCanvas.offsetY, view.offset.y);
  }
});

test("portal visuals reverse for float nodes and clicks forward their navigation destination", () => {
  const component = loadSource(path.join(root, "components/tabs/_MOD/abyss/AbyssResearchNode.vue")).default;
  for (const id of ["SINK", "FLOAT"]) {
    const view = new (Vue.extend(component))({ propsData: { id } });
    view.update();
    assert.equal(view.hasProgress, false);
    assert.doesNotMatch(view.getMainInfosTooltip, /Progress:|Forever/u);
    assert.equal(view.sinkAnimationStyle(1)["animation-direction"], id === "FLOAT" ? "reverse" : "normal");
    let destination, centerView;
    view.$on("navigate", (node, center) => { destination = node; centerView = center; });
    view.handleClick();
    assert.equal(destination, researches[researches[id].target]);
    assert.equal(centerView, false);
    researches[id].config.centerView = true;
    try {
      view.handleClick();
      assert.equal(centerView, true);
    } finally {
      delete researches[id].config.centerView;
    }
    view.$destroy();
  }
});

test("portal destinations unlock their depth in the page selector", () => {
  const component = loadSource(path.join(root, "components/tabs/_MOD/abyss/AbyssResearchPageSelector.vue")).default;
  player.abyssResearches.SINK.unlocked = false;
  player.abyssResearches.FLOAT.unlocked = false;
  const view = new (Vue.extend(component))({ propsData: { depth: "0" } });
  view.update();
  assert.deepEqual(view.unlockedDepthsList, ["0"]);
  researches.SINK.unlock();
  view.update();
  assert.deepEqual(view.unlockedDepthsList, ["0", "1"]);
  researches.C0.level = DC.D1;
  view.update();
  assert.deepEqual(view.unlockedDepthsList, ["1"]);
  view.$destroy();
});

test("depth conditions prioritize force-disable and use the unlocked portal's destination", () => {
  const { isAbyssDepthUnlocked } = loadSource(
    path.join(root, "core/_MOD/abyss/abyss-researches/abyssResearchSpawner.js")
  );
  player.abyssResearches.FLOAT.unlocked = false;
  // Only the source needs to be unlocked to expose its destination's option.
  assert.equal(isAbyssDepthUnlocked("1"), true);
  assert.equal(isAbyssDepthUnlocked("0"), true);
  player.abyssResearches.SINK.unlocked = false;
  assert.equal(isAbyssDepthUnlocked("1"), false);
  assert.equal(isAbyssDepthUnlocked("2"), false);
  assert.equal(isAbyssDepthUnlocked("unknown"), false);
  // Force-unlock works without any unlocked portals.
  researches.C0.level = DC.D1;
  assert.equal(isAbyssDepthUnlocked("0"), false);
  assert.equal(isAbyssDepthUnlocked("1"), true);
  // Force-disable also overrides a valid unlocked incoming float node.
  player.abyssResearches.FLOAT.unlocked = true;
  assert.equal(isAbyssDepthUnlocked("0"), false);
  researches.C0.level = DC.D0;
  assert.equal(isAbyssDepthUnlocked("0"), true);
  // A depth with neither override becomes available through an incoming portal.
  const previousDepth = researches.FLOAT.depth;
  try {
    researches.FLOAT.depth = "2";
    player.abyssResearches.SINK.unlocked = true;
    assert.equal(isAbyssDepthUnlocked("2"), true);
  } finally {
    researches.FLOAT.depth = previousDepth;
  }
});

test("PST unlocks Past-Present even when its portal visits the node first by a longer path", () => {
  const previousNext = researches.PST.next;
  const previousPortalLinks = researches.SINK.previous;
  try {
    // Match PST's config order: a portal first, followed by the ordinary research.
    researches.PST.next = ["SINK", "Past-Present"];
    researches.SINK.previous = ["PST"];
    for (const id of ["SINK", "FLOAT", "Past-Present"]) {
      Object.assign(player.abyssResearches[id], { unlocked: false, shown: false });
    }
    assert.equal(researches.PST.purchase(), true);
    assert.equal(researches["Past-Present"].unlocked, true);
    assert.equal(researches["Past-Present"].canResearch, true);
    player.abyssResearches["Past-Present"].unlocked = false;
    researches.PST.updateCompletionWithCondition();
    assert.equal(researches["Past-Present"].unlocked, true);
  } finally {
    researches.PST.next = previousNext;
    researches.SINK.previous = previousPortalLinks;
  }
});

test("Past-Present adds a concurrent research slot and stacks with both existing upgrades", () => {
  player.activeAbyssResearches.add("SINGLE");
  assert.equal(researches.NEXT.maxConcurrent, 1);
  researches.NEXT.unlock();
  assert.equal(researches.NEXT.canResearch, false);
  researches["Past-Present"].addProgress(depth1["Past-Present"].cost);
  assert.equal(researches.NEXT.maxConcurrent, 2);
  assert.equal(researches.NEXT.canResearch, true);
  researches.A6.level = DC.D1;
  researches.A6B.level = DC.D1;
  assert.equal(researches.NEXT.maxConcurrent, 4);
  researches["Past-Present"].reset();
  assert.equal(researches.NEXT.maxConcurrent, 3);
});

test("Present-Future unlocks existing advanced Eternity modes independently of Reality upgrade 13", () => {
  const { EternityAutobuyerState } = loadSource(path.join(root, "core/autobuyers/eternity-autobuyer.js"));
  const autobuyer = new EternityAutobuyerState();
  let realityUpgradeBought = false;
  global.RealityUpgrade = id => ({ isBought: id === 13 && realityUpgradeBought });
  assert.equal(autobuyer.hasAdditionalModes, false);
  researches["Present-Future"].addProgress(depth1["Present-Future"].cost);
  assert.equal(autobuyer.hasAdditionalModes, true);
  researches["Present-Future"].reset();
  assert.equal(autobuyer.hasAdditionalModes, false);
  realityUpgradeBought = true;
  assert.equal(autobuyer.hasAdditionalModes, true);
});

test("Empower subtabs are unlocked by their corresponding Abyss Research", t => {
  const empowerTabs = tabs.find(tab => tab.key === "eternity").subtabs
    .filter(tab => ["past", "present", "future"].includes(tab.key));
  const temporaryResearches = ["PRS", "FTR"];
  for (const id of temporaryResearches) researches[id] = { completed: false };
  t.after(() => temporaryResearches.forEach(id => delete researches[id]));

  assert.deepEqual(empowerTabs.map(tab => tab.condition()), [false, false, false]);
  researches.PST.level = DC.D1;
  assert.deepEqual(empowerTabs.map(tab => tab.condition()), [true, false, false]);
  researches.PRS.completed = true;
  assert.deepEqual(empowerTabs.map(tab => tab.condition()), [true, true, false]);
  researches.FTR.completed = true;
  assert.deepEqual(empowerTabs.map(tab => tab.condition()), [true, true, true]);
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
  assert.equal(researches.PST.cost.timeTheorems, 75);
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
