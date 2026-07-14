// components/sound-card/sound-card.js
const app = getApp()

Component({
  options: {
    multipleSlots: false,
  },

  properties: {
    // 当前白噪音数据：{ id, name, icon, url }
    sound: {
      type: Object,
      value: {},
    },
    // 是否正在播放（由父组件控制）
    playing: {
      type: Boolean,
      value: false,
    },
  },

  methods: {
    onTap() {
      // 触发全局切换播放
      app.togglePlay(this.data.sound)
      // 父组件会通过 onStateChange 回调更新所有 card 的 playing 状态
    },
  },
})
