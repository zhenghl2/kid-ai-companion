// feedback-templates.js — 本地鼓励语模板

const GENTLE_FEEDBACKS = [
  "差一点点～",
  "这个躲起来了！",
  "它藏在哪里呢？",
  "球球也找了半天！",
  "换个方向找找看～",
  "噢！它在这里！",
  "我们再看一遍～",
  "不急不急～",
  "快找到了！",
  "这次一定行！",
  "再试一次！",
  "它和你捉迷藏呢～",
]

const CORRECT_FEEDBACKS = {
  ocean: [
    "小鱼开心得冒泡泡！🐟💭",
    "海浪都为乐乐鼓掌啦～🌊",
    "珍珠送给你！🦪⭐",
    "小丑鱼说你好厉害！🤿",
  ],
  dinosaur: [
    "恐龙队长给你点赞！🦖👍",
    "三角龙开心得尾巴摇起来！🦕",
    "霸王龙都服了！🦖⭐",
    "恐龙蛋孵出来啦！🥚🐣",
  ],
  car: [
    "小汽车冲过终点线！🚗💨",
    "轮胎都冒火花啦～🔥🏎️",
    "第一名！🏆🚗",
  ],
  forest: [
    "小鸟为你唱起歌！🐦🎵",
    "松鼠送你一颗松果～🐿️",
    "森林里的动物都鼓掌啦！👏🌳",
  ],
  home: [
    "妈妈给你点了个大大的赞！👩👍",
    "全家都为你骄傲！🏠❤️",
    "爸爸说你好棒！👨⭐",
  ],
  default: [
    "对啦！球球开心得跳起来！⭐",
    "太厉害了！🐼💪",
    "又答对了！🎉",
  ],
}

function getGentleNudge() {
  return GENTLE_FEEDBACKS[Math.floor(Math.random() * GENTLE_FEEDBACKS.length)]
}

function getCorrectFeedback(theme) {
  const pool = CORRECT_FEEDBACKS[theme] || CORRECT_FEEDBACKS.default
  return pool[Math.floor(Math.random() * pool.length)]
}

module.exports = { getGentleNudge, getCorrectFeedback }
