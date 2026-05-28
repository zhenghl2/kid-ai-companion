Page({
  data: {
    stickers: [
      { id:1, icon:'🐟', name:'海洋贴纸', condition:'学5个汉字', unlocked:false },
      { id:2, icon:'🦖', name:'恐龙贴纸', condition:'学5个单词', unlocked:false },
      { id:3, icon:'🚗', name:'汽车贴纸', condition:'5以内加法', unlocked:false },
      { id:4, icon:'🌈', name:'彩虹贴纸', condition:'连续3天', unlocked:false },
      { id:5, icon:'⭐', name:'星星贴纸', condition:'连续7天', unlocked:false },
      { id:6, icon:'🎁', name:'神秘礼物', condition:'集齐3张贴纸', unlocked:false },
    ],
  },
  onLoad: function() {
    // 从本地存储读取解锁状态
    var unlocked = wx.getStorageSync('unlockedStickers') || []
    var stickers = this.data.stickers.map(function(s) {
      return Object.assign({}, s, { unlocked: unlocked.indexOf(s.id) >= 0 })
    })
    this.setData({ stickers: stickers })
  },
})
