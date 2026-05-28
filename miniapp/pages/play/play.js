var app = getApp()
var api = require('../../api/client')

Page({
  data: {
    qiuqiuMood: 'happy', qiuqiuAnim: '',
    progress: 0, current: 0, total: 10,
    phase: 'teach',        // teach | quiz
    teachEmoji: '', teachMain: '', teachSub: '',
    story: '', options: [], showingOptions: false,
    feedbackText: '', feedbackType: '',
    mode: 'learn', finished: false, score: 0, learnedCount: 0,
    answered: false, subjectIndex: 0,
    subjects: ['chinese','math','english','chinese','math','english','chinese','math','english','chinese'],
    correctFeedback: '', gentleNudge: '',
  },

  onLoad: function() {
    this.loadQuestion()
  },

  loadQuestion: function() {
    var that = this
    var g = app.globalData
    var subject = this.data.subjects[this.data.subjectIndex % 10]

    // Track recently used to avoid repeats
    if (!g.recentIds) g.recentIds = []
    if (g.recentIds.length > 15) g.recentIds.shift()

    api.getQuestion({
      sessionId: g.sessionId,
      subject: subject,
      childState: {
        energy: g.energy, frustration: g.frustration,
        theme: g.theme, level: g.level || 1,
        recentIds: g.recentIds,
      }
    }).then(function(data) {
      if (data.action === 'END_SESSION') { app.endSession(); wx.navigateBack(); return }

      var knowId = data.knowledgeId || 'unknown'
      g.recentIds.push(knowId)

      // Extract teaching info
      var teach = getTeachInfo(data, subject)

      that.setData({
        story: data.story || '准备好了吗？',
        options: data.options.map(function(o,i){ return {id:i,label:o.label,correct:o.correct,state:''} }),
        correctFeedback: data.correctFeedback || '对啦！',
        gentleNudge: data.gentleNudge || '差一点点～',
        answered: false, qiuqiuMood: 'happy',
        phase: 'teach',
        teachEmoji: teach.emoji,
        teachMain: teach.main,
        teachSub: teach.sub,
      })

      // 教学环节：2.5s 展示
      that.playTTS(teach.readAloud || data.story)
      setTimeout(function(){ that.setData({ phase: 'quiz' }); that.playTTS(data.story) }, 2500)
    }).catch(function() {
      that.setData({
        story: '球球来出题啦！一共有几个？',
        options: [{id:0,label:'3',correct:true,state:''},{id:1,label:'2',correct:false,state:''},{id:2,label:'4',correct:false,state:''},{id:3,label:'1',correct:false,state:''}],
        answered: false, phase: 'quiz',
      })
    })
  },

  selectOption: function(e) {
    if (this.data.answered) return
    var idx = e.currentTarget.dataset.index
    var opt = this.data.options[idx]
    var that = this; this.setData({ answered: true })

    var options = this.data.options.map(function(o,i){
      if (o.correct) return Object.assign({},o,{state:'correct'})
      if (i===idx && !o.correct) return Object.assign({},o,{state:'wrong'})
      return o
    })
    var correct = opt.correct
    this.setData({
      options: options, score: this.data.score + (correct?1:0),
      learnedCount: this.data.learnedCount + (correct?1:0),
      feedbackText: correct ? this.data.correctFeedback : this.data.gentleNudge,
      feedbackType: correct ? 'correct' : 'gentle',
      qiuqiuMood: correct ? 'happy' : 'wink',
      qiuqiuAnim: correct ? 'jump' : 'wave',
    })

    var g = app.globalData
    app.postEvent({type:'answer',subject:this.data.subjects[this.data.subjectIndex%10],knowledgeId:'auto',correct:correct,durationMs:2000})
    g.energy = Math.max(0,g.energy-(correct?5:12))
    g.frustration = correct ? Math.max(0,g.frustration-1) : (g.mode==='recover'?g.frustration:g.frustration+1)
    if (g.frustration>=3){g.mode='recover';this.setData({mode:'recover'})}
    else if (g.mode==='recover'&&g.streak>=2){g.mode='learn';g.frustration=0;this.setData({mode:'learn'})}

    setTimeout(function(){
      var next = that.data.current + 1
      if (next >= that.data.total || g.energy < 10) {
        that.setData({finished:true,progress:100,current:next}); app.endSession(); return
      }
      that.setData({current:next,progress:Math.round((next/that.data.total)*100),feedbackText:'',feedbackType:'',qiuqiuAnim:'',subjectIndex:that.data.subjectIndex+1,phase:'teach'})
      that.loadQuestion()
    },2000)
  },

  confirmExit: function() {
    var that = this
    wx.showModal({title:'要休息了吗？',content:'球球明天还在这里等你哦～',confirmText:'休息一下',cancelText:'继续玩',
      success:function(res){if(res.confirm){app.endSession();wx.navigateBack()}}})
  },

  goHome: function(){wx.switchTab({url:'/pages/today/today'})},
  goReplay: function(){wx.navigateTo({url:'/pages/replay/replay'})},

  playTTS: function(text) {
    if (!text || text.length > 200) return
    if (this.ttsAudio) this.ttsAudio.destroy()
    var audio = wx.createInnerAudioContext()
    audio.src = 'http://39.105.133.219/growth/api/tts?text=' + encodeURIComponent(text)
    audio.play()
    this.ttsAudio = audio
  },
  replayTTS: function(){this.playTTS(this.data.story)},
  onUnload: function(){if(this.ttsAudio)this.ttsAudio.destroy()},
})

// Extract teaching info from question data
function getTeachInfo(data, subject) {
  // Try to parse knowledge from the knowledgeId
  var kid = data.knowledgeId || ''
  var emoji = '', main = '', sub = '', readAloud = ''

  if (subject === 'chinese') {
    // Extract char info from story/options
    var correct = (data.options||[]).find(function(o){return o.correct})
    var label = correct ? correct.label : '?'
    emoji = '📖'
    main = label.length <= 4 ? label : '?'
    sub = '认识这个字'
    readAloud = main + '，' + (data.story||'')
  } else if (subject === 'math') {
    emoji = '🔢'
    main = data.story ? data.story.replace(/[？?].*/,'') : '数一数'
    sub = '一起来数数吧'
    readAloud = main
  } else if (subject === 'english') {
    var correct = (data.options||[]).find(function(o){return o.correct})
    var label = correct ? correct.label : '?'
    emoji = '🌍'
    main = label
    sub = '学单词'
    readAloud = label + '，' + (data.story||'')
  }

  return {emoji:emoji, main:main, sub:sub, readAloud:readAloud}
}
