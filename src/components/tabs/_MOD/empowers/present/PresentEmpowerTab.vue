<script>
import { Affixes, PresentEmpower } from "../../../../../core/_MOD/empowers/present/presentEmpower";
import { DC } from "../../../../../core/constants";

export default {
  name: "PresentEmpowerTab",
  data() {
    return {
      mana: 0,
      maxMana: 100,
      spells: [],
      selectedAffixes: [],
      affixList: [],
      Affixes,
    };
  },
  computed: {
    manaPercentage() {
      return this.maxMana === 0 ? 0 : Math.clampMax(this.mana / this.maxMana, 1);
    },
    manaBarStyle() {
      return {
        width: `${this.manaPercentage * 100}%`,
      };
    },
    selectedTotalCost() {
      return this.selectedAffixes.reduce((sum, name) => {
        const affix = Affixes[name];
        return sum + (affix ? affix.cost : 0);
      }, 0);
    },
    canCreateSpell() {
      return this.selectedAffixes.length > 0 &&
        this.selectedTotalCost <= this.mana &&
        this.spells.length < 8;
    },
  },
  methods: {
    update() {
      this.mana = PresentEmpower.mana;
      this.maxMana = PresentEmpower.maxMana;
      this.spells = this.copySpells();
      this.selectedAffixes = [...PresentEmpower.selectedAffixes];
      this.affixList = Affixes.all;
    },
    selectAffix(name) {
      PresentEmpower.selectAffix(name);
      this.selectedAffixes = [...PresentEmpower.selectedAffixes];
    },
    removeAffixAt(index) {
      PresentEmpower.removeAffixAt(index);
      this.selectedAffixes = [...PresentEmpower.selectedAffixes];
    },
    createSpell() {
      PresentEmpower.createSpell();
      this.mana = PresentEmpower.mana;
      this.spells = this.copySpells();
      this.selectedAffixes = [];
    },
    /**
     * Deep-copy spells from player into lightweight display-only objects.
     * This prevents Vue from making the original SpellData (with Decimals) reactive.
     */
    copySpells() {
      return PresentEmpower.spells.map(s => ({
        affixes: [...s.affixes],
        manaCost: s.data.manaCost,
      }));
    },
    /**
     * Build a short description string for a stored spell showing its affix chain.
     */
    spellSummary(spell) {
      return spell.affixes.map(name => {
        const a = Affixes[name];
        return a ? name.charAt(0).toUpperCase() : name;
      }).join(" → ");
    },
    /**
     * Dummy data for rendering affix tooltip descriptions in template.
     * DC is on window but not in Vue template scope.
     */
    tooltipData() {
      return { spellPower: DC.D1, tempSpellPower: DC.D0 };
    },
  },
};
</script>

<template>
  <div class="present-tab">
    <!-- Mana Bar -->
    <div class="mana-section">
      <div class="mana-label">
        Mana: {{ formatInt(mana) }} / {{ formatInt(maxMana) }}
      </div>
      <div class="mana-bar-container">
        <div
          class="mana-bar-fill"
          :style="manaBarStyle"
        />
        <div class="mana-bar-overlay" />
      </div>
    </div>

    <!-- Spell Assembly -->
    <div class="assembly-panel">
      <div class="panel-title">
        Spell Assembly
      </div>
      <hr class="panel-division">
      <div class="assembly-content">
        <div class="selected-affixes">
          <div
            v-for="(name, index) in selectedAffixes"
            :key="index"
            class="affix-slot"
          >
            <button
              v-tooltip="Affixes[name] ? Affixes[name].description(tooltipData()) : ''"
              class="affix-btn"
              :class="{ 'affix-btn--debuff': Affixes[name] && Affixes[name].debuff }"
              @click="removeAffixAt(index)"
            >
              <div class="affix-btn-inner">
                <div class="affix-btn-name">
                  {{ name }}
                </div>
                <div class="affix-btn-cost">
                  Cost: {{ Affixes[name] ? Affixes[name].cost : 0 }}
                </div>
              </div>
            </button>
            <div
              v-if="index < selectedAffixes.length - 1"
              class="affix-arrow"
            >
              →
            </div>
          </div>
          <div
            v-if="selectedAffixes.length === 0"
            class="empty-hint"
          >
            Select affixes below to assemble a spell
          </div>
        </div>
        <button
          class="create-spell-btn"
          :class="{ 'create-spell-btn--disabled': !canCreateSpell }"
          :disabled="!canCreateSpell"
          @click="createSpell"
        >
          &gt;
        </button>
      </div>
      <div class="assembly-cost">
        Total Cost: {{ selectedTotalCost }} / {{ formatInt(mana) }} Mana
      </div>
    </div>

    <!-- Spells -->
    <div class="spells-panel">
      <div class="panel-title">
        Spells ({{ spells.length }} / 8)
      </div>
      <hr class="panel-division">
      <div class="spells-grid">
        <div
          v-for="(spell, index) in spells"
          :key="index"
          v-tooltip="spellSummary(spell) + ' — ' + spell.manaCost + ' mana'"
          class="spell-slot affix-btn"
        >
          <div class="affix-btn-inner">
            <div class="affix-btn-name">
              Spell {{ index + 1 }}
            </div>
            <div class="affix-btn-cost">
              {{ spell.manaCost }} mana
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Bottom: Affix Selection Grid -->
    <div class="affix-section">
      <div class="panel-title">
        Affixes
      </div>
      <hr class="panel-division">
      <div class="affix-grid">
        <button
          v-for="item in affixList"
          :key="item.name || item.cost"
          v-tooltip="item.description(tooltipData())"
          class="affix-btn"
          :class="{ 'affix-btn--debuff': item.debuff }"
          @click="selectAffix(item.name)"
        >
          <div class="affix-btn-inner">
            <div class="affix-btn-name">
              {{ item.name }}
            </div>
            <div class="affix-btn-cost">
              Cost: {{ item.cost }}
            </div>
          </div>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ===== Layout ===== */
