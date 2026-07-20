# Batch A：20 个 Future-batch 效果 Demo 实施记录

- 实施日期：2026-07-20（Asia/Shanghai）
- 候选依据：`effect-candidate-dedup-2026-07-18.md`
- 修改边界：只新增 `demo/preview-demos/<id>.html`、`demo/preview-demos/src/<id>-demo.js` 与本研究记录
- 运行映射：`batch-a-runtime-2026-07-20.json`

## 结果

Batch A 固定为 **20 个 Demo**：17 个来自 AI Native 官网候选池，3 个来自 GitHub 候选池。每项都有独立视觉构图、确定性三秒循环、代表性交互、真实运行依赖、`installPreviewController` 元数据与 `__PREVIEW_RUNTIME_ASSERT__`。

这些文件只是可供中央流程接入的真实 Demo 源码，不直接授予发布资格。manifest、catalog、GIF、provenance 和六维评分仍由中央流程统一建立；任一项在真实捕获后低于 80 分或未通过核心最低分，应继续留在非发布状态。

## 三个高风险样本的先行门禁

扩展到完整 20 项前，先实现并检查了三类主要风险：

1. `ascii-orchestration-signal-sweep`：验证固定字符场、Canvas 扫描前沿、指针弯曲与反向操作。
2. `inertial-vertical-capability-rail`：验证 pointer capture、真实拖拽、释放速度、衰减与自动漂移恢复。
3. `noise-cancellation-audio-comparison`：验证同一信号的 Canvas 波形对照、移动分界和用户手势启动的 Web Audio 双增益交叉淡化。

三项均在 Vite 开发环境和 320×180 浏览器视口下完成运行检查；页面生成了捕获表面并设置 `data-preview-ready=true`。浏览器实测惯性竖轨可拖拽释放，音频按钮点击后从 `Hear A/B` 切换为 `Mute A/B`。随后才继续实现其余 17 项。

## 20 项实施明细

