var app = getApp()
var api = require('../../api/client')

Page({
  data: {
    qiuqiuMood: 'happy',
    qiuqiuAnim: '',
    progress: 0,
    current: 0,
    total: 5,
    story: '',
    options: [],
    showingOptions: false,
    feedbackText: '',
    feedbackType: '',
    mode: 'learn',
    finished: false,
    score: 0,
    answered: false,
    subjectIndex: 0,
    subjects: ['math','chinese','english'],
  },

  onLoad: function() {
    this.loadQuestion()
  },

  loadQuestion: function() {
    var that = this
    var g = app.globalData
    var subject = this.data.subjects[this.data.subjectIndex % 3]

    api.getQuestion({
      sessionId: g.sessionId,
      subject: subject,
      childState: {
        energy: g.energy,
        frustration: g.frustration,
        theme: g.theme,
        level: g.level || 1,
      }
    }).then(function(data) {
      if (data.action === 'END_SESSION' || data.action === 'STORY_MODE') {
        that.setData({ finished: true, score: that.data.score })
        app.endSession()
        return
      }

      that.setData({
        story: data.story || '准备好了吗？',
        options: data.options.map(function(o, i) { return { id:i, label:o.label, correct:o.correct, state:'' } }),
        correctFeedback: data.correctFeedback || '对啦！',
        gentleNudge: data.gentleNudge || '差一点点～',
        answered: false,
        showingOptions: false,
        qiuqiuMood: 'happy',
      })

      // 自动朗读题目
      that.playTTS(data.story)

      // 固定节奏：3s 后显示选项
      setTimeout(function() { that.setData({ showingOptions: true }) }, 3000)
    }).catch(function() {
      // 降级
      that.setData({
        story: '球球来出题啦！',
        options: [
          { id:0, label:'3', correct:true, state:'' },
          { id:1, label:'2', correct:false, state:'' },
          { id:2, label:'4', correct:false, state:'' },
          { id:3, label:'1', correct:false, state:'' },
        ],
        answered: false, showingOptions: true,
      })
    })
  },

  selectOption: function(e) {
    if (this.data.answered) return
    var idx = e.currentTarget.dataset.index
    var opt = this.data.options[idx]
    var that = this

    this.setData({ answered: true })

    // 标记正确/错误
    var options = this.data.options.map(function(o, i) {
      if (o.correct) return Object.assign({}, o, { state: 'correct' })
      if (i === idx && !o.correct) return Object.assign({}, o, { state: 'wrong' })
      return o
    })

    var isCorrect = opt.correct
    var newScore = this.data.score + (isCorrect ? 1 : 0)

    this.setData({
      options: options,
      score: newScore,
      feedbackText: isCorrect ? this.data.correctFeedback : this.data.gentleNudge,
      feedbackType: isCorrect ? 'correct' : 'gentle',
      qiuqiuMood: isCorrect ? 'happy' : 'wink',
      qiuqiuAnim: isCorrect ? 'jump' : 'wave',
    })

    // 上报事件
    var g = app.globalData
    app.postEvent({
      type: 'answer',
      subject: this.data.subjects[this.data.subjectIndex % 3],
      knowledgeId: 'auto',
      correct: isCorrect,
      durationMs: 2000,
    })

    // 更新状态
    g.streak = isCorrect ? (g.streak + 1) : 0
    g.frustration = isCorrect ? Math.max(0, g.frustration - 1) : (g.mode === 'recover' ? g.frustration : g.frustration + 1)
    g.energy = Math.max(0, g.energy - (isCorrect ? 5 : 12))
    g.todayStats.questions++
    if (isCorrect) g.todayStats.correct++

    // 恢复模式判断
    if (g.frustration >= 3) {
      g.mode = 'recover'
      this.setData({ mode: 'recover' })
    } else if (g.mode === 'recover' && g.streak >= 2) {
      g.mode = 'learn'
      g.frustration = 0
      this.setData({ mode: 'learn' })
    }

    // 下一题
    setTimeout(function() {
      var next = that.data.current + 1
      if (next >= that.data.total || g.energy < 10) {
        // 完成
        that.setData({ finished: true, progress: 100, current: next })
        app.endSession()
        return
      }
      that.setData({
        current: next,
        progress: Math.round((next / that.data.total) * 100),
        feedbackText: '',
        feedbackType: '',
        qiuqiuAnim: '',
        subjectIndex: that.data.subjectIndex + 1,
        showingOptions: false,
      })
      that.loadQuestion()
    }, 2000)
  },

  confirmExit: function() {
    var that = this
    wx.showModal({
      title: '要休息了吗？',
      content: '球球明天还在这里等你哦～',
      confirmText: '休息一下',
      cancelText: '继续玩',
      success: function(res) {
        if (res.confirm) { app.endSession(); wx.navigateBack() }
      }
    })
  },

  goHome: function() { wx.switchTab({ url: '/pages/today/today' }) },
  goReplay: function() { wx.navigateTo({ url: '/pages/replay/replay' }) },

  // 语音朗读
  playTTS: function(text) {
    if (!text) return
    if (this.ttsAudio) { this.ttsAudio.destroy() }
    var audio = wx.createInnerAudioContext()
    audio.src = 'http://39.105.133.219/growth/api/tts?text=' + encodeURIComponent(text)
    audio.play()
    this.ttsAudio = audio
  },

  replayTTS: function() {
    this.playTTS(this.data.story)
  },

  onUnload: function() {
    if (this.ttsAudio) { this.ttsAudio.destroy() }
  },
})
