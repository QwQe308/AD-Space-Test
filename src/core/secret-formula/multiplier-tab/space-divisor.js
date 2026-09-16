import { DC } from "../../constants";

import { abyssResearch } from "./mod-research";
import { MultiplierTabIcons } from "./icons";

export const spaceDivisorBreakdown = {
  spaceBase: {
    name: "Space Nerf before Space Divisor",
    powValue: () => getSpaceNerf(player.space).recip(),
    isActive: true,
    icon: MultiplierTabIcons.SPACE,
  },
  spaceDivisor: {
    name: "Space Divisor",
    displayOverride: () => `Space /${format(getSpaceDivisor(), 2, 2)} ➜ ${formatPow(
      getSpaceNerf(player.space).div(getSpaceNerf()), 2, 2)}`,
    powValue: () => getSpaceNerf(player.space).div(getSpaceNerf()),
    fakeValue: () => getSpaceDivisor(),
    isActive: true,
    icon: MultiplierTabIcons.SPACE,
  },
  SR22: {
    name: "Space Research r22 - Spacial Deformity (Space Divisor)",
    multValue: () => SpaceResearchRifts.r22.effectOrDefault(1),
    isActive: () => SpaceResearchRifts.r22.canBeApplied,
    icon: MultiplierTabIcons.SPACE_RESEARCH(1),
  },
  A9: abyssResearch("A9", "Space Divisor"),
  spaceDilation: {
    name: "Dilation Upgrade - Space Divisor from Dilated Time",
    multValue: () => DilationUpgrade.spaceDivisorDT.effectOrDefault(1),
    isActive: () => DilationUpgrade.spaceDivisorDT.canBeApplied,
    icon: MultiplierTabIcons.UPGRADE("dilation"),
  },
  lightWhite: {
    name: "Mirror - White Light (Space Divisor Penalty)",
    multValue: () => light.white.effectValue().recip(),
    isActive: () => light.white.effectValue().neq(1),
    icon: MultiplierTabIcons.LIGHT("white"),
  },
  spaceChallenge3: {
    name: "Space Challenge 3 Tier 2 - Space Divisor Penalty",
    multValue: () => {
      let penalty = DC.D1;
      for (const [tier, weight] of [0.1, 0.3, 0.6].entries()) {
        for (const id of SpaceResearchTierDetail[tier]) penalty = penalty.add(SpaceResearchRifts[id].level.mul(weight));
      }
      return penalty.recip();
    },
    isActive: () => isSCRunningOnTier(3, 2),
    icon: MultiplierTabIcons.SPACE_CHALLENGE(3),
  },
  spaceDivisorPercentage: {
    name: "Applied Space Divisor Percentage",
    powValue: () => player.spaceDivisiorActivePercentage,
    isActive: true,
    icon: MultiplierTabIcons.SPACE,
  },
};
