// app.js
// 全局音频管理器：用 BackgroundAudioManager 才能支持锁屏/后台播放
const sounds = require('./config/sounds.js')

App({
  globalData: {
    audio: null,        // 全局唯一的背景音频实例
    currentId: null,    // 当前正在播放的白噪音 id
    sounds: sounds,     // 白噪音配置

    // ====== 哭声识别配置 ======
    fcUrl: 'https://XXX.cn-hangzhou.fcapp.run',  // 哭声识别 FC 入口（部署时替换）
    cryCategories: {
      awake:         { name: '清醒',   emoji: '👀', tip: '宝宝精神很好，可以陪他玩会儿' },
      diaper:        { name: '尿布湿', emoji: '🧷', tip: '检查一下是不是该换尿布了' },
      hug:           { name: '要抱',   emoji: '🤗', tip: '抱抱宝宝，给他安全感' },
      hungry:        { name: '饿',     emoji: '🍼', tip: '该喂奶了' },
      sleepy:        { name: '困',     emoji: '😴', tip: '哄宝宝睡觉吧' },
      uncomfortable: { name: '不舒服', emoji: '😣', tip: '看看是不是哪里不舒服' },
    },
    cryLowConfidenceThreshold: 0.4,  // 置信度低于此值提示"识别不确定"
  },

  onLaunch() {
    const audio = wx.getBackgroundAudioManager()
    this._switching = false  // 是否正在切歌（用于忽略中间态的 onStop）

    // 兜底：自然播放结束时的循环
    audio.onEnded(() => {
      try {
        audio.seek(0)
        audio.play()
      } catch (e) {
        console.error('循环播放失败', e)
      }
    })

    // 关键优化：快到结尾时主动 seek(0)，避免 onEnded 的重新加载空档
    audio.onTimeUpdate(() => {
      if (this._switching) return
      if (!audio.duration || !audio.currentTime) return
      const remaining = audio.duration - audio.currentTime
      if (remaining > 0 && remaining < 0.15) {
        audio.seek(0)
      }
    })

    // 监听系统中断（如来电）或用户主动 stop
    audio.onStop(() => {
      if (this._switching) return
      this.globalData.currentId = null
      this._notify(null)
    })

    // 播放错误
    audio.onError((err) => {
      console.error('音频播放错误', err)
      wx.showToast({ title: '播放失败', icon: 'none' })
      this.globalData.currentId = null
      this._notify(null)
    })

    this.globalData.audio = audio
  },

  /**
   * 切换播放：同 ID 暂停，不同 ID 切换
   */
  togglePlay(sound) {
    const audio = this.globalData.audio
    const { id, url, name } = sound

    if (this.globalData.currentId === id) {
      audio.pause()
      this.globalData.currentId = null
      this._notify(null)
      return
    }

    this._switching = true
    audio.stop()
    audio.title = name
    audio.epname = '白噪音哄睡'
    audio.singer = 'whitenoises'
    audio.coverImgUrl = ''
    audio.src = url
    audio.play()
    this.globalData.currentId = id
    this._notify(id)

    setTimeout(() => {
      this._switching = false
    }, 200)
  },

  // 通知页面更新 UI
  _notify(id) {
    if (this.globalData.onStateChange) {
      this.globalData.onStateChange(id)
    }
  },

  // ====== 哭声识别协调：录音时暂停白噪音 ======

  /** 录音开始时调用：暂停白噪音 */
  pauseAudioForRecord() {
    const audio = this.globalData.audio
    if (!audio) return
    if (this.globalData.currentId) {
      this._savedCurrentId = this.globalData.currentId
      audio.pause()
    }
  },

  /** 录音结束（无论结果）时调用：恢复白噪音（仅恢复状态，不自动 play） */
  resumeAudioAfterRecord() {
    // 用户决定要不要恢复，这里不做自动恢复
  },
})
