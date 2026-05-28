var app = getApp()
var api = require('../../api/client')

Page({
  data: {
    title: '晚安故事',
    paragraphs: ['正在为乐乐准备今晚的故事...'],
    showEnd: false,
  },

  onLoad: function() {
    this.generateStory()
  },

  generateStory: function() {
    var that = this
    var g = app.globalData
    api.getStory({
      childName: g.childName || '乐乐',
      todayLearned: [{ char:'鱼' }, { math:'2+1' }, { word:'cat' }],
      interests: ['恐龙','海洋'],
    }).then(function(data) {
      that.setData({
        title: data.title || '晚安故事',
        paragraphs: data.paragraphs || ['今天真开心。','星星出来了，该睡觉啦。','晚安～'],
      })
      setTimeout(function() { that.setData({ showEnd: true }) }, 5000)
    }).catch(function() {
      that.setData({
        paragraphs: ['今天真开心。','星星出来了，该睡觉啦。','晚安～'],
      })
      setTimeout(function() { that.setData({ showEnd: true }) }, 3000)
    })
  },

  onUnload: function() {
    // 渐暗效果结束
  },
})
