// theme-runtime.js — 主题运行时

const THEMES = {
  ocean: {
    name: '海洋探险',
    visual: { background:'ocean',color:'#2196F3',costume:'diver',treeStyle:'coral' },
    audio: { ambient:'ocean_wave',correct:'bubble_pop' },
    narrative: {
      intro: '今天我们去海底探险！帮助小丑鱼找到回家的路～',
      quest: '小丑鱼回家',
      milestones: ['找到3颗珍珠','穿过珊瑚森林'],
      finale: '小丑鱼安全到家！它送了一颗闪亮的珍珠！',
    },
  },
  dinosaur: {
    name: '恐龙世界',
    visual: { background:'jungle',color:'#4CAF50',costume:'explorer',treeStyle:'fern' },
    audio: { ambient:'jungle',correct:'roar' },
    narrative: {
      intro: '欢迎来到恐龙世界！三角龙需要你的帮助～',
      quest: '帮助三角龙找蛋',
      milestones: ['拯救2颗恐龙蛋','打败捣乱的翼龙'],
      finale: '恐龙蛋孵出来了！小三角龙叫了一声～',
    },
  },
  car: {
    name: '汽车总动员',
    visual: { background:'road',color:'#FF9800',costume:'goggles',treeStyle:'gear' },
    audio: { ambient:'engine',correct:'horn' },
    narrative: {
      intro: '小汽车要送货啦！今天要开哪条路线呢？',
      quest: '送货大冒险',
      milestones: ['装好3箱货物','开到目的地'],
      finale: '货物送到啦！收货人开心地笑了！',
    },
  },
  forest: {
    name: '森林奇遇',
    visual: { background:'forest',color:'#8BC34A',costume:'leaf_hat',treeStyle:'oak' },
    audio: { ambient:'birds',correct:'chime' },
    narrative: {
      intro: '森林里的小动物们今天开派对！一起去吧～',
      quest: '森林派对',
      milestones: ['邀请3只小动物','找到派对场地'],
      finale: '派对开始！大家一起跳舞！',
    },
  },
  home: {
    name: '我家的一天',
    visual: { background:'home',color:'#FF5722',costume:'apron',treeStyle:'apple' },
    audio: { ambient:'home',correct:'ding' },
    narrative: {
      intro: '今天在家里和爸爸妈妈一起玩！',
      quest: '家务小帮手',
      milestones: ['帮妈妈摆3个碗','帮爸爸数筷子'],
      finale: '一家人开开心心吃饭啦！',
    },
  },
}

const THEME_LIST = Object.keys(THEMES)
const FIXED_COUNT = 3
const ADAPTIVE_COUNT = 2

function selectTodayTheme(history) {
  // 简化版：固定轮换
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000)
  const fixed = THEME_LIST.slice((dayOfYear % (THEME_LIST.length - ADAPTIVE_COUNT)), 
                                  (dayOfYear % (THEME_LIST.length - ADAPTIVE_COUNT)) + FIXED_COUNT)
  return fixed[0] // 今天只用 1 个主题
}

function getTheme(code) {
  return THEMES[code] || THEMES.ocean
}

module.exports = { THEMES, THEME_LIST, selectTodayTheme, getTheme }
