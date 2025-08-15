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
      percentage: 0,
      timeToNext: "",
      progress: new Decimal(0),
      unlocked: false,
      restrictionMet: false,
      isMaxed: false,
      level: new Decimal(0),
      maxLevel: new Decimal(0),
    };
  },
  computed: {
    getTooltip() {
      let tooltipContent = `${this.id}<br>`;
      if (!this.isMaxed) {
        switch (AbyssResearches[this.id].type) {
          case "single":
            tooltipContent += `----------[ ${formatPercents(this.percentage)} ]----------<br>`;
            break;

          case "limited":
            tooltipContent += `----------[ ${formatPercents(this.percentage)} | LV.${format(
              AbyssResearches[this.id].level
            )} / ${format(AbyssResearches[this.id].maxLevel)} ]----------<br>`;
            break;

          case "unlimited":
            tooltipContent += `----------[ ${formatPercents(this.percentage)} | LV.${format(
              AbyssResearches[this.id].level
            )} ]----------<br>`;
            break;
        }
        tooltipContent += `Progress: ${format(this.progress, 2, 2)}/${format(AbyssResearches[this.id].cost)}<br>
            (${format(this.abyssResearchSpeed, 2, 3)}/s, in ${this.timeToNext})`;
      } else {
        switch (AbyssResearches[this.id].type) {
          case "single":
            tooltipContent += `----------[ Completed ]----------`;
            break;

          case "limited":
            tooltipContent += `----------[ LV.${format(AbyssResearches[this.id].level)} | Completed ]----------`;
            break;
        }
      }

      if (AbyssResearches[this.id].hasRestriction) {
        tooltipContent += `<br><span style="color:${this.restrictionMet ? "lime" : "red"}">Efficiency /${format(
          AbyssResearches[this.id].restrictionNerf
        )}</span>`;
      }

      tooltipContent += `<br><br>`;

      tooltipContent += `<span style="color:#cccccc">${AbyssResearches[this.id].description}</span>`;

      //restriction
      if (AbyssResearches[this.id].hasRestriction) {
        //#FFFFAF yellow
        tooltipContent += `<span style="color:#cccccc"><br><br>----------Restrictions----------<br>`;
        tooltipContent += AbyssResearches[this.id].restrictionInfo;
        tooltipContent += `</span>`;
      }

      //extra tooltips
      for (let tip of AbyssResearches[this.id].tooltipTags) {
        if (player.abyssResearchTooltipsShown.has(tip)) continue;
        tooltipContent += ``;
        tooltipContent += `<span style="color:#bbffff"><br><br>----------Tip: ${tip}-----------<br>`;
        tooltipContent += extraAbyssResearchTooltips[tip];
        tooltipContent += `</span>`;
      }
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
      return {
        left: `${AbyssResearches[this.id].x - 20}px`,
        top: `${AbyssResearches[this.id].y - 20}px`,
      };
    },
    getNodeClass() {
      let style = {};
      style[`research-node--${this.getNodeType}`] = true;
      return style;
    },
    getContainerClass() {
      return {
        "research-node__container--active": this.isResearching,
        "research-node__container--locked": !this.unlocked,
        "research-node__container--completed": this.isMaxed,
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
      }
    },
  },
  methods: {
    handleClick() {
      AbyssResearches[this.id].click();
    },
    update() {
      this.timeToNext = this.abyssResearchSpeed.gt(0)
        ? TimeSpan.fromSeconds(
            AbyssResearches[this.id].cost.sub(AbyssResearches[this.id].progress).div(this.abyssResearchSpeed).toNumber()
          ).toTimeEstimate()
        : "Forever";
      this.isResearching = AbyssResearches[this.id].isResearching;
      this.abyssResearchSpeed.copyFrom(AbyssResearches[this.id].researchSpeed);
      this.percentage = AbyssResearches[this.id].percentage;
      this.progress.copyFrom(AbyssResearches[this.id].progress);
      this.unlocked = player.abyssResearches[this.id].unlocked;
      this.restrictionMeet = AbyssResearches[this.id].checkRestriction;
      this.isMaxed = AbyssResearches[this.id].maxed;
      this.level.copyFrom(AbyssResearches[this.id].level)
      this.maxLevel.copyFrom(AbyssResearches[this.id].maxLevel)
    },
  },
};
</script>

<template>
  <div
    class="research-node"
    :class="getNodeClass"
    :style="getNodeStyle"
    v-tooltip="{ content: getTooltip, classes: ['general-tooltip', 'abyss-research-tooltip'] }"
  >
    <div class="research-node__container" @click="handleClick" :class="getContainerClass">
      <div class="research-node__inner" :style="getFillStyle" :class="getFillClass"></div>
      <div class="research-node__level" :style="getTextStyle">{{ levelText }}</div>
    </div>
  </div>
</template>

<style scoped>
.research-node {
  position: absolute;
  width: 40px;
  height: 40px;
  overflow: visible;
  transition: all 0.3s ease;
  transition-duration: 0.5s;
}

.research-node__container {
  z-index: 0;
  width: 100%;
  height: 100%;
  position: relative;
  background-color: #3498db;

  transition-duration: 0.5s;
  .research-node--unlimited & {
    border-radius: 50%;
  }
  .research-node--limited & {
    transform: rotate(45deg);
  }
  .research-node--single & {
    clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
  }
}

.research-node__container--locked {
  background-color: rgb(100, 100, 100);
}

.research-node__container--completed {
  background-color: #aeae77;
}

.research-node__container--active {
  background-color: #f39c12;
}

.research-node__container::before {
  z-index: 1;
  content: "";
  position: absolute;
  inset: 2px;
  background: #111014;
  border-radius: inherit;
  clip-path: inherit;
}

.research-node__inner {
  z-index: 2;
  position: absolute;
  inset: 2px;
  background: #3498db;
  opacity: 0.3;
  transform-origin: center;
  border-radius: inherit;
  clip-path: inherit;
}

.research-node__level {
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
