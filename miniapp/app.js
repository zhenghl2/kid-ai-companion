// 球球的成长森林 — 入口文件
var BASE_URL = 'http://39.105.133.219/growth/api'

App({
  globalData: {
    baseUrl: BASE_URL,
    sessionId: '',
    childName: '乐乐',
    theme: 'ocean',
    energy: 100,
    level: 1,
    frustration: 0,
    streak: 0,
    mode: 'learn',
    masteredIds: [],
    forest: null,
    todayStats: { questions: 0, correct: 0 },
  },

  onLaunch: function() {
    var onboarded = wx.getStorageSync('onboarded')
    if (!onboarded) {
      wx.reLaunch({ url: '/pages/onboard/onboard' })
    }
  },

  startSession: function(cb) {
    var that = this
    var name = wx.getStorageSync('childName') || '乐乐'
    wx.request({
      url: BASE_URL + '/session/start',
      method: 'POST',
      data: { childName: name },
      success: function(res) {
        if (res.data && res.data.sessionId) {
          that.globalData.sessionId = res.data.sessionId
          that.globalData.theme = res.data.theme
          that.globalData.energy = res.data.energy || 100
          that.globalData.forest = res.data.forest
          if (cb) cb(null, res.data)
        }
      },
      fail: function(err) { if (cb) cb(err) }
    })
  },

  postEvent: function(event) {
    wx.request({
      url: BASE_URL + '/event',
      method: 'POST',
      data: Object.assign({
        sessionId: this.globalData.sessionId,
        energyBefore: this.globalData.energy,
        energyAfter: this.globalData.energy,
        frustration: this.globalData.frustration,
      }, event),
    })
  },

  endSession: function() {
    wx.request({
      url: BASE_URL + '/session/end',
      method: 'POST',
      data: { sessionId: this.globalData.sessionId, energyEnd: this.globalData.energy },
    })
  },
})
