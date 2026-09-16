import { memoizeBreakdown } from "@/core/secret-formula/multiplier-tab/cache";

import { createEntryInfo } from "./breakdown-entry-info";

export class BreakdownEntryInfoGroup {
  constructor(keys) {
    this.entries = keys.map(key => createEntryInfo(key));
    this.checkVisibleEntries = memoizeBreakdown(() => {
      let count = 0;
      for (const entry of this.entries) {
        if (!entry.isVisible) continue;
        if (entry.key.startsWith("general") || ++count > 1) return true;
      }
      return false;
    });
  }

  // We show children entries under two cases; the first is when there is more than one child entry and
  // therefore showing a list would be useful. The other is when the entry itself is a "general" entry, which
  // will always be titled something vague like "Achievements" or "Time Studies". In this case, we also still show
  // it when there is exactly one child, so that the player can see exactly which ach/TS/etc is giving the effect.
  get hasVisibleEntries() {
    return this.checkVisibleEntries();
  }
}

const cache = new Map();

/**
 * @returns {BreakdownEntryInfoGroup[]}
 */
export function getResourceEntryInfoGroups(key) {
  const cached = cache.get(key);
  if (cached !== undefined) {
    return cached;
  }
  const treeGroups = GameDatabase.multiplierTabTree[key];
  const groups = treeGroups === undefined
    ? []
    : treeGroups.map(keys => new BreakdownEntryInfoGroup(keys));
  cache.set(key, groups);
  return groups;
}
