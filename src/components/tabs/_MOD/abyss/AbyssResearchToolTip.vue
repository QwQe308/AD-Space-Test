<script>
export default {
  name: "TooltipContent",
  props: {
    node: {
      type: Object,
      required: true
    },
    isResearching: {
      type: Boolean,
      default: false
    },
    isCompleted: {
      type: Boolean,
      default: false
    },
    isUnlocked: {
      type: Boolean,
      default: false
    },
    canStartResearch: {
      type: Boolean,
      default: false
    },
    requirementsMet: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    classObject() {
      return {
        "research-tooltip": true,
        "research-tooltip--active": this.isResearching,
        "research-tooltip--completed": this.isCompleted
      };
    },
    progressPercent() {
      return this.node.progress * 100;
    },
    levelText() {
      return this.node.maxLevel > 0 
        ? `${this.node.currentLevel}/${this.node.maxLevel}`
        : this.node.currentLevel;
    },
    requirementsText() {
      if (!this.requirementsMet) {
        return "Requires prior researches";
      }
      if (!this.isUnlocked) {
        return "Not unlockeda";
      }
      return "";
    }
  },
  methods: {
    startResearch() {
      this.$emit("start-research", this.node);
    }
  }
};
</script>

<template>
  <div :class="classObject">
    <div class="research-tooltip__title">{{ node.name }}</div>
    <div class="research-tooltip__type">Type: {{ 
      node.type === 'unlimited' ? 'Unlimited' :
      node.type === 'limited' ? 'Limited' : 'Unlockable'
    }}</div>
    
    <div class="research-tooltip__progress">
      <div class="research-tooltip__progress-bar" :style="{ width: `${progressPercent}%` }"></div>
    </div>
    <div class="research-tooltip__status">
      Progress: {{ progressPercent.toFixed(1) }}% | 
      State: {{ 
        isResearching ? 'Researching' :
        isCompleted ? 'Completed' : 'Not Researching'
      }}
    </div>
    
    <div class="research-tooltip__level">Level: {{ levelText }}</div>
    
    <div class="research-tooltip__effect" v-if="node.effect">
      Effect: {{ node.effect }}
    </div>
    
    <div class="research-tooltip__stats">
      <div class="research-tooltip__stat" v-if="node.cost">
        <i class="fas fa-coins"></i> Cost: {{ node.cost }}
      </div>
      <div class="research-tooltip__stat" v-if="node.time">
        <i class="fas fa-clock"></i> Research Time: {{ node.time }}s <!-- to be fixed -->
      </div>
    </div>
    
    <div class="research-tooltip__requirements" v-if="requirementsText">
      <i class="fas fa-lock"></i> {{ requirementsText }}
    </div>
    
    <button 
      v-if="canStartResearch"
      class="research-tooltip__button"
      @click="startResearch"
    >
      <i class="fas fa-flask"></i> Start
    </button>
  </div>
</template>

<style scoped>
.research-tooltip {
  background: rgba(30, 31, 40, 0.95);
  border: 1px solid rgba(52, 152, 219, 0.5);
  border-radius: 8px;
  padding: 15px;
  max-width: 300px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(5px);
}

.research-tooltip--active {
  border-color: #f39c12;
}

.research-tooltip--completed {
  border-color: #2ecc71;
}

.research-tooltip__title {
  font-size: 1.2rem;
  font-weight: 600;
  margin-bottom: 10px;
  color: #3498db;
}

.research-tooltip__type {
  margin-bottom: 10px;
  opacity: 0.8;
}

.research-tooltip__progress {
  height: 10px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 5px;
  margin: 10px 0;
  overflow: hidden;
}

.research-tooltip__progress-bar {
  height: 100%;
  background: linear-gradient(to right, #3498db, #2ecc71);
  border-radius: 5px;
}

.research-tooltip__status {
  margin: 5px 0;
  font-size: 0.9rem;
}

.research-tooltip__level {
  margin: 5px 0;
  font-weight: bold;
}

.research-tooltip__effect {
  margin: 10px 0;
  font-size: 0.9rem;
  color: #bdc3c7;
}

.research-tooltip__stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-top: 10px;
}

.research-tooltip__stat {
  background: rgba(20, 21, 30, 0.8);
  padding: 8px;
  border-radius: 5px;
  font-size: 0.9rem;
}

.research-tooltip__requirements {
  margin-top: 10px;
  padding: 8px;
  background: rgba(231, 76, 60, 0.2);
  border-radius: 5px;
  color: #e74c3c;
}

.research-tooltip__button {
  margin-top: 15px;
  width: 100%;
  padding: 10px;
  background: linear-gradient(to right, #3498db, #2ecc71);
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.3s ease;
}

.research-tooltip__button:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
}
</style>