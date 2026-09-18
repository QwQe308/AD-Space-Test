import { DC } from "../../../constants";

// Reference balance values; level is the number of upgrades already earned or purchased.
export const futureEmpowerConfig = {
  defaultOrb: "replicanti",
  orbit: {
    radius: 180,
    period: 30000,
  },
  orbs: {
    replicanti: {
      id: "replicanti",
      name: "Replicanti",
      symbol: "Ξ",
      color: "#03a9f4",
      description: "Reach the required current Replicanti amount to gain insight. Replicanti are not spent.",
      resource: () => Currency.replicanti.value,
      isUnlocked: () => player.replicanti.unl,
      requirement: level => Decimal.pow(10, level.add(1).mul(100)),
      insightGain: () => DC.D1,
    },
    eternities: {
      id: "eternities",
      name: "Eternities",
      symbol: "Δ",
      color: "#b341e0",
      description: "Reach the required current Eternities to gain insight. Eternities are not spent.",
      resource: () => Currency.eternities.value,
      isUnlocked: () => PlayerProgress.eternityUnlocked(),
      requirement: level => Decimal.pow(10, level.add(1)),
      insightGain: () => DC.D1,
    },
    infinities: {
      id: "infinities",
      name: "Infinities",
      symbol: "∞",
      color: "#b67f33",
      description: "Reach the required current Infinities to gain insight. Banked Infinities do not count.",
      resource: () => Currency.infinities.value,
      isUnlocked: () => PlayerProgress.infinityUnlocked(),
      requirement: level => Decimal.pow(10, level.add(1).mul(3)),
      insightGain: () => DC.D1,
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
