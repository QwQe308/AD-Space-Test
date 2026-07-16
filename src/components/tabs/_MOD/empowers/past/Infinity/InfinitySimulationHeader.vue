<script>
import { PastEmpower } from "../../../../../../core/_MOD/empowers/past/pastEmpower";

export default {
  name: "InfinitySimulationHeader",
  data() {
    return {
      ipGain: PastEmpower.simulationGain.infinityPoints,
      isGain: PastEmpower.simulationGain.infinities,
    };
  },
  methods: {
    update() {
      ({ infinityPoints: this.ipGain, infinities: this.isGain } = PastEmpower.simulationGain);
    },
  },
};
</script>

<template>
  <div>
    <p>Gaining {{ format(ipGain, 2, 2) }} Infinity Points / sec</p>
    <p>Gaining {{ format(isGain, 2, 2) }} Infinity Stats / sec</p>
  </div>
</template>
