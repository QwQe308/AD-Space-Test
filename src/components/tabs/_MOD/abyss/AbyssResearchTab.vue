<script>
// This is a rewritten version of that code. Thats too junky.
import { AbyssResearchHelperTools } from "../../../../core/globals";

import AbyssResearchConnection from "./AbyssResearchConnection.vue";
import AbyssResearchNode from "./AbyssResearchNode.vue";
import AbyssResearchPageSelector from "./AbyssResearchPageSelector.vue";

export default {
  name: "AbyssResearchTab",

  components: {
    AbyssResearchConnection,
    AbyssResearchNode,
    AbyssResearchPageSelector,
  },

  data() {
    return {
      depth: player.abyssResearchCanvas.currentAbyssResearchDepth,
      shownNodes: [],
      activeNodes: new Set(),
      connections: [],

      zoomLevel: player.abyssResearchCanvas.zoomLevel,
      offset: new Vector(
        player.abyssResearchCanvas.offsetX,
        player.abyssResearchCanvas.offsetY
      ),

      isDragging: false,
      dragStart: new Vector(0, 0),
      startOffset: new Vector(0, 0),
    };
  },

  computed: {
    getCurrentNodes() {
      // Only give keys
      return Object.keys(AbyssResearchHelperTools.sortByDepth[this.depth]);
    },
    getConnections() {
      // [[x1,y1],[x2,y2],isResearching]
      const connections = [];
      for (const id of this.shownNodes) {
        for (const id2 of AbyssResearches[id].next) {
          if (this.shownNodes.includes(id2)) {
            connections.push([
              [AbyssResearches[id].x, AbyssResearches[id].y, AbyssResearches[id].id],
              [AbyssResearches[id2].x, AbyssResearches[id2].y, AbyssResearches[id2].id],
              false
            ]);
          }
        }

        for (const id2 of AbyssResearches[id].previous) {
          if (this.shownNodes.includes(id2)) {
            connections.push([
              [AbyssResearches[id].x, AbyssResearches[id].y, AbyssResearches[id].id],
              [AbyssResearches[id2].x, AbyssResearches[id2].y, AbyssResearches[id2].id],
              true
            ]);
          }
        }
      }
      return connections;
    },
  },

  watch: {
    offset(newVal) {
      player.abyssResearchCanvas.offsetX = newVal.x;
      player.abyssResearchCanvas.offsetY = newVal.y;
      this.updateCanvasTransform();
    },

    zoomLevel(newVal) {
      player.abyssResearchCanvas.zoomLevel = newVal;
      this.updateCanvasTransform();
    },

    depth(newVal) {
      player.abyssResearchCanvas.currentAbyssResearchDepth = newVal;
    },
  },

  mounted() {
    this.updateCanvasTransform();
  },

  methods: {
    update() {
      this.shownNodes = this.getCurrentNodes.filter(x => player.abyssResearches[x].shown);
      this.activeNodes = player.activeAbyssResearches;
      this.depth = player.abyssResearchCanvas.currentAbyssResearchDepth;
    },

    updateCanvasTransform() {
      if (this.$refs.canvas) {
        this.$refs.canvas.style.transform = `${this.offset.asPxTranslate()} scale(${this.zoomLevel})`;
      }
    },

    startDrag(event) {
      this.isDragging = true;
      this.dragStart = new Vector(event.clientX, event.clientY);
      this.startOffset = this.offset.copy;
    },
    drag(event) {
      // This.updateTooltipPosition(event);
      if (this.isDragging) {
        const cursorPosition = new Vector(event.clientX, event.clientY);
        this.offset = this.startOffset.plus(cursorPosition).minus(this.dragStart);
      }
    },
    endDrag() {
      this.isDragging = false;
    },

    handleZoom(event) {
      const delta = event.deltaY * -0.001;
      const newZoom = Math.min(Math.max(0.33, this.zoomLevel + delta), 3);

      if (this.$refs.canvas) {
        const rect = this.$refs.canvasContainer.getBoundingClientRect();
        const position = new Vector(event.clientX - rect.left, event.clientY - rect.top);

        const zoomFactor = newZoom / this.zoomLevel;

        this.offset = this.offset.minus(position.minus(this.offset).times(zoomFactor - 1));
        this.zoomLevel = newZoom;
      }
    },

    handleTabChange(newVal) {
      this.depth = newVal;
    },

    relocate() {
      this.offset = new Vector(750, 333);
      this.zoomLevel = 1;
    },
  },
};
</script>

