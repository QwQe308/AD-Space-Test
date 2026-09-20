/* eslint-env node */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { beforeEach, test } = require("node:test");
const { transformSync } = require("@babel/core");
const Decimal = require("break_eternity.js");

global.Decimal = Decimal;
const DC = Object.fromEntries(Object.entries({ D0: 0, D1: 1, D2: 2, E100: "1e100", E20000: "1e20000" })
  .map(([key, value]) => [key, new Decimal(value)]));

class TestCurrency {
  constructor(value = 0) { this.value = new Decimal(value); this.frozen = false; }
  get layer() { return this.value.layer; }
  gte(value) { return this.value.gte(value); }
  lt(value) { return this.value.lt(value); }
  add(value) { this.value = this.value.add(value); }
  subtract(value) {
    if (!this.frozen) this.value = this.value.sub(value).max(0);
  }
}

const Currency = {};
const source = fs.readFileSync(path.join(__dirname, "../src/core/time-theorems.js"), "utf8");
const { code } = transformSync(source, {
  configFile: false, babelrc: false, plugins: ["@babel/plugin-transform-modules-commonjs"],
});
const loaded = { exports: {} };
new Function("require", "exports", code)(name => {
  if (name === "./constants") return { DC };
  if (name === "./currency") return { Currency };
  throw new Error(`Unexpected import: ${name}`);
}, loaded.exports);
const { TimeTheoremPurchaseType: purchases, TimeTheorems } = loaded.exports;

beforeEach(() => {
  global.player = {
    timestudy: { amBought: new Decimal(0), ipBought: new Decimal(0), epBought: new Decimal(0) },
    eternities: new Decimal(1),
    requirementChecks: { reality: { noPurchasedTT: true } },
  };
  global.Perk = { ttFree: { canBeApplied: false } };
  global.Pelle = { isDoomed: false };
  global.PlayerProgress = { realityUnlocked: () => true };
  for (const key of ["antimatter", "infinityPoints", "eternityPoints", "timeTheorems"]) {
    Currency[key] = new TestCurrency();
  }
});

test("buy max exhausts all affordable AM, IP and EP purchases in one click", () => {
  Currency.antimatter.value = purchases.am.costAt(new Decimal(2));
  Currency.infinityPoints.value = purchases.ip.costAt(new Decimal(3));
  Currency.eternityPoints.value = new Decimal(31);
  TimeTheorems.buyMax();
  assert.ok(purchases.am.amount.eq(3), `AM bought: ${purchases.am.amount}, next cost: ${purchases.am.cost}`);
  assert.ok(purchases.ip.amount.eq(4));
  assert.ok(purchases.ep.amount.eq(5));
  assert.ok(Currency.timeTheorems.value.eq(12));
  assert.ok(Currency.eternityPoints.value.eq(0));
  assert.equal(player.requirementChecks.reality.noPurchasedTT, false);
  for (const type of ["am", "ip", "ep"]) assert.equal(purchases[type].canAfford, false, type);
  TimeTheorems.buyMax();
  assert.ok(Currency.timeTheorems.value.eq(12));
});

test("EP bulk matches repeated single purchases around cumulative price boundaries", () => {
  const purchase = purchases.ep;
  for (const owned of [0, 1, 7, 20]) {
    for (const count of [1, 2, 3, 5, 10]) {
      const total = 2 ** owned * (2 ** count - 1);
      for (const budget of [total - 1, total, total + 1]) {
        purchase.amount = new Decimal(owned);
        purchase.currency.value = new Decimal(budget);
        Currency.timeTheorems.value = new Decimal(0);
        while (purchase.purchase()) { /* Reference: manual single purchases. */ }
        const expectedAmount = purchase.amount;
        const expectedCurrency = purchase.currency.value;
        const expectedTheorems = Currency.timeTheorems.value;
        purchase.amount = new Decimal(owned);
        purchase.currency.value = new Decimal(budget);
        Currency.timeTheorems.value = new Decimal(0);
        purchase.purchase(true);
        assert.ok(purchase.amount.eq(expectedAmount), `owned=${owned}, budget=${budget}`);
        assert.ok(purchase.currency.value.eq_tolerance(expectedCurrency, 1e-12),
          `owned=${owned}, budget=${budget}, remaining=${purchase.currency.value}, expected=${expectedCurrency}`);
        assert.ok(Currency.timeTheorems.value.eq(expectedTheorems));
        assert.equal(purchase.canAfford, false);
      }
    }
  }
});

