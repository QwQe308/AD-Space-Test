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
Vue.directive("tooltip", {});

const root = path.resolve(__dirname, "..");
const stats = path.join(root, "src/components/tabs/statistics");
const DC = { D0: new Decimal(0), D1: new Decimal(1), DM1: new Decimal(-1) };
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
    "EP", "TD", "eternities", "DT", "gamespeed"]) {
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
