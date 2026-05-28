var app = getApp()
var api = require('../../api/client')

Page({
  data: {
    themeName: '今日冒险',
    summary: '今天玩得很开心！',
    items: [],
    tip: '',
  },

  onLoad: function() {
    var g = app.globalData
    var themeMap = { ocean:'🌊 海洋探险', dinosaur:'🦖 恐龙世界', car:'🚗 汽车总动员', forest:'🌳 森林奇遇', home:'🏠 我家的一天' }

    this.setData({ themeName: themeMap[g.theme] || '今日冒险' })

    if (g.sessionId) {
      var that = this
      api.getSummary(g.sessionId).then(function(data) {
        that.setData({
          summary: data.insight || '今天玩得很开心！',
          tip: data.tip || '晚饭时问问孩子今天认识了什么新朋友～',
          items: data.items || [],
        })
      })
    }
  },

  shareReplay: function() {
    // 微信分享
  },
})
