import { DC } from "../../constants";

import { abyssResearch } from "./mod-research";

import { MultiplierTabIcons } from "./icons";

// See index.js for documentation
export const RS = {
  total: {
    name: "Global Space Research Speed (before Tier Bonuses)",
    multValue: () => globalResearchSpeed(),
    isActive: () => true,
    overlay: ["Σ"],
  },
  base: {
    name: "Base Research Speed",
    multValue: () => getBaseResearchSpeed(),
    isActive: () => true,
    // This spawns only a sigma symbol.
    icon: MultiplierTabIcons.SPACE_RESEARCH(),
  },
  // --these extends the base one
  space: {
    name: "Effective Space - Research Speed Formula",
    displayOverride: () => `${format(getEffectiveSpace(), 2, 2)} Effective Space`,
    fakeValue: () => getEffectiveSpace(),
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
    isActive: true,
    icon: MultiplierTabIcons.ACHIEVEMENT,
  },
  SR21: {
    name: "Space Research r21 - Dimensional Discovery",
    multValue: () => SpaceResearchRifts.r21.effectValue[1],
    isActive: () => SpaceResearchRifts.r21.canBeApplied,
    icon: MultiplierTabIcons.SPACE_RESEARCH(1),
  },
  infinityUpgrade: {
    name: () => "Infinity Upgrade (IU11)",
    multValue: () => InfinityUpgrade.totalTimeMult.effectOrDefault(1),
    isActive: () => InfinityUpgrade.totalTimeMult.canBeApplied,
    icon: MultiplierTabIcons.UPGRADE("infinity"),
  },
  timeStudy: {
    name: "Time Studies",
    multValue: () => Effects.product(TimeStudy(91), TimeStudy(92), TimeStudy(102), TimeStudy(222)),
    isActive: () => PlayerProgress.eternityUnlocked(),
    icon: MultiplierTabIcons.TIME_STUDY,
  },
  A3: abyssResearch("A3", "Research Speed"),
  spaceAmount: {
    name: "Space Amount",
    multValue: () => player.space,
    isActive: true,
    icon: MultiplierTabIcons.SPACE,
  },
  SR42: {
    name: "Space Research r42 - Effective Space",
    multValue: () => SpaceResearchRifts.r42.effectOrDefault(1),
    isActive: () => SpaceResearchRifts.r42.canBeApplied,
    icon: MultiplierTabIcons.SPACE_RESEARCH(3),
  },
  lightCyan: {
    name: "Mirror - Cyan Light (Effective Space)",
    multValue: () => light.cyan.effectValue(),
    isActive: () => light.cyan.effectValue().neq(1),
    icon: MultiplierTabIcons.LIGHT("cyan"),
  },

  SC51: {
    name: "Space Challenge 5",
    multValue: () => SpaceChallenge(5).effectValue.recip(),
    isActive: () => isSCRunningOnTier(5, 1),
    icon: MultiplierTabIcons.SPACE_CHALLENGE(5),
  },
};
