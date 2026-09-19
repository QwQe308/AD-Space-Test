<script>
import { FutureEmpower, FutureEmpowerOrbs, FutureEmpowerUpgrades } from "@/core/_MOD/empowers/future/futureEmpower";
import PrimaryButton from "@/components/PrimaryButton";

export default {
  name: "FutureEmpowerTab",
  components: {
    PrimaryButton,
  },
  data() {
    return {
      insight: "0",
      selectedId: "",
      orbs: [],
      upgrades: [],
      paused: false,
      feedback: "",
    };
  },
  computed: {
    selectedOrb() {
      return this.orbs.find(orb => orb.id === this.selectedId);
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
      this.insight = format(FutureEmpower.insight, 2, 0);
      this.selectedId = FutureEmpower.selectedOrb.id;
      this.orbs = FutureEmpower.orbs.map(orb => ({
        id: orb.id,
        name: orb.name,
        symbol: orb.symbol,
        color: orb.color,
        description: orb.description,
        level: formatInt(orb.level),
        amount: format(orb.resourceAmount, 2, 0),
        requirement: format(orb.requirement, 2, 0),
        reward: format(orb.insightGain, 2, 0),
        percentage: orb.percentage,
        progress: formatPercents(orb.percentage, 1),
        unlocked: orb.isUnlocked,
        canUpgrade: orb.canUpgrade,
      }));
      this.upgrades = FutureEmpower.upgrades.map(upgrade => ({
        id: upgrade.id,
        name: upgrade.name,
        symbol: upgrade.symbol,
        color: FutureEmpowerOrbs[upgrade.id]?.color ?? "#b5a2f5",
        description: upgrade.description,
        level: formatInt(upgrade.level),
        maxLevel: formatInt(upgrade.maxLevel),
        effect: formatX(upgrade.effectValue, 2, 0),
        cost: format(upgrade.cost, 2, 0),
        refund: format(upgrade.refund, 2, 0),
        maxed: upgrade.isMaxed,
        canPurchase: upgrade.canPurchase,
        canDowngrade: upgrade.canDowngrade,
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
      const reward = format(orb.insightGain, 2, 0);
      if (orb.upgrade()) this.feedback = `${orb.name} advanced. Gained ${reward} insight.`;
      this.update();
    },
    purchase(id) {
      const upgrade = FutureEmpowerUpgrades[id];
      if (upgrade.purchase()) this.feedback = `${upgrade.name} upgraded to level ${formatInt(upgrade.level)}.`;
      this.update();
    },
    downgrade(id) {
      const upgrade = FutureEmpowerUpgrades[id];
      const refund = format(upgrade.refund, 2, 0);
      if (upgrade.downgrade()) this.feedback = `${upgrade.name} downgraded. Refunded ${refund} insight.`;
      this.update();
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
    },
  },
};
</script>

<template>
  <div class="future-tab">
    <div class="future-layout">
      <div class="future-resources">
        <div class="future-orbit-controls">
          <span>Click a sphere to select its resource.</span>
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
                'future-orb--ready': orb.canUpgrade,
                'future-orb--locked': !orb.unlocked,
              }"
              :data-orb-id="orb.id"
              :style="{ '--orb-color': orb.color }"
            >
              <div class="future-orb-surface">
                <div
                  class="future-orb-fill"
                  :style="{ transform: `scale(${orb.percentage})` }"
                  aria-hidden="true"
                />
              </div>
              <div
                v-if="orb.id === selectedId"
                class="future-orb-details"
              >
                <span
                  class="future-orb-symbol"
                  aria-hidden="true"
                >{{ orb.symbol }}</span>
                <b>{{ orb.name }}</b>
                <span>Level {{ orb.level }}</span>
                <div class="future-orb-resource">
                  {{ orb.amount }} / {{ orb.requirement }}
                </div>
                <span>{{ !orb.unlocked ? "Locked" : orb.canUpgrade ? "Ready to upgrade" : orb.progress }}</span>
              </div>
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
          <p>{{ selectedOrb.description }}</p>
          <PrimaryButton
            class="future-advance"
            :enabled="selectedOrb.canUpgrade"
            :disabled="!selectedOrb.canUpgrade"
            @click="upgradeOrb"
          >
            {{ selectedOrb.unlocked ? "Upgrade" : "Resource locked" }}
            <br>
            Gain {{ selectedOrb.reward }} insight
          </PrimaryButton>
        </div>
      </div>

      <div class="future-upgrades">
        <div class="future-insight">
          You have <b>{{ insight }}</b> insight.
        </div>
        <p>Downgrading an upgrade refunds its last level's cost.</p>
        <div class="future-upgrade-grid">
          <div
            v-for="upgrade in upgrades"
            :key="upgrade.id"
            class="future-upgrade"
            :data-upgrade-id="upgrade.id"
          >
            <div class="future-upgrade-title">
              <span :style="{ color: upgrade.color }">{{ upgrade.symbol }}</span>
              {{ upgrade.name }}
            </div>
            <div>Level {{ upgrade.level }} / {{ upgrade.maxLevel }}</div>
            <div>{{ upgrade.description }}</div>
            <div>Currently: {{ upgrade.effect }}</div>
            <div class="future-upgrade-actions">
              <PrimaryButton
                class="future-downgrade"
                :enabled="upgrade.canDowngrade"
                :disabled="!upgrade.canDowngrade"
                :aria-label="`Downgrade ${upgrade.name}, refund ${upgrade.refund} insight`"
                @click="downgrade(upgrade.id)"
              >
                <span>Downgrade</span>
                <span>Refund: {{ upgrade.refund }}</span>
              </PrimaryButton>
              <PrimaryButton
                class="future-purchase"
                :enabled="upgrade.canPurchase"
                :disabled="!upgrade.canPurchase"
                :aria-label="upgrade.maxed
                  ? `${upgrade.name} is maxed`
                  : `Upgrade ${upgrade.name} for ${upgrade.cost} insight`"
                @click="purchase(upgrade.id)"
              >
                <span>{{ upgrade.maxed ? "Maxed" : "Upgrade" }}</span>
                <span>{{ upgrade.maxed ? "" : `Cost: ${upgrade.cost}` }}</span>
              </PrimaryButton>
            </div>
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

  gap: 2rem;
}

.future-resources,
.future-upgrades {
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

.future-orbit-track {
  position: absolute;
  inset: 11%;
  opacity: 0.15;
  border: 1px solid var(--color-text);
  border-radius: 50%;
  pointer-events: none;
}

.future-orb {
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
  background: var(--color-base);
  border: 2px solid var(--orb-color);
  border-radius: 50%;
  pointer-events: none;
}

.future-orb--ready .future-orb-surface {
  border-width: 3px;
}

.future-orb--locked .future-orb-surface {
  border-color: #888888;
}

.future-orb-fill {
  position: absolute;
  inset: 2px;
  opacity: 0.3;
  background: var(--orb-color);
  border-radius: 50%;
  transition: transform 0.25s ease;
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

.future-orb-details {
  gap: 0.2rem;
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

.future-advance {
  flex-shrink: 0;
  width: 14rem;
  height: auto;
  max-width: 100%;
  min-height: 4.5rem;
  line-height: 1.5;
  padding: 0.8rem;
}

.future-insight {
  font-size: 1.5rem;
  margin-bottom: 0.8rem;
}

.future-insight b {
  font-size: 2rem;
}

.future-upgrades > p {
  margin: 0 0 1rem;
}

.future-upgrade-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));

  gap: 1rem;
}

.future-upgrade {
  display: flex;
  flex-direction: column;
  min-width: 0;
  line-height: 1.4;
  border: 1px solid var(--color-text);
  border-radius: var(--var-border-radius, 0.5rem);
  padding: 0.8rem;
}

.future-upgrade-title {
  font-size: 1.4rem;
  font-weight: bold;
}

.future-upgrade-actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  margin-top: auto;
  padding-top: 0.6rem;

  gap: 0.5rem;
}

.future-upgrade-actions button {
  display: flex;
  overflow-wrap: anywhere;
  flex-direction: column;
  height: auto;
  min-width: 0;
  min-height: 2.8rem;
  justify-content: center;
  align-items: center;
  font-size: 1.1rem;
  line-height: 1.5;
  padding: 0.4rem 0.6rem;

  gap: 0.1rem;
}

.future-feedback {
  min-height: 1.8rem;
  margin: 0.6rem 0 0;
}

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
  .future-upgrades {
    width: 100%;
    max-width: 52rem;
    margin: 0 auto;
  }
}

@media (max-width: 600px) {
  .future-upgrade-grid {
    grid-template-columns: minmax(0, 1fr);
  }

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
