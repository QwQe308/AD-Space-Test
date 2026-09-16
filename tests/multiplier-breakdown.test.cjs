/* eslint-env node */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const { test } = require("node:test");
const { compileFunction } = require("node:vm");

const { transformSync } = require("@babel/core");
const { parseComponent, compile } = require("vue-template-compiler");
const Vue = require("vue");
const Decimal = require("break_eternity.js");

global.Decimal = Decimal;
global.player = { options: { multiplierTab: { replacePowers: false, showAltGroup: false } } };
global.InfinityChallenge = () => ({ isCompleted: true });
global.NormalChallenge = () => ({ isRunning: false });
global.PlayerProgress = { eternityUnlocked: () => true };
global.format = value => String(value);
global.formatX = value => `x${value}`;
global.formatPow = value => `^${value}`;
global.formatPercents = value => `${Number(value) * 100}%`;
Array.repeat = (value, count) => Array(count).fill(value);
Array.range = (start, count) => Array.from({ length: count }, (_, i) => start + i);
Vue.directive("tooltip", {});

const root = path.resolve(__dirname, "..");
const stats = path.join(root, "src/components/tabs/statistics");
const DC = {
  D0: new Decimal(0), D1: new Decimal(1), D2: new Decimal(2), D5: new Decimal(5),
  E1: new Decimal(10), E100: new Decimal("1e100"), DM1: new Decimal(-1), BEMAX: new Decimal(Infinity)
};
const modules = new Map();

// Use the project's Babel/Vue compilers without adding a test framework or changing production imports.
function loadSource(filename) {
  if (modules.has(filename)) return modules.get(filename).exports;
  const loaded = new Module(filename, module);
  modules.set(filename, loaded);
  loaded.filename = filename;
  loaded.paths = module.paths;
  loaded.require = name => {
    if (name === "@/components/PrimaryToggleButton") return { render: h => h("button") };
    if (!name.startsWith(".") && !name.startsWith("@/")) return require(name);
    const resolved = name.startsWith("@/")
      ? path.join(root, "src", name.slice(2))
      : path.resolve(path.dirname(filename), name);
    if (resolved === path.join(root, "src/core/constants")) return { DC };
    if (resolved === path.join(root, "src/env")) return { DEV: false };
    if (resolved === path.join(root, "src/core/secret-formula/multiplier-tab/icons")) {
      return { MultiplierTabIcons: new Proxy({}, { get: () => () => ({}) }) };
    }
    const target = fs.existsSync(resolved) ? resolved
      : [".js", ".vue"].map(ext => resolved + ext).find(file => fs.existsSync(file));
    return loadSource(target);
  };
  const source = fs.readFileSync(filename, "utf8");
  const component = filename.endsWith(".vue") ? parseComponent(source) : null;
  const { code } = transformSync(component ? component.script.content : source, {
    configFile: false,
    babelrc: false,
    plugins: ["@babel/plugin-transform-modules-commonjs"],
  });
  loaded._compile(code, filename);
  if (component) {
    const result = compile(component.template.content);
    assert.deepEqual(result.errors, []);
    loaded.exports.default.render = compileFunction(result.render);
    loaded.exports.default.staticRenderFns = result.staticRenderFns.map(body => compileFunction(body));
  }
  return loaded.exports;
}

const { calculateBreakdownPercentages, breakdownBarLayout } = loadSource(path.join(stats, "breakdown-math.js"));
const { PercentageRollingAverage } = loadSource(path.join(stats, "percentage-rolling-average.js"));
const { beginBreakdownUpdate } = loadSource(path.join(root, "src/core/secret-formula/multiplier-tab/cache.js"));
const { createEntryInfo } = loadSource(path.join(stats, "breakdown-entry-info.js"));
const { BreakdownEntryInfoGroup } = loadSource(path.join(stats, "breakdown-entry-info-group.js"));

function entry(mult, pow = 1, options = {}) {
  return { key: "test_effect", data: { mult: new Decimal(mult), pow }, ignoresNerfPowers: false, ...options };
}

