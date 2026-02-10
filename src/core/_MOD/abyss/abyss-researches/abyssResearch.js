import { DC } from "../../../constants";
import { GameMechanicState } from "../../../utils";
import { abyssDepths, globalAbyssResearchSpeed } from "./abyssResearches";
import { AbyssFailableRestriction, AbyssRestriction } from "./abyssRestrictionsHandler";

//currently only allows linear
class AbyssResearchClass extends GameMechanicState {
  constructor(config) {
    super(config);
    this.depth = config.depth;
    this.type = config.type;
    this.x = config.position[0] * 150 + 5000;
    this.y = config.position[1] * -150 + 5000;
    this.next = config.next;
    this.previous = config.previous;
    this.tooltipTags = config.tooltipTags;
    this.hasRestriction = Boolean(config.restrictions);
    this.target = config.target;
    if (!config.cost && !config.costs && this.type !== "sink") this.scalingType = config.scaling.type;

    this.restrictions = config.restrictions.map((x, index) =>
      x.type === "failable" ? new AbyssFailableRestriction(x, this.id, index) : new AbyssRestriction(x, this.id, index)
    );
  }

  get data() {
    return player.abyssResearches[this.id];
  }

  get unlocked() {
    return this.data.unlocked;
  }

  get level() {
    return this.data.level;
  }

  set level(data) {
    if (this.config.onLevelUp && this.level.lt(data)) this.config.onLevelUp(this.level, data);
    this.data.level = data;
  }

  get maxLevel() {
    if (this.type === "single" || this.type === "core") return DC.D1;
    if (this.type === "unlimited") return DC.BEMAX;
    return this.config.maxLevel;
  }

  get description() {
    return this.config.description(this.level);
  }

  get isEffectActive() {
    return this.level.gte(1);
  }

  get effectValue() {
    return this.config.effectValue(this.level);
  }

  get cost() {
    if (this.config.cost) return this.config.cost;
    if (this.config.costs) return this.config.costs[this.level];
    switch (this.scalingType) {
      case "linear":
        return this.data.cost;
    }
  }

  set cost(data) {
    this.data.cost = data;
  }

  get percentage() {
    if (this.level.gte(this.maxLevel)) return 1;
    return this.progress.div(this.cost).min(1).toNumber();
  }

  get progress() {
    return this.data.progress;
  }

  set progress(data) {
    this.data.progress = data;
    if (!(this.type === "single")) this.updateScaling();
    this.updateLevel();
  }

  get canResearch() {
    return player.activeAbyssResearches.size < this.maxConcurrent && this.unlocked && this.level.lt(this.maxLevel);
  }

  get maxConcurrent() {
    //maxiumn concurrent researches
    let maxConcurrent = 1;
    if (AbyssResearches.A6.isEffectActive) maxConcurrent++;
    return maxConcurrent;
  }

  get isResearching() {
    return player.activeAbyssResearches.has(this.id);
  }

  get researchSpeed() {
    return globalAbyssResearchSpeed().div(this.restrictionNerf);
  }

  get linkedAbyssResearchCore() {
    return AbyssResearchHelper.cores[this.depth];
  }

  get isAutoResearching() {
    return this.linkedAbyssResearchCore ? this.linkedAbyssResearchCore.completed : false;
  }

  get autoResearchEfficiency() {
    return this.linkedAbyssResearchCore ? this.linkedAbyssResearchCore.effectValue : 0;
  }

  get completed() {
    return this.level.gte(1);
  }

  get maxed() {
    return this.level.gte(this.maxLevel);
  }

  get restrictions() {
    return this.config.restrictions;
  }

  get restrictionStates() {
    return this.restrictions.map((x) => x.completed);
  }

  get totalRestrictionNerf() {
    return this.restrictions
      .map((x) => (x.completed ? DC.D1 : x.restrictionNerf))
      .reduce((a, b) => Decimal.mul(a, b), DC.D1);
  }

  get restrictionsAllCompleted() {
    return !this.restrictions.map((x) => x.completed).includes(false);
  }

  updateScaling() {
    if (!this.scalingType) return;
    switch (this.scalingType) {
      case "linear":
        this.scaling = new LinearCostScaling(
          this.progress,
          player.abyssResearches[this.id].cost,
          this.config.scaling.costIncrease,
          this.maxLevel
        );
    }
  }

  updateLevel() {
    let preLevel = this.level;
    let isFirstLevel = preLevel.eq(0);
    switch (this.type) {
      case "core":
        if (this.coreRestrictionCompleted || this.progress.gte(this.config.cost)) {
          this.level = DC.D1;
        } else return;
      case "single":
        if (this.progress.gte(this.config.cost)) {
          this.level = DC.D1;
        } else return;
        break;
      case "limited":
        if (this.config.costs) {
          if (this.progress.lt(this.cost)) return;
          while (this.progress.gte(this.cost)) {
            this.level = this.level.add(1);
          }
          break;
        }
        this.handleScalingLevelCalculations();
        break;
      case "unlimited":
        this.handleScalingLevelCalculations();
        break;
    }
    if (this.level.gte(this.maxLevel)) this.stop();
    if (isFirstLevel) this.updateCompletion();
  }

