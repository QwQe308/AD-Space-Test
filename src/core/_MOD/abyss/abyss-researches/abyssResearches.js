export const researchCategories = [
  { id: "1", name: '1' },
  { id: "2", name: '2' },
];

export const abyssResearches = {
  1: [// layer 1
    { 
      id: 1,
      name: '神经网络优化',
      type: 'unlimited',
      category: '1',
      x: 5400, y: 5200,
      progress: 0,
      currentLevel: 0,
      maxLevel: 0,
      color: '#3498db',
      isResearching: false,
      requirements: () => true, // 无条件
      unlocked: () => true,     // 默认解锁
      effect: '提升神经网络训练速度20%',
      nextIds: [2],
      // 其他属性...
    },
    {
      id: 2,
      name: '计算机视觉',
      type: 'limited',
      category: '1',
      x: 5200, y: 5350,
      progress: 0,
      currentLevel: 0,
      maxLevel: 5,
      color: '#3498db',
      isResearching: false,
      requirements: () => abyssResearches[1][0].progress === 1, // 需要神经网络优化完成]
      unlocked: () => true,
      effect: '提升图像识别准确率15%',
      nextIds: []
    }
  ],
  2:[],
};