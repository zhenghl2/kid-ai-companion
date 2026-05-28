# AI 儿童陪伴系统 — v10.1.1 终版架构（审计后）

## 架构概览

```
                      Runtime Director（唯一决策者）
                            │
        ┌───────────────────┼───────────────────┐
        │ signals           │ signals           │ signals
        ▼                   ▼                   ▼
   Energy Engine       State Machine      Memory Forest
        │                   │                   │
        └───────────────────┼───────────────────┘
                            │ approved action
                            ▼
                    Lesson Orchestrator
                            │
                    ┌───────┴───────┐
                    ▼               ▼
            Theme Runtime      Knowledge Deps
                    │               │
                    └───────┬───────┘
                            ▼
                      AI Packager
                            │
                    ┌───────┴───────┐
                    ▼               ▼
              Safety Layer      Fallback
                    │
                    ▼
               Frontend Render
```

---

## 一、Engine 模块清单（14 个，无冗余）

| # | 模块 | 职责 | 文件 |
|---|------|------|------|
| 1 | **Runtime Director** | 唯一决策者。所有 engine 只提供 signals，Director 做最终决策。 | `runtime-director.js` |
| 2 | **Energy Engine** | 认知疲劳模型。mental_energy 0-100，learn -15 / review -5 / wrong -12。 | `energy-engine.js` |
| 3 | **State Machine** | 挫败检测 + 恢复模式。连错 3 次 → recovery，连对 2 次 → 恢复。恢复中失败不惩罚。 | `state-machine.js` |
| 4 | **Memory Forest** | 多棵树 × 语义分支，树叶 = 知识点掌握状态。含季节系统。 | `memory-forest.js` |
| 5 | **Mastery Engine** | 每题独立掌握度 + 遗忘分数。accuracy×60 + speed×20 + retention×20。 | `mastery-engine.js` |
| 6 | **Lesson Orchestrator** | 编排今日学什么。复习 > 巩固 > 新课 > 奖励。服从 Director。 | `lesson-engine.js` |
| 7 | **Knowledge Deps** | 知识依赖图。前置依赖 + 易混淆控制 + 语义分组。支持跨科标记。 | `knowledge-deps.js` |
| 8 | **Knowledge Graph** | 30 字 + 17 音 + 16 数学 + 20 词 + 4 对话。固定不可变。 | `knowledge-graph.js` |
| 9 | **Theme Runtime** | 5 个主题（3 固定 + 2 自适应）。含视觉包/音频包/叙事框架。跨科回退。 | `theme-runtime.js` |
| 10 | **Content Packager** | AI 包装调度。组装 prompt → 调 ai-client → 过 safety-layer。 | `content-packager.js` |
| 11 | **Safety Layer** | 6 项校验：JSON/答案/干扰项/敏感词/长度/风格。覆盖所有 AI 输出。 | `safety-layer.js` |
| 12 | **AI Client** | DeepSeek SDK 封装。3s 超时，重试 1 次。 | `ai-client.js` |
| 13 | **Cache Layer** | 内存 LRU 200 条。key = subject_knowledgeId_theme_level。 | `cache-layer.js` |
| 14 | **Feedback Templates** | 本地模板化。AI 只输出 {theme, emotion, style} 标签。 | `feedback-templates.js` |

---

## 二、知识图谱（30 字 + 17 音 + 16 数学 + 20 词 + 4 对话）

### 语文 — 汉字 30

