export const abyssEternityChallenges = [
  {
    id: 5,
    description: () => `Antimatter Dimensions's and Tickspeed Upgrades's continuum works as if you have only 10 AM.`,
    goal: DC.E600,
    goalIncrease: DC.E200,
    reward: {
      description: "Free Tickspeed threshold is decreased.",
      effect: completions => completions * -0.01,
      formatEffect: value => `-${format(value, 2, 2)} (${format(1.25, 2, 2)}x → ${format(1.25 - value, 2, 2)}x)`
    }
  },
]