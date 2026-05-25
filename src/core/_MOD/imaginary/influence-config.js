export const influence = {
  abyss: {
    id: "abyss",
    name: "Abyss",
    info() {
      return `Disables Achievements, part of Time Studies, anddd$#∱?τ^%ɛ(@?`
    },
    influenceStat: 50,
    requirement() {
      return TimeStudy(111).isBought;
    },
    tigger() {
      abyssAnimation();
    },
    noImmediatePush: true,
    checkEvent: GAME_EVENT.ENTER_ABYSS,
  },
};
