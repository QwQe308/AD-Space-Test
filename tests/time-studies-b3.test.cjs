/* eslint-env node */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const { beforeEach, test } = require("node:test");
const { transformSync } = require("@babel/core");
const { parseComponent, compile } = require("vue-template-compiler");
const Decimal = require("break_eternity.js");

global.Decimal = Decimal;
global.window = global;
global.document = {
  createElement: () => ({ style: {}, setAttribute() {} }),
  body: { appendChild() {} },
};
global.formatInt = String;
global.mapGameData = (data, create) => {
  const result = [];
  for (const config of data) result[config.id] = create(config);
  return result;
};
const Currency = { timeTheorems: {
  get value() { return player.timestudy.theorem; },
  gte(cost) { return this.value.gte(cost); },
  subtract(cost) { player.timestudy.theorem = this.value.sub(cost); },
  add(cost) { player.timestudy.theorem = this.value.add(cost); },
} };
global.Currency = Currency;

const root = path.resolve(__dirname, "../src");
const modules = new Map();
function load(relative) {
  const filename = path.join(root, relative);
  if (modules.has(filename)) return modules.get(filename).exports;
  const loaded = new Module(filename, module);
  modules.set(filename, loaded);
  loaded.require = name => {
    if (name.startsWith("@/components") || name === "./TimeStudyButton") return {};
    if (!name.startsWith(".")) return require(name);
    const resolved = path.resolve(path.dirname(filename), name).replace(/\.js$/, "");
    if (resolved === path.join(root, "env")) return { DEV: false };
    if (resolved === path.join(root, "core/currency")) return { Currency };
    if (resolved === path.join(root, "core/game-mechanics")) return load("core/game-mechanics/game-mechanic.js");
    if (resolved.endsWith(path.join("infinity", "infinity-upgrades"))) return { dimInfinityMult: () => new Decimal(1) };
    return load(path.relative(root, `${resolved}.js`));
  };
  const source = fs.readFileSync(filename, "utf8");
  const component = filename.endsWith(".vue") ? parseComponent(source) : null;
  if (component) assert.deepEqual(compile(component.template.content).errors, []);
  loaded._compile(transformSync(component ? component.script.content : source, {
    configFile: false, babelrc: false, plugins: ["@babel/plugin-transform-modules-commonjs"],
  }).code, filename);
  return loaded.exports;
}
load("core/constants.js");
load("core/extensions.js");
const originalInterval = global.setInterval;
let normal;
try {
  global.setInterval = () => 0;
  normal = load("core/secret-formula/eternity/time-studies/normal-time-studies.js").normalTimeStudies;
} finally {
  global.setInterval = originalInterval;
}
global.GameDatabase = { eternity: { timeStudies: {
  normal,
  ec: load("core/secret-formula/eternity/time-studies/ec-time-studies.js").ecTimeStudies,
  dilation: load("core/secret-formula/eternity/time-studies/dilation-time-studies.js").dilationTimeStudies,
} } };
const { TimeStudy, NormalTimeStudyState, NormalTimeStudies } = load("core/time-studies/normal-time-study.js");
Object.assign(global, { TimeStudy, NormalTimeStudyState, NormalTimeStudies });
Object.assign(global, load("core/time-studies/ec-time-study.js"));
load("core/time-studies/dilation-time-study.js");
const { TimeStudyTree } = load("core/time-studies/time-study-tree.js");
global.TimeStudyTree = TimeStudyTree;
const { TimeTheorems } = load("core/time-theorems.js");
global.TimeTheorems = TimeTheorems;
const { respecTimeStudies, buyStudiesUntil } = load("core/time-studies/time-studies.js");
global.buyStudiesUntil = buyStudiesUntil;
const { B3 } = load("core/_MOD/abyss/abyss-researches/configs/abyss-research-depth-1.js").AbyssResearchesDepth1;
const button = load("components/tabs/time-studies/TimeStudyButton.vue").default;
const beforeSplit = [11, 21, 31, 41, 51, 61];
const paths = [[71, 81, 91, 101], [72, 82, 92, 102], [73, 83, 93, 103]];

beforeEach(() => {
  global.player = {
    timestudy: { theorem: new Decimal(0), studies: [], preferredPaths: [[1, 2], 0] },
    options: { breakPlaceHolder: false, testServer: true },
    challenge: { eternity: { unlocked: 0, current: 0 } },
    celestials: { v: { STSpent: 0 }, enslaved: { hasSecretStudy: false } },
    dilation: { studies: [] },
    requirementChecks: { reality: { maxStudies: 0 } },
  };
  global.AbyssResearches = { B3: { isEffectActive: false } };
  global.DilationUpgrade = { timeStudySplit: { isBought: false } };
  global.Perk = { studyECRequirement: { isBought: false } };
  global.EternityChallenge = id => ({ isUnlocked: player.challenge.eternity.unlocked === id });
  global.ImaginaryUpgrade = () => ({ isLockingMechanics: false });
  global.GameEnd = { creditsEverClosed: false };
  global.Pelle = { isDoomed: false, isDisabled: () => false, uselessTimeStudies: [] };
  global.Enslaved = { isRunning: false };
  global.V = { spaceTheorems: 0, availableST: 0 };
  global.VUnlocks = { raUnlock: { effectOrDefault: () => 0, canBeApplied: false } };
  global.Ra = { unlocks: { unlockHardV: { canBeApplied: false } } };
  global.PlayerProgress = { imaginaryUnlocked: () => true, realityUnlocked: () => false };
  let cachedTree;
  global.GameCache = {
    timeStudies: {
      get value() { return Object.fromEntries(player.timestudy.studies.map(id => [id, true])); },
      invalidate() {},
    },
    currentStudyTree: {
      get value() { return cachedTree ??= new TimeStudyTree(TimeStudyTree.currentStudies); },
      invalidate() { cachedTree = undefined; },
    },
  };
});

