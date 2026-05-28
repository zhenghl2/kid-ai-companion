// lesson-engine.js — 课程编排

const knowledgeGraph = require('./knowledge-graph')
const knowledgeDeps = require('./knowledge-deps')
const masteryEngine = require('./mastery-engine')
const memoryForest = require('./memory-forest')

function plan(context) {
  const { subject, theme, masteredIds, recentIds, level } = context

  // 获取该学科在主题下有匹配的知识点
  let pool = knowledgeGraph.getBySubjectAndTheme(subject, theme)
  if (pool.length === 0) {
    pool = knowledgeGraph.getFallbackItems(subject, theme)
  }

  // 过滤：前置知识已掌握
  const mastered = new Set(masteredIds || [])
  pool = pool.filter(item => knowledgeDeps.hasPrereqsMet(item.id, mastered))

  // 过滤：不与最近学过的混淆
  const recents = recentIds || []
  const recentSet = new Set(recents.slice(-10))  // 最近 10 个不再出现
  pool = pool.filter(item => !recentSet.has(item.id))
  pool = pool.filter(item => !knowledgeDeps.getRecentlyConfused(recents, item.id))

  // 按状态分组
  const wilted = pool.filter(item => {
    const m = masteryEngine.get(item.id)
    return m.forgettingScore > 0.4
  })
  const practicing = pool.filter(item => {
    const m = masteryEngine.get(item.id)
    return m.masteryScore >= 40 && m.masteryScore < 85
  })
  const newItems = pool.filter(item => {
    const m = masteryEngine.get(item.id)
    return m.status === 'new'
  })
  const masteredItems = pool.filter(item => {
    const m = masteryEngine.get(item.id)
    return m.masteryScore >= 85
  })

  // 课程编排：复习 > 巩固 > 新课 > 奖励
  const plan = []
  if (wilted.length > 0) plan.push({ type: 'review', items: wilted.slice(0, 2) })
  if (practicing.length > 0) plan.push({ type: 'practice', items: practicing.slice(0, 2) })
  if (newItems.length > 0) plan.push({ type: 'learn', items: newItems.slice(0, 1) })
  if (plan.length < 2 && masteredItems.length > 0) plan.push({ type: 'reward', items: masteredItems.slice(0, 1) })

  return { plan, totalItems: plan.reduce((sum, p) => sum + p.items.length, 0) }
}

function getNextItem(plan, index) {
  let count = -1
  for (const round of plan) {
    for (const item of round.items) {
      count++
      if (count === index) return { item, type: round.type }
    }
  }
  return null
}

module.exports = { plan, getNextItem }