test("free purchases use the final price instead of the cumulative price", () => {
  Perk.ttFree.canBeApplied = true;
  for (const type of ["am", "ip", "ep"]) {
    const purchase = purchases[type];
    purchase.amount = new Decimal(3);
    const budget = purchase.costBase.mul(purchase.costIncrement.pow(8));
    purchase.currency.value = budget;
    assert.equal(purchase.purchase(true), true);
    assert.ok(purchase.amount.eq(9), type);
    assert.ok(purchase.currency.value.eq(budget));
    assert.equal(purchase.canAfford, false, type);
    assert.equal(purchase.purchase(true), false);
  }
});

test("AM and IP bulk respect the last affordable price with existing purchases", () => {
  for (const type of ["am", "ip"]) {
    const purchase = purchases[type];
    for (const owned of [0, 1, 20]) {
      for (const count of [1, 2, 10]) {
        const lastPrice = purchase.costAt(new Decimal(owned + count - 1));
        for (const factor of [0.999999, 1, 1.000001]) {
          purchase.amount = new Decimal(owned);
          purchase.currency.value = lastPrice.mul(factor);
          purchase.purchase(true);
          assert.ok(purchase.amount.eq(owned + count - (factor < 1 ? 1 : 0)),
            `${type}, owned=${owned}, count=${count}, factor=${factor}`);
          assert.equal(purchase.canAfford, false);
          const remaining = purchase.currency.value;
          assert.equal(purchase.purchase(true), false);
          assert.ok(purchase.currency.value.eq(remaining));
        }
      }
    }
  }
});

test("frozen currency bulk matches the non-spending behavior of single purchases", () => {
  Currency.eternityPoints.frozen = true;
  Currency.eternityPoints.value = new Decimal(16);
  purchases.ep.purchase(true);
  assert.ok(purchases.ep.amount.eq(5));
  assert.ok(Currency.eternityPoints.value.eq(16));
  assert.equal(purchases.ep.canAfford, false);
});

test("unaffordable and eternity-locked purchases leave all state unchanged", () => {
  for (const type of ["am", "ip", "ep"]) {
    const purchase = purchases[type];
    purchase.currency.value = purchase.cost.div(2);
    assert.equal(purchase.purchase(true), false);
    assert.ok(purchase.bulkPossible.eq(0));
    purchase.currency.value = purchase.cost;
    player.eternities = new Decimal(0);
    assert.equal(purchase.purchase(true), false);
    player.eternities = new Decimal(1);
    assert.ok(purchase.amount.eq(0));
  }
  assert.ok(Currency.timeTheorems.value.eq(0));
  assert.equal(player.requirementChecks.reality.noPurchasedTT, true);
});

test("layered currencies finish without iterating over unrepresentable individual purchases", () => {
  for (const type of ["am", "ip", "ep"]) {
    const purchase = purchases[type];
    const budget = new Decimal("ee100");
    purchase.currency.value = budget;
    assert.equal(purchase.purchase(true), true);
    assert.ok(purchase.amount.gt(0));
    assert.ok(purchase.amount.isFinite());
    assert.ok(purchase.currency.value.eq(budget));
  }
});

test("huge existing purchase counts stop when one more theorem is not representable", () => {
  for (const type of ["am", "ip", "ep"]) {
    const purchase = purchases[type];
    purchase.amount = new Decimal("1e100");
    purchase.currency.value = purchase.cost;
    assert.equal(purchase.purchase(true), false);
    assert.ok(purchase.amount.eq("1e100"));
    assert.ok(Currency.timeTheorems.value.eq(0));
  }
});

test("bulk purchases update the no-purchase flag and trigger the Pelle strike at 115 TT", () => {
  Pelle.isDoomed = true;
  let strikes = 0;
  global.PelleStrikes = { ECs: { trigger: () => strikes++ } };
  Currency.timeTheorems.value = new Decimal(113);
  Currency.eternityPoints.value = new Decimal(3);
  purchases.ep.purchase(true);
  assert.ok(Currency.timeTheorems.value.eq(115));
  assert.equal(strikes, 1);
  assert.equal(player.requirementChecks.reality.noPurchasedTT, false);
});
