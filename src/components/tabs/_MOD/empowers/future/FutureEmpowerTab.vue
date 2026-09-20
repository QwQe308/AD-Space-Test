<script>
import { FutureEmpower } from "@/core/_MOD/empowers/future/futureEmpower";
import PrimaryButton from "@/components/PrimaryButton";

export default {
  name: "FutureEmpowerTab",
  components: {
    PrimaryButton,
  },
  data() {
    return {
      selectedId: "",
      orbs: [],
      paused: false,
      feedback: "",
    };
  },
  computed: {
    selectedOrb() {
      return this.orbs.find(orb => orb.id === this.selectedId);
    },
    earnedBonuses() {
      return this.orbs.filter(orb => orb.hasBonus);
    },
  },
  mounted() {
    this.update();
    this._orbitElapsed = 0;
    this._orbitLastFrame = null;
    this._motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
    this.paused = this._motionPreference.matches;
    this._motionListener = event => {
      this.paused = event.matches;
      this.syncAnimation();
    };
    this._motionPreference.addEventListener("change", this._motionListener);
    this.$nextTick(() => {
      this.positionOrbs();
      this.syncAnimation();
    });
  },
  beforeDestroy() {
    cancelAnimationFrame(this._orbitFrame);
    this._motionPreference.removeEventListener("change", this._motionListener);
  },
  methods: {
    update() {
      // Only display primitives enter Vue; game states and player Decimals stay unobserved.
      this.selectedId = FutureEmpower.selectedOrb.id;
      this.orbs = FutureEmpower.orbs.map(orb => ({
        id: orb.id,
        name: orb.name,
        symbol: orb.symbol,
        color: orb.color,
        description: orb.description,
        bonusDescription: orb.bonusDescription,
        effect: orb.formattedEffect,
        level: formatInt(orb.level),
        hasBonus: orb.level.gt(0),
        amount: format(orb.resourceAmount, 2, 0),
        requirement: format(orb.nextRequirement, 2, 0),
        bulkLevels: formatInt(orb.bulkLevels),
        satellites: orb.satelliteCount,
        tooltip: this.orbTooltip(orb),
        percentage: orb.percentage,
        fillStyle: orb.fillStyle,
        progress: formatPercents(orb.percentage, 1),
        unlocked: orb.isUnlocked,
        canUpgrade: orb.canUpgrade,
      }));
      this.$nextTick(this.positionOrbs);
    },
    selectOrb(id) {
      if (FutureEmpower.selectOrb(id)) {
        this.feedback = "";
        this.update();
      }
    },
    upgradeOrb() {
      const orb = FutureEmpower.selectedOrb;
      const count = formatInt(orb.bulkLevels);
      if (orb.upgrade()) {
        this.feedback = `${orb.name}: +${count} levels. Bonus: ${orb.formattedEffect}. ` +
          `${orb.name} reset to zero.`;
      }
      this.update();
    },
    orbTooltip(orb) {
      const count = formatInt(orb.bulkLevels);
      const instruction = orb.canUpgrade
        ? "Click to upgrade."
        : `Reach ${format(orb.requirement, 2, 0)} ${orb.name} to upgrade.`;
      return `Available upgrades: ${count}<br>` +
        `${orb.isUnlocked ? instruction : "Resource locked."}`;
    },
    satelliteStyle(index) {
      const angle = (index - 1) * 2 * Math.PI / GameDatabase.empowers.future.satellites.capacity;
      return { left: `${50 + 50 * Math.cos(angle)}%`, top: `${50 + 50 * Math.sin(angle)}%` };
    },
    toggleOrbit() {
      this.paused = !this.paused;
      this.syncAnimation();
    },
    syncAnimation() {
      cancelAnimationFrame(this._orbitFrame);
      this._orbitLastFrame = null;
      if (!this.paused) this._orbitFrame = requestAnimationFrame(this.animateOrbit);
    },
    animateOrbit(time) {
      if (this._orbitLastFrame !== null) this._orbitElapsed += time - this._orbitLastFrame;
      this._orbitLastFrame = time;
      this.positionOrbs();
      this._orbitFrame = requestAnimationFrame(this.animateOrbit);
    },
    positionOrbs() {
      const radius = GameDatabase.empowers.future.orbit.radius;
      const layout = FutureEmpower.orbitLayout(this._orbitElapsed ?? 0);
      for (const element of this.$refs.orbNodes ?? []) {
        const position = layout.find(orb => orb.id === element.dataset.orbId);
        if (!position) continue;
        // Normalize to the responsive stage. Only positions update each animation frame.
        element.style.left = `${50 + position.x / radius * 39}%`;
        element.style.top = `${50 + position.y / radius * 39}%`;
      }
      const period = GameDatabase.empowers.future.satellites.period;
      const angle = ((this._orbitElapsed ?? 0) % period) / period * 360;
      for (const element of this.$refs.satelliteOrbits ?? []) {
        element.style.transform = `rotate(${angle}deg)`;
      }
    },
  },
};
</script>

