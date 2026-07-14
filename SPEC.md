# FC 接口约定

## 端点
部署后填入，形如：
```
https://<account>.<region>.fc.aliyuncs.com/<version>/proxy/cry-classify/<path>
```

## 请求
- **Method**: `POST`
- **Headers**: `Content-Type: application/json`
- **Body**:
```json
{
  "audio": "base64 编码的音频数据"
}
```

**音频要求**：
- 格式：mp3（推荐）/ wav / m4a / ogg
- 时长：约 5 秒（实际 0.5-5 秒都能处理）
- 通道：单声道
- 采样率：任意（FC 内部重采样到 22050Hz）
- 大小：base64 编码后 ≤ 6MB

## 响应（成功）
```json
{
  "result": "hungry",
  "confidence": 0.85,
  "all_scores": {
    "awake": 0.05,
    "diaper": 0.03,
    "hug": 0.02,
    "hungry": 0.85,
    "sleepy": 0.03,
    "uncomfortable": 0.02
  }
}
```

| 字段 | 类型 | 说明 |
|---|---|---|
| result | string | 识别的哭声类别 |
| confidence | float | 置信度 0-1 |
| all_scores | object | 6 个类别的概率分布 |

## 响应（错误）
```json
{
  "error": "错误描述",
  "type": "异常类型"
}
```

| HTTP Code | 含义 |
|---|---|
| 200 | 成功 |
| 400 | 请求参数错误（缺 audio 字段、音频太短）|
| 500 | 服务器内部错误（解码失败、模型加载失败）|

## 6 个类别

| 类别 | 中文 | 提示文案建议 |
|---|---|---|
| `awake` | 清醒 | 宝宝精神很好，不需要哄睡 |
| `diaper` | 尿布湿 | 检查一下尿布 |
| `hug` | 要抱 | 抱抱宝宝吧 |
| `hungry` | 饿 | 该喂奶了 |
| `sleepy` | 困 | 哄宝宝睡觉 |
| `uncomfortable` | 不舒服 | 看看是不是哪里不舒服 |

## 小程序调用示例

```js
// 1. 录音
const recorder = wx.getRecorderManager()
recorder.start({
  duration: 5000,
  sampleRate: 44100,
  numberOfChannels: 1,
  format: 'mp3'
})

// 2. 录音结束 → base64 → 调 FC
recorder.onStop((res) => {
  const fs = wx.getFileSystemManager()
  const buffer = fs.readFileSync(res.tempFilePath)
  const audioB64 = wx.arrayBufferToBase64(buffer)
  
  wx.request({
    url: 'https://你的FC-URL',   // 部署后填
    method: 'POST',
    header: { 'Content-Type': 'application/json' },
    data: { audio: audioB64 },
    success: (r) => {
      if (r.statusCode === 200) {
        console.log('识别结果:', r.data.result)
        console.log('置信度:', r.data.confidence)
      } else {
        console.error('识别失败:', r.data.error)
      }
    },
    fail: (e) => console.error('网络错误:', e)
  })
})
```
