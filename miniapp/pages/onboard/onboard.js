Page({
  data: {
    childName: '',
    birthday: '',
    ageLabel: '',
    today: '',
  },

  onLoad: function() {
    var now = new Date()
    this.setData({ today: now.getFullYear()+'-'+String(now.getMonth()+1).padStart(2,'0')+'-'+String(now.getDate()).padStart(2,'0') })
  },

  onNameInput: function(e) {
    this.setData({ childName: e.detail.value })
  },

  onDateChange: function(e) {
    var bday = e.detail.value
    var age = this.calcAge(bday)
    this.setData({ birthday: bday, ageLabel: age + ' (' + (age <= 4 ? '中班' : '大班') + ')' })
  },

  calcAge: function(bday) {
    var now = new Date()
    var b = new Date(bday)
    var age = now.getFullYear() - b.getFullYear()
    if (now.getMonth() < b.getMonth() || (now.getMonth() === b.getMonth() && now.getDate() < b.getDate())) age--
    return age
  },

  startJourney: function() {
    if (!this.data.childName.trim()) return
    wx.setStorageSync('childName', this.data.childName.trim())
    wx.setStorageSync('birthday', this.data.birthday)
    wx.setStorageSync('onboarded', true)
    wx.reLaunch({ url: '/pages/today/today' })
  },
})
