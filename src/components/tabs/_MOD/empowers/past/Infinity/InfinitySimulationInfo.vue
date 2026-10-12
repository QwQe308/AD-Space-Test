<script>
import { PastEmpower } from "../../../../../../core/_MOD/empowers/past/pastEmpower";
import { DC } from "../../../../../../core/constants";

export default {
  name: "InfinitySimulationInfo",
  data() {
    return {
      baseGain: PastEmpower.simulationGainOnSpeed("Infinity", DC.D1),
      baseGrowth: { infinityPoints: null, infinities: null },
    };
  },
  methods: {
    update() {
      this.baseGain = PastEmpower.simulationGainOnSpeed("Infinity", DC.D1);
      this.baseGrowth = {
        infinityPoints: Currency.infinityPoints.value.eq(0)
          ? null
          : this.baseGain.infinityPoints.div(Currency.infinityPoints.value),
        infinities: Currency.infinities.value.eq(0)
          ? null
          : this.baseGain.infinities.div(Currency.infinities.value),
      };
    },
  },
};
</script>

<template>
  <div class="info-container">
    <p>If simulating Infinity, expected rewards/sec will be (based on current Infinity):</p>
    <table>
      <tr>
        <th>Speed</th>
        <th>1x</th>
        <!-- Reserved for future Replicanti milestones. -->
        <th
          v-for="i in 4"
          :key="i"
          aria-label="Locked milestone"
        >
          <span
            class="locked-text"
            aria-hidden="true"
          >???x</span>
        </th>
      </tr>
      <tr>
        <th>IP<br>(Growth)</th>
        <td>
          {{ format(baseGain.infinityPoints, 2, 2) }}<br>(+{{
            baseGrowth.infinityPoints ? formatPercents(baseGrowth.infinityPoints, 2) : "∞"
          }}/s)
        </td>
        <td
          v-for="i in 4"
          :key="i"
          aria-label="Locked milestone"
        >
          <span
            class="locked-text"
            aria-hidden="true"
          >???<br>(+???/s)</span>
        </td>
      </tr>
      <tr>
        <th>Infinities<br>(Growth)</th>
        <td>
          {{ format(baseGain.infinities, 2, 2) }}<br>(+{{
            baseGrowth.infinities ? formatPercents(baseGrowth.infinities, 2) : "∞"
          }}/s)
        </td>
        <td
          v-for="i in 4"
          :key="i"
          aria-label="Locked milestone"
        >
          <span
            class="locked-text"
            aria-hidden="true"
          >???<br>(+???/s)</span>
        </td>
      </tr>
    </table>
  </div>
</template>

<style lang="css" scoped>
.weak {
  color: #888;
}

th {
  color: #888;
}

.locked-text {
  display: inline-block;
  filter: blur(3px);
  user-select: none;
  pointer-events: none;
}

.info-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
}
</style>
