# 微信小程序 AI — 需求清单

> **给负责开发小程序的 AI 看**
> 本项目 FC 端代码已写好，模型已训练好。小程序 AI 只需负责前端实现 + 调通 FC。

---

## 1. 项目目标

实现一个微信小程序，**点录音按钮录制 5 秒婴儿哭声 → 调阿里云 FC 接口识别 → 展示识别结果和建议**。

## 2. 关键文件位置

| 项 | 路径 |
|---|---|
| 模型文件 | `d:\wxmini\babycry\cry_model_300.pkl`（200MB，已训练）|
| FC 代码 | `d:\wxmini\babycry\fc\`（4 个文件，已写好）|
| 接口约定 | `d:\wxmini\babycry\SPEC.md`（**必读**）|
| 完整需求 | `d:\wxmini\babycry\REQUIREMENTS.md` |
| 训练脚本 | `d:\wxmini\babycry\train_300.py`（供参考）|

## 3. 小程序要实现的全部功能

### 3.1 必做（核心）
1. 启动后展示一个**录音按钮**
2. 点击按钮 → 倒计时 5 秒 → 自动停止
3. 录音结束 → 转 base64 → POST 调 FC
4. 拿到结果 → 展示**类别 + 置信度 + 建议文案**
5. 错误处理（录音失败、网络失败、FC 返回错误）

### 3.2 推荐做（体验优化）
6. 录音中显示倒计时数字和脉冲动画
7. 加载中显示 spinner
8. 错误时显示友好提示
9. 录音中点按钮可取消

### 3.3 可选做（V2）
10. 录音历史记录（本地存储）
11. 重新录音按钮
12. 暗色模式
13. 反馈机制

## 4. 技术要求（硬性约束）

### 4.1 小程序基础
- **AppID**：用户已注册（个人/企业主体都行）
- **基础库**：2.32.0+（用 getRecorderManager 即可）
- **不需要云开发**（不用 wx.cloud）

### 4.2 录音 API（必须用这个）
```js
const recorder = wx.getRecorderManager()
recorder.start({
  duration: 5000,        // ★ 固定 5 秒
  sampleRate: 44100,     // ★ 44100Hz（FC 端会重采样到 22050）
  numberOfChannels: 1,   // ★ 单声道
  format: 'mp3'          // ★ mp3 格式
})

// 监听停止事件
recorder.onStop((res) => {
  // res.tempFilePath 是临时文件路径
})
```

**关键点**：
- ❌ 不能用旧版 `wx.startRecord`（即将废弃）
- ❌ 不要用 wav 格式（文件大 1.5MB）
- ❌ 不要自己设置 `encodeBitRate`（让默认就行）

### 4.3 base64 编码
```js
const fs = wx.getFileSystemManager()
const buffer = fs.readFileSync(res.tempFilePath)
const b64 = wx.arrayBufferToBase64(buffer)
```

**5秒 mp3 编码后约 80-100KB**，完全可接受。

### 4.4 调 FC 接口
```js
wx.request({
  url: 'FC_URL',                  // 由用户部署后填入
  method: 'POST',
  header: { 'Content-Type': 'application/json' },
  data: { audio: 'base64字符串' },
  timeout: 30000,                 // 30 秒（预留冷启动时间）
  success: (res) => { /* 见接口约定 */ },
  fail: (e) => { /* 网络错误 */ }
})
```

**完整接口约定**见 [SPEC.md](../SPEC.md)

### 4.5 接口返回处理

**成功响应**（HTTP 200）：
```json
{
  "result": "hungry",
  "confidence": 0.85,
  "all_scores": {
    "awake": 0.05, "diaper": 0.03, "hug": 0.02,
    "hungry": 0.85, "sleepy": 0.03, "uncomfortable": 0.02
  }
}
```

**错误响应**（HTTP 400/500）：
```json
{
  "error": "错误描述",
  "type": "异常类型"
}
```

小程序需要：
- 显示 `result` 对应的中文名
- 显示 `confidence`（建议转成百分比 `(0.85 * 100).toFixed(0) + '%'`）
- 显示对应类别的建议文案
- 错误时显示 `error` 字段

## 5. 6 个类别 + 推荐文案

| 英文 result | 中文名 | emoji | 建议文案 |
|---|---|---|---|
| `awake` | 清醒 | 👀 | 宝宝精神很好，可以陪他玩会儿 |
| `diaper` | 尿布湿 | 🧷 | 检查一下是不是该换尿布了 |
| `hug` | 要抱 | 🤗 | 抱抱宝宝，给他安全感 |
| `hungry` | 饿 | 🍼 | 该喂奶了 |
| `sleepy` | 困 | 😴 | 哄宝宝睡觉吧 |
| `uncomfortable` | 不舒服 | 😣 | 看看是不是哪里不舒服 |

**建议在代码里维护一个映射表**（不要硬编码在 UI 字符串里）。

## 6. 页面结构建议

只需要**一个页面**（pages/index/index）：

```
┌─────────────────────────┐
│     宝宝哭声识别          │  ← 标题
│  录制5秒哭声 AI帮您判断    │  ← 副标题
│                          │
│        ⊙ 录音按钮         │  ← 大圆按钮
│        点击录音            │
│                          │
│      [加载中 spinner]      │  ← 录音结束后显示
│      正在分析哭声...       │
│                          │
│  ┌──────────────────┐    │
│  │     emoji        │    │  ← 结果卡片
│  │   宝宝可能是      │    │
│  │      饿          │    │  ← 大字
│  │   置信度 85%      │    │  ← 浅色背景
│  │                  │    │
│  │   该喂奶了        │    │  ← 建议文案
│  └──────────────────┘    │
│                          │
│      [错误提示]            │  ← 出错时显示
└─────────────────────────┘
```

## 7. 设计风格

- **极简母婴风**（用户偏好：minimalist design for maternal and infant）
- 主色：`#F8F4F0`（米色背景）、`#E8A4A0`（粉色按钮）、`#5C4A3A`（深棕文字）
- 大圆角（**32rpx**）、柔和阴影
- 字体偏大（标题 44rpx、正文 26-28rpx、结果 56rpx）
- 录音按钮 280rpx 直径，圆形，渐变
- 录音中加脉冲动画（1秒一次）
- 不用 emoji 太花哨，保持柔和

