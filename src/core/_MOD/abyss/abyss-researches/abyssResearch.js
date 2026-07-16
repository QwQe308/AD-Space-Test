import { DC } from "../../../constants";
import { GameMechanicState } from "../../../utils";

import { abyssDepths, globalAbyssResearchSpeed } from "./abyssResearchSpawner";
import { AbyssFailableRestriction, AbyssRestriction } from "./abyssRestrictionsHandler";

// Currently only allows linear
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

    if (config.restrictions) {
      try {
        this.config.restrictions = config.restrictions.map((x, index) =>
          (x.type === "failable"
            ? new AbyssFailableRestriction(x, this.id, index)
            : new AbyssRestriction(x, this.id, index))
        );
      } catch (err) {
        console.error(`*Error found in assigning restriction to Abyss Research ${this.id} |`, err);
      }
    }
  }

  get ignoredOnUnlocking() {
    return (this.type === "core" && this.completed) || this.type === "sink";
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

  set level(newLevel) {
    if (this.config.onLevelUp && this.level.lt(newLevel)) this.config.onLevelUp(this.level, newLevel);
    this.data.level = newLevel;
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

  get permanent() {
    return this.config.permanent;
  }

  get maxConcurrent() {
    // Maxiumn concurrent researches
    let maxConcurrent = 1;
    if (AbyssResearches.A6.isEffectActive) maxConcurrent++;
    if (AbyssResearches.A6B.isEffectActive) maxConcurrent++;
    return maxConcurrent;
  }

  get isResearching() {
    return player.activeAbyssResearches.has(this.id);
  }

  get researchSpeed() {
    return globalAbyssResearchSpeed().div(this.totalRestrictionNerf);
  }

  get linkedAbyssResearchCore() {
    return AbyssResearchHelperTools.automationCores[this.depth];
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
    return this.restrictions.map(x => x.completed);
  }

  get totalRestrictionNerf() {
    if (!this.hasRestriction) return DC.D1;
    return this.restrictions
      .map(x => (x.completed ? DC.D1 : x.nerf))
      .reduce((a, b) => Decimal.mul(a, b), DC.D1);
  }

  get restrictionsAllCompleted() {
    return !this.restrictions.map(x => x.completed).includes(false);
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
    const preLevel = this.level;
    const isFirstLevel = preLevel.eq(0);
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
        if (!this.handleScalingLevelCalculations()) return;
        break;
      case "unlimited":
        if (!this.handleScalingLevelCalculations()) return;
        break;
    }
    if (this.level.gte(this.maxLevel)) this.stop();
    if (isFirstLevel) this.updateCompletion();
  }

  handleScalingLevelCalculations() {
    switch (this.scalingType) {
      case "linear":
        if (this.scaling.purchases.lt(1)) return false;
        this.level = this.level.add(this.scaling.purchases).min(this.maxLevel);
        this.cost = this.scaling.nextCost;
        player.abyssResearches[this.id].progress = this.progress.sub(this.scaling.totalCost); // To avoid unwanted update

        break;
    }
    return true;
  }

  updateCompletion() {
    for (const tag of this.tooltipTags) {
      player.abyssResearchTooltipsShown.add(tag);
    }

    // This shows nearby nodes, 2 layers away at maxiumn, and unlocks nodes next to it.
    const recorder = [];
    const callback = (start, layer) => {
      for (const node of [...AbyssResearches[start].next, ...AbyssResearches[start].previous]) {
        if (recorder.includes(node)) continue;
        recorder.push(node);
        if (layer === 1) AbyssResearches[node].unlock();
        else AbyssResearches[node].show();
        if (layer < 2) callback(node, layer + (AbyssResearches[node].ignoredOnUnlocking ? 0 : 1));
      }
    };

    callback(this.id, 1);
  }

  unlock() {
    player.abyssResearches[this.id].unlocked = true;
    player.abyssResearches[this.id].shown = true;
  }

  show() {
    player.abyssResearches[this.id].shown = true;
  }

  updateCompletionWithCondition() {
    if (this.level.gte(1)) return this.updateCompletion();
    if (!player.abyssResearches[this.id].unlocked) return;

    // This shows nearby nodes, 1 layers away at maxiumn.
    const recorder = [];
    const callback = (start, layer) => {
      for (const node of [...AbyssResearches[start].next, ...AbyssResearches[start].previous]) {
        if (recorder.includes(node)) continue;
        recorder.push(node);
        AbyssResearches[node].show();
        if (layer < 1) callback(node, layer + (AbyssResearches[node].ignoredOnUnlocking ? 0 : 1));
      }
    };

    callback(this.id, 1);
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
  config => new AbyssResearchClass(config)
);

class AbyssResearchHelper {
  constructor() {
    this.data = {};
    this.initializeHelperData();
  }

  get sortByDepth() {
    return this.data.sortByDepth;
  }

  get automationCores() {
    return this.data.automationCores;
  }

  initializeHelperData() {
    // Sort by depth
    const abyssResearchesSortByDepth = {};
    for (const i of abyssDepths) {
      abyssResearchesSortByDepth[i[0]] = {};
    }
    for (const i in AbyssResearches) {
      if (i === "all") continue;
      abyssResearchesSortByDepth[AbyssResearches[i].depth][i] = AbyssResearches[i];
    }
    this.data.sortByDepth = abyssResearchesSortByDepth;

    // Abyss Research Cores related to automation
    const abyssResearchCores = {};
    for (const index in AbyssResearches) {
      const research = AbyssResearches[index];
      if (research.type !== "core" && !research.automation) continue;
      abyssResearchCores[research.depth] = research;
    }
    this.data.automationCores = abyssResearchCores;
  }

  update(diff) {
    if (player.records.thisReality.maxSpace.lt(player.space)) {
      player.records.thisReality.maxSpace = player.space;
    }

    player.activeAbyssResearches.forEach(research => {
      AbyssResearches[research].addProgress(AbyssResearches[research].researchSpeed.mul(diff).div(1000));
    });

    for (const index in this.cores) {
      const Core = this.cores[index];
      if (!Core || !Core.completed) continue;
      const Depth = Core.depth;
      const Efficiency = Core.effectValue;
      for (const research in this.sortByDepth[Depth]) {
        if (AbyssResearches[research].maxed) continue;
        AbyssResearches[research].addProgress(
          AbyssResearches[research].researchSpeed.mul(Efficiency).mul(diff).div(1000)
        );
      }
    }
  }

  // Tool Functions
  updateStatus() {
    for (const research of AbyssResearches.all) {
      research.updateCompletionWithCondition();
      research.initializeCost();
    }
  }
}

export const AbyssResearchHelperTools = new AbyssResearchHelper();
