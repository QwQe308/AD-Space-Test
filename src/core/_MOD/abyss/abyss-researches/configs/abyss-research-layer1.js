let baseConfig = {
  A1:{
    position:[0,0],
    type:"unlimited",
    scaling:{
      type: "linear",
      cost: new Decimal(1),
      costIncrease: new Decimal(2)
    },
    description(level){
      `Antimatter x2 per level. (x${format(this.effect(level))} -> x${format(this.effect(level.add(1)))})`
    },
    effect(level){
      return level.pow_base(2)
    },
    next:["A2"]
  },
}