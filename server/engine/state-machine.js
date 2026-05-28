// state-machine.js — 挫败检测 + 恢复模式

function assess(context) {
  const frustration = context.frustration || 0
  const streak = context.streak || 0
  const mode = context.mode || 'learn'

  // 恢复模式：连对 2 次 → 回正常
  if (mode === 'recover' && streak >= 2) {
    return { action: 'LESSON', mode: 'learn', frustration: 0, streak: 0 }
  }

  // 恢复模式中再失败 → 故事模式
  if (mode === 'recover' && frustration >= 1) {
    return { action: 'STORY_MODE', mode: 'story', message: '今天学得好认真！奖励听个故事吧～' }
  }

  // 正常模式连错 3 次 → 恢复
  if (mode === 'learn' && frustration >= 3) {
    return { action: 'RECOVERY', mode: 'recover', frustration: 0, streak: 0,
      message: '这个有点难～我们先救小恐龙吧！' }
  }

  return { action: 'CONTINUE', mode, frustration, streak }
}

// 答题后更新状态
function afterAnswer(state, correct) {
  const next = { ...state }
  if (correct) {
    next.streak = (next.streak || 0) + 1
    next.frustration = Math.max(0, (next.frustration || 0) - 1)
  } else {
    next.streak = 0
    // 恢复模式中不增加 frustration
    if (next.mode !== 'recover') {
      next.frustration = (next.frustration || 0) + 1
    }
  }
  return next
}

module.exports = { assess, afterAnswer }
