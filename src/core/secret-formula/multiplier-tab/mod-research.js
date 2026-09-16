import { MultiplierTabHelper } from "./helper-functions";
import { MultiplierTabIcons } from "./icons";

// Keep source IDs in the label even when a research is the only active source in its group.
export function abyssResearch(id, description, dimension) {
  return {
    name: `Abyss Research ${id} - ${description}`,
    multValue: dim => Decimal.pow(AbyssResearches[id].effectOrDefault(1),
      dimension && !dim ? MultiplierTabHelper.activeDimCount(dimension) : 1),
    isActive: () => AbyssResearches[id].canBeApplied,
    icon: MultiplierTabIcons.ABYSS_RESEARCH,
  };
}

export function abyssTickspeedUpgrades(id) {
  return {
    name: `Abyss Research ${id} - Extra Tickspeed Upgrades`,
    displayOverride: () => formatInt(AbyssResearches[id].effectOrDefault(0)),
    // The tickspeed-upgrade breakdown represents additive counts in log space.
    multValue: () => Decimal.pow10(AbyssResearches[id].effectOrDefault(0)),
    isActive: () => AbyssResearches[id].canBeApplied,
    icon: MultiplierTabIcons.ABYSS_RESEARCH,
  };
}