function activateB3() {
  B3.onLevelUp();
  AbyssResearches.B3.isEffectActive = true;
}

test("B3 only makes normal studies through 111 free and refreshes displayed prices", () => {
  assert.ok(TimeStudy(11).cost.eq(1));
  const vm = { ...button.data(), study: TimeStudy(11) };
  button.methods.update.call(vm);
  assert.ok(button.computed.config.call(vm).cost.eq(1));
  activateB3();
  for (const study of NormalTimeStudyState.all) {
    assert.ok(study.cost.eq(study.id <= 111 ? 0 : study.config.cost), `TS ${study.id}`);
  }
  assert.ok(TimeStudy.eternityChallenge(1).cost.eq(30));
  assert.ok(TimeStudy.dilation.cost.eq(5000));
  assert.ok(TimeStudy.timeDimension(5).cost.eq("1e6"));
  button.methods.update.call(vm);
  assert.ok(button.computed.config.call(vm).cost.eq(0));
  assert.equal(TimeStudy(11).purchase(), true);
  assert.ok(Currency.timeTheorems.value.eq(0));
  assert.equal(TimeStudy(11).purchase(), false);
});

test("B3 permits two complete dimension paths with zero TT but not a third", () => {
  activateB3();
  assert.equal(TimeStudy(81).purchase(), false);
  TimeStudyTree.commitToGameState([...beforeSplit, ...paths[0], ...paths[1], ...paths[2]]);
  assert.deepEqual(player.timestudy.studies, [...beforeSplit, ...paths[0], ...paths[1]]);
  assert.ok(Currency.timeTheorems.value.eq(0));
  assert.equal(TimeStudy.preferredPaths.dimension.usePriority, true);
  const tree = new TimeStudyTree(`${beforeSplit},${paths[0]},${paths[1]},${paths[2]}|0`);
  assert.deepEqual(tree.purchasedStudies.map(s => s.id), player.timestudy.studies);
  assert.ok(tree.spentTheorems[0].eq(0));
});

test("B3 refreshes an existing tree and stacks with TS201 up to three paths", () => {
  player.timestudy.studies = [...beforeSplit, ...paths[0]];
  assert.equal(GameCache.currentStudyTree.value.allowedDimPathCount, 1);
  assert.equal(TimeStudy(72).canBeBought, false);
  activateB3();
  assert.equal(TimeStudy(72).purchase(), true);
  const tree = new TimeStudyTree();
  tree.purchasedStudies.push(TimeStudy(201));
  assert.equal(tree.allowedDimPathCount, 3);
  DilationUpgrade.timeStudySplit.isBought = true;
  assert.equal(tree.allowedDimPathCount, 3);
  AbyssResearches.B3.isEffectActive = false;
  DilationUpgrade.timeStudySplit.isBought = false;
  assert.equal(tree.allowedDimPathCount, 2);
});

test("B3 preserves EC path exclusions and the post-111 content gate", () => {
  activateB3();
  player.timestudy.studies = beforeSplit.slice();
  player.challenge.eternity.unlocked = 11;
  assert.equal(TimeStudy(73).purchase(), false);
  assert.equal(TimeStudy(71).purchase(), true);
  assert.equal(TimeStudy(121).canBeBought, false);
});

test("shift buying uses both preferred dimension paths with B3", () => {
  activateB3();
  TimeStudy(111).purchaseUntil();
  assert.ok([...paths[0], ...paths[1], 111].every(id => TimeStudy(id).isBought));
  assert.ok(paths[2].every(id => !TimeStudy(id).isBought));
  assert.ok(Currency.timeTheorems.value.eq(0));
});

test("respec cannot create TT from free studies or subtract the old TS111 cost", () => {
  activateB3();
  TimeStudyTree.commitToGameState([...beforeSplit, ...paths[0], ...paths[1], 111]);
  assert.ok(TimeTheorems.calculateTimeStudiesCost().eq(0));
  respecTimeStudies(true);
  assert.deepEqual(player.timestudy.studies, [111]);
  assert.ok(Currency.timeTheorems.value.eq(0));
  assert.ok(TimeTheorems.calculateTimeStudiesCost().eq(0));
  player.options.breakPlaceHolder = true;
  player.timestudy.theorem = new Decimal(9);
  assert.equal(TimeStudy(121).purchase(), true);
  assert.ok(TimeTheorems.calculateTimeStudiesCost().eq(9));
  respecTimeStudies(true);
  assert.ok(Currency.timeTheorems.value.eq(9));
});

test("virtual tree budgets use effective prices and reject unaffordable paid studies", () => {
  const tree = new TimeStudyTree();
  tree.attemptBuyArray([11], true);
  assert.equal(tree.purchasedStudies.length, 0);
  activateB3();
  tree.attemptBuyArray([11], true);
  assert.deepEqual(tree.purchasedStudies, [TimeStudy(11)]);
  tree.purchasedStudies.push(TimeStudy(111));
  tree.attemptBuyArray([121], true);
  assert.equal(tree.purchasedStudies.includes(TimeStudy(121)), false);
});
