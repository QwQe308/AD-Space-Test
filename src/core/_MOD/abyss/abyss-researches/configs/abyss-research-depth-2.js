import { NODE_TYPE, quickSpawnResearches } from "../abyssResearchSpawner";
import { DC } from "../../../../constants";

const baseConfig = {
  // Past branch
  "Float-1-Past": {
    type: NODE_TYPE.FLOAT,
    position: [-3, 4],
    description(){
      return `Float to Depth 1 (Past).`
    },
    target: "Sink-2-Past",
  },

  // Future branch
  "Float-1-Future": {
    type: NODE_TYPE.FLOAT,
    position: [3, 4],
    description(){
      return `Float to Depth 1 (Future).`
    },
    target: "Sink-2-Future",
  },
};

quickSpawnResearches(baseConfig, "2");

export const AbyssResearchesDepth2 = baseConfig;
