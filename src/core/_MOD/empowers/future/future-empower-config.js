import { DC } from "../../../constants";

// Reference balance values; level is the number of upgrades earned by each sphere.
export const futureEmpowerConfig = {
  defaultOrb: "replicanti",
  orbit: {
    radius: 180,
    period: 30000,
  },
  satellites: {
    capacity: 24,
    period: 8000,
  },
  orbs: {
    replicanti: {
      id: "replicanti",
      name: "Replicanti",
      symbol: "Ξ",
      color: "#03a9f4",
      description: "Upgrading resets Replicanti to zero.",
      resource: () => Currency.replicanti.value,
      resetResource: () => { player.replicanti.amount = new Decimal(0); },
      isUnlocked: () => player.replicanti.unl,
      costScaling: {
        baseCost: DC.E100,
        baseIncrease: DC.E100,
        costScale: DC.D1,
        purchasesBeforeScaling: DC.BEMAX,
      },
      bonusDescription: "Multiply Replicanti speed by 2 per level.",
      effect: level => Decimal.pow(2, level),
    },
    eternities: {
      id: "eternities",
      name: "Eternities",
      symbol: "Δ",
      color: "#b341e0",
      description: "Upgrading resets Eternities to zero.",
      resource: () => Currency.eternities.value,
      resetResource: () => { player.eternities = new Decimal(0); },
      isUnlocked: () => PlayerProgress.eternityUnlocked(),
      costScaling: {
        baseCost: DC.E1,
        baseIncrease: DC.E1,
        costScale: DC.D1,
        purchasesBeforeScaling: DC.BEMAX,
      },
      bonusDescription: "Multiply Eternities gained by 2 per level.",
      effect: level => Decimal.pow(2, level),
    },
    infinities: {
      id: "infinities",
      name: "Infinities",
      symbol: "∞",
      color: "#b67f33",
      description: "Upgrading resets Infinities to zero. Banked Infinities do not count.",
      resource: () => Currency.infinities.value,
      resetResource: () => { player.infinities = new Decimal(0); },
      isUnlocked: () => PlayerProgress.infinityUnlocked(),
      costScaling: {
        baseCost: DC.E3,
        baseIncrease: DC.E3,
        costScale: DC.D1,
        purchasesBeforeScaling: DC.BEMAX,
      },
      bonusDescription: "Multiply Infinities gained by 2 per level.",
      effect: level => Decimal.pow(2, level),
    },
  },
};

export function createFutureEmpowerData() {
  return {
    selectedOrb: futureEmpowerConfig.defaultOrb,
    orbs: Object.fromEntries(Object.keys(futureEmpowerConfig.orbs).map(id => [id, { level: new Decimal(0) }])),
  };
}
