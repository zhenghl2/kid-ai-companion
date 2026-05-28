// mastery-engine.js — 掌握度 + 遗忘分数

const masteryStore = {}  // 内存存储（生产环境可从 mastery.db 加载）

function get(knowledgeId) {
  if (!masteryStore[knowledgeId]) {
    masteryStore[knowledgeId] = {
      accuracy: 0, avgResponseMs: 0, lastSeen: null,
      totalAttempts: 0, streak: 0, forgettingScore: 0,
      masteryScore: 0, status: 'new',
    }
  }
  return masteryStore[knowledgeId]
}

function update(knowledgeId, correct, durationMs) {
  const m = get(knowledgeId)
  m.totalAttempts++
  m.lastSeen = new Date().toISOString()

  // 正确率（最近 10 次加权）
  const weight = Math.min(1, 10 / m.totalAttempts)
  m.accuracy = m.accuracy * (1 - weight) + (correct ? 1 : 0) * weight

  // 反应时间
  if (durationMs) {
    m.avgResponseMs = m.avgResponseMs === 0
      ? durationMs
      : m.avgResponseMs * 0.7 + durationMs * 0.3
  }

  // 连续正确
  m.streak = correct ? m.streak + 1 : 0

  // 遗忘分数
  m.forgettingScore = calculateForgettingScore(m.lastSeen, m.accuracy)

  // 综合掌握度
  const accuracyScore = m.accuracy * 60
  const speedScore = Math.max(0, 20 - (m.avgResponseMs || 3000) / 500)
  const retentionScore = (1 - m.forgettingScore) * 20
  m.masteryScore = Math.min(100, Math.max(0, accuracyScore + speedScore + retentionScore))

  // 状态
  if (m.masteryScore >= 85) m.status = 'mastered'
  else if (m.masteryScore >= 60) m.status = 'learning'
  else if (m.masteryScore >= 30) m.status = 'weak'
  else m.status = 'new'

  return m
}

function calculateForgettingScore(lastSeen, accuracy) {
  if (!lastSeen) return 0
  const daysSince = (Date.now() - new Date(lastSeen)) / 86400000
  const retention = accuracy * Math.pow(0.7, daysSince)
  return Math.min(1, Math.max(0, 1 - retention))
}

// 获取需复习的知识点（forgetting > 0.4）
function getWilted() {
  return Object.entries(masteryStore)
    .filter(([, m]) => m.forgettingScore > 0.4)
    .sort(([, a], [, b]) => b.forgettingScore - a.forgettingScore)
    .map(([id]) => id)
}

module.exports = { get, update, getWilted }
