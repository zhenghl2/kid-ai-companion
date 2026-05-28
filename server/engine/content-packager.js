// content-packager.js — AI 包装调度

const aiClient = require('./ai-client')
const safetyLayer = require('./safety-layer')
const cacheLayer = require('./cache-layer')
const knowledgeGraph = require('./knowledge-graph')
const feedbackTemplates = require('./feedback-templates')
const path = require('path')
const fs = require('fs')

// 加载 prompt 模板
let prompts = {}
try {
  prompts = {
    question: fs.readFileSync(path.join(__dirname, '../prompts/question.txt'), 'utf8'),
    story: fs.readFileSync(path.join(__dirname, '../prompts/story.txt'), 'utf8'),
    summary: fs.readFileSync(path.join(__dirname, '../prompts/summary.txt'), 'utf8'),
  }
} catch (e) {
  console.warn('[Packager] Prompts not found, using defaults:', e.message)
}

const BASE_PROMPT = `你是球球，一只4岁的熊猫，是孩子的好朋友。
你在陪伴孩子玩学习小游戏。你说话总是温柔、简短、有趣。
每句话不超过12个字。永远不说"错了""不对"。`

// 出题
async function generate(context) {
  const { subject, theme, childState } = context
  const level = childState?.level || 1

  // 1. 选知识 — 排除最近 10 个已用
  let pool = knowledgeGraph.getBySubjectAndTheme(subject, theme)
  if (pool.length === 0) pool = knowledgeGraph.getFallbackItems(subject, theme)

  const recents = childState?.recentIds || []
  const recentSet = new Set(recents.slice(-10))
  pool = pool.filter(item => !recentSet.has(item.id))
  if (pool.length === 0) pool = knowledgeGraph.getFallbackItems(subject, theme)  // 全被排除则回退

  const knowledge = pool[Math.floor(Math.random() * pool.length)]

  // 2. 查缓存
  const cacheKey = cacheLayer.makeKey(subject, knowledge.id, theme, level)
  const cached = cacheLayer.get(cacheKey)
  if (cached) {
    return { ...cached, cached: true }
  }

  // 3. 调 AI
  const systemPrompt = BASE_PROMPT + '\n' + buildQuestionPrompt(knowledge, theme)
  const result = await aiClient.chat([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: `出题：${JSON.stringify(knowledge)}，主题：${theme}` },
  ], { jsonMode: true, maxTokens: 300 })

  // 4. 解析 + 安全校验
  if (result.ok) {
    try {
      const parsed = JSON.parse(result.content)
      const safe = safetyLayer.validate(subject, knowledge, parsed)
      if (safe.ok) {
        // 后处理：确保 story 包含明确提问
        parsed.story = ensureQuestion(parsed.story, knowledge)
        // 替换鼓励语为本地模板
        parsed.correctFeedback = feedbackTemplates.getCorrectFeedback(theme)
        parsed.gentleNudge = feedbackTemplates.getGentleNudge()
        parsed.knowledgeId = knowledge.id
        cacheLayer.set(cacheKey, parsed)
        return parsed
      }
      console.warn('[Packager] Safety check failed:', safe.reason)
    } catch (e) {
      console.warn('[Packager] JSON parse error:', e.message)
    }
  }

  // 5. 重试 1 次
  if (result.ok === false) {
    console.log('[Packager] Retrying...')
    const retry = await aiClient.chat([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `刚才出错了，重新出题：${JSON.stringify(knowledge)}` },
    ], { jsonMode: true, maxTokens: 300 })
    if (retry.ok) {
      try {
        const parsed = JSON.parse(retry.content)
        const safe = safetyLayer.validate(subject, knowledge, parsed)
        if (safe.ok) {
          parsed.story = ensureQuestion(parsed.story, knowledge)
          parsed.correctFeedback = feedbackTemplates.getCorrectFeedback(theme)
          parsed.gentleNudge = feedbackTemplates.getGentleNudge()
          parsed.knowledgeId = knowledge.id
          cacheLayer.set(cacheKey, parsed)
          return parsed
        }
      } catch (e) {}
    }
  }

  // 6. 降级
  return fallbackQuestion(subject, knowledge)
}

// 睡前故事
async function generateStory(context) {
  const { childName, todayLearned, interests } = context
  const systemPrompt = BASE_PROMPT + `
你要生成一个2分钟的睡前故事，不超过200字。
融入今天学的知识，结尾轻声引导入睡。`

  const result = await aiClient.chat([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: `孩子：${childName}，今天学了：${JSON.stringify(todayLearned)}，喜欢：${interests?.join('、')}` },
  ], { maxTokens: 400 })

  if (result.ok) {
    const text = result.content || ''
    if (text.length > 600) return { title: '晚安故事', paragraphs: [text.slice(0, 600)] }
    const safe = safetyLayer.validateText(text)
    if (safe.ok) return { title: `${childName || '乐乐'}的晚安故事`, paragraphs: text.split('\n').filter(Boolean) }
  }

  return {
    title: `${childName || '乐乐'}的晚安故事`,
    paragraphs: ['今天玩得真开心。', '星星出来了，该睡觉啦。', '晚安～'],
  }
}