```javascript
const CHARS = [
  // 家庭 (6)
  { id:"char_爸",char:"爸",pinyin:"bà",category:"家庭",strokes:8,emoji:"👨",theme_tags:["home"]},
  { id:"char_妈",char:"妈",pinyin:"mā",category:"家庭",strokes:6,emoji:"👩",theme_tags:["home"]},
  { id:"char_我",char:"我",pinyin:"wǒ",category:"家庭",strokes:7,emoji:"🧒",theme_tags:["home"]},
  { id:"char_家",char:"家",pinyin:"jiā",category:"家庭",strokes:10,emoji:"🏠",theme_tags:["home"]},
  { id:"char_大",char:"大",pinyin:"dà",category:"家庭",strokes:3,emoji:"🐘",theme_tags:["home","dinosaur"]},
  { id:"char_小",char:"小",pinyin:"xiǎo",category:"家庭",strokes:3,emoji:"🐭",theme_tags:["home","dinosaur"]},
  // 身体 (5)
  { id:"char_口",char:"口",pinyin:"kǒu",category:"身体",strokes:3,emoji:"👄",theme_tags:[]},
  { id:"char_手",char:"手",pinyin:"shǒu",category:"身体",strokes:4,emoji:"✋",theme_tags:[]},
  { id:"char_目",char:"目",pinyin:"mù",category:"身体",strokes:5,emoji:"👁",theme_tags:[]},
  { id:"char_耳",char:"耳",pinyin:"ěr",category:"身体",strokes:6,emoji:"👂",theme_tags:[]},
  { id:"char_足",char:"足",pinyin:"zú",category:"身体",strokes:7,emoji:"🦶",theme_tags:[]},
  // 自然 (5)
  { id:"char_日",char:"日",pinyin:"rì",category:"自然",strokes:4,emoji:"☀️",theme_tags:[]},
  { id:"char_月",char:"月",pinyin:"yuè",category:"自然",strokes:4,emoji:"🌙",theme_tags:[]},
  { id:"char_山",char:"山",pinyin:"shān",category:"自然",strokes:3,emoji:"⛰️",theme_tags:["forest"]},
  { id:"char_水",char:"水",pinyin:"shuǐ",category:"自然",strokes:4,emoji:"💧",theme_tags:["ocean"]},
  { id:"char_火",char:"火",pinyin:"huǒ",category:"自然",strokes:4,emoji:"🔥",theme_tags:[]},
  // 动物 (6)  ← 加了「猫」
  { id:"char_马",char:"马",pinyin:"mǎ",category:"动物",strokes:3,emoji:"🐴",theme_tags:["grassland","animal"]},
  { id:"char_牛",char:"牛",pinyin:"niú",category:"动物",strokes:4,emoji:"🐮",theme_tags:["forest","animal"]},
  { id:"char_羊",char:"羊",pinyin:"yáng",category:"动物",strokes:6,emoji:"🐑",theme_tags:["forest","animal"]},
  { id:"char_鸟",char:"鸟",pinyin:"niǎo",category:"动物",strokes:5,emoji:"🐦",theme_tags:["forest","animal"]},
  { id:"char_鱼",char:"鱼",pinyin:"yú",category:"动物",strokes:8,emoji:"🐟",theme_tags:["ocean","animal"]},
  { id:"char_猫",char:"猫",pinyin:"māo",category:"动物",strokes:11,emoji:"🐱",theme_tags:["animal","pet"]},  // ← 新增
  // 食物 (4)  ← 去掉「豆」腾出位置
  { id:"char_米",char:"米",pinyin:"mǐ",category:"食物",strokes:6,emoji:"🍚",theme_tags:["home"]},
  { id:"char_果",char:"果",pinyin:"guǒ",category:"食物",strokes:8,emoji:"🍎",theme_tags:["forest","home"]},
  { id:"char_瓜",char:"瓜",pinyin:"guā",category:"食物",strokes:5,emoji:"🍉",theme_tags:["home"]},
  { id:"char_肉",char:"肉",pinyin:"ròu",category:"食物",strokes:6,emoji:"🍖",theme_tags:["home"]},
  // 动作 (4)
  { id:"char_上",char:"上",pinyin:"shàng",category:"动作",strokes:3,emoji:"⬆️",theme_tags:["car"]},
  { id:"char_下",char:"下",pinyin:"xià",category:"动作",strokes:3,emoji:"⬇️",theme_tags:["car"]},
  { id:"char_来",char:"来",pinyin:"lái",category:"动作",strokes:7,emoji:"🚶",theme_tags:["home"]},
  { id:"char_去",char:"去",pinyin:"qù",category:"动作",strokes:5,emoji:"🏃",theme_tags:["home"]},
]
// 总计 30 字，动物类增猫减豆
```

### 语文 — 拼音 17

