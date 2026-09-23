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
    if (!config.cost && !config.costs && !this.isPortal) this.scalingType = config.scaling.type;

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
    return (this.type === "core" && this.completed) || this.isPortal;
  }

  get isPortal() {
    return this.type === "sink" || this.type === "float";
  }

  get targetNode() {
    if (!this.isPortal) return undefined;
    const target = AbyssResearches[this.target];
    const oppositeType = this.type === "sink" ? "float" : "sink";
    return target?.type === oppositeType && target.target === this.id ? target : undefined;
  }

  get connectedNodes() {
    return [...this.next, ...this.previous, ...(this.targetNode ? [this.targetNode.id] : [])];
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
    if (this.type === "single" || this.type === "core" || this.type === "corruption") return DC.D1;
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
    if (this.type === "corruption") {
      return Object.fromEntries(Object.entries(this.config.cost)
        .map(([currency, cost]) => [currency, typeof cost === "function" ? cost() : cost]));
    }
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
    if (this.isPortal) return 0;
    if (this.level.gte(this.maxLevel)) return 1;
    if (this.type === "corruption") return 0;
    return this.progress.div(this.cost).min(1).toNumber();
  }

  get progress() {
    return this.data.progress;
  }

  set progress(data) {
    if (this.type === "corruption" || this.isPortal) return;
    this.data.progress = data;
    if (!(this.type === "single")) this.updateScaling();
    this.updateLevel();
  }

  get canResearch() {
    if (this.type === "corruption" || this.isPortal) return false;
    return player.activeAbyssResearches.size < this.maxConcurrent && this.unlocked && this.level.lt(this.maxLevel);
  }

  get canPurchase() {
    return this.type === "corruption" && this.unlocked && !this.maxed &&
      Object.entries(this.cost).every(([currency, cost]) => Currency[currency].gte(cost));
  }

  get permanent() {
    return this.config.permanent;
  }

  get maxConcurrent() {
    // Maxiumn concurrent researches
    let maxConcurrent = 1;
    if (AbyssResearches.A6.isEffectActive) maxConcurrent++;
    if (AbyssResearches.A6B.isEffectActive) maxConcurrent++;
    if (AbyssResearches["Past-Present"].isEffectActive) maxConcurrent++;
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
    if (this.type === "corruption" || this.isPortal) return false;
    return this.linkedAbyssResearchCore ? this.linkedAbyssResearchCore.completed : false;
  }

  get autoResearchEfficiency() {
    return this.linkedAbyssResearchCore ? this.linkedAbyssResearchCore.effectValue : 0;
  }

  get completed() {
    return this.level.gte(1);
  }

  get maxed() {
    if (this.isPortal) return false;
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

  get coreRestrictionCompleted() {
    if (!this.hasRestriction) return false;
    for (const restriction of this.restrictions) restriction.checkCompletionState();
    // Completion can be checked before the next failure event, so also validate the current state.
    return this.restrictionsAllCompleted && this.restrictions.every(restriction =>
      restriction.type !== "failable" || restriction.config.noCheckOnCompletion || restriction.config.completable());
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
    if (this.type === "corruption" || this.isPortal) return;
    const preLevel = this.level;
    const isFirstLevel = preLevel.eq(0);
    switch (this.type) {
      case "core":
        if (this.coreRestrictionCompleted || this.progress.gte(this.config.cost)) {
          this.level = DC.D1;
        } else return;
        break;
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

    // This shows nearby nodes, 2 layers away at max, and unlocks nodes next to it.
    const recorder = [];
    const callback = (start, layer) => {
      for (const node of AbyssResearches[start].connectedNodes) {
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
    const wasUnlocked = this.unlocked;
    player.abyssResearches[this.id].unlocked = true;
    player.abyssResearches[this.id].shown = true;
    // Mark this end first so reciprocal portal bindings cannot recurse indefinitely.
    if (this.isPortal && !wasUnlocked) {
      if (this.targetNode && !this.targetNode.unlocked) this.targetNode.unlock();
      this.updateCompletion();
    }
  }

  show() {
    player.abyssResearches[this.id].shown = true;
  }

  updateCompletionWithCondition() {
    if (this.isPortal && this.unlocked) {
      if (this.targetNode && !this.targetNode.unlocked) this.targetNode.unlock();
      this.updateCompletion();
      return;
    }
    if (this.level.gte(1)) {
      this.updateCompletion();
      return;
    }
    if (!player.abyssResearches[this.id].unlocked) return;

    // This shows nearby nodes, 1 layers away at maxiumn.
    const recorder = [];
    const callback = (start, layer) => {
      for (const node of AbyssResearches[start].connectedNodes) {
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
    if (this.type === "core") this.updateLevel();
  }

  stop() {
    player.activeAbyssResearches.delete(this.id);
  }

  purchase() {
    if (this.type !== "corruption" || !this.unlocked || this.maxed) return false;
    // Resolve dynamic prices once and check every resource before spending any of them.
    const costs = Object.entries(this.cost);
    if (!costs.every(([currency, cost]) => Currency[currency].gte(cost))) return false;
    const ttCost = costs.find(([currency]) => currency === "timeTheorems")?.[1] ?? 0;
    player.timestudy.corruptionTTSpent = TimeTheorems.corruptionTTSpent.add(ttCost);
    for (const [currency, cost] of costs) Currency[currency].subtract(cost);
    this.level = DC.D1;
    player.timestudy.maxTheorem = TimeTheorems.total();
    this.updateCompletion();
    return true;
  }

  click() {
    if (!this.unlocked) return undefined;
    if (this.isPortal) {
      const target = this.targetNode;
      if (!target) return undefined;
      target.unlock();
      player.abyssResearchCanvas.currentAbyssResearchDepth = target.depth;
      return target;
    }
    if (this.type === "corruption") this.purchase();
    else if (this.isResearching) this.stop();
    else this.start();
    return undefined;
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
    player.records.thisReality.maxEffectiveSpace =
      player.records.thisReality.maxEffectiveSpace.max(getEffectiveSpace());

    player.activeAbyssResearches.forEach(research => {
      AbyssResearches[research].addProgress(AbyssResearches[research].researchSpeed.mul(diff).div(1000));
    });

    for (const index in this.cores) {
      const Core = this.cores[index];
      if (!Core || !Core.completed) continue;
      const Depth = Core.depth;
      const Efficiency = Core.effectValue;
      for (const research in this.sortByDepth[Depth]) {
        if (AbyssResearches[research].maxed || AbyssResearches[research].type === "corruption" ||
          AbyssResearches[research].isPortal) continue;
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
