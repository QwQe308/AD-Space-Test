import { quickSpawnResearches } from "../abyssResearches";
import { DC } from "../../../../constants";

let baseConfig = {
  //row 0
  A1: {
    position: [0, -2],
    type: "unlimited",
    scaling: {
      type: "linear",
      cost: new Decimal(10),
      costIncrease: new Decimal(2),
    },
    description(level) {
      return `Antimatter x2 per level<br>
      (×${format(this.effectValue(level))} → ×${format(this.effectValue(level.add(1)))})`;
    },
    effectValue(level) {
      return level.pow_base(2);
    },
    tooltipTags: ["Tips", "Shapes"],
    next: ["A2", "A3"],
  },

  //row 1
  A2: {
    position: [-1, -1],
    type: "single",
    cost: new Decimal(20),
    description(level) {
      return `+ 4 free Tickspeed Upgrades`;
    },
    effectValue(level) {
      return new Decimal(4);
    },
    next: ["A4", "A5", "A6"],
  },
  A3: {
    position: [1, -1],
    type: "single",
    cost: new Decimal(20),
    description(level) {
      return `x2 Research Speed (RS)`;
    },
    effectValue(level) {
      return new Decimal(2);
    },
    tooltipTags: ["ARS"],
    next: ["A6", "A7", "A8"],
  },

  //row 2
  A4: {
    position: [-2, 0],
    type: "limited",
    maxLevel: new Decimal(2),
    scaling: {
      type: "linear",
      cost: new Decimal(50),
      costIncrease: new Decimal(2),
    },
    description(level) {
      if (this.maxLevel.eq(level)) return `/10 Antimatter Dimensions' cost<br>(/${format(this.effectValue(level))})`;
      return `/10 Antimatter Dimensions' cost<br>(/${format(this.effectValue(level))} → /${format(this.effectValue(level.add(1)))})`;
    },
    effectValue(level) {
      return level.pow_base(10);
    },
    next: ["A9"],
  },
  A5: {
    position: [-1, 0],
    type: "single",
    cost: new Decimal(50),
    description(level) {
      return `Abyss Research Speed is 1% faster per Tickspeed Upgrade (additive, up to ×4, locked to max if infinitied once)
      <br>Current: ×${format(this.effectValue(), 2, 2)}`;
    },
    restrictionInfo(level) {
      return `Can afford at least 1 dimension for all unlocked AD`;
    },
    restrictionNerf(level) {
      return new Decimal(4);
    },
    checkRestriction(level) {
      return AntimatterDimensions.all.filter((x) => (x.isAvailableForPurchase ? x.isAffordable : true)).length === 8;
    },
    effectValue(level) {
      if (player.infinities.gt(0)) return new Decimal(4);
      return Tickspeed.totalUpgrades.mul(0.01).add(1).min(4);
    },
    tooltipTags: ["Restrictions"],
    next: ["A9"],
  },

  A6: {
    position: [0, 0],
    type: "single",
    cost: new Decimal(75),
    description(level) {
      return `+ 1 max concurrent Abyss Researches`;
    },
    effectValue(level) {
      return 1;
    },
    next: ["A9","A10"],
  },

  A7: {
    position: [1, 0],
    type: "single",
    cost: new Decimal(50),
    description(level) {
      return `Start with 1e25 AM (pre-space nerf)`;
    },
    restrictionInfo(level) {
      return `Tickspeed upgrades' amount is a prime lower than 308. (includes free ones)`;
    },
    restrictionNerf(level) {
      return new Decimal(3);
    },
    checkRestriction(level) {
      if (Tickspeed.totalUpgrades.gte(308)) return false;
      let primes = [
        2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97, 101, 103, 107,
        109, 113, 127, 131, 137, 139, 149, 151, 157, 163, 167, 173, 179, 181, 191, 193, 197, 199, 211, 223, 227, 229,
        233, 239, 241, 251, 257, 263, 269, 271, 277, 281, 283, 293, 307,
      ];
      return primes.includes(Math.round(Tickspeed.totalUpgrades.toNumber())); // break_eternity.js may have some precision losses so heres a round
    },
    effectValue(level) {
      return new Decimal(1e25);
    },
    tooltipTags: ["Restrictions"],
    next: ["A10"],
  },
  A8: {
    position: [2, 0],
    type: "limited",
    maxLevel: new Decimal(2),
    scaling: {
      type: "linear",
      cost: new Decimal(75),
      costIncrease: new Decimal(2),
    },
    description(level) {
      if (this.maxLevel.eq(level)) return `+ 1 free Dimensional Boost<br>(+${format(this.effectValue(level))})`;
      return `+ 1 free Dimensional Boost<br>(+${format(this.effectValue(level))} → +${format(
        this.effectValue(level.add(1))
      )})`;
    },
    effectValue(level) {
      return level;
    },
    next: ["A10"],
  },
  //row 4
  A9: {
    position: [-1, 1],
    type: "single",
    cost: new Decimal(250),
    description(level) {
      return `Double your Infinities(IS) gain & ARS is multplied by (IS+1)^0.25, up to ×4 (255 Infinities)`;
    },
    restrictionInfo(level) {
      return `Infinitied at least once`;
    },
    restrictionNerf(level) {
      return new Decimal(4);
    },
    checkRestriction(level) {
      return player.infinities.gte(1); // break_eternity.js may have some precision losses so heres a round
    },
    effectValue(level) {
      return player.infinities.add(1).pow(0.25).min(4);
    },
    tooltipTags: ["Restrictions", "ARS"],
    next: ["A11"],
  },
  
  A10: {
    position: [1, 1],
    type: "single",
    cost: new Decimal(250),
    description(level) {
      return `Double your IP gain`;
    },
    restrictionInfo(level) {
      return `Infinitied at least twice`;
    },
    restrictionNerf(level) {
      return new Decimal(4);
    },
    checkRestriction(level) {
      return player.infinities.gte(2); // break_eternity.js may have some precision losses so heres a round
    },
    effectValue(level) {
      return new Decimal(2);
    },
    tooltipTags: ["Restrictions"],
    next: ["A11"],
  },

  //row 5
  A11: {
    position: [0, 2],
    type: "single",
    cost: new Decimal(400),
    description(level) {
      return `Instant: [Complete all NC and multply IP by 2]`;
    },
    onLevelUp(pre, now){
      player.challenge.normal.completedBits = 8190
      player.infinityPoints = player.infinityPoints.mul(2)
    },
    tooltipTags: ["Instant Effect"],
    next: [],
  },
};

quickSpawnResearches(baseConfig, "0");

export const AbyssResearchesDepth_0 = baseConfig;