<template>
  <div class="future-tab">
    <div class="future-layout">
      <div class="future-resources">
        <div class="future-orbit-controls">
          <span>Select a sphere; click the center to upgrade.</span>
          <PrimaryButton
            class="future-motion-toggle"
            :aria-pressed="paused"
            @click="toggleOrbit"
          >
            {{ paused ? "Resume orbit" : "Pause orbit" }}
          </PrimaryButton>
        </div>
        <div class="future-orbit-viewport">
          <div class="future-orbit-stage">
            <div
              class="future-orbit-track"
              aria-hidden="true"
            />
            <div
              v-for="orb in orbs"
              :key="orb.id"
              ref="orbNodes"
              class="future-orb"
              :class="{
                'future-orb--center': orb.id === selectedId,
                'future-orb--locked': !orb.unlocked,
              }"
              :data-orb-id="orb.id"
              :style="{ '--orb-color': orb.color }"
            >
              <div class="future-orb-surface">
                <div
                  v-if="orb.canUpgrade"
                  class="future-orb-fill future-orb-fill--completed"
                  aria-hidden="true"
                />
                <div
                  class="future-orb-fill"
                  :style="orb.fillStyle"
                  aria-hidden="true"
                />
              </div>
              <div
                ref="satelliteOrbits"
                class="future-satellite-orbit"
                aria-hidden="true"
              >
                <span
                  v-for="satellite in orb.satellites"
                  :key="satellite"
                  class="future-satellite"
                  :style="satelliteStyle(satellite)"
                />
              </div>
              <button
                v-if="orb.id === selectedId"
                v-tooltip="{ content: orb.tooltip, trigger: 'hover focus', hideOnTargetClick: false }"
                type="button"
                class="future-orb-details"
                :aria-disabled="!orb.canUpgrade"
                :aria-label="`${orb.name}: upgrade ${orb.bulkLevels} levels and reset this resource to zero`"
                @click="upgradeOrb"
              >
                <span
                  class="future-orb-symbol"
                  aria-hidden="true"
                >{{ orb.symbol }}</span>
                <b>{{ orb.name }}</b>
                <span>Level: {{ orb.level }} (+{{ orb.bulkLevels }})</span>
                <div class="future-orb-resource">
                  {{ orb.amount }} / {{ orb.requirement }}
                </div>
                <span>{{ orb.unlocked ? orb.progress : "Locked" }}</span>
              </button>
              <button
                v-else
                type="button"
                class="future-orb-select"
                :aria-label="`Select ${orb.name}, level ${orb.level}, ${orb.unlocked ? orb.progress : 'locked'}`"
                @click="selectOrb(orb.id)"
              >
                <span
                  class="future-orb-symbol"
                  aria-hidden="true"
                >{{ orb.symbol }}</span>
                <span class="future-orb-level">{{ orb.unlocked ? `Lv. ${orb.level}` : "Locked" }}</span>
              </button>
            </div>
          </div>
        </div>
        <div
          v-if="selectedOrb"
          class="future-milestone"
        >
          <p>
            Click the center sphere to upgrade all available levels.
            <br>
            {{ selectedOrb.description }}
          </p>
        </div>
      </div>

      <div class="future-bonuses">
        <div class="future-bonuses-heading">
          Sphere bonuses
        </div>
        <p>Each sphere level strengthens its corresponding bonus.</p>
        <p
          v-if="earnedBonuses.length === 0"
          class="future-bonuses-empty"
        >
          No bonuses yet. Upgrade a sphere to gain one.
        </p>
        <div
          v-else
          class="future-bonus-list"
        >
          <div
            v-for="orb in earnedBonuses"
            :key="orb.id"
            class="future-bonus"
            :data-bonus-id="orb.id"
          >
            <div class="future-bonus-title">
              <span :style="{ color: orb.color }">{{ orb.symbol }}</span>
              {{ orb.name }} — Level {{ orb.level }}
            </div>
            <div>{{ orb.bonusDescription }}</div>
            <div>Currently: <b>{{ orb.effect }}</b></div>
          </div>
        </div>
      </div>
    </div>
    <p
      class="future-feedback"
      role="status"
      aria-live="polite"
    >
      {{ feedback }}
    </p>
  </div>
