<script>
import { PastEmpower } from "../../../../../../core/_MOD/empowers/past/pastEmpower";

export default {
  name: "EternitySimulationHeader",
  data() {
    return {
      epGain: PastEmpower.simulationGain.eternityPoints,
      eternitiesGain: PastEmpower.simulationGain.eternities,
    };
  },
  methods: {
    update() {
      ({ eternityPoints: this.epGain, eternities: this.eternitiesGain } = PastEmpower.simulationGain);
    },
  },
};
</script>

<template>
  <div>
    <p>Gaining {{ format(epGain, 2, 2) }} Eternity Points / sec</p>
    <p>Gaining {{ format(eternitiesGain, 2, 2) }} Eternities / sec</p>
  </div>
</template>
