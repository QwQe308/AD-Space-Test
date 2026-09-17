<script>
import { beginBreakdownUpdate } from "@/core/secret-formula/multiplier-tab/cache";

import { createEntryInfo } from "./breakdown-entry-info";
import MultiplierBreakdownEntry from "./MultiplierBreakdownEntry";

const OPTIONS_PER_PAGE = 7;

const MULT_TAB_OPTIONS = [
  { id: 0, key: "AM", text: "Antimatter Production" },
  { id: 1, key: "tickspeed", text: "Tickspeed" },
  { id: 2, key: "AD", text: "Antimatter Dimensions" },
  { id: 3, key: "IP", text: "Infinity Points" },
  { id: 4, key: "ID", text: "Infinity Dimensions" },
  { id: 5, key: "infinities", text: "Infinities" },
  { id: 6, key: "replicanti", text: "Replicanti Speed" },
  { id: 7, key: "EP", text: "Eternity Points" },
  { id: 8, key: "TD", text: "Time Dimensions" },
  { id: 9, key: "eternities", text: "Eternities" },
  { id: 10, key: "DT", text: "Dilated Time" },
  { id: 11, key: "gamespeed", text: "Game Speed" },
  { id: 12, key: "RS", text: "Research Speed" },
  { id: 13, key: "ARS", text: "Abyss Research Speed" },
];

export default {
  name: "MultiplierBreakdownTab",
  components: {
    MultiplierBreakdownEntry
  },
  data() {
    return {
      availableOptions: [],
      menuPage: 0,
      currentID: player.options.multiplierTab.currTab,
    };
  },
  computed: {
    pageCount() {
      return Math.max(1, Math.ceil(this.availableOptions.length / OPTIONS_PER_PAGE));
    },
    visibleOptions() {
      const start = this.menuPage * OPTIONS_PER_PAGE;
      return this.availableOptions.slice(start, start + OPTIONS_PER_PAGE);
    },
    currentKey() {
      return MULT_TAB_OPTIONS.find(opt => opt.id === this.currentID).key;
    },
    resource() {
      return createEntryInfo(`${this.currentKey}_total`);
    },
    resourceSymbols() {
      return GameDatabase.multiplierTabValues[this.currentKey].total.overlay;
    }
  },
  methods: {
    update() {
      beginBreakdownUpdate();
      const availableOptions = MULT_TAB_OPTIONS.filter(opt => this.checkActiveKey(opt.key));
      if (availableOptions.length !== this.availableOptions.length ||
          availableOptions.some((opt, index) => opt !== this.availableOptions[index])) {
        this.availableOptions = availableOptions;
        let selectedIndex = availableOptions.findIndex(opt => opt.id === this.currentID);
        if (selectedIndex < 0 && availableOptions.length > 0) {
          selectedIndex = 0;
          this.clickSubtab(availableOptions[0].id);
        }
        this.menuPage = selectedIndex < 0 ? 0 : Math.floor(selectedIndex / OPTIONS_PER_PAGE);
      }
    },
    checkActiveKey(key) {
      const act = GameDatabase.multiplierTabValues[key].total.isActive;
      return typeof act === "function" ? act() : act;
    },
    accessProp(prop) {
      return typeof prop === "function" ? prop() : prop;
    },
    subtabClassObject(option) {
      return {
        "c-multiplier-subtab-btn": true,
        "c-multiplier-subtab-btn--active": option.key === this.currentKey,
      };
    },
    changeMenuPage(direction) {
      this.menuPage = Math.max(0, Math.min(this.pageCount - 1, this.menuPage + direction));
    },
    clickSubtab(id) {
      this.currentID = id;
      player.options.multiplierTab.currTab = id;
    }
  }
};
</script>

<template>
  <div class="c-stats-tab">
    <div class="l-multiplier-subtab-btn-container">
      <button
        v-if="pageCount > 1"
        class="c-multiplier-page-btn"
        :disabled="menuPage === 0"
        aria-label="Previous menu page"
        title="Previous menu page"
        @click="changeMenuPage(-1)"
      >
        ◀
      </button>
      <button
        v-for="option in visibleOptions"
        :key="option.key"
        :class="subtabClassObject(option)"
        @click="clickSubtab(option.id)"
      >
        {{ option.text }}
      </button>
      <span
        v-if="pageCount > 1"
        class="c-multiplier-page-number"
        aria-live="polite"
      >
        {{ menuPage + 1 }} / {{ pageCount }}
      </span>
      <button
        v-if="pageCount > 1"
        class="c-multiplier-page-btn"
        :disabled="menuPage === pageCount - 1"
        aria-label="Next menu page"
        title="Next menu page"
        @click="changeMenuPage(1)"
      >
        ▶
      </button>
    </div>
    <div class="c-list-container">
      <span
        v-for="symbol in resourceSymbols"
        :key="symbol"
      >
        <span
          class="c-symbol-overlay"
          v-html="symbol"
        />
      </span>
      <MultiplierBreakdownEntry
        :key="resource.key"
        :resource="resource"
        :is-root="true"
      />
      <div class="c-multiplier-tab-text-line">
        Note: Entries are only expandable if they contain multiple sources which can be different values.
        For example, any effects which affect all Dimensions of any type equally will not expand into a
        list of eight identical numbers.
        <br>
        <b>
          Some entries may cause lag if expanded out fully. Resizing happens over 200 ms (instead of instantly)
          in order to reduce possible adverse effects due to photosensitivity. This may cause some visual weirdness
          after prestige events.
        </b>
      </div>
    </div>
  </div>
</template>

<style scoped>
.c-list-container {
  position: relative;
  width: 100rem;
}

.l-multiplier-subtab-btn-container {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  width: 100rem;
  height: calc(4rem - var(--var-border-radius, 0.2rem));
}

.c-multiplier-subtab-btn {
  flex: 1;
  min-width: 0;
  height: 4rem;
  margin: 0 0.5rem -0.1rem;
  z-index: 1;
  text-align: center;
  font-family: Typewriter;
  font-size: 1rem;
  font-weight: bold;
  color: var(--color-text);
  background-color: var(--color-base);
  border: var(--var-border-width, 0.2rem) solid;
  border-radius: var(--var-border-radius, 0.5rem) var(--var-border-radius, 0.5rem) 0 0;
  cursor: pointer;
}

.c-multiplier-page-btn {
  flex: 0 0 3rem;
  margin: 0 0.3rem;
  color: var(--color-text);
  background-color: var(--color-base);
  border: var(--var-border-width, 0.2rem) solid;
  border-radius: var(--var-border-radius, 0.5rem);
  cursor: pointer;
}

.c-multiplier-page-btn:disabled {
  opacity: 0.3;
  cursor: default;
}

.c-multiplier-page-number {
  align-self: center;
  flex: 0 0 4.5rem;
  color: var(--color-text);
  font-size: 1.1rem;
  text-align: center;
}

.c-multiplier-subtab-btn--active {
  border-bottom: none;
  padding-bottom: 0.2rem;
  cursor: default;
}

.c-multiplier-tab-text-line {
  color: var(--color-text);
  font-size: 1.3rem;
}

.c-symbol-overlay {
  display: flex;
  width: 100%;
  height: 100%;
  top: -5%;
  position: absolute;
  justify-content: center;
  align-items: center;
  font-size: 40rem;
  color: var(--color-text);
  text-shadow: 0 0 3rem;
  pointer-events: none;
  user-select: none;
  opacity: 0.2;
  z-index: 1;
}
</style>
