<script>
export default {
  name: "ResearchConnection",
  props: {
    from: {
      type: Object,
      required: true
    },
    to: {
      type: Object,
      required: true
    },
    isActive: {
      type: Boolean,
      default: false
    },
    isUnlocked: {
      type: Boolean,
      default: false
    },
    isHidden: {
      type: Boolean,
      default: false
    },
    x1: {
      type: Number,
      required: true
    },
    y1: {
      type: Number,
      required: true
    },
    x2: {
      type: Number,
      required: true
    },
    y2: {
      type: Number,
      required: true
    }
  },
  computed: {
    classObject() {
      return {
        "research-connection": true,
        "research-connection--active": this.isActive,
        "research-connection--unlocked": this.isUnlocked
      };
    }
  },
};
</script>

<template>
  <line
    v-if="!isHidden"
    :x1="x1"
    :y1="y1"
    :x2="x2"
    :y2="y2"
    :class="classObject"
  />
</template>

<style scoped>
.research-connection {
  stroke-width: 4px;
  stroke: rgba(255, 255, 255, 0.2);
}

.research-connection--active {
  stroke: #f39c12;
  stroke-width: 3px;
}

.research-connection--unlocked {
  stroke-opacity: 1;
}
</style>