<script>
import { PastEmpower } from "../../../../../core/_MOD/empowers/past/pastEmpower";
import { DC } from "../../../../../core/constants";
import GlyphComponent from "../../../../GlyphComponent.vue";

import InfinitySimulationHeader from "./Infinity/InfinitySimulationHeader.vue";
import InfinitySimulationInfo from "./Infinity/InfinitySimulationInfo.vue";

export default {
  name: "PastEmpowerTab",
  components: {
    GlyphComponent,
    InfinitySimulationHeader,
    InfinitySimulationInfo,
  },
  data() {
    return {
      frozenCurrency: PastEmpower.freezing,
      currenciesAvailableForFreeze: [
        { id: "antimatter", symbol: "AM", name: "Antimatter" },
        { id: "infinityPoints", symbol: "IP", name: "Infinity Points" },
        { id: "infinities", symbol: "IS", name: "Infinity Stats" },
        { id: "infinityPower", symbol: "Pow", name: "Infinity Power" },
        { id: "eternityPoints", symbol: "EP", name: "Eternity Points" },
        { id: "timeShards", symbol: "TSd", name: "Time Shards" },
      ],

      simulatingPrestige: PastEmpower.simulating,
      displayingSimulation: PastEmpower.simulating,
      prestigesAvailableForSimulation: [
        { name: "Infinity", glyph: "infinity" },
        { name: "Eternity", glyph: "time" },
      ],

      simulationSpeed: new Decimal(0),
      simulationMaxSpeed: PastEmpower.simulationMaxSpeed,
    };
  },
  computed: {},
  methods: {
    update() {
      this.frozenCurrency = PastEmpower.freezing;
      this.simulatingPrestige = PastEmpower.simulating;
      this.simulationSpeed.copyFrom(PastEmpower.simulationSpeed);
      this.simulationMaxSpeed = PastEmpower.simulationMaxSpeed;
    },
    toggleSimulationDisplay(id) {
      this.displayingSimulation = id === this.displayingSimulation ? null : id;
    },
    toggleFreeze(id) {
      PastEmpower.toggleFreezing(id);
    },
    getFreezeButtonClass(id) {
      return {
        "frozen-currency": id === this.frozenCurrency,
      };
    },

    getSimulatingArrowClass(id) {
      return {
        showing: id === this.displayingSimulation,
      };
    },
    toggleSimulating(id) {
      PastEmpower.toggleSimulation(id);
    },
    fakeGlyph(config) {
      const typeName = config.glyph;
      return {
        type: typeName,
        strength: this.simulatingPrestige === config.name ? 2 : 1,
        cosmetic: undefined,
      };
    },
  },
};
</script>

<template>
  <div class="past-tab">
    <div class="tip">
      Click a currency to freeze/unfreeze it. Frozen currencies cannot be decreased/increased by any way.<br>
      You can only freeze a single currency at the same time.
    </div>
    <div class="freeze">
      <div v-for="currenciesData in currenciesAvailableForFreeze">
        <button
          v-tooltip="currenciesData.name"
          class="freeze-button"
          :class="getFreezeButtonClass(currenciesData.id)"
          @click="toggleFreeze(currenciesData.id)"
        >
          {{ currenciesData.symbol }}
        </button>
      </div>
    </div>
    <div class="simulation">
      <div class="simulation-warpper">
        <div class="simulation-title">
          Prestige Simulation
        </div>
        <hr class="simulation-division">
        <div class="simulation-panel">
          <!-- Left Simulation Selection Panel -->
          <div class="left-simulation-panel">
            <span
              v-for="(config, index) in prestigesAvailableForSimulation"
              :key="index"
              class="o-single-glyph"
            >
              <div
                class="clickable-glyph-icon-container"
                @click="toggleSimulationDisplay(config.name)"
              >
                <GlyphComponent
                  v-tooltip="config.name"
                  class="clickable-glyph-icon"
                  :glyph="fakeGlyph(config)"
                />
              </div>
              <div
                class="select-arrow"
                :class="getSimulatingArrowClass(config.name)"
              />
            </span>
          </div>

          <!-- Middle Simulation Info Panel -->
          <div class="mid-simulation-panel">
            <div class="mid-simulation-panel-warpper">
              <div
                v-if="simulatingPrestige"
                class="weak-text header"
              >
                <div class="speed">
                  <p>Currently simulating: {{ simulatingPrestige }}</p>
                  <p>Simulating speed: {{ format(simulationSpeed, 2, 2) }} / {{ format(simulationMaxSpeed, 2, 2) }}</p>
                </div>
                <div class="division">
                  <p>|</p>
                  <p>|</p>
                </div>
                <div class="gain">
                  <InfinitySimulationHeader v-if="simulatingPrestige === 'Infinity'" />
                </div>
              </div>
              <br>
              <div class="main">
                <InfinitySimulationInfo v-if="displayingSimulation === 'Infinity'" />
              </div>
            </div>
          </div>

          <!-- Corner Simulation Start Button -->
          <div
            v-if="displayingSimulation"
            class="corner-simulation-button-container"
          >
            <button
              v-tooltip="displayingSimulation !== simulatingPrestige && 'Will pause running simulation!'"
              class="corner-simulation-start-button o-primary-btn"
              @click="toggleSimulating(displayingSimulation)"
            >
              <div
                v-if="simulatingPrestige === displayingSimulation"
                class="fa fa-pause"
              />
              <div
                v-else
                class="fa fa-play"
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.past-tab {
  margin-inline: 10%;
}

