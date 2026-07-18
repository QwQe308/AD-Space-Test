<script>
export default {
  name: "AbyssResearchNode",
  props: {
    id: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      isResearching: false,
      abyssResearchSpeed: new Decimal(0),
      isAutoResearching: false,
      autoResearchEfficiency: 0,
      percentage: 0,
      timeToNext: "",
      progress: new Decimal(0),
      unlocked: false,
      restrictionStates: [],
      isMaxed: false,
      level: new Decimal(0),
      maxLevel: new Decimal(0),
      type: "",
      permanent: AbyssResearches[this.id].permanent,
    };
  },
  computed: {
    getMainInfosTooltip() {
      let tooltipContent = `${this.id}`;
      if (!this.isMaxed && this.type !== "sink") {
        switch (AbyssResearches[this.id].type) {
          case "single":
            tooltipContent += `<br>----------[ ${formatPercents(this.percentage)} ]----------`;
            break;

          case "limited":
            tooltipContent += `<br>----------[ ${formatPercents(this.percentage)} | LV.${format(
              AbyssResearches[this.id].level
            )} / ${format(AbyssResearches[this.id].maxLevel)} ]----------`;
            break;

          case "unlimited":
            tooltipContent += `<br>----------[ ${formatPercents(this.percentage)} | LV.${format(
              AbyssResearches[this.id].level
            )} ]----------`;
            break;

          default:
            tooltipContent += `<br>------------------------------`;
            break;
        }
        tooltipContent += `<br>Progress: ${format(this.progress, 2, 2)}/${format(
          AbyssResearches[this.id].cost,
          2
        )}<br>`;
        if (this.isResearching || !this.isAutoResearching)
          tooltipContent += `(${format(this.abyssResearchSpeed.mul(1 + this.autoResearchEfficiency), 2, 3)}/s, in ${
            this.timeToNext
          })`;
        else {
          tooltipContent += `(${format(this.abyssResearchSpeed.mul(this.autoResearchEfficiency), 2, 3)}/s, in ${
            this.autoTimeToNext
          })<br>`;
          tooltipContent += `<span style="color:#888">(${format(
            this.abyssResearchSpeed.mul(this.autoResearchEfficiency + 1),
            2,
            3
          )}/s, in ${this.timeToNext} if active)</span>`;
        }
      } else {
        switch (AbyssResearches[this.id].type) {
          case "single":
            tooltipContent += `<br>----------[ Completed ]----------`;
            break;

          case "limited":
            tooltipContent += `<br>----------[ LV.${format(AbyssResearches[this.id].level)} | Completed ]----------`;
            break;

          default:
            tooltipContent += `<br>------------------------------`;
            break;
        }
      }

      if (
        !this.isMaxed &&
        AbyssResearches[this.id].hasRestriction &&
        AbyssResearches[this.id].totalRestrictionNerf.neq(1)
      ) {
        tooltipContent += `<br><span style="color:red">Efficiency /${format(
          AbyssResearches[this.id].totalRestrictionNerf
        )}</span>`;
      }

      return tooltipContent;
    },

    getRestrictionsTooltip() {
      let tooltipContent = "";

      // #FFFFAF yellow
      tooltipContent += `<span style="color:#cccccc"><br><br>----------Restrictions----------<br></span>`;
      const restrictions = this.getNode.restrictions;
      for (let index = 0; index < restrictions.length; index++) {
        tooltipContent += `<br><span style="color:${this.restrictionStates[index] ? "lime" : "red"}">${restrictions[
          index
        ].description(this.level)}`;
        if (restrictions[index].nerf.neq(1)) tooltipContent += ` [/${restrictions[index].nerf}]`;
        tooltipContent += `</span>`;
        if (index < restrictions.length - 1) tooltipContent += "<br>";
      }

      return tooltipContent;
    },

    getTipsTooltip() {
      let tooltipContent = "";

      for (const tip of AbyssResearches[this.id].tooltipTags) {
        if (player.abyssResearchTooltipsShown.has(tip)) continue;
        tooltipContent = String(tooltipContent);
        tooltipContent += `<span style="color:#bbffff"><br><br>----------Tip: ${tip}-----------<br>`;
        tooltipContent += extraAbyssResearchTooltips[tip];
        tooltipContent += `</span>`;
      }

      return tooltipContent;
    },

    getTooltip() {
      let tooltipContent = this.getMainInfosTooltip;

      if (this.type !== "core" && this.type !== "sink") tooltipContent += `<br><br>`;
      else tooltipContent += "<br>";

      tooltipContent += `<span style="color:#cccccc">${AbyssResearches[this.id].description}</span>`;

      if (!this.isMaxed && AbyssResearches[this.id].hasRestriction) {
        tooltipContent += this.getRestrictionsTooltip;
      }

      tooltipContent += this.getTipsTooltip;

      return tooltipContent;
    },

    getFillStyle() {
      return {
        transform: `scale(${this.percentage})`,
      };
    },
    getNodeType() {
      return AbyssResearches[this.id].type;
    },
    getNodeStyle() {
      if (this.getNodeType === "core") {
        return {
          left: `${AbyssResearches[this.id].x - 30}px`,
          top: `${AbyssResearches[this.id].y - 30}px`,
          width: "60px",
          height: "60px",
        };
      }
      return {
        left: `${AbyssResearches[this.id].x - 20}px`,
        top: `${AbyssResearches[this.id].y - 20}px`,
      };
    },
    getNodeClass() {
      const style = {};
      style[`${this.getNodeType}`] = true;
      return style;
    },
    getContainerClass() {
      return {
        active: this.isResearching,
        locked: !this.unlocked,
        completed: this.isMaxed,
      };
    },
    getFillClass() {
      return {};
    },
    getTextStyle() {
      if (!(this.getNodeType === "limited")) return {};
      return {
        transform: "rotate(-45deg)",
      };
    },
    levelText() {
      switch (this.getNodeType) {
        case "single":
          return formatPercents(this.percentage);
        case "limited":
          return `${this.level}/${this.maxLevel}`;
        case "unlimited":
          return this.level;
        default:
          return false;
      }
    },
    hasProgress() {
      switch (this.type) {
        case "single":
        case "limited":
        case "unlimited":
        case "core":
          return true;
        default:
          return false;
      }
    },

    getNode() {
      return AbyssResearches[this.id];
    },
  },
  methods: {
    handleClick() {
      AbyssResearches[this.id].click();
    },
    sinkAnimationStyle(id) {
      return {
        "animation-delay": `${1 - id}s`,
      };
    },
    calcTimeToNext(researchSpeed) {
      return researchSpeed.gt(0)
        ? TimeSpan.fromSeconds(
            this.getNode.cost.sub(this.getNode.progress).div(researchSpeed).toNumber()
          ).toTimeEstimate()
        : "Forever";
    },
    update() {
      this.type = this.getNode.type;
      this.unlocked = this.getNode.unlocked;
      if (this.type === "sink") return;
      this.timeToNext = this.calcTimeToNext(this.abyssResearchSpeed.mul(this.autoResearchEfficiency + 1));
      this.autoTimeToNext = this.calcTimeToNext(this.abyssResearchSpeed.mul(this.autoResearchEfficiency));
      this.percentage = this.getNode.percentage;
      this.isMaxed = this.getNode.maxed;
      this.level.copyFrom(this.getNode.level);
      this.maxLevel.copyFrom(this.getNode.maxLevel);

      this.autoResearchEfficiency = this.getNode.autoResearchEfficiency;
      this.isAutoResearching = this.getNode.isAutoResearching;

      if (this.getNode.hasRestriction) {
        this.restrictionStates = this.getNode.restrictionStates;
      }

      if (!this.isMaxed) {
        this.restrictionMet = this.getNode.checkRestriction;
        this.progress.copyFrom(this.getNode.progress);
        this.abyssResearchSpeed.copyFrom(this.getNode.researchSpeed);
        this.isResearching = this.getNode.isResearching;
      } else {
        this.isResearching = false;
      }
    },
  },
};
</script>

