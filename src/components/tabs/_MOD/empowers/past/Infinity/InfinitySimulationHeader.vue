<script>
import { PastEmpower } from "../../../../../../core/_MOD/empowers/past/pastEmpower";

export default {
  name: "InfinitySimulationHeader",
  data() {
    return {
      ipGain: new Decimal(0),
      isGain: new Decimal(0),
      currentIP: new Decimal(0),
      currentIS: new Decimal(0),
    };
  },
  methods: {
    update() {
      const gains = PastEmpower.simulationGain;
      this.ipGain.copyFrom(gains.infinityPoints ?? new Decimal(0));
      this.isGain.copyFrom(gains.infinities ?? new Decimal(0));
      this.currentIP.copyFrom(Currency.infinityPoints.value);
      this.currentIS.copyFrom(Currency.infinities.value);
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
      <p>Gaining {{ format(ipGain, 2, 2) }} Infinity Points / sec</p>
      <p>Gaining {{ format(isGain, 2, 2) }} Infinity Stats / sec</p>
    </div>
    <div class="division">
      <p>|</p>
      <p>|</p>
    </div>
    <div>
      <p>{{ format(currentIP, 2, 2) }} IP</p>
      <p>{{ format(currentIS, 2, 2) }} Infinities</p>
    </div>
    <div class="division">
      <p>|</p>
      <p>|</p>
    </div>
    <div>
      <p>+ {{ growthPercent(ipGain, currentIP) }} %/sec</p>
      <p>+ {{ growthPercent(isGain, currentIS) }} %/sec</p>
    </div>
  </div>
</template>

<style scoped>
.simulation-gain-columns {
  display: flex;
  column-gap: 20px;
}
</style>
