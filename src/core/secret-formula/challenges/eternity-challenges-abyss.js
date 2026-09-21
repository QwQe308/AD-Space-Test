import { DC } from "../../constants";

export const abyssEternityChallenges = [
  {
    id: 5,
    description: () => `Antimatter Dimensions' and Tickspeed Upgrades' continuum value cannot go above Free Tickspeed Upgrades gained from Time Dimensions.`,
    goal: DC.E1000,
    goalIncrease: DC.E500,
    reward: {
      description: "Free Tickspeed threshold is decreased.",
      effect: completions => completions * -0.01,
      formatEffect: value => `${formatAdd(value, 2, 2)}`
    }
  },
];
