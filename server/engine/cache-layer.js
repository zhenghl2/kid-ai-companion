// cache-layer.js — LRU 内存缓存

const MAX_SIZE = 200
const cache = new Map()

function get(key) {
  if (!cache.has(key)) return null

  // LRU: 移到末尾
  const value = cache.get(key)
  cache.delete(key)
  cache.set(key, value)
  return value
}

function set(key, value) {
  if (cache.has(key)) {
    cache.delete(key)
  } else if (cache.size >= MAX_SIZE) {
    // 淘汰最老的
    const oldest = cache.keys().next().value
    cache.delete(oldest)
  }
  cache.set(key, value)
}

function makeKey(subject, knowledgeId, theme, level) {
  return `${subject}_${knowledgeId}_${theme}_L${level}`
}

function stats() {
  return { size: cache.size, max: MAX_SIZE }
}

module.exports = { get, set, makeKey, stats }
