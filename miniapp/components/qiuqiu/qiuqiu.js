// components/qiuqiu/qiuqiu.js
Component({
  properties: {
    mood: { type: String, value: 'happy' },    // happy|wink|worry|sleepy|surprise|encourage|default
    size: { type: String, value: 'md' },        // sm|md|lg
    text: { type: String, value: '' },           // 气泡文字
    costume: { type: String, value: '' },        // diver|explorer|goggles|leaf_hat|apron
    anim: { type: String, value: '' },           // jump|wave|spin|flip|yawn
  },

  data: {
    animClass: '',
  },

  observers: {
    'anim': function(val) {
      if (val) {
        this.setData({ animClass: 'anim-' + val })
        var that = this
        setTimeout(function() { that.setData({ animClass: '' }) }, 800)
      }
    }
  },
})
