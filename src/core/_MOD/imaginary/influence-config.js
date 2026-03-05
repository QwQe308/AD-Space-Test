export const influence = {
  abyss: {
    id: "abyss",
    name: "Abyss",
    info() {
      if(AbyssResearches.C0.completed) return `Disables Achievements, part of Time Studies,]\d{e&5|§↬ↈ∞∰⊕ and$#∱?τ^%ɛ(@`
      return `Disables Achievements, part of Time Studies, Base Research Speed /10 & ^0.9 and$#^%*(@`;
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
