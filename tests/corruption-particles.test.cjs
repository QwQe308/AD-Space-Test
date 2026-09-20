/* eslint-env node */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const { compileFunction } = require("node:vm");
const { test } = require("node:test");
const { transformSync } = require("@babel/core");
const { parseComponent, compile } = require("vue-template-compiler");
const Vue = require("vue");

const root = path.resolve(__dirname, "../src/components/tabs/_MOD/abyss");
const modules = new Map();
function loadSource(filename) {
  if (modules.has(filename)) return modules.get(filename).exports;
  const loaded = new Module(filename, module);
  modules.set(filename, loaded);
  loaded.require = name => loadSource(path.resolve(path.dirname(filename), `${name}.js`));
  const source = fs.readFileSync(filename, "utf8");
  const component = filename.endsWith(".vue") ? parseComponent(source) : null;
  loaded._compile(transformSync(component ? component.script.content : source, {
    configFile: false, babelrc: false, plugins: ["@babel/plugin-transform-modules-commonjs"],
  }).code, filename);
  if (component) {
    const result = compile(component.template.content);
    assert.deepEqual(result.errors, []);
    loaded.exports.default.render = compileFunction(result.render);
    loaded.exports.default.staticRenderFns = result.staticRenderFns.map(body => compileFunction(body));
  }
  return loaded.exports;
}
const { corruptionOrbitParticles, corruptionEscapeParticles, CORRUPTION_BURST_DURATION } =
  loadSource(path.join(root, "corruption-particles.js"));
const component = loadSource(path.join(root, "CorruptionNodeVisual.vue")).default;
const Visual = Vue.extend(component);

function animateTest(t, completed) {
  const originalRequest = global.requestAnimationFrame;
  const originalCancel = global.cancelAnimationFrame;
  const frames = new Map();
  let frameId = 0;
  global.requestAnimationFrame = callback => {
    frames.set(++frameId, callback);
    return frameId;
  };
  global.cancelAnimationFrame = id => frames.delete(id);
  const vm = new Visual({ propsData: { completed } });
  component.mounted.call(vm);
  t.after(() => {
    vm.$destroy();
    global.requestAnimationFrame = originalRequest;
    global.cancelAnimationFrame = originalCancel;
  });
  return {
    vm, frames,
    advance(now) {
      const callback = frames.get(vm._animationFrame);
      frames.delete(vm._animationFrame);
      callback(now);
    },
  };
}

test("3D orbits cross behind and in front with perspective scaling and depth sorting", () => {
  const near = corruptionOrbitParticles(1600).find(p => p.id === 0);
  const far = corruptionOrbitParticles(4800).find(p => p.id === 0);
  assert.ok(near.z > 0 && far.z < 0);
  assert.ok(near.radius > far.radius);
  assert.ok(near.opacity > far.opacity);
  const particles = corruptionOrbitParticles(1200);
  assert.equal(particles.length, 6);
  assert.ok(particles.some(p => p.z < 0) && particles.some(p => p.z > 0));
  assert.ok(particles.every((p, i) => i === 0 || particles[i - 1].z <= p.z));
});

test("purchase expands the existing orbits then contracts back to the original positions", () => {
  const normal = corruptionOrbitParticles(1200);
  const spread = corruptionOrbitParticles(1200, 350);
  const settled = corruptionOrbitParticles(1200, CORRUPTION_BURST_DURATION);
  for (const particle of normal) {
    const expanded = spread.find(p => p.id === particle.id);
    assert.ok(Math.hypot(expanded.x - 20, expanded.y - 20) > Math.hypot(particle.x - 20, particle.y - 20));
    const final = settled.find(p => p.id === particle.id);
    assert.ok(Math.abs(final.x - particle.x) < 1e-10);
    assert.ok(Math.abs(final.y - particle.y) < 1e-10);
  }
});

test("escape particles originate at the center, move outward and fade completely", () => {
  assert.deepEqual(corruptionEscapeParticles(null), []);
  assert.ok(corruptionEscapeParticles(0).every(p => p.x === 20 && p.y === 20));
  const early = corruptionEscapeParticles(150).find(p => p.id === 0);
  const late = corruptionEscapeParticles(600).find(p => p.id === 0);
  assert.ok(Math.hypot(late.x - 20, late.y - 20) > Math.hypot(early.x - 20, early.y - 20));
  assert.ok(late.opacity < early.opacity && late.radius < early.radius);
  assert.deepEqual(corruptionEscapeParticles(950), []);
});

test("a real purchase adds a gold radial burst without interrupting the orbital clock", async t => {
  const { vm, advance } = animateTest(t, false);
  advance(0);
  advance(performance.now());
  vm.completed = true;
  await Vue.nextTick();
  const start = vm._burstStartedAt;
  assert.equal(vm.burstElapsed, 0);
  assert.equal(vm._render().data.class["is-purchased"], true);
  // Sample expansion, contraction, and a frame crossing the end of the burst.
  for (const elapsed of [150, 350, 700, 1200, CORRUPTION_BURST_DURATION + 25]) {
    advance(start + elapsed);
    assert.ok(Math.abs(vm.orbitTime - (start + elapsed)) < 1e-8);
    if (elapsed < CORRUPTION_BURST_DURATION) {
      assert.ok(Math.abs(vm.burstElapsed - elapsed) < 1e-8);
    }
    if (elapsed === 350) assert.ok(vm.escapeParticles.length > 0);
  }
  assert.equal(vm.burstElapsed, null);
  assert.deepEqual(vm.escapeParticles, []);
  advance(start + CORRUPTION_BURST_DURATION + 100);
  assert.ok(Math.abs(vm.orbitTime - (start + CORRUPTION_BURST_DURATION + 100)) < 1e-8);
  assert.equal(vm._render().data.class["is-purchased"], true);
});

test("loading a purchased node shows gold orbits without replaying the purchase burst", t => {
  const { vm, advance, frames } = animateTest(t, true);
  advance(0);
  advance(1200);
  assert.equal(vm.burstElapsed, null);
  assert.equal(vm._render().data.class["is-purchased"], true);
  const children = vm._render().children.filter(node => node.tag);
  const nodeIndex = children.findIndex(node => node.tag === "path");
  assert.ok(nodeIndex > 0 && nodeIndex < children.length - 1);
  assert.ok(children.slice(0, nodeIndex).every(node => node.key.startsWith("back-")));
  assert.ok(children.slice(nodeIndex + 1).every(node => node.key.startsWith("front-")));
  vm.$destroy();
  assert.equal(frames.size, 0);
});

test("resetting an in-flight purchase restores white orbits and cancels escaping particles", async t => {
  const { vm } = animateTest(t, false);
  vm.completed = true;
  await Vue.nextTick();
  vm.completed = false;
  await Vue.nextTick();
  assert.equal(vm.burstElapsed, null);
  assert.deepEqual(vm.escapeParticles, []);
  assert.equal(vm._render().data.class["is-purchased"], false);
});
