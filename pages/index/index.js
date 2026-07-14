// pages/index/index.js
// 白噪音哄睡 · 母婴极简风 · 配合原始组件架构

const sounds = require('../../config/sounds.js')
const app = getApp()

Page({
  data: {
    sounds: sounds,
    playingId: '',
    tips: [
      '嘘声模拟子宫噪音，0~3 个月宝宝最有效',
      '白噪音建议不超过 80dB，保护宝宝听力',
      '每次使用不超过 1 小时，避免依赖',
      '3 个月后逐步减少使用频率',
      '宝宝入睡后建议关闭，保持安静睡眠环境',
    ],
  },

  onLoad() {
    // 注册全局状态回调：app.togglePlay 后通知页面刷新播放状态
    app.globalData.onStateChange = (id) => {
      this.setData({ playingId: id || '' })
    }
  },

  onUnload() {
    // 页面卸载时清除回调，避免内存泄漏
    app.globalData.onStateChange = null
  },

  /* 哭声识别结果回调（由 cry-detector 组件触发） */
  onCryResult(e) {
    const { detail } = e
    console.log('[index] 哭声识别结果：', detail)
    // 可在此根据识别结果推荐白噪音
  },
})
