import { GameMechanicState } from "../../../game-mechanics";
import { light } from "../../mirror/light";
import { getSpaceNerf } from "../../space";

class MirrorUpgrade extends GameMechanicState {
  constructor(config) {
    super(config);
  }

  get name() {
    return this._config.name;
  }

  get data() {
    return player.empowers.present.mirrorUpgrades[this.id];
  }

  get level() {
    return this.data.level;
  }

  set level(newLevel) {
    this.data.level = newLevel;
  }

  get absLevel() {
    return Math.abs(this.level);
  }

  get pendingLevel() {
    return this.data.pendingLevel;
  }

  set pendingLevel(newLevel) {
    this.data.pendingLevel = newLevel;
  }

  set level(newLevel) {
    this.data.level = newLevel;
  }

  upgrade() {
    this.pendingLevel = this.pendingLevel + 1;
  }

  downgrade() {
    this.pendingLevel = this.pendingLevel - 1;
  }

  update() {
    this.lastLevel = this.level;
    this.level = this.pendingLevel;
  }

  rewind() {
    this.level = this.lastLevel;
  }

  toggle() {
    this.level = -this.level;
  }

  get reverted() {
    return (this.level < 0) ^ player.light.inMirror;
  }

  levelConfig(level) {
    return this._config.levels[level - 1];
  }

  reachedLevel(level) {
    return this.level > level;
  }

  effect(level) {
    return this.levelConfig(level).effect(this.reverted);
  }

  description(level) {
    return this.levelConfig(level).description(this.effect(level));
  }

  color(type) {
    return this._config.color[type];
  }
}

export const presentMirrorUpgradeConfig = {
  white: {
    id: "white",
    color: [75, 75, 75],
    levels: [
      {
        // Level 1
        description(effect) {
          return `All light is ${formatX(effect, 1, 1)} more powerful in base effect.`;
        },
        effect: (reverted) => Decimal.pow(1.1, reverted),
      },
    ],
  },

  purple: {
    id: "purple",
    color: [75, 0, 75],
    levels: [
      {
        // Level 1
        description(effect) {
          return `${formatAdd(
            effect,
            1,
            1
          )} extra galaxies, equal to ± purple light / 50.<br>(cannot let total galaxies fall below 0)`;
        },
        effect: (reverted) => Decimal.div(light.purple.amount(), 50 * reverted).floor(),
      },
    ],
  },
  yellow: {
    id: "yellow",
    color: [75, 75, 0],
    levels: [
      {
        // Level 1
        description(effect) {
          return `Yellow light also affects 1st Time Dimension.<br>(${formatX(effect, 2, 2)})`;
        },
        effect: (reverted) => light.yellow.effectValue().abs().pow(reverted),
      },
    ],
  },
  cyan: {
    id: "cyan",
    color: [0, 75, 75],
    levels: [
      {
        // Level 1
        description(effect) {
          return `Cyan light also affects Replicanti. (${formatX(effect, 2, 2)})`;
        },
        effect: (reverted) => light.cyan.effectValue().abs().pow(reverted),
      },
    ],
  },

  red: {
    id: "red",
    color: [100, 50, 50],
    levels: [
      {
        // Level 1
        description(effect) {
          return `Red light's effect is raised by space nerf. (${formatPow(effect, 2, 2)})`;
        },
        effect: (reverted) => getSpaceNerf().pow(reverted),
      },
    ],
  },
  green: {
    id: "green",
    color: [50, 100, 50],
    levels: [
      {
        // Level 1
        description(effect) {
          return `Green light also affects infinities gain. (${formatX(effect, 2, 2)})`;
        },
        effect: (reverted) => light.green.effectValue().abs().pow(reverted),
      },
    ],
  },
  blue: {
    id: "blue",
    color: [50, 50, 100],
    levels: [
      {
        // Level 1
        description(effect) {
          return `Blue light affects T3 Space Researches. (${formatX(effect, 2, 2)})`;
        },
        effect: (reverted) => light.blue.effectValue().abs().pow(reverted),
      },
    ],
  },
};

export const PresentMirrorUpgrades = mapGameDataToObject(
  presentMirrorUpgradeConfig,
  (config) => new MirrorUpgrade(config)
);