export const researchCategories = [
  { id: "1", name: '1' },
  { id: "2", name: '2' },
];

export const abyssResearches = {
  1: [// layer 1
    { 
      id: 1,
      name: 'A1',
      type: 'unlimited',
      x: 5400, y: 5200,
      progress: 0.5,
      currentLevel: 0,
      maxLevel: 0,
      color: '#3498db',
      isResearching: false,
      requirements: () => true, // 无条件
      unlocked: () => true,     // 默认解锁
      effect: 'Antimatter Multplier * 2 per level',
      nextIds: [2],
      // 其他属性...
    },
    {
      id: 2,
      name: 'A2',
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