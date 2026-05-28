// energy-engine.js — 认知疲劳模型

const INITIAL = 100

const DECAY = {
  new_knowledge: -15,
  review: -5,
  consecutive_wrong: -12,
  animation_heavy: -8,
}

const THRESHOLDS = {
  normal: 70,
  slow: 50,
  tired: 30,
  end: 10,
}

function assess(context) {
  const energy = context.energy || INITIAL

  return {
    level: energy,
    recommendation:
      energy < THRESHOLDS.end ? 'end' :
      energy < THRESHOLDS.tired ? 'story' :
      energy < THRESHOLDS.slow ? 'slow' :
      energy < THRESHOLDS.normal ? 'review_only' : 'normal',
  }
}

function decay(current, eventType) {
  const cost = DECAY[eventType] || -5
  return Math.max(0, current + cost)
}

module.exports = { INITIAL, DECAY, THRESHOLDS, assess, decay }
