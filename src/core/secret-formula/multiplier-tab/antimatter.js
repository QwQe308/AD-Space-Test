import { futureISUEntry, futureISUMultiplier, timeStudyISUEntry, timeStudyISUMultiplier } from "./future-empower";
import { abyssResearch } from "./mod-research";
import { MultiplierTabIcons } from "./icons";
import { spaceDivisorBreakdown } from "./space-divisor";

// See index.js for documentation
export const AM = {
  ...spaceDivisorBreakdown,
  total: {
    name: "Antimatter Production",
    displayOverride: () => `${format(Currency.antimatter.productionPerSecond, 2, 2)}/sec`,
    multValue: () => new Decimal(Currency.antimatter.productionPerSecond).clampMin(1),
    isActive: true,
    overlay: ["<i class='fas fa-atom' />"],
  },
  effarigAM: {
    name: "Glyph Effect - Effarig Antimatter Production",
    powValue: () => {
      const ad1 = AntimatterDimension(1);
      const baseProd = ad1.totalAmount.times(ad1.multiplier).times(Tickspeed.perSecond);
      return Math.pow(baseProd.log10(), getAdjustedGlyphEffect("effarigantimatter").sub(1));
    },
    isActive: () => getAdjustedGlyphEffect("effarigantimatter").gt(1) && AntimatterDimension(1).isProducing,
    icon: MultiplierTabIcons.SPECIFIC_GLYPH("effarig"),
  },
  space: {
    name: "Space Nerf to AM",
    displayOverride: () =>
      `^${format(getSpaceNerf().recip(), 2, 2)}, ${format(
        Currency.antimatter.productionPerSecond.div(getAMMultiplier()).pow(getSpaceNerf()),
        2,
        2
      )}/sec -> ${format(Currency.antimatter.productionPerSecond.div(getAMMultiplier()), 2, 2)}/sec`,
    powValue: () => getSpaceNerf().recip(),
    // Normalize this branch against base space; the divisor is a negative multiplier contribution.
    // Using space after division would erase the chart when the two values cancel to one.
    fakeValue: () => player.space,
    isActive: () => true,
    icon: MultiplierTabIcons.SPACE,
  },
  // Following are Direct AM Multpliers
  AMMult: {
    name: "Direct Antimatter Multiplier",
    displayOverride: () => `x${format(getAMMultiplier(), 2, 2)}`,
    multValue: () => getAMMultiplier(),
    isActive: true,
    ignoresNerfPowers: true,
    icon: MultiplierTabIcons.ANTIMATTER,
  },
  SR11: {
    name: "Space Research r11 - Antiparticle Analyzation",
    multValue: () => SpaceResearchRifts.r11.effectValue,
    isActive: () => SpaceResearchRifts.r11.canBeApplied,
    icon: MultiplierTabIcons.SPACE_RESEARCH(0),
  },
  lightRed: {
    name: "Mirror - Red Light",
    multValue: () => light.red.effectValue(),
    isActive: () => player.light.redPercent !== 0,
    icon: MultiplierTabIcons.LIGHT("red"),
  },
  A1: abyssResearch("A1", "Antimatter"),
  infinityUpgrade: {
    name: "Infinity Upgrade - Antimatter Multiplier (IU32)",
    multValue: () => InfinityUpgrade.dim45mult.effectOrDefault(1),
    isActive: () => InfinityUpgrade.dim45mult.canBeApplied,
    icon: MultiplierTabIcons.UPGRADE("infinity"),
  },
  infinityUpgradeBase: {
    name: "IU32 Base (ISU Power 1)",
    multValue: () => Decimal.div(AM.infinityUpgrade.multValue(), AM.futureISU.multValue())
      .div(AM.timeStudyISU.multValue()),
    isActive: () => InfinityUpgrade.dim45mult.canBeApplied,
    icon: MultiplierTabIcons.UPGRADE("infinity"),
  },
  futureISU: futureISUEntry(() => futureISUMultiplier(InfinityUpgrade.dim45mult.effectOrDefault(1))),
  timeStudyISU: timeStudyISUEntry(() => timeStudyISUMultiplier(InfinityUpgrade.dim45mult.effectOrDefault(1))),
  timeStudy71: {
    name: "Time Study 71 - Direct Antimatter",
    multValue: () => TimeStudy(71).effectOrDefault(1),
    isActive: () => TimeStudy(71).canBeApplied,
    icon: MultiplierTabIcons.TIME_STUDY,
  },
  timeStudy101: {
    name: "Time Study 101 - Direct Antimatter",
    multValue: () => TimeStudy(101).effectOrDefault(1),
    isActive: () => TimeStudy(101).canBeApplied,
    icon: MultiplierTabIcons.TIME_STUDY,
  },
};
