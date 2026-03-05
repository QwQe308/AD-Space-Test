import { NODE_TYPE, quickSpawnResearches } from "../abyssResearchSpawner";
import { DC } from "../../../../constants";

// Yes, layer 0 serves as a toturial.

let baseConfig = {
  //row 0
  A1: {
    position: [0, -2],
    type: NODE_TYPE.UNLIMITED,
    scaling: {
      type: "linear",
      cost: new Decimal(10),
      costIncrease: new Decimal(2),
    },
    description(level) {
      return `Antimatter x2 per level<br>
      (×${format(this.effectValue(level), 2)} → ×${format(this.effectValue(level.add(1)))})`;
    },
    effectValue(level) {
      return level.pow_base(2);
    },
    tooltipTags: ["Tips"],
    next: ["A2", "A3"],
  },

  //row 1
  A2: {
    position: [-1, -1],
    type: NODE_TYPE.SINGLE,
    cost: new Decimal(20),
    description(level) {
      return `+ 6 free Tickspeed Upgrades`;
    },
    effectValue(level) {
      return new Decimal(6);
    },
    tooltipTags: ["Shapes"],
    next: ["A4", "A5", "A6"],
  },
  A3: {
    position: [1, -1],
    type: NODE_TYPE.SINGLE,
    cost: new Decimal(20),
    description(level) {
      return `×3 Research Speed (RS)`;
    },
    effectValue(level) {
      return new Decimal(3);
    },
    tooltipTags: ["ARS", "Shapes"],
    next: ["A6", "A7", "A8"],
  },

  //row 2
  A4: {
    position: [-2, 0],
    type: NODE_TYPE.LIMITED,
    maxLevel: new Decimal(3),
    scaling: {
      type: "linear",
      cost: new Decimal(50),
      costIncrease: new Decimal(2),
    },
    description(level) {
      if (this.maxLevel.eq(level)) return `/10 Antimatter Dimensions' cost<br>(/${format(this.effectValue(level))})`;
      return `/10 Antimatter Dimensions' cost<br>(/${format(this.effectValue(level), 2)} → /${format(
        this.effectValue(level.add(1)),
        2
      )})`;
    },
    effectValue(level) {
      return level.pow_base(10);
    },
    next: ["A9"],
  },
  A5: {
    position: [-1, 0],
    type: NODE_TYPE.SINGLE,
    cost: new Decimal(50),
    description(level) {
      return `Abyss Research Speed is 1% faster per Tickspeed Upgrade (additive, up to ×4, locked to max if infinitied once)
      <br>Current: ×${format(this.effectValue(), 2, 2)}`;
    },
    restrictions: [
      {
        description() {
          return `Can afford at least 1 dimension for all unlocked AD tiers`;
        },
        nerf() {
          return DC.D4;
        },
        requirement() {
          return (
            AntimatterDimensions.all.filter((x) => (x.isAvailableForPurchase ? x.isAffordable : true)).length === 8
          );
        },
      },
    ],
    effectValue(level) {
      if (player.infinities.gt(0) || player.eternities.gt(100) || (player.realities.gt(0) && player.eternities.gt(0)))
        return new Decimal(4);
      return Tickspeed.totalUpgrades.mul(0.01).add(1).min(4);
    },
    tooltipTags: ["Restrictions"],
    next: ["A9"],
  },

  A6: {
    position: [0, 0],
    type: NODE_TYPE.SINGLE,
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
    type: NODE_TYPE.SINGLE,
    cost: new Decimal(50),
    description(level) {
      return `Start with 1e30 AM (pre-space nerf)`;
    },

    restrictions: [
      {
        description() {
          return `Tickspeed upgrades' amount is a prime number lower than 308. (including free ones)`;
        },
        nerf() {
          return DC.D3;
        },
        requirement() {
          if (Tickspeed.totalUpgrades.gte(308)) return false;
          let primes = [
            2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97, 101, 103,
            107, 109, 113, 127, 131, 137, 139, 149, 151, 157, 163, 167, 173, 179, 181, 191, 193, 197, 199, 211, 223,
            227, 229, 233, 239, 241, 251, 257, 263, 269, 271, 277, 281, 283, 293, 307,
          ];
          // break_eternity.js may have some precision losses so heres a round
          return primes.includes(Math.round(Tickspeed.totalUpgrades.toNumber()));
        },
      },
    ],
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
    type: NODE_TYPE.LIMITED,
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
    type: NODE_TYPE.UNLIMITED,
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
    type: NODE_TYPE.UNLIMITED,
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
    type: NODE_TYPE.UNLIMITED,
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
    type: NODE_TYPE.SINGLE,
    cost: new Decimal(500),
    description(level) {
      return `Triples your Infinities (IS) gain`;
    },
    restrictions: [
      {
        description() {
          return `Infinitied at least twice`;
        },
        nerf() {
          return DC.D6;
        },
        requirement() {
          return player.infinities.gte(2);
        },
      },
    ],
    effectValue(level) {
      return new Decimal(3);
    },
    tooltipTags: ["Restrictions"],
    next: ["A15"],
  },
  A13: {
    position: [0, 3],
    type: NODE_TYPE.SINGLE,
    cost: new Decimal(750),
    description(level) {
      return `Instant: [Complete all NC and multply IP by 2]`;
    },
    onLevelUp(pre, now) {
      player.challenge.normal.completedBits = 8190;
      player.infinityPoints = player.infinityPoints.mul(2);
    },
    restrictions: [
      {
        description() {
          return `Infinitied at least twice`;
        },
        nerf() {
          return DC.D6;
        },
        requirement() {
          return player.infinities.gte(2);
        },
      },
    ],
    tooltipTags: ["Instant Effect", "Restrictions"],
    next: ["A16"],
  },
  A14: {
    position: [1, 3],
    type: NODE_TYPE.SINGLE,
    cost: new Decimal(500),
    description(level) {
      return `Double your IP gain`;
    },
    restrictions: [
      {
        description() {
          return `Infinitied at least twice`;
        },
        nerf() {
          return DC.D6;
        },
        requirement() {
          return player.infinities.gte(2);
        },
      },
    ],
    effectValue(level) {
      return new Decimal(2);
    },
    tooltipTags: ["Restrictions"],
    next: ["A17"],
  },

  //row 7
  A15: {
    position: [-1, 4],
    type: NODE_TYPE.SINGLE,
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
    type: NODE_TYPE.SINGLE,
    cost: new Decimal(5000),
    description(level) {
      return `Galaxies won't reset Dimensional Boosts`;
    },

    restrictions: [
      {
        description() {
          return `The greatest common divisor between Galaxies and Dimensional Boosts is 1 (including free ones)`;
        },
        nerf() {
          return DC.D3;
        },
        requirement() {
          let a = DimBoost.totalBoosts,
            b = player.galaxies;
          if (a.eq(0) || b.eq(0)) return false;
          function gcd(a, b) {
            if (b === 0) {
              return a;
            }
            return gcd(b, a % b);
          }
          return gcd(a.round().toNumber(), b.round().toNumber()) === 1;
        },
      },
    ],
    next: ["A19"],
  },
  A17: {
    position: [1, 4],
    type: NODE_TYPE.SINGLE,
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
    type: NODE_TYPE.UNLIMITED,
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
    type: NODE_TYPE.UNLIMITED,
    scaling: {
      type: "linear",
      cost: new Decimal(15000),
      costIncrease: new Decimal(2),
    },
    description(level) {
      return `×1.5 Replicanti Speed<br>(×${format(this.effectValue(level), 2, 2)} → ×${format(
        this.effectValue(level.add(1)),
        2,
        2
      )})`;
    },
    effectValue(level) {
      return level.pow_base(1.5);
    },
    next: ["A21"],
  },
  A20: {
    position: [1, 5],
    type: NODE_TYPE.UNLIMITED,
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
    type: NODE_TYPE.SINGLE,
    cost: new Decimal(1e4),
    description(level) {
      return `Infinity resets will keep your Replicanti, and only reset half your Replicanti Galaxies.`;
    },
    next: ["C0"],
  },

  //row 10 *Core*
  C0: {
    position: [0, 7],
    type: NODE_TYPE.CORE,
    cost: new Decimal(4e5),
    description(level) {
      return `Sacrifice "all?" depth 0 researches.<br>Permanently disable Abyss's nerfs to research speed,<br>and collpase into depth 1...?`;
    },
    effectValue(level) {
      return 0;
    },
    onLevelUp() {
      player.abyssResearchCanvas.currentAbyssResearchDepth = "1";
      for (let i of ["A21B", "A7B", "A6B", "A16B"]) {
        AbyssResearches[i].progress = new Decimal(1e5);
        AbyssResearches[i].unlock();
      }
      AbyssResearches.B0.unlock();
      AbyssResearchHelperTools.updateStatus();
      for (let i = 1; i <= 21; i++) {
        player.activeAbyssResearches = new Set();
        player.abyssResearches["A" + i].unlocked = false;
        player.abyssResearches["A" + i].shown = false;
        AbyssResearches["A" + i].reset();
      }
    },
    restrictions: [
      {
        type: "failable",
        description() {
          return `In Mirror in whole this eternity<br>(! You may want to enter Mirror before reset)`;
        },
        completable() {
          return player.light.inMirror;
        },
        resetOnEvent: GAME_EVENT.ETERNITY_RESET_AFTER,
      },
      {
        description() {
          return `Apply 300% RGB percentages or higher`;
        },
        requirement() {
          return getPendingPrisms() >= 300;
        },
      },
      {
        description() {
          return `Be able to Break Mirror`;
        },
        requirement() {
          return canBreakMirror();
        },
      },
      {
        description() {
          return `Reach 30 Time Theorms`;
        },
        requirement() {
          return player.timestudy.maxTheorem.gte(30);
        },
      },
    ],
    next: [],
    tooltipTags: ["Core", "Depth", "Restrictions Reminder"],
  },
};

quickSpawnResearches(baseConfig, "0");

export const AbyssResearchesDepth0 = baseConfig;
