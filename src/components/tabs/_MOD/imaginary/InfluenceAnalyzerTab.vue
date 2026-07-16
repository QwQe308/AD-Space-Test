<script>
import Influence from "./Influence.vue";

export default {
  name: "InfluenceAnalyzerTab",
  components: {
    Influence
  },
  data() {
    return {
      influences: [],
      totalInfluence: 0,
    };
  },
  methods: {
    update() {
      this.influences = cloneDeep(player.imaginaryInfluence);
      let sum = 0;
      this.influences.forEach(element => {
        sum += imaginaryInfluences[element].influenceStat;
      });
      this.totalInfluence = sum;
    },
  },
};
</script>

<template>
  <div>
    <div>
      You have <span class="influence-description">{{ totalInfluence }}</span> Influence Stats in total.<br>
    </div>
    <br>
    <span style="color:#888888">...Help us...</span>
    <br><br>
    <Influence
      v-for="item in influences"
      :id="item"
      :key="item/"
    />
  </div>
</template>

<style scoped>
.influence-description {
  font-size: 3.5rem;
  color: var(--color-imaginary);
}
</style>