```javascript
const PINYIN = {
  finals: [
    { id:"py_a",symbol:"a",sound:"ā",example:"阿姨",emoji:"👩"},
    { id:"py_o",symbol:"o",sound:"ō",example:"公鸡",emoji:"🐓"},
    { id:"py_e",symbol:"e",sound:"ē",example:"天鹅",emoji:"🦢"},
    { id:"py_i",symbol:"i",sound:"ī",example:"衣服",emoji:"👗"},
    { id:"py_u",symbol:"u",sound:"ū",example:"乌鸦",emoji:"🐦‍⬛"},
    { id:"py_ü",symbol:"ü",sound:"ǖ",example:"小鱼",emoji:"🐟"},
  ],
  initials: [
    { id:"py_b",symbol:"b",sound:"bō",example:"爸爸",emoji:"👨"},
    { id:"py_p",symbol:"p",sound:"pō",example:"爬行",emoji:"🧗"},
    { id:"py_m",symbol:"m",sound:"mō",example:"摸一摸",emoji:"✋"},
    { id:"py_f",symbol:"f",sound:"fō",example:"飞机",emoji:"✈️"},
    { id:"py_d",symbol:"d",sound:"dē",example:"打球",emoji:"⚽"},
    { id:"py_t",symbol:"t",sound:"tē",example:"跳舞",emoji:"💃"},
    { id:"py_n",symbol:"n",sound:"nē",example:"奶牛",emoji:"🐄"},
    { id:"py_l",symbol:"l",sound:"lē",example:"拉车",emoji:"🛒"},
    { id:"py_g",symbol:"g",sound:"gē",example:"哥哥",emoji:"👦"},
    { id:"py_k",symbol:"k",sound:"kē",example:"科学",emoji:"🔬"},
    { id:"py_h",symbol:"h",sound:"hē",example:"喝水",emoji:"🥤"},
  ],
}
// 拼音不参与主题包装，不调用 AI，用固定泡泡游戏。
// 拼音不在 fallback 体系中。
```

### 数学 — 16 题

```javascript
const MATH = {
  count: [
    { id:"count_3", objects:3, answer:3, difficulty:1, theme_tags:["ocean","car","home"] },
    { id:"count_4", objects:4, answer:4, difficulty:1, theme_tags:["forest","dinosaur"] },
    { id:"count_5", objects:5, answer:5, difficulty:1, theme_tags:["ocean","forest"] },
    { id:"count_6", objects:6, answer:6, difficulty:2, theme_tags:["dinosaur","home"] },
    { id:"count_8", objects:8, answer:8, difficulty:2, theme_tags:["ocean","car"] },
    { id:"count_10",objects:10,answer:10,difficulty:3,theme_tags:["dinosaur","forest"] },
  ],
  add: [
    { id:"add_1+1",a:1,b:1,answer:2,difficulty:1,theme_tags:["ocean","forest","home"] },
    { id:"add_2+1",a:2,b:1,answer:3,difficulty:1,theme_tags:["ocean","dinosaur","car"] },
    { id:"add_1+2",a:1,b:2,answer:3,difficulty:1,theme_tags:["forest","home"] },
    { id:"add_2+2",a:2,b:2,answer:4,difficulty:2,theme_tags:["dinosaur","car","ocean"] },
    { id:"add_3+1",a:3,b:1,answer:4,difficulty:2,theme_tags:["forest","home"] },
    { id:"add_3+2",a:3,b:2,answer:5,difficulty:3,theme_tags:["dinosaur","ocean","car"] },
  ],
  sub: [
    { id:"sub_2-1",a:2,b:1,answer:1,difficulty:1,theme_tags:["forest","home"] },
    { id:"sub_3-1",a:3,b:1,answer:2,difficulty:1,theme_tags:["ocean","car"] },
    { id:"sub_3-2",a:3,b:2,answer:1,difficulty:2,theme_tags:["dinosaur","forest"] },
    { id:"sub_4-1",a:4,b:1,answer:3,difficulty:2,theme_tags:["ocean","home","car"] },
  ],
}
```

### 英语 — 20 词 + 4 对话

