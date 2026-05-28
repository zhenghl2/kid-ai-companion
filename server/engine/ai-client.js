// ai-client.js — DeepSeek API 封装
const OpenAI = require('openai')

const client = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY || 'sk-placeholder',
  baseURL: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com',
  timeout: 5000,
  maxRetries: 0,
})

async function chat(messages, options = {}) {
  const start = Date.now()
  try {
    const response = await client.chat.completions.create({
      model: 'deepseek-chat',
      messages,
      temperature: options.temperature || 0.7,
      max_tokens: options.maxTokens || 300,
      response_format: options.jsonMode ? { type: 'json_object' } : undefined,
    })
    const content = response.choices[0].message.content
    const elapsed = Date.now() - start
    console.log(`[AI] ${elapsed}ms, tokens: ${response.usage?.total_tokens || '?'}`)
    return { ok: true, content, elapsed, tokens: response.usage?.total_tokens || 0 }
  } catch (e) {
    const elapsed = Date.now() - start
    console.error(`[AI] Error after ${elapsed}ms: ${e.message}`)
    return { ok: false, error: e.message, elapsed }
  }
}

module.exports = { chat }
