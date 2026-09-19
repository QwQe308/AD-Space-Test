import { DC } from "../../../constants";

// Reference balance values; level is the number of upgrades already earned or purchased.
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
      description: "Upgrade using your current Replicanti, then reset Replicanti to zero.",
      resource: () => Currency.replicanti.value,
      resetResource: () => { player.replicanti.amount = new Decimal(0); },
      isUnlocked: () => player.replicanti.unl,
      costScaling: {
        baseCost: DC.E100,
        baseIncrease: DC.E100,
        costScale: DC.D1,
        purchasesBeforeScaling: DC.BEMAX,
      },
      insightGain: (level, count = DC.D1) => count,
    },
    eternities: {
      id: "eternities",
      name: "Eternities",
      symbol: "Δ",
      color: "#b341e0",
      description: "Upgrade using your current Eternities, then reset Eternities to zero.",
      resource: () => Currency.eternities.value,
      resetResource: () => { player.eternities = new Decimal(0); },
      isUnlocked: () => PlayerProgress.eternityUnlocked(),
      costScaling: {
        baseCost: DC.E1,
        baseIncrease: DC.E1,
        costScale: DC.D1,
        purchasesBeforeScaling: DC.BEMAX,
      },
      insightGain: (level, count = DC.D1) => count,
    },
    infinities: {
      id: "infinities",
      name: "Infinities",
      symbol: "∞",
      color: "#b67f33",
      description: "Upgrade using current Infinities, then reset them to zero. Banked Infinities do not count.",
      resource: () => Currency.infinities.value,
      resetResource: () => { player.infinities = new Decimal(0); },
      isUnlocked: () => PlayerProgress.infinityUnlocked(),
      costScaling: {
        baseCost: DC.E3,
        baseIncrease: DC.E3,
        costScale: DC.D1,
        purchasesBeforeScaling: DC.BEMAX,
      },
      insightGain: (level, count = DC.D1) => count,
    },
  },
  upgrades: {
    replicanti: {
      id: "replicanti",
      name: "Replicated Future",
      symbol: "Ξ",
      description: "Multiply Replicanti speed by 2 per level.",
      cost: level => Decimal.pow(2, level),
      effect: level => Decimal.pow(2, level),
      maxLevel: new Decimal(100),
    },
    eternities: {
      id: "eternities",
      name: "Eternal Future",
      symbol: "Δ",
      description: "Multiply Eternities gained by 2 per level.",
      cost: level => Decimal.pow(2, level),
      effect: level => Decimal.pow(2, level),
      maxLevel: new Decimal(100),
    },
    infinities: {
      id: "infinities",
      name: "Infinite Future",
      symbol: "∞",
      description: "Multiply Infinities gained by 2 per level.",
      cost: level => Decimal.pow(2, level),
      effect: level => Decimal.pow(2, level),
      maxLevel: new Decimal(100),
    },
  },
};

export function createFutureEmpowerData() {
  return {
    insight: new Decimal(0),
    selectedOrb: futureEmpowerConfig.defaultOrb,
    orbs: Object.fromEntries(Object.keys(futureEmpowerConfig.orbs).map(id => [id, { level: new Decimal(0) }])),
    upgrades: Object.fromEntries(Object.keys(futureEmpowerConfig.upgrades).map(id => [id, { level: new Decimal(0) }])),
  };
}
