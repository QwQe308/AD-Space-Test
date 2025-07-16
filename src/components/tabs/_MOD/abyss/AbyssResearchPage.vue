<script>
export default {
  name: "ResearchTabs",
  props: {
    categories: {
      type: Array,
      required: true
    },
    initialTab: {
      type: String,
      default: null
    }
  },
  data() {
    return {
      activeTab: this.initialTab || (this.categories.length > 0 ? this.categories[0].id : null)
    };
  },
  computed: {
    hasTabs() {
      return this.categories.length > 0;
    }
  },
  methods: {
    changeTab(tabId) {
      if (this.activeTab === tabId) return;
      this.activeTab = tabId;
      this.$emit("tab-change", tabId);
    }
  },
  watch: {
    initialTab(newVal) {
      this.activeTab = newVal;
    }
  }
};
</script>

<template>
  <div class="research-tabs" v-if="hasTabs">
    <div 
      v-for="category in categories" 
      :key="category.id"
      class="research-tabs__item"
      :class="{ 'research-tabs__item--active': activeTab === category.id }"
      @click="changeTab(category.id)"
    >
      <span class="research-tabs__label">{{ category.name }}</span>
      <div class="research-tabs__indicator"></div>
    </div>
  </div>
</template>

<style scoped>
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