function close(actual, expected, tolerance = 1e-10) {
  assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} differs from ${expected}`);
}

test("normal and layered huge multipliers retain their relative contributions", () => {
  for (const exponent of [new Decimal(1000), new Decimal("1e400")]) {
    const result = calculateBreakdownPercentages([
      entry(Decimal.pow10(exponent)), entry(Decimal.pow10(exponent.mul(3)))
    ], Decimal.pow10(exponent.mul(4)));
    close(result.percents[0], 0.25);
    close(result.percents[1], 0.75);
    assert.equal(result.isEmpty, false);
    assert.ok(result.log10Mult instanceof Decimal);
    assert.ok(result.percents.every(value => typeof value === "number"));
  }
});

test("power contributions and nerf-exempt multipliers keep their original weights", () => {
  const powers = calculateBreakdownPercentages([entry("1e100"), entry(1, new Decimal(2))], "1e200");
  close(powers.percents[0], 0.5);
  close(powers.percents[1], 0.5);
  const nerfs = calculateBreakdownPercentages([
    entry("1e100"), entry("1e100", 1, { ignoresNerfPowers: true }), entry(1, 0.5)
  ], "1e150");
  [1 / 3, 2 / 3, -0.25].forEach((value, index) => close(nerfs.percents[index], value));
});

test("huge and tiny powers stay Decimal until normalization; tiny percentages keep their sign", () => {
  const result = calculateBreakdownPercentages([
    entry("1e1000"), entry(1, new Decimal("1e400"))
  ], Decimal.pow10(new Decimal("1e403")));
  assert.ok(result.totalPosPow.eq("1e400"));
  assert.ok(result.percents[0] > 0 && result.percents[0] < 0.001);
  close(result.percents[1], 1);
  const nerfed = calculateBreakdownPercentages([entry("1e1000"), entry(1, new Decimal("1e-400"))], 10);
  assert.deepEqual(nerfed.percents, [1, -1]);
  const base = calculateBreakdownPercentages([entry(0.1, 1, { key: "IP_base" })], 10);
  assert.equal(base.percents[0], 1);
});

test("empty totals, zero powers and identity effects never produce invalid percentages or geometry", () => {
  for (const resource of [0, 1]) {
    const result = calculateBreakdownPercentages([entry(1), entry(1, 0.5)], resource);
    assert.equal(result.isEmpty, true);
    assert.deepEqual(result.percents, [0, 0]);
  }
  assert.deepEqual(calculateBreakdownPercentages([entry(1)], 100).percents, [0]);
  const cancelled = calculateBreakdownPercentages([entry(100), entry(1, 0), entry(1, 0)], 100);
  assert.ok(cancelled.percents.every(Number.isFinite));
  const positions = breakdownBarLayout(cancelled.percents);
  assert.ok(positions.every(p => Number.isFinite(p.top) && p.height >= 0));
  close(positions.at(-1).top + positions.at(-1).height, 100);
});

test("bar prefix positions preserve positive and negative shares", () => {
  const positions = breakdownBarLayout([0.25, 0.75, -0.2]);
  [0, 20, 80].forEach((value, index) => close(positions[index].top, value));
  [20, 60, 20].forEach((value, index) => close(positions[index].height, value));
  assert.deepEqual(breakdownBarLayout([]), []);
});

test("rolling averages match a three-frame reference including missing samples and long runs", () => {
  const average = new PercentageRollingAverage();
  const history = [];
  for (let frame = 0; frame < 2000; frame++) {
    const point = frame % 7 === 0 ? undefined : [Math.sin(frame) / 2 + 0.5, -frame % 10 / 10];
    history.push(point);
    if (history.length > 3) history.shift();
    average.add(point);
    const valid = history.filter(Boolean);
    if (valid.length === 0) assert.deepEqual(average.average, []);
    else for (let i = 0; i < 2; i++) close(average.average[i], valid.reduce((sum, p) => sum + p[i], 0) / valid.length);
  }
  for (let i = 0; i < 3; i++) average.add(undefined);
  assert.deepEqual(average.average, []);
  average.add([0.2, 0.8]);
  average.add([1]);
  assert.deepEqual(average.average, [1]);
  average.clear();
  assert.deepEqual(average.average, []);
});

test("identity effects are hidden and dynamic getters run once per UI refresh", () => {
  let calls = 0;
  let mult = 1;
  global.GameDatabase = { multiplierTabValues: { cache: {
    effect: {
      isActive: true,
      multValue: () => {
        calls++;
        return mult;
      }
    }
  } } };
  beginBreakdownUpdate();
  const effect = createEntryInfo("cache_effect");
  assert.equal(effect.isVisible, false);
  effect.update();
  effect.update();
  assert.equal(effect.mult.toNumber(), 1);
  assert.equal(calls, 1);
  mult = 100;
  beginBreakdownUpdate();
  effect.update();
  assert.equal(effect.data.isVisible, true);
  assert.equal(effect.data.mult.toNumber(), 100);
  assert.equal(calls, 2);
});

test("group visibility supports numeric powers, stops early and refreshes cached results", () => {
  let active = true;
  global.GameDatabase = { multiplierTabValues: {
    group: {
      first: { isActive: () => active, powValue: 0.5 },
      second: { isActive: true, multValue: 2 },
      third: { isActive: false, multValue: () => { throw new Error("Inactive child evaluated"); } }
    },
    general: { one: { isActive: true, powValue: 2 } },
  } };
  beginBreakdownUpdate();
  const group = new BreakdownEntryInfoGroup(["group_first", "group_second", "group_third"]);
  assert.equal(group.hasVisibleEntries, true);
  active = false;
  beginBreakdownUpdate();
  assert.equal(group.hasVisibleEntries, false);
  assert.equal(new BreakdownEntryInfoGroup(["general_one"]).hasVisibleEntries, true);
});

test("Decimal snapshots avoid deep observation, preserve sources and notify Vue on replacement", async() => {
  const source = new Decimal("1e1000");
  let active = true;
  global.GameDatabase = { multiplierTabValues: { snapshot: {
    effect: { isActive: () => active, multValue: () => source, powValue: () => source },
  } } };
  const effect = createEntryInfo("snapshot_effect");
  const view = new Vue({ data: { effect: effect.data } });
  let changes = 0;
  view.$watch("effect.mult", () => changes++);
  beginBreakdownUpdate();
  effect.update();
  await Vue.nextTick();
  const previous = effect.data.mult;
  assert.equal(changes, 1);
  assert.equal(previous.__ob__, undefined);
  assert.equal(effect.data.pow.__ob__, undefined);
  assert.equal(Object.isFrozen(source), false);
  beginBreakdownUpdate();
  effect.update();
  assert.equal(effect.data.mult, previous);
  source.fromDecimal(new Decimal("1e2000"));
  beginBreakdownUpdate();
  effect.update();
  await Vue.nextTick();
  assert.equal(changes, 2);
  assert.ok(previous.eq("1e1000"));
  assert.ok(effect.data.mult.eq("1e2000"));
  active = false;
  const disappearedAt = Date.now();
  beginBreakdownUpdate();
  effect.update();
  assert.ok(effect.data.lastVisibleAt >= disappearedAt);
  assert.ok(effect.data.mult.eq(1));
  assert.equal(Object.isFrozen(DC.D1), false);
  view.$destroy();
});

test("Base AD Production shares its aggregate and active dimension count within a refresh", () => {
  let multiplierReads = 0;
  let producingReads = 0;
  const dimensions = Array.from({ length: 8 }, (value, index) => ({
    producing: true,
    totalAmount: new Decimal((index + 1) * 10),
    get isProducing() {
      producingReads++;
      return this.producing;
    },
    get multiplier() {
      multiplierReads++;
      return new Decimal(2);
    },
  }));
  global.AntimatterDimensions = { all: dimensions };
  global.AntimatterDimension = tier => dimensions[tier - 1];
  global.EternityChallenge = () => ({ isRunning: false });
  Math.clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const multiplierDirectory = path.join(root, "src/core/secret-formula/multiplier-tab");
  const { MultiplierTabHelper } = loadSource(path.join(multiplierDirectory, "helper-functions.js"));
  const { AD } = loadSource(path.join(multiplierDirectory, "antimatter-dimensions.js"));
  beginBreakdownUpdate();
  assert.equal(MultiplierTabHelper.activeDimCount("AD"), 8);
  assert.equal(MultiplierTabHelper.activeDimCount("AD"), 8);
  assert.equal(producingReads, 8);
  assert.ok(AD.total.multValue().eq(20480));
  assert.equal(AD.total.displayOverride(), "20480/sec");
  assert.equal(multiplierReads, 8);
  dimensions[7].producing = false;
  beginBreakdownUpdate();
  assert.ok(AD.total.multValue().eq(8960));
  assert.equal(AD.total.displayOverride(), "8960/sec");
  assert.equal(multiplierReads, 15);
});

test("the breakdown refreshes at 10 Hz while grouping, power display and expansion remain immediate", async t => {
  let timestamp = 0;
  t.mock.method(performance, "now", () => timestamp);
  let mult = new Decimal(1000);
  let calls = 0;
  const values = {};
  for (const key of ["AM", "tickspeed", "AD", "IP", "ID", "infinities", "replicanti",
    "EP", "TD", "eternities", "DT", "gamespeed", "RS", "ARS"]) {
    values[key] = { total: { isActive: false } };
  }
  values.AM = {
    total: { name: "Total", isActive: true, multValue: () => mult },
    sampled: {
      name: "Sampled", isActive: true,
      multValue: () => {
        calls++;
        return mult;
      }
    },
    power: { name: "Power", isActive: true, powValue: 2 },
  };
  global.GameDatabase = {
    multiplierTabValues: values,
    multiplierTabTree: { "AM_total": [["AM_sampled"], ["AM_power"]] },
  };
  player.options.multiplierTab.currTab = 0;
  player.options.multiplierTab.showAltGroup = false;
  player.options.multiplierTab.replacePowers = false;
  const tabOptions = loadSource(path.join(stats, "MultiplierBreakdownTab.vue")).default;
  const entryOptions = loadSource(path.join(stats, "MultiplierBreakdownEntry.vue")).default;
  const tab = new Vue(tabOptions);
  const view = new Vue({ ...entryOptions, propsData: { resource: createEntryInfo("AM_total") } });
  tab.update();
  view.update();
  const firstText = view.totalText;
  mult = new Decimal(10000);
  for (const time of [33, 66, 99]) {
    timestamp = time;
    tab.update();
    view.update();
    assert.equal(view.totalText, firstText);
    assert.equal(calls, 1);
  }
  timestamp = 100;
  tab.update();
  view.update();
  assert.notEqual(view.totalText, firstText);
  assert.equal(calls, 2);
  view.changeGroup();
  assert.ok(view.entryTexts[0].includes("^2"));
  view.replacePowers = true;
  await Vue.nextTick();
  assert.ok(!view.entryTexts[0].includes("^2"));
  let expanded = false;
  view.$watch(() => view.showGroup[0], value => {
    expanded = value;
  });
  view.toggleGroup(0);
  await Vue.nextTick();
  assert.equal(expanded, true);
  view.changeGroup();
  // A 33 ms game tick should average 10 Hz, rather than drifting down to one sample every 132 ms.
  for (timestamp = 132; timestamp < 1000; timestamp += 33) {
    tab.update();
    view.update();
  }
  assert.equal(calls, 10);
  timestamp = 5000;
  tab.update();
  view.update();
  assert.equal(calls, 11);
  tab.update();
  view.update();
  assert.equal(calls, 11);
  view.$destroy();
  tab.$destroy();
});

test("Vue rendering reuses display calculations on hover and refreshes after resets and group changes", async() => {
  let mult = new Decimal("1e1000");
  let formatCalls = 0;
  global.GameDatabase = {
    multiplierTabValues: { render: {
      total: { name: "Total", isActive: true, multValue: () => mult },
      effect: {
        name: "Effect", isActive: true, multValue: () => mult,
        displayOverride: () => {
          formatCalls++;
          return `x${mult}`;
        },
      },
      power: { name: "Power", isActive: true, powValue: 2 },
    } },
    multiplierTabTree: { "render_total": [["render_effect"], ["render_power"]] },
  };
  const component = loadSource(path.join(stats, "MultiplierBreakdownEntry.vue")).default;
  const view = new Vue({ ...component, propsData: { resource: createEntryInfo("render_total"), isRoot: true } });
  beginBreakdownUpdate();
  view.update();
  const initialText = view.entryTexts[0];
  const initialStyles = view.barStyles;
  assert.equal(view.logTotalMultiplier.__ob__, undefined);
  assert.equal(view.totalPositivePower.__ob__, undefined);
  assert.equal(view.dilationExponent.__ob__, undefined);
  view._render();
  for (let index = 0; index < 5; index++) {
    view.mouseoverIndex = index % 2 - 1;
    view._render();
  }
  assert.equal(formatCalls, 1);
  assert.equal(view.barStyles, initialStyles);
  mult = new Decimal("1e2000");
  beginBreakdownUpdate();
  view.update();
  assert.notEqual(view.entryTexts[0], initialText);
  assert.equal(formatCalls, 2);
  view.changeGroup();
  assert.equal(view.percentList.length, 1);
  assert.ok(view.percentList[0] > 0);
  view.replacePowers = true;
  await Vue.nextTick();
  beginBreakdownUpdate();
  view.update();
  assert.ok(!view.entryTexts[0].includes("NaN"));
  view.changeGroup();
  mult = new Decimal(1);
  beginBreakdownUpdate();
  view.update();
  assert.equal(view.entries[0].data.isVisible, false);
  assert.deepEqual(Array.from(view.percentList), [0]);
  view._render();
  view.$destroy();
});

function mockEffect(value = 1, active = true) {
  return {
    effectValue: Array.isArray(value) ? value.map(v => new Decimal(v)) : new Decimal(value),
    canBeApplied: active,
    isBought: active,
    isRunning: false,
    effectOrDefault(fallback) { return this.canBeApplied ? this.effectValue : new Decimal(fallback); },
    applyEffect(fn) { if (this.canBeApplied) fn(this.effectValue); },
  };
}

// Execute the actual production getters without booting the game or replacing them with a test formula.
function productionMethod(file, name) {
  const source = fs.readFileSync(path.join(root, "src", file), "utf8");
  const ast = require("@babel/parser").parse(source, { sourceType: "module" });
  let method;
  function visit(node) {
    if (!node || typeof node !== "object") return;
    if (["ClassMethod", "ObjectMethod"].includes(node.type) && node.key.name === name) method = node;
    for (const child of Object.values(node)) {
      if (Array.isArray(child)) child.forEach(visit);
      else if (child && typeof child === "object") visit(child);
    }
  }
  visit(ast);
  assert.ok(method, `Missing production method ${name}`);
  return compileFunction(source.slice(method.body.start + 1, method.body.end - 1), method.params.map(p => p.name));
}

function assertDecimalClose(actual, expected) {
  assert.ok(Decimal.eq_tolerance(actual, expected, 1e-10), `${actual} differs from ${expected}`);
}

function breakdownProduct(definitions, dim) {
  let mult = new Decimal(1);
  let pow = new Decimal(1);
  for (const def of Object.values(definitions)) {
    if (!(typeof def.isActive === "function" ? def.isActive(dim) : def.isActive)) continue;
    if (def.multValue) mult = mult.mul(def.multValue(dim));
    if (def.powValue) pow = pow.mul(def.powValue(dim));
  }
  return mult.pow(pow);
}

test("research IDs select their own effects, including huge values and inactive single-level research", () => {
  const base = path.join(root, "src/core/secret-formula/multiplier-tab");
  global.AbyssResearches = Object.fromEntries(["A1", "A2", "A3", "A11", "A12", "A14", "A18", "A19", "A20", "B0"]
    .map((id, i) => [id, mockEffect(i + 2)]));
  global.SpaceResearchRifts = { r51: mockEffect(7), r52: mockEffect(11), r53: mockEffect(13) };
  const { replicanti } = loadSource(path.join(base, "replicanti.js"));
  const { eternities } = loadSource(path.join(base, "eternities.js"));
  assert.ok(replicanti.SR52.multValue().eq(11));
  assert.ok(eternities.SR53.multValue().eq(13));
  assert.equal(replicanti.SR51, undefined);
  assert.equal(eternities.SR51, undefined);
  const { EP } = loadSource(path.join(base, "eternity-points.js"));
  AbyssResearches.B0 = mockEffect("ee400");
  assert.ok(EP.B0.multValue().eq("ee400"));
  const { tickspeedUpgrades } = loadSource(path.join(base, "tickspeed.js"));
  AbyssResearches.A2 = mockEffect(6, false);
  assert.equal(tickspeedUpgrades.A2.isActive(), false);
  assert.ok(tickspeedUpgrades.A2.multValue().eq(1));
  AbyssResearches.A2.canBeApplied = true;
  AbyssResearches.A11 = mockEffect(25);
  assertDecimalClose(tickspeedUpgrades.A2.multValue().mul(tickspeedUpgrades.A11.multValue()).log10(), 31);
  const { RS } = loadSource(path.join(base, "space-research-speed.js"));
  AbyssResearches.A1.canBeApplied = false;
  assert.equal(RS.A3.isActive(), true);
  for (const [filename, exportName, ids] of [
    ["antimatter.js", "AM", ["A1"]], ["infinities.js", "infinities", ["A12", "A18"]],
    ["infinity-points.js", "IP", ["A14"]], ["infinity-dimensions.js", "ID", ["A20"]],
  ]) {
    const values = loadSource(path.join(base, filename))[exportName];
    for (const id of ids) {
      assert.ok(values[id].name.includes(id));
      assertDecimalClose(values[id].multValue(1), AbyssResearches[id].effectOrDefault(1));
    }
    assert.equal(values.AR, undefined);
  }
});

test("AD buy-ten research decomposition matches the production getter, continuum, challenges and huge counts", () => {
  global.DC = DC;
  global.Effects = loadSource(path.join(root, "src/core/game-mechanics/effects.js")).Effects;
  let nc7 = false;
  let ec11 = false;
  global.NormalChallenge = id => ({ isRunning: id === 7 && nc7 });
  global.EternityChallenge = id => ({ isRunning: id === 11 && ec11, reward: mockEffect(0.3) });
  global.Achievement = () => ({ ...mockEffect(1.1), effects: { buyTenMult: mockEffect(0.2) } });
  global.InfinityUpgrade = { buy10Mult: { ...mockEffect(1.5), chargedEffect: mockEffect(1.2) } };
  global.TimeStudy = () => mockEffect(1.3);
  global.ImaginaryUpgrade = () => mockEffect(1.4);
  global.getAdjustedGlyphEffect = () => new Decimal(1.1);
  global.AbyssResearches = { A10: mockEffect(1.8) };
  global.SpaceResearchRifts = { r31: mockEffect([1.6, 1.25]) };
  global.Laitela = { continuumActive: false };
  global.DimBoost = { totalBoosts: new Decimal(3) };
  global.AntimatterDimensions = { all: Array.from({ length: 8 }, (_, i) => ({
    tier: i + 1, isProducing: i < 4, bought: new Decimal(23 + i * 10), continuumValue: new Decimal(2.5 + i),
  })) };
  const { adPurchaseBreakdown } = loadSource(path.join(root,
    "src/core/secret-formula/multiplier-tab/antimatter-purchases.js"));
  const buyTen = productionMethod("core/dimensions/antimatter-dimension.js", "buyTenMultiplier");
  for (const continuum of [false, true]) {
    Laitela.continuumActive = continuum;
    for (const challenge of [false, true]) {
      nc7 = challenge;
      beginBreakdownUpdate();
      let total = new Decimal(1);
      for (const ad of AntimatterDimensions.all) {
        const count = continuum ? ad.continuumValue : ad.bought.div(10).floor();
        const expected = buyTen().pow(count);
        assertDecimalClose(breakdownProduct(adPurchaseBreakdown, ad.tier), expected);
        if (ad.isProducing) total = total.mul(expected);
      }
      assertDecimalClose(breakdownProduct(adPurchaseBreakdown), total);
    }
  }
  nc7 = false;
  AntimatterDimensions.all[0].continuumValue = new Decimal("1e400");
  beginBreakdownUpdate();
  assertDecimalClose(breakdownProduct(adPurchaseBreakdown, 1).log10(), buyTen().log10().mul("1e400"));
  ec11 = true;
  assert.ok(Object.values(adPurchaseBreakdown).every(def => !def.isActive()));
});

test("dimension boost research and green light match production with Mirror clamps, SC4 and Ra", () => {
  let nc8 = false;
  let scTier = 0;
  let green = new Decimal(1.5);
  global.NormalChallenge = id => ({ isRunning: id === 8 && nc8 });
  global.isSCRunningOnTier = (id, tier) => id === 4 && tier === scTier;
  global.InfinityChallenge = () => ({ ...mockEffect(2), reward: mockEffect(3) });
  global.TimeStudy = () => mockEffect(1.1);
  global.Achievement = () => mockEffect(1.05);
  global.GlyphEffect = { dimBoostPower: mockEffect(1.2) };
  global.PelleRifts = { recursion: { milestones: [mockEffect(1.3)] } };
  global.GlyphAlteration = { isAdded: () => true };
  global.getSecondaryGlyphEffect = () => new Decimal(1.15);
  global.InfinityUpgrade = { dimboostMult: { ...mockEffect(2), chargedEffect: mockEffect(1.2) } };
  global.ImaginaryUpgrade = id => mockEffect({ 12: 4, 23: 2, 24: 1.25 }[id]);
  global.Ra = { isRunning: false };
  global.AbyssResearches = { A8: mockEffect(3) };
  global.SpaceResearchRifts = { r21: mockEffect([5, 10]) };
  global.light = { green: { effectValue: () => green } };
  const dimboostFile = "core/dimboost.js";
  global.DimBoost = { purchasedBoosts: new Decimal(12) };
  Object.defineProperties(DimBoost, {
    power: { get: productionMethod(dimboostFile, "power") },
    imaginaryBoosts: { get: productionMethod(dimboostFile, "imaginaryBoosts") },
  });
  DimBoost.multiplierToNDTier = productionMethod(dimboostFile, "multiplierToNDTier");
  const { adBoostBreakdown } = loadSource(path.join(root,
    "src/core/secret-formula/multiplier-tab/antimatter-boosts.js"));
  for (const scenario of [
    [1.5, 0, false, false, 12], [0.001, 0, false, false, 2], [1.5, 1, false, false, 3],
    [1.5, 2, false, false, 20], [1.5, 0, true, false, 12], [1.5, 0, false, true, 12],
  ]) {
    [green, scTier, nc8, Ra.isRunning] = [new Decimal(scenario[0]), ...scenario.slice(1, 4)];
    DimBoost.purchasedBoosts = new Decimal(scenario[4]);
    beginBreakdownUpdate();
    let total = new Decimal(1);
    for (const ad of AntimatterDimensions.all) {
      const expected = DimBoost.multiplierToNDTier(ad.tier);
      assertDecimalClose(breakdownProduct(adBoostBreakdown, ad.tier), expected);
      if (ad.isProducing) total = total.mul(expected);
    }
    assertDecimalClose(breakdownProduct(adBoostBreakdown), total);
  }
});

test("space, research speed and conversion breakdowns reconstruct the live formulas", () => {
  global.PlayerProgress.imaginaryUnlocked = () => true;
  global.AbyssResearches = { A1: mockEffect(2), A3: mockEffect(3), A5: mockEffect(4), A9: mockEffect(5) };
  global.SpaceResearchRifts = {
    r11: mockEffect(7), r21: mockEffect([3, 11]), r22: { ...mockEffect(1.5), level: new Decimal(4) },
    r42: mockEffect(2), r45: mockEffect(2.5),
  };
  global.Achievements = { power: new Decimal(3) };
  global.InfinityUpgrade = { totalTimeMult: mockEffect(1, false), dim45mult: mockEffect(2) };
  global.TimeStudy = () => mockEffect(2);
  global.DilationUpgrade = { spaceDivisorDT: mockEffect(2) };
  global.light = { cyan: { effectValue: () => new Decimal(3) },
    white: { effectValue: () => new Decimal(1.2) }, red: { effectValue: () => new Decimal(5) } };
  global.SpaceResearchTierDetail = [["r22"], [], []];
  global.isSCRunningOnTier = (id, tier) => id === 3 && tier === 2;
  global.player.space = new Decimal(1000);
  global.player.spaceDivisiorActivePercentage = new Decimal(0.75);
  global.player.records = { thisReality: { maxSpace: new Decimal(10000) } };
  global.DimBoost = { totalBoosts: new Decimal(8) };
  const space = loadSource(path.join(root, "src/core/_MOD/space.js"));
  Object.assign(global, space);
  const speed = loadSource(path.join(root, "src/core/_MOD/space-researches/spaceResearches.js"));
  Object.assign(global, { globalResearchSpeed: speed.globalResearchSpeed,
    getBaseResearchSpeed: speed.getBaseResearchSpeed });
  const base = path.join(root, "src/core/secret-formula/multiplier-tab");
  const { RS } = loadSource(path.join(base, "space-research-speed.js"));
  const { ARS } = loadSource(path.join(base, "abyss-research-speed.js"));
  const { AM } = loadSource(path.join(base, "antimatter.js"));
  global.PlayerProgress.eternityUnlocked = () => true;
  assertDecimalClose(breakdownProduct(Object.fromEntries(["space", "dimBoost", "Abyss"].map(k => [k, RS[k]]))),
    speed.getBaseResearchSpeed());
  assertDecimalClose(breakdownProduct(Object.fromEntries(
    ["base", "achievementMult", "SR21", "infinityUpgrade", "timeStudy", "A3"].map(k => [k, RS[k]]))),
  speed.globalResearchSpeed());
  assertDecimalClose(breakdownProduct({ base: ARS.base, A5: ARS.A5, A9: ARS.A9 }), ARS.total.multValue());
  assertDecimalClose(breakdownProduct(Object.fromEntries(
    ["SR22", "A9", "spaceDilation", "lightWhite", "spaceChallenge3", "spaceDivisorPercentage"]
      .map(k => [k, AM[k]]))), space.getSpaceDivisor());
  assertDecimalClose(AM.spaceBase.powValue().mul(AM.spaceDivisor.powValue()), AM.space.powValue());
  assert.ok(AM.space.fakeValue().neq(1));
  global.PelleUpgrade = { infConversion: mockEffect(4) };
  global.PelleRifts = { paradox: { milestones: [null, null, mockEffect(1.4)] } };
  global.getAdjustedGlyphEffect = () => new Decimal(0.5);
  const rate = productionMethod("core/dimensions/infinity-dimension.js", "powerConversionRate");
  const { ID } = loadSource(path.join(base, "infinity-dimensions.js"));
  assertDecimalClose(breakdownProduct({ base: ID.conversionBase, research: ID.conversionSR45,
    pelle: ID.conversionPelle }).log10(), rate());
});

test("all reachable breakdown tree references resolve and mod research is reachable without double counting", () => {
  const base = path.join(root, "src/core/secret-formula/multiplier-tab");
  const { multiplierTabValues: values } = loadSource(path.join(base, "values.js"));
  const { multiplierTabTree: tree } = loadSource(path.join(base, "tree.js"));
  const visited = new Set();
  function visit(parent) {
    if (visited.has(parent)) return;
    visited.add(parent);
    const groups = tree[parent];
    if (!groups) return;
    for (const key of [parent, ...groups.flat()]) {
      const [resource, prop] = key.split("_");
      assert.ok(values[resource]?.[prop], `Unresolved ${key} in ${parent}`);
    }
    for (const group of groups) assert.equal(new Set(group).size, group.length, `Duplicate child in ${parent}`);
    groups.flat().forEach(visit);
  }
  Object.keys(values).filter(key => values[key].total).forEach(key => visit(`${key}_total`));
  assert.ok(tree.DT_total[0].includes("DT_SR54"));
  assert.ok(tree.EP_total[0].includes("EP_B0"));
  assert.ok(tree.infinities_total[0].includes("infinities_A12"));
  assert.ok(tree.infinities_total[0].includes("infinities_A18"));
  assert.ok(tree.AD_purchase[0].includes("AD_buy10A10"));
  assert.ok(tree.AD_dimboost[0].includes("AD_boostA8"));
  assert.ok(!tree.AD_total[0].includes("AD_buy10A10"));
  assert.ok(!tree.AD_total[0].includes("AD_boostA8"));
  for (let dim = 1; dim <= 8; dim++) {
    assert.ok(tree[`AD_purchase_${dim}`][0].includes(`AD_buy10SR31_${dim}`));
    assert.ok(tree[`AD_dimboost_${dim}`][0].includes(`AD_boostSR21_${dim}`));
  }
});
