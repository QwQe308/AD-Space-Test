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
      resetResource: () => {
        player.replicanti.amount = new Decimal(0);
      },
      isUnlocked: () => player.replicanti.unl,
      costScaling: {
        baseCost: DC.E100,
        baseIncrease: DC.E100,
        costScale: DC.D1,
        purchasesBeforeScaling: DC.BEMAX,
      },
      bonusDescription: "Replicanti slowdown is weakened.",
      effect: (level) => level.add(10).log10(),
      formatEffect: (value) =>
        `x${format(Decimal.root(ReplicantiGrowth.scaleFactor, value), 2, 2)} / ${format(
          Number.MAX_VALUE,
          2,
          2
        )} → x${format(ReplicantiGrowth.scaleFactor, 2, 2)} / ${format(Number.MAX_VALUE, 2, 2)} `,
    },
    eternities: {
      id: "eternities",
      name: "Eternities",
      symbol: "Δ",
      color: "#b341e0",
      description: "Upgrading resets Eternities to zero.",
      resource: () => Currency.eternities.value,
      resetResource: () => {
        player.eternities = new Decimal(0);
      },
      isUnlocked: () => PlayerProgress.eternityUnlocked(),
      costScaling: {
        baseCost: DC.E1,
        baseIncrease: DC.E1,
        costScale: DC.D1,
        purchasesBeforeScaling: DC.BEMAX,
      },
      bonusDescription: "Multiply Eternities gained by 2 per level.",
      effect: (level) => Decimal.pow(2, level),
      formatEffect: (value) => formatX(value, 2, 0),
    },
    infinities: {
      id: "infinities",
      name: "Infinities",
      symbol: "∞",
      color: "#b67f33",
      description: "Upgrading resets Infinities to zero. Banked Infinities do not count.",
      resource: () => Currency.infinities.value,
      resetResource: () => {
        player.infinities = new Decimal(0);
      },
      isUnlocked: () => PlayerProgress.infinityUnlocked(),
      costScaling: {
        baseCost: DC.E3,
        baseIncrease: DC.E3,
        costScale: DC.D1,
        purchasesBeforeScaling: DC.BEMAX,
      },
      bonusDescription: "Multiply Infinities gained by 2 per level.",
      effect: (level) => Decimal.pow(2, level),
      formatEffect: (value) => formatX(value, 2, 0),
    },
  },
};

export function createFutureEmpowerData() {
  return {
    selectedOrb: futureEmpowerConfig.defaultOrb,
    orbs: Object.fromEntries(Object.keys(futureEmpowerConfig.orbs).map((id) => [id, { level: new Decimal(0) }])),
  };
}

