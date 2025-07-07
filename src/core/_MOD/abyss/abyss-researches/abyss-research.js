export const researchCategories = [
  { id: 1, name: '1' },
  { id: 2, name: '2' },
];

export const researchNodes = {
  1: [// layer 1
    { 
      id: 1, 
      name: '神经网络优化', 
      type: 'unlimited', //unlimited or limited or single
      x: 400, y: 200, 
      progress: 0.8, 
      currentLevel: 3,
      maxLevel: 0,
      effect: '提升神经网络训练速度20%',
      cost: '500科技点',
      time: 30,
      unlocks: '深度学习算法',
      nextIds: [2, 3]
    },
    { 
      id: 2, 
      name: '神经网络优化', 
      type: 'unlimited', //unlimited or limited or single
      x: 600, y: 300, 
      progress: 0.8, 
      currentLevel: 3,
      maxLevel: 0,
      effect: '提升神经网络训练速度20%',
      cost: '500科技点',
      time: 30,
      unlocks: '深度学习算法',
      nextIds: []
    },
    { 
      id: 3, 
      name: '神经网络优化', 
      type: 'unlimited', //unlimited or limited or single
      x: 200, y: 300, 
      progress: 0.8, 
      currentLevel: 3,
      maxLevel: 0,
      effect: '提升神经网络训练速度20%',
      cost: '500科技点',
      time: 30,
      unlocks: '深度学习算法',
      nextIds: []
    },
  ],
  2:[],
};