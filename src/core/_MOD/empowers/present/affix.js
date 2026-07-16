export class Affix {
  constructor({
    name: name,

    description: description = () => {
      throw Error("No Description Function Defined!");
    },
    process: process = () => {
      throw Error("No Process Function Defined!");
    },
    effect: effect = null,
    cost: cost,
    unlocked: unlocked = () => true,
    noSpellPower: noSpellPower = false,
    debuff: debuff = false,
    pending: pending = null,
  }) {
    this._name = name;
    this._description = description;
    this._process = process;
    this._effect = effect;
    this._cost = cost;
    this._unlocked = unlocked;
    this._noSpellPower = noSpellPower;
    this._debuff = debuff;
    this._pending = pending;
  }

  get cost() {
    return this._cost;
  }

  get name() {
    return this._name;
  }

  get noSpellPower() {
    return this._noSpellPower;
  }

  get debuff() {
    return this._debuff;
  }

  get unlocked() {
    return this._unlocked();
  }

  process(data) {
    return this._process.call(this, data);
  }

  pending(data) {
    if (!this._pending) return null;
    return this._pending.call(this, data);
  }

  effect(data) {
    return this._effect.call(this, data);
  }

  description(data) {
    const effect = this.effect(data);
    let description = this._description.call(this, data, effect);
    for (const i in ABBREVIATIONS) {
      description = description.replaceAll(i, ABBREVIATIONS[i](data, effect));
    }
    return description;
  }
}

const ABBREVIATIONS = {
  "[En]": (data, effect) => `<br>(Spell Power does nothing)`,
  "[E]": (data, effect) => `<br>(${format(effect, 2, 2)})`,
  "[E+]": (data, effect) => `<br>(${formatAdd(effect)})`,
  "[Ep+]": (data, effect) => (Decimal.lt(effect, 0) ? `<br>(-${formatPercents(Decimal.neg(effect), 2, 2)}` : `<br>(+${formatPercents(effect, 2, 2)})`),
  "[Ex]": (data, effect) => `<br>(${formatMultiplier(effect)})`,
  "[E^]": (data, effect) => `<br>(${formatPow(effect)})`,
  "[Et]": (data, effect) => `<br>(${TimeSpan.fromSeconds(effect)})`,
};