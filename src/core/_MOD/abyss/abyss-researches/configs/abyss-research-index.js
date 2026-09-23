import { validateAbyssPortalTargets } from "../abyssResearchSpawner";

import { AbyssResearchesDepth0 } from "./abyss-research-depth-0";
import { AbyssResearchesDepth1 } from "./abyss-research-depth-1";

export const abyssResearches = {
  ...AbyssResearchesDepth0,
  ...AbyssResearchesDepth1,
};

// Targets can be on another depth, so validate after merging all depth configs.
validateAbyssPortalTargets(abyssResearches);