<template>
  <div
    v-tooltip="{
      content: getTooltip,
      classes: ['general-tooltip', 'abyss-research-tooltip'],
      hideOnTargetClick: false,
    }"
    class="research-node"
    :class="getNodeClass"
    :style="getNodeStyle"
  >
    <div v-if="permanent" class="permanent-mark">*</div>
    <div class="research-node-container" :class="getContainerClass" @click="handleClick">
      <div v-if="hasProgress" class="research-node-inner" :style="getFillStyle" :class="getFillClass" />
      <div v-if="levelText" class="research-node-level" :style="getTextStyle">
        {{ levelText }}
      </div>
      <!-- For "Sink" type -->
      <div v-if="type === 'sink'" class="sink-animation">
        <div v-for="i in 3" :style="sinkAnimationStyle(i)" class="sink-animation-block" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.permanent-mark {
  position: absolute;
  top: 0;
  left: 0;
}
.locked .sink-animation-block {
  border-color: rgb(100, 100, 100);
}

.sink-animation-block {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border: 2px solid rgb(125, 100, 150);
  transform-origin: center;
  animation: collapse 3s linear infinite;
  box-sizing: border-box;
  z-index: 9;
}

@keyframes collapse {
  0% {
    transform: rotate(0deg) scale(1);
  }
  100% {
    transform: rotate(180deg) scale(0);
  }
}

