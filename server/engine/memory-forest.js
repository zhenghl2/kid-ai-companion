// memory-forest.js — 记忆森林

const SEASONS = ['spring', 'summer', 'autumn', 'winter']

function getState() {
  // 简化版：返回三科树状态
  // 生产环境从 mastery-engine 和 events 计算
  return {
    trees: {
      chinese: { leaves: 12, flowers: 5, fruits: 8, wilted: 2, branch: '汉字森林' },
      math: { leaves: 10, flowers: 4, fruits: 6, wilted: 1, branch: '数学城堡' },
      english: { leaves: 8, flowers: 3, fruits: 4, wilted: 3, branch: '英语岛屿' },
    },
    season: getSeason(),
    weather: 'sunny',
  }
}

function getSeason() {
  // 基于总体掌握度计算季节
  // 简化：默认春天
  return 'spring'
}

function getWilted() {
  // 返回所有需要浇水的知识点 ID
  const mastery = require('./mastery-engine')
  return mastery.getWilted()
}

module.exports = { getState, getSeason, getWilted }
