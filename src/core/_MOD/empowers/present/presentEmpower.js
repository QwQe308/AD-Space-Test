import { Affix } from "./affix";
import { PendingEvent } from "./pendingEvent";

export class SpellData {
  constructor() {
    this.spellPower = DC.D1;
    this.tempSpellPower = DC.D0;
    this.multiplier = DC.D1;
    this.directMultiplier = DC.D1;

    this.instantGalaxies = DC.D0;

    this.pending = new Set();
    this.manaCost = 0;
  }

  get totalSpellPower() {
    return this.spellPower.add(this.tempSpellPower);
  }
}

export class PresentEmpowerClass {
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

export const PresentEmpower = new PresentEmpowerClass();

const AffixBaseConfig = {
  simple: {
    description(data, effect) {
      return `<b>x10</b> EP & Eternities gain multiplier. [Ex]`;
    },
    effect(data) {
      return DC.E1.pow(data.spellPower);
    },
    process(data) {
      data.multiplier = data.multiplier.mul(this.effect(data));
    },
    cost: 10,
  },
  bright: {
    description(data, effect) {
      return `Instantly gain an Antimatter Galaxy. This effect is floored after applying spell power. [E+]`;
    },
    effect(data) {
      return data.spellPower.floor();
    },
    process(data) {
      data.instantGalaxies = data.instantGalaxies.add(1);
    },
    cost: 10,
  },
  warping: {
    description(data, effect) {
      return `Instantly warp 10 minute for Space Researches and Replicanti. [Et]`;
    },
    effect(data) {
      return new Decimal(600).mul(data.spellPower);
    },
    process(data) {
      data.directMultiplier = data.directMultiplier.mul(this.effect(data));
    },
    cost: 10,
  },
  waving: {
    description(data, effect) {
      return `+20% spell power for the next affix, then -20% for the next after that, then repeat. [Ep+]`;
    },
    effect(data) {
      return new Decimal(0.2).mul(data.spellPower);
    },
    process(data) {
      this.pending(data).mount();
    },
    pending(data) {
      return new PendingEvent({
        delay: 1,
        extras: true,
        data,
        process(obj) {
          obj.data.tempSpellPower = obj.data.tempSpellPower.add(obj.extras ? 0.2 : -0.2);
          obj.event.mount();
          return !obj.extras;
        },
      });
    },
    cost: 10,
  },
  accelerating: {
    description(data, effect) {
      return `+20% spell power for the following consecutive affixes with increasing costs. The next one is always affected. [Ep+]`;
    },
    effect(data) {
      return new Decimal(0.2).mul(data.spellPower);
    },
    process(data) {
      this.pending(data).mount();
    },
    pending(data) {
      return new PendingEvent({
        delay: 1,
        extras: -1,
        data,
        process(obj) {
          if (obj.currentAffix.cost <= this.extras) return;
          obj.data.tempSpellPower = obj.data.tempSpellPower.add(0.2);
          obj.event.mount();
          return obj.extras++;
        },
      });
    },
    cost: 10,
  },
  cursing: {
    description(data, effect) {
      return `The spell power and cost of the next affix is multiplied by -1. Useless if the next one is not affected by spell power. [En]`;
    },
    noSpellPower: true,
    effect(data) {
      return new Decimal(-1);
    },
    process(data) {
      this.pending(data).mount();
    },
    pending(data) {
      return new PendingEvent({
        delay: 1,
        extras: true,
        data,
        process(obj) {
          obj.data.tempSpellPower = obj.data.tempSpellPower.add(obj.extras ? 0.2 : -0.2);
          obj.event.mount();
          return !obj.extras;
        },
      });
    },
    cost: 0,
  },
};

export const Affixes = {};
for (const [key, config] of Object.entries(AffixBaseConfig)) {
  Affixes[key] = new Affix(config);
}

/**
 * Run a spell by processing an array of affix names in sequence.
 * @param {string[]} affixNames - Array of affix names to process (e.g. ["simple", "bright"])
 * @param {Decimal|number} [baseSpellPower=DC.D1] - Base spell power for the spell
 * @returns {SpellData} The populated spell data after all affixes have been processed
 */
export function runSpell(affixNames, baseSpellPower = DC.D1) {
  const data = new SpellData();
  data.spellPower = new Decimal(baseSpellPower);

  for (const name of affixNames) {
    // Count down pending events before processing this affix
    for (const event of [...data.pending]) {
      event.count(Affixes[name]);
    }

    const affix = Affixes[name];
    if (!affix || !affix.unlocked) continue;

    // Accumulate mana cost
    data.manaCost += affix.cost;

    // Apply the affix's effect to the spell data
    affix.process(data);
  }

  return data;
}
