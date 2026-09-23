<script>
import { PastEmpower } from "../../../../../../core/_MOD/empowers/past/pastEmpower";
import { DC } from "../../../../../../core/constants";

export default {
  name: "EternitySimulationInfo",
  data() {
    return {
      thresholds: [
        DC.D1,
        PastEmpower.simulationMaxSpeed.pow(0.1),
        PastEmpower.simulationMaxSpeed.pow(0.25),
        PastEmpower.simulationMaxSpeed.pow(0.5),
        PastEmpower.simulationMaxSpeed,
      ],

      gainOnThresholds: Array.from({ length: 5 }, () =>
        PastEmpower.simulationGainOnSpeed("Eternity", DC.D1)),

      growthOnThresholds: Array.from({ length: 5 }, () => ({ eternityPoints: null, eternities: null })),
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

      this.gainOnThresholds = this.thresholds.map(value => PastEmpower.simulationGainOnSpeed("Eternity", value));

      this.growthOnThresholds = this.gainOnThresholds.map(value => ({
        eternityPoints: Currency.eternityPoints.value.eq(0)
          ? null
          : value.eternityPoints.div(Currency.eternityPoints.value),
        eternities: Currency.eternities.value.eq(0) ? null : value.eternities.div(Currency.eternities.value),
      }));
    },
  },
};
</script>

<template>
  <div class="info-container">
    <p>If simulating Eternity, expected rewards/sec will be (based on current Eternity, assuming 33ms per reset):</p>
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
        <th>EP<br>(Growth)</th>
        <td
          v-for="i in 5"
          :key="i"
        >
          {{ format(gainOnThresholds[i - 1].eternityPoints, 2, 2) }}<br>(+{{
            growthOnThresholds[i - 1].eternityPoints
              ? formatPercents(growthOnThresholds[i - 1].eternityPoints, 2)
              : "∞"
          }}/s)
        </td>
      </tr>
      <tr>
        <th>Eternities<br>(Growth)</th>
        <td
          v-for="i in 5"
          :key="i"
        >
          {{ format(gainOnThresholds[i - 1].eternities, 2, 2) }}<br>(+{{
            growthOnThresholds[i - 1].eternities ? formatPercents(growthOnThresholds[i - 1].eternities, 2) : "∞"
          }}/s)
        </td>
      </tr>
    </table>
    <p class="weak">
      (Note that simulations' rewards are based on currencies gained on current Eternity, so after slowdown it may be lower
      than expected)
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
