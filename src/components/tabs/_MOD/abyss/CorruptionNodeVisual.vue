<script>
import {
  CORRUPTION_BURST_DURATION,
  corruptionEscapeParticles,
  corruptionOrbitParticles,
} from "./corruption-particles";

export default {
  name: "CorruptionNodeVisual",
  props: {
    completed: {
      type: Boolean,
      required: true,
    },
  },
  data() {
    return {
      orbitTime: 0,
      burstElapsed: null,
    };
  },
  computed: {
    particles() {
      return corruptionOrbitParticles(this.orbitTime, this.burstElapsed);
    },
    backParticles() {
      return this.particles.filter(particle => particle.z < 0);
    },
    frontParticles() {
      return this.particles.filter(particle => particle.z >= 0);
    },
    escapeParticles() {
      return corruptionEscapeParticles(this.burstElapsed);
    },
  },
  watch: {
    completed(value, previous) {
      if (value && !previous) {
        this._burstStartedAt = performance.now();
        this.burstElapsed = 0;
      } else if (!value) {
        this._burstStartedAt = null;
        this.burstElapsed = null;
      }
    },
  },
  created() {
    this._animationFrame = null;
    this._lastFrame = null;
    this._burstStartedAt = null;
  },
  mounted() {
    this._animationFrame = requestAnimationFrame(this.animate);
  },
  beforeDestroy() {
    cancelAnimationFrame(this._animationFrame);
  },
  methods: {
    animate(now) {
      const delta = this._lastFrame === null ? 0 : Math.max(0, now - this._lastFrame);
      this._lastFrame = now;
      // Keep orbital motion continuous while the burst adds radial motion.
      this.orbitTime += delta;
      if (this._burstStartedAt !== null) {
        const elapsed = now - this._burstStartedAt;
        this.burstElapsed = elapsed;
        if (elapsed >= CORRUPTION_BURST_DURATION) {
          this._burstStartedAt = null;
          this.burstElapsed = null;
        }
      }
      this._animationFrame = requestAnimationFrame(this.animate);
    },
  },
};
</script>

<template>
  <svg
    class="corruption-visual"
    :class="{ 'is-purchased': completed }"
    viewBox="0 0 40 40"
    aria-hidden="true"
  >
    <!-- Project tilted 3D orbits and draw rear particles behind the opaque node. -->
    <circle
      v-for="particle in backParticles"
      :key="`back-${particle.id}`"
      class="corruption-particle"
      :cx="particle.x"
      :cy="particle.y"
      :r="particle.radius"
      :opacity="particle.opacity"
    />
    <path
      class="corruption-outline"
      d="M20 2 L35.58845726812 29 L4.41154273188 29 Z
         M20 38 L4.41154273188 11 L35.58845726812 11 Z"
    />
    <circle
      v-for="particle in frontParticles"
      :key="`front-${particle.id}`"
      class="corruption-particle"
      :cx="particle.x"
      :cy="particle.y"
      :r="particle.radius"
      :opacity="particle.opacity"
    />
    <circle
      v-for="particle in escapeParticles"
      :key="`escape-${particle.id}`"
      class="corruption-particle corruption-escape-particle"
      :cx="particle.x"
      :cy="particle.y"
      :r="particle.radius"
      :opacity="particle.opacity"
    />
  </svg>
</template>

<style scoped>
.corruption-visual {
  display: block;
  width: 100%;
  height: 100%;
  overflow: visible;
  color: #fff;
  pointer-events: none;
}

.corruption-visual.is-purchased {
  color: #ffd66b;
}

.corruption-outline {
  fill: #111014;
  stroke: #9b59b6;
  stroke-width: 2;
  stroke-linejoin: miter;
  shape-rendering: geometricPrecision;
}

.unaffordable .corruption-outline {
  stroke: var(--color-text, #fff);
}

.locked .corruption-outline {
  stroke: rgb(100, 100, 100);
}

.completed .corruption-outline {
  stroke: #aeae77;
}

.corruption-particle {
  fill: currentColor;
  filter: drop-shadow(0 0 1.5px currentColor);
}

.corruption-escape-particle {
  fill: #ffd66b;
  color: #ffd66b;
}
</style>
