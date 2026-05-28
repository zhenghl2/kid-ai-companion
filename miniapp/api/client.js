// API 请求封装
var BASE_URL = 'http://39.105.133.219/growth/api'

function request(options) {
  return new Promise(function(resolve, reject) {
    wx.request({
      url: BASE_URL + options.url,
      method: options.method || 'GET',
      data: options.data || {},
      header: { 'Content-Type': 'application/json' },
      success: function(res) {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data)
        } else {
          reject(new Error(res.data?.error || 'Request failed'))
        }
      },
      fail: function() {
        reject(new Error('Network error'))
      },
    })
  })
}

module.exports = {
  // Session
  startSession: function(childName) {
    return request({ url: '/session/start', method: 'POST', data: { childName: childName } })
  },
  endSession: function(sessionId, energyEnd) {
    return request({ url: '/session/end', method: 'POST', data: { sessionId: sessionId, energyEnd: energyEnd } })
  },

  // Question
  getQuestion: function(data) {
    return request({ url: '/question', method: 'POST', data: data })
  },

  // Forest
  getForest: function() {
    return request({ url: '/forest' })
  },

  // Story
  getStory: function(data) {
    return request({ url: '/story', method: 'POST', data: data })
  },

  // Event
  postEvent: function(data) {
    return request({ url: '/event', method: 'POST', data: data })
  },

  // Summary
  getSummary: function(sessionId) {
    return request({ url: '/summary', method: 'POST', data: { sessionId: sessionId } })
  },

  // Replay
  getReplay: function(sessionId) {
    return request({ url: '/replay/' + sessionId })
  },
}
