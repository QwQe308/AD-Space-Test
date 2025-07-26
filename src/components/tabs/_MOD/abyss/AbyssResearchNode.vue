<script>
export default {
  name: "ResearchNode",
  props: {
    node: {
      type: Object,
      required: true,
    },
    isResearching: {
      type: Boolean,
      default: false,
    },
    isUnlocked: {
      type: Boolean,
      default: false,
    },
    x: {
      type: Number,
      required: true,
    },
    y: {
      type: Number,
      required: true,
    },
    color: {
      type: String,
      default: "#3498db",
    },
    canStartResearch: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      isHovered: false,
    };
  },
  computed: {
    shapeClass() {
      return {
        "research-node--unlimited": this.node.type === "unlimited",
        "research-node--limited": this.node.type === "limited",
        "research-node--single": this.node.type === "single",
      };
    },
    levelText() {
      return this.node.maxLevel > 0 ? `${this.node.currentLevel}/${this.node.maxLevel}` : this.node.currentLevel;
    },
    nodeStyle() {
      return {
        left: `${this.x}px`,
        top: `${this.y}px`,
        opacity: this.isUnlocked ? 1 : 0.3,
        cursor: this.canStartResearch ? "pointer" : "default",
        pointerEvents: this.isUnlocked ? "auto" : "none",
        "--node-color": this.color,
      };
    },
    progressStyle() {
      if (this.node.type == "limited")
        return {
          height: `${this.node.progress * 141.5}%`,
        };
      return {
        height: `${this.node.progress * 100}%`,
      };
    },
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
    },
  },
};
</script>

<template>
  <div
    class="research-node"
    :class="[
      shapeClass,
      {
        'research-node--researching': isResearching,
        'research-node--hovered': isHovered,
      },
    ]"
    :style="nodeStyle"
    @click="handleClick"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
  >
    <div class="research-node__shape">
      <!-- 进度填充层 -->
      <div class="research-node__progress-mask">
        <div class="research-node__progress-fill" :style="progressStyle"></div>
      </div>

      <!-- 空心边框 -->
      <div class="research-node__border"></div>

      <!-- 等级文字 -->
      <div class="research-node__level" :class="{ 'reverse-rotation': node.type === 'limited' }">
        {{ levelText }}
      </div>
    </div>
    <div class="research-node__label">{{ node.name }}</div>
  </div>
</template>

<style scoped>
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
  background: #111014;
  overflow: hidden;
}

/* ========== 节点形状定义 ========== */
.research-node--unlimited .research-node__shape {
  /* 关键修复：使用伪元素创建完美圆形 */
  position: relative;
  border-radius: 50%;
  border: 3px solid var(--node-color);
  overflow: hidden;
  background: #111014 !important; /* 清除背景 */
}

.research-node--unlimited .research-node__border {
  border: 0px solid var(--node-color);
}

/* 有限型 - 菱形 */
.research-node--limited .research-node__shape {
  transform: rotate(45deg);
}
.research-node--limited .research-node__level {
  transform: rotate(-45deg); /* 文字反向旋转 */
}

/* 单次型 - 六边形 */
.research-node--single .research-node__shape {
  clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
}

/* ========== 空心边框 ========== */
.research-node__border {
  position: absolute;
  width: 100%;
  height: 100%;
  border: 3px solid var(--node-color, #3498db);
  box-sizing: border-box;
  z-index: 4;
  pointer-events: none;
}

/* ========== 进度填充系统 ========== */
.research-node__progress-container {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  z-index: 1;
}

/* 从下往上的填充效果 */
.research-node__progress-fill {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 0;
  background: var(--node-color, #3498db);
  opacity: 0.3;
  transition: height 0.8s cubic-bezier(0.22, 0.61, 0.36, 1);
}

/* 特殊形状的填充修正 */
.research-node--limited .research-node__progress-container,
.research-node--limited .research-node__progress-fill {
  transform: rotate(-45deg); /* 菱形填充修正 */
  transform-origin: center;
  width: 200%;
  left: -50%;
  bottom: -41.4%;
}

/* ========== 状态效果 ========== */
/* 研究中状态 */
.research-node--researching .research-node__shape {
  border-color: #f39c12;
}
.research-node--researching .research-node__border {
  border-color: #f39c12;
}

@keyframes pulse {
  0% {
    opacity: 0.8;
  }
  50% {
    opacity: 1;
  }
  100% {
    opacity: 0.8;
  }
}

/* 悬停效果 */
.research-node--hovered {
  transform: translate(-50%, -50%) scale(1.15);
  z-index: 10;
  filter: drop-shadow(0 5px 12px rgba(0, 0, 0, 0.4));
}

/* ========== 文字系统 ========== */
.research-node__level {
  position: relative;
  font-size: 1.2rem;
  font-weight: bold;
  color: white;
  z-index: 3;
  pointer-events: none;
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
</style>
