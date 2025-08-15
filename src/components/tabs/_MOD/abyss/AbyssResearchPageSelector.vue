<script>
export default {
  name: "AbyssResearchPageSelector",
  props: {
    depth: {
      type: String,
      required: true,
    },
  },
  computed: {
    depthsList() {
      return abyssDepths;
    },
  },
  methods: {
    changeTab(tabId) {
      if (player.abyssResearchCanvas.currentAbyssResearchDepth === tabId) return;
      this.$emit("tab-change", tabId);
    },
    relocate() {
      this.$emit("relocate");
    },
  },
};
</script>

<template>
  <div class="research-tabs">
    <div
      v-for="depthID in depthsList"
      :key="depthID"
      class="research-tabs__item"
      :class="{ 'research-tabs__item--active': depth === depthID }"
      @click="changeTab(depthID)"
    >
      <span class="research-tabs__label">{{ depthID }}</span>
      <div class="research-tabs__indicator"></div>
    </div>

    <div class="relocate-button" @click="relocate" v-tooltip="'Relocate'">
      <span class="relocate-label">↻</span>
    </div>
  </div>
</template>

<style scoped>
.relocate-button {
  position: absolute;
  padding: 10px 32px;
  cursor: pointer;
  font-size: 1.8rem;
  font-weight: 500;
  transition: all 0.3s ease;
  opacity: 0.7;
  right: 0px
}
.relocate-lable{
  font-size: 1.5rem
}
.relocate-button:hover {
  background: rgba(52, 152, 219, 0.2);
  opacity: 1;
}

.research-tabs {
  display: flex;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  user-select: none;
}

.research-tabs__item {
  position: relative;
  padding: 16px 32px;
  cursor: pointer;
  font-size: 1.1rem;
  font-weight: 500;
  transition: all 0.3s ease;
  opacity: 0.7;
}

.research-tabs__item:hover {
  background: rgba(52, 152, 219, 0.2);
  opacity: 1;
}

.research-tabs__item--active {
  opacity: 1;
  color: #3498db;
  background: rgba(30, 31, 40, 0.95);
}

.research-tabs__item--active .research-tabs__indicator {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 3px;
  background: linear-gradient(to right, #3498db, #2ecc71);
}

@media (max-width: 768px) {
  .research-tabs {
    flex-wrap: wrap;
  }

  .research-tabs__item {
    padding: 12px 20px;
    font-size: 0.9rem;
  }
}
</style>
