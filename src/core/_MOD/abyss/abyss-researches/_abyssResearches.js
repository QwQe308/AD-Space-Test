export const abyssDepths = ["1", "2"]
let abyssResearchesConfig = {
  A1:{
    id: "A1",
    depth: "1",
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

export function quickSpawnResearches(layer){
for(i in baseConfig){
  baseConfig[i].id = i;
  baseConfig[i].depth = "1";
  for(nextID in baseConfig[i].next){
    let nextNode = baseConfig[nextID]
    if(!nextNode.previous) nextNode.previous = []
    nextNode.previous.push(i)
  }
}
}

export const abyssResearches = abyssResearchesConfig