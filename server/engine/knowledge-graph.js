// knowledge-graph.js — 固定知识图谱（30字 + 17音 + 16数学 + 20词 + 4对话）

const CHARS = [
  { id:"char_爸",char:"爸",pinyin:"bà",category:"家庭",strokes:8,emoji:"👨",theme_tags:["home"],subject:"chinese",difficulty:1 },
  { id:"char_妈",char:"妈",pinyin:"mā",category:"家庭",strokes:6,emoji:"👩",theme_tags:["home"],subject:"chinese",difficulty:1 },
  { id:"char_我",char:"我",pinyin:"wǒ",category:"家庭",strokes:7,emoji:"🧒",theme_tags:["home"],subject:"chinese",difficulty:1 },
  { id:"char_家",char:"家",pinyin:"jiā",category:"家庭",strokes:10,emoji:"🏠",theme_tags:["home"],subject:"chinese",difficulty:1 },
  { id:"char_大",char:"大",pinyin:"dà",category:"家庭",strokes:3,emoji:"🐘",theme_tags:["home","dinosaur"],subject:"chinese",difficulty:1 },
  { id:"char_小",char:"小",pinyin:"xiǎo",category:"家庭",strokes:3,emoji:"🐭",theme_tags:["home","dinosaur"],subject:"chinese",difficulty:1 },
  { id:"char_口",char:"口",pinyin:"kǒu",category:"身体",strokes:3,emoji:"👄",theme_tags:[],subject:"chinese",difficulty:1 },
  { id:"char_手",char:"手",pinyin:"shǒu",category:"身体",strokes:4,emoji:"✋",theme_tags:[],subject:"chinese",difficulty:1 },
  { id:"char_目",char:"目",pinyin:"mù",category:"身体",strokes:5,emoji:"👁",theme_tags:[],subject:"chinese",difficulty:2 },
  { id:"char_耳",char:"耳",pinyin:"ěr",category:"身体",strokes:6,emoji:"👂",theme_tags:[],subject:"chinese",difficulty:2 },
  { id:"char_足",char:"足",pinyin:"zú",category:"身体",strokes:7,emoji:"🦶",theme_tags:[],subject:"chinese",difficulty:2 },
  { id:"char_日",char:"日",pinyin:"rì",category:"自然",strokes:4,emoji:"☀️",theme_tags:[],subject:"chinese",difficulty:1 },
  { id:"char_月",char:"月",pinyin:"yuè",category:"自然",strokes:4,emoji:"🌙",theme_tags:[],subject:"chinese",difficulty:1 },
  { id:"char_山",char:"山",pinyin:"shān",category:"自然",strokes:3,emoji:"⛰️",theme_tags:["forest"],subject:"chinese",difficulty:1 },
  { id:"char_水",char:"水",pinyin:"shuǐ",category:"自然",strokes:4,emoji:"💧",theme_tags:["ocean"],subject:"chinese",difficulty:1 },
  { id:"char_火",char:"火",pinyin:"huǒ",category:"自然",strokes:4,emoji:"🔥",theme_tags:[],subject:"chinese",difficulty:1 },
  { id:"char_马",char:"马",pinyin:"mǎ",category:"动物",strokes:3,emoji:"🐴",theme_tags:["grassland","animal"],subject:"chinese",difficulty:1 },
  { id:"char_牛",char:"牛",pinyin:"niú",category:"动物",strokes:4,emoji:"🐮",theme_tags:["forest","animal"],subject:"chinese",difficulty:1 },
  { id:"char_羊",char:"羊",pinyin:"yáng",category:"动物",strokes:6,emoji:"🐑",theme_tags:["forest","animal"],subject:"chinese",difficulty:2 },
  { id:"char_鸟",char:"鸟",pinyin:"niǎo",category:"动物",strokes:5,emoji:"🐦",theme_tags:["forest","animal"],subject:"chinese",difficulty:2 },
  { id:"char_鱼",char:"鱼",pinyin:"yú",category:"动物",strokes:8,emoji:"🐟",theme_tags:["ocean","animal"],subject:"chinese",difficulty:2 },
  { id:"char_猫",char:"猫",pinyin:"māo",category:"动物",strokes:11,emoji:"🐱",theme_tags:["animal","pet"],subject:"chinese",difficulty:3 },
  { id:"char_米",char:"米",pinyin:"mǐ",category:"食物",strokes:6,emoji:"🍚",theme_tags:["home"],subject:"chinese",difficulty:2 },
  { id:"char_果",char:"果",pinyin:"guǒ",category:"食物",strokes:8,emoji:"🍎",theme_tags:["forest","home"],subject:"chinese",difficulty:2 },
  { id:"char_瓜",char:"瓜",pinyin:"guā",category:"食物",strokes:5,emoji:"🍉",theme_tags:["home"],subject:"chinese",difficulty:2 },
  { id:"char_肉",char:"肉",pinyin:"ròu",category:"食物",strokes:6,emoji:"🍖",theme_tags:["home"],subject:"chinese",difficulty:2 },
  { id:"char_上",char:"上",pinyin:"shàng",category:"动作",strokes:3,emoji:"⬆️",theme_tags:["car"],subject:"chinese",difficulty:1 },
  { id:"char_下",char:"下",pinyin:"xià",category:"动作",strokes:3,emoji:"⬇️",theme_tags:["car"],subject:"chinese",difficulty:1 },
  { id:"char_来",char:"来",pinyin:"lái",category:"动作",strokes:7,emoji:"🚶",theme_tags:["home"],subject:"chinese",difficulty:2 },
  { id:"char_去",char:"去",pinyin:"qù",category:"动作",strokes:5,emoji:"🏃",theme_tags:["home"],subject:"chinese",difficulty:2 },
]

