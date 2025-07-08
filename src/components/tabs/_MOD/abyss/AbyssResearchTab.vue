<script>
import ResearchTabs from "./AbyssResearchPage.vue";
import ResearchNode from "./AbyssResearchNode.vue";
import ResearchConnection from "./AbyssResearchConnection.vue";
import TooltipContent from "./AbyssResearchToolTip.vue";

export default {
  name: "AbyssResearchTab",
  components: {
    ResearchTabs,
    ResearchNode,
    ResearchConnection,
    TooltipContent,
  },
  data() {
    return {
      researchCategories: window.researchCategories,
      researchNodes: window.abyssResearches,
      researchManager: new ResearchManager(),
      currentCategory: "1",
      zoomLevel: 1,
      offsetX: 0,
      offsetY: 0,
      isDragging: false,
      dragStartX: 0,
      dragStartY: 0,
      startOffsetX: 0,
      startOffsetY: 0,
      tooltip: {
        node: null,
        x: 0,
        y: 0,
        visible: false,
      },
    };
  },
  computed: {
    currentNodes() {
      return this.researchNodes[this.currentCategory] || [];
    },
    filteredNodes() {
      return this.currentNodes.filter((node) => node.unlocked());
    },
    activeResearches() {
      return this.currentNodes.filter((node) => this.researchManager.isResearching(node));
    },
    currentCategoryName() {
      const category = this.researchCategories.find((c) => c.id === this.currentCategory);
      return category ? category.name : "";
    },
    connections() {
      const conns = [];
      this.currentNodes.forEach((node) => {
        if (node.nextIds && node.nextIds.length) {
          node.nextIds.forEach((nextId) => {
            const targetNode = this.currentNodes.find((n) => n.id === nextId);
            if (targetNode && targetNode.unlocked()) {
              conns.push({
                from: node.id,
                to: nextId,
                fromNode: node,
                toNode: targetNode,
              });
            }
          });
        }
      });
      return conns;
    },
    tooltipStyle() {
      return {
        left: `${this.tooltip.x}px`,
        top: `${this.tooltip.y}px`,
        opacity: this.tooltip.visible ? 1 : 0,
      };
    },
    maxConcurrent() {
      return this.researchManager.maxConcurrent;
    },
  },
  methods: {
    getCategoryColor(categoryId) {
      const category = this.researchCategories.find((c) => c.id === categoryId);
      return category ? category.color : "#3498db";
    },
    handleTabChange(categoryId) {
      this.currentCategory = categoryId;
      this.resetView();
    },
    updateCanvasTransform() {
      if (this.$refs.canvas) {
        this.$refs.canvas.style.transform = `translate(${this.offsetX}px, ${this.offsetY}px) scale(${this.zoomLevel})`;
      }
    },
    handleZoom(event) {
      const delta = event.deltaY * -0.001;
      const newZoom = Math.min(Math.max(0.5, this.zoomLevel + delta), 2);

      if (this.$refs.canvas) {
        const rect = this.$refs.canvasContainer.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        const zoomFactor = newZoom / this.zoomLevel;

        this.offsetX -= (x - this.offsetX) * (zoomFactor - 1);
        this.offsetY -= (y - this.offsetY) * (zoomFactor - 1);

        this.zoomLevel = newZoom;
        this.updateCanvasTransform();
      }
    },
    zoomIn() {
      this.zoomLevel = Math.min(this.zoomLevel + 0.1, 2);
      this.updateCanvasTransform();
    },
    zoomOut() {
      this.zoomLevel = Math.max(this.zoomLevel - 0.1, 0.5);
      this.updateCanvasTransform();
    },
    resetView() {
      this.zoomLevel = 1;
      this.offsetX = 0;
      this.offsetY = 0;
      this.updateCanvasTransform();
    },
    startDrag(event) {
      this.isDragging = true;
      this.dragStartX = event.clientX;
      this.dragStartY = event.clientY;
      this.startOffsetX = this.offsetX;
      this.startOffsetY = this.offsetY;
    },
    drag(event) {
      if (this.isDragging) {
        this.offsetX = this.startOffsetX + (event.clientX - this.dragStartX);
        this.offsetY = this.startOffsetY + (event.clientY - this.dragStartY);
        this.updateCanvasTransform();
      }
    },
    endDrag() {
      this.isDragging = false;
    },
    showTooltip(node, event) {
      this.tooltip.node = node;
      this.tooltip.visible = true;
      if (event) {
        this.tooltip.x = event.clientX + 15;
        this.tooltip.y = event.clientY + 15;
      }
    },
    hideTooltip() {
      this.tooltip.visible = false;
      this.tooltip.node = null;
    },
    handleNodeClick({ node, event }) {
      if (event.ctrlKey || event.metaKey) {
        this.showTooltip(node, event);
      } else if (this.researchManager.canStartResearch(node)) {
        this.startResearch(node);
      } else if (this.researchManager.isResearching(node)) {
        alert(`${node.name} 正在研究中...`);
      } else if (!node.requirements()) {
        alert(`无法开始研究: ${this.getRequirementsText(node)}`);
      }
    },
    startResearch(node) {
      if (this.researchManager.startResearch(node)) {
        alert(`已开始研究: ${node.name}`);
      }
    },
    startResearchFromTooltip(node) {
      this.startResearch(node);
      this.hideTooltip();
    },
    simulateProgress() {
      this.activeResearches.forEach((node) => {
        if (node.progress < 1) {
          node.progress = Math.min(1, node.progress + 0.1);
          if (node.progress === 1) {
            this.researchManager.completeResearch(node);
          }
        }
      });
    },
    getRequirementsText(node) {
      return "需要前置研究";
    },
    calculateConnectionPositions(connection) {
      const from = this.currentNodes.find((n) => n.id === connection.from);
      const to = this.currentNodes.find((n) => n.id === connection.to);
      return {
        x1: from.x + from.width / 2,
        y1: from.y + from.height / 2,
        x2: to.x + to.width / 2,
        y2: to.y + to.height / 2,
      };
    },
    isConnectionActive(connection) {
      const from = this.currentNodes.find((n) => n.id === connection.from);
      const to = this.currentNodes.find((n) => n.id === connection.to);
      return this.researchManager.isResearching(from) || this.researchManager.isResearching(to);
    },
  },
  mounted() {
    this.updateCanvasTransform();
    this.currentNodes.forEach((node) => {
      if (node.unlocked()) {
        this.researchManager.unlockNextResearches(node);
      }
    });
  },
};
</script>

<template>
  <div class="research-wrapper">
    <!-- 新增的wrapper -->
    <main class="research-container">
      <ResearchTabs :categories="researchCategories" :initial-tab="currentCategory" @tab-change="handleTabChange" />

      <div class="canvas-container" ref="canvasContainer">
        <div class="canvas-background"></div>

        <div
          class="research-canvas"
          ref="canvas"
          @mousedown="startDrag"
          @mousemove="drag"
          @mouseup="endDrag"
          @mouseleave="endDrag"
          @wheel.prevent="handleZoom"
        >
          <!-- 添加 SVG 连接线图层 -->
          <svg class="connections-layer" width="100%" height="100%">
            <ResearchConnection
              v-for="(connection, index) in connections"
              :key="'conn-' + index"
              :from="connection.fromNode"
              :to="connection.toNode"
              :is-active="isConnectionActive(connection)"
              :is-unlocked="true"
              :x1="connection.fromNode.x - 10"
              :y1="connection.fromNode.y - 10"
              :x2="connection.toNode.x - 10"
              :y2="connection.toNode.y - 10"
            />
          </svg>
          <div class="category-indicator">{{ currentCategoryName }}</div>

          <ResearchNode
            v-for="(node, index) in filteredNodes"
            :key="index"
            :node="node"
            :is-researching="researchManager.isResearching(node)"
            :is-unlocked="node.unlocked()"
            :x="node.x"
            :y="node.y"
            :color="getCategoryColor(node.category)"
            :can-start-research="researchManager.canStartResearch(node)"
            @node-click="handleNodeClick"
            @show-tooltip="showTooltip"
            @hide-tooltip="hideTooltip"
          />
        </div>

        <div class="zoom-info">
          <i class="fas fa-search-plus"></i>
          <span>缩放: {{ (zoomLevel * 100).toFixed(0) }}%</span>
        </div>

        <div class="tooltip" ref="tooltip" :style="tooltipStyle">
          <TooltipContent
            v-if="tooltip.node"
            :node="tooltip.node"
            :is-researching="researchManager.isResearching(tooltip.node)"
            :is-completed="tooltip.node.progress === 1"
            :is-unlocked="tooltip.node.unlocked()"
            :can-start-research="researchManager.canStartResearch(tooltip.node)"
            :requirements-met="tooltip.node.requirements()"
            @start-research="startResearchFromTooltip"
          />
        </div>

        <div class="active-research-info" v-if="activeResearches.length > 0">
          <h3>正在研究 ({{ activeResearches.length }}/{{ maxConcurrent }})</h3>
          <div class="active-list">
            <div v-for="research in activeResearches" :key="research.id" class="active-item">
              {{ research.name }} ({{ (research.progress * 100).toFixed(1) }}%)
            </div>
          </div>
        </div>
      </div>

      <div class="controls">
        <button class="btn" @click="zoomIn">
          <i class="fas fa-search-plus"></i>
          <span>放大</span>
        </button>
        <button class="btn" @click="zoomOut">
          <i class="fas fa-search-minus"></i>
          <span>缩小</span>
        </button>
        <button class="btn btn-outline" @click="resetView">
          <i class="fas fa-sync-alt"></i>
          <span>重置视图</span>
        </button>
        <button class="btn btn-outline" @click="simulateProgress">
          <i class="fas fa-flask"></i>
          <span>模拟进度</span>
        </button>
      </div>

      <div class="legend">
        <div class="legend-item">
          <div class="legend-shape legend-circle"></div>
          <span>无等级上限</span>
        </div>
        <div class="legend-item">
          <div class="legend-shape legend-diamond"></div>
          <span>有等级上限</span>
        </div>
        <div class="legend-item">
          <div class="legend-shape legend-hexagon"></div>
          <span>只能研究一次</span>
        </div>
        <div class="legend-item">
          <div class="legend-shape" style="background: linear-gradient(to top, #3498db, #2ecc71)"></div>
          <span>研究进度</span>
        </div>
        <div class="legend-item">
          <div class="legend-shape" style="background: rgba(255, 255, 255, 0.2)"></div>
          <span>关联关系</span>
        </div>
        <div class="legend-item">
          <div class="legend-shape" style="border-color: #f39c12"></div>
          <span>正在研究</span>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.connections-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1;
}

