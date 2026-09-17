import { DC } from "../../constants";

import { memoizeBreakdown } from "./cache";
import { MultiplierTabHelper } from "./helper-functions";
import { MultiplierTabIcons } from "./icons";

const purchaseCounts = memoizeBreakdown(() => {
  const counts = AntimatterDimensions.all.map(ad => (Laitela.continuumActive
    ? ad.continuumValue
    : ad.bought.div(10).floor()));
  const total = MultiplierTabHelper.producingADs().reduce((sum, ad) => sum.add(counts[ad.tier - 1]), DC.D0);
  return { counts, total };
});

function purchases(dim) {
  const { counts, total } = purchaseCounts();
  return dim ? counts[dim - 1] : total;
}

const baseBuyTen = memoizeBreakdown(() => {
  if (NormalChallenge(7).isRunning) return DC.D2.min(DimBoost.totalBoosts.div(5).add(1));
  return DC.D2.plusEffectsOf(Achievement(141).effects.buyTenMult, EternityChallenge(3).reward)
    .timesEffectsOf(InfinityUpgrade.buy10Mult, TimeStudy(83), Achievement(58))
    .times(getAdjustedGlyphEffect("powerbuy10"));
});

const standardBuyTenActive = () => !NormalChallenge(7).isRunning && !EternityChallenge(11).isRunning;

// These are children of Purchases, not extra multipliers on AD_total. All buy-ten powers also apply
// to A10 and r31's multiplicative part, exactly as in AntimatterDimensions.buyTenMultiplier.
export const adPurchaseBreakdown = {
  basePurchase: {
    name: "Base Buy-10 Multiplier and Purchases",
    multValue: dim => baseBuyTen().pow(purchases(dim)),
    isActive: () => !EternityChallenge(11).isRunning,
    icon: MultiplierTabIcons.PURCHASE("AD"),
  },
  buy10A10: {
    name: "Abyss Research A10 - Buy-10 Multiplier",
    multValue: dim => Decimal.pow(AbyssResearches.A10.effectOrDefault(1), purchases(dim)),
    isActive: () => standardBuyTenActive() && AbyssResearches.A10.canBeApplied,
    icon: MultiplierTabIcons.ABYSS_RESEARCH,
  },
  buy10SR31: {
    name: "Space Research r31 - Efficiency Expediency (Buy-10)",
    multValue: dim => SpaceResearchRifts.r31.effectValue[0].pow(purchases(dim)),
    powValue: () => SpaceResearchRifts.r31.effectValue[1],
    isActive: () => standardBuyTenActive() && SpaceResearchRifts.r31.canBeApplied,
    icon: MultiplierTabIcons.SPACE_RESEARCH(2),
  },
  buy10Glyph: {
    name: "Effarig Glyph - Buy-10 Power",
    powValue: () => getAdjustedGlyphEffect("effarigforgotten"),
    isActive: standardBuyTenActive,
    icon: MultiplierTabIcons.SPECIFIC_GLYPH("effarig"),
  },
  buy10Charged: {
    name: "Charged Infinity Upgrade - Buy-10 Power",
    powValue: () => InfinityUpgrade.buy10Mult.chargedEffect.effectOrDefault(1),
    isActive: () => standardBuyTenActive() && InfinityUpgrade.buy10Mult.chargedEffect.canBeApplied,
    icon: MultiplierTabIcons.UPGRADE("infinity"),
  },
  buy10Imaginary: {
    name: "Imaginary Upgrade 14 - Buy-10 Power",
    powValue: () => ImaginaryUpgrade(14).effectOrDefault(1),
    isActive: () => standardBuyTenActive() && ImaginaryUpgrade(14).canBeApplied,
    icon: MultiplierTabIcons.UPGRADE("imaginary"),
  },
};