const PINYIN = {
  finals: [
    { id:"py_a",symbol:"a",sound:"ā",example:"阿姨",emoji:"👩",subject:"chinese" },
    { id:"py_o",symbol:"o",sound:"ō",example:"公鸡",emoji:"🐓",subject:"chinese" },
    { id:"py_e",symbol:"e",sound:"ē",example:"天鹅",emoji:"🦢",subject:"chinese" },
    { id:"py_i",symbol:"i",sound:"ī",example:"衣服",emoji:"👗",subject:"chinese" },
    { id:"py_u",symbol:"u",sound:"ū",example:"乌鸦",emoji:"🐦‍⬛",subject:"chinese" },
    { id:"py_ü",symbol:"ü",sound:"ǖ",example:"小鱼",emoji:"🐟",subject:"chinese" },
  ],
  initials: [
    { id:"py_b",symbol:"b",sound:"bō",example:"爸爸",emoji:"👨",subject:"chinese" },
    { id:"py_p",symbol:"p",sound:"pō",example:"爬行",emoji:"🧗",subject:"chinese" },
    { id:"py_m",symbol:"m",sound:"mō",example:"摸一摸",emoji:"✋",subject:"chinese" },
    { id:"py_f",symbol:"f",sound:"fō",example:"飞机",emoji:"✈️",subject:"chinese" },
    { id:"py_d",symbol:"d",sound:"dē",example:"打球",emoji:"⚽",subject:"chinese" },
    { id:"py_t",symbol:"t",sound:"tē",example:"跳舞",emoji:"💃",subject:"chinese" },
    { id:"py_n",symbol:"n",sound:"nē",example:"奶牛",emoji:"🐄",subject:"chinese" },
    { id:"py_l",symbol:"l",sound:"lē",example:"拉车",emoji:"🛒",subject:"chinese" },
    { id:"py_g",symbol:"g",sound:"gē",example:"哥哥",emoji:"👦",subject:"chinese" },
    { id:"py_k",symbol:"k",sound:"kē",example:"科学",emoji:"🔬",subject:"chinese" },
    { id:"py_h",symbol:"h",sound:"hē",example:"喝水",emoji:"🥤",subject:"chinese" },
  ],
}

