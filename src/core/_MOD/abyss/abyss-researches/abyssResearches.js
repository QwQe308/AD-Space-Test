import { AbyssResearchesDepth0 } from "./configs/abyss-research-depth-0";

export const abyssDepths = ["0"];

export function quickSpawnResearches(config, layer) {
  //safety checker
  abyssResearchSafetyChecker(config, layer);

  for (let i in config) {
    config[i].id = i;
    config[i].depth = layer;
    if (!config[i].tooltipTags) config[i].tooltipTags = [];
    if (!config[i].next) config[i].next = [];
    if (!config[i].previous) config[i].previous = [];
    for (let nextID of config[i].next) {
      let nextNode = config[nextID];
      if (nextNode.previous === undefined) nextNode.previous = [];
      nextNode.previous.push(i);
    }
  }
}

//check if the config is valid
export function abyssResearchSafetyChecker(config, layer) {
  let error = false;
  let positions = [];
  for (let i in config) {
    //global checker
    for (let item of ["description", "type", "position"]) {
      if (!config[i][item]) {
        console.error(`*Config error found in Abyss Research ${i} (layer ${layer}) (No ${item} defined)`);
        error = true;
      }
    }
    //position checker
    if (positions.filter((x) => x[0] === config[i].position[0] && x[1] === config[i].position[1]).length > 0) {
      console.error(`*Config error found in Abyss Research ${i} (layer ${layer}) (Position replicated)`);
      error = true;
    }
    positions.push(config[i].position);
    //restriction checker
    let restrictionChecker = 0;
    for (let item of ["restrictionInfo", "restrictionNerf", "checkRestriction"]) {
      if (config[i][item]) {
        restrictionChecker++;
      }
    }
    if (restrictionChecker > 0 && restrictionChecker < 3) {
      for (let item of ["restrictionInfo", "restrictionNerf", "checkRestriction"]) {
        if (!config[i][item]) {
          console.error(`*Config error found in Abyss Research ${i} (layer ${layer}) (No ${item} defined)`);
          error = true;
        }
      }
    }
    //type checker
    if (config[i].type === "single") {
      if (!config[i].cost) {
        console.error(`*Config error found in Abyss Research ${i} (layer ${layer}) (No cost defined)`);
        error = true;
      }
    } else if (config[i].type === "limited") {
      if (!config[i].maxLevel) {
        console.error(`*Config error found in Abyss Research ${i} (layer ${layer}) (No maxLevel defined)`);
        error = true;
      }
      if (!config[i].scaling) {
        console.error(`*Config error found in Abyss Research ${i} (layer ${layer}) (No scaling defined)`);
        error = true;
      }
    } else if (config[i].type === "unlimited") {
      if (!config[i].scaling) {
        console.error(`*Config error found in Abyss Research ${i} (layer ${layer}) (No scaling defined)`);
        error = true;
      }
    } else if (config[i].type === "core"){
      if(!config[i].coreRestrictions){
        console.error(`*Config error found in Abyss Research ${i} (layer ${layer}) (No coreRestrictions defined)`);
        error = true;
      }
      if(!config[i].cost){
        console.error(`*Config error found in Abyss Research ${i} (layer ${layer}) (No cost defined)`);
        error = true;
      }
    } else if (config[i].type === "sink") {
      if (!config[i].target) {
        console.error(`*Config error found in Abyss Research ${i} (layer ${layer}) (No target defined)`);
        error = true;
      }
    } else {
      console.error(`*Config error found in Abyss Research ${i} (layer ${layer}) (Wrong type)`);
      error = true;
    }
  }

  if (error) debugger;
}

export const abyssResearches = { ...AbyssResearchesDepth0 };

export function globalAbyssResearchSpeed() {
  let abyssResearchSpeed = player.records.thisReality.maxSpace.pow(0.5).div(10);
  abyssResearchSpeed = abyssResearchSpeed.timesEffectsOf(AbyssResearches.A5, AbyssResearches.A9);
  return abyssResearchSpeed;
}

export const extraAbyssResearchTooltips = {
  Tips: `* Some tips will show on Abyss Researches(AR). Once you've completed these researches(reaching lv.1), these tips will disappear. Disappeared ones could be viewed in "How to play" section.`,

  Shapes: `* Different types of Abyss Researches are shown in different shapes. Circle: unlimited, Diamond: limited, Hexagon: Single.`,

  ARS: `* Note that Abyss Research uses an independent value called Abyss Research Speed (ARS), differed from Research Speed (RS).`,

  Restrictions: `* If restrictions are not met, your ARS will receive a penalty.
  Penalty is shown below ARS, <span style="color:lime">green</span> if reached restriction, <span style="color:red">red</span> if not.
  You must *keep* restriction met to avoid ARS losses.
  If not mentioned, the restriction only need to be completed "now" instead of in entire "eternity" or other periods.`,

  "Instant Effect": `* Some Abyss Researches have Instant Effects on them. Be wisely, these effects only apply on current values once,
  and do not provide permanent multpliers.`,

  Core: `* Core Nodes requires you to complete various strict requirements at the same time. Once you accomplished them,
  you can simply research it and instantly claim *Permanent* boosts; Either, you can get the node by researching for a long time.
  These will never be reseted.`,

  Depth: `* Depths are similar to "pages" Abyss Researches are at. You could find unlocked depths in the left-upper corner,
  and also quick switch depths here.`,

  Sink: `* Sink nodes allows you to go deeper into the abyss. Once the node is used, the new depth will be permanently shown.
  However, if the node is locked, you will unable to research the nearby nodes linked to it.`,
};
