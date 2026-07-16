import { DC } from "../../constants";

import { MultiplierTabIcons } from "./icons";

// See index.js for documentation
export const RS = {
  total: {
    name: "Research Speed",
    multValue: () => globalResearchSpeed(),
    isActive: () => true,
    overlay: ["Σ"],
  },
  base: {
    name: "Base Research Speed",
    multValue: () => getBaseResearchSpeed(),
    isActive: () => true,
    icon: MultiplierTabIcons.SPACE_RESEARCH(), // This spawns only a sigma symbol
  },
  // --these extends the base one
  space: {
    name: "Space",
    multValue: () => DC.E1.pow(getEffectiveSpace().add(1).log10().add(1).pow(2.5).sub(1)),
    isActive: () => true,
    icon: MultiplierTabIcons.SPACE,
  },
  dimBoost: {
    name: "Dimension Boosts",
    multValue: () => DC.D2.pow(DimBoost.totalBoosts.pow(0.75)),
    isActive: () => true,
    icon: MultiplierTabIcons.DIMBOOST,
  },
  Abyss: {
    name: "Imaginary Influence - Abyss",
    multValue: () => new Decimal(0.1),
    powValue: () => 0.9,
    isActive: () => PlayerProgress.imaginaryUnlocked(),
    icon: MultiplierTabIcons.IMAGINARY_INFLUENCE,
  },
  // --ends
  achievementMult: {
    name: "Achievement Multiplier",
    multValue: () => Achievements.power,
    isActive: () => !PlayerProgress.imaginaryUnlocked(),
    icon: MultiplierTabIcons.ACHIEVEMENT,
  },
  SR21: {
    name: "Space Research - Dimensional Discovery",
    multValue: () => SpaceResearchRifts.r21.effectValue[1],
    isActive: () => SpaceResearchRifts.r21.canBeApplied,
    icon: MultiplierTabIcons.SPACE_RESEARCH(1),
  },
  infinityUpgrade: {
    name: () => "Infinity Upgrade (IU11)",
    multValue: () => Effects.sum(InfinityUpgrade.totalTimeMult),
    isActive: () => PlayerProgress.infinityUnlocked(),
    icon: MultiplierTabIcons.UPGRADE("infinity"),
  },
  timeStudy: {
    name: "Time Studies",
    multValue: () => Effects.product(TimeStudy(91), TimeStudy(92), TimeStudy(102), TimeStudy(222)),
    isActive: () => PlayerProgress.eternityUnlocked(),
    icon: MultiplierTabIcons.TIME_STUDY,
  },
  AR: {
    name: "Abyss Researches (Static)",
    multValue: () => Effects.product(AbyssResearches.A3),
    isActive: () => AbyssResearches.A1.canBeApplied,
    icon: MultiplierTabIcons.ABYSS_RESEARCH,
  },

  SC51: {
    name: "Space Challenge 5",
    multValue: () => SpaceChallenge(5).effectValue.recip(),
    isActive: () => isSCRunningOnTier(5, 1),
    icon: MultiplierTabIcons.SPACE_CHALLENGE(5),
  },
};