.sink-animation {
  position: relative;
  width: inherit;
  height: inherit;
  overflow: hidden;
}

.research-node {
  position: absolute;
  width: 40px;
  height: 40px;
  overflow: visible;
  transition: all 0.3s ease;
  transition-duration: 0.5s;
}

.research-node-container {
  z-index: 0;
  width: 100%;
  height: 100%;
  position: relative;
  background-color: #3498db;

  transition-duration: 0.5s;

  .unlimited & {
    border-radius: 50%;
  }
  .limited & {
    transform: rotate(45deg);
  }
  .single & {
    clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
  }

  .core & {
    -webkit-mask: radial-gradient(circle at 0% 0%, transparent 70%, black 70%) top left,
      radial-gradient(circle at 100% 0%, transparent 70%, black 70%) top right,
      radial-gradient(circle at 100% 100%, transparent 70%, black 70%) bottom right,
      radial-gradient(circle at 0% 100%, transparent 70%, black 70%) bottom left;
    -webkit-mask-size: 50% 50%;
    -webkit-mask-repeat: no-repeat;
    mask: radial-gradient(circle at 0 0, transparent 70%, red 0) top left,
      radial-gradient(circle at 100% 0, transparent 70%, red 0) top right,
      radial-gradient(circle at 100% 100%, transparent 70%, red 0) bottom right,
      radial-gradient(circle at 0 100%, transparent 70%, red 0) bottom left;
    mask-size: 50% 50%;
    mask-repeat: no-repeat;
    --inset: 6px;
    .research-node-inner {
      --inset: 8px;
    }
  }

  .sink & {
    background-color: rgb(125, 100, 150);
  }
}

.research-node-container.locked {
  background-color: rgb(100, 100, 100) !important;
}

.research-node-container.completed {
  background-color: #aeae77;
}

.research-node-container.active {
  background-color: #f39c12;
}

.research-node-container::before {
  z-index: 1;
  content: "";
  position: absolute;
  inset: var(--inset, 2px);
  background: #111014;
  border-radius: inherit;
  clip-path: inherit;
  -webkit-mask: inherit;
  -webkit-mask-size: inherit;
  -webkit-mask-repeat: inherit;
  mask: inherit;
  mask-size: inherit;
  mask-repeat: inherit;
}

.research-node-inner {
  z-index: 2;
  position: absolute;
  inset: 2px;
  background: #3498db;
  opacity: 0.3;
  transform-origin: center;
  border-radius: inherit;
  clip-path: inherit;
  mask: inherit;

  -webkit-mask: inherit;
  -webkit-mask-size: inherit;
  -webkit-mask-repeat: inherit;
  mask: inherit;
  mask-size: inherit;
  mask-repeat: inherit;
}

.research-node.core .completed .research-node-inner {
  background-color: #aeae77;
}

.research-node-level {
  position: absolute;
  z-index: 4;
  width: 100%;
  height: 100%;
  line-height: 40px;
  top: 0;
  left: 0;
}

.research-node:hover {
  transform: scale(1.15);
  z-index: 10;
  filter: drop-shadow(0 5px 12px rgba(0, 0, 0, 0.4));
}
</style>
