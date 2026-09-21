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
let Currency;

const root = path.resolve(__dirname, "../src");
const modules = new Map();
function load(relative) {
  const filename = path.join(root, relative);
  if (modules.has(filename)) return modules.get(filename).exports;
  const loaded = new Module(filename, module);
  modules.set(filename, loaded);
  loaded.require = name => {
    if (name.startsWith("@/components") || name === "./TimeStudyButton") return {};
    if (name === "@/utility/deepmerge") return load("utility/deepmerge.js");
    if (!name.startsWith(".")) return require(name);
    const resolved = path.resolve(path.dirname(filename), name).replace(/\.js$/, "");
    if (resolved === path.join(root, "env")) return { DEV: false };
    if (resolved === path.join(root, "core/currency")) return { Currency };
    if (resolved === path.join(root, "core/game-mechanics")) return load("core/game-mechanics/game-mechanic.js");
    if (resolved === path.join(root, "core/utils")) return load("core/game-mechanics/game-mechanic.js");
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
Currency = load("core/currency.js").Currency;
global.Currency = Currency;
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
GameDatabase.challenges = {
  eternity: load("core/secret-formula/challenges/eternity-challenges.js").eternityChallenges,
  abyssEternity: load("core/secret-formula/challenges/eternity-challenges-abyss.js").abyssEternityChallenges,
};
const { TimeStudy, NormalTimeStudyState, NormalTimeStudies } = load("core/time-studies/normal-time-study.js");
Object.assign(global, { TimeStudy, NormalTimeStudyState, NormalTimeStudies });
Object.assign(global, load("core/time-studies/ec-time-study.js"));
load("core/time-studies/dilation-time-study.js");
const { TimeStudyTree } = load("core/time-studies/time-study-tree.js");
global.TimeStudyTree = TimeStudyTree;
const { TimeTheorems, TimeTheoremPurchaseType } = load("core/time-theorems.js");
global.TimeTheorems = TimeTheorems;
global.TimeTheoremPurchaseType = TimeTheoremPurchaseType;
const { respecTimeStudies, buyStudiesUntil } = load("core/time-studies/time-studies.js");
global.buyStudiesUntil = buyStudiesUntil;
global.respecTimeStudies = respecTimeStudies;
const {
  AbyssEternityChallenge: configuredAbyssEternityChallenge,
  EternityChallenge: configuredEternityChallenge,
  EternityChallenges: configuredEternityChallenges,
} = load("core/eternity-challenge.js");
global.EternityChallenges = configuredEternityChallenges;
const depth1 = load("core/_MOD/abyss/abyss-researches/configs/abyss-research-depth-1.js").AbyssResearchesDepth1;
const { B3 } = depth1;
GameDatabase.space = { abyssResearches: depth1 };
global.mapGameDataToObject = (configs, create) => {
  const states = Object.fromEntries(Object.entries(configs).map(([id, config]) => [id, create(config)]));
  return { ...states, all: Object.values(states) };
};
const researches = load("core/_MOD/abyss/abyss-researches/abyssResearch.js").AbyssResearches;
const button = load("components/tabs/time-studies/TimeStudyButton.vue").default;
const sidebarTotal = load("core/secret-formula/sidebar-resources.js").sidebarResources.find(resource => resource.id === 6);
const beforeSplit = [11, 21, 31, 41, 51, 61];
const paths = [[71, 81, 91, 101], [72, 82, 92, 102], [73, 83, 93, 103]];

beforeEach(() => {
  global.player = {
    timestudy: { theorem: new Decimal(0), studies: [], preferredPaths: [[1, 2], 0], corruptionTTSpent: null },
    abyssResearches: Object.fromEntries(researches.all.map(research => [research.id, {
      level: new Decimal(0), progress: new Decimal(0), unlocked: true, shown: true,
    }])),
    abyssResearchTooltipsShown: new Set(),
    options: { breakPlaceHolder: false, testServer: true },
    challenge: { eternity: {
      unlocked: 0,
      unlockedType: "normal",
      current: 0,
      currentType: "normal",
      requirementBits: 0,
      abyssRequirementBits: 0,
    } },
    eternityChalls: {},
    reality: { unlockedEC: 0, unlockedAbyssEC: 0 },
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
  vm.showCost = true;
  vm.showStCost = false;
  vm.STCost = 0;
  vm.setup = { isSmall: false };
  vm.doomedRealityStudy = false;
  assert.equal(button.computed.showDefaultCostDisplay.call(vm), true);
  activateB3();
  for (const study of NormalTimeStudyState.all) {
    assert.ok(study.cost.eq(study.id <= 111 ? 0 : study.config.cost), `TS ${study.id}`);
  }
  assert.ok(TimeStudy.eternityChallenge(1).cost.eq(30));
  assert.ok(TimeStudy.dilation.cost.eq(5000));
  assert.ok(TimeStudy.timeDimension(5).cost.eq("1e6"));
  button.methods.update.call(vm);
  assert.ok(button.computed.config.call(vm).cost.eq(0));
  assert.equal(button.computed.showDefaultCostDisplay.call(vm), false);
  const freeConfig = button.computed.config.call(vm);
  assert.equal(button.computed.customCostStr.call({ ...vm, config: freeConfig }), "");
  assert.equal(button.computed.showCustomCostDisplay.call({
    customCostStr: "", doomedRealityStudy: false, isDisabledByEnslaved: false,
  }), false);
  assert.equal(button.computed.customCostStr.call({
    ...vm, config: freeConfig, setup: { isSmall: true }, showStCost: true, STCost: 2,
  }), "2 ST");
  assert.equal(TimeStudy(11).purchase(), true);
  assert.ok(Currency.timeTheorems.value.eq(0));
  assert.equal(TimeStudy(11).purchase(), false);
});

test("normal and Abyss EC5 keep independent unlocks, runs, completions, and rewards", () => {
  const normal = configuredEternityChallenge(5);
  const abyss = configuredAbyssEternityChallenge(5);
  const normalDescription = normal.config.description();
  assert.match(normalDescription, /Galaxy cost increase/u);
  assert.equal(Boolean(TimeStudy(111).isBought), false);
  assert.equal(normal.isAvailable, true);
  normal.unlock();
  normal.hasUnlocked = true;
  normal.markRequirementMet();
  normal.completions = 3;
  player.challenge.eternity.current = 5;
  assert.equal(normal.isUnlocked, true);
  assert.equal(normal.isRunning, true);
  assert.equal(normal.reward.canBeApplied, true);
  assert.equal(abyss.completions, 0);

  player.timestudy.studies.push(111);
  assert.equal(normal.isAvailable, false);
  assert.equal(normal.isUnlocked, false);
  assert.equal(normal.isRunning, false);
  assert.equal(normal.reward.canBeApplied, false);
  assert.equal(abyss.isAvailable, true);
  assert.equal(abyss.isUnlocked, false);
  assert.equal(abyss.isRunning, false);
  assert.equal(configuredEternityChallenges.current, undefined);
  assert.match(abyss.config.description(), /continuum works as if you have only 10 AM/u);
  assert.equal(abyss, configuredEternityChallenges.all.find(challenge => challenge.id === 5));

  abyss.unlock();
  abyss.hasUnlocked = true;
  abyss.markRequirementMet();
  abyss.completions = 2;
  player.challenge.eternity.currentType = "abyss";
  assert.equal(abyss.isUnlocked, true);
  assert.equal(abyss.isRunning, true);
  assert.equal(abyss.reward.canBeApplied, true);
  assert.equal(configuredEternityChallenges.current, abyss);
  assert.equal(normal.completions, 3);
  assert.equal(abyss.completions, 2);
  assert.equal(player.eternityChalls.eterc5, 3);
  assert.equal(player.eternityChalls.abyssEterc5, 2);
  assert.equal(player.reality.unlockedEC, 1 << 5);
  assert.equal(player.reality.unlockedAbyssEC, 1 << 5);
  assert.equal(player.challenge.eternity.requirementBits, 1 << 5);
  assert.equal(player.challenge.eternity.abyssRequirementBits, 1 << 5);
  normal.clearRequirement();
  player.reality.unlockedEC = 0;
  assert.equal(abyss.hasUnlocked, true);
  assert.equal(abyss.wasRequirementPreviouslyMet, true);

  player.options.breakPlaceHolder = true;
  assert.equal(configuredEternityChallenges.forStudy(5), normal);
  assert.equal(normal.config.description(), normalDescription);
  assert.equal(abyss.isRunning, false);
});

test("B3 makes EC5 free while preserving its requirements and zero-cost refund", () => {
  const ec5 = TimeStudy.eternityChallenge(5);
  assert.ok(ec5.cost.eq(130));
  activateB3();
  for (const study of ECTimeStudyState.studies.filter(Boolean)) {
    assert.ok(study.cost.eq(study.id === 5 ? 0 : study.config.cost));
  }
  global.ui = { lastClickTime: 0 };
  global.EternityChallenge = () => ({ completions: 0 });
  player.galaxies = new Decimal(174);
  assert.equal(ec5.purchase(true), false);
  TimeStudyTree.commitToGameState([11, 22, 32, 42]);
  assert.equal(ec5.purchase(true), false);
  player.galaxies = new Decimal(175);
  const tree = new TimeStudyTree("11,22,32,42|5");
  assert.equal(tree.ec, 5);
  assert.ok(tree.spentTheorems[0].eq(0));
  assert.equal(ec5.purchase(true), true);
  assert.ok(Currency.timeTheorems.value.eq(0));
  assert.ok(TimeTheorems.calculateTimeStudiesCost().eq(0));
  respecTimeStudies(true);
  assert.equal(player.challenge.eternity.unlocked, 0);
  assert.ok(Currency.timeTheorems.value.eq(0));
  AbyssResearches.B3.isEffectActive = false;
  assert.ok(ec5.cost.eq(130));
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

test("buying B3 refunds discounted studies and EC5 once while preserving Corruption spending", () => {
  global.AbyssResearches = researches;
  global.ui = { lastClickTime: 0 };
  global.EternityChallenge = () => ({ completions: 0 });
  player.galaxies = new Decimal(175);
  Currency.timeTheorems.value = new Decimal(1000);
  TimeStudyTree.commitToGameState([11, 22, 32, 42]);
  assert.equal(TimeStudy.eternityChallenge(5).purchase(true), true);
  const invested = TimeTheorems.calculateTimeStudiesCost();
  const balance = Currency.timeTheorems.value;
  const total = Currency.timeTheorems.max;
  assert.equal(researches.B3.purchase(), true);
  assert.ok(Currency.timeTheorems.value.eq(balance.sub(50).add(invested)));
  assert.ok(Currency.timeTheorems.max.eq(total));
  assert.ok(player.timestudy.maxTheorem.eq(total));
  assert.ok(TimeTheorems.corruptionTTSpent.eq(50));
  assert.equal(researches.B3.purchase(), false);
  respecTimeStudies(true);
  assert.ok(Currency.timeTheorems.value.eq(950));
  assert.ok(Currency.timeTheorems.max.eq(1000));
  for (const [id, spent] of [["FTR", 150], ["PST", 300], ["PRS", 500]]) {
    assert.equal(researches[id].purchase(), true);
    assert.ok(TimeTheorems.corruptionTTSpent.eq(spent));
    assert.ok(Currency.timeTheorems.value.eq(1000 - spent));
    assert.ok(Currency.timeTheorems.max.eq(1000));
    assert.ok(sidebarTotal.value().eq(1000));
    respecTimeStudies(true);
    assert.ok(Currency.timeTheorems.value.eq(1000 - spent));
  }
  Currency.timeTheorems.add(7);
  assert.ok(Currency.timeTheorems.max.eq(1007));
  assert.ok(player.timestudy.maxTheorem.eq(1007));
});

test("an unaffordable B3 purchase grants neither a refund nor Corruption credit", () => {
  global.AbyssResearches = researches;
  player.timestudy.studies = [11, 111];
  Currency.timeTheorems.value = new Decimal(49);
  assert.equal(researches.B3.purchase(), false);
  assert.ok(Currency.timeTheorems.value.eq(49));
  assert.ok(TimeTheorems.corruptionTTSpent.eq(0));
  assert.equal(researches.B3.completed, false);
});

test("B3 also refunds owned TS111 but leaves later studies and other ECs paid", () => {
  global.AbyssResearches = researches;
  player.timestudy.studies = [11, 111, 121];
  player.challenge.eternity.unlocked = 1;
  Currency.timeTheorems.value = new Decimal(100);
  assert.equal(researches.B3.purchase(), true);
  assert.ok(Currency.timeTheorems.value.eq(81));
  assert.deepEqual(player.timestudy.studies, [11, 111, 121]);
  assert.equal(player.challenge.eternity.unlocked, 1);
  assert.ok(TimeTheorems.calculateTimeStudiesCost().eq(39));
  respecTimeStudies(true);
  assert.ok(Currency.timeTheorems.value.eq(120));
  assert.ok(Currency.timeTheorems.max.eq(170));
  respecTimeStudies(true);
  assert.ok(Currency.timeTheorems.value.eq(120));
});

test("Corruption totals persist across saving and cannot fund a tree import", () => {
  activateB3();
  player.timestudy.studies = [111];
  player.timestudy.corruptionTTSpent = new Decimal(500);
  player.timestudy = JSON.parse(JSON.stringify(player.timestudy));
  player.timestudy.theorem = new Decimal(player.timestudy.theorem);
  assert.ok(Currency.timeTheorems.max.eq(500));
  const tree = new TimeStudyTree();
  tree.purchasedStudies.push(TimeStudy(111));
  tree.attemptBuyArray([121], true);
  assert.equal(tree.purchasedStudies.includes(TimeStudy(121)), false);
  respecTimeStudies(true);
  assert.ok(Currency.timeTheorems.value.eq(0));
  assert.ok(Currency.timeTheorems.max.eq(500));
});

test("resetting TT clears Corruption accounting for the next Reality", () => {
  activateB3();
  player.timestudy.corruptionTTSpent = new Decimal(500);
  player.timestudy.theorem = new Decimal(20);
  Currency.timeTheorems.reset();
  assert.ok(Currency.timeTheorems.value.eq(0));
  assert.ok(Currency.timeTheorems.max.eq(0));
  assert.ok(TimeTheorems.corruptionTTSpent.eq(0));
});