</template>

<style scoped>
.future-tab {
  --future-orb-base: var(--color-background);
  width: 95%;
  max-width: 110rem;
  text-align: center;
  font-size: 1.2rem;
  color: var(--color-text);
  margin: 1rem auto;
}

.future-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.3fr);
  align-items: start;

  gap: 3rem;
}

.future-resources,
.future-bonuses {
  min-width: 0;
}

.future-orbit-controls {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;

  gap: 1rem;
}

.future-motion-toggle {
  padding: 0.3rem 0.8rem;
}

.future-orbit-viewport {
  overflow: clip;
  width: 100%;
}

.future-orbit-stage {
  width: 100%;
  max-width: 44rem;
  position: relative;
  margin: 0 auto;

  aspect-ratio: 1;
}

.t-normal .future-tab,
.t-s9 .future-tab,
.t-s12 .future-tab {
  --future-orb-base: #111014;
}

.future-orbit-track {
  position: absolute;
  inset: 11%;
  opacity: 0.18;
  border: 1px solid var(--color-text);
  border-radius: 50%;
  pointer-events: none;
}

.future-orb {
  --orb-muted-color: color-mix(in srgb, var(--orb-color) 80%, #808080);
  width: 14%;
  position: absolute;
  z-index: 2;
  transform: translate(-50%, -50%);
  transition: width 0.3s ease, left 0.12s linear, top 0.12s linear;

  aspect-ratio: 1;
}

.future-orb--center {
  width: 44%;
  z-index: 1;
}

.future-orb-surface {
  overflow: hidden;
  position: absolute;
  inset: 0;
  background: var(--future-orb-base);
  border-radius: 50%;
  pointer-events: none;
}

.future-orb-surface::after {
  content: "";
  position: absolute;
  inset: 0;
  border: 2px solid color-mix(in srgb, var(--orb-muted-color) 75%, var(--future-orb-base));
  border-radius: 50%;
}

.future-orb--center .future-orb-surface::after {
  border-color: color-mix(in srgb, var(--orb-muted-color) 95%, var(--future-orb-base));
}

.future-orb--locked .future-orb-surface::after {
  border-color: color-mix(in srgb, var(--orb-muted-color) 40%, var(--future-orb-base));
}

.future-orb-fill {
  position: absolute;
  inset: 2px;
  background: color-mix(in srgb, var(--orb-muted-color) 24%, var(--future-orb-base));
  border-radius: 50%;
  transition: clip-path 0.25s ease;
}

.future-orb-fill--completed {
  background: color-mix(in srgb, var(--orb-muted-color) 9%, var(--future-orb-base));
}

.future-satellite-orbit {
  position: absolute;
  inset: -12%;
  pointer-events: none;
}

.future-satellite {
  width: 4px;
  height: 4px;
  position: absolute;
  opacity: 0.85;
  background: var(--color-text);
  border-radius: 50%;
  transform: translate(-50%, -50%);
}

.future-orb-select,
.future-orb-details {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  position: relative;
  justify-content: center;
  align-items: center;
  text-align: center;
  font: inherit;
  color: var(--color-text);
  background: transparent;
  border: none;
  border-radius: 50%;
}

.future-orb-select {
  padding: 0;
  cursor: pointer;
}

/* Optical alignment without moving the circular button's hit area. */
.future-orb-select > span {
  transform: translateY(-3px);
}

.future-orb-details > * {
  transform: translateY(-8px);
}

.future-orb-select:hover,
.future-tab button:focus-visible {
  outline: 2px solid var(--color-text);
  outline-offset: 3px;
}

.future-orb-symbol {
  font-size: 2.4rem;
  line-height: 1.2;
  color: var(--orb-color);
}

.future-orb-symbol,
.future-bonus-title > span {
  filter: saturate(0.8);
}

.future-orb-details {
  padding: 0;
  cursor: pointer;

  gap: 0.2rem;
}

.future-orb-details[aria-disabled="true"] {
  cursor: default;
}

.future-orb-details .future-orb-symbol {
  font-size: 3rem;
}

.future-orb-details b {
  font-size: 1.5rem;
}

.future-orb-resource {
  overflow-wrap: anywhere;
  width: 85%;
  margin: 0.4rem 0;
}

.future-orb-level {
  font-size: 1rem;
}

.future-milestone {
  display: flex;
  align-items: center;

  gap: 1rem;
}

.future-milestone p {
  flex: 1;
  line-height: 1.5;
  margin: 0;
}

.future-bonuses-heading {
  font-size: 1.5rem;
  margin-bottom: 0.8rem;
}

.future-bonuses > p {
  margin: 0 0 1rem;
}

.future-bonus-list {
  text-align: left;
}

.future-bonuses-empty {
  font-style: italic;
  color: var(--color-text);
  opacity: 0.6;
}

.future-bonus {
  line-height: 1.6;
  border-bottom: 1px solid var(--color-disabled);
  padding: 1rem 0;
}

.future-bonus-title {
  font-size: 1.4rem;
  font-weight: bold;
}

.future-feedback {
  min-height: 1.8rem;
  margin: 0.6rem 0 0;
}

/* stylelint-disable order/order -- Responsive overrides must follow the base rules. */
@media (min-width: 1001px) and (max-height: 850px) {
  .future-orbit-stage {
    max-width: 34rem;
  }

  .future-orb-details {
    font-size: 1rem;
  }

  .future-orb-details .future-orb-symbol {
    font-size: 2.5rem;
  }
}

@media (max-width: 1000px) {
  .future-layout {
    grid-template-columns: minmax(0, 1fr);

    gap: 2rem;
  }

  .future-resources,
  .future-bonuses {
    width: 100%;
    max-width: 52rem;
    margin: 0 auto;
  }
}

@media (max-width: 600px) {
  .future-milestone {
    flex-direction: column;
  }

  .future-orb-details {
    font-size: 0.9rem;

    gap: 0.1rem;
  }

  .future-orb-details .future-orb-symbol {
    font-size: 1.8rem;
  }

  .future-orb-details b {
    font-size: 1rem;
  }

  .future-orb-symbol {
    font-size: 1.8rem;
  }

  .future-orb-resource {
    margin: 0.2rem 0;
  }

  .future-orb-level {
    font-size: 0.8rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .future-orb,
  .future-orb-fill {
    transition: none;
  }
}
</style>
