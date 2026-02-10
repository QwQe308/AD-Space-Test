<script>
export default {
  name: "AbyssResearchConnection",
  props: {
    data: {
      type: Array,
      required: true,
    },
    id: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      isResearching: false,
      isActive: false,
      animationSpeed: 1, // percentage / tick
      animationLineLength: 20, //in percentage
      positions: Array.range(0, 2).map((x) => [
        [-10000, -10000],
        [-10000, -10000],
      ]),
      animationPercentages: [-60, 0],
      animationLines: 2,
    };
  },
  computed: {
    classObject() {
      return {
        "research-connection": true,
        "research-connection--active": this.isActive,
      };
    },

    getDirection() {
      let x1 = this.data[0][0];
      let x2 = this.data[1][0];
      let y1 = this.data[0][1];
      let y2 = this.data[1][1];

      if (y2 === y1) {
        if (x2 > x1) {
          return "rightwards";
        } else {
          return "leftwards";
        }
      }
      if (x2 === x1) {
        if (y2 > y1) {
          return "downwards";
        } else {
          return "upwards";
        }
      }

      if (x2 > x1) {
        if (y2 > y1) {
          return "right-downwards";
        } else {
          return "right-upwards";
        }
      } else {
        if (y2 > y1) {
          return "left-downwards";
        } else {
          return "left-upwards";
        }
      }
    },
  },
  methods: {
    update() {
      this.isResearching = AbyssResearches[this.data[1][2]].isResearching;
      this.isActive =
        (this.isResearching || AbyssResearches[this.data[0][2]].isResearching) &&
        AbyssResearches[this.data[0][2]].unlocked &&
        AbyssResearches[this.data[1][2]].unlocked;

      if (!this.isResearching || !this.isActive) {
        this.animationPercentages = [-60, 0];
        this.positions = Array.range(0, this.animationLines).map((x) => [
          [-10000, -10000],
          [-10000, -10000],
        ]);
        return;
      }

      for (let i = 0; i < this.animationLines; i++) {
        this.animationPercentages[i] += this.animationSpeed;
        if (this.animationPercentages[i] > this.animationLineLength + 100) {
          this.animationPercentages[i] = 0;
        }
        this.$set(this.positions, i, this.calcPosition(this.animationPercentages[i]));
      }
    },

    calcPosition(percentage) {
      let positions = [
        [
          this.data[0][0] + ((this.data[1][0] - this.data[0][0]) * (percentage - this.animationLineLength)) / 100,
          this.data[0][1] + ((this.data[1][1] - this.data[0][1]) * (percentage - this.animationLineLength)) / 100,
        ],
        [
          this.data[0][0] + ((this.data[1][0] - this.data[0][0]) * percentage) / 100,
          this.data[0][1] + ((this.data[1][1] - this.data[0][1]) * percentage) / 100,
        ],
      ];
      positions[0][0] = this.limitRange(positions[0][0], this.data[0][0], this.data[1][0]);
      positions[0][1] = this.limitRange(positions[0][1], this.data[0][1], this.data[1][1]);
      positions[1][0] = this.limitRange(positions[1][0], this.data[0][0], this.data[1][0]);
      positions[1][1] = this.limitRange(positions[1][1], this.data[0][1], this.data[1][1]);
      return positions;
    },

    limitRange(number, range1, range2) {
      let max, min;
      if (range1 > range2) {
        max = range1;
        min = range2;
      } else {
        max = range2;
        min = range1;
      }
      return Math.min(Math.max(number, min), max);
    },
  },
};
</script>

<template>
  <g>
    <line v-if="!data[2]" :x1="data[0][0]" :y1="data[0][1]" :x2="data[1][0]" :y2="data[1][1]" :class="classObject" />
    <!--
      Svg linearGradient uses objectBoundingBox in its code
      and threfore it wont apply if it has no content size.
      Strange bug with a strange solution (+ 0.001).
    -->
    <line
      v-for="i in animationLines"
      :x1="positions[i - 1][0][0]"
      :y1="positions[i - 1][0][1]"
      :x2="positions[i - 1][1][0] + 0.001"
      :y2="positions[i - 1][1][1] + 0.001"
      class="research-connection-animation"
      :stroke="`url(#linearGradient-${getDirection})`"
    />
  </g>
</template>

<style scoped>
.research-connection {
  stroke-width: 2px;
  stroke-opacity: 1;
  stroke: #403f43;
  transition-duration: 0.5s;
}

.research-connection-animation {
  stroke-width: 2px;
  stroke-opacity: 1;
  transition-duration: 0.5s;
}

.research-connection--active {
  stroke: rgba(94, 214, 255, 0.2);
}
</style>
