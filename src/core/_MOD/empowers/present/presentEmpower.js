import { Affix } from "./affix";
import { PendingEvent } from "./pendingEvent";

class SpellData {
  // Initialize
  constructor() {
    this.spellPower = DC.D1;
    this.tempSpellPower = DC.D0;
    this.multiplier = DC.D1;
    this.directMultilpier = DC.D1;

    this.instantGalaxies = DC.D0;
  }

  get totalSpellPower() {
    return this.spellPower.add(this.tempSpellPower);
  }
}
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

const AffixBaseConfig = {
  simple: {
    description: (data, effect) => `<b>x10</b> EP & Eternities gain multiplier. [Ex]`,
    effect: (data) => DC.E1.pow(data.spellPower),
    process: (data) => (data.multiplier = data.multiplier.mul(this.effect(data))),
    cost: 10,
  },
  bright: {
    description: (data, effect) =>
      `Instantly gain an Antimatter Galaxy. This effect is floored after applying spell power. [E+]`,
    effect: (data) => data.spellPower.floor(),
    process: (data) => (data.instantGalaxies = data.instantGalaxies.add(1)),
    cost: 10,
  },
  warping: {
    description: (data, effect) => `Instantly warp 10 minute for Space Researches and Replicanti. [Et]`,
    effect: (data) => new Decimal(600).mul(data.spellPower),
    process: (data) => (data.directMultilpier = data.directMultilpier.mul(this.effect(data))),
    cost: 10,
  },
  waving: {
    description: (data, effect) =>
      `+20% spell power for the next affix, then -20% for the next after that, then repeat. [Ep+]`,
    effect: (data) => new Decimal(0.2).mul(data.spellPower),
    process: (data) => this.pending(data).mount(),
    pending: (data) =>
      new PendingEvent({
        delay: 1,
        extras: true,
        data: data,
        process(obj) {
          obj.data.tempSpellPower = obj.data.tempSpellPower.add(obj.extras ? 0.2 : -0.2);
          obj.event.mount();
          return !obj.extras;
        },
      }),
    cost: 10,
  },
  accelerating: {
    description: (data, effect) =>
      `+20% spell power for the following consecutive affixes with increasing costs. The next one is always affected. [Ep+]`,
    effect: (data) => new Decimal(0.2).mul(data.spellPower),
    process: (data) => this.pending(data).mount(),
    pending: (data) =>
      new PendingEvent({
        delay: 1,
        extras: -1,
        data: data,
        process(obj) {
          if (obj.currentAffix.cost <= this.extras) return;
          obj.data.tempSpellPower = obj.data.tempSpellPower.add(0.2);
          obj.event.mount();
          return obj.extras++;
        },
      }),
    cost: 10,
  },
  cursing: {
    description: (data, effect) =>
      `The spell power and cost of the next affix is multiplied by -1. Useless if the next one is not affected by spell power. [En]`,
    noSpellPower: true,
    effect: (data) => new Decimal(-1),
    process: (data) => this.pending(data).mount(),
    pending: (data) =>
      new PendingEvent({
        delay: 1,
        extras: true,
        data: data,
        process(obj) {
          obj.data.tempSpellPower = obj.data.tempSpellPower.add(obj.extras ? 0.2 : -0.2);
          obj.event.mount();
          return !obj.extras;
        },
      }),
    cost: 0,
  },
};