```javascript
const ENGLISH = {
  words: [
    // 动物 (6)
    { id:"word_cat",   word:"cat",    meaning:"猫",   emoji:"🐱", theme_tags:["animal","pet"] },
    { id:"word_dog",   word:"dog",    meaning:"狗",   emoji:"🐶", theme_tags:["animal","pet"] },
    { id:"word_fish",  word:"fish",   meaning:"鱼",   emoji:"🐟", theme_tags:["ocean","animal"] },
    { id:"word_bird",  word:"bird",   meaning:"鸟",   emoji:"🐦", theme_tags:["forest","animal"] },
    { id:"word_pig",   word:"pig",    meaning:"猪",   emoji:"🐷", theme_tags:["animal"] },
    { id:"word_cow",   word:"cow",    meaning:"牛",   emoji:"🐮", theme_tags:["forest","animal"] },
    // 水果 (4)
    { id:"word_apple", word:"apple",  meaning:"苹果", emoji:"🍎", theme_tags:["forest","home"] },
    { id:"word_banana",word:"banana", meaning:"香蕉", emoji:"🍌", theme_tags:["home"] },
    { id:"word_orange",word:"orange", meaning:"橙子", emoji:"🍊", theme_tags:["home"] },
    { id:"word_grape", word:"grape",  meaning:"葡萄", emoji:"🍇", theme_tags:["home"] },
    // 颜色 (4)
    { id:"word_red",   word:"red",    meaning:"红色", emoji:"🔴", theme_tags:["car","home"] },
    { id:"word_blue",  word:"blue",   meaning:"蓝色", emoji:"🔵", theme_tags:["ocean","car"] },
    { id:"word_green", word:"green",  meaning:"绿色", emoji:"🟢", theme_tags:["forest"] },
    { id:"word_yellow",word:"yellow", meaning:"黄色", emoji:"🟡", theme_tags:["car","home"] },
    // 数字 (3)
    { id:"word_one",   word:"one",    meaning:"一",   emoji:"1️⃣", theme_tags:["ocean","forest","dinosaur","car","home"] },
    { id:"word_two",   word:"two",    meaning:"二",   emoji:"2️⃣", theme_tags:["ocean","forest","dinosaur","car","home"] },
    { id:"word_three", word:"three",  meaning:"三",   emoji:"3️⃣", theme_tags:["ocean","forest","dinosaur","car","home"] },
    // 家庭 (3)
    { id:"word_mum",   word:"mum",    meaning:"妈妈", emoji:"👩", theme_tags:["home"] },
    { id:"word_dad",   word:"dad",    meaning:"爸爸", emoji:"👨", theme_tags:["home"] },
    { id:"word_baby",  word:"baby",   meaning:"宝宝", emoji:"👶", theme_tags:["home"] },
  ],
  dialogues: [
    { id:"dlg_hello",    scene:"打招呼", lines:[
      {speaker:"A",text:"Hello!",trans:"你好"},
      {speaker:"B",text:"Hello!",trans:"你好"},
    ]},
    { id:"dlg_name",     scene:"问名字", lines:[
      {speaker:"A",text:"What's your name?",trans:"你叫什么？"},
      {speaker:"B",text:"I'm ___",trans:"我叫___"},
    ]},
    { id:"dlg_age",      scene:"问年龄", lines:[
      {speaker:"A",text:"How old are you?",trans:"你几岁？"},
      {speaker:"B",text:"I'm 4.",trans:"我四岁"},
    ]},
    { id:"dlg_like",     scene:"喜欢", lines:[
      {speaker:"A",text:"I like cats.",trans:"我喜欢猫"},
      {speaker:"B",text:"Me too!",trans:"我也是"},
    ]},
  ],
}
// 对话不调用 AI 包装，用固定情景动画。
```

---

## 三、知识依赖图

