import { DC } from "../../../constants";
import { AbyssResearchesDepth1 } from "./configs/abyss-research-depth1";

export const abyssDepths = ["1", "2"];

export function quickSpawnResearches(config, layer) {
  for (let i in config) {
    config[i].id = i;
    config[i].depth = layer;
    for (let nextID of config[i].next) {
      let nextNode = config[nextID];
      if (nextNode.previous === undefined) nextNode.previous = [];
      nextNode.previous.push(i);
    }
  }
}

export const abyssResearches = { ...AbyssResearchesDepth1 };

export function globalAbyssResearchSpeed(){
  let abyssResearchspeed = player.records.thisReality.maxSpace.pow(0.5).div(25)
  return abyssResearchspeed
}