<template>
  <div class="research-wrapper">
    <div
      ref="canvasContainer"
      class="canvas-container"
    >
      <div
        ref="canvas"
        class="research-canvas"
        @mousedown="startDrag"
        @mousemove="drag"
        @mouseup="endDrag"
        @mouseleave="endDrag"
        @wheel.prevent="handleZoom"
      >
        <AbyssResearchNode
          v-for="id in shownNodes"
          :id="id"
          :key="id"
        />
        <!-- lines -->
        <svg
          class="connections-layer"
          width="100%"
          height="100%"
        >
          <defs>
            <linearGradient
              id="linearGradient-rightwards"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="0%"
            >
              <stop
                offset="0%"
                style="stop-color: rgb(94, 214, 255); stop-opacity: 0"
              />
              <stop
                offset="100%"
                style="stop-color: rgb(94, 214, 255); stop-opacity: 1"
              />
            </linearGradient>
            <linearGradient
              id="linearGradient-leftwards"
              x1="100%"
              y1="0%"
              x2="0%"
              y2="0%"
            >
              <stop
                offset="0%"
                style="stop-color: rgb(94, 214, 255); stop-opacity: 0"
              />
              <stop
                offset="100%"
                style="stop-color: rgb(94, 214, 255); stop-opacity: 1"
              />
            </linearGradient>
            <linearGradient
              id="linearGradient-upwards"
              x1="0%"
              y1="100%"
              x2="0%"
              y2="0%"
            >
              <stop
                offset="0%"
                style="stop-color: rgb(94, 214, 255); stop-opacity: 0"
              />
              <stop
                offset="100%"
                style="stop-color: rgb(94, 214, 255); stop-opacity: 1"
              />
            </linearGradient>
            <linearGradient
              id="linearGradient-downwards"
              x1="0%"
              y1="0%"
              x2="0%"
              y2="100%"
            >
              <stop
                offset="0%"
                style="stop-color: rgb(94, 214, 255); stop-opacity: 0"
              />
              <stop
                offset="100%"
                style="stop-color: rgb(94, 214, 255); stop-opacity: 1"
              />
            </linearGradient>

            <linearGradient
              id="linearGradient-right-upwards"
              x1="0%"
              y1="100%"
              x2="100%"
              y2="0%"
            >
              <stop
                offset="0%"
                style="stop-color: rgb(94, 214, 255); stop-opacity: 0"
              />
              <stop
                offset="100%"
                style="stop-color: rgb(94, 214, 255); stop-opacity: 1"
              />
            </linearGradient>
            <linearGradient
              id="linearGradient-left-upwards"
              x1="100%"
              y1="100%"
              x2="0%"
              y2="0%"
            >
              <stop
                offset="0%"
                style="stop-color: rgb(94, 214, 255); stop-opacity: 0"
              />
              <stop
                offset="100%"
                style="stop-color: rgb(94, 214, 255); stop-opacity: 1"
              />
            </linearGradient>
            <linearGradient
              id="linearGradient-right-downwards"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <stop
                offset="0%"
                style="stop-color: rgb(94, 214, 255); stop-opacity: 0"
              />
              <stop
                offset="100%"
                style="stop-color: rgb(94, 214, 255); stop-opacity: 1"
              />
            </linearGradient>
            <linearGradient
              id="linearGradient-left-downwards"
              x1="100%"
              y1="0%"
              x2="0%"
              y2="100%"
            >
              <stop
                offset="0%"
                style="stop-color: rgb(94, 214, 255); stop-opacity: 0"
              />
              <stop
                offset="100%"
                style="stop-color: rgb(94, 214, 255, 1); stop-opacity: 1"
              />
            </linearGradient>
          </defs>

          <AbyssResearchConnection
            v-for="(connection, index) in getConnections"
            :id="'conn-' + index"
            :key="'conn-' + index"
            :data="connection"
          />
        </svg>
      </div>
      <AbyssResearchPageSelector
        :depth="depth"
        @tab-change="handleTabChange"
        @relocate="relocate"
      />
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
  width: 10000px;
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
  overflow: hidden;
}
</style>
