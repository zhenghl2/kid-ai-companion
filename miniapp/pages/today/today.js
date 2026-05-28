var app = getApp()
var api = require('../../api/client')

Page({
  data: {
    greeting: '早上好！',
    costume: 'explorer',
    themeName: '恐龙世界',
    themeColor: '#4CAF50',
    narrativeIntro: '欢迎来到恐龙世界！三角龙需要你的帮助～',
    trees: [],
    energy: 100,
  },

  onLoad: function() {
    this.loadSession()
  },

  onShow: function() {
    if (app.globalData.sessionId) {
      this.updateFromGlobal()
    }
  },

  loadSession: function() {
    var that = this
    app.startSession(function(err, data) {
      if (data) {
        that.updateFromGlobal()
      }
    })
  },

  updateFromGlobal: function() {
    var g = app.globalData
    var themeMap = {
      ocean:    { name:'海洋探险', color:'#2196F3', costume:'diver' },
      dinosaur: { name:'恐龙世界', color:'#4CAF50', costume:'explorer' },
      car:      { name:'汽车总动员', color:'#FF9800', costume:'goggles' },
      forest:   { name:'森林奇遇', color:'#8BC34A', costume:'leaf_hat' },
      home:     { name:'我家的一天', color:'#FF5722', costume:'apron' },
    }
    var t = themeMap[g.theme] || themeMap.ocean

    var treeIcons = { chinese:'📖', math:'🔢', english:'🌍' }
    var treeNames = { chinese:'语文', math:'数学', english:'英语' }
    var trees = []
    if (g.forest && g.forest.trees) {
      for (var k in g.forest.trees) {
        trees.push(Object.assign({ emoji: treeIcons[k], name: treeNames[k] }, g.forest.trees[k]))
      }
    }

    this.setData({
      greeting: g.greeting || '早上好！',
      costume: t.costume,
      themeName: t.name,
      themeColor: t.color,
      narrativeIntro: g.narrativeIntro || '欢迎！',
      trees: trees,
      energy: g.energy || 100,
    })
  },

  startPlay: function() {
    wx.navigateTo({ url: '/pages/play/play' })
  },

  goStory: function() {
    wx.navigateTo({ url: '/pages/story/story' })
  },
})
