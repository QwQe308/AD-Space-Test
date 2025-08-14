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
      return `Antimatter x2 per level<br>(×${format(this.effectValue(level))} → ×${format(this.effectValue(level.add(1)))})`;
    },
    effectValue(level) {
      return level.pow_base(2);
    },
    tooltipTags:[],
    next: ["A2", "A3"],
  },
//following researches are not done
  A2: {
    position: [-1, 1],
    type: "single",
    cost: new Decimal(20),
    description(level) {
      return `+ 4 free Tickspeed Upgrades`;
    },
    effectValue(level) {
      return new Decimal(4);
    },
    tooltipTags:[],
    next: ["A4","A5"],
  },
  A3: {
    position: [1, 1],
    type: "single",
    cost: new Decimal(20),
    description(level) {
      return `x2 Research Speed (RS)`;
    },
    effectValue(level) {
      return new Decimal(2);
    },
    tooltipTags:["ARS"],
    next: [],
  },

  A4: {
    position: [-2, 2],
    type: "limited",
    maxLevel: new Decimal(2),
    scaling: {
      type: "linear",
      cost: new Decimal(40),
      costIncrease: new Decimal(1.5),
    },
    description(level) {
      if(this.maxLevel.eq(level)) return `/10 AD cost<br>(/${format(this.effectValue(level))})`
      return `/10 AD cost<br>(/${format(this.effectValue(level))} → /${format(this.effectValue(level.add(1)))})`;
    },
    effectValue(level) {
      return new Decimal(1.1);
    },
    tooltipTags:[],
    next: [],
  },
  A5: {
    position: [-1, 2],
    type: "single",
    cost: new Decimal(40),
    description(level) {
      return `Start with 1e10 AM`;
    },
    restriction(level) {
      return ;
    },
    restrictionInfo(level) {
      return ``;
    },
    effectValue(level) {
      return new Decimal(1.1);
    },
    tooltipTags:[],
    next: [],
  },

  
  A6: {
    position: [0, 2],
    type: "limited",
    maxLevel: new Decimal(2),
    scaling: {
      type: "linear",
      cost: new Decimal(50),
      costIncrease: new Decimal(2),
    },
    description(level) {
      if(this.maxLevel.eq(level)) return `+ 1 max concurrent Abyss Researches<br>(+${format(this.effectValue(level))}`
      return `+ 1 max concurrent Abyss Researches<br>(+${format(this.effectValue(level))} → +${format(this.effectValue(level.add(1)))})`;
    },
    effectValue(level) {
      return level.toNumber();
    },
    tooltipTags:[],
    next: [],
  },
};

quickSpawnResearches(baseConfig, "i");

export const AbyssResearchesDepth_i = baseConfig;
