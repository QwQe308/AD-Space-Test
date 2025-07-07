export const abyssResearchesLayer1 = {
  13:{
    description:() => `x2 AM Multiplier`,
    effect:(level) => Decimal.pow(2, level),
    diff: new Decimal(1),
    diffScaling: new Decimal(2),
    maxLevel: false,
  }
}