```javascript
const KNOWLEDGE_DEPS = {
  // ===== 语文 =====
  "char_鱼": { prereq:[], next:["char_水"], confusion:["char_鸟","word_fish"], group:["ocean","animal"], load:1 },
  "char_猫": { prereq:[], next:["char_狗","word_cat"], confusion:["word_cat"], group:["animal","pet"], load:1 },
  "char_鸟": { prereq:[], next:["char_飞"], confusion:["char_鱼","char_马"], group:["forest","animal"], load:1 },
  "char_马": { prereq:[], next:["char_牛","char_羊"], confusion:["char_鸟"], group:["grassland","animal"], load:1 },
  "char_牛": { prereq:[], next:["char_羊"], confusion:[], group:["forest","animal"], load:1 },
  "char_羊": { prereq:[], next:[], confusion:[], group:["forest","animal"], load:1 },
  "char_水": { prereq:["char_鱼"], next:[], confusion:[], group:["ocean"], load:1 },
  "char_山": { prereq:[], next:[], confusion:[], group:["forest"], load:1 },
  "char_大": { prereq:[], next:["char_小"], confusion:[], group:["home","dinosaur"], load:1 },
  "char_小": { prereq:["char_大"], next:[], confusion:[], group:["home","dinosaur"], load:1 },

  // ===== 数学 =====
  "count_3":  { prereq:[],  next:["add_2+1","add_1+2"], confusion:[], group:[], load:1 },
  "count_4":  { prereq:[],  next:["add_2+2","sub_4-1"], confusion:[], group:[], load:1 },
  "add_2+1":  { prereq:["count_3"], next:["add_2+2","sub_3-1"], confusion:["add_1+2"], group:[], load:1 },
  "add_1+2":  { prereq:["count_3"], next:["add_3+1"], confusion:["add_2+1"], group:[], load:1 },
  "add_2+2":  { prereq:["count_4"], next:["sub_4-1"], confusion:[], group:[], load:2 },
  "sub_3-1":  { prereq:["add_2+1"], next:["sub_3-2"], confusion:[], group:[], load:2 },

  // ===== 英语 =====
  "word_cat": { prereq:[], next:["word_dog"], confusion:["char_猫"], group:["animal","pet"], load:1 },
  "word_dog": { prereq:[], next:[], confusion:[], group:["animal","pet"], load:1 },
  "word_fish":{ prereq:[], next:[], confusion:["char_鱼"], group:["ocean","animal"], load:1 },
  "word_bird":{ prereq:[], next:[], confusion:["char_鸟"], group:["forest","animal"], load:1 },
  "word_cow": { prereq:[], next:[], confusion:["char_牛"], group:["forest","animal"], load:1 },
}
// 仅列出有依赖关系的知识点。其余为独立知识，无前置无混淆。
// confusion 支持跨科标记（char_猫 ↔ word_cat 等）。
```

---

## 四、主题运行时（5 主题）

### 主题库

```
🌊 海洋探险 — 鱼 水 count_3 add_2+1 fish blue one
🦖 恐龙世界 — 大 小 count_6 add_3+2  one two three
🚗 汽车总动员 — 上 下 count_8 add_2+1 red blue yellow
🌳 森林奇遇 — 鸟 牛 果 count_5 add_1+2 bird cow green
🏠 我家的一天 — 爸 妈 家 果 count_6 add_3+1 mum dad apple
```

### 主题选择

```javascript
// theme-runtime.js

const THEMES = ["ocean","dinosaur","car","forest","home"]
const FIXED_COUNT = 3    // 每月 3 个固定轮换
const ADAPTIVE_COUNT = 2  // 2 个从「打开率最高」的主题中选

function selectThemes(childHistory) {
  const fixed = getFixedRotation()   // 纯轮换
  const adaptive = getTopThemes(childHistory, ADAPTIVE_COUNT)  // 历史偏好
  return [...fixed, ...adaptive]
}
```

### 跨科回退

```javascript
// 某主题下某科无匹配知识点 → 回退到语义中立内容
function fallbackKnowledge(theme, subject) {
  const matched = knowledgeGraph.filter(item => 
    item.theme_tags.includes(theme) && item.subject === subject
  )
  if (matched.length > 0) return matched
  
  // 回退：数学用数字类，英语用数字词，语文用动作类
  if (subject === "math")    return knowledgeGraph.filter(i => i.category === "count")
  if (subject === "english") return knowledgeGraph.filter(i => i.category === "数字")
  if (subject === "chinese") return knowledgeGraph.filter(i => i.category === "动作")
  return []
}
```

