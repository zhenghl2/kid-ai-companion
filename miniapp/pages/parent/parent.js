var app = getApp()

Page({
  data: {
    todayStats: { questions: 0, correct: 0, minutes: 0 },
    timeOptions: ['10','15','20'],
    timeIndex: 1,
    eyeCare: true,
  },

  onShow: function() {
    var g = app.globalData
    this.setData({
      todayStats: Object.assign({ minutes: Math.floor((g.todayStats.questions || 0) * 3) }, g.todayStats),
      timeIndex: wx.getStorageSync('timeLimit') || 1,
      eyeCare: wx.getStorageSync('eyeCare') !== false,
    })
  },

  onTimeChange: function(e) {
    var idx = parseInt(e.detail.value)
    this.setData({ timeIndex: idx })
    wx.setStorageSync('timeLimit', idx)
  },

  onEyeCareChange: function(e) {
    this.setData({ eyeCare: e.detail.value })
    wx.setStorageSync('eyeCare', e.detail.value)
  },

  goOnboard: function() {
    wx.removeStorageSync('onboarded')
    wx.reLaunch({ url: '/pages/onboard/onboard' })
  },
})