const MATH = {
  count: [
    { id:"count_3", objects:3, answer:3, difficulty:1, theme_tags:["ocean","car","home"], subject:"math", category:"count" },
    { id:"count_4", objects:4, answer:4, difficulty:1, theme_tags:["forest","dinosaur"], subject:"math", category:"count" },
    { id:"count_5", objects:5, answer:5, difficulty:1, theme_tags:["ocean","forest"], subject:"math", category:"count" },
    { id:"count_6", objects:6, answer:6, difficulty:2, theme_tags:["dinosaur","home"], subject:"math", category:"count" },
    { id:"count_8", objects:8, answer:8, difficulty:2, theme_tags:["ocean","car"], subject:"math", category:"count" },
    { id:"count_10",objects:10,answer:10,difficulty:3, theme_tags:["dinosaur","forest"], subject:"math", category:"count" },
  ],
  add: [
    { id:"add_1+1",a:1,b:1,answer:2,difficulty:1,theme_tags:["ocean","forest","home"],subject:"math",category:"add" },
    { id:"add_2+1",a:2,b:1,answer:3,difficulty:1,theme_tags:["ocean","dinosaur","car"],subject:"math",category:"add" },
    { id:"add_1+2",a:1,b:2,answer:3,difficulty:1,theme_tags:["forest","home"],subject:"math",category:"add" },
    { id:"add_2+2",a:2,b:2,answer:4,difficulty:2,theme_tags:["dinosaur","car","ocean"],subject:"math",category:"add" },
    { id:"add_3+1",a:3,b:1,answer:4,difficulty:2,theme_tags:["forest","home"],subject:"math",category:"add" },
    { id:"add_3+2",a:3,b:2,answer:5,difficulty:3,theme_tags:["dinosaur","ocean","car"],subject:"math",category:"add" },
  ],
  sub: [
    { id:"sub_2-1",a:2,b:1,answer:1,difficulty:1,theme_tags:["forest","home"],subject:"math",category:"sub" },
    { id:"sub_3-1",a:3,b:1,answer:2,difficulty:1,theme_tags:["ocean","car"],subject:"math",category:"sub" },
    { id:"sub_3-2",a:3,b:2,answer:1,difficulty:2,theme_tags:["dinosaur","forest"],subject:"math",category:"sub" },
    { id:"sub_4-1",a:4,b:1,answer:3,difficulty:2,theme_tags:["ocean","home","car"],subject:"math",category:"sub" },
  ],
}

