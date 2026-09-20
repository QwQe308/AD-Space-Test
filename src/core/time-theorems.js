import { Currency } from "./currency";
import { DC } from "./constants";

/**
 * @abstract
 */
export class TimeTheoremPurchaseType {
  /**
  * @abstract
  */
  get amount() { throw new NotImplementedError(); }

  /**
  * @abstract
  */
  set amount(value) { throw new NotImplementedError(); }

  add(amount) { this.amount = this.amount.add(amount); }

  /**
  * @abstract
  */
  get currency() { throw new NotImplementedError(); }

  get cost() { return this.costAt(this.amount); }

  costAt(amount) {
    // All theorem prices are integers, but Decimal powers can leave tiny fractional errors.
    return this.costBase.times(this.costIncrement.pow(amount)).round();
  }

  /**
   * @abstract
   */
  get costBase() { throw new NotImplementedError(); }

  /**
   * @abstract
   */
  get costIncrement() { throw new NotImplementedError(); }

  get isFree() {
    return Perk.ttFree.canBeApplied || this.currency.layer > 1 || this.currency.frozen;
  }

  get bulkPossible() {
    if (!this.canAfford) return DC.D0;
    const budget = this.currency.value;
    let amount = this.isFree
      ? budget.div(this.cost).log(this.costIncrement).add(1).floor()
      : Decimal.affordGeometricSeries(budget, this.cost, this.costIncrement, 0);
    amount = amount.max(1);

    // Logarithms can round across an integer boundary. Verify against the actual price before spending.
    // At huge counts, adding or subtracting one no longer changes the Decimal; stop correcting there.
    while (amount.gt(1) && amount.sub(1).lt(amount) && this.bulkCost(amount).gt(budget)) {
      amount = amount.sub(1);
    }
    while (amount.add(1).gt(amount) && this.amount.add(amount.add(1)).gt(this.amount.add(amount)) &&
      this.bulkCost(amount.add(1)).lte(budget)) {
      amount = amount.add(1);
    }
    return amount;
  }

  // Note: This is actually just the cost of the largest term of the geometric series. If buying EP without the
  // perk that makes them free, this will be incorrect, but the EP object already overrides this anyway
  bulkCost(amount) {
    return this.costAt(this.amount.add(amount).sub(1));
  }

  purchase(bulk = false) {
    if (Currency.timeTheorems.gte(115) && Pelle.isDoomed) PelleStrikes.ECs.trigger();
    if (!this.canAfford) return false;

    const amount = bulk ? this.bulkPossible : DC.D1;
    if (this.amount.add(amount).eq(this.amount)) return false;
    const cost = bulk ? this.bulkCost(amount) : this.cost;
    if (!this.isFree) this.currency.subtract(cost);
    Currency.timeTheorems.add(amount);
    this.add(amount);
    player.requirementChecks.reality.noPurchasedTT = false;
    if (Currency.timeTheorems.gte(115) && Pelle.isDoomed) PelleStrikes.ECs.trigger();
    return true;
  }

  get canAfford() {
    return this.currency.gte(this.cost) && !player.eternities.eq(0);
  }

  reset() {
    this.amount = DC.D0;
  }
}

TimeTheoremPurchaseType.am = new class extends TimeTheoremPurchaseType {
  get amount() { return player.timestudy.amBought; }
  set amount(value) { player.timestudy.amBought = value; }

  get currency() { return Currency.antimatter; }
  get costBase() { return DC.E20000; }
  get costIncrement() { return DC.E20000; }
}();

TimeTheoremPurchaseType.ip = new class extends TimeTheoremPurchaseType {
  get amount() { return player.timestudy.ipBought; }
  set amount(value) { player.timestudy.ipBought = value; }

  get currency() { return Currency.infinityPoints; }
  get costBase() { return DC.D1; }
  get costIncrement() { return DC.E100; }
}();

TimeTheoremPurchaseType.ep = new class extends TimeTheoremPurchaseType {
  get amount() { return player.timestudy.epBought; }
  set amount(value) { player.timestudy.epBought = value; }

  get currency() { return Currency.eternityPoints; }
  get costBase() { return DC.D1; }
  get costIncrement() { return DC.D2; }

  bulkCost(amount) {
    if (this.isFree) return super.bulkCost(amount);
    return super.bulkCost(amount).times(2).sub(this.cost).round();
  }
}();

export const TimeTheorems = {
  checkForBuying(auto) {
    if (PlayerProgress.realityUnlocked() || TimeDimension(1).bought.neq(0)) return true;
    if (!auto) Modal.message.show(`You need to buy at least ${formatInt(1)} Time Dimension before you can purchase
      Time Theorems.`, { closeEvent: GAME_EVENT.REALITY_RESET_AFTER });
    return false;
  },

  buyOne(auto = false, type) {
    if (!this.checkForBuying(auto)) return DC.D0;
    if (!TimeTheoremPurchaseType[type].purchase(false)) return DC.D0;
    return DC.D1;
  },

  // This is only called via automation and there's no manual use-case, so we assume auto is true and simplify a bit
  buyOneOfEach() {
    if (!this.checkForBuying(true)) return;
    this.buyOne(true, "am");
    this.buyOne(true, "ip");
    this.buyOne(true, "ep");
  },

  buyMax(auto = false) {
    if (!this.checkForBuying(auto)) return;
    TimeTheoremPurchaseType.am.purchase(true);
    TimeTheoremPurchaseType.ip.purchase(true);
    TimeTheoremPurchaseType.ep.purchase(true);
  },

  totalPurchased() {
    return TimeTheoremPurchaseType.am.amount
      .add(TimeTheoremPurchaseType.ip.amount)
      .add(TimeTheoremPurchaseType.ep.amount);
  },

  calculateTimeStudiesCost() {
    let totalCost = TimeStudy.boughtNormalTS()
      .map(ts => ts.cost)
      .reduce(Decimal.sumReducer, new Decimal());
    const ecStudy = TimeStudy.eternityChallenge.current();
    if (ecStudy !== undefined) {
      totalCost = totalCost.add(ecStudy.cost);
    }
    if (Enslaved.isRunning && player.celestials.enslaved.hasSecretStudy) totalCost = totalCost.sub(100);
    if (TimeStudy(111).isBought) totalCost = totalCost.sub(30);
    return totalCost;
  }
};
