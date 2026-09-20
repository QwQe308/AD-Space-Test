/* eslint-env node */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const { beforeEach, test } = require("node:test");
const { transformSync } = require("@babel/core");
const { parseComponent, compile } = require("vue-template-compiler");
const Vue = require("vue");

Array.range = (start, count) => Array.from({ length: count }, (_, i) => start + i);
const filename = path.resolve(__dirname, "../src/components/tabs/_MOD/abyss/AbyssResearchConnection.vue");
const source = parseComponent(fs.readFileSync(filename, "utf8"));
assert.deepEqual(compile(source.template.content).errors, []);
const loaded = new Module(filename, module);
loaded._compile(transformSync(source.script.content, {
  configFile: false, babelrc: false, plugins: ["@babel/plugin-transform-modules-commonjs"],
}).code, filename);
const Connection = Vue.extend(loaded.exports.default);

function node() {
  return { level: 0, get completed() { return this.level >= 1; }, isResearching: true, unlocked: true };
}
beforeEach(() => {
  global.AbyssResearches = { A: node(), B: node() };
});
function connection(reverse = false) {
  const ends = [[0, 0, "A"], [100, 0, "B"]];
  if (reverse) ends.reverse();
  return new Connection({ propsData: { id: reverse ? "B-A" : "A-B", data: [...ends, reverse] } });
}
function assertNoAnimation(vm) {
  assert.deepEqual([...vm.animationPercentages], [-60, 0]);
  assert.ok(vm.positions.flat(2).every(value => value === -10000));
}

test("a level-zero node cannot emit when both ends are researching and its neighbor is completed", () => {
  AbyssResearches.B.level = 1;
  const forward = connection();
  const reverse = connection(true);
  forward.animationPercentages = [40, 60];
  reverse.animationPercentages = [40, 60];
  forward.update();
  reverse.update();
  // The static connection stays highlighted because the reverse direction is valid.
  assert.equal(forward.isActive, true);
  assertNoAnimation(forward);
  assert.deepEqual([...reverse.animationPercentages], [41, 61]);
  assert.ok(reverse.positions[0][0][0] > reverse.positions[0][1][0]);
  forward.$destroy();
  reverse.$destroy();
});

test("two level-zero nodes researching simultaneously do not emit in either direction", () => {
  for (const reverse of [false, true]) {
    const vm = connection(reverse);
    vm.update();
    assert.equal(vm.isActive, false);
    assertNoAnimation(vm);
    vm.$destroy();
  }
});

test("completed adjacent nodes can emit in both directions while both are researching", () => {
  AbyssResearches.A.level = 1;
  AbyssResearches.B.level = 1;
  for (const reverse of [false, true]) {
    const vm = connection(reverse);
    vm.update();
    assert.equal(vm.isActive, true);
    assert.deepEqual([...vm.animationPercentages], [-59, 1]);
    vm.$destroy();
  }
});

test("each direction requires its own completed source and unlocked researching destination", () => {
  for (const sourceLevel of [0, 1]) {
    for (const sourceResearching of [false, true]) {
      for (const targetLevel of [0, 1]) {
        for (const targetResearching of [false, true]) {
          for (const targetUnlocked of [false, true]) {
            Object.assign(AbyssResearches.A, { level: sourceLevel, isResearching: sourceResearching });
            Object.assign(AbyssResearches.B, {
              level: targetLevel, isResearching: targetResearching, unlocked: targetUnlocked,
            });
            const vm = connection();
            vm.update();
            if (sourceLevel > 0 && targetResearching && targetUnlocked) {
              assert.deepEqual([...vm.animationPercentages], [-59, 1]);
            } else {
              assertNoAnimation(vm);
            }
            vm.$destroy();
          }
        }
      }
    }
  }
});

test("an active animation clears when the source resets to zero and resumes when it completes again", () => {
  AbyssResearches.A.level = 1;
  AbyssResearches.B.level = 1;
  const vm = connection();
  vm.update();
  assert.deepEqual([...vm.animationPercentages], [-59, 1]);
  AbyssResearches.A.level = 0;
  vm.update();
  assertNoAnimation(vm);
  AbyssResearches.A.level = 1;
  vm.update();
  assert.deepEqual([...vm.animationPercentages], [-59, 1]);
  vm.$destroy();
});
