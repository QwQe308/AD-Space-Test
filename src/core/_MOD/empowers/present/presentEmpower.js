import { DC } from "../../../constants";
import { Affix } from "./affix";
import { PendingEvent } from "./pendingEvent";

export class SpellData {
  constructor() {
    this.spellPower = DC.D1;
    this.tempSpellPower = DC.D0;
    this.multiplier = DC.D1;
    this.directMultiplier = DC.D1;

    this.instantGalaxies = DC.D0;
    this.warpTime = DC.D0;

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

  get maxMana() {
    return this.data.maxMana;
  }

  set maxMana(newVal) {
    this.data.maxMana = newVal;
  }

  get spells() {
    return this.data.spells;
  }

  get selectedAffixes() {
    return this.data.selectedAffixes;
  }

  get manaPercentage() {
    return this.maxMana === 0 ? 0 : this.mana / this.maxMana;
  }

  /**
   * Add an affix to the selection list for spell assembly.
   * @param {string} affixName
   */
  selectAffix(affixName) {
    if (this.selectedAffixes.length >= 8) return;
    const affix = Affixes[affixName];
    if (!affix || !affix.unlocked) return;
    this.selectedAffixes.push(affixName);
  }

  /**
   * Remove the last selected affix from the assembly list.
   */
  deselectLast() {
    this.selectedAffixes.pop();
  }

  /**
   * Remove the affix at the given index from the assembly list.
   * @param {number} index
   */
  removeAffixAt(index) {
    if (index >= 0 && index < this.selectedAffixes.length) {
      this.selectedAffixes.splice(index, 1);
    }
  }

  /**
   * Clear all selected affixes.
   */
  clearSelection() {
    this.selectedAffixes.length = 0;
  }

  /**
   * Create a spell from currently selected affixes and add it to the spells list.
   * @returns {SpellData|null}
   */
  createSpell() {
    if (this.selectedAffixes.length === 0) return null;
    if (this.spells.length >= 8) return null;
    if (this.selectedAffixes.length > 8) return null;

    const spellData = runSpell(this.selectedAffixes, DC.D1);
    if (spellData.manaCost > this.mana) {
      this.clearSelection();
      return null;
    }

    this.mana -= spellData.manaCost;
    // Clear pending Set before storing — PendingEvent objects must not enter player state
    spellData.pending.clear();
    this.spells.push({
      affixes: [...this.selectedAffixes],
      data: spellData,
    });
    this.clearSelection();
    return spellData;
  }
}

export const PresentEmpower = new PresentEmpowerClass();

const AffixBaseConfig = {
  simple: {
    name: "simple",
    description(data, effect) {
      return `<b>x10</b> EP & Eternities gain multiplier. [Ex]`;
    },
    effect(data) {
      return DC.E1.pow(data.totalSpellPower);
    },
    process(data) {
      data.multiplier = data.multiplier.mul(this.effect(data));
    },
    cost: 10,
  },
  bright: {
    name: "bright",
    description(data, effect) {
      return `Instantly gain an Antimatter Galaxy. This effect is floored after applying spell power. [E+]`;
    },
    effect(data) {
      return data.totalSpellPower.floor();
    },
    process(data) {
      data.instantGalaxies = data.instantGalaxies.add(1);
    },
    cost: 10,
  },
  warping: {
    name: "warping",
    description(data, effect) {
      return `Instantly warp 10 minute for Space Researches and Replicanti. [Et]`;
    },
    effect(data) {
      return new Decimal(600).mul(data.totalSpellPower);
    },
    process(data) {
      data.warpTime = data.warpTime.add(this.effect(data));
    },
    cost: 5,
  },
  waving: {
    name: "waving",
    description(data, effect) {
      return `+20% spell power for the next affix, then -20% for the next after that, then repeat. [Ep+]`;
    },
    effect(data) {
      return new Decimal(0.2).mul(data.totalSpellPower);
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
    name: "accelerating",
    description(data, effect) {
      return `+20% spell power for the following consecutive affixes with increasing costs. The next one is always affected. [Ep+]`;
    },
    effect(data) {
      return new Decimal(0.2).mul(data.totalSpellPower);
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
          return obj.currentAffix.cost;
        },
      });
    },
    cost: 15,
  },
  cursing: {
    name: "cursing",
    description(data, effect) {
      return `The spell power and cost of the next affix is multiplied by -1. Useless if the next one is not affected by spell power. [En]`;
    },
    noSpellPower: true,
    debuff: true,
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
          obj.data.tempSpellPower = obj.data.totalSpellPower.mul(-2);
          obj.data.nextCostModifier = obj.currentAffix.cost * -2;
          obj.event.mount();
        },
      });
    },
    cost: 0,
  },
};

export const Affixes = mapGameDataToObject(
  AffixBaseConfig,
  config => new Affix(config)
);

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
    data.tempSpellPower = DC.D0

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
