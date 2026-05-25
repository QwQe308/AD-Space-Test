class PresentEmpowerClass {
  constructor() {}

  get data() {
    return player.empowers.present;
  }

  get mana() {
    return this.data.mana;
  }

  set mana(newVal) {
    this.data.mana = newVal;
  }
}

class Affix {
  constructor({
    description = () => {
      throw Error("No Description Function Defined!");
    },
    process = () => {
      throw Error("No Process Function Defined!");
    },
    effect = null,
    cost,
    unlocked = () => true,
  }) {
    this._description = description;
    this._process = process;
    this._effect = effect;
    this._cost = cost;
    this._unlocked = unlocked;
  }

  get cost() {
    return this.cost;
  }

  effect(data) {
    return this._effect(data);
  }

  description(data) {
    let effect = this._effect(data);
    let description = this._description(data, effect).replaceAll(
      "[T]",
      data.target ? `<i>${data.target}</i>` : `<i>[Spell Target]</i>`
    );
    return description;
  }
}

class pendingEvent {
  constructor({ func: func, delay: delay, extras = extras, data: data, baseSpellPower: baseSpellPower = DC.D0 }) {
    this.func = func;
    this.delay = delay;
    this.extras = extras;
    this.data = data;

    this.baseSpellPower = baseSpellPower ?? new Decimal(data.spellPower);
  }

  process() {
    this.func({ extras: this.extras, data: this.data, event: this });
  }

  count() {
    this.delay--;
    if (this.delay === 0) {
      this.process();
      this.unmount();
    } else if (this.delay < 0) {
      this.unmount();
    }
  }

  mount() {
    this.data.pending.add(this);
  }

  unmount() {
    this.data.pending.delete(this);
  }
}

const baseData = {
  spellPower: DC.D1,
  multiplier: DC.D1,
  directMultilpier: DC.D1,
};

function fakeData(data, power) {
  let result = {};
  result.assign(result, data);
  result.spellPower = power;
  return result;
}

const AffixBaseConfig = {
  simple: {
    description: (data, effect) => `<b>Double</b> [T]'s gain multiplier. 5[M] (${formatMultiplier(effect, 2, 2)})`,
    effect: (data) => DC.D2.pow(data.spellPower),
    process: (data) => (data.multiplier = data.multiplier.mul(this.effect(data))),
    cost: 5,
  },
  direct: {
    description: (data, effect) => `Instantly <b>Triple</b> [T]. (x${format(effect, 2, 2)})`,
    effect: (data) => DC.D3.pow(data.spellPower),
    process: (data) => (data.directMultilpier = data.directMultilpier.mul(this.effect(data))),
    cost: 10,
  },
  twin: {
    description: (data, effect) => `. (x${format(effect, 2, 2)})`,
    effect: (data) => DC.E1.pow(data.spellPower),
    process: (data) => (data.directMultilpier = data.directMultilpier.mul(this.effect(data))),
    cost: 15,
  },
  accelerating: {
    description: (data, effect) =>
      `After each next affix, spell power <b>+0.1</b>. (+${format(effect, 2, 2)}, excluding this)`,
    effect: (data) => DC.E1.pow(data.spellPower),
    process: (data) => data.pending.push([this.pending, data.spellPower, 1, 1]),
    pending: (data, baseSpellPower, extras) => {
      data.spellPower += 0.1 * baseSpellPower * extras;
      data.pending.push([this.pending, data.spellPower, 1, extras + 1]);
    },
    cost: 15,
  },
};

const SpellConfig = {
  power: {
    description: () => `Spell target is set to Infinity Power. Spell power *2.`,
    process(data) {
      data.target = "IPow";
      data.spellPower = data.spellPower.mul(2);
    },
    cost: 10,
  },
  loop: {
    description: () =>
      `Spell target is set to Eternity Points. On next eternity, EP will be set to ([EP before using this skill] + Gained EP).`,
    process(data) {
      data.target = "EP";
    },
    cost: 25,
  },
};
