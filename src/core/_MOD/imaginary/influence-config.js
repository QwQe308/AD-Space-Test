export const influence = {
  abyss: {
    id: "abyss",
    name: "Abyss",
    info() {
      if(AbyssResearches.C0.isBought) return `Disables Achievements, part of Time Studies, anddd$#∱?τ^%ɛ(@?`;
      return `Disables Achievements, part of Time Studies, nerfs Research Speeddd$#∱?τ^%ɛ(@?`;
    },
    influenceStat: 50,
    requirement() {
      return TimeStudy(111).isBought;
    },
    trigger() {
      abyssAnimation();
    },
    noImmediatePush: true,
    checkEvent: GAME_EVENT.ENTER_ABYSS,
  },
};
