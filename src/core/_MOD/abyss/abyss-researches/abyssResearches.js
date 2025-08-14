import { DC } from "../../../constants";
import { AbyssResearchesDepth_i } from "./configs/abyss-research-depth-i";

export const abyssDepths = ["i", "1", "2"];

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

export const abyssResearches = { ...AbyssResearchesDepth_i };

export function globalAbyssResearchSpeed(){
  let abyssResearchspeed = player.records.thisReality.maxSpace.pow(0.5).div(40)
  return abyssResearchspeed
}

export const extraAbyssResearchTooltips = {
  ARS: `*Note that Abyss Research uses an<br>independent value called<br>Abyss Research Speed (ARS),<br>differed from Research Speed (RS).`,
}