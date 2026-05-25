<script>
import { PastEmpower } from "../../../../../../core/_MOD/empowers/past/pastEmpower";
import { DC } from "../../../../../../core/constants";

export default {
  name: "InfinitySimulationInfo",
  data() {
    return {
      thresholds: [
        DC.D1,
        PastEmpower.simulationMaxSpeed.pow(0.1),
        PastEmpower.simulationMaxSpeed.pow(0.25),
        PastEmpower.simulationMaxSpeed.pow(0.5),
        PastEmpower.simulationMaxSpeed,
      ],

      gainOnThresholds: Array(5).map((value, index) => {
        PastEmpower.simulationGainOnSpeed("Infinity", DC.D1);
      }),

      growthOnThresholds: Array(5).map((value, index) => {
        PastEmpower.simulationGainOnSpeed("Infinity", DC.D0);
      }),
    };
  },
  methods: {
    update() {
      this.thresholds = [
        DC.D1,
        PastEmpower.simulationMaxSpeed.pow(0.1),
        PastEmpower.simulationMaxSpeed.pow(0.25),
        PastEmpower.simulationMaxSpeed.pow(0.5),
        PastEmpower.simulationMaxSpeed,
      ];

      this.gainOnThresholds = this.thresholds.map((value) => PastEmpower.simulationGainOnSpeed("Infinity", value));

      this.growthOnThresholds = this.gainOnThresholds.map((value) => ({
        infinityPoints: Currency.infinityPoints.value.eq(0)
          ? null
          : value.infinityPoints.div(Currency.infinityPoints.value),
        infinities: Currency.infinities.value.eq(0) ? null : value.infinities.div(Currency.infinities.value),
      }));
    },
  },
};
</script>

<template>
  <div class="info-container">
    <p>If simulating Infinity, expected rewards will be (based on current Infinity):</p>
    <table>
      <tr>
        <th>Speed</th>
        <th>1x</th>
        <th>{{ format(thresholds[1], 2, 2) }}x (10%)</th>
        <th>{{ format(thresholds[2], 2, 2) }}x (25%)</th>
        <th>{{ format(thresholds[3], 2, 2) }}x (50%)</th>
        <th>{{ format(thresholds[4], 2, 2) }}x (100%)</th>
      </tr>
      <tr>
        <th>IP<br />(Growth)</th>
        <td v-for="i in 5" :key="i">
          {{ format(gainOnThresholds[i - 1].infinityPoints, 2, 2) }}<br />(+{{
            growthOnThresholds[i - 1].infinityPoints
              ? formatPercents(growthOnThresholds[i - 1].infinityPoints, 2)
              : "∞"
          }}/s)
        </td>
      </tr>
      <tr>
        <th>IS<br />(Growth)</th>
        <td v-for="i in 5" :key="i">
          {{ format(gainOnThresholds[i - 1].infinities, 2, 2) }}<br />(+{{
            growthOnThresholds[i - 1].infinities ? formatPercents(growthOnThresholds[i - 1].infinities, 2) : "∞"
          }}/s)
        </td>
      </tr>
    </table>
    <p class="weak">
      (Note that simulations' rewards are based on currencies gained on current Infinity, so after slowdown it may be lower
      than excepted)
    </p>
  </div>
</template>

<style lang="css" scoped>
.weak {
  color: #888;
}

th {
  color: #888;
}

.info-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
}
</style>
