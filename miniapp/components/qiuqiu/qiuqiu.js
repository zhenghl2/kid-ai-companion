// components/qiuqiu/qiuqiu.js
var FACES = {
  happy:     '\ud83d\ude04',  // 😄
  wink:      '\ud83d\ude09',  // 😉
  worry:     '\ud83d\ude1f',  // 😟
  sleepy:    '\ud83d\ude34',  // 😴
  surprise:  '\ud83d\ude32',  // 😲
  encourage: '\ud83d\udc4d',  // 👍
  default:   '\ud83d\ude03',  // 😃
}

Component({
  properties: {
    mood: { type: String, value: 'happy' },
    size: { type: String, value: 'md' },
    text: { type: String, value: '' },
    anim: { type: String, value: '' },
  },

  data: {
    faceEmoji: '\ud83d\ude04',
    animClass: '',
  },

  attached: function() {
    this.updateFace()
  },

  observers: {
    'mood': function(val) {
      this.updateFace()
    },
    'anim': function(val) {
      if (val) {
        this.setData({ animClass: 'anim-' + val })
        var that = this
        setTimeout(function() { that.setData({ animClass: '' }) }, 800)
      }
    }
  },

  methods: {
    updateFace: function() {
      this.setData({ faceEmoji: FACES[this.properties.mood] || FACES.default })
    }
  }
})