// Session 摘要
async function generateSummary(context) {
  const { session, events } = context
  const result = await aiClient.chat([
    { role: 'system', content: BASE_PROMPT + '\n用2句话总结今天的学习，第3句给家长一个亲子互动建议。' },
    { role: 'user', content: `Session数据：${JSON.stringify({ session, events: events?.slice(0, 20) })}` },
  ], { maxTokens: 200 })

  if (result.ok && safetyLayer.validateText(result.content).ok) {
    return { insight: result.content }
  }

  return {
    insight: `今天学了 ${session?.total_questions || 0} 道题。`,
    tip: '晚饭时问问孩子今天认识了什么新朋友～',
  }
}

function buildQuestionPrompt(knowledge, theme) {
  let instruction = ''
  if (knowledge.char) {
    instruction = `给汉字"${knowledge.char}(${knowledge.pinyin})"出一道选择题。4个选项中1个正确（包含"${knowledge.char}"），3个是其他汉字。`
  } else if (knowledge.a !== undefined && knowledge.b !== undefined) {
    instruction = `用${theme}主题包装算式 ${knowledge.a}${knowledge.id.includes('sub') ? '-' : '+'}${knowledge.b}=${knowledge.answer}。4个选项，正确值是${knowledge.answer}。`
  } else if (knowledge.word) {
    instruction = `给英语单词"${knowledge.word}(${knowledge.meaning})"出一道选择题。`
  } else if (knowledge.answer !== undefined) {
    instruction = `出一道数数题，有${knowledge.objects}个物品。正确答案是${knowledge.answer}。`
  }
  return instruction + '\n输出严格JSON：{"story":"...","options":[{"label":"...","correct":true/false}],"correctFeedback":"...","gentleNudge":"..."}'
}

function fallbackQuestion(subject, knowledge) {
  const k = knowledge || knowledgeGraph.getBySubject(subject)[0]
  if (!k) {
    return { story:'球球来啦！', options:[{label:'3',correct:true},{label:'2',correct:false},{label:'4',correct:false},{label:'1',correct:false}], correctFeedback:'对啦！', gentleNudge:'差一点点～' }
  }

  // 生成简单 fallback
  return {
    story: k.char ? `哪个是「${k.char}」？` : k.word ? `哪个是 ${k.word}？` : `答案是多少？`,
    options: [
      { label: k.char || k.word || String(k.answer), correct: true },
      ...getDistractors(k).slice(0, 3).map(d => ({ label: d, correct: false })),
    ],
    correctFeedback: feedbackTemplates.getCorrectFeedback('default'),
    gentleNudge: feedbackTemplates.getGentleNudge(),
    knowledgeId: k.id,
    fallback: true,
  }
}

function getDistractors(knowledge) {
  if (knowledge.char) return knowledgeGraph.CHARS.filter(c => c.id !== knowledge.id).slice(0, 3).map(c => c.char)
  if (knowledge.word) return knowledgeGraph.ENGLISH.words.filter(w => w.id !== knowledge.id).slice(0, 3).map(w => w.word)
  if (knowledge.answer !== undefined) {
    const a = knowledge.answer
    // 生成 5 以内的唯一干扰项，确保不等于答案且不重复
    const pool = [1,2,3,4,5].filter(n => n !== a)
    const result = []
    for (let i = 0; i < 3 && i < pool.length; i++) {
      result.push(String(pool[i]))
    }
    // 如果不够 3 个，补数字（大于 5 亦可）
    while (result.length < 3) {
      const extra = a + result.length + 1
      if (!result.includes(String(extra)) && extra !== a) {
        result.push(String(extra))
      } else {
        result.push(String(extra + 1))
      }
    }
    return result
  }
  return ['2','4','5']
}

function ensureQuestion(story, knowledge) {
  // 如果已有问句（含"哪个"/"几"/"多少"），直接返回
  if (/[哪个几多少]/.test(story) && /[？?]/.test(story)) return story

  // 加停顿分隔
  const sep = /[。！？，]$/.test(story) ? '' : '，'

  let q = ''
  if (knowledge.char) q = `${sep}哪个是「${knowledge.char}」？`
  else if (knowledge.word) q = `${sep}哪个是 ${knowledge.word}？`
  else if (knowledge.a !== undefined) {
    const op = knowledge.id.includes('sub') ? '还剩' : '一共'
    q = `${sep}${op}几个？`
  } else if (knowledge.objects !== undefined) q = `${sep}一共有几个？`
  else q = `${sep}答案是？`

  return story + q
}

module.exports = { generate, generateStory, generateSummary }
