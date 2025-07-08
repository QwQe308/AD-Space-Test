<script>
export default {
  name: "ResearchNode",
  props: {
    node: {
      type: Object,
      required: true
    },
    isResearching: {
      type: Boolean,
      default: false
    },
    isUnlocked: {
      type: Boolean,
      default: false
    },
    x: {
      type: Number,
      required: true
    },
    y: {
      type: Number,
      required: true
    },
    color: {
      type: String,
      default: "#3498db"
    },
    canStartResearch: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      isHovered: false
    };
  },
  computed: {
    shapeClass() {
      return {
        "research-node--unlimited": this.node.type === "unlimited",
        "research-node--limited": this.node.type === "limited",
        "research-node--single": this.node.type === "single"
      };
    },
    levelText() {
      return this.node.maxLevel > 0 
        ? `${this.node.currentLevel}/${this.node.maxLevel}`
        : this.node.currentLevel;
    },
    nodeStyle() {
      return {
        left: `${this.x}px`,
        top: `${this.y}px`,
        opacity: this.isUnlocked ? 1 : 0.3,
        cursor: this.canStartResearch ? 'pointer' : 'default',
        pointerEvents: this.isUnlocked ? 'auto' : 'none',
        '--node-color': this.color
      };
    },
    shapeStyle() {
      return {
        background: this.isResearching 
          ? `linear-gradient(to top, ${this.color}, #f39c12)`
          : this.color
      };
    },
    progressStyle() {
      return {
        height: `${this.node.progress * 100}%`
      };
    }
  },
  methods: {
    handleClick(event) {
      this.$emit("node-click", { node: this.node, event });
    },
    handleMouseEnter() {
      this.isHovered = true;
      this.$emit("show-tooltip", this.node);
    },
    handleMouseLeave() {
      this.isHovered = false;
      this.$emit("hide-tooltip");
    }
  }
};
</script>

<template>
  <div
    class="research-node"
    :class="[shapeClass, {
      'research-node--researching': isResearching,
      'research-node--hovered': isHovered
    }]"
    :style="nodeStyle"
    @click="handleClick"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
  >
    <div class="research-node__shape" :style="shapeStyle">
      <!-- 添加内部容器用于反向旋转 -->
      <div class="shape-inner" :class="{ 'reverse-rotation': node.type === 'limited' }">
        <div class="research-node__progress" :style="progressStyle"></div>
        <div class="research-node__level">
          {{ levelText }}
        </div>
      </div>
    </div>
    <div class="research-node__label">{{ node.name }}</div>
  </div>
</template>

<style scoped>
/* 添加内部容器样式 */
.shape-inner {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

/* 反向旋转样式 */
.reverse-rotation {
  transform: rotate(-45deg);
}

/* 确保文字不旋转 */
.research-node__level {
  transform: none !important;
}


.research-node {
  position: absolute;
  transform: translate(-50%, -50%);
  transition: all 0.3s ease;
  filter: drop-shadow(0 3px 6px rgba(0, 0, 0, 0.3));
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.research-node__shape {
  position: relative;
  width: 60px;
  height: 60px;
  display: flex;
  justify-content: center;
  align-items: center;
  background: rgba(20, 21, 30, 0.9);
  border: 2px solid var(--node-color, #3498db);
  overflow: hidden;
}

.research-node--unlimited .research-node__shape {
  border-radius: 50%;
}

.research-node--limited .research-node__shape {
  transform: rotate(45deg);
}

.research-node--single .research-node__shape {
  clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
}

.research-node__progress {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  background: linear-gradient(to top, var(--node-color, #3498db), #2ecc71);
  transition: height 0.8s cubic-bezier(0.22, 0.61, 0.36, 1);
}

.research-node__level {
  position: relative;
  font-size: 1.2rem;
  font-weight: bold;
  color: white;
  z-index: 3;
}

.research-node__label {
  margin-top: 10px;
  text-align: center;
  font-size: 0.9rem;
  font-weight: 500;
  max-width: 120px;
  padding: 5px 8px;
  background: rgba(30, 31, 40, 0.9);
  border-radius: 5px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  white-space: nowrap;
}

.research-node--researching .research-node__shape {
  border-color: #f39c12;
}

.research-node--hovered {
  transform: translate(-50%, -50%) scale(1.15);
  z-index: 10;
  filter: drop-shadow(0 5px 12px rgba(0, 0, 0, 0.4));
}
</style>