const ENGLISH = {
  words: [
    { id:"word_cat",   word:"cat",    meaning:"猫",   emoji:"🐱", theme_tags:["animal","pet"], subject:"english", category:"动物" },
    { id:"word_dog",   word:"dog",    meaning:"狗",   emoji:"🐶", theme_tags:["animal","pet"], subject:"english", category:"动物" },
    { id:"word_fish",  word:"fish",   meaning:"鱼",   emoji:"🐟", theme_tags:["ocean","animal"], subject:"english", category:"动物" },
    { id:"word_bird",  word:"bird",   meaning:"鸟",   emoji:"🐦", theme_tags:["forest","animal"], subject:"english", category:"动物" },
    { id:"word_pig",   word:"pig",    meaning:"猪",   emoji:"🐷", theme_tags:["animal"], subject:"english", category:"动物" },
    { id:"word_cow",   word:"cow",    meaning:"牛",   emoji:"🐮", theme_tags:["forest","animal"], subject:"english", category:"动物" },
    { id:"word_apple", word:"apple",  meaning:"苹果", emoji:"🍎", theme_tags:["forest","home"], subject:"english", category:"水果" },
    { id:"word_banana",word:"banana", meaning:"香蕉", emoji:"🍌", theme_tags:["home"], subject:"english", category:"水果" },
    { id:"word_orange",word:"orange", meaning:"橙子", emoji:"🍊", theme_tags:["home"], subject:"english", category:"水果" },
    { id:"word_grape", word:"grape",  meaning:"葡萄", emoji:"🍇", theme_tags:["home"], subject:"english", category:"水果" },
    { id:"word_red",   word:"red",    meaning:"红色", emoji:"🔴", theme_tags:["car","home"], subject:"english", category:"颜色" },
    { id:"word_blue",  word:"blue",   meaning:"蓝色", emoji:"🔵", theme_tags:["ocean","car"], subject:"english", category:"颜色" },
    { id:"word_green", word:"green",  meaning:"绿色", emoji:"🟢", theme_tags:["forest"], subject:"english", category:"颜色" },
    { id:"word_yellow",word:"yellow", meaning:"黄色", emoji:"🟡", theme_tags:["car","home"], subject:"english", category:"颜色" },
    { id:"word_one",   word:"one",    meaning:"一",   emoji:"1️⃣", theme_tags:["ocean","forest","dinosaur","car","home"], subject:"english", category:"数字" },
    { id:"word_two",   word:"two",    meaning:"二",   emoji:"2️⃣", theme_tags:["ocean","forest","dinosaur","car","home"], subject:"english", category:"数字" },
    { id:"word_three", word:"three",  meaning:"三",   emoji:"3️⃣", theme_tags:["ocean","forest","dinosaur","car","home"], subject:"english", category:"数字" },
    { id:"word_mum",   word:"mum",    meaning:"妈妈", emoji:"👩", theme_tags:["home"], subject:"english", category:"家庭" },
    { id:"word_dad",   word:"dad",    meaning:"爸爸", emoji:"👨", theme_tags:["home"], subject:"english", category:"家庭" },
    { id:"word_baby",  word:"baby",   meaning:"宝宝", emoji:"👶", theme_tags:["home"], subject:"english", category:"家庭" },
  ],
  dialogues: [
    { id:"dlg_hello", scene:"打招呼", lines:[
      {speaker:"A",text:"Hello!",trans:"你好"},
      {speaker:"B",text:"Hello!",trans:"你好"},
    ], subject:"english" },
    { id:"dlg_name",  scene:"问名字", lines:[
      {speaker:"A",text:"What's your name?",trans:"你叫什么？"},
      {speaker:"B",text:"I'm ___",trans:"我叫___"},
    ], subject:"english" },
    { id:"dlg_age",   scene:"问年龄", lines:[
      {speaker:"A",text:"How old are you?",trans:"你几岁？"},
      {speaker:"B",text:"I'm 4.",trans:"我四岁"},
    ], subject:"english" },
    { id:"dlg_like",  scene:"喜欢", lines:[
      {speaker:"A",text:"I like cats.",trans:"我喜欢猫"},
      {speaker:"B",text:"Me too!",trans:"我也是"},
    ], subject:"english" },
  ],
}

// 查询辅助
function getById(id) {
  const all = [...CHARS, ...PINYIN.finals, ...PINYIN.initials, ...MATH.count, ...MATH.add, ...MATH.sub, ...ENGLISH.words, ...ENGLISH.dialogues]
  return all.find(item => item.id === id)
}

function getBySubject(subject) {
  if (subject === 'chinese') return CHARS
  if (subject === 'math') return [...MATH.count, ...MATH.add, ...MATH.sub]
  if (subject === 'english') return [...ENGLISH.words, ...ENGLISH.dialogues]
  return []
}

function getBySubjectAndTheme(subject, theme) {
  return getBySubject(subject).filter(item =>
    item.theme_tags && item.theme_tags.includes(theme)
  )
}

function getFallbackItems(subject, theme) {
  // 主题下无匹配 → 回退
  const matched = getBySubjectAndTheme(subject, theme)
  if (matched.length > 0) return matched

  if (subject === 'math') return MATH.count  // 数数通用
  if (subject === 'english') return ENGLISH.words.filter(w => w.category === '数字')  // 数字词通用
  if (subject === 'chinese') return CHARS.filter(c => c.category === '动作')  // 动作字通用
  return []
}

module.exports = {
  CHARS, PINYIN, MATH, ENGLISH,
  getById, getBySubject, getBySubjectAndTheme, getFallbackItems,
}