## 8. 项目结构建议

```
miniprogram/
├── app.json                # 全局配置
├── app.js                  # 全局逻辑（FC URL、类别映射）
├── project.config.json     # 项目配置（AppID）
├── sitemap.json            # 微信开发者工具自动生成
└── pages/
    └── index/
        ├── index.wxml
        ├── index.wxss
        └── index.js
```

**注意**：
- 用户的 AppID 部署时再填，先用测试号
- `fcUrl` 也要等 FC 部署后填入
- 在 `app.js` 里统一管理 FC URL 和类别映射，方便修改

## 9. 服务器域名配置（**容易忘**）

### 开发期（不配也行）
- 微信开发者工具 → 右上角 **详情** → **本地设置**
- 勾 ✅ **"不校验合法域名、web-view、TLS 版本以及 HTTPS 证书"**

### 上线前（**必须配**）
- 微信公众平台（mp.weixin.qq.com）→ **开发** → **开发管理** → **服务器域名**
- **request 合法域名** 添加：FC 的域名（如 `xxxxx.cn-hangzhou.fc.aliyuncs.com`）
- 微信要求 HTTPS，FC 默认就是 HTTPS

## 10. 关键注意事项（**必看**）

### 🔴 致命问题
1. **不要修改录音参数**（duration/sampleRate/format）—— FC 端按 5 秒、22050Hz、mp3 训练
2. **不要用 wx.uploadFile** —— 用 `wx.request` 传 base64 字符串即可，更简单
3. **不要忘了清空上次结果** —— 第二次录音前把 result 清空

### 🟡 重要问题
4. **冷启动慢** —— FC 首次调用 15-30 秒（解压 200MB 模型），`timeout` 设 30000ms 不够的话改 60000
5. **录音失败权限问题** —— 第一次调用要用户授权 `scope.record`
6. **音频太大** —— base64 编码 5 秒 mp3 约 80-100KB，小程序限制 6MB 内
7. **HTTPS 必须** —— 微信小程序强制 HTTPS，FC 默认就是

### 🟢 体验问题
8. **加载提示** —— 冷启动时 spinner 要显示"首次调用较慢，请稍候"等友好文案
9. **错误重试** —— 网络错误提供"重试"按钮
10. **不要频繁调用** —— 一次录音失败后不要立即重试，提示用户稍后再试

## 11. 测试流程

1. **本地测试**（用 curl 或 Postman 模拟小程序请求）
   ```bash
   curl -X POST "FC_URL" -H "Content-Type: application/json" -d '{"audio":"<base64>"}'
   ```
2. **微信开发者工具预览** —— 模拟器里能跑
3. **真机预览** —— 扫开发者工具的预览码（注意：本地预览时勾"不校验合法域名"）
4. **真机调试** —— 开着 vConsole 看请求详情

## 12. 给小程序 AI 的输入参数

用户在部署完成后会提供：
- **FC HTTP URL**：形如 `https://xxxx.cn-hangzhou.fc.aliyuncs.com/2016-08-15/proxy/cry-classify/{path}`
- **AppID**：用户的微信小程序 AppID

这两个值填入 `app.js` 的 `fcUrl` 和 `project.config.json` 的 `appid` 即可。

## 13. 如果遇到问题

| 现象 | 排查方向 |
|---|---|
| 录音没反应 | 检查权限 `wx.authorize({ scope: 'scope.record' })` |
| 请求被拒 | request 合法域名没配，或勾"不校验" |
| 请求超时 | 冷启动慢，调大 timeout |
| 返回 `missing audio field` | data 传错，data 应该是 `{audio: '...'}` |
| 识别结果一直是同一类 | FC 端特征提取函数和训练不一致（**这是 FC 端问题，不是小程序问题**）|
| 客户端报错"不在以下合法域名列表中" | 配 request 合法域名 |
| 真机调试没声音 | 手机音量开大 + 检查麦克风权限 |

## 14. 完整代码参考位置

FC 端代码已写好（4 个文件 + DEPLOY.md），FC 端不需要小程序 AI 改动。

**重点**：小程序 AI **不需要** 写 FC 端代码，**只需要**实现：
- 小程序 UI
- 录音 + base64 编码
- 调 FC 接口
- 展示结果

## 15. 交付清单

小程序 AI 完成后，用户会看到这些文件（在小程序 AI 工作的目录里）：

```
miniprogram/
├── app.json
├── app.js
├── project.config.json
├── sitemap.json
└── pages/index/
    ├── index.wxml
    ├── index.wxss
    └── index.js
```

代码完成后用户会：
1. 在微信开发者工具里打开 `miniprogram/`
2. 填入 AppID 和 FC URL
3. 编译预览
4. 扫码真机测试

---

**总结**：小程序 AI 只需要**实现前端 UI + 录音 + 调接口**。模型、FC、特征提取都已就绪。重点关注录音参数配置、base64 编码、错误处理、UI 体验。
