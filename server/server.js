// growth-system/server.js — AI 儿童陪伴系统后端入口
require('dotenv').config()

const express = require('express')
const Database = require('better-sqlite3')
const path = require('path')

const app = express()
app.use(express.json({ limit: '1mb' }))

const PORT = process.env.PORT || 3001

// ===== 数据库初始化 =====
const dbDir = path.join(__dirname, 'db')
require('fs').mkdirSync(dbDir, { recursive: true })

const eventsDb = new Database(path.join(dbDir, 'events.db'))
const masteryDb = new Database(path.join(dbDir, 'mastery.db'))
const energyDb = new Database(path.join(dbDir, 'energy.db'))

// 创建表
eventsDb.exec(`
  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    started_at TEXT DEFAULT (datetime('now')),
    ended_at TEXT,
    theme TEXT,
    energy_start INTEGER,
    energy_end INTEGER,
    total_questions INTEGER DEFAULT 0,
    correct_count INTEGER DEFAULT 0,
    mode_changes TEXT DEFAULT '[]'
  );
  CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT,
    time TEXT DEFAULT (datetime('now')),
    type TEXT,
    subject TEXT,
    knowledge_id TEXT,
    correct INTEGER,
    duration_ms INTEGER,
    energy_before INTEGER,
    energy_after INTEGER,
    frustration INTEGER
  );
`)

masteryDb.exec(`
  CREATE TABLE IF NOT EXISTS mastery (
    id TEXT PRIMARY KEY,
    accuracy REAL DEFAULT 0,
    avg_response_ms INTEGER DEFAULT 0,
    last_seen TEXT,
    total_attempts INTEGER DEFAULT 0,
    streak INTEGER DEFAULT 0,
    forgetting_score REAL DEFAULT 0,
    mastery_score REAL DEFAULT 0,
    status TEXT DEFAULT 'new'
  );
`)

energyDb.exec(`
  CREATE TABLE IF NOT EXISTS energy_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT,
    time TEXT DEFAULT (datetime('now')),
    event TEXT,
    energy_before INTEGER,
    energy_after INTEGER
  );
`)

console.log('[DB] 3 databases initialized')

// ===== 加载 Engine =====
let engines = {}
try {
  engines = {
    knowledgeGraph: require('./engine/knowledge-graph'),
    knowledgeDeps: require('./engine/knowledge-deps'),
    aiClient: require('./engine/ai-client'),
    safetyLayer: require('./engine/safety-layer'),
    feedbackTemplates: require('./engine/feedback-templates'),
    cacheLayer: require('./engine/cache-layer'),
    masteryEngine: require('./engine/mastery-engine'),
    memoryForest: require('./engine/memory-forest'),
    energyEngine: require('./engine/energy-engine'),
    stateMachine: require('./engine/state-machine'),
    lessonEngine: require('./engine/lesson-engine'),
    themeRuntime: require('./engine/theme-runtime'),
    contentPackager: require('./engine/content-packager'),
    runtimeDirector: require('./engine/runtime-director'),
  }
  console.log('[Engine] 14 modules loaded')
} catch (e) {
  console.warn('[Engine] Some modules not yet created:', e.message)
}

// ===== 健康检查 =====
app.get('/growth/api/health', (req, res) => {
  res.json({ status: 'ok', modules: Object.keys(engines).length })
})

// ===== 获取记忆森林状态 =====
app.get('/growth/api/forest', (req, res) => {
  if (!engines.memoryForest) return res.json({ trees: {}, season: 'spring' })
  const state = engines.memoryForest.getState()
  res.json(state)
})

// ===== 开始新 Session =====
app.post('/growth/api/session/start', (req, res) => {
  const { childName } = req.body || {}
  const theme = engines.themeRuntime
    ? engines.themeRuntime.selectTodayTheme([])
    : 'ocean'

  const sessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6)

  eventsDb.prepare('INSERT INTO sessions (id, theme, energy_start) VALUES (?, ?, 100)').run(sessionId, theme)

  res.json({
    sessionId,
    theme,
    greeting: `早上好${childName ? '，' + childName : ''}！今天我们去${getThemeName(theme)}探险！`,
    energy: 100,
    forest: engines.memoryForest ? engines.memoryForest.getState() : {},
  })
})