.present-tab {
  display: flex;
  flex-direction: column;
  align-items: center;
  color: var(--color-text);
  margin-inline: 5%;
  height: 100%;
}

/* ===== Mana Bar ===== */
.mana-section {
  width: 100%;
  margin-bottom: 1.5rem;
  flex-shrink: 0;
}

.mana-label {
  font-size: 1.6rem;
  font-weight: bold;
  text-align: center;
  margin-bottom: 0.6rem;
  color: var(--color-text);
}

.mana-bar-container {
  width: 80%;
  height: 2.5rem;
  margin: 0 auto;
  position: relative;
  background: linear-gradient(45deg, #1a1a2e, #16213e);
  border: 0.2rem solid #5b7fff;
  border-radius: var(--var-border-radius, 0.5rem);
  overflow: hidden;
}

.mana-bar-fill {
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
  z-index: 0;
  background: linear-gradient(90deg, #2e4db5, #5b7fff);
  transition: width 0.3s ease;
}

.mana-bar-overlay {
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
  z-index: 1;
  box-shadow: inset 0 0 0.5rem 0.1rem rgba(0, 0, 0, 0.4);
  pointer-events: none;
}

/* ===== Panels ===== */
.assembly-panel,
.spells-panel,
.affix-section {
  width: 95%;
  margin: 0 auto 1.5rem;
  padding: 1.2rem;
  border: 0.2rem solid var(--color-text);
  border-radius: var(--var-border-radius, 0.5rem);
}

.assembly-panel,
.spells-panel {
  flex-shrink: 0;
}

.panel-title {
  font-size: 1.3rem;
  font-weight: bold;
}

.panel-division {
  color: var(--color-text);
  margin: 0.6rem 0;
}

/* ===== Assembly Content ===== */
.assembly-content {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 0.8rem;
}

.selected-affixes {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  align-items: center;
  flex-grow: 1;
  min-height: 3.5rem;
}

.selected-affixes .affix-btn {
  width: 8rem;
  flex-shrink: 0;
}

.affix-slot {
  display: flex;
  flex-direction: row;
  align-items: center;
}

.affix-arrow {
  font-size: 1.2rem;
  margin: 0 0.2rem;
  color: var(--color-text);
  opacity: 0.6;
}

.empty-hint {
  color: #888;
  font-style: italic;
}

.assembly-cost {
  margin-top: 0.8rem;
  font-size: 1.1rem;
  color: #aaa;
}

/* ===== Create Spell Button ===== */
.create-spell-btn {
  width: 3.5rem;
  height: 3.5rem;
  font-size: 1.8rem;
  font-weight: bold;
  background-color: #2e4db5;
  color: var(--color-text);
  border: 0.2rem solid #5b7fff;
  border-radius: var(--var-border-radius, 0.3rem);
  cursor: pointer;
  transition: all 0.15s;
  flex-shrink: 0;
}

.create-spell-btn:hover:not(:disabled) {
  background-color: #5b7fff;
  box-shadow: 0 0 1rem rgba(91, 127, 255, 0.6);
}

.create-spell-btn--disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* ===== Spells ===== */
.spells-grid {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.8rem;
}

.spell-slot {
  width: 8rem;
}

/* ===== Affix Section ===== */
.affix-section {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
}

.affix-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(8rem, 1fr));
  gap: 0.8rem;
  flex-grow: 1;
  align-content: start;
}

.affix-btn {
  aspect-ratio: 1;
  background-color: #5b7fff;
  box-shadow: 0 0 0.8rem 0.1rem rgba(91, 127, 255, 0.4);
  border: none;
  cursor: pointer;
  transition: all 0.15s;
  user-select: none;
  padding: 0;
}

.affix-btn:hover {
  transform: scale(1.04);
  box-shadow: 0 0 1.2rem 0.2rem rgba(91, 127, 255, 0.7);
}

.affix-btn--debuff {
  background-color: #b55b7f;
  box-shadow: 0 0 0.8rem 0.1rem rgba(181, 91, 127, 0.4);
}

.affix-btn--debuff:hover {
  box-shadow: 0 0 1.2rem 0.2rem rgba(181, 91, 127, 0.7);
}

.affix-btn-inner {
  width: calc(100% - 0.3rem);
  height: calc(100% - 0.3rem);
  margin: 0.15rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: #1a1a3e;
  font-family: Typewriter, serif;
  font-weight: bold;
  color: #c8d6ff;
}

.affix-btn-name {
  font-size: 1.2rem;
  text-transform: capitalize;
}

.affix-btn-cost {
  font-size: 0.85rem;
  color: #8899cc;
  margin-top: 0.3rem;
}
</style>
