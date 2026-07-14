// config/sounds.js
// 白噪音配置：加新声音只需要在数组里加一项，UI 自动出现
// 注意：
//   1. id 必须唯一
//   2. name 显示在方块上
//   3. icon 是图片路径（支持本地相对路径或远程 URL）
//   4. url 必须在小程序 downloadFile 白名单中可直连
//   5. 文件名带空格已用 %20 编码（URL 安全）
//
// 图标说明：
//   - 16 个灰度线性风 PNG（64x64，统一风格）
//   - 默认状态 CSS 渲染为 --text 色
//   - 播放中状态 CSS 渲染为白色（背景是粉色渐变）
//   - 图片用本地路径，不依赖网络

const BASE = 'https://XXX.oss-cn-XXX.aliyuncs.com/XXX/'

// 本地图标根目录（小程序包内）
const ICON = '/images/sound-icons/'

module.exports = [
  { id: 'fan1',         name: '风扇 1',   icon: ICON + 'fan.png',          url: BASE + 'FAN1.mp3' },
  { id: 'fan2',         name: '风扇 2',   icon: ICON + 'fan.png',          url: BASE + 'FAN2.mp3' },
  { id: 'hairDryer1',   name: '吹风机 1', icon: ICON + 'hair-dryer.png',   url: BASE + 'hair%20dryer1.mp3' },
  { id: 'hairDryer2',   name: '吹风机 2', icon: ICON + 'hair-dryer.png',   url: BASE + 'hair%20dryer2.mp3' },
  { id: 'hairDryer3',   name: '吹风机 3', icon: ICON + 'hair-dryer.png',   url: BASE + 'hair%20dryer3.mp3' },
  { id: 'hairDryer4',   name: '吹风机 4', icon: ICON + 'hair-dryer.png',   url: BASE + 'hair%20dryer4.mp3' },
  { id: 'mosquito',     name: '蚊子',     icon: ICON + 'mosquito.png',     url: BASE + 'mosquito.mp3' },
  { id: 'plasticBag1',  name: '塑料袋 1', icon: ICON + 'plastic-bag.png',  url: BASE + 'plastic%20bag1.mp3' },
  { id: 'plasticBag2',  name: '塑料袋 2', icon: ICON + 'plastic-bag.png',  url: BASE + 'plastic%20bag2.mp3' },
  { id: 'rangeHood',    name: '抽油烟机', icon: ICON + 'range-hood.png',   url: BASE + 'range%20hood.mp3' },
  { id: 'renovation',   name: '装修噪音', icon: ICON + 'renovation.png',  url: BASE + 'renovation.mp3' },
  { id: 'shh1',         name: '嘘声 1',   icon: ICON + 'shh.png',          url: BASE + 'shh1.mp3' },
  { id: 'shh2',         name: '嘘声 2',   icon: ICON + 'shh.png',          url: BASE + 'shh2.mp3' },
  { id: 'vacuum1',      name: '吸尘器 1', icon: ICON + 'vacuum.png',       url: BASE + 'vacuum1.mp3' },
  { id: 'vacuum2',      name: '吸尘器 2', icon: ICON + 'vacuum.png',       url: BASE + 'vacuum2.mp3' },
  { id: 'brownNoise',   name: '棕色噪音', icon: ICON + 'brown-noise.png',  url: BASE + 'Brown%20noise.mp3' },
]
