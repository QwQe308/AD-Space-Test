import { quickSpawnResearches } from "../abyssResearches";
import { DC } from "../../../../constants";
import { Currency } from "../../../../currency";

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
      return `+ 6 free Tickspeed Upgrades`;
    },
    effectValue(level) {
      return new Decimal(6);
    },
    next: ["A4", "A5", "A6"],
  },
  A3: {
    position: [1, -1],
    type: "single",
    cost: new Decimal(20),
    description(level) {
      return `×3 Research Speed (RS)`;
    },
    effectValue(level) {
      return new Decimal(3);
    },
    tooltipTags: ["ARS"],
    next: ["A6", "A7", "A8"],
  },

  //row 2
  A4: {
    position: [-2, 0],
    type: "limited",
    maxLevel: new Decimal(3),
    scaling: {
      type: "linear",
      cost: new Decimal(50),
      costIncrease: new Decimal(2),
    },
    description(level) {
      if (this.maxLevel.eq(level)) return `/10 Antimatter Dimensions' cost<br>(/${format(this.effectValue(level))})`;
      return `/10 Antimatter Dimensions' cost<br>(/${format(this.effectValue(level))} → /${format(
        this.effectValue(level.add(1))
      )})`;
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
    next: ["A9", "A10"],
  },

  A7: {
    position: [1, 0],
    type: "single",
    cost: new Decimal(50),
    description(level) {
      return `Start with 1e30 AM (pre-space nerf)`;
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
      return new Decimal(1e30);
    },
    onLevelUp(pre, now) {
      Currency.antimatter.bumpTo(1e30);
    },
    tooltipTags: ["Restrictions"],
    next: ["A10"],
  },
  A8: {
    position: [2, 0],
    type: "limited",
    maxLevel: new Decimal(3),
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
    type: "unlimited",
    scaling: {
      type: "linear",
      cost: new Decimal(100),
      costIncrease: new Decimal(3),
    },
    description(level) {
      return `/1.08 Space<br>(/${format(this.effectValue(level), 2, 3)} → /${format(
        this.effectValue(level.add(1)),
        2,
        3
      )})`;
    },
    effectValue(level) {
      return level.pow_base(1.08);
    },
    next: ["A11"],
  },
  A10: {
    position: [1, 1],
    type: "unlimited",
    scaling: {
      type: "linear",
      cost: new Decimal(100),
      costIncrease: new Decimal(3),
    },
    description(level) {
      return `×1.02 Antimatter Dimensions' buy-10 multplier<br>(×${format(this.effectValue(level), 2, 3)} → ×${format(
        this.effectValue(level.add(1)),
        2,
        3
      )})`;
    },
    effectValue(level) {
      return level.pow_base(1.02);
    },
    next: ["A11"],
  },
  //row 5
  A11: {
    position: [0, 2],
    type: "unlimited",
    scaling: {
      type: "linear",
      cost: new Decimal(100),
      costIncrease: new Decimal(2),
    },
    description(level) {
      return `+5 Tickspeed Upgrades<br>(+${format(this.effectValue(level))} → +${format(
        this.effectValue(level.add(1))
      )})`;
    },
    effectValue(level) {
      return level.mul(5);
    },
    next: ["A12", "A13", "A14"],
  },

  //row 6
  A12: {
    position: [-1, 3],
    type: "single",
    cost: new Decimal(500),
    description(level) {
      return `Triples your Infinities(IS) gain`;
    },
    restrictionInfo(level) {
      return `Infinitied at least twice`;
    },
    restrictionNerf(level) {
      return new Decimal(6);
    },
    checkRestriction(level) {
      return player.infinities.gte(2); // break_eternity.js may have some precision losses so heres a round
    },
    effectValue(level) {
      return new Decimal(3);
    },
    tooltipTags: ["Restrictions"],
    next: ["A15"],
  },
  A13: {
    position: [0, 3],
    type: "single",
    cost: new Decimal(750),
    description(level) {
      return `Instant: [Complete all NC and multply IP by 2]`;
    },
    onLevelUp(pre, now) {
      player.challenge.normal.completedBits = 8190;
      player.infinityPoints = player.infinityPoints.mul(2);
    },
    restrictionInfo(level) {
      return `Infinitied at least twice`;
    },
    restrictionNerf(level) {
      return new Decimal(6);
    },
    checkRestriction(level) {
      return player.infinities.gte(2); // break_eternity.js may have some precision losses so heres a round
    },
    tooltipTags: ["Instant Effect", "Restrictions"],
    next: ["A16"],
  },
  A14: {
    position: [1, 3],
    type: "single",
    cost: new Decimal(500),
    description(level) {
      return `Double your IP gain`;
    },
    restrictionInfo(level) {
      return `Infinitied at least twice`;
    },
    restrictionNerf(level) {
      return new Decimal(6);
    },
    checkRestriction(level) {
      return player.infinities.gte(2); // break_eternity.js may have some precision losses so heres a round
    },
    effectValue(level) {
      return new Decimal(2);
    },
    tooltipTags: ["Restrictions"],
    next: ["A17"],
  },

  //row 7
  A15: {
    position: [-1, 4],
    type: "single",
    cost: new Decimal(5000),
    description(level) {
      return `Instant: [Multplies Infinities by 5]`;
    },
    onLevelUp(pre, now) {
      player.infinities = player.infinities.mul(5);
    },
    tooltipTags: ["Instant Effect"],
    next: ["A18"],
  },
  A16: {
    position: [0, 4],
    type: "single",
    cost: new Decimal(5000),
    description(level) {
      return `Galaxies won't reset Dimensional Boosts`;
    },
    restrictionInfo(level) {
      return `The greatest common divisor between Galaxies and Dimensional Boosts is 1 (including free ones)`;
    },
    restrictionNerf(level) {
      return new Decimal(3);
    },
    checkRestriction(a = DimBoost.totalBoosts, b = player.galaxies) {
      if(a.eq(0) || b.eq(0)) return false
      function gcd(a, b) {
        if (b === 0) {
          return a;
        }
        return gcd(b, a % b);
      }
      return gcd(a.round().toNumber(), b.round().toNumber()) === 1;
    },
    next: ["A19"],
  },
  A17: {
    position: [1, 4],
    type: "single",
    cost: new Decimal(5000),
    description(level) {
      return `Continuum + 1%`;
    },
    effectValue(level) {
      return new Decimal(0.01);
    },
    next: ["A20"],
  },

  //row 8
  A18: {
    position: [-1, 5],
    type: "unlimited",
    scaling: {
      type: "linear",
      cost: new Decimal(7500),
      costIncrease: new Decimal(2),
    },
    description(level) {
      return `×2 Infinities<br>(×${format(this.effectValue(level))} → ×${format(this.effectValue(level.add(1)))})`;
    },
    effectValue(level) {
      return level.pow_base(2);
    },
    next: ["A21"],
  },
  A19: {
    position: [0, 5],
    type: "unlimited",
    scaling: {
      type: "linear",
      cost: new Decimal(15000),
      costIncrease: new Decimal(2),
    },
    description(level) {
      return `×1.5 Replicanti Speed<br>(×${format(this.effectValue(level))} → ×${format(
        this.effectValue(level.add(1))
      )})`;
    },
    effectValue(level) {
      return level.pow_base(1.5);
    },
    next: ["A21"],
  },
  A20: {
    position: [1, 5],
    type: "unlimited",
    scaling: {
      type: "linear",
      cost: new Decimal(7500),
      costIncrease: new Decimal(2),
    },
    description(level) {
      return `×2 Infinity Dimensions' Multiplier<br>(×${format(this.effectValue(level))} → ×${format(
        this.effectValue(level.add(1))
      )})`;
    },
    effectValue(level) {
      return level.pow_base(2);
    },
    next: ["A21"],
  },

  //row 9
  A21: {
    position: [0, 6],
    type: "single",
    cost: new Decimal(1e4),
    permanent: true,
    description(level) {
      return `Infinities will only reset half your Replicanti Galaxies, and keeps your Replicanti.`;
    },
    next: ["C0"],
  },

  //row 10 *Core*
  C0: {
    position: [0, 7],
    type: "core",
    cost: new Decimal(5e4),
    description(level) {
      return `Auto Researches Depth 0 Abyss Researches at ${formatPercents(this.effectValue())} rate`;
    },
    effectValue(level) {
      return new Decimal(0.2);
    },
    coreRestrictions: [
      [
        () => `The greatest common divisor between Galaxies and Dimensional Boosts is 1 (Hint: Shift+Click to buy 1 AG/DB)`,
        () => baseConfig.A16.checkRestriction(),
      ],
      [() => `In Mirror, Active a total of 200 (or more) percentages of RGB`, () => getPendingPrisms() >= 200 && player.light.inMirror],
      [
        () => `Only 3 (or less) pre-Inf Space Researches can be level 1 or higher`,
        () =>
          SpaceResearchTierDetail[0].filter((x) => SpaceResearchRifts[x].level.gte(1)).length +
            SpaceResearchTierDetail[1].filter((x) => SpaceResearchRifts[x].level.gte(1)).length +
            SpaceResearchTierDetail[2].filter((x) => SpaceResearchRifts[x].level.gte(1)).length <=
          3,
      ],
      [() => `Reach Mirror goal`, () => canBreakMirror()],
    ],
    tooltipTags: ["Core", "Depth"],
  },
};

quickSpawnResearches(baseConfig, "0");

export const AbyssResearchesDepth_0 = baseConfig;
