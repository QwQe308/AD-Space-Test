import { globalAbyssResearchSpeed } from "../../_MOD/abyss/abyss-researches/abyssResearchSpawner";

import { abyssResearch } from "./mod-research";
import { MultiplierTabIcons } from "./icons";

export const ARS = {
  total: {
    name: "Global Abyss Research Speed (before Research Restrictions)",
    multValue: () => globalAbyssResearchSpeed(),
    isActive: () => PlayerProgress.imaginaryUnlocked(),
    overlay: ["∏"],
  },
  base: {
    name: "Maximum Effective Space this Reality (Square Root / 10)",
    multValue: () => player.records.thisReality.maxEffectiveSpace.pow(0.5).div(10),
    isActive: true,
    icon: MultiplierTabIcons.SPACE,
  },
  A5: abyssResearch("A5", "Research Speed from Tickspeed Upgrades"),
};
