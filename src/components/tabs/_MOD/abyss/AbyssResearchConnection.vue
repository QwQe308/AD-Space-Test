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
      animationSpeed: 1, // percentage / tick
      animationLineLength: 20, //in percentage
      positions: [
        [
          [-10000, -10000],
          [-10000, -10000],
        ],
        [
          [-10000, -10000],
          [-10000, -10000],
        ],
      ],
      animationPercentages: [-60, 0],
      animationLines: 2,
      direction: "right-upwards",
    };
  },
  computed: {
    classObject() {
      return {
        "research-connection": true,
        "research-connection--active": this.isResearching,
      };
    },
  },
  methods: {
    update() {
      this.isResearching = AbyssResearches[this.data[2]].isResearching;
      if (!this.isResearching) {
        this.animationPercentages = [-60, 0];
        this.positions = [
          [
            [-10000, -10000],
            [-10000, -10000],
          ],
          [
            [-10000, -10000],
            [-10000, -10000],
          ],
        ];
        return;
      }
      for (let i = 0; i < this.animationLines; i++) {
        this.animationPercentages[i] += this.animationSpeed;
        if (this.animationPercentages[i] > this.animationLineLength + 100) {
          this.animationPercentages[i] = 0;
        }
        this.$set(this.positions, i, this.calcPosition(this.animationPercentages[i]))
      }
      this.direction =
        this.data[1][0] > this.data[0][0]
          ? this.data[1][1] < this.data[0][1]
            ? "right-upwards"
            : "right-downwards"
          : this.data[1][1] < this.data[0][1]
          ? "left-upwards"
          : "left-downwards";
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
    <line :x1="data[0][0]" :y1="data[0][1]" :x2="data[1][0]" :y2="data[1][1]" :class="classObject" />
    <line
      :x1="positions[0][0][0]"
      :y1="positions[0][0][1]"
      :x2="positions[0][1][0]"
      :y2="positions[0][1][1]"
      class="research-connection-animation"
      :stroke="`url(#linearGradient-${direction})`"
    />
    <line
      :x1="positions[1][0][0]"
      :y1="positions[1][0][1]"
      :x2="positions[1][1][0]"
      :y2="positions[1][1][1]"
      class="research-connection-animation"
      :stroke="`url(#linearGradient-${direction})`"
    />
  </g>
</template>

<style scoped>
.research-connection {
  stroke-width: 2px;
  stroke-opacity: 1;
  stroke: rgba(255, 255, 255, 0.2);
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
