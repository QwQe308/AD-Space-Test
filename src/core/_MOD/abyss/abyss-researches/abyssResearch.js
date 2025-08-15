import { DC } from "../../../constants";
import { GameMechanicState } from "../../../utils";
import { abyssDepths, globalAbyssResearchSpeed } from "./abyssResearches";

//currently only allows linear
class AbyssResearchClass extends GameMechanicState {
  id;
  depth;
  type;
  x;
  y;
  scaling;
  scalingType;
  next;
  previous;
  tooltipTags;
  hasRestriction;
  constructor(config) {
    super(config);
    this.id = config.id;
    this.depth = config.depth;
    this.type = config.type;
    this.x = config.position[0] * 150 + 5000;
    this.y = config.position[1] * -150 + 5000;
    this.next = config.next;
    this.previous = config.previous;
    this.tooltipTags = config.tooltipTags;
    this.hasRestriction = Boolean(config.restrictionInfo);
    if (!(config.type === "single")) this.scalingType = config.scaling.type;
  }

  get level() {
    return player.abyssResearches[this.id].level;
  }

  set level(data) {
    if (this.config.onLevelUp && this.level.lt(data)) this.config.onLevelUp(this.level, data);
    player.abyssResearches[this.id].level = data;
  }

  get maxLevel() {
    if (this.type === "single") return DC.D1;
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
    if (this.type === "single") return this.config.cost;
    switch (this.scalingType) {
      case "linear":
        return player.abyssResearches[this.id].cost;
    }
  }

  set cost(data) {
    player.abyssResearches[this.id].cost = data;
  }

  get percentage() {
    if (this.level.gte(this.maxLevel)) return 1;
    return this.progress.div(this.cost).min(1).toNumber();
  }

  get progress() {
    return player.abyssResearches[this.id].progress;
  }

