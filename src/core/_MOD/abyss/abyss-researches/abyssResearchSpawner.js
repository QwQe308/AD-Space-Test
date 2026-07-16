import { DEV } from "../../../../env";

export const abyssDepths = [
  ["0", () => !AbyssResearches.C0.completed],
  ["1", () => AbyssResearches.C0.completed],
];

export function quickSpawnResearches(config, layer) {
  // Safety checker
  if (DEV) abyssResearchSafetyChecker(config, layer);

  for (const i in config) {
    config[i].id = i;
    config[i].depth = layer;
    if (!config[i].tooltipTags) config[i].tooltipTags = [];
    if (!config[i].next) config[i].next = [];
    if (!config[i].previous) config[i].previous = [];
    for (const nextID of config[i].next) {
      const nextNode = config[nextID];
      if (nextNode.previous === undefined) nextNode.previous = [];
      nextNode.previous.push(i);
    }
  }
}

// Check if the config is valid
export function abyssResearchSafetyChecker(config, layer) {
  let error = false;
  const positions = [];
  for (const i in config) {
    // global checker
    for (const item of ["description", "type", "position"]) {
      if (!config[i][item]) {
        console.error(`*Config error found in Abyss Research ${i} (layer ${layer}) (No ${item} defined)`);
        error = true;
      }
    }
    // Position checker
    if (positions.filter(x => x[0] === config[i].position[0] && x[1] === config[i].position[1]).length > 0) {
      console.error(`*Config error found in Abyss Research ${i} (layer ${layer}) (Position replicated)`);
      error = true;
    }
    positions.push(config[i].position);
    // Restriction checker (disabled as currently restriction class will check it automatically)
    // type checker
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
    } else if (config[i].type === "core") {
      if (!config[i].cost) {
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

export function globalAbyssResearchSpeed() {
  let abyssResearchSpeed = player.records.thisReality.maxSpace.pow(0.5).div(10);
  abyssResearchSpeed = abyssResearchSpeed.timesEffectsOf(AbyssResearches.A5, AbyssResearches.A9);
  return abyssResearchSpeed;
}

export const extraAbyssResearchTooltips = {
  Tips: `* Some tips will show on Abyss Researches(AR). Once you've completed these researches(reaching lv.1), these tips will disappear. Disappeared ones could be viewed in "How to play" section.`,

  Shapes: `* Different types of Abyss Researches are shown in different shapes. Circle: unlimited, Diamond: limited, Hexagon: Single.`,

  ARS: `* Note that Abyss Research uses an independent value called Abyss Research Speed (ARS), differed from Research Speed (RS).`,

  Restrictions: `* If restrictions are not met, your ARS will face a penalty.<br><br>
  Penalty is shown after each restriction,
  <span style="color:lime">green</span> if reached restriction,
  <span style="color:red">red</span> if not.<br><br>
  You may want to *keep* restriction met to avoid ARS losses.<br><br>
  If not mentioned, restrictions only need to be completed "now" instead of in entire "eternity" or other certain periods.`,

  "Restrictions Reminder": `* Here's the reminder:<br>
  If not mentioned, restrictions only need to be completed "now" instead of in entire "eternity" or other certain periods.<br>
  This is the last reminder.`,

  "Instant Effect": `* Some Abyss Researches have Instant Effects on them. Be wisely, these effects only apply on current values once,
  and do not provide permanent multpliers.`,

  Core: `* Core Nodes requires you to complete various strict requirements at the same time. Once you accomplished them,
  you can simply research it and complete instantly; Either, you can complete it by researching for a long time.
  Cores will never be reseted.`,

  Depth: `* Depths are similar to "pages" Abyss Researches are at. You could find unlocked depths in the left-upper corner,
  and also quick switch depths here.`,

  Link: `* Link nodes can serve as a "portal", connecting to another node, and do researches in the other side.
  If it connects to a new depth, it will be permanently shown in the left upper corner, and allows you to quick switch by clicking.`,
};

export const NODE_TYPE = {
  SINGLE: "single",
  LIMITED: "limited",
  UNLIMITED: "unlimited",
  CORE: "core",
  LINK: "link",
};

export const SCALING_TYPE = {
  LINEAR: "linear",
};