// ===== 获取题目 =====
app.post('/growth/api/question', async (req, res) => {
  const { sessionId, subject, childState } = req.body || {}

  try {
    if (engines.runtimeDirector) {
      const decision = engines.runtimeDirector.decide({
        energy: childState?.energy || 100,
        frustration: childState?.frustration || 0,
        memoryForest: engines.memoryForest ? engines.memoryForest.getWilted() : [],
      })

      if (decision.action === 'END_SESSION' || decision.action === 'STORY_MODE') {
        return res.json({ action: decision.action, message: decision.message })
      }
    }

    if (engines.contentPackager) {
      const result = await engines.contentPackager.generate({
        subject: subject || 'math',
        theme: childState?.theme || 'ocean',
        childState: childState || {},
      })
      return res.json(result)
    }

  } catch (e) {
    console.error('[question] Error:', e.message)
  }

  // 降级返回
  res.json({
    story: '球球来出题啦！',
    question: '2 + 1 = ?',
    options: [
      { label: '3', correct: true },
      { label: '2', correct: false },
      { label: '4', correct: false },
      { label: '1', correct: false },
    ],
    correctFeedback: '对啦！⭐',
    gentleNudge: '差一点点～',
  })
})

// ===== 记录事件 =====
app.post('/growth/api/event', (req, res) => {
  const { sessionId, type, subject, knowledgeId, correct, durationMs, energyBefore, energyAfter, frustration } = req.body || {}

  try {
    eventsDb.prepare(`
      INSERT INTO events (session_id, type, subject, knowledge_id, correct, duration_ms, energy_before, energy_after, frustration)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(sessionId, type, subject, knowledgeId, correct ? 1 : 0, durationMs, energyBefore, energyAfter, frustration)

    // 更新 session 统计
    if (type === 'answer') {
      eventsDb.prepare(`
        UPDATE sessions SET total_questions = total_questions + 1,
        correct_count = correct_count + ?,
        energy_end = ?
        WHERE id = ?
      `).run(correct ? 1 : 0, energyAfter || 100, sessionId)
    }

    // 更新掌握度
    if (engines.masteryEngine && knowledgeId) {
      engines.masteryEngine.update(knowledgeId, correct, durationMs)
    }

    res.json({ ok: true })
  } catch (e) {
    console.error('[event] Error:', e.message)
    res.status(500).json({ error: e.message })
  }
})

// ===== Session 结束 =====
app.post('/growth/api/session/end', (req, res) => {
  const { sessionId, energyEnd } = req.body || {}
  eventsDb.prepare('UPDATE sessions SET ended_at = datetime(\'now\'), energy_end = ? WHERE id = ?')
    .run(energyEnd || 0, sessionId)
  res.json({ ok: true })
})

// ===== 睡前故事 =====
app.post('/growth/api/story', async (req, res) => {
  const { childName, todayLearned, interests } = req.body || {}
  try {
    if (engines.contentPackager) {
      const story = await engines.contentPackager.generateStory({ childName, todayLearned, interests })
      return res.json(story)
    }
  } catch (e) {
    console.error('[story] Error:', e.message)
  }
  res.json({
    title: `${childName || '乐乐'}的晚安故事`,
    paragraphs: ['今天玩得真开心。', '星星出来了，该睡觉啦。', '晚安～'],
  })
})

// ===== 亲子回放 =====
app.get('/growth/api/replay/:sessionId', (req, res) => {
  const session = eventsDb.prepare('SELECT * FROM sessions WHERE id = ?').get(req.params.sessionId)
  const events = eventsDb.prepare('SELECT * FROM events WHERE session_id = ? ORDER BY id').all(req.params.sessionId)
  res.json({ session, events })
})

// ===== Session 摘要 =====
app.post('/growth/api/summary', async (req, res) => {
  const { sessionId } = req.body || {}
  const session = eventsDb.prepare('SELECT * FROM sessions WHERE id = ?').get(sessionId)
  const events = eventsDb.prepare('SELECT * FROM events WHERE session_id = ? ORDER BY id').all(sessionId)

  try {
    if (engines.contentPackager) {
      const summary = await engines.contentPackager.generateSummary({ session, events })
      return res.json(summary)
    }
  } catch (e) {
    console.error('[summary] Error:', e.message)
  }

  res.json({
    insight: `今天学了 ${session?.total_questions || 0} 道题，答对 ${session?.correct_count || 0} 道。`,
    tip: '晚饭时问问孩子今天认识了什么新朋友～',
  })
})

// ===== 启动 =====
app.listen(PORT, () => {
  console.log(`[Growth] Server running on port ${PORT}`)
})

function getThemeName(code) {
  const names = { ocean: '海底', dinosaur: '恐龙世界', car: '汽车', forest: '森林', home: '家' }
  return names[code] || code
}
