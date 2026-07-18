import { DC } from "../../../constants";
import { Affix } from "./affix";
import { PendingEvent } from "./pendingEvent";

export class SpellData {
  constructor() {
    this.spellPower = DC.D1;
    this.tempSpellPower = DC.D0;
    this.tempCostModifier = 0;

    this.epMultiplier = DC.D1;

    this.instantGalaxies = DC.D0;
    this.warpTime = DC.D0;

    this.pending = new Set();
    this.manaCost = 0;
  }

  get totalSpellPower() {
    return this.spellPower.add(this.tempSpellPower);
  }
}

export class SpellEffectData {
  constructor() {
    this.epMultiplier = DC.D1;
    this.instantGalaxies = DC.D0;
    this.warpTime = DC.D0;
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
    return 100; // TODO: scale based on game progress
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
    if (this.selectedAffixes.length >= 13) return;
    if (this.selectedAffixes.includes(affixName)) return;
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
    this.data.editingSpellIndex = -1;
  }

  /**
   * Create a spell from currently selected affixes and add it to the spells list,
   * or replace an existing spell if editing.
   * @returns {SpellData|null}
   */
  createSpell() {
    if (this.selectedAffixes.length === 0) return null;
    if (this.selectedAffixes.length > 13) return null;

    const editingIdx = this.data.editingSpellIndex;
    const isEditing = editingIdx >= 0 && editingIdx < this.spells.length;

    if (!isEditing && this.spells.length >= 13) return null;

    const spellData = simulateSpellData(this.selectedAffixes, this.selectedAffixes.length, DC.D1);
    if (spellData.manaCost < 10) {
      this.clearSelection();
      return null;
    }

    spellData.pending.clear();

    const name = isEditing ? this.spells[editingIdx].name : `Spell ${this.spells.length + 1}`;

    const spell = {
      name,
      affixes: [...this.selectedAffixes],
      data: spellData,
    };

    if (isEditing) {
      this.spells.splice(editingIdx, 1, spell);
    } else {
      this.spells.push(spell);
    }
    this.clearSelection();
    return spellData;
  }

  /**
   * Remove a spell at the given index.
   * @param {number} index
   */
  deleteSpell(index) {
    if (index >= 0 && index < this.spells.length) {
      this.spells.splice(index, 1);
    }
  }

  /**
   * Rename a spell. Name is clamped to 8 characters.
   * @param {number} index
   * @param {string} newName
   */
  renameSpell(index, newName) {
    if (index >= 0 && index < this.spells.length) {
      this.spells[index].name = newName.slice(0, 8);
    }
  }

  /**
   * Load a spell's affixes into the assembly for editing.
   * @param {number} index
   */
  loadSpellToAssembly(index) {
    if (index < 0 || index >= this.spells.length) return;
    this.clearSelection();
    const spell = this.spells[index];
    this.data.editingSpellIndex = index;
    for (const name of spell.affixes) {
      this.selectedAffixes.push(name);
    }
  }

  /**
   * Cast a spell: deduct mana and apply its effects to the total effects pool.
   * @param {number} index
   * @returns {boolean} Whether the cast was successful
   */
  castSpell(index) {
    if (index < 0 || index >= this.spells.length) return false;
    const spell = this.spells[index];
    if (spell.data.manaCost > this.mana) return false;

    this.mana -= spell.data.manaCost;
    this.applyEffects(spell.data);
    return true;
  }

  /**
   * Merge a SpellData's effects into the player's totalEffects.
   * @param {SpellData} spellData
   */
  applyEffects(spellData) {
    const total = this.totalEffects;
    total.epMultiplier = new Decimal(total.epMultiplier).mul(spellData.epMultiplier);
    total.instantGalaxies = new Decimal(total.instantGalaxies).add(spellData.instantGalaxies);
    total.warpTime = new Decimal(total.warpTime).add(spellData.warpTime);
  }

  /**
   * Returns the cumulative total effects from all spells cast so far.
   * @returns {SpellEffectData}
   */
  get totalEffects() {
    return this.data.totalEffects;
  }

  get _defaultEffects() {
    return new SpellEffectData();
  }

