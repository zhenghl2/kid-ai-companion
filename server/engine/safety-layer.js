// safety-layer.js — AI 输出安全校验（6项）

const BAD_WORDS = ['死','杀','血','恐怖','鬼','暴力','枪','毒']
const NEGATIVE_WORDS = ['错了','不对','太差','笨','蠢','没用','不行']

function validate(subject, knowledge, aiOutput) {
  const errors = []

  // 1. JSON 结构校验
  if (!aiOutput || typeof aiOutput !== 'object') {
    return { ok: false, reason: 'INVALID_JSON' }
  }
  if (!aiOutput.options || !Array.isArray(aiOutput.options)) {
    return { ok: false, reason: 'MISSING_OPTIONS' }
  }

  // 2. 正确答案校验 — 必须有 1 个 correct:true 且值匹配
  const correctOpt = aiOutput.options.find(o => o.correct === true)
  if (!correctOpt) {
    return { ok: false, reason: 'NO_CORRECT_OPTION' }
  }

  if (knowledge.answer !== undefined) {
    // 数学/数数类 — 数值匹配
    const answerNum = parseInt(correctOpt.label)
    if (isNaN(answerNum) || answerNum !== knowledge.answer) {
      return { ok: false, reason: `ANSWER_MISMATCH: expected ${knowledge.answer}, got ${correctOpt.label}` }
    }
  }

  if (knowledge.char !== undefined) {
    // 汉字类 — label 必须包含正确汉字
    if (!correctOpt.label.includes(knowledge.char)) {
      return { ok: false, reason: `CHAR_MISMATCH: expected ${knowledge.char}` }
    }
  }

  if (knowledge.word !== undefined) {
    // 英语类 — label 必须包含正确单词
    if (!correctOpt.label.includes(knowledge.word)) {
      return { ok: false, reason: `WORD_MISMATCH: expected ${knowledge.word}` }
    }
  }

  // 3. 干扰项合法性 — 不能有空/重复/和正确答案相同
  const labels = aiOutput.options.map(o => o.label)
  if (new Set(labels).size !== labels.length) {
    return { ok: false, reason: 'DUPLICATE_OPTIONS' }
  }
  if (labels.some(l => !l || l.trim() === '')) {
    return { ok: false, reason: 'EMPTY_OPTION' }
  }

  // 4. 敏感词过滤
  const allText = JSON.stringify(aiOutput)
  for (const word of BAD_WORDS) {
    if (allText.includes(word)) {
      return { ok: false, reason: `BAD_WORD: ${word}` }
    }
  }
  for (const word of NEGATIVE_WORDS) {
    if (allText.includes(word)) {
      return { ok: false, reason: `NEGATIVE_WORD: ${word}` }
    }
  }

  // 5. 长度限制
  const story = aiOutput.story || ''
  const feedback = aiOutput.correctFeedback || ''
  const nudge = aiOutput.gentleNudge || ''
  if (story.length > 80) return { ok: false, reason: 'STORY_TOO_LONG' }
  if (feedback.length > 30) return { ok: false, reason: 'FEEDBACK_TOO_LONG' }
  if (nudge.length > 30) return { ok: false, reason: 'NUDGE_TOO_LONG' }
  for (const opt of aiOutput.options) {
    if ((opt.label || '').length > 8) return { ok: false, reason: 'OPTION_LABEL_TOO_LONG' }
  }

  // 6. 语言风格 — 无书面语特征
  const formalPatterns = [/具有/,/体现/,/培养/,/提升/,/锻炼/,/思维/,/能力/]
  for (const p of formalPatterns) {
    if (p.test(allText)) return { ok: false, reason: `FORMAL_STYLE: ${p.source}` }
  }

  return { ok: true }
}

// 通用文本安全校验（回放卡片/故事用）
function validateText(text) {
  if (!text || text.trim() === '') return { ok: false, reason: 'EMPTY' }
  if (text.length > 600) return { ok: false, reason: 'TOO_LONG' }
  for (const word of BAD_WORDS) {
    if (text.includes(word)) return { ok: false, reason: `BAD_WORD: ${word}` }
  }
  return { ok: true }
}

module.exports = { validate, validateText }
