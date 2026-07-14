# 白噪音哄睡 — 微信小程序

> 帮助小月龄宝宝安静下来的白噪音工具 + 婴儿哭声 AI 识别

---

## 简介
![Uploading e9b6ece2140523316d65365f7e1fd3e1.jpg…]()

这是一款面向 0~3 岁宝宝家长的**纯前端微信小程序**，包含两大核心功能：

1. **白噪音播放** — 16 种常见白噪音（风扇声、吹风机、塑料袋声、棕色噪音等），无间歇循环播放，支持锁屏后台播放，适合哄睡场景
2. **婴儿哭声识别** — 录制 5 秒宝宝哭声，调用阿里云函数计算（FC）上部署的 AI 模型，识别 6 种哭声类别（饿、困、要抱、尿布湿、清醒、不舒服），并给出对应建议

---

## 功能

- **16 个白噪音方块** — 自动 4×4 网格排列，每种声音独立控制
- **无间隙循环播放** — 快到结尾自动 seek(0)，避免停顿
- **锁屏后台播放** — 使用 `wx.getBackgroundAudioManager()`，锁屏或切到后台仍可播放
- **顶部滚动 tips** — 纯 CSS 动画匀速滚动，边缘渐变淡出
- **录音倒计时** — 基于真实时间戳的 5 秒倒计时，稳定不漂移
- **AI 哭声识别** — 录音 → base64 编码 → POST 调 FC → 展示结果
- **6 类结果展示** — 类别名称 + 置信度 + 建议文案，低置信度提示"识别不确定"
- **录音时自动暂停白噪音** — 不影响录音质量

---

## 技术栈

| 层 | 技术 |
|---|---|
| 前端 | 微信小程序原生（WXML + WXSS + JS） |
| 音频播放 | `wx.getBackgroundAudioManager()` |
| 录音 | `wx.getRecorderManager()` |
| 音频存储 | 阿里云 OSS（公有读） |
| AI 推理 | 阿里云函数计算 FC（HTTP 触发器） |
| 模型 | ExtraTreesClassifier（scikit-learn） |
| 音频特征 | librosa（MFCC + Chroma + Spectral Contrast + 等） |

---

## 项目结构

```
miniprogram/
├── app.js                  # 全局逻辑：音频管理、FC 配置、类别映射
├── app.json                # 全局配置（含后台音频权限）
├── app.wxss                # 全局样式 token（莫兰迪色系）
├── config/
│   └── sounds.js           # 白噪音配置（16 个声音的 ID/名称/图标/URL）
├── components/
│   ├── navigation-bar/     # 自定义导航栏
│   ├── tips-marquee/       # 顶部滚动 tips（纯 CSS 动画）
│   ├── sound-card/         # 白噪音方块（含播放态呼吸动画）
│   └── cry-detector/       # 哭声识别组件（5 状态机）
├── pages/
│   └── index/
│       ├── index.wxml      # 主页面布局
│       ├── index.wxss      # 页面样式
│       └── index.js        # 页面逻辑
├── images/
│   └── sound-icons/        # 白噪音方块图标（需自行替换）
├── SPEC.md                 # FC 接口约定
├── WECHAT_MINIPROGRAM_AI_REQUIREMENTS.md  # 前端需求文档
└── project.config.json     # 项目配置（AppID 需替换）
```

---

## 哭声识别模型

### 技术参数

| 项目 | 说明 |
|---|---|
| 模型类型 | `ExtraTreesClassifier`（n_estimators=300） |
| 特征维度 | 282 维（MFCC 40×3 + Chroma 12 + Contrast 7 + Centroid 2 + ZCR 2） |
| 训练数据 | 918 条原始样本 → 2876 条 5 秒段 → 8628 条（含数据增强） |
| 数据增强 | 白噪声、音量抖动、时间平移 |
| 测试集准确率 | 88.6% |
| 5 折交叉验证 | 0.841 ± 0.004 |
| 6 类 F1 score | 0.86 ~ 0.93 |
| 模型大小 | 200.5 MB |

### 6 种类别

| 类别 | 中文 | 建议 |
|---|---|---|
| `awake` | 清醒 | 陪宝宝说说话，玩一玩 |
| `diaper` | 尿布湿 | 检查一下尿布 |
| `hug` | 要抱 | 抱一抱宝宝，给他安全感 |
| `hungry` | 饿 | 该喂奶了 |
| `sleepy` | 困 | 哄宝宝睡觉吧 |
| `uncomfortable` | 不舒服 | 检查宝宝是否过热或过冷 |

### 部署方式

模型部署在阿里云函数计算（FC），Python 3.10 运行时，依赖：

- `librosa==0.11.0` — 音频特征提取
- `scikit-learn==1.3.0` — 模型加载与推理
- `joblib==1.3.0` — 模型序列化
- `numpy==1.26.4` — 数值计算
- `soundfile==0.12.1` — 音频 I/O
- `numba==0.59.1` — JIT 加速
- `coverage==4.5.4` — numba 兼容依赖

### 数据集

原始数据来自百度飞桨 AI Studio：
- [婴儿哭声识别数据集](https://aistudio.baidu.com/datasetdetail/161639)
- 包含 6 类婴儿哭声，共计 918 条原始音频样本

---

## 本地开发

### 前置条件

1. 微信开发者工具
2. 注册好的微信小程序 AppID

### 部署步骤

1. 用微信开发者工具打开本项目根目录
2. 在 `project.config.json` 中填入你的 AppID：
   ```json
   "appid": "你的小程序AppID"
   ```
3. 在 `app.js` 中填入你的 FC 地址：
   ```js
   fcUrl: 'https://你的FC-URL.cn-hangzhou.fcapp.run'
   ```
4. 在 `config/sounds.js` 中填入你的 OSS 地址：
   ```js
   const BASE = 'https://你的Bucket.oss-cn-xxx.aliyuncs.com/xxx/'
   ```
5. 将 16 个白噪音音频文件上传到 OSS 对应目录
6. 将 16 个白噪音方块图标放到 `images/sound-icons/` 目录
7. 微信公众平台 → 开发管理 → 服务器域名：
   - 添加 `downloadFile` 合法域名：OSS 域名
   - 添加 `request` 合法域名：FC 域名

### 调试

- 开发期可在微信开发者工具中勾选"不校验合法域名"跳过域名配置
- 真机调试时建议开启 vConsole 查看网络请求日志

---

## 设计

- **风格**：母婴极简、低饱和莫兰迪色系、大圆角、大留白
- **主色**：`#E8C4B8`（莫兰迪粉）、`#FBF7F2`（米白底色）
- **字体**：PingFang SC / Helvetica Neue
- **适配**：支持 iPhone SE 到 Pro Max 全尺寸

---

## 许可证

仅供个人学习参考，请勿用于商业用途。