  /**
   * Reset all cumulative effects back to their initial values.
   */
  resetEffects() {
    const def = this._defaultEffects;
    const total = this.data.totalEffects;
    for (const key of Object.keys(def)) {
      total[key] = def[key];
    }
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
      data.epMultiplier = data.epMultiplier.mul(this.effect(data));
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
        baseEffect: this.effect(data),
        process(obj) {
          obj.data.tempSpellPower = obj.data.tempSpellPower.add(obj.extras ? obj.baseEffect : obj.baseEffect.neg());
          obj.event.mount();
          return !obj.extras;
        },
      });
    },
    cost: 10,
  },
  accel: {
    name: "accel",
    description(data, effect) {
      return `+25% spell power for the following consecutive affixes with increasing costs. The next one is always affected. [Ep+]`;
    },
    effect(data) {
      return new Decimal(0.25).mul(data.totalSpellPower);
    },
    process(data) {
      this.pending(data).mount();
    },
    pending(data) {
      return new PendingEvent({
        delay: 1,
        extras: -1,
        data,
        baseEffect: this.effect(data),
        process(obj) {
          if (obj.currentAffix.cost <= this.extras) return;
          obj.data.tempSpellPower = obj.data.tempSpellPower.add(obj.baseEffect);
          obj.event.mount();
          return obj.currentAffix.cost;
        },
      });
    },
    cost: 10,
  },
  cursing: {
    name: "cursing",
    description(data, effect) {
      return `The spell power and cost of the next affix is multiplied by -1. Useless if the next one is not affected by spell power. [En]`;
    },
    noSpellPower: true,
    debuff: true,
    effect(data) {
      return new Decimal(-2);
    },
    process(data) {
      this.pending(data).mount();
    },
    pending(data) {
      return new PendingEvent({
        delay: 1,
        extras: true,
        data,
        baseEffect: this.effect(data),
        process(obj) {
          if (obj.currentAffix.noSpellPower) return;
          obj.data.tempSpellPower = obj.data.totalSpellPower.mul(obj.baseEffect);
          obj.data.tempCostModifier = obj.currentAffix.cost * obj.baseEffect.toNumber();
        },
      });
    },
    cost: 5,
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
    data.tempSpellPower = DC.D0;
    data.tempCostModifier = 0;

    // Count down pending events before processing this affix
    for (const event of [...data.pending]) {
      event.count(Affixes[name]);
    }

    const affix = Affixes[name];
    if (!affix || !affix.unlocked) continue;

    // Accumulate mana cost (with modifier from pending events)
    const actualCost = affix.cost + data.tempCostModifier;
    data.manaCost += actualCost;

    // Apply the affix's effect to the spell data
    affix.process(data);
  }

  return data;
}

/**
 * Simulate the SpellData context just before the affix at targetIndex would process.
 * Used for tooltip descriptions to show accurate effect values.
 * Processes all affixes before targetIndex and applies pending events for targetIndex.
 * @param {string[]} affixNames
 * @param {number} targetIndex
 * @param {Decimal|number} [baseSpellPower=DC.D1]
 * @returns {SpellData}
 */
export function simulateSpellData(affixNames, targetIndex, baseSpellPower = DC.D1) {
  const data = new SpellData();
  data.spellPower = new Decimal(baseSpellPower);

  for (let i = 0; i < Math.min(targetIndex + 1, affixNames.length); i++) {
    const name = affixNames[i];
    data.tempSpellPower = DC.D0;
    data.tempCostModifier = 0;

    // Count down pending events before this affix
    for (const event of [...data.pending]) {
      event.count(Affixes[name]);
    }

    // Stop before processing the target affix — we only want pending effects
    if (i === targetIndex) break;

    const affix = Affixes[name];
    if (!affix || !affix.unlocked) continue;

    const actualCost = affix.cost + data.tempCostModifier;
    data.manaCost += actualCost;
    affix.process(data);
  }

  return data;
}

/**
 * Build an array of human-readable effect summary lines from a SpellData.
 * @param {SpellData} data
 * @returns {string[]}
 */
export function spellEffectSummary(data) {
  const lines = [];
  const epMult = new Decimal(data.epMultiplier ?? 1);
  if (epMult.neq(1)) {
    lines.push(`EP & Eternities: ${formatX(epMult, 2, 2)}`);
  }
  const galaxies = new Decimal(data.instantGalaxies ?? 0);
  if (galaxies.gt(0)) {
    lines.push(`Instant Galaxies: ${formatAdd(galaxies)}`);
  }
  const warp = new Decimal(data.warpTime ?? 0);
  if (warp.gt(0)) {
    lines.push(`Warp Time: ${TimeSpan.fromSeconds(warp.toNumber()).toStringShort()}`);
  }
  return lines;
}
