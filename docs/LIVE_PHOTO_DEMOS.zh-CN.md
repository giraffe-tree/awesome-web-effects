# 网站动态特效转 Live Photo：验证结论与演示样片

## 结论

网站动态特效可以转换成 Apple Live Photo。当前仓库的真实浏览器 Demo 已能被固定输入、固定时间线地捕获为图像序列；新增链路把序列编码成三秒竖屏 MOV，提取中间关键帧 JPEG，为两者写入相同资源标识，再用 Apple Photos 框架验证。

验证成功的判据不是“视频可以播放”，而是：

1. JPEG 与 MOV 的 Live Photo 资源标识一致；
2. Apple `PHLivePhoto.request` 返回完整、非降级的 `PHLivePhoto`；
3. 返回对象尺寸为 1080×1920，且没有 Photos 验证错误。

Apple 官方说明，`PHLivePhoto.request` 会加载并验证静态图和视频资源；导入照片图库时，应通过 `PHAssetCreationRequest` 把两部分分别作为 `.photo` 与 `.pairedVideo` 添加：

- [PHLivePhoto 文件资源验证](https://developer.apple.com/documentation/photos/phlivephoto/request%28withresourcefileurls%3Aplaceholderimage%3Atargetsize%3Acontentmode%3Aresulthandler%3A%29)
- [PHAssetCreationRequest](https://developer.apple.com/documentation/photos/phassetcreationrequest)
- [PHAssetResourceType.pairedVideo](https://developer.apple.com/documentation/photos/phassetresourcetype/pairedvideo)

## 第一组推荐样片

生成产物位于 `demo/live-photos/`。每个 `.pvt` 包都包含同名 JPEG、MOV 与 `metadata.plist`。

| 特效 | 评分 | 推荐原因 |
| --- | ---: | --- |
| `liquid-chrome-letterform` | 96 | WebGL 材质、高光和字形切换在短时动态里辨识度最高。 |
| `flow-field-ribbon-advection` | 93 | 流线、航线与探针共同展示连续场动画和数据叙事。 |
| `recursive-arc-forest-growth` | 96 | 递归树冠的生长变化适合用按压即播放的 Live Photo 表达。 |
| `velocity-reactive-marquee` | 93 | 覆盖 DOM、速度、方向反转和有限惯性，补足非 Canvas 类型。 |
| `poisson-constellation-bloom` | 90 | 节点关系与局部风险查询在三秒内具有清晰的状态变化。 |

完整来源、资源标识、帧数与验证状态记录在 `demo/live-photos/manifest.json`。

## 生成流程

```text
真实 HTML/CSS/Canvas/WebGL Demo
  → Playwright 执行策展录制中的真人输入步骤
  → 320×180 逻辑视口、4× 高分辨率截图
  → 3 秒 H.264 MOV（1080×1920、30fps、静音）
  → 中间帧 JPEG
  → 写入共享资源标识并封装 .pvt
  → PHLivePhoto 完整非降级验证
```

竖屏构图保留完整的 16:9 特效舞台，背景使用同一画面的模糊扩展，不裁掉交互界面或核心视觉证据。

## 重新生成

环境要求：

- macOS 与 Xcode Command Line Tools；
- `ffmpeg`；
- Chrome；
- 仓库现有 Playwright 与 Demo 依赖；
- 已构建的 `demo/preview-demos/dist`。

生成全部五个推荐样片：

```bash
python3 scripts/build-live-photo-demos.py
```

只重建一个样片：

```bash
python3 scripts/build-live-photo-demos.py --only liquid-chrome-letterform
```

保留用于视觉检查的 1280×720 原始截图：

```bash
python3 scripts/build-live-photo-demos.py --keep-frames
```

单独验证已有资源对：

```bash
xcrun swift scripts/live-photo-tool.swift validate \
  demo/live-photos/liquid-chrome-letterform.pvt/liquid-chrome-letterform.jpg \
  demo/live-photos/liquid-chrome-letterform.pvt/liquid-chrome-letterform.mov
```

## 使用方式

### macOS Photos

`.pvt` 是包含静态图和配对视频的 Live Photo 包，可在 macOS 中交给 Photos 导入。导入前应保留整个包，不要单独重编码其中的 JPEG 或 MOV，否则可能丢失资源标识。

### iPhone Photos

若产品需要“网页生成后，一键保存到 iPhone 照片”，推荐增加一个轻量 iOS App 或分享扩展：

1. 下载 JPEG 与 MOV；
2. 用 `PHAssetCreationRequest` 创建资源；
3. JPEG 使用 `.photo`；
4. MOV 使用 `.pairedVideo`；
5. 在完成回调中提示保存结果。

纯网页可以生成、下载和播放资源，但 Apple 的 [LivePhotosKit JS](https://developer.apple.com/documentation/livephotoskitjs) 只负责网页播放，不负责把资源写入系统照片图库。

## 边界与注意事项

- Live Photo 保存的是预先录制的三秒动态，原网页的鼠标、滚动和触控交互不会在照片中继续可交互。
- 样片默认静音，适合特效目录演示；需要声音时应把声音视为独立策展内容。
- 当前验证覆盖 Live Photo 识别与播放资源加载，不等同于“可作为锁屏动态壁纸”。锁屏壁纸资格需要用目标 iOS 版本和真机另行验收。
- `PHLivePhoto` 验证不能替代真机照片库导入测试。上线前至少应覆盖一个当前 iOS 版本和一个仍受支持的旧版本。
- 生成器复用现有真实预览交互步骤，因此新增 Live Photo 候选必须先通过仓库的真实预览门禁。
