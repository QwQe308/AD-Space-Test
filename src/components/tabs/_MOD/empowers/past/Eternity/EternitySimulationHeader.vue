<script>
import { PastEmpower } from "../../../../../../core/_MOD/empowers/past/pastEmpower";

export default {
  name: "EternitySimulationHeader",
  data() {
    return {
      epGain: new Decimal(0),
      eternitiesGain: new Decimal(0),
      currentEP: new Decimal(0),
      currentEternities: new Decimal(0),
    };
  },
  methods: {
    update() {
      const gains = PastEmpower.simulationGain;
      this.epGain.copyFrom(gains.eternityPoints ?? new Decimal(0));
      this.eternitiesGain.copyFrom(gains.eternities ?? new Decimal(0));
      this.currentEP.copyFrom(Currency.eternityPoints.value);
      this.currentEternities.copyFrom(Currency.eternities.value);
    },
    growthPercent(gain, current) {
      if (current.eq(0)) return gain.eq(0) ? this.format(0, 2, 2) : "—";
      return this.format(gain.div(current).mul(100), 2, 2);
    },
  },
};
</script>

<template>
  <div class="simulation-gain-columns">
    <div>
      <p>Gaining {{ format(epGain, 2, 2) }} Eternity Points / sec</p>
      <p>Gaining {{ format(eternitiesGain, 2, 2) }} Eternities / sec</p>
    </div>
    <div class="division">
      <p>|</p>
      <p>|</p>
    </div>
    <div>
      <p>{{ format(currentEP, 2, 2) }} EP</p>
      <p>{{ format(currentEternities, 2, 2) }} Eternities</p>
    </div>
    <div class="division">
      <p>|</p>
      <p>|</p>
    </div>
    <div>
      <p>+ {{ growthPercent(epGain, currentEP) }} %/sec</p>
      <p>+ {{ growthPercent(eternitiesGain, currentEternities) }} %/sec</p>
    </div>
  </div>
</template>

<style scoped>
.simulation-gain-columns {
  display: flex;
  column-gap: 20px;
}
</style>
