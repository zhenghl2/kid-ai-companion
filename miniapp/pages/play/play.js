var app = getApp()
var api = require('../../api/client')

Page({
  data: {
    progress:0, current:0, total:10,
    phase:'teach', subject:'chinese',
    teachEmoji:'', teachMain:'', teachSub:'',
    mathObjects:[],
    story:'', options:[], answered:false,
    feedbackText:'', feedbackType:'',
    finished:false, score:0, learnedCount:0,
    stars:[],
    subIdx:0,
    subjects:['chinese','math','english','chinese','math','english','chinese','math','english','chinese'],
    correctFeedback:'', gentleNudge:'',
  },

  onLoad:function(){this.nextQuestion()},

  nextQuestion:function(){
    var that=this, g=app.globalData
    var sub=this.data.subjects[this.data.subIdx%10]
    if(!g.recentIds)g.recentIds=[]

    api.getQuestion({sessionId:g.sessionId,subject:sub,childState:{energy:g.energy,frustration:g.frustration,theme:g.theme,level:g.level||1,recentIds:g.recentIds}})
    .then(function(d){
      if(d.action==='END_SESSION'){app.endSession();wx.navigateBack();return}
      g.recentIds.push(d.knowledgeId||'unknown')
      if(g.recentIds.length>15)g.recentIds.shift()

      var t=getTeach(d,sub)
      var objSize=d.objects||(d.a||0)+(d.b||0)||(d.answer||3)
      var objs=[]
      for(var i=0;i<Math.min(objSize,12);i++)objs.push(t.emoji||'🟡')

      that.setData({
        subject:sub,phase:'teach',
        teachEmoji:t.emoji,teachMain:t.main,teachSub:t.sub,
        mathObjects:objs,
        story:d.story||'',options:(d.options||[]).map(function(o,i){return{id:i,label:o.label,correct:o.correct,state:''}}),
        correctFeedback:d.correctFeedback||'对啦！',gentleNudge:d.gentleNudge||'差一点点～',
        answered:false
      })
      that.playTTS(t.readAloud)
    }).catch(function(){
      that.setData({subject:sub,phase:'quiz',story:'球球来出题啦！',options:[{id:0,label:'3',correct:true,state:''},{id:1,label:'2',correct:false,state:''},{id:2,label:'4',correct:false,state:''},{id:3,label:'1',correct:false,state:''}],answered:false})
    })
  },

  startQuiz:function(){
    this.setData({phase:'quiz'})
    this.playTTS(this.data.story)
  },

  selectOption:function(e){
    if(this.data.answered)return
    var idx=e.currentTarget.dataset.index,that=this
    var opt=this.data.options[idx]
    this.setData({answered:true})
    var opts=this.data.options.map(function(o,i){
      if(o.correct)return Object.assign({},o,{state:'correct'})
      if(i===idx)return Object.assign({},o,{state:'wrong'})
      return o
    })
    var ok=opt.correct
    this.setData({options:opts,score:this.data.score+(ok?1:0),learnedCount:this.data.learnedCount+(ok?1:0),feedbackText:ok?this.data.correctFeedback:this.data.gentleNudge,feedbackType:ok?'correct':'gentle'})

    var g=app.globalData
    g.energy=Math.max(0,g.energy-(ok?5:12))
    g.frustration=ok?Math.max(0,g.frustration-1):g.frustration+1

    setTimeout(function(){
      var n=that.data.current+1
      if(n>=that.data.total||g.energy<10){
        var stars=[]
        for(var s=0;s<that.data.score;s++)stars.push(1)
        that.setData({finished:true,progress:100,current:n,stars:stars});app.endSession();return
      }
      that.setData({current:n,progress:Math.round((n/that.data.total)*100),feedbackText:'',feedbackType:'',subIdx:that.data.subIdx+1,phase:'teach'})
      that.nextQuestion()
    },1800)
  },

  confirmExit:function(){
    var that=this
    wx.showModal({title:'要休息了吗？',content:'球球明天还在这里等你哦～',confirmText:'休息',cancelText:'继续',success:function(r){if(r.confirm){app.endSession();wx.navigateBack()}}})
  },
  goHome:function(){wx.switchTab({url:'/pages/today/today'})},
  goReplay:function(){wx.navigateTo({url:'/pages/replay/replay'})},
  playTTS:function(t){if(!t)return;if(this.tts)this.tts.destroy();var a=wx.createInnerAudioContext();a.src='http://39.105.133.219/growth/api/tts?text='+encodeURIComponent(t);a.play();this.tts=a},
  replayTTS:function(){this.playTTS(this.data.phase==='teach'?this.data.teachSub+'。'+this.data.teachMain:this.data.story)},
  onUnload:function(){if(this.tts)this.tts.destroy()},
})

function getTeach(d,sub){
  var correct=(d.options||[]).find(function(o){return o.correct})
  var label=correct?correct.label:'?'
  if(sub==='chinese'){
    return{emoji:'🐼',main:label,sub:(label+'字').replace('字字','字'),readAloud:'这是'+label+'字'}
  }
  if(sub==='math'){
    var story=d.story||''
    return{emoji:'🟡',main:story.replace(/[？?].*/,''),sub:'数一数',readAloud:story}
  }
  if(sub==='english'){
    return{emoji:'🌍',main:label,sub:'英语单词',readAloud:label}
  }
  return{emoji:'⭐',main:'准备好了吗？',sub:'',readAloud:'准备好了吗？'}
}
