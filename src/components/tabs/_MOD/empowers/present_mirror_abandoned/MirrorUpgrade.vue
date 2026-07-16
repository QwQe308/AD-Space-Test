<script>
import { PresentMirrorUpgrades } from "../../../../../core/_MOD/empowers/_present_mirror_abandoned/presentEmpower";

export default {
  name: "Influence",
  props: {
    id: {
      type: String,
      required: true,
    },
  },
  computed: {
    data() {
      return PresentMirrorUpgrades[id];
    },
    level() {
      return this.data.level;
    },
  },
  methods: {
    update() {},
  },
};
</script>

<template>
  <div class="mirror-upgrade">
    <div class="description">
      Level: {{ level }}
    </div>
    <div class="toggler">
      <div class="toggler sub">
        -
      </div>
      <div class="toggler add">
        +
      </div>
    </div>
  </div>
</template>

<style scoped></style>
