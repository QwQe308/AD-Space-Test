import { quickSpawnResearches } from "../abyssResearches";
import { DC } from "../../../../constants";

let baseConfig = {
  A1: {
    position: [0, 0],
    type: "unlimited",
    scaling: {
      type: "linear",
      cost: new Decimal(10),
      costIncrease: new Decimal(2),
    },
    description(level) {
      return `Antimatter x2 per level.<br>(x${format(this.effectValue(level))} -> x${format(this.effectValue(level.add(1)))})`;
    },
    effectValue(level) {
      return level.pow_base(2);
    },
    next: ["A2"],
  },
  A2: {
    position: [1, 1],
    type: "single",
    cost: DC.E2,
    description(level) {
      return `Space /1.1 (test)`;
    },
    effect(level) {
      return new Decimal(1.1);
    },
    next: [],
  },
};

quickSpawnResearches(baseConfig, "1");

export const AbyssResearchesDepth1 = baseConfig;
