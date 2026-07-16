<script>
import { PresentMirrorUpgrades } from "../../../../../core/_MOD/empowers/present/presentEmpower";

export default {
  name: "Influence",
  props: {
    id: {
      type: String,
      required: true,
    },
  },
  methods: {
    update() {},
  },
  computed: {
    data() {
      return PresentMirrorUpgrades[id];
    },
    level() {
      return this.data.level;
    },
  },
};
</script>

<template>
  <div class="mirror-upgrade">
    <div class="description">Level: {{ level }}</div>
    <div class="toggler">
      <div class="toggler sub">-</div>
      <div class="toggler add">+</div>
    </div>
  </div>
</template>

<style scoped></style>