.mid-simulation-panel .header .speed {
  margin-right: 20px;
}

.mid-simulation-panel .header .gain {
  margin-left: 20px;
}

.mid-simulation-panel .header {
  height: 50px;
  display: flex;
  justify-content: center;
  flex-direction: row;
  margin-bottom: 20px;
}

.mid-simulation-panel-warpper{
  display: flex;
  flex-direction: column;
}

.mid-simulation-panel {
  display: flex;
  flex-grow: 1;
  justify-content: center;
  margin-right: 80px;
}

.weak-text {
  color: #888;
}

.corner-simulation-start-button {
  position: absolute;
  right: 60px;
  bottom: 20px;
  height: 40px;
  width: 40px;
  font-size: 18px;
}

.clickable-glyph-icon {
  cursor: pointer;
  transition: transform 0.15s;
}

.clickable-glyph-icon:hover {
  transform: scale(1.04);
}

.select-arrow.showing {
  opacity: 1;
}

.clickable-glyph-icon-container:hover + .select-arrow.active {
  opacity: 0.8;
}

.clickable-glyph-icon-container:hover + .select-arrow {
  opacity: 0.4;
}

.select-arrow {
  content: "";
  position: absolute;
  top: 50%;
  left: -8px;
  transition-duration: 0.2s;
  transform: rotate(45deg) translateY(-50%) scale(1);
  clip-path: polygon(0 0, 100% 0, 100% 100%);
  background-color: #fff;
  width: 10px;
  height: 10px;
  opacity: 0;
}

.o-single-glyph {
  position: relative;
  padding: 0.5rem;
}

.o-single-glyph:not(:first-child) {
  margin-top: 1.5rem;
}

.left-simulation-panel {
  display: flex;
  flex-direction: column;
  width: 80px;
}

.simulation-panel {
  display: flex;
  flex-grow: 1;
  flex-direction: row;
}

.simulation-division {
  color: var(--color-text);
  margin-top: 10px;
}

.simulation-title {
  font-size: 18px;
  font-weight: bold;
}

.simulation-warpper {
  display: flex;
  flex-direction: column;
  color: var(--color-text);
  width: 95%;
  height: 100%;
  border-radius: 5px;
  border-width: 2px;
  border-color: var(--color-text);
  border-style: solid;
  margin-inline: auto;
  padding: 15px;
}

.simulation {
  display: flex;
  color: var(--color-text);
  margin-inline: auto;
  position: relative;
  width: 100%;
  height: 40vh;
  margin-top: 25px;
}

.tip {
  color: #aaaaaa;
}
.freeze {
  display: grid;
  grid-template-columns: repeat(6, calc((100% - 15px) / 6));
  width: 100%;
  height: 40%;
  padding: 15px;
  border-right: 1px;
  border-color: var(--color-text);
}
.freeze-button {
  height: 6.4rem;
  width: 100%;
  line-height: 6.2rem;
  margin-left: -0.1rem;
  position: relative;
  font-size: 1.4rem;
  border-width: 0.1rem;
  border-radius: 0;
  margin-top: -0.1rem;
  transition-duration: 0.15s;
  user-select: none;
  cursor: pointer;
  font-weight: bold;
  background-color: rgb(75, 75, 125);
  color: var(--color-text);
  /* it's strange that it doesnt use global font-family */
  font-family: Typewriter, serif;
}
.freeze-button.frozen-currency {
  background-color: rgb(110, 110, 200);
}
</style>
