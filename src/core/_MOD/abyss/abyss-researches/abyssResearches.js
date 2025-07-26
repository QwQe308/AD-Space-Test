export const researchCategories = [
  { id: "1", name: '1' },
  { id: "2", name: '2' },
];

export function getAbyssResearchProgressPercentage(layer, node){
  return quickSpawnScalingBasingOnParams(layer, node).percentageToNext
}

export function quickSpawnScalingBasingOnParams(layer, node){
  if(node.scaling.type === "linear"){
    return linearCostScaling(player.abyssResearches[layer][node.id], node.scaling.cost, node.scaling.costMult)
  }
}

export function quickSpawnResearches(layer, researches){
  for(let id in researches){
    researches[i].layer = layer
    researches[i].id = id
    
  }
}

export const abyssResearches = {
  1: [// layer 1
    { 
      layer: 1,
      id: 0,
      name: 'A0',
      type: 'unlimited',
      x: 5400, y: 5200,
      scaling:{
        type:"linear",
        cost: new Decimal(1),
        costMult: new Decimal(2),
      },
      currentLevel: 0,
      maxLevel: 0,
      color: '#3498db',
      isResearching: false,
      requirements: () => true, // 无条件
      unlocked: () => true,     // 默认解锁
      effect: 'Antimatter Multplier * 2 per level',
      nextIds: [1],
      // 其他属性...
    },
    {
      layer: 1,
      id: 1,
      name: 'A1',
      type: 'limited',
      x: 5200, y: 5350,
      progress: 0.5,
      currentLevel: 0,
      maxLevel: 5,
      color: '#3498db',
      isResearching: false,
      requirements: () => abyssResearches[1][0].progress === 1, // 需要神经网络优化完成]
      unlocked: () => true,
      effect: 'test',
      nextIds: []
    }
  ],
  2:[],
};