.research-wrapper {
  height: 70vh;
  display: flex;
  overflow: hidden;
}

.research-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}

/* 修改canvas容器 */
.canvas-container {
  flex: 1;
  position: relative;
  overflow: hidden;
  min-height: 300px;
  overflow: hidden; /* 改为 auto 允许滚动 */
}

.research-canvas {
  position: absolute;
  top: -5000px;
  left: -5000px;
  width: 10000px; /* 确保画布足够大 */
  height: 10000px;
  transform-origin: 5000px 5000px;
  cursor: grab;
}

.research-canvas:active {
  cursor: grabbing;
}

.canvas-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  /* background-image: linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px); */
  background-size: 40px 40px;
}

.category-indicator {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 1.5rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.05);
  text-transform: uppercase;
  letter-spacing: 5px;
  pointer-events: none;
  user-select: none;
  z-index: 0;
}

.zoom-info {
  position: absolute;
  top: 20px;
  right: 20px;
  background: rgba(20, 21, 30, 0.8);
  padding: 10px 15px;
  border-radius: 30px;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 8px;
  z-index: 5;
}

.tooltip {
  position: fixed;
  z-index: 100;
  pointer-events: none;
  transition: opacity 0.3s ease;
}

.active-research-info {
  position: absolute;
  bottom: 20px;
  left: 20px;
  background: rgba(20, 21, 30, 0.9);
  padding: 15px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  z-index: 5;
}

.active-research-info h3 {
  margin-bottom: 10px;
  color: #f39c12;
}

.active-list {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.active-item {
  padding: 5px 10px;
  background: rgba(30, 31, 40, 0.8);
  border-radius: 5px;
}

.controls {
  display: flex;
  justify-content: center;
  gap: 20px;
  padding: 20px;
  background: rgba(20, 21, 30, 0.95);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.btn {
  padding: 12px 25px;
  background: linear-gradient(to right, #3498db, #2ecc71);
  color: white;
  border: none;
  border-radius: 30px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
}

.btn-outline {
  background: transparent;
  border: 2px solid #3498db;
  color: #3498db;
}

.legend {
  display: flex;
  justify-content: center;
  gap: 30px;
  padding: 20px;
  background: rgba(20, 21, 30, 0.7);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

.legend-shape {
  width: 20px;
  height: 20px;
  border: 2px solid;
  position: relative;
}

.legend-diamond {
  transform: rotate(45deg);
  border-color: #3498db;
}

.legend-circle {
  border-radius: 50%;
  border-color: #2ecc71;
}

.legend-hexagon {
  clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
  border-color: #9b59b6;
}

@media (max-width: 768px) {
  .controls {
    flex-wrap: wrap;
  }

  .legend {
    flex-wrap: wrap;
  }
}
</style>