  handleScalingLevelCalculations() {
    switch (this.scalingType) {
      case "linear":
        if (this.scaling.purchases.lt(1)) return;
        this.level = this.level.add(this.scaling.purchases);
        this.cost = this.scaling.nextCost;
        player.abyssResearches[this.id].progress = this.progress.sub(this.scaling.totalCost); //to avoid unwanted update

        break;
    }
  }

  updateCompletion() {
    for (let tag of this.tooltipTags) {
      player.abyssResearchTooltipsShown.add(tag);
    }

    // This shows nearby nodes, 3 layers away at maxiumn, and unlocks nodes next to it.
    let callback = (layer) => {
      for (let node of [...this.next, ...this.prev]) {
        if (layer === 1) AbyssResearches[node].unlock();
        else AbyssResearches[node].shown = true;
        if (layer < 3) callback(layer + 1);
      }
    };

    callback(1);
  }

  unlock() {
    player.abyssResearches[this.id].unlocked = true;
    player.abyssResearches[this.id].shown = true;
    if ((this.type === "core" && this.level.gte(1)) || this.type === "sink") {
      for (let next of this.next) AbyssResearches[next].unlock();
    }
  }

  updateCompletionWithCondition() {
    if (this.level.gte(1)) return this.updateCompletion();
    if (!player.abyssResearches[this.id].unlocked) return;

    // This shows nearby nodes, 2 layers away at maxiumn.
    let callback = (layer) => {
      for (let node of [...this.next, ...this.prev]) {
        AbyssResearches[node].shown = true;
        if (layer < 2) callback(layer + 1);
      }
    };

    callback(1);
  }

  start() {
    if (!this.canResearch) return;
    player.activeAbyssResearches.add(this.id);
  }

  stop() {
    player.activeAbyssResearches.delete(this.id);
  }

  click() {
    if (!this.unlocked) return;
    if (this.type === "sink") player.abyssResearchCanvas.currentAbyssResearchDepth = this.target;
    else if (this.isResearching) this.stop();
    else this.start();
  }

  addProgress(data) {
    this.progress = this.progress.add(data);
  }

  reset() {
    player.abyssResearches[this.id].level = DC.D0;
    player.abyssResearches[this.id].progress = DC.D0;
    if (player.abyssResearches[this.id].cost) player.abyssResearches[this.id].cost = this.config.scaling.cost;
    this.updateScaling();
  }

  initializeCost() {
    if (this.config.scaling && this.config.scaling.type === "linear") {
      this.cost = this.config.scaling.cost.mul(this.config.scaling.costIncrease.pow(this.level));
    }
  }
}

export const AbyssResearches = mapGameDataToObject(
  GameDatabase.space.abyssResearches,
  (config) => new AbyssResearchClass(config)
);

class AbyssResearchHelper {
  constructor() {
    this.data = {};
    this.initializeHelperData();
  }

  get sortByDepth() {
    return this.data.sortByDepth;
  }

  get cores() {
    return this.data.cores;
  }

  initializeHelperData() {
    // Sort by depth
    let abyssResearchesSortByDepth = {};
    for (let i of abyssDepths) {
      abyssResearchesSortByDepth[i] = {};
    }
    for (let i in AbyssResearches) {
      if (i === "all") continue;
      abyssResearchesSortByDepth[AbyssResearches[i].depth][i] = AbyssResearches[i];
    }
    this.data.sortByDepth = abyssResearchesSortByDepth;

    // Abyss Research Cores
    let abyssResearchCores = {};
    for (let index in AbyssResearches) {
      let research = AbyssResearches[index];
      if (research.type !== "core") continue;
      abyssResearchCores[research.depth] = research;
    }
    this.data.cores = abyssResearchCores;
  }

  update(diff) {
    if (player.records.thisReality.maxSpace.lt(player.space)) {
      player.records.thisReality.maxSpace = player.space;
    }

    player.activeAbyssResearches.forEach((research) => {
      AbyssResearches[research].addProgress(AbyssResearches[research].researchSpeed.mul(diff).div(1000));
    });

    for (let index in this.cores) {
      const Core = this.cores[index];
      if (!Core.completed) continue;
      const Depth = Core.depth;
      const Efficiency = Core.effectValue;
      for (let research in this.sortByDepth[Depth]) {
        AbyssResearches[research].addProgress(
          AbyssResearches[research].researchSpeed.mul(Efficiency).mul(diff).div(1000)
        );
      }
    }
  }

  // Tool Functions
  updateStatus() {
    for (let research of AbyssResearches.all) {
      research.updateCompletionWithCondition();
      research.initializeCost();
    }
  }
}

export const AbyssResearchHelperTools = new AbyssResearchHelper();
