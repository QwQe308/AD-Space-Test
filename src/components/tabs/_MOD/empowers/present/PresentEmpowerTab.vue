<script>
import { Affixes, PresentEmpower, simulateSpellData, spellEffectSummary } from "../../../../../core/_MOD/empowers/present/presentEmpower";

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
      editMode: false,
      deleteMode: false,
      editingSpellIndex: -1,
      _prevSpellCount: -1,
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
      return this.selectedAffixes.reduce((sum, name, i) => {
        const affix = Affixes[name];
        const base = affix ? affix.cost : 0;
        if (i === 0) return sum + base;
        const data = simulateSpellData(this.selectedAffixes, i);
        return sum + base + data.tempCostModifier;
      }, 0);
    },
    /**
     * Array of actual costs for each assembly affix (with tempCostModifier).
     * Returns { base: number, actual: number } pairs.
     */
    assemblyCosts() {
      return this.selectedAffixes.map((name, i) => {
        const affix = Affixes[name];
        const base = affix ? affix.cost : 0;
        if (i === 0) return { base, actual: base };
        const data = simulateSpellData(this.selectedAffixes, i);
        return { base, actual: base + data.tempCostModifier };
      });
    },
    canCreateSpell() {
      return this.selectedAffixes.length > 0 &&
        this.selectedTotalCost >= 10 &&
        this.spells.length <= 13;
    },
    createSpellTooltip() {
      if (this.selectedAffixes.length === 0) return "No affixes selected";
      if (this.selectedTotalCost < 10) return `Total cost must be at least 10 mana (currently ${this.selectedTotalCost})`;
      if (this.spells.length > 13) return "Maximum affixes reached";
      return "Create Spell";
    },
  },
  methods: {
    update() {
      this.mana = PresentEmpower.mana;
      this.maxMana = PresentEmpower.maxMana;
      const count = PresentEmpower.spells.length;
      if (this._prevSpellCount !== count) {
        this._prevSpellCount = count;
        this.spells = this.copySpells();
      }
      this.selectedAffixes = [...PresentEmpower.selectedAffixes];
      this.affixList = Affixes.all;
      this.editingSpellIndex = PresentEmpower.data.editingSpellIndex;
    },
    assemblyTooltip(index) {
      const name = this.selectedAffixes[index];
      const affix = Affixes[name];
      if (!affix) return "";
      const data = simulateSpellData(this.selectedAffixes, index);
      const spDisplay = formatPercents(data.totalSpellPower, 2, 2);
      return `${this.cap(name)} (${spDisplay})<br>--------------------<br>${affix.description(data)}`;
    },
    affixNextTooltip(affix) {
      if (!affix) return "";
      const names = [...this.selectedAffixes, affix.name];
      const data = simulateSpellData(names, this.selectedAffixes.length);
      const spDisplay = formatPercents(data.totalSpellPower, 2, 2);
      return `${this.cap(affix.name)} (${spDisplay})<br>--------------------<br>${affix.description(data)}`;
    },
    affixNextCost(affix) {
      if (!affix) return { base: 0, actual: 0 };
      const names = [...this.selectedAffixes, affix.name];
      const data = simulateSpellData(names, this.selectedAffixes.length);
      return { base: affix.cost, actual: affix.cost + data.tempCostModifier };
    },
    costDisplay(base, actual) {
      if (actual === base) return `Cost: ${base}`;
      return `Cost: ${actual} [${base}]`;
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
      this.editMode = false;
      this.editingSpellIndex = -1;
    },
    copySpells() {
      return PresentEmpower.spells.map(s => ({
        name: s.name,
        affixes: [...s.affixes],
        manaCost: s.data.manaCost,
        effects: spellEffectSummary(s.data),
      }));
    },
    renameSpell(index, e) {
      PresentEmpower.renameSpell(index, e.target.value);
      this.spells = this.copySpells();
    },
    spellTooltip(spell) {
      const chain = spell.affixes.map(name => {
        const a = Affixes[name];
        return a ? name.charAt(0).toUpperCase() : name;
      }).join(" → ");
      const parts = [spell.name, chain];
      if (spell.effects.length) {
        parts.push("--------------------", ...spell.effects);
      }
      parts.push("--------------------", `${spell.manaCost} mana`);
      return parts.join("<br>");
    },
    toggleEditMode() {
      this.editMode = !this.editMode;
      if (this.editMode) {
        this.deleteMode = false;
      } else {
        // Manual close: clear assembly
        PresentEmpower.clearSelection();
        this.selectedAffixes = [];
      }
    },
    toggleDeleteMode() {
      this.deleteMode = !this.deleteMode;
      if (this.deleteMode) this.editMode = false;
    },
    spellClick(index) {
      if (this.deleteMode) {
        PresentEmpower.deleteSpell(index);
        this.spells = this.copySpells();
        this.deleteMode = false;
        return;
      }
      if (this.editMode) {
        PresentEmpower.loadSpellToAssembly(index);
        this.selectedAffixes = [...PresentEmpower.selectedAffixes];
        this.editingSpellIndex = index;
      }
    },
    cap(str) {
      return str.charAt(0).toUpperCase() + str.slice(1);
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
              v-tooltip="assemblyTooltip(index)"
              class="affix-btn"
              :class="{ 'affix-btn--debuff': Affixes[name] && Affixes[name].debuff }"
              @click="removeAffixAt(index)"
            >
              <div class="affix-btn-inner">
                <div class="affix-btn-name">
                  {{ name }}
                </div>
                <div class="affix-btn-cost">
                  {{ costDisplay(assemblyCosts[index].base, assemblyCosts[index].actual) }}
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
        </div>
        <button
          v-tooltip="createSpellTooltip"
          class="create-spell-btn"
          :class="{ 'create-spell-btn--disabled': !canCreateSpell }"
          :disabled="!canCreateSpell"
          @click="createSpell"
        >
          &gt;
        </button>
        <div
          v-if="selectedAffixes.length === 0"
          class="empty-hint"
        >
          Select affixes below to assemble a spell
        </div>
      </div>
      <div class="assembly-cost">
        Total Cost: {{ selectedTotalCost }} Mana
      </div>
    </div>

    <!-- Spells -->
    <div class="spells-panel">
      <div class="panel-title panel-title--with-actions">
        Spells ({{ spells.length }} / 13)
        <div class="spells-actions">
          <button
            v-tooltip="'Edit Mode'"
            class="mode-btn"
            :class="{ 'mode-btn--active': editMode }"
            @click="toggleEditMode"
          >
            <i class="fas fa-pen" />
          </button>
          <button
            v-tooltip="'Delete Mode'"
            class="mode-btn mode-btn--delete"
            :class="{ 'mode-btn--active': deleteMode }"
            @click="toggleDeleteMode"
          >
            <i class="fas fa-trash" />
          </button>
        </div>
      </div>
      <hr class="panel-division">
      <div class="spells-grid">
        <div
          v-for="(spell, index) in spells"
          :key="index"
          v-tooltip="{
            content: spellTooltip(spell),
            classes: ['general-tooltip', 'present-spell-tooltip'],
          }"
          class="spell-slot affix-btn"
          :class="{
            'affix-btn--debuff': editingSpellIndex === index,
            'mode-btn--active': deleteMode || editMode && editingSpellIndex !== index
          }"
          @click="spellClick(index)"
        >
          <div class="affix-btn-inner">
            <input
              v-if="editingSpellIndex === index"
              class="spell-name-input c-modal-input"
              :value="spell.name || ' '"
              maxlength="8"
              @input="renameSpell(index, $event)"
              @click.stop
            >
            <span
              v-else
              class="affix-btn-name"
            >{{ spell.name || " " }}</span>
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
          v-tooltip="affixNextTooltip(item)"
          class="affix-btn"
          :class="{
            'affix-btn--debuff': item.debuff,
            'affix-btn--used': selectedAffixes.includes(item.name)
          }"
          :disabled="selectedAffixes.includes(item.name)"
          @click="selectAffix(item.name)"
        >
          <div class="affix-btn-inner">
            <div class="affix-btn-name">
              {{ item.name }}
            </div>
            <div class="affix-btn-cost">
              {{ costDisplay(item.cost, affixNextCost(item).actual) }}
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
  position: relative;
  gap: 0.8rem;
}

.selected-affixes {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  align-items: center;
  flex-grow: 1;
  min-height: 8rem;
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
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: #888;
  font-style: italic;
  pointer-events: none;
  white-space: nowrap;
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

/* ===== Spells Header ===== */
.panel-title--with-actions {
  position: relative;
}

.spells-actions {
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  flex-direction: row;
  gap: 0.4rem;
}

.mode-btn {
  width: 2.5rem;
  height: 2.5rem;
  border: 0.2rem solid var(--color-text);
  border-radius: var(--var-border-radius, 0.3rem);
  background-color: var(--color-base);
  color: var(--color-text);
  cursor: pointer;
  transition: all 0.15s;
  font-size: 1.1rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.mode-btn:hover {
  background-color: var(--color-text);
  color: var(--color-base);
}

.mode-btn--active {
  background-color: var(--color-text);
  color: var(--color-base);
  box-shadow: 0 0 0.6rem rgba(91, 127, 255, 0.5);
}

.mode-btn--active:hover {
  border-color: #5b7fff;
}

.mode-btn--delete.mode-btn--active {
  background-color: #b55b5b;
  border-color: #b55b5b;
  box-shadow: 0 0 0.6rem rgba(181, 91, 91, 0.5);
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

.affix-btn--used {
  background-color: #3a3a4a;
  box-shadow: 0 0 0.4rem 0.1rem rgba(58, 58, 74, 0.3);
  cursor: not-allowed;
  opacity: 0.5;
}

.affix-btn--used:hover {
  transform: none;
  box-shadow: 0 0 0.4rem 0.1rem rgba(58, 58, 74, 0.3);
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

.spell-name-input {
  width: calc(100% - 0.4rem);
  font-size: 1rem;
  margin: 0;
}

.spell-name-input:focus {
  outline: none;
}

.affix-btn-cost {
  font-size: 0.85rem;
  color: #8899cc;
  margin-top: 0.3rem;
}
</style>
