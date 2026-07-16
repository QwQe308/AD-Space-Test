export class Affix {
  constructor({
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
  }) {
    this._description = description;
    this._process = process;
    this._effect = effect;
    this._cost = cost;
    this._unlocked = unlocked;
    this._noSpellPower = noSpellPower;
  }

  get cost() {
    return this.cost;
  }

  get noSpellPower() {
    return this._noSpellPower
  }

  effect(data) {
    return this._effect(data);
  }

  description(data) {
    let effect = this._effect(data);
    let description = this._description(data, effect)
    for(let i in ABBREVIATIONS){
      description = description.replaceAll(i, ABBREVIATIONS[i](data, effect))
    }
    return description;
  }
}

const ABBREVIATIONS = {
  "[En]" : (data, effect) => `<br>(Spell Power does nothing)`,
  "[E]" : (data, effect) => `<br>(${format(effect, 2, 2)})`,
  "[E+]" : (data, effect) => `<br>(${formatAdd(effect)})`,
  "[Ep+]" : (data, effect) => Decimal.lt(effect, 0) ? `<br>()` : `<br>(+${formatPercents(effect, 2, 2)})`,
  "[Ex]" : (data, effect) => `<br>(${formatMultiplier(effect)})`,
  "[E^]" : (data, effect) => `<br>(${formatPow(effect)})`,
  "[Et]" : (data, effect) => `<br>(${TimeSpan.fromSeconds(effect)})`,
}