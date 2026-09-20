/* eslint-env node */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const { beforeEach, test } = require("node:test");
const { transformSync } = require("@babel/core");
const Decimal = require("break_eternity.js");

global.Decimal = Decimal;
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
      return { abyssDepths: [["0"]], globalAbyssResearchSpeed: () => new Decimal(0) };
    }
    if (resolved === path.join(root, "env")) return { DEV: false };
    return loadSource(`${resolved}.js`);
  };
  const { code } = transformSync(fs.readFileSync(filename, "utf8"), {
    configFile: false, babelrc: false, plugins: ["@babel/plugin-transform-modules-commonjs"],
  });
  loaded._compile(code, filename);
  return loaded.exports;
}
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
