# Awesome Interaction

一个以动图为索引的开源交互方式图鉴。这里关注的是人与软件之间不同的**输入—反馈循环**，而不只是 UI 组件的外观。

> 每个条目都包含项目链接、简短介绍和由项目演示素材截取的 GIF。点击项目名可前往原仓库。

## 收录标准

1. **先按交互方式去重**：如果两个项目的主要输入、用户意图和反馈循环基本相同，则视为同一种交互方式。
2. **重复时优先 star 最高者**：主列表只保留代表性最高的项目；其他实现不重复展示。
3. **主列表门槛为 100 stars**：低于 100 stars 但原型可运行、交互思路独特且有清晰演示的项目进入 [Backup](#backup)。
4. **必须能看见交互**：没有公开演示素材、无法判断实际交互过程的项目暂不收录。
5. **stars 是快照**：数量会随时间变化，README 中记录核验日期，不作为质量的永久结论。

### 简单评分（10 分）

| 维度 | 分值 | 判断方式 |
| --- | ---: | --- |
| 社区采用 | 0–5 | 100+ / 1k+ / 5k+ / 10k+ / 50k+ stars 分别为 1–5 分 |
| 演示质量 | 0–2 | 有截图 1 分；有完整视频或可操作 demo 2 分 |
| 活跃度 | 0–2 | 24 个月内有更新 1 分；12 个月内有更新 2 分 |
| 可复现性 | 0–1 | 有清晰安装步骤或可直接运行示例得 1 分 |

> 去重时首先比较 stars；评分用于判断低 star 项目是否仍值得进入 Backup，以及帮助读者估计上手成本。

## Interaction Atlas

### Gesture Recognition · 手势识别

#### [MediaPipe](https://github.com/google-ai-edge/mediapipe) · ★ 36,106 · 9/10

通过普通摄像头实时识别手部关键点与手势，把捏合、握拳、指向等身体动作变成无需触屏的输入。MediaPipe 提供跨平台视觉管线；这里使用其官方 samples 中的 Android Gesture Recognizer 展示“手势—分类—置信度”的即时反馈。

![MediaPipe gesture recognition demo](demo/gifs/mediapipe-gesture.gif)

*Stars 核验：2026-07-15 · [演示素材来源](https://github.com/google-ai-edge/mediapipe-samples)*

## Backup

低于 100 stars、但交互思路可行且有演示证据的实验性项目会放在这里。

## GIF 制作说明

- GIF 均从对应项目公开的演示视频或动态图中截取短片段，统一缩放和降帧后保存于 [`demo/gifs`](demo/gifs)。
- 原始视频、转码缓存、测试页面和验证截图只保存在被忽略的 `tmp/` 目录，不上传 GitHub。
- GIF 仅用于索引和说明原项目的交互方式；项目名称、代码和原始演示素材的权利归各自作者。

## Demo

打开 [`demo/index.html`](demo/index.html) 可以用卡片形式浏览同一份交互图鉴。