  set progress(data) {
    player.abyssResearches[this.id].progress = data;
    if (!(this.type === "single")) this.updateScaling();
    this.updateLevel();
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
      case "single":
        if (this.progress.gte(this.config.cost)) {
          this.level = DC.D1;

          this.stop();
        } else return;
        break;
      case "limited":
        switch (this.scalingType) {
          case "linear": // limited - linear
            if (this.scaling.purchases.lt(1)) return;
            this.level = this.level.add(this.scaling.purchases);
            this.cost = this.scaling.nextCost;
            player.abyssResearches[this.id].progress = this.progress.sub(this.scaling.totalCost); //to avoid unwanted update

            if (this.level.gte(this.maxLevel)) this.stop();
            break;
        }
        break;
      case "unlimited":
        switch (this.scalingType) {
          case "linear": // unlimited - linear
            if (this.scaling.purchases.lt(1)) return;
            this.level = this.level.add(this.scaling.purchases);
            this.cost = this.scaling.nextCost;
            player.abyssResearches[this.id].progress = this.progress.sub(this.scaling.totalCost); //to avoid unwanted update

            break;
        }
        break;
    }
    if (isFirstLevel) this.updateCompletion();
  }

  updateCompletion() {
    for (let tag of this.tooltipTags) {
      player.abyssResearchTooltipsShown.add(tag);
    }

    for (let next1 of this.next) {
      player.abyssResearches[next1].unlocked = true;
      player.abyssResearches[next1].shown = true;
      for (let next2 of AbyssResearches[next1].next) {
        player.abyssResearches[next2].shown = true;
        //+++
        for (let next3 of AbyssResearches[next2].next) {
          player.abyssResearches[next3].shown = true;
        }

        //++-
        for (let prev3 of AbyssResearches[next2].previous) {
          player.abyssResearches[prev3].shown = true;
        }
      }

      for (let prev2 of AbyssResearches[next1].previous) {
        player.abyssResearches[prev2].shown = true;
        //+-+
        for (let next3 of AbyssResearches[prev2].next) {
          player.abyssResearches[next3].shown = true;
        }

        //+--
        for (let prev3 of AbyssResearches[prev2].previous) {
          player.abyssResearches[prev3].shown = true;
        }
      }
    }

    for (let prev1 of this.previous) {
      player.abyssResearches[prev1].unlocked = true;
      player.abyssResearches[prev1].shown = true;
      for (let next2 of AbyssResearches[prev1].next) {
        player.abyssResearches[next2].shown = true;
        //-++
        for (let next3 of AbyssResearches[next2].next) {
          player.abyssResearches[next3].shown = true;
        }

        //-+-
        for (let prev3 of AbyssResearches[next2].previous) {
          player.abyssResearches[prev3].shown = true;
        }
      }

      for (let prev2 of AbyssResearches[prev1].previous) {
        player.abyssResearches[prev2].shown = true;
        //--+
        for (let next3 of AbyssResearches[prev2].next) {
          player.abyssResearches[next3].shown = true;
        }

        //---
        for (let prev3 of AbyssResearches[prev2].previous) {
          player.abyssResearches[prev3].shown = true;
        }
      }
    }
  }

  updateCompletionWithCondition() {
    if (this.level.gte(1)) return this.updateCompletion();
    if (!player.abyssResearches[this.id].unlocked) return;
    for (let next1 of this.next) {
      player.abyssResearches[next1].shown = true;
      //++
      for (let next2 of AbyssResearches[next1].next) {
        player.abyssResearches[next2].shown = true;
      }

      //+-
      for (let prev2 of AbyssResearches[next1].previous) {
        player.abyssResearches[prev2].shown = true;
      }
    }

    for (let prev1 of this.previous) {
      player.abyssResearches[prev1].shown = true;
      //-+
      for (let next2 of AbyssResearches[prev1].next) {
        player.abyssResearches[next2].shown = true;
      }

      //--
      for (let prev2 of AbyssResearches[prev1].previous) {
        player.abyssResearches[prev2].shown = true;
      }
    }
  }

  start() {
    if (!this.canResearch) return;
    player.activeAbyssResearches.add(this.id);
  }

  stop() {
    player.activeAbyssResearches.delete(this.id);
  }

  click() {
    if (this.isResearching) this.stop();
    else this.start();
  }

  get canResearch() {
    return player.activeAbyssResearches.size < this.maxConcurrent && player.abyssResearches[this.id].unlocked;
  }

  get maxConcurrent() {
    //maxiumn concurrent researches
    let maxConcurrent = 1;
    if (AbyssResearches.A6.isEffectActive) maxConcurrent++;
    return maxConcurrent;
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

  get isResearching() {
    return player.activeAbyssResearches.has(this.id);
  }

  get researchSpeed() {
    if (!this.checkRestriction) return globalAbyssResearchSpeed().div(this.restrictionNerf);
    return globalAbyssResearchSpeed();
  }

  get completed() {
    return this.level.gte(1);
  }

  get maxed() {
    return this.level.gte(this.maxLevel);
  }

  get restrictionInfo() {
    return this.config.restrictionInfo(this.level);
  }

  get restrictionNerf() {
    return this.config.restrictionNerf(this.level);
  }

  get checkRestriction() {
    return !this.config.checkRestriction || this.config.checkRestriction(this.level);
  }

  initializeCost() {
    if (this.config.scaling && this.config.scaling.type === "linear") {
      this.cost = this.config.scaling.cost.mul(
        this.config.scaling.costIncrease.pow(this.level)
      );
    }
  }
}

export const AbyssResearches = mapGameDataToObject(
  GameDatabase.space.abyssResearches,
  (config) => new AbyssResearchClass(config)
);

let abyssResearchesSortByDepth = {};
for (let i of abyssDepths) {
  abyssResearchesSortByDepth[i] = {};
}
for (let i in AbyssResearches) {
  if (i === "all") continue;
  abyssResearchesSortByDepth[AbyssResearches[i].depth][i] = AbyssResearches[i];
}
export const AbyssResearchesSortByDepth = abyssResearchesSortByDepth;

export function updateAbyssResearchProgress(diff) {
  if (player.records.thisReality.maxSpace.lt(player.space)) {
    player.records.thisReality.maxSpace = player.space;
  }
  player.activeAbyssResearches.forEach((research) => {
    AbyssResearches[research].addProgress(AbyssResearches[research].researchSpeed.mul(diff).div(1000));
  });
}

export function updateAbyssResearchStatus() {
  for (let i of AbyssResearches.all) {
    i.updateCompletionWithCondition();
    i.initializeCost();
  }
}