| # | ID | 原始来源 | 核心机制 | 实际依赖 / renderer | 验收要点 |
| ---: | --- | --- | --- | --- | --- |
| 1 | `scroll-scrubbed-document-generation-playback` | [Granola](https://www.granola.ai/) | 一条进度同时控制逐行裁剪、内层纸面位移和生成光标 | Motion / DOM | 轮滚与方向键能改变进度；七行不是整体淡入；纸面与光标同步移动。 |
| 2 | `duration-aware-hero-film-handoff` | [Kling AI](https://kling.ai/) | 四个不等时长 Canvas 影片层，临近片尾才预载并交叉淡化下一层 | Motion / Canvas 2D | 时间段为 0.8/0.5/0.9/0.8 秒；状态标签和分段进度与活动层一致。 |
| 3 | `hover-rehearsed-video-style-rail` | [Captions](https://captions.ai/) | hover 临时预演，leave 回卷，click 持久选择并居中 | Motion / Canvas 2D | 五项具有 radio 语义；临时预演与选中态不能混为同一状态。 |
| 4 | `device-silhouette-masked-video` | [Pika](https://pika.art/) | 动态 Canvas 像素由带听筒缺口的 SVG alpha mask 定义 | Motion / Canvas 2D | `mask-image` 真实生效；不是圆角矩形；按钮可改变设备相位。 |
| 5 | `four-corner-hover-crop-marks` | [Cognition](https://cognition.com/) | 四个角标从各自外侧收拢成编辑式裁切框 | Motion / DOM | hover/focus 均可触发；四角方向正确；底图本身不缩放。 |
| 6 | `interaction-history-hiring-badge` | [Clay](https://www.clay.com/) | 交互次数成为后续行为输入，第三次改变徽章文案 | Motion / DOM | 0—3 次状态可读；第三次出现直接邀请；点击可复位历史。 |
| 7 | `card-metadata-to-cta-role-swap` | [Together AI](https://www.together.ai/) | 同一基线上的作者元数据退出，行动按钮接替并唤醒背景 | Motion / DOM | 不是覆盖一个普通按钮；两个角色的退出/进入时序互补。 |
| 8 | `opposed-diagonal-offset-cta` | [Unstructured](https://unstructured.io/) | 前景与底版沿相反对角线分离，按下时重新套印 | Motion / DOM | hover 为 ±7px 对冲；active 返回重合；版画材质清楚。 |
| 9 | `blurred-autoplay-video-ambience` | [Replicate](https://replicate.com/) | 清晰前景 Canvas 被复制到背景并重度模糊，成为同源动态环境光 | Motion / Canvas 2D | 背景必须来自 `drawImage(sharpCanvas)`；滤镜包含真实 blur；前后光色同步。 |
| 10 | `ascii-orchestration-signal-sweep` | [Augment Code](https://www.augmentcode.com/) | 种子 ASCII 噪声与隐藏拓扑叠加，移动强度前沿只在经过处揭示结构 | p5.js / Canvas 2D | 42×22 固定字符场；扫描带、结构 glyph 和指针弯曲均可核验。 |
| 11 | `inertial-vertical-capability-rail` | [Augment Code](https://www.augmentcode.com/) | 直接拖拽计算速度，释放后定步衰减，最终恢复安静自动漂移 | Motion / DOM | pointer capture、甩动、减速与恢复四段完整；键盘方向键也能注入速度。 |
| 12 | `visibility-gated-agent-terminal-replay` | [Poolside](https://poolside.ai/) | IntersectionObserver 门控 typing/working/done 状态；Escape 中断 | Motion / DOM | 离屏不推进；提示词逐字出现；工具输出逐行出现；Escape 切换中断状态。 |
| 13 | `clip-path-menu-curtain` | [Anthropic](https://www.anthropic.com/) | polygon clip-path 从零高度展开为非矩形帘幕，链接随后进入 | Motion / DOM | 形状揭示而非 opacity；按钮保留 `aria-expanded`；四个链接延迟出现。 |
| 14 | `playable-brand-minesweeper-footer` | [Tavus](https://www.tavus.io/) | 8×4 可点击扫雷网格，安全、炸弹与新局状态都在页脚舞台内 | Motion / DOM | 32 个真实按钮；固定炸弹保证捕获一致；自动序列与手动点击均可用。 |
| 15 | `noise-cancellation-audio-comparison` | [Krisp](https://krisp.ai/) | 分界同时控制 raw/clean 波形裁剪和 Web Audio 双 Gain 交叉淡化 | Motion / Canvas 2D | 用户手势后创建 AudioContext；分界左右是同一信号的两种处理，不是两张无关图。 |
| 16 | `track-card-play-state-handoff` | [Udio](https://www.udio.com/) | 封面旋转、卡片苏醒、进度与 aria 播放态作为一个状态接力 | Motion / DOM | 三张卡只有一张 active；点击可改变持久选择；旧卡进度归零。 |
| 17 | `audio-equalizer-typography` | [SOUNDRAW](https://soundraw.io/) | 频谱柱构成标题雕塑；交互运行时由真实 AnalyserNode 数据驱动 | p5.js / Canvas 2D | 无手势时有确定性频谱；启动音频后读取 64 个频率 bin，不使用随机高度冒充分析。 |
| 18 | `animated-hand-drawn-semantic-annotation` | [rough-notation](https://github.com/rough-stuff/rough-notation) | 两条不完全重合的 SVG 手绘线按 pathLength 依次圈注真实语义词 | Motion / SVG | 路径长度真实可测；两笔错峰；点击可重播，且不等于现有单路径图形绘制。 |
| 19 | `mechanical-split-flap-character-change` | [pqina/flip](https://github.com/pqina/flip) | 六个字符各自以 3D 铰链上半片翻过 90°/180° 完成换词 | Motion / DOM | `transform-style: preserve-3d`；六片错峰；字符变化不是淡入淡出。 |
| 20 | `pointer-rotated-dot-matrix-globe` | [shuding/cobe](https://github.com/shuding/cobe) | 18×36 经纬点经过真实球面旋转、俯仰与透视明暗投影 | p5.js / Canvas 2D | 648 个点由球面公式投影；三秒旋转闭环；拖拽更新 yaw/pitch。 |

## 交接检查

- 20 个 ID 已与 `/root` 和 `github_candidates` 锁定，Batch B/C 不复用也不改名。
- 20 个 HTML 均引用 `shared.css` 与各自独立模块。
- 20 个 JS 均调用 `installPreviewController`，ID 与文件名一致，并暴露 `__PREVIEW_RUNTIME_ASSERT__`。
- 运行依赖只使用仓库已经固定的 `motion@12.42.2` 与 `p5@2.3.0`，没有新增远程资源或包。
- 20 个入口及其模块已由 Vite 开发服务器提供/转换；源码已做 `node --check` 与 `git diff --check`。
- 中央流程接入时应以 `batch-a-runtime-2026-07-20.json` 的 projectId、library 与 renderer 为准，原始官网/GitHub URL 作为 reference，不冒充本地运行库。

## 320×180 真实浏览器逐项 QA

QA 日期：2026-07-20（Asia/Shanghai）
运行方式：Vite 本地服务 + 真实 Chrome 浏览器，固定视口 `320×180`。

每个页面通过仅在 `?batch-a-qa=1` 下启用的 `src/batch-a-qa.js` 执行同一套检查：

1. 等待 `window.__PREVIEW_READY__ === true`。
2. 将 `__PREVIEW_META__.id/library/renderer/capture` 与 `batch-a-runtime-2026-07-20.json` 对照。
3. 执行页面自己的 `__PREVIEW_RUNTIME_ASSERT__()`，结果必须严格为 `true`。
4. 依次调用正式 `__setPreviewTime()` seek 到 `0 / 0.75 / 1.5 / 2.25 / 2.99` 秒。
5. 核对 renderer 对应的 DOM、SVG 或 live Canvas 2D 表面。
6. 收集 `window error`、`unhandledrejection`、`console.error` 与 `__PREVIEW_ERROR__`；任一非空即失败。

首轮有 5 项出现 assertion 假阴性：自动 tick 与 assertion 同时写动画时间，导致样式比较读取到相同瞬时值。修复为先通过正式 controller 进入手动时间模式，再执行 assertion；SVG 圈注同时改为验证真实路径长度和 Motion seek 状态。五项复测全部通过。

| # | ID | READY | META | ASSERT | 5 seeks | page/console error | 结论 |
| ---: | --- | --- | --- | --- | --- | --- | --- |
| 1 | `scroll-scrubbed-document-generation-playback` | PASS | PASS | PASS | PASS | 0 | **PASS** |
| 2 | `duration-aware-hero-film-handoff` | PASS | PASS | PASS | PASS | 0 | **PASS** |
| 3 | `hover-rehearsed-video-style-rail` | PASS | PASS | PASS | PASS | 0 | **PASS** |
| 4 | `device-silhouette-masked-video` | PASS | PASS | PASS | PASS | 0 | **PASS** |
| 5 | `four-corner-hover-crop-marks` | PASS | PASS | PASS | PASS | 0 | **PASS** |
| 6 | `interaction-history-hiring-badge` | PASS | PASS | PASS | PASS | 0 | **PASS** |
| 7 | `card-metadata-to-cta-role-swap` | PASS | PASS | PASS | PASS | 0 | **PASS** |
| 8 | `opposed-diagonal-offset-cta` | PASS | PASS | PASS | PASS | 0 | **PASS** |
| 9 | `blurred-autoplay-video-ambience` | PASS | PASS | PASS | PASS | 0 | **PASS** |
| 10 | `ascii-orchestration-signal-sweep` | PASS | PASS | PASS | PASS | 0 | **PASS** |
| 11 | `inertial-vertical-capability-rail` | PASS | PASS | PASS | PASS | 0 | **PASS** |
| 12 | `visibility-gated-agent-terminal-replay` | PASS | PASS | PASS | PASS | 0 | **PASS** |
| 13 | `clip-path-menu-curtain` | PASS | PASS | PASS | PASS | 0 | **PASS** |
| 14 | `playable-brand-minesweeper-footer` | PASS | PASS | PASS | PASS | 0 | **PASS** |
| 15 | `noise-cancellation-audio-comparison` | PASS | PASS | PASS | PASS | 0 | **PASS** |
| 16 | `track-card-play-state-handoff` | PASS | PASS | PASS | PASS | 0 | **PASS** |
| 17 | `audio-equalizer-typography` | PASS | PASS | PASS | PASS | 0 | **PASS** |
| 18 | `animated-hand-drawn-semantic-annotation` | PASS | PASS | PASS | PASS | 0 | **PASS** |
| 19 | `mechanical-split-flap-character-change` | PASS | PASS | PASS | PASS | 0 | **PASS** |
| 20 | `pointer-rotated-dot-matrix-globe` | PASS | PASS | PASS | PASS | 0 | **PASS** |

汇总：**20/20 PASS**；META 20/20、runtime assertion 20/20、五时间点 seek 20/20；page error、unhandled rejection、preview error 与 console error 均为 0。
