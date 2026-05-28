// knowledge-deps.js — 知识依赖图

const DEPS = {
  // 语文
  "char_鱼": { prereq:[], next:["char_水"], confusion:["char_鸟","word_fish"], group:["ocean","animal"] },
  "char_猫": { prereq:[], next:["word_cat"], confusion:["word_cat"], group:["animal","pet"] },
  "char_鸟": { prereq:[], next:[], confusion:["char_鱼","char_马"], group:["forest","animal"] },
  "char_马": { prereq:[], next:["char_牛","char_羊"], confusion:["char_鸟"], group:["grassland","animal"] },
  "char_牛": { prereq:[], next:["char_羊"], confusion:[], group:["forest","animal"] },
  "char_羊": { prereq:[], next:[], confusion:[], group:["forest","animal"] },
  "char_水": { prereq:["char_鱼"], next:[], confusion:[], group:["ocean"] },
  "char_山": { prereq:[], next:[], confusion:[], group:["forest"] },
  "char_大": { prereq:[], next:["char_小"], confusion:[], group:["home","dinosaur"] },
  "char_小": { prereq:["char_大"], next:[], confusion:[], group:["home","dinosaur"] },
  // 数学
  "count_3":  { prereq:[],  next:["add_2+1","add_1+2"], confusion:[], group:[] },
  "count_4":  { prereq:[],  next:["add_2+2","sub_4-1"], confusion:[], group:[] },
  "count_5":  { prereq:[],  next:["add_3+2"], confusion:[], group:[] },
  "add_2+1":  { prereq:["count_3"], next:["add_2+2","sub_3-1"], confusion:["add_1+2"], group:[] },
  "add_1+2":  { prereq:["count_3"], next:["add_3+1"], confusion:["add_2+1"], group:[] },
  "add_2+2":  { prereq:["count_4"], next:["sub_4-1"], confusion:[], group:[] },
  "add_3+1":  { prereq:["count_4"], next:[], confusion:[], group:[] },
  "add_3+2":  { prereq:["count_5"], next:[], confusion:[], group:[] },
  "sub_2-1":  { prereq:[], next:[], confusion:[], group:[] },
  "sub_3-1":  { prereq:["add_2+1"], next:["sub_3-2"], confusion:[], group:[] },
  "sub_3-2":  { prereq:["sub_3-1"], next:[], confusion:[], group:[] },
  "sub_4-1":  { prereq:["add_2+2"], next:[], confusion:[], group:[] },
  // 英语
  "word_cat": { prereq:[], next:["word_dog"], confusion:["char_猫"], group:["animal","pet"] },
  "word_dog": { prereq:[], next:[], confusion:[], group:["animal","pet"] },
  "word_fish":{ prereq:[], next:[], confusion:["char_鱼"], group:["ocean","animal"] },
  "word_bird":{ prereq:[], next:[], confusion:["char_鸟"], group:["forest","animal"] },
  "word_cow": { prereq:[], next:[], confusion:["char_牛"], group:["forest","animal"] },
}

function getDeps(id) {
  return DEPS[id] || { prereq:[], next:[], confusion:[], group:[] }
}

function hasPrereqsMet(id, masteredIds) {
  const deps = getDeps(id)
  return deps.prereq.every(pid => masteredIds.has(pid))
}

function getConfusions(id) {
  return getDeps(id).confusion
}

function getRecentlyConfused(recentIds, candidateId) {
  const confusions = getConfusions(candidateId)
  return recentIds.some(rid => confusions.includes(rid))
}

module.exports = { getDeps, hasPrereqsMet, getConfusions, getRecentlyConfused }