---

## 五、状态系统

### Priority（Runtime Director 决策优先级）

```javascript
const PRIORITY = {
  FORCE_END:    100,  // 能量 < 10 → 球球说晚安
  RECOVERY:      90,  // 连错 ≥ 3 → 救小恐龙
  FATIGUE:       70,  // 能量 < 30 → 故事模式
  REVIEW_FIRST:  50,  // 有枯叶 → 先浇水
  LESSON:        30,  // 正常上课
  REWARD:        10,  // 全部完成 → 奖励
}
```

### Energy Engine 参数

```javascript
const ENERGY = {
  initial: 100,
  decay: {
    new_knowledge:   -15,
    review:          -5,
    consecutive_wrong: -12,  // 修复：从 -20 降到 -12
    animation_heavy: -8,
  },
  thresholds: {
    normal:  70,
    slow:    50,
    tired:   30,
    end:     10,
  }
}
```

### State Machine 行为

```
正常 → 连错 3 次 → RECOVERY
  recovery: 给已掌握简单题，不惩罚失败
  recovery 中再失败 → 直接 STORY_MODE（不再挣扎）
  recovery 中连对 2 次 → 回 LESSON

中途退出 → 球球确认 → 正常结束，不惩罚
久别重逢（3天+）→ 球球欢迎语 + 枯叶状态保留 + 浇水奖励
```

---

## 六、前半端页面与组件

### 页面（7 个）

```
today/         首页 — 球球打招呼 + 记忆森林 + 开始按钮
play/          答题 — 故事化流程 + 固定节奏
story/         睡前故事 — 大字滚动 + TTS + 背景渐暗
collection/    收藏册 — 贴纸收集 + 解锁动画
replay/        亲子回放 — 今日探险卡片
parent/        家长中心 — 摘要 + 设置 + 亲子一句话
onboard/       首次引导 — 昵称 + 生日 → 自动推算中班
```

### 组件（10 个）

```
qiuqiu/             球球（7 表情 + 5 动画 + 主题换装）
memory-forest/      记忆森林（多棵树 + 语义分支 + 季节）
theme-background/   主题动态背景（5 套视觉包）
question-card/      题目卡片（故事 + 4 选项大按钮）
celebration/        撒花 + 星星飞出
energy-bar/         能量条（球球表情联动）
recovery-game/      恢复模式小游戏
sticker-book/       贴纸收藏册
eye-care-overlay/   护眼遮罩
level-card/         关卡卡片
```

### 已清理的残留

```
❌ park/ chat/ game/ level/ map/     — 5 个废弃页面
❌ math-tree/ memory-tree/ daily-mission/
   park-map/ forest-view/ emotion-chart/
   camera-view/                      — 7 个废弃组件
```

---

## 七、数据库

### events.db

```sql
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  started_at TEXT,
  ended_at TEXT,
  theme TEXT,
  energy_start INTEGER,
  energy_end INTEGER,
  total_questions INTEGER,
  correct_count INTEGER,
  mode_changes TEXT  -- JSON: ["recovery","story"]
);

CREATE TABLE events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT REFERENCES sessions(id),
  time TEXT DEFAULT (datetime('now')),
  type TEXT,           -- answer/story_view/mode_change/chat_select
  subject TEXT,        -- chinese/math/english
  knowledge_id TEXT,
  correct INTEGER,
  duration_ms INTEGER,
  energy_before INTEGER,
  energy_after INTEGER,
  frustration INTEGER
);
```

### mastery.db

```sql
CREATE TABLE mastery (
  id TEXT PRIMARY KEY,       -- knowledge_id
  accuracy REAL,             -- 最近 10 次正确率
  avg_response_ms INTEGER,   -- 平均反应时间
  last_seen TEXT,
  total_attempts INTEGER,
  streak INTEGER,
  forgetting_score REAL,
  mastery_score REAL,
  status TEXT                -- new|weak|learning|mastered
);
```

### energy.db（仅日志，不存状态）

