// components/cry-detector/cry-detector.js
// 婴儿哭声识别组件：录音 → base64 → 调 FC → 展示结果
const app = getApp()

const RECODER_DURATION = 5000   // 录音时长（ms），固定 5 秒
const REQUEST_TIMEOUT = 60000   // FC 请求超时（ms），60s 兼容冷启动

Component({
  options: {
    multipleSlots: false,
  },

  data: {
    // 状态机：idle | recording | loading | result | error
    status: 'idle',
    // 倒计时数字（5 → 0）
    countdown: 5,
    // 结果对象
    result: null,
    // 错误文案
    errorMsg: '',
    // 详细错误（用于排查）
    errorDetail: '',
  },

  lifetimes: {
    detached() {
      this._clearTimers()
      // 组件销毁时确保录音停止
      if (this._recorder) {
        try { this._recorder.stop() } catch (e) {}
      }
    },
  },

  methods: {
    // ====== IDLE → 开始录音 ======
    onStartRecord() {
      // 0. 权限检查
      this._checkRecordAuth()
        .then(() => this._doStartRecord())
        .catch((err) => this._toError(err))
    },

    _checkRecordAuth() {
      return new Promise((resolve, reject) => {
        wx.getSetting({
          success: (res) => {
            if (res.authSetting['scope.record']) {
              resolve()
            } else {
              wx.authorize({
                scope: 'scope.record',
                success: () => resolve(),
                fail: () => reject('需要您授权麦克风权限'),
              })
            }
          },
          fail: () => reject('权限检查失败'),
        })
      })
    },

    _doStartRecord() {
      // 0. 防重入：录音中再次触发直接忽略（避免热重载/连点导致 setInterval 叠加）
      if (this.data.status === 'recording' || this.data.status === 'loading') {
        return
      }

      // 1. 暂停白噪音
      app.pauseAudioForRecord()

      // 2. 初始化录音器（如果不存在）
      if (!this._recorder) {
        this._initRecorder()
      }

      // 3. 启动前先清理任何残留定时器（防止旧 setInterval 仍在跑）
      this._clearCountdown()

      // 4. 状态切到 recording，countdown 用真实时间戳计算
      this._countdownStartAt = Date.now()
      this.setData({ status: 'recording', countdown: 5, errorMsg: '' })

      // 5. 启动倒计时（基于真实经过时间，避免 setInterval 漂移/叠加）
      this._tickCountdown()

      // 6. 开始录音（encodeBitRate 必须 ≥ 64000）
      try {
        this._recorder.start({
          duration: RECODER_DURATION,
          sampleRate: 44100,
          numberOfChannels: 1,
          format: 'mp3',
          encodeBitRate: 96000,  // 96kbps，mp3 格式要求 64000~320000
        })
      } catch (e) {
        this._toError('录音启动失败：' + (e.errMsg || e.message || ''))
      }
    },

    // 倒计时：每次 setTimeout 200ms 重算一次，按真实经过时间显示
    _tickCountdown() {
      const elapsed = Date.now() - this._countdownStartAt
      const remaining = Math.max(0, Math.ceil((RECODER_DURATION - elapsed) / 1000))
      if (remaining !== this.data.countdown) {
        this.setData({ countdown: remaining })
      }
      if (remaining > 0 && this.data.status === 'recording') {
        this._countdownTimer = setTimeout(() => this._tickCountdown(), 200)
      } else {
        this._countdownTimer = null
      }
    },

    _initRecorder() {
      const recorder = wx.getRecorderManager()
      this._recorder = recorder

      // 录音正常结束（5s 到）
      recorder.onStop((res) => {
        this._clearCountdown()
        // 文件太小说明录音过短
        if (!res.tempFilePath || (res.fileSize && res.fileSize < 1000)) {
          this._toError('录音太短，请重试')
          return
        }
        this._sendToFC(res.tempFilePath)
      })

      // 录音异常
      recorder.onError((err) => {
        console.error('录音错误', err)
        this._clearCountdown()
        this._toError('录音失败：' + (err.errMsg || '未知错误'))
      })

      // 系统中断（来电等）
      recorder.onInterruptionBegin(() => {
        this._clearCountdown()
        this._toError('录音被中断')
      })
    },

    // ====== RECORDING → 取消录音 ======
    onCancelRecord() {
      if (this._recorder) {
        try { this._recorder.stop() } catch (e) {}
      }
      this._clearCountdown()
      this.setData({ status: 'idle' })
    },

    // ====== 发送音频到 FC ======
    _sendToFC(tempFilePath) {
      // 切到 loading
      this.setData({ status: 'loading' })

      // 1. 文件转 base64
      let audioB64
      try {
        const fs = wx.getFileSystemManager()
        const buffer = fs.readFileSync(tempFilePath)
        audioB64 = wx.arrayBufferToBase64(buffer)
      } catch (e) {
        return this._toError('音频读取失败')
      }

      // 2. 检查 fcUrl
      const url = app.globalData.fcUrl
      if (!url) {
        return this._toError('FC URL 未配置，请在 app.js 填写')
      }

      // 3. 发起请求（带超时处理）
      this._requestTimer = setTimeout(() => {
        this._toError('请求超时，请检查网络后重试')
      }, REQUEST_TIMEOUT)

      wx.request({
        url: url,
        method: 'POST',
        header: { 'Content-Type': 'application/json' },
        data: { audio: audioB64 },
        timeout: REQUEST_TIMEOUT,
        success: (res) => {
          this._clearRequestTimer()
          if (res.statusCode === 200 && res.data && res.data.result) {
            this._toResult(res.data)
          } else {
            const detail = (res.data && (res.data.error || res.data.message)) || `HTTP ${res.statusCode}`
            this._toError(detail, `状态码: ${res.statusCode}`)
          }
        },
        fail: (e) => {
          this._clearRequestTimer()
          this._toError('网络错误：' + (e.errMsg || '请检查网络'), e.errMsg || '')
        },
      })
    },

    // ====== LOADING → RESULT ======
    _toResult(data) {
      const cats = app.globalData.cryCategories
      const cat = cats[data.result]
      if (!cat) {
        return this._toError('识别结果未知：' + data.result)
      }
      const confidence = data.confidence || 0
      const threshold = app.globalData.cryLowConfidenceThreshold
      const lowConfidence = confidence < threshold

      let confidenceClass = 'is-mid'
      if (confidence >= 0.7) confidenceClass = 'is-high'
      else if (confidence < threshold) confidenceClass = 'is-low'

      this.setData({
        status: 'result',
        result: {
          emoji: cat.emoji,
          name: cat.name,
          tip: cat.tip,
          confidence: confidence,
          confidenceText: Math.round(confidence * 100) + '%',
          confidenceClass: confidenceClass,
          lowConfidence: lowConfidence,
        },
      })
    },

    // ====== 任意 → ERROR ======
    _toError(msg, detail) {
      this.setData({
        status: 'error',
        errorMsg: msg || '出错了',
        errorDetail: detail || '',
      })
    },

    // ====== ERROR/RESULT → IDLE ======
    onReset() {
      this.setData({
        status: 'idle',
        result: null,
        errorMsg: '',
      })
    },

    // ====== 工具方法 ======
    _clearCountdown() {
      if (this._countdownTimer) {
        clearTimeout(this._countdownTimer)
        this._countdownTimer = null
      }
    },

    _clearRequestTimer() {
      if (this._requestTimer) {
        clearTimeout(this._requestTimer)
        this._requestTimer = null
      }
    },

    _clearTimers() {
      this._clearCountdown()
      this._clearRequestTimer()
    },
  },
})
