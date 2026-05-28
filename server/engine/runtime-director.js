// runtime-director.js — 中央调度器（唯一决策者）

const PRIORITY = {
  FORCE_END:    100,
  RECOVERY:      90,
  FATIGUE:       70,
  REVIEW_FIRST:  50,
  LESSON:        30,
  REWARD:        10,
}

function decide(context) {
  const { energy, frustration, mode, memoryForest } = context

  // 1. 强制结束
  if (energy < 10) {
    return {
      action: 'END_SESSION',
      priority: PRIORITY.FORCE_END,
      message: '今天玩得好开心！明天见～',
    }
  }

  // 2. 挫败恢复
  if (frustration >= 3) {
    return {
      action: 'RECOVERY',
      priority: PRIORITY.RECOVERY,
      message: '这个有点难～我们先救小恐龙吧！',
    }
  }

  // 3. 疲劳保护
  if (energy < 30) {
    return {
      action: 'STORY_MODE',
      priority: PRIORITY.FATIGUE,
      message: '今天学得好认真！奖励听个故事吧～',
    }
  }

  // 4. 记忆复习优先
  const wiltedCount = memoryForest?.length || 0
  if (wiltedCount > 0) {
    return {
      action: 'REVIEW',
      priority: PRIORITY.REVIEW_FIRST,
      message: `有${wiltedCount}片叶子需要浇水啦～`,
      wiltedCount,
    }
  }

  // 5. 正常课程
  return {
    action: 'LESSON',
    priority: PRIORITY.LESSON,
  }
}

module.exports = { decide, PRIORITY }
