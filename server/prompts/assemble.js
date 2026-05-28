// prompts/assemble.js — Prompt 拼装器
const fs = require('fs')
const path = require('path')

const BASE_DIR = path.join(__dirname)
const cache = {}

function read(name) {
  if (!cache[name]) {
    const filePath = path.join(BASE_DIR, name)
    if (fs.existsSync(filePath)) {
      cache[name] = fs.readFileSync(filePath, 'utf8').trim()
    } else {
      cache[name] = ''
    }
  }
  return cache[name]
}

function build(subjectPrompt, params = {}) {
  const parts = [
    read('base/qiuqiu-persona.txt'),
    read('base/safety-rules.txt'),
    read('base/format-rules.txt'),
    read(`subjects/${subjectPrompt}`),
  ].filter(Boolean)

  if (Object.keys(params).length > 0) {
    parts.push(`当前参数：${JSON.stringify(params)}`)
  }

  return parts.join('\n\n')
}

module.exports = { build }
