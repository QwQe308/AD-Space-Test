export const influence = {
  abyss: {
    id: "abyss",
    name: "Abyss",
    info: `Disables Achievements, part of the Time Studies, nullifies part of the Eternity currencies and$#^%*(^`,
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
