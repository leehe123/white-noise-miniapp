// components/tips-marquee/tips-marquee.js
// CSS 动画实现 marquee，无需 JS 驱动
Component({
  options: {
    multipleSlots: false,
  },

  properties: {
    // 提示文案数组
    tips: {
      type: Array,
      value: [
        '贴近宝宝耳朵效果更佳',
        '建议音量低于 50 分贝',
        '连续使用 30 分钟建议休息',
        '使用前请关闭房间其他噪音',
        '宝宝安静后请关闭白噪音',
        '本应用不能替代专业医疗建议',
      ],
    },
    // 滚动一圈的秒数（越大越慢）
    duration: {
      type: Number,
      value: 20,
    },
  },

  data: {},
})
