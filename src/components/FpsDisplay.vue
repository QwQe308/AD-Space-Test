<script>
export default {
  name: "FpsDisplay",
  data() {
    return {
      enabled: false,
      fps: null,
      // Sampling should not trigger Vue updates on every animation frame.
      sampling: Object.seal({ request: null, startedAt: null, frames: 0 }),
    };
  },
  mounted() {
    document.addEventListener("visibilitychange", this.syncSampling);
  },
  beforeDestroy() {
    document.removeEventListener("visibilitychange", this.syncSampling);
    this.stopSampling();
  },
  methods: {
    update() {
      const enabled = Boolean(player.options.showFPS);
      if (enabled === this.enabled) return;
      this.enabled = enabled;
      this.syncSampling();
    },
    stopSampling() {
      if (this.sampling.request !== null) cancelAnimationFrame(this.sampling.request);
      this.sampling.request = null;
      this.sampling.startedAt = null;
      this.sampling.frames = 0;
      this.fps = null;
    },
    syncSampling() {
      this.stopSampling();
      if (this.enabled && !document.hidden) {
        this.sampling.request = requestAnimationFrame(this.sampleFrame);
      }
    },
    sampleFrame(timestamp) {
      this.sampling.request = null;
      if (!this.enabled || document.hidden) {
        this.stopSampling();
        return;
      }
      if (this.sampling.startedAt === null) {
        this.sampling.startedAt = timestamp;
      } else {
        this.sampling.frames++;
        const elapsed = timestamp - this.sampling.startedAt;
        if (elapsed >= 500) {
          this.fps = Math.round(this.sampling.frames * 1000 / elapsed);
          this.sampling.startedAt = timestamp;
          this.sampling.frames = 0;
        }
      }
      this.sampling.request = requestAnimationFrame(this.sampleFrame);
    },
  },
};
</script>

<template>
  <div
    v-if="enabled"
    class="c-fps-display"
  >
    FPS: {{ fps === null ? "—" : fps }}
  </div>
</template>

<style scoped>
.c-fps-display {
  position: fixed;
  top: 0.8rem;
  right: 0.8rem;
  z-index: 10000;
  font-family: monospace;
  font-size: 1.2rem;
  font-variant-numeric: tabular-nums;
  line-height: 1.5;
  color: #ffffff;
  background-color: rgba(0, 0, 0, 70%);
  border-radius: 0.3rem;
  padding: 0.3rem 0.6rem;
  pointer-events: none;
  user-select: none;
}
</style>
