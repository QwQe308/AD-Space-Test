import { NODE_TYPE, quickSpawnResearches } from "../abyssResearchSpawner";
import { DC } from "../../../../constants";

function getEternityTotalState() {
  return AbyssResearches.PST.completed + AbyssResearches.PRS.completed + AbyssResearches.FTR.completed;
}

function getEternityStateCompleted(id) {
  return AbyssResearches[id].completed;
}

const baseConfig = {
  // ARs taken from depth 0.
  A21B: {
    position: [-2, -1],
    type: NODE_TYPE.SINGLE,
    cost: new Decimal(1e4),
    permanent: true,
    description(level) {
      return `Infinity resets will keep your Replicanti, and only reset half your Replicanti Galaxies.`;
    },
    next: [],
  },
  A6B: {
    position: [2, -1],
    type: NODE_TYPE.SINGLE,
    cost: new Decimal(75),
    permanent: true,
    description(level) {
      return `+ 1 max concurrent Abyss Researches`;
    },
    effectValue(level) {
      return 1;
    },
    next: [],
  },
  A7B: {
    position: [-1, -2],
    type: NODE_TYPE.SINGLE,
    cost: new Decimal(50),
    permanent: true,
    description(level) {
      return `Start with 1e10 AM (pre-space nerf)`;
    },
    effectValue(level) {
      return new Decimal(1e10);
    },
    onLevelUp(pre, now) {
      Currency.antimatter.bumpTo(1e10);
    },
    tooltipTags: ["Restrictions"],
    next: [],
  },
  A16B: {
    position: [-1, 2],
    type: NODE_TYPE.SINGLE,
    cost: new Decimal(5000),
    permanent: true,
    description(level) {
      return `Galaxies won't reset Dimensional Boosts (After eternity)`;
    },
    next: [],
  },

  // New ARs.

  B0: {
    position: [0, 0],
    type: NODE_TYPE.UNLIMITED,
    scaling: {
      type: "linear",
      cost: new Decimal(1e4),
      costIncrease: new Decimal(2),
    },
    description(level) {
      return `Since then, the "toturial" has ended, and the path to reality has emerged.<br>Multiplies EP gain by 2 for each level.<br>
      (×${format(this.effectValue(level), 2, 2)} → ×${format(this.effectValue(level.add(1)), 2, 2)})`;
    },
    effectValue(level) {
      return DC.D2.pow(level);
    },
    next: ["B1"],
  },
  B1: {
    position: [1, 1],
    type: NODE_TYPE.UNLIMITED,
    scaling: {
      type: "linear",
      cost: new Decimal(1e4),
      costIncrease: new Decimal(2),
    },
    description(level) {
      return `Get ready for challenges.<br>Multiplies all TD multiplier by 2 for each level.<br>
      (×${format(this.effectValue(level), 2, 2)} → ×${format(this.effectValue(level.add(1)), 2, 2)})`;
    },
    effectValue(level) {
      return DC.D2.pow(level);
    },
    next: ["B3"],
  },
  B2: {
    position: [-1, 1],
    type: NODE_TYPE.UNLIMITED,
    scaling: {
      type: "linear",
      cost: new Decimal(1e4),
      costIncrease: new Decimal(3),
    },
    description(level) {
      return `Storms cannot stop us.<br>Multiplies effective space by 1.06 for each level.<br>
      (×${format(this.effectValue(level), 2, 2)} → ×${format(this.effectValue(level.add(1)), 2, 2)})`;
    },
    effectValue(level) {
      return Decimal.pow(1.06, level);
    },
    next: ["B3"],
  },
  B3: {
    position: [0, 2],
    type: NODE_TYPE.CORRUPTION,
    cost: 30,
    description(level) {
      return `Set all Time Studies' cost to 0. You can select an extra study out of your path in the spilt.`;
    },
    next: ["B1"],
  },

  // Empowers
  PST: {
    position: [-2, 3],
    type: NODE_TYPE.CORRUPTION,
    cost: () => 30 + 30 * getEternityTotalState(),
    description(level) {
      let baseInfo = `To complete the power of eternity, we need to revise the PAST.`;
      if (getEternityStateCompleted("PST")) return baseInfo;
      baseInfo += `\n\n--------Difficultity--------\n\n`;
      switch (getEternityTotalState()) {
        // No empowers
        case 0:
          baseInfo += `Time ----- ◆◆◇◇◇\n`;
          baseInfo += `Strategy - ◆◆◇◇◇\n`;
          baseInfo += `Active --- ◆◆◆◆◇\n`;
      }
      return baseInfo;
    },
  },
};

quickSpawnResearches(baseConfig, "1");

export const AbyssResearchesDepth1 = baseConfig;
