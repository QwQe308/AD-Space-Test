<script>
import { PastEmpower } from "../../../../../../core/_MOD/empowers/past/pastEmpower";
import { DC } from "../../../../../../core/constants";

export default {
  name: "EternitySimulationInfo",
  data() {
    return {
      baseGain: PastEmpower.simulationGainOnSpeed("Eternity", DC.D1),
      baseGrowth: { eternityPoints: null, eternities: null },
    };
  },
  methods: {
    update() {
      this.baseGain = PastEmpower.simulationGainOnSpeed("Eternity", DC.D1);
      this.baseGrowth = {
        eternityPoints: Currency.eternityPoints.value.eq(0)
          ? null
          : this.baseGain.eternityPoints.div(Currency.eternityPoints.value),
        eternities: Currency.eternities.value.eq(0)
          ? null
          : this.baseGain.eternities.div(Currency.eternities.value),
      };
    },
  },
};
</script>

<template>
  <div class="info-container">
    <p>If simulating Eternity, expected rewards/sec will be (based on current Eternity):</p>
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
        <th>EP<br>(Growth)</th>
        <td>
          {{ format(baseGain.eternityPoints, 2, 2) }}<br>(+{{
            baseGrowth.eternityPoints ? formatPercents(baseGrowth.eternityPoints, 2) : "∞"
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
        <th>Eternities<br>(Growth)</th>
        <td>
          {{ format(baseGain.eternities, 2, 2) }}<br>(+{{
            baseGrowth.eternities ? formatPercents(baseGrowth.eternities, 2) : "∞"
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

table {
  width: 100%;
  table-layout: fixed;
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
