import { DC } from "../../constants";

import { memoizeBreakdown } from "./cache";
import { MultiplierTabHelper } from "./helper-functions";
import { MultiplierTabIcons } from "./icons";

const boostFactors = memoizeBreakdown(() => {
  const power = Effects.product(InfinityUpgrade.dimboostMult.chargedEffect, TimeStudy(211))
    .mul(GlyphAlteration.isAdded("effarig") ? getSecondaryGlyphEffect("effarigforgotten") : 1);
  const base = NormalChallenge(8).isRunning ? DC.D1 : new Decimal(Effects.max(
    2, InfinityUpgrade.dimboostMult, InfinityChallenge(7).reward, InfinityChallenge(7), TimeStudy(81)
  )).timesEffectsOf(TimeStudy(83), TimeStudy(231), Achievement(117), Achievement(142),
    GlyphEffect.dimBoostPower, PelleRifts.recursion.milestones[0]).pow(power);
  const green = NormalChallenge(8).isRunning ? DC.D1 : light.green.effectValue().pow(power);
  const imaginaryFactor = Ra.isRunning ? DC.D0 : ImaginaryUpgrade(23).effectOrDefault(DC.D1);
  const baseBoosts = ImaginaryUpgrade(12).effectOrDefault(DC.D0).mul(imaginaryFactor);
  const r21Boosts = SpaceResearchRifts.r21.effectValue[0].mul(imaginaryFactor);
  const a8Boosts = Decimal.mul(AbyssResearches.A8.effectOrDefault(0), imaginaryFactor);
  return { base, green, baseBoosts, r21Boosts, a8Boosts,
    imaginaryBase: base.mul(ImaginaryUpgrade(24).effectOrDefault(1)) };
});

function normalBoosts(tier) {
  const effectiveTier = isSCRunningOnTier(4, 1) ? 8 : tier;
  const purchased = isSCRunningOnTier(4, 2) ? DimBoost.purchasedBoosts.min(8) : DimBoost.purchasedBoosts;
  return purchased.add(1).sub(effectiveTier);
}

function acrossDimensions(dim, calculate) {
  if (dim) return calculate(dim);
  return MultiplierTabHelper.producingADs().reduce((mult, ad) => mult.mul(calculate(ad.tier)), DC.D1);
}

// Research grants imaginary boosts, including their Imaginary Upgrade 23 scaling. Green light
// improves both purchased and imaginary boosts, including the powers on DimBoost.power.
export const adBoostBreakdown = {
  boostBase: {
    name: "Base Dimension Boosts multiplier (Except Green Light)",
    multValue: dim => {
      const { base, imaginaryBase, baseBoosts } = boostFactors();
      return acrossDimensions(dim, tier => base.pow(normalBoosts(tier)).clampMin(1)
        .mul(imaginaryBase.pow(baseBoosts)));
    },
    isActive: true,
    icon: MultiplierTabIcons.DIMBOOST,
  },
  boostSR21: {
    name: "Space Research r21 - Extra Dimension Boosts",
    multValue: dim => {
      const { imaginaryBase, r21Boosts } = boostFactors();
      return acrossDimensions(dim, () => imaginaryBase.pow(r21Boosts));
    },
    isActive: () => SpaceResearchRifts.r21.canBeApplied && !Ra.isRunning,
    icon: MultiplierTabIcons.SPACE_RESEARCH(1),
  },
  boostA8: {
    name: "Abyss Research A8 - Extra Dimension Boosts",
    multValue: dim => {
      const { imaginaryBase, a8Boosts } = boostFactors();
      return acrossDimensions(dim, () => imaginaryBase.pow(a8Boosts));
    },
    isActive: () => AbyssResearches.A8.canBeApplied && !Ra.isRunning,
    icon: MultiplierTabIcons.ABYSS_RESEARCH,
  },
  boostLightGreen: {
    name: "Mirror - Green Light (Dimension Boost Power)",
    multValue: dim => {
      const { base, imaginaryBase, green, baseBoosts, r21Boosts, a8Boosts } = boostFactors();
      const imaginaryBoosts = baseBoosts.add(r21Boosts).add(a8Boosts);
      // In Mirror, green can lower boost power below one. Apply the game's two clamps before
      // measuring its contribution; clamping the number of boosts instead gives a different result.
      return acrossDimensions(dim, tier => base.mul(green).pow(normalBoosts(tier)).clampMin(1)
        .div(base.pow(normalBoosts(tier)).clampMin(1))
        .mul(imaginaryBase.mul(green).pow(imaginaryBoosts).clampMin(1)
          .div(imaginaryBase.pow(imaginaryBoosts))));
    },
    isActive: () => !NormalChallenge(8).isRunning && light.green.effectValue().neq(1),
    icon: MultiplierTabIcons.LIGHT("green"),
  },
};
