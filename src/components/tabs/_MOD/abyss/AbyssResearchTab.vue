<script>
//This is a rewritten version of that code. Thats too junky.
import AbyssResearchConnection from "./AbyssResearchConnection.vue";
import AbyssResearchNode from "./AbyssResearchNode.vue";
import AbyssResearchPageSelector from "./AbyssResearchPageSelector.vue";

export default {
  name: "AbyssResearchTab",
  data() {
    return {
      depth: "0",
      shownNodes: [],
      activeNodes: new Set(),
      connections: [],

      zoomLevel: 1,
      offsetX: 750,
      offsetY: 333,

      isDragging: false,
      dragStartX: 0,
      dragStartY: 0,
      startOffsetX: 0,
      startOffsetY: 0,
    };
  },
  components: {
    AbyssResearchConnection,
    AbyssResearchNode,
    AbyssResearchPageSelector,
  },
  computed: {
    getCurrentNodes() {
      // only give keys
      return Object.keys(AbyssResearchesSortByDepth[this.depth]);
    },
    getConnections() {
      // [[x1,y1],[x2,y2],isResearching]
      let connections = [];
      for (let id of this.shownNodes) {
        for (let id2 of AbyssResearches[id].next) {
          if (this.shownNodes.includes(id2)) {
            connections.push([
              [AbyssResearches[id].x, AbyssResearches[id].y],
              [AbyssResearches[id2].x, AbyssResearches[id2].y],
              AbyssResearches[id2].id,
            ]);
          }
        }
      }
      return connections;
    },
  },
  methods: {
    update() {
      this.offsetX = player.abyssResearchCanvas.offsetX;
      this.offsetY = player.abyssResearchCanvas.offsetY;
      this.zoomLevel = player.abyssResearchCanvas.zoomLevel;
      this.depth = player.abyssResearchCanvas.currentAbyssResearchDepth;
      this.shownNodes = this.getCurrentNodes.filter((x) => player.abyssResearches[x].shown);
      this.activeNodes = player.activeAbyssResearches;
    },

    updateCanvasTransform() {
      this.offsetX = player.abyssResearchCanvas.offsetX;
      this.offsetY = player.abyssResearchCanvas.offsetY;
      this.zoomLevel = player.abyssResearchCanvas.zoomLevel;
      if (this.$refs.canvas) {
        this.$refs.canvas.style.transform = `translate(${this.offsetX}px, ${this.offsetY}px) scale(${this.zoomLevel})`;
      }
    },

    startDrag(event) {
      this.isDragging = true;
      this.dragStartX = event.clientX;
      this.dragStartY = event.clientY;
      this.startOffsetX = this.offsetX;
      this.startOffsetY = this.offsetY;
    },
    drag(event) {
      //this.updateTooltipPosition(event);
      if (this.isDragging) {
        player.abyssResearchCanvas.offsetX = this.startOffsetX + (event.clientX - this.dragStartX);
        player.abyssResearchCanvas.offsetY = this.startOffsetY + (event.clientY - this.dragStartY);
        this.updateCanvasTransform();
      }
    },
    endDrag() {
      this.isDragging = false;
    },

    handleZoom(event) {
      const delta = event.deltaY * -0.001;
      const newZoom = Math.min(Math.max(0.5, this.zoomLevel + delta), 2);

      if (this.$refs.canvas) {
        const rect = this.$refs.canvasContainer.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        const zoomFactor = newZoom / this.zoomLevel;

        player.abyssResearchCanvas.offsetX -= (x - this.offsetX) * (zoomFactor - 1);
        player.abyssResearchCanvas.offsetY -= (y - this.offsetY) * (zoomFactor - 1);

        player.abyssResearchCanvas.zoomLevel = newZoom;
        this.zoomLevel = newZoom;
        this.updateCanvasTransform();
      }
    },

    handleTabChange(newVal) {
      player.abyssResearchCanvas.currentAbyssResearchDepth = newVal;
      this.depth = newVal;
    },

    relocate() {
      player.abyssResearchCanvas.offsetX = 750;
      player.abyssResearchCanvas.offsetY = 333;
      player.abyssResearchCanvas.zoomLevel = 1;
      this.updateCanvasTransform();
    },
  },
  watch: {
    shownNodes() {
      this.connections = this.getConnections;
    },
  },
  mounted() {
    this.updateCanvasTransform();
  },
};
</script>

<template>
  <div class="research-wrapper">
    <div class="canvas-container" ref="canvasContainer">
      <div
        class="research-canvas"
        ref="canvas"
        @mousedown="startDrag"
        @mousemove="drag"
        @mouseup="endDrag"
        @mouseleave="endDrag"
        @wheel.prevent="handleZoom"
      >
        <AbyssResearchNode v-for="id in shownNodes" :key="id" :id="id"></AbyssResearchNode>
        <!-- lines -->
        <svg class="connections-layer" width="100%" height="100%">
          <defs>
            <linearGradient id="linearGradient-right-upwards" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" style="stop-color: rgba(94, 214, 255, 0); stop-opacity: 1" />
              <stop offset="100%" style="stop-color: rgba(94, 214, 255, 1); stop-opacity: 1" />
            </linearGradient>
            <linearGradient id="linearGradient-left-upwards" x1="100%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" style="stop-color: rgba(94, 214, 255, 0); stop-opacity: 1" />
              <stop offset="100%" style="stop-color: rgba(94, 214, 255, 1); stop-opacity: 1" />
            </linearGradient>
            <linearGradient id="linearGradient-right-downwards" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="stop-color: rgba(94, 214, 255, 0); stop-opacity: 1" />
              <stop offset="100%" style="stop-color: rgba(94, 214, 255, 1); stop-opacity: 1" />
            </linearGradient>
            <linearGradient id="linearGradient-left-downwards" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style="stop-color: rgba(94, 214, 255, 0); stop-opacity: 1" />
              <stop offset="100%" style="stop-color: rgba(94, 214, 255, 1); stop-opacity: 1" />
            </linearGradient>
          </defs>
          <AbyssResearchConnection
            v-for="(connection, index) in connections"
            :key="'conn-' + index"
            :data="connection"
            :id="'conn-' + index"
          />
        </svg>
      </div>
      <AbyssResearchPageSelector :depth="depth" @tab-change="handleTabChange" @relocate="relocate" />
    </div>
  </div>
</template>

<style scoped>
.research-wrapper {
  height: 71.5vh;
  display: flex;
  overflow: hidden;
  user-select: none;
  padding-bottom: 0 !important;
}

.research-canvas {
  position: absolute;
  top: -5000px;
  left: -5000px;
  width: 10000px; /* 确保画布足够大 */
  height: 10000px;
  cursor: grab;
}

.research-canvas:active {
  cursor: grabbing;
}

.canvas-container {
  flex: 1;
  position: relative;
  overflow: hidden;
  min-height: 300px;
  overflow: hidden; /* 改为 auto 允许滚动 */
}
</style>