```sql
CREATE TABLE energy_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT,
  time TEXT DEFAULT (datetime('now')),
  event TEXT,               -- question_answer/mode_change/session_end
  energy_before INTEGER,
  energy_after INTEGER
);
```

---

## 八、降级链路

```
/api/question 请求
  → 查缓存（cache-layer, LRU 200）
    → 命中：直接返回
    → 未命中：
      → 调 DeepSeek（ai-client, 3s 超时）
        → 过安全层（6 项校验）
          → 通过：写入缓存 + 返回
          → 失败：重试 1 次
            → 通过：同上
            → 失败：读 fallback/questions.json
              → 随机选 1/5
              → 返回

Fallback 覆盖：30 字 × 5 + 16 数学 × 5 + 20 词 × 5 = 330 题
拼音不在此链路中（不调 AI，固定泡泡游戏）
对话不在此链路中（不调 AI，固定情景动画）
```

---

## 九、不做清单

```
✗ OCR / Vision
✗ 开放文本聊天
✗ 多角色（只有球球）
✗ 户外任务
✗ 大班内容
✗ 多孩档案
✗ 超过 30 个汉字
✗ 超过 5 个主题
✗ 新增 engine
✗ 重构目录
✗ AI 控制节奏/状态/难度
✗ 学习目标选择/课表权重（首次引导简化为昵称+生日）
```

---

## 十、节奏控制（固定，不可被 AI 改变）

```
0s ─── 球球出现 + 读题（自动播放语音）
3s ─── 选项弹出（弹性动画）
↓ 孩子点击
+0s ─ 正确：1.5s 撒花 + 球球跳 + ⭐
      错误：0.8s 球球眨眼 + 温柔反馈 + 正确选项发光
+2s ─ 过渡：球球挥手 → 下一题

每轮 5 题 ≈ 3 分钟
每天最多 3 轮（家长设 10/15/20 分钟）
```

---

## 十一、错误反馈库（多样化，12 句）

```javascript
const GENTLE_FEEDBACKS = [
  "差一点点～",
  "这个躲起来了！",
  "它藏在哪里呢？",
  "球球也找了半天！",
  "换个方向找找看～",
  "噢！它在这里！",
  "我们再看一遍～",
  "不急不急～",
  "快找到了！",
  "这次一定行！",
  "再试一次！",
  "它和你捉迷藏呢～",
]
// 随机选 1，避免「差一点点」被孩子识破
```

---

## 十二、部署

```
123.56.45.184

/opt/growth/
├── server.js                      # Express 端口 3001
├── engine/                        # 14 个模块
├── prompts/                       # base + subjects + story + parent
├── themes/                        # 5 个主题 JSON
├── db/                            # 3 个 SQLite
├── fallback/questions.json        # 330 题
├── miniapp/                       # 小程序前端源码
│   ├── pages/                     # 7 个页面
│   └── components/                # 10 个组件
└── audio/
    ├── sfx/                       # 10 个通用音效
    └── ambient/                   # 5 个主题环境音

Nginx:  location /growth/api/ → proxy_pass http://localhost:3001/api/
Systemd: growth.service → 开机自启

成本: DeepSeek API ≈ ¥0.5/月（含缓存后可能 < ¥0.1）
```

---

## 十三、版本演进总结

| 版本 | 核心变化 |
|------|---------|
| v5 | 初始：固定题库 + 三科 |
| v6 | 加：大班 + 逻辑思维 + 表达 + 情绪识别 |
| v7 | 转：AI 原生，DeepSeek 接入 |
| v8 | 收：AI 只做包装，知识固定 |
| v8.1 | 缩：砍掉多学科/OCR/Vision，MVP=数学+球球+故事 |
| v9 | 扩：三科回归，安全层+降级+状态机+节奏控制 |
| v9.1 | 补：课程编排+掌握度+缓存+反馈模板+收藏册 |
| v10 | 升：知识依赖图+能量引擎+主题运行时+记忆森林+亲子回放 |
| v10.1 | 合：Runtime Director 统一调度，冻结架构 |
| v10.1.1 | 审：15 项修复，命名统一/ID 一致/残留清理/去重 |
```
