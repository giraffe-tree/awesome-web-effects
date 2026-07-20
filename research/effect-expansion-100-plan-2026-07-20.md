# 从 26 项扩展到 100 项：74 个新 Web 交互特效锁定计划

计划日期：2026-07-20（Asia/Shanghai）
目标：在当前 26 个已入选效果之外，锁定恰好 74 个主体行为不同的新效果，完成后目录理论规模为 100。
机器可读数据：[effect-expansion-100-plan-2026-07-20.json](./effect-expansion-100-plan-2026-07-20.json)

## 结论

- 当前已入选：**26 项**。
- 本计划新增：**74 项**，稳定 ID 无重复，且不包含当前 26 个 ID。
- 实施分批：**A 20 项、B 27 项、C 27 项**；合计 `20 + 27 + 27 = 74`。
- 预评分全部达到 80 分与核心最低分，但它们仍是制作前预测。没有真实 Demo、GIF、provenance 和人工视觉复审时，正式发布分仍为 0。
- 达到 100 是规划上限，不是放宽门槛后的数量承诺；任何实现后未过门禁的条目都必须删除。

## 联网核验

2026-07-20 对本计划的一手 URL 做了联网核验：

- 16 个 AI Native 官方主页均通过 HTTPS 返回 200，包括 Granola、Kling AI、Captions、Pika、Cognition、Clay、Together AI、Unstructured、Replicate、Augment Code、Poolside、Anthropic、Tavus、Krisp、Udio、SOUNDRAW。
- 36 个官方 GitHub 仓库均可访问且未归档；通过 GitHub API 核验仓库身份、状态和来源 URL。
- React Bits 的 16 个具体 `public/r/*-TS-TW.json`、Magic UI 的 3 个 MDX 组件文档均逐项存在。
- D3 force/Delaunay/brush/tree 与 Motion `useScroll` 官方文档均返回 200。
- 技术来源只使用官方仓库、官方文档或官方 AI Native 官网；没有使用二次转载作为证据。

## 去重与评分口径

效果仍按 `trigger / response / timing / layer` 四段签名比较。颜色、文案和库名不同不算新效果；同一库可以提供多个候选，但主体输入、状态进程、渲染关系或连续性必须不同。

六维预评分顺序为：创意 20 / 艺术 20 / 动效 20 / 辨识 15 / 迁移 15 / 证据 10。计划门槛沿用正式政策：总分至少 80，且艺术至少 14、动效至少 14、辨识至少 11、证据至少 8。

当前 26 个 ID 已作为禁止碰撞集合：

`scroll-scrubbed-master-timeline`、`pinned-horizontal-scroll-scene`、`shared-layout-spring-morph`、`staggered-transform-choreography`、`motion-graphics-burst`、`visually-authored-keyframe-sequence`、`compact-svg-shape-tween`、`filterable-grid-reflow`、`perspective-tilt-and-glare`、`context-aware-custom-cursor`、`displacement-map-image-hover`、`svg-stroke-drawing`、`sketch-style-creative-coding-loop`、`functional-webgl-draw-commands`、`dom-synced-shader-planes`、`depth-layer-blur-dissolve`、`dom-aware-drag-spawned-fish-flock`、`synchronized-scenario-scene-handoff`、`prompt-select-replace-loop`、`traveling-dot-headline-rewriter`、`infinite-curved-text-conveyor`、`autonomous-agent-cursor-constellation`、`scroll-linked-multilayer-starfield`、`staggered-multichart-telemetry-boot`、`delayed-dropdown-promo-sweep`、`self-inverting-fixed-navigation`

## Batch A（20 项）

明确 ID 清单：

1. `scroll-scrubbed-document-generation-playback`
2. `duration-aware-hero-film-handoff`
3. `hover-rehearsed-video-style-rail`
4. `device-silhouette-masked-video`
5. `four-corner-hover-crop-marks`
6. `interaction-history-hiring-badge`
7. `card-metadata-to-cta-role-swap`
8. `opposed-diagonal-offset-cta`
9. `blurred-autoplay-video-ambience`
10. `ascii-orchestration-signal-sweep`
11. `inertial-vertical-capability-rail`
12. `visibility-gated-agent-terminal-replay`
13. `clip-path-menu-curtain`
14. `playable-brand-minesweeper-footer`
15. `noise-cancellation-audio-comparison`
16. `track-card-play-state-handoff`
17. `audio-equalizer-typography`
18. `animated-hand-drawn-semantic-annotation`
19. `mechanical-split-flap-character-change`
20. `pointer-rotated-dot-matrix-globe`

| # | 稳定 ID / 中英名 | 核心机制 | 推荐真实实现与一手来源 | 不重复理由 | Demo 场景与 capture 动作 | 六维预评分 | 风险 |
| ---: | --- | --- | --- | --- | --- | --- | --- |
| 1 | `scroll-scrubbed-document-generation-playback`<br>滚动擦洗式文档生成回放<br>Scroll-scrubbed document generation playback | scroll progress → Generate note lines, advance a caret, and scroll the inner document；continuous progress-linked；editor document surface | **GSAP ScrollTrigger** / DOM<br>[官方效果来源](https://www.granola.ai/)<br>[实现项目](https://github.com/greensock/GSAP) | 现有滚动主时间线移动卡片；本项让行裁剪、内层滚动、生成光标与解析态共同映射到同一进度。 | 一张原创会议记录从空白逐行生成，页内光标和滚动同步推进。<br>**Capture：**真实滚动从 0→100%，停在换页峰值，再回到 35% 证明可逆。 | 19/19/20/15/15/9 = **97** | **medium**：必须真实更新 clip、scrollTop 与光标；只逐行淡入会退化成通用 stagger。 |
| 2 | `duration-aware-hero-film-handoff`<br>按片段时长接力的首屏影片<br>Duration-aware hero film handoff | media duration / timeupdate → Preload the next film and crossfade at each clip's real end；duration-aware sequenced handoff；hero media layers | **HTMLVideoElement + requestVideoFrameCallback** / video + DOM<br>[官方效果来源](https://kling.ai/)<br>[实现项目](https://developer.mozilla.org/en-US/docs/Web/API/HTMLVideoElement) | 不是定时轮播；每段媒体读取自己的 duration，并在交接窗口才预载下一段和短暂叠层。 | 四段程序化短片组成一支连续品牌影片，HUD 显示当前、预载、下一段。<br>**Capture：**等待 metadata，连续录制两个不同时长的交接与 300ms 交叉淡化。 | 18/19/20/14/14/9 = **94** | **high**：需制作四段本地可再分发媒体；不能把 GIF 里看不见的预载逻辑当作效果证据。 |
| 3 | `hover-rehearsed-video-style-rail`<br>悬停预演的视频风格轨<br>Hover-rehearsed video style rail | hover/focus then click → Preview, rewind, then persist and center a selected style；temporary rehearsal followed by committed state；media selection rail | **HTMLVideoElement + CSS scroll snap** / video + DOM<br>[官方效果来源](https://captions.ai/)<br>[实现项目](https://developer.mozilla.org/en-US/docs/Web/API/HTMLVideoElement) | hover 只临时播放并在离开时归零，click 才持久选中和居中；与普通轮播或 autoplay 卡片不同。 | 五张原创动态图块组成风格轨，当前选中项带 radiogroup 语义。<br>**Capture：**悬停第二项播放→移开复位→点击第四项→轨道平滑居中。 | 18/18/19/15/15/10 = **95** | **high**：需要五段本地视频并同时验证键盘、hover 和 click 三种输入。 |
| 4 | `device-silhouette-masked-video`<br>设备轮廓蒙版视频<br>Device-silhouette masked video | mount / mask selection → Play one film through an irregular device alpha silhouette；continuous media with discrete mask changes；masked media surface | **CSS mask-image + HTMLVideoElement** / video + CSS compositing<br>[官方效果来源](https://pika.art/)<br>[实现项目](https://developer.mozilla.org/en-US/docs/Web/CSS/mask-image) | alpha mask 决定真实可见像素，不是给矩形视频加 border-radius。 | 液态界面视频在三种原创设备剪影中切换并投下环境色阴影。<br>**Capture：**录制一段稳定播放，再点击切换 mask，观察像素边缘与阴影连续变化。 | 17/19/17/15/14/10 = **92** | **medium**：需自制 mask 和视频；若轮廓只是圆角矩形则拒绝。 |
| 5 | `four-corner-hover-crop-marks`<br>四角裁切标记悬停<br>Four-corner hover crop marks | hover/focus → Reveal and slightly expand four crop-register corners；short reversible hover transition；image card frame | **CSS pseudo-elements / four corner spans** / DOM + CSS<br>[官方效果来源](https://cognition.ai/)<br>[实现项目](https://developer.mozilla.org/) | 四个独立角标围绕图像边界收放，现有倾斜高光和情境光标都不改变卡片的裁切语义。 | 一张大幅显微摄影卡，角标出现时坐标与焦距信息同步显现。<br>**Capture：**pointer 从外侧进入中心、停 600ms、离开；键盘 focus 再复演。 | 17/18/17/15/15/10 = **92** | **medium**：缩略图中四角必须足够大；不能让图片缩放掩盖主体效果。 |
| 6 | `interaction-history-hiring-badge`<br>交互历史驱动招聘徽章<br>Interaction-history hiring badge | repeated pointer entries → Escalate posture and copy across the first three visits；history-dependent finite states；edge badge | **DOM state + CSS transforms** / DOM + CSS<br>[官方效果来源](https://www.clay.com/)<br>[实现项目](https://developer.mozilla.org/) | 行为由此前 hover 次数决定，不是每次相同的 hover 动画或随机文案。 | 页边招聘徽章第 1 次轻晃、第 2 次探头、第 3 次翻面发出邀请。<br>**Capture：**以固定轨迹进入/离开三次，完整录下三种递进状态。 | 18/16/16/15/14/10 = **89** | **medium**：短 GIF 必须容纳三次访问；只改文字不够达到动效最低线。 |
| 7 | `card-metadata-to-cta-role-swap`<br>卡片元数据到 CTA 角色互换<br>Card metadata-to-CTA role swap | hover/focus → Move metadata out and grow an action into the same semantic slot；coordinated reversible role handoff；research card footer | **Motion** / DOM<br>[官方效果来源](https://www.together.ai/)<br>[实现项目](https://github.com/motiondivision/motion) | 同一排版基线从作者信息接力为 CTA，而不是加一个常驻遮罩按钮。 | 三张研究卡，作者/年份在悬停后让位给“展开实验”操作。<br>**Capture：**依次 hover 两张卡，停在元数据退出和 CTA 完成两个关键帧。 | 17/18/18/15/14/9 = **91** | **medium**：若只是绝对定位按钮淡入，会与常规 hover 重复。 |
| 8 | `opposed-diagonal-offset-cta`<br>反向对冲斜移 CTA<br>Opposed diagonal offset CTA | hover/focus/press → Separate two print layers diagonally, then snap them together on press；reversible two-layer transition；button surface | **CSS transforms** / DOM + CSS<br>[官方效果来源](https://unstructured.io/)<br>[实现项目](https://developer.mozilla.org/) | 前景与底版沿相反对角线分离，active 时重新套印；不是单层按钮位移。 | 版画式按钮用墨黑前景和酸绿底版表现错位与套印。<br>**Capture：**hover 分离→pointerdown 合拢→pointerup 弹回→leave 复位。 | 17/18/18/15/14/10 = **92** | **low**：幅度过小会在 GIF 缩略图中消失，过大会像布局错误。 |
| 9 | `blurred-autoplay-video-ambience`<br>模糊自播视频氛围层<br>Blurred autoplay video ambience | media playback / slide change → Mirror the active film into a blurred ambient-light layer；continuous source-synchronized ambience；background behind media | **HTMLVideoElement + CSS filter** / video + CSS compositing<br>[官方效果来源](https://replicate.com/)<br>[实现项目](https://developer.mozilla.org/en-US/docs/Web/API/HTMLVideoElement) | 背景复用前景同一动态源并放大、重模糊、混合，区别于独立渐变或丝绸 shader 背景。 | 清晰小影片置于中央，同源背景变成缓慢流动的环境光。<br>**Capture：**录制两段片切换，确认前景与模糊色场同步交接。 | 17/19/17/14/14/10 = **91** | **medium**：必须同源；无关 CSS gradient 不能作为降级实现。 |
| 10 | `ascii-orchestration-signal-sweep`<br>ASCII 编排信号扫过<br>ASCII orchestration signal sweep | time/pointer restart → Sweep a signal front that resolves noisy glyphs into an architecture diagram；deterministic timed pass with decay；Canvas character field | **p5.js** / Canvas 2D<br>[官方效果来源](https://www.augmentcode.com/)<br>[实现项目](https://github.com/processing/p5.js) | 两套字符场被移动强度前沿选择性揭示，不是现有单文本 scramble 或矩阵雨。 | 点号、叉号噪声中，扫描前沿点亮一张隐藏的神经拓扑。<br>**Capture：**固定 11 秒相位，录下前沿进入、结构峰值、尾部衰减和复位。 | 18/19/19/14/15/9 = **94** | **medium**：必须固定字符种子和相位；装饰性随机矩阵雨会失真。 |
| 11 | `inertial-vertical-capability-rail`<br>惯性竖向能力轨<br>Inertial vertical capability rail | pointer drag/release → Throw a vertical card rail, decay momentum, then resume curation drift；gesture inertia followed by autonomous motion；vertical capability rail | **Motion inertia + Pointer Events** / DOM<br>[官方效果来源](https://www.augmentcode.com/)<br>[实现项目](https://github.com/motiondivision/motion) | 指针抓取长轨后按释放速度衰减，速度耗尽才恢复慢速自动漂移；不同于页面惯性滚动。 | 一列大型能力海报默认缓慢上卷，可抓住向下甩后反向滑行。<br>**Capture：**真实 pointer drag 160px→快速释放→等待速度衰减→录下自动漂移恢复。 | 17/17/19/14/15/9 = **91** | **medium**：需要限幅和稳定速度；短 capture 若看不到恢复阶段则效果不完整。 |
| 12 | `visibility-gated-agent-terminal-replay`<br>可见性门控 Agent 终端回放<br>Visibility-gated agent terminal replay | viewport visibility / Escape → Replay an agent task with tool output, pause offscreen, and expose interruption；multi-state sequenced playback with gated clock；terminal panel | **Motion + IntersectionObserver** / DOM<br>[官方效果来源](https://poolside.ai/)<br>[实现项目](https://github.com/motiondivision/motion) | 终端具有 typing/submitted/working/done/interrupted 状态，且离屏冻结时间；不是普通打字机。 | 终端执行“分析海报色板”任务，依次输出工具调用与完成摘要。<br>**Capture：**进入视口启动→滚出冻结→返回续播→Escape 触发 interrupted。 | 18/17/19/15/15/9 = **93** | **medium**：capture 时钟必须真冻结；仅暂停 CSS 动画但计时继续会错配。 |
| 13 | `clip-path-menu-curtain`<br>裁剪路径菜单帘幕<br>Clip-path menu curtain | menu toggle → Unroll and retract a full-screen navigation curtain from an authored axis；reversible shape reveal；navigation overlay | **Motion + CSS clip-path** / DOM<br>[官方效果来源](https://www.anthropic.com/)<br>[实现项目](https://github.com/motiondivision/motion) | 全屏菜单由 polygon 帘幕穿过内容展开，区别于本批分层全屏菜单的多底板交错。 | 纸帘从徽标轴线放开，菜单项仅在帘幕跨过自身时显现。<br>**Capture：**点击打开→记录半开 polygon→完全展开→点击收束。 | 15/18/18/15/14/9 = **89** | **low**：若所有菜单项同时淡入会退化为普通 overlay。 |
| 14 | `playable-brand-minesweeper-footer`<br>可玩的品牌扫雷页脚<br>Playable brand minesweeper footer | click/right-click/keyboard → Play a bounded minesweeper whose end state resolves into the brand lockup；persistent game-state transitions；footer grid | **DOM state + CSS Grid** / DOM + CSS<br>[官方效果来源](https://www.tavus.io/)<br>[实现项目](https://developer.mozilla.org/) | 格子具有揭示、标记、炸弹、胜负与重置状态；不是静态像素网格背景。 | 8×5 页脚扫雷，通关后未揭格重排成站名，失败时出现像素烟尘。<br>**Capture：**自动点击一条安全路径→标旗→触发胜利；另录一次炸弹峰值用于验收。 | 18/16/18/15/14/9 = **90** | **high**：不要膨胀成完整游戏；确定性雷区与键盘可用性是捕获前提。 |
| 15 | `noise-cancellation-audio-comparison`<br>降噪音频 A/B 交叉试听<br>Noise-cancellation audio comparison | drag/click/playback → Crossfade two synchronized audio tracks while revealing removed spectral energy；continuous A/B blend on one playhead；audio waveform comparison | **Web Audio API + Canvas** / audio + Canvas 2D<br>[官方效果来源](https://krisp.ai/)<br>[实现项目](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API) | 同一播放时间轴在原声与净化声之间连续 crossfade，并让波形分界同步；不同于循环区域编辑。 | 原创城市声拆成原声/降噪两轨，拖动空间分界同步改变声音和波形。<br>**Capture：**播放→拖动 mix 0→1→0.35→暂停，画面记录两波形差异。 | 15/17/18/15/14/8 = **87** | **high**：需原创双轨与真实同步音频；静音 GIF 必须靠波形和频段差解释。 |
| 16 | `track-card-play-state-handoff`<br>音轨卡播放态协同切换<br>Track-card play-state handoff | track selection / playback → Hand off rotation, waveform, material glow, and play state between cards；coordinated exclusive playback state；track card rail | **Web Audio API + Motion** / audio + DOM<br>[官方效果来源](https://www.udio.com/)<br>[实现项目](https://github.com/motiondivision/motion) | 切歌时旧卡减速休眠、新卡接棒苏醒，封面、进度、材质与播放控件作为一个状态切换。 | 三张唱片卡，点击新卡时旧唱片减速、新封面显色、波形接棒。<br>**Capture：**播放第一张 1s→点击第三张→停在双卡交接峰值→暂停第三张。 | 14/16/17/15/14/8 = **84** | **high**：创意余量仅 84；若素材与排版不足应在正式评分时删除。 |
| 17 | `audio-equalizer-typography`<br>活跃音轨均衡器排印<br>Audio equalizer typography | audio playback / analyser frames → Reshape a typographic bar sculpture from real frequency bins；continuous signal-driven deformation；Canvas/SVG typographic sculpture | **Web Audio AnalyserNode + Canvas** / audio + Canvas 2D<br>[官方效果来源](https://soundraw.io/)<br>[实现项目](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API) | 真实频谱柱共同勾出一行标题轮廓，区别于随机 equalizer 和普通遥测图表。 | 24 根排版柱形成“LISTEN”轮廓，播放时按频段真实起伏。<br>**Capture：**播放固定音频→录制低频/高频峰值→暂停观察柱体归位。 | 14/17/18/15/14/8 = **86** | **high**：必须使用 AnalyserNode；随机 bar animation 直接拒绝。 |
| 18 | `animated-hand-drawn-semantic-annotation`<br>动画手绘语义标注<br>Animated hand-drawn semantic annotation | viewport entry / button → Draw semantic highlights, circles, and brackets around live text；sequenced additive annotations；DOM text with SVG overlay | **Rough Notation** / SVG overlay<br>[官方效果来源](https://github.com/rough-stuff/rough-notation)<br>[实现项目](https://github.com/rough-stuff/rough-notation) | 标注围绕真实 DOM 文字尺寸生成并按论证顺序出现；现有 SVG 描边只揭示预先存在的路径。 | 一页编辑批注依次高亮主张、圈出数据、用括号关联结论。<br>**Capture：**等待字体→点击播放→录制三种标注依次完成→hide/show 复位。 | 16/17/18/15/15/9 = **90** | **low**：必须在字体加载后测量 DOM；预画死 SVG 不合格。 |
| 19 | `mechanical-split-flap-character-change`<br>机械分瓣翻牌字符<br>Mechanical split-flap character change | timer / value update → Flip upper and lower glyph leaves to propagate a new value；per-glyph mechanical sequence；DOM/CSS 3D character cells | **Flip** / DOM + CSS 3D<br>[官方效果来源](https://github.com/pqina/flip)<br>[实现项目](https://github.com/pqina/flip) | 每个字符上下叶片物理式接力并传播进位，区别于打字、选择替换和 SVG morph。 | 档案编号从 0098 逐步翻到 0104，背后是工业计数器舞台。<br>**Capture：**固定更新序列，录下 0099→0100 的多字符进位峰值。 | 15/18/18/15/14/9 = **89** | **low**：需检查背面镜像、字体等宽和 GIF 断帧。 |
| 20 | `pointer-rotated-dot-matrix-globe`<br>指针旋转点阵地球<br>Pointer-rotated dot-matrix globe | pointer drag / time → Rotate a sampled dot globe and keep geographic markers anchored；continuous inertial rotation；WebGL globe | **COBE** / WebGL<br>[官方效果来源](https://github.com/shuding/cobe)<br>[实现项目](https://github.com/shuding/cobe) | 专用点阵地球带标记和拖拽惯性；不是通用 3D orbit，也不同于地图相机飞行。 | 深色点阵地球连接上海、雷克雅未克和圣保罗三个信号点。<br>**Capture：**自动慢转→真实拖拽半圈→释放惯性→停在标记脉冲。 | 17/19/18/15/15/9 = **93** | **low**：固定 DPR 和 mapSamples，避免高分屏录制过重。 |

## Batch B（27 项）

明确 ID 清单：

1. `interactive-vector-state-machine`
2. `dom-to-3d-scroll-synchronization`
3. `scene-wipe-progressive-page-swap`
4. `draggable-packed-editorial-wall`
5. `velocity-aware-swipe-drawer`
6. `spatial-slide-deck-navigation`
7. `pointer-driven-multilayer-depth-stage`
8. `svg-filter-gooey-text-hover`
9. `pointer-following-displacement-ripple`
10. `draggable-rigid-body-poster-pile`
11. `point-constructed-generative-corolla`
12. `pointer-injected-gpu-fluid`
13. `emergent-particle-life-colonies`
14. `sticky-card-stack-accumulation`
15. `velocity-reactive-marquee`
16. `scrubbed-word-blur-rotate-reveal`
17. `pixel-grid-content-dissolve`
18. `bubble-to-navigation-morph`
19. `neighbor-magnifying-navigation-dock`
20. `layered-staggered-full-screen-menu`
21. `hover-activated-image-marquee-menu`
22. `drag-thrown-card-stack`
23. `metaball-blob-cursor`
24. `velocity-spaced-image-trail`
25. `gooey-pixel-cursor-wake`
26. `snapping-target-reticle-cursor`
27. `pointer-reactive-cell-grid`

| # | 稳定 ID / 中英名 | 核心机制 | 推荐真实实现与一手来源 | 不重复理由 | Demo 场景与 capture 动作 | 六维预评分 | 风险 |
| ---: | --- | --- | --- | --- | --- | --- | --- |
| 1 | `interactive-vector-state-machine`<br>交互式矢量状态机<br>Interactive vector state machine | hover/press/state input → Transition a vector creature across resting, alert, and confirmed states；finite-state blended transitions；Rive canvas | **Rive Web** / WASM Canvas/WebGL<br>[官方效果来源](https://github.com/rive-app/rive-wasm)<br>[实现项目](https://github.com/rive-app/rive-wasm) | 输入驱动有记忆的矢量状态机；现有关键帧与共享布局没有显式状态转换和 Rive 输入。 | 一枚生物按钮在 rest、hover、press、success 间连续变形。<br>**Capture：**真实 pointer hover→press→触发 success input→等待状态回落。 | 18/18/19/15/15/9 = **94** | **high**：必须有自制或许可明确的 .riv 资产；远程社区资产不可直接打包。 |
| 2 | `dom-to-3d-scroll-synchronization`<br>DOM 与 3D 滚动锁步同步<br>DOM-to-3D scroll synchronization | scroll/layout change → Keep 3D media planes aligned to moving DOM boxes；continuous reversible lockstep；shared WebGL canvas behind DOM | **r3f-scroll-rig** / React DOM + WebGL<br>[官方效果来源](https://github.com/14islands/r3f-scroll-rig)<br>[实现项目](https://github.com/14islands/r3f-scroll-rig) | WebGL 物体持续追踪真实 DOM 代理框尺寸与位置；现有 DOM shader 只在同一边界内渲染材质。 | 三张编辑式图框从单列跨栏再放大，3D 纹理始终贴合。<br>**Capture：**滚动穿越三种布局并在中途 resize；截取 DOM/WebGL 边缘对齐。 | 19/19/19/14/15/9 = **95** | **high**：React/WebGL 构建重；任何像素漂移都会破坏证据。 |
| 3 | `scene-wipe-progressive-page-swap`<br>场景擦除式渐进页面交换<br>Scene-wipe progressive page swap | route navigation → Compress the leaving scene into a slit and reveal the next route through it；staged leave/fetch/enter；page container | **Swup** / DOM + CSS clip<br>[官方效果来源](https://github.com/swup/swup)<br>[实现项目](https://github.com/swup/swup) | 真实路由执行 leave-fetch-enter；当前同步场景换幕只切换同页应用状态。 | 两个真实 HTML 路由共享一条图像裂缝作为换页入口。<br>**Capture：**点击路由链接→录下离场压缩、URL 改变、下一页展开→浏览器后退。 | 16/18/18/14/15/9 = **90** | **medium**：必须用 HTTP server 与真实 route；单页隐藏 div 不合格。 |
| 4 | `draggable-packed-editorial-wall`<br>可拖拽紧密编辑墙<br>Draggable packed editorial wall | pointer drag → Lift, reorder, and repack unequal editorial cards around the active item；gesture-driven packing with persistent order；DOM grid | **Muuri** / DOM transforms<br>[官方效果来源](https://github.com/haltu/muuri)<br>[实现项目](https://github.com/haltu/muuri) | 抓起卡片时邻项实时避让并重新装箱；现有筛选网格由过滤条件驱动而非直接操纵。 | 不等高海报墙中，一张跨两列卡片被拖至顶端，其他卡片避让。<br>**Capture：**真实 pointerdown→拖过两处落点→释放→等待 packing 完成。 | 15/17/18/15/14/9 = **88** | **medium**：录制必须派发拖拽而非直接调用 move；布局需无跳闪。 |
| 5 | `velocity-aware-swipe-drawer`<br>速度感知抽屉回弹<br>Velocity-aware swipe drawer | touch/pointer drag → Follow the gesture, infer velocity, and settle at semantic snap points；gesture-continuous spring settling；bottom drawer overlay | **Vaul** / React DOM<br>[官方效果来源](https://github.com/emilkowalski/vaul)<br>[实现项目](https://github.com/emilkowalski/vaul) | 抽屉跟手、根据释放速度跨越吸附点并让背景同步缩放；与菜单帘幕的离散开合不同。 | 三段式声音混音台抽屉，背景舞台随抽屉高度缩小。<br>**Capture：**慢拖至第二 snap→快速甩至全屏→向下轻扫关闭。 | 14/16/18/15/13/9 = **85** | **medium**：正式评分余量仅 85；焦点回收和触摸滚动冲突必须解决。 |
| 6 | `spatial-slide-deck-navigation`<br>空间化演示文稿导航<br>Spatial slide-deck navigation | keyboard/swipe → Navigate a two-dimensional graph of slides and reveal its overview；discrete spatial continuity；DOM 3D slide stage | **reveal.js** / DOM + CSS 3D<br>[官方效果来源](https://github.com/hakimel/reveal.js)<br>[实现项目](https://github.com/hakimel/reveal.js) | 横向章节和纵向分支形成二维空间图；不是单轴轮播或横向固定滚动。 | 星图档案先横移到星系，再下潜到两张观测子页，最后 overview。<br>**Capture：**ArrowRight→ArrowDown→Escape overview→点击目标页。 | 15/18/17/15/14/9 = **88** | **medium**：默认主题会低分；需原创排版且防止与普通 slide deck 混淆。 |
| 7 | `pointer-driven-multilayer-depth-stage`<br>指针驱动多层景深舞台<br>Pointer-driven multilayer depth stage | pointer/device orientation → Offset authored layers by depth coefficients around a fixed focal point；continuous reversible parallax；layered DOM scene | **Parallax.js** / DOM transforms<br>[官方效果来源](https://github.com/wagerfield/parallax)<br>[实现项目](https://github.com/wagerfield/parallax) | 前景、主体、远景按深度系数独立位移；现有卡片倾斜高光让一个平面整体旋转。 | 原创 SVG 夜景含月亮、标题、枝叶和雾层，指针移动时分层。<br>**Capture：**pointer 走四角和中心；再触发 reduced-motion 静态降级。 | 14/18/18/15/14/9 = **88** | **medium**：上游 SPDX 未断言；需核验许可并给移动端方向权限降级。 |
| 8 | `svg-filter-gooey-text-hover`<br>SVG 滤镜黏液文字悬停<br>SVG-filter gooey text hover | hover/focus → Merge blobs through SVG filters until they resolve into glyphs；reversible material transition；headline typography | **Gooey Text Hover** / SVG filters + DOM<br>[官方效果来源](https://github.com/codrops/GooeyTextHoverEffect)<br>[实现项目](https://github.com/codrops/GooeyTextHoverEffect) | 液滴聚合为字再散开；当前标题擦写使用移动圆点，曲线传送带移动完整字形。 | LIQUID TYPE 标题由散落液滴聚成清晰字，再随离开溶散。<br>**Capture：**focus/hover 触发→停在融球峰值→清晰字→leave 复位。 | 18/19/18/15/15/8 = **93** | **medium**：固定 filter region，防止 Safari/Chrome 裁切；需尊重上游示例许可。 |
| 9 | `pointer-following-displacement-ripple`<br>指针跟随位移涟漪<br>Pointer-following displacement ripple | pointer move → Move a displacement texture under the pointer and let the image surface recover；continuous local deformation with decay；PixiJS image surface | **PixiJS DisplacementFilter** / WebGL 2D<br>[官方效果来源](https://github.com/pixijs/pixijs)<br>[实现项目](https://github.com/pixijs/pixijs) | 单张图像被移动位移场持续推开并衰减；现有位移图悬停在两张图之间切换。 | 原创棋盘花窗在指针下形成局部水波，离开后弹性回稳。<br>**Capture：**pointer 画 S 轨迹→快速离开→录下波纹衰减。 | 18/19/18/14/15/9 = **93** | **medium**：必须使用真实 filter 和本地位移贴图；CSS blur 假变形不合格。 |
| 10 | `draggable-rigid-body-poster-pile`<br>可抓取刚体海报堆<br>Draggable rigid-body poster pile | pointer drag / gravity → Drop, collide, grab, and throw typographic poster bodies；fixed-step persistent physics；Canvas 2D world | **Matter.js** / Canvas 2D<br>[官方效果来源](https://github.com/liabru/matter-js)<br>[实现项目](https://github.com/liabru/matter-js) | 海报受重力、旋转和碰撞传递；Muuri 只在布局网格中避让，不模拟刚体。 | 六张窄海报落入框内，用户抓起一张再次砸入堆栈。<br>**Capture：**固定时间步预落 1s→真实拖拽海报→释放碰撞→等待静止。 | 17/18/19/15/15/9 = **93** | **medium**：必须固定初始姿态和时间步，禁止随机挑选好看录屏。 |
| 11 | `point-constructed-generative-corolla`<br>点构成的生成式花冠<br>Point-constructed generative corolla | time/pointer → Recompute layered radial point geometry around the pointer；seeded seamless loop with local response；Canvas 2D generative field | **Pts** / Canvas 2D<br>[官方效果来源](https://github.com/williamngan/pts)<br>[实现项目](https://github.com/williamngan/pts) | 点/向量关系生成花冠并受局部指针扰动；当前 p5 波形和粒子涡旋都没有径向花瓣拓扑。 | 四层点花冠缓慢呼吸，指针经过时局部花瓣向外展开。<br>**Capture：**固定 8s phase→pointer 从左到中心→录下展开与闭合。 | 18/18/18/14/15/9 = **92** | **medium**：必须固定种子和相位；装饰文字不能承担辨识度。 |
| 12 | `pointer-injected-gpu-fluid`<br>指针注入 GPU 流体<br>Pointer-injected GPU fluid | pointer drag → Inject velocity and dye into an advecting fluid framebuffer；continuous dissipating simulation；full-bleed WebGL canvas | **WebGL Fluid Simulation** / WebGL framebuffer simulation<br>[官方效果来源](https://github.com/PavelDoGreat/WebGL-Fluid-Simulation)<br>[实现项目](https://github.com/PavelDoGreat/WebGL-Fluid-Simulation) | 指针把速度和染料真实注入流场；现有粒子涡旋和星空不解流体方程。 | 深蓝流体中以固定紫、橙染料画两次 S 曲线。<br>**Capture：**固定模拟分辨率→执行两条 pointer 轨迹→等待涡旋耗散→复位。 | 19/20/20/15/15/9 = **98** | **high**：GPU 差异和时间步会影响复现；需固定输入并逐机验收。 |
| 13 | `emergent-particle-life-colonies`<br>涌现式粒子生命群落<br>Emergent particle-life colonies | time / reset → Evolve colored populations under a fixed attraction-repulsion matrix；seeded emergent continuous simulation；Canvas particle field | **Particle Life algorithm** / Canvas 2D<br>[官方效果来源](https://github.com/hunar4321/particle-life)<br>[实现项目](https://github.com/hunar4321/particle-life) | 种群间吸引排斥矩阵产生追逐、膜和群落；现有涡旋有统一向心场，鱼群使用 boids 与 DOM 避障。 | 四种颜色形成追逐环和细胞膜状群落，旁边显示固定作用矩阵。<br>**Capture：**固定 seed 运行 0→8s→点击 reset 重放同一演化。 | 19/18/19/14/15/9 = **94** | **medium**：随机种子、矩阵、边界、步长必须写入 provenance。 |
| 14 | `sticky-card-stack-accumulation`<br>粘性卡片堆叠累积<br>Sticky card-stack accumulation | scroll → Pin and compress each card onto a growing stack；continuous progress-linked accumulation；sticky card scene | **React Bits ScrollStack** / React DOM<br>[官方效果来源](https://github.com/DavidHDev/react-bits/blob/main/public/r/ScrollStack-TS-TW.json)<br>[实现项目](https://github.com/DavidHDev/react-bits) | 卡片逐张 pin、缩放并累积成可见堆栈；现有固定横向场景移动一条轨道而不保留叠层历史。 | 五张材料档案随滚动叠到一个固定观察台上。<br>**Capture：**真实滚动逐张累积→停在四层堆栈→反向滚动拆栈。 | 18/19/19/15/15/9 = **95** | **high**：React Bits 仓库未给标准 SPDX；复制源码前必须补许可结论。 |
| 15 | `velocity-reactive-marquee`<br>滚动速度响应跑马灯<br>Velocity-reactive marquee | scroll velocity → Accelerate and reverse a text rail from document velocity；continuous velocity-coupled loop；typographic rail | **React Bits ScrollVelocity** / React DOM<br>[官方效果来源](https://github.com/DavidHDev/react-bits/blob/main/public/r/ScrollVelocity-TS-TW.json)<br>[实现项目](https://github.com/DavidHDev/react-bits) | 内容速度和方向由测得滚动速度改变；不是恒速直线 marquee 或曲线路径文字。 | 双向大字轨默认慢行，快速上下滚动时反转并加速。<br>**Capture：**慢滚→快速下滚→快速上滚→停止观察回落基速。 | 17/18/19/15/15/9 = **93** | **high**：许可未明；必须测真实滚动速度而非只按方向切 class。 |
| 16 | `scrubbed-word-blur-rotate-reveal`<br>擦洗式逐词模糊旋转揭示<br>Scrubbed word blur-and-rotate reveal | scroll progress → Resolve words from blur and rotation in reading order；per-word continuous scrub；paragraph typography | **React Bits ScrollReveal** / React DOM<br>[官方效果来源](https://github.com/DavidHDev/react-bits/blob/main/public/r/ScrollReveal-TS-TW.json)<br>[实现项目](https://github.com/DavidHDev/react-bits) | 每个词把滚动映射到 opacity、blur、rotation；现有文档生成改变行存在状态，sticky ink 只改颜色。 | 一段宣言随滚动从倾斜雾字逐词落成清晰黑墨。<br>**Capture：**滚动 0→100% 并在 30%、65% 停顿显示局部解析。 | 17/18/19/15/15/9 = **93** | **high**：许可未明；过度 blur 会损害可读性和 reduced-motion。 |
| 17 | `pixel-grid-content-dissolve`<br>像素网格内容溶解<br>Pixel-grid content dissolve | hover/click → Propagate a discrete cell wave that swaps two content trees；sequenced grid mask transition；card content surface | **React Bits PixelTransition** / React DOM<br>[官方效果来源](https://github.com/DavidHDev/react-bits/blob/main/public/r/PixelTransition-TS-TW.json)<br>[实现项目](https://github.com/DavidHDev/react-bits) | 离散 DOM 单元波把任意内容树切到另一内容；现有深度溶解按空间深度、位移切换按纹理。 | 档案照片按棋盘波溶解成排版说明，再反向恢复。<br>**Capture：**hover 触发→停在 50% 网格峰值→完成→leave 反向。 | 18/19/19/15/15/9 = **95** | **high**：许可未明；必须显示真实单元传播，不可用 CSS mosaic filter 替代。 |
| 18 | `bubble-to-navigation-morph`<br>气泡到导航变形<br>Bubble-to-navigation morph | menu toggle → Grow a compact bubble cluster into a full navigation surface；coordinated shape morph；navigation overlay | **React Bits BubbleMenu** / React DOM<br>[官方效果来源](https://github.com/DavidHDev/react-bits/blob/main/public/r/BubbleMenu-TS-TW.json)<br>[实现项目](https://github.com/DavidHDev/react-bits) | 圆形控制通过多个气泡协调扩张为导航面，不是 clip 帘幕或分层板平移。 | 右下角三个气泡沿弧线汇合，铺展成全屏菜单星图。<br>**Capture：**click 打开→停在气泡汇合峰值→键盘关闭→复位。 | 18/19/19/15/15/9 = **95** | **high**：许可未明；需避免与 clip-path menu 只做外观差异。 |
| 19 | `neighbor-magnifying-navigation-dock`<br>邻项放大导航坞<br>Neighbor-magnifying navigation dock | pointer proximity / keyboard focus → Magnify the nearest icon and smoothly distribute scale to neighbors；continuous proximity field；navigation dock | **React Bits Dock** / React DOM<br>[官方效果来源](https://github.com/DavidHDev/react-bits/blob/main/public/r/Dock-TS-TW.json)<br>[实现项目](https://github.com/DavidHDev/react-bits) | 指针距离连续分配当前项及邻项尺度；不是整体卡片 tilt 或单目标 hover scale。 | 八枚抽象工具图标随指针移动形成一条连续放大波。<br>**Capture：**pointer 匀速扫过全 dock→停在中间→键盘 ArrowRight 移焦。 | 16/18/18/15/15/9 = **91** | **high**：许可未明；键盘 focus 必须有等价反馈，不能只做鼠标。 |
| 20 | `layered-staggered-full-screen-menu`<br>分层交错全屏菜单<br>Layered staggered full-screen menu | menu toggle → Sweep layered underplates before staggered navigation labels；multi-stage layered entrance；full-screen navigation | **React Bits StaggeredMenu** / React DOM<br>[官方效果来源](https://github.com/DavidHDev/react-bits/blob/main/public/r/StaggeredMenu-TS-TW.json)<br>[实现项目](https://github.com/DavidHDev/react-bits) | 多个彩色底板先后横扫，再逐项揭示菜单；与单一 polygon 帘幕和气泡 morph 不同。 | 紫、绿、黑三层板依次扫入，四个超大菜单标签从边缘落位。<br>**Capture：**打开→录三层过场→hover 一项→关闭反向收层。 | 17/19/19/15/15/9 = **94** | **high**：许可未明；若仅标签 stagger 会与现有交错编排重复。 |
| 21 | `hover-activated-image-marquee-menu`<br>悬停激活图像跑马菜单<br>Hover-activated image marquee menu | row hover/focus → Replace a menu row with a flowing repeated text-image strip；temporary row-local loop；navigation list row | **React Bits FlowingMenu** / React DOM<br>[官方效果来源](https://github.com/DavidHDev/react-bits/blob/main/public/r/FlowingMenu-TS-TW.json)<br>[实现项目](https://github.com/DavidHDev/react-bits) | 每一菜单行在 hover 时变成重复文字与图像的流动条；不是静态 overlay 或普通 logo marquee。 | 四行地貌菜单，悬停“MOJAVE”后照片与字从两侧穿行。<br>**Capture：**依次 hover 两行→在每行中点停 700ms→leave 复位。 | 18/19/19/15/15/9 = **95** | **high**：许可未明；图片必须原创且 hover/focus 都可触发。 |
| 22 | `drag-thrown-card-stack`<br>拖拽甩出卡片堆<br>Drag-thrown card stack | pointer drag/release → Throw the front card behind the deck and spring the next card forward；gesture velocity + ordered deck state；card stack | **React Bits Stack** / React DOM<br>[官方效果来源](https://github.com/DavidHDev/react-bits/blob/main/public/r/Stack-TS-TW.json)<br>[实现项目](https://github.com/DavidHDev/react-bits) | 前卡按真实拖拽速度甩到堆底，其余卡弹簧前移；不是刚体自由碰撞或网格重排。 | 五张摄影卡堆，用户把前卡向右上甩出，卡片绕回底层。<br>**Capture：**慢拖回弹→快速甩出→等待下一卡归位→再向反方向甩。 | 18/18/19/15/15/9 = **94** | **high**：许可未明；随机旋转要固定，防止 capture 不可复现。 |
| 23 | `metaball-blob-cursor`<br>融球液滴光标<br>Metaball blob cursor | pointer move → Trail several soft blobs that merge under a gooey field；continuous inertial follow；cursor overlay | **React Bits BlobCursor** / Canvas/SVG filter<br>[官方效果来源](https://github.com/DavidHDev/react-bits/blob/main/public/r/BlobCursor-TS-TW.json)<br>[实现项目](https://github.com/DavidHDev/react-bits) | 多个软体跟随物以不同惯性速度融合；现有情境光标保持单主体，鱼群不代表用户指针。 | 三个紫色液滴穿过圆形目标时拉伸、分离再融合。<br>**Capture：**pointer 走 8 字→急停→录下尾部追上融合。 | 18/19/19/15/15/9 = **95** | **high**：许可未明；必须真正呈现融合，三个独立圆点不合格。 |
| 24 | `velocity-spaced-image-trail`<br>速度间隔图像尾迹<br>Velocity-spaced image trail | pointer travel distance → Spawn photographic cards at velocity-aware spatial intervals and fade them；distance-threshold media trail；pointer overlay | **React Bits ImageTrail** / React DOM<br>[官方效果来源](https://github.com/DavidHDev/react-bits/blob/main/public/r/ImageTrail-TS-TW.json)<br>[实现项目](https://github.com/DavidHDev/react-bits) | 指针累计距离超过阈值才生成整张媒体卡，并根据速度决定间距；不是光标粒子或动态图块 rail。 | 指针在黑色画布上画弧线，六张原创花朵照片沿轨迹翻转消散。<br>**Capture：**先慢移不触发→快速弧线生成→停住观察依次淡出。 | 19/19/19/15/15/9 = **96** | **high**：源码约 39KB 且许可未明；图片资产与随机序列必须固定。 |
| 25 | `gooey-pixel-cursor-wake`<br>黏性像素光标尾流<br>Gooey pixel cursor wake | pointer move → Activate quantized cells under the pointer and decay them through a gooey filter；continuous grid wake with decay；fixed pixel field | **React Bits PixelTrail** / Canvas/SVG filter<br>[官方效果来源](https://github.com/DavidHDev/react-bits/blob/main/public/r/PixelTrail-TS-TW.json)<br>[实现项目](https://github.com/DavidHDev/react-bits) | 固定网格单元按指针距离亮起并黏连衰减；不是自由移动的图片尾迹或粒子。 | 酸绿色像素墙被指针书写成临时符号，随后逐格熄灭。<br>**Capture：**画圆和直线→停住→录下网格逐步衰减到空。 | 18/18/19/15/15/9 = **94** | **high**：许可未明；网格尺寸需在缩略图可见并固定 DPR。 |
| 26 | `snapping-target-reticle-cursor`<br>吸附目标准星光标<br>Snapping target-reticle cursor | pointer proximity/focus → Travel and resize a reticle to lock onto marked targets；spring target acquisition；cursor overlay around DOM targets | **React Bits TargetCursor** / React DOM<br>[官方效果来源](https://github.com/DavidHDev/react-bits/blob/main/public/r/TargetCursor-TS-TW.json)<br>[实现项目](https://github.com/DavidHDev/react-bits) | 四角准星移动并按目标边界重设尺寸；现有情境光标只换媒体/文字角色，不几何锁定元素。 | 准星在三种尺寸的仪器按钮之间锁定，角标旋转后停止。<br>**Capture：**pointer 依次接近三个目标→记录 resize/snap→离开回自由态。 | 18/18/19/15/15/9 = **94** | **high**：许可未明；必须从 getBoundingClientRect 计算目标，不可写死坐标。 |
| 27 | `pointer-reactive-cell-grid`<br>指针响应单元格网格<br>Pointer-reactive cell grid | pointer move/click → Modulate cell geometry by pointer distance and emit a radial click pulse；continuous distance field plus impulse；Canvas/WebGL cell grid | **React Bits CursorGrid** / Canvas/WebGL<br>[官方效果来源](https://github.com/DavidHDev/react-bits/blob/main/public/r/CursorGrid-TS-TW.json)<br>[实现项目](https://github.com/DavidHDev/react-bits) | 持久几何网格按指针距离调制每格描边/填充并产生点击波；不是像素尾流的二值亮灭。 | 一面等距方格随指针弯曲成浅坑，点击时脉冲扩散。<br>**Capture：**pointer 横穿→停中心→click→等待脉冲越过四周。 | 17/18/18/15/14/9 = **91** | **high**：许可未明；需验证网格主体而非文字说明承担辨识度。 |

## Batch C（27 项）

明确 ID 清单：

1. `slider-controlled-exploded-3d-assembly`
2. `collision-reactive-3d-physics-stack`
3. `refractive-glass-transmission-sculpture`
4. `cinematic-map-camera-fly-to`
5. `pickable-extruded-data-columns`
6. `curved-3d-text-orbit`
7. `cursor-projected-3d-surface-marker`
8. `drag-resizable-audio-loop-region`
9. `streaming-line-chart-window`
10. `handle-connected-animated-node-editor`
11. `bending-webgl-gallery-ribbon`
12. `draggable-dome-gallery`
13. `animated-dom-node-connection-beam`
14. `clip-shape-theme-reveal`
15. `sticky-paragraph-ink-reveal`
16. `draggable-force-directed-svg-network`
17. `voronoi-nearest-point-hover-focus`
18. `linked-brush-to-zoom-chart`
19. `click-to-collapse-hierarchy-branches`
20. `velocity-sensitive-signature-ink`
21. `pressure-shaped-freehand-stroke`
22. `drag-editable-bezier-curve-handles`
23. `image-palette-ambient-color-transition`
24. `blurhash-to-photo-progressive-reveal`
25. `live-hand-landmark-video-overlay`
26. `frame-by-frame-gif-scrubber`
27. `scroll-controlled-video-scrubbing`

| # | 稳定 ID / 中英名 | 核心机制 | 推荐真实实现与一手来源 | 不重复理由 | Demo 场景与 capture 动作 | 六维预评分 | 风险 |
| ---: | --- | --- | --- | --- | --- | --- | --- |
| 1 | `slider-controlled-exploded-3d-assembly`<br>滑杆控制 3D 爆炸装配<br>Slider-controlled exploded 3D assembly | range drag → Separate and recombine authored parts along assembly vectors；continuous reversible structural mapping；Three.js mesh assembly | **three.js** / WebGL<br>[官方效果来源](https://github.com/mrdoob/three.js)<br>[实现项目](https://github.com/mrdoob/three.js) | 滑杆改变零件相对结构而非相机；现有 3D/Shader Demo 没有装配轴和可逆拆解。 | 原创轨道相机由六个程序化几何零件沿轴爆炸分解。<br>**Capture：**拖 range 0→1→.45→0；同时轻微 orbit 验证真实 3D。 | 17/19/18/15/15/10 = **94** | **medium**：各部件轴必须有设计逻辑；单纯把方块散开会低分。 |
| 2 | `collision-reactive-3d-physics-stack`<br>碰撞响应 3D 物理堆栈<br>Collision-reactive 3D physics stack | spawn/physics collision → Drop rigid bodies and flash materials from real collision impulses；fixed-step persistent 3D physics；React Three Fiber scene | **React Three Rapier** / WebGL + Rapier WASM<br>[官方效果来源](https://github.com/pmndrs/react-three-rapier)<br>[实现项目](https://github.com/pmndrs/react-three-rapier) | 3D 刚体碰撞按冲量改变可见状态；Matter 海报堆是二维且没有事件材质反馈。 | 半透明方块落在黑色基座，强碰撞激发不同亮度的波环。<br>**Capture：**点击生成三块→录第一次强碰撞→拖动一块砸入堆栈。 | 18/19/20/15/15/9 = **96** | **high**：WASM、固定时间步与无声可读反馈都需验证。 |
| 3 | `refractive-glass-transmission-sculpture`<br>折射玻璃透射雕塑<br>Refractive glass transmission sculpture | pointer/time → Rotate a transmissive sculpture and refract a live striped environment；continuous optical response；3D mesh material | **Drei MeshTransmissionMaterial** / WebGL<br>[官方效果来源](https://github.com/pmndrs/drei)<br>[实现项目](https://github.com/pmndrs/drei) | 物体以厚度、色散和畸变折射实时背景；现有虹彩 shader 平面不模拟透射光学。 | 玻璃结体前后穿过程序化彩色条纹，拖动时折射方向改变。<br>**Capture：**自动转一圈→pointer drag 改视角→停在高色散峰值。 | 18/20/18/15/15/9 = **95** | **high**：禁止依赖无许可 HDRI；低端 GPU 需清楚降级。 |
| 4 | `cinematic-map-camera-fly-to`<br>电影式地图相机飞行<br>Cinematic map camera fly-to | click/timer → Fly a projected map camera through center, zoom, pitch, and bearing；eased continuous geographic camera；MapLibre WebGL map | **MapLibre GL JS** / WebGL vector map<br>[官方效果来源](https://github.com/maplibre/maplibre-gl-js)<br>[实现项目](https://github.com/maplibre/maplibre-gl-js) | 同时插值中心、缩放、俯仰与方位角；点阵地球只旋转球体，其他 3D 场景不含地理投影。 | 无标签的本地矢量地图从全球视角飞入一枚发光城市节点。<br>**Capture：**点击城市→完整 flyTo→停 500ms→reset 回全球。 | 15/18/18/15/14/9 = **89** | **high**：GitHub SPDX 未断言；必须使用本地 style/GeoJSON，不能依赖远程瓦片。 |
| 5 | `pickable-extruded-data-columns`<br>可拾取挤出数据柱<br>Pickable extruded data columns | hover/drag → Pick instanced data columns, elevate the active mark, and update a tooltip；continuous camera plus discrete GPU picking；deck.gl WebGL layer | **deck.gl ColumnLayer** / WebGL2<br>[官方效果来源](https://github.com/visgl/deck.gl)<br>[实现项目](https://github.com/visgl/deck.gl) | GPU 实例柱以数据高度编码并通过真实 picking 返回对象；多图表启动是二维时序。 | 36 根城市信号柱在深色平面上生长，悬停单柱升起并显示名称。<br>**Capture：**orbit 20°→hover 三柱→停在最高柱→leave 清除。 | 16/18/18/15/14/9 = **90** | **medium**：必须是真实 picking；用 DOM 热区模拟命中不合格。 |
| 6 | `curved-3d-text-orbit`<br>弯曲三维文字环绕<br>Curved 3D text orbit | pointer/time → Bend crisp SDF glyphs around a radius and orbit them in depth；continuous 3D typographic motion；Three.js SDF text | **troika-three-text** / WebGL<br>[官方效果来源](https://github.com/protectwise/troika)<br>[实现项目](https://github.com/protectwise/troika) | SDF 字体沿深度半径弯曲并在三维空间环绕；SVG 曲线传送带仍是平面路径排字。 | DEPTH/ORBIT 两行字在圆柱内外相反方向转动并穿过镜头。<br>**Capture：**等待 sync→自动 orbit→pointer drag 相机→停在前后遮挡峰值。 | 18/19/18/15/15/9 = **94** | **high**：字体文件必须本地且许可明确；未等待 sync 会录到空白首帧。 |
| 7 | `cursor-projected-3d-surface-marker`<br>光标投射三维表面标记<br>Cursor-projected 3D surface marker | pointer move/click → Raycast onto a mesh, align a marker to the face normal, and leave fading stamps；continuous surface tracking plus click imprint；Three.js mesh surface | **three.js Raycaster** / WebGL<br>[官方效果来源](https://github.com/mrdoob/three.js)<br>[实现项目](https://github.com/mrdoob/three.js) | Raycaster 把二维光标投到起伏网格并让标记沿面法线贴合；现有光标都停留在屏幕平面。 | 波浪状纸面上准星贴着坡度移动，点击留下会褪色的印章。<br>**Capture：**pointer 横跨峰谷→三次 click→orbit 证明印章贴在表面。 | 18/18/18/15/15/10 = **94** | **medium**：必须真实 raycast 和 face normal；屏幕坐标直接移动属于伪造。 |
| 8 | `drag-resizable-audio-loop-region`<br>可拖拽缩放音频循环区<br>Drag-resizable audio loop region | drag/resize/click → Edit both boundaries of an audio region and loop its playback；persistent temporal selection with looping playhead；waveform canvas | **WaveSurfer Regions plugin** / Canvas + audio<br>[官方效果来源](https://github.com/katspaugh/wavesurfer.js)<br>[实现项目](https://github.com/katspaugh/wavesurfer.js) | 用户编辑时间区间两端并循环播放；A/B 音频比较改变混合比例而不改变时间范围。 | 本地 8 秒节奏波形上，紫色循环区可拖动与缩放。<br>**Capture：**拖左边界→拖右边界→点击 region 播放→录下 playhead 回环。 | 17/17/18/15/15/9 = **91** | **medium**：需本地生成音频；视觉必须独立于声音可读。 |
| 9 | `streaming-line-chart-window`<br>流式折线图窗口推进<br>Streaming line-chart window | data timer/event → Advance a fixed data window and interpolate each incoming telemetry sample；continuous recent-history stream；Canvas chart | **Apache ECharts** / Canvas<br>[官方效果来源](https://github.com/apache/echarts)<br>[实现项目](https://github.com/apache/echarts) | 新数据从右进入、旧数据滑出且整窗连续插值；多图表启动只展示一次上线序列。 | 一条固定 60 样本心跳曲线不断前移，越过阈值时整段短暂变色。<br>**Capture：**固定数据序列运行 6 次更新→停在阈值峰值→继续恢复。 | 15/18/18/15/14/9 = **89** | **medium**：禁止 Math.random；默认图表主题会降低艺术分。 |
| 10 | `handle-connected-animated-node-editor`<br>手柄连线动画节点编辑器<br>Handle-connected animated node editor | node drag / handle connect → Create topology from handles and animate data flow through the new edge；direct manipulation with persistent graph state；DOM/SVG node canvas | **React Flow** / DOM + SVG<br>[官方效果来源](https://github.com/xyflow/xyflow)<br>[实现项目](https://github.com/xyflow/xyflow) | 用户从 source handle 建立真实拓扑，成功后流光沿边运行；DOM beam 只连接预先存在的节点。 | 输入、模型、输出三节点，用户拖线成功后下游节点逐步点亮。<br>**Capture：**从 Input handle 拖到 Model→再连 Output→移动中间节点观察边更新。 | 15/17/18/15/15/9 = **89** | **medium**：必须真实 handle-to-handle pointer；预写 SVG 连线不合格。 |
| 11 | `bending-webgl-gallery-ribbon`<br>弯曲 WebGL 图库丝带<br>Bending WebGL gallery ribbon | wheel/drag → Scroll media planes along a continuously bent cylindrical ribbon；inertial looping gallery motion；WebGL media strip | **React Bits CircularGallery** / WebGL<br>[官方效果来源](https://github.com/DavidHDev/react-bits/blob/main/public/r/CircularGallery-TS-TW.json)<br>[实现项目](https://github.com/DavidHDev/react-bits) | 媒体平面整体弯成连续圆柱丝带；拖拽穹顶在半球表面分布，现有轮播没有几何弯曲。 | 九张抽象纹理沿弧形胶片带循环，中心项最清晰。<br>**Capture：**wheel 加速→反向 drag→释放惯性→停中心卡。 | 19/20/19/15/15/9 = **97** | **high**：React Bits 许可未明，源码约 26KB；图片资产和 WebGL 性能需控制。 |
| 12 | `draggable-dome-gallery`<br>可拖拽穹顶图库<br>Draggable dome gallery | pointer drag → Rotate a hemispherical image field and expand a selected tile from its surface；continuous spherical navigation plus discrete focus；WebGL dome | **React Bits DomeGallery** / WebGL<br>[官方效果来源](https://github.com/DavidHDev/react-bits/blob/main/public/r/DomeGallery-TS-TW.json)<br>[实现项目](https://github.com/DavidHDev/react-bits) | 图片分布在半球内壁并随拖拽改变观察方向；弯曲丝带是一维连续轨道。 | 星空档案照片铺在穹顶内壁，点击一张沿径向展开。<br>**Capture：**drag 横向 100px→纵向 80px→点击目标→Esc 收回。 | 19/19/19/15/15/9 = **96** | **high**：许可未明，源码约 35KB；需防止和 360 全景混淆并固定相机。 |
| 13 | `animated-dom-node-connection-beam`<br>DOM 节点连接光束<br>Animated DOM-node connection beam | layout/time → Route a light pulse between measured DOM anchors and update when they move；continuous geometry-bound beam；SVG overlay between DOM nodes | **Magic UI AnimatedBeam** / DOM + SVG<br>[官方效果来源](https://github.com/magicuidesign/magicui/blob/main/apps/www/content/docs/components/animated-beam.mdx)<br>[实现项目](https://github.com/magicuidesign/magicui) | 根据真实 DOM 节点边界实时路由光束；节点编辑器由用户创建边，现有 SVG 描边沿固定路径。 | 三枚工具节点围绕模型节点移动，光束始终重新弯曲连接。<br>**Capture：**开始流动→拖动一个节点→resize 容器→录下路径持续对齐。 | 17/18/19/15/15/9 = **93** | **medium**：不可画死 SVG；字体/布局稳定后才能计算节点中心。 |
| 14 | `clip-shape-theme-reveal`<br>裁剪形状主题揭示<br>Clip-shape theme reveal | theme toggle → Reveal the next global color theme from the invocation point through an expanding clip；one-shot reversible view transition；whole document | **View Transitions API / Magic UI** / document compositor<br>[官方效果来源](https://github.com/magicuidesign/magicui/blob/main/apps/www/content/docs/components/animated-theme-toggler.mdx)<br>[实现项目](https://github.com/magicuidesign/magicui) | 新主题通过点击原点的圆形 View Transition 扩散；场景换幕改变内容，菜单帘幕只揭示 overlay。 | 太阳按钮位于海报角落，白昼主题从按钮圆心扩张覆盖夜景。<br>**Capture：**click 切到 light→录圆半径穿过主体→再次点击从新原点回 dark。 | 17/18/19/15/15/9 = **93** | **medium**：Safari/旧浏览器需要非动画降级；不能用固定中心 clip 冒充点击原点。 |
| 15 | `sticky-paragraph-ink-reveal`<br>粘性段落逐词着色<br>Sticky paragraph ink reveal | scroll progress → Fill the ink of a sticky paragraph word by word；continuous per-word color scrub；sticky typography block | **Magic UI TextReveal** / React DOM<br>[官方效果来源](https://github.com/magicuidesign/magicui/blob/main/apps/www/content/docs/components/text-reveal.mdx)<br>[实现项目](https://github.com/magicuidesign/magicui) | 段落固定不动，滚动只逐词改变墨色；blur-rotate reveal 同时改变模糊和姿态。 | 一段宣言固定在纸面中央，滚动让灰字逐词变为浓墨和单个强调色。<br>**Capture：**scroll 0→100%，在句号与强调词处停顿，再反向擦淡。 | 16/18/18/15/15/9 = **91** | **low**：必须依靠排版达到艺术门槛；单纯 opacity 映射可能分数不足。 |
| 16 | `draggable-force-directed-svg-network`<br>可拖拽力导向 SVG 网络<br>Draggable force-directed SVG network | simulation / pointer drag → Settle graph nodes under forces and temporarily pin a node through dragging；continuous physics with interactive constraint；SVG graph | **D3 force** / SVG<br>[官方效果来源](https://d3js.org/d3-force)<br>[实现项目](https://github.com/d3/d3) | 节点持续受图力约束且可被拖拽暂时钉住；节点编辑器修改拓扑，DOM beam 无物理模拟。 | 九个创作角色节点自动成簇，拖动“Director”会牵动全部关联者。<br>**Capture：**等待 settle→拖中心节点越过画面→释放→录下网络重新稳定。 | 17/17/19/15/15/9 = **92** | **medium**：需固定初始坐标，减少随机 simulation 差异。 |
| 17 | `voronoi-nearest-point-hover-focus`<br>Voronoi 最近点悬停聚焦<br>Voronoi nearest-point hover focus | pointer move → Snap a chart focus marker to the mathematically nearest datum；continuous nearest-neighbor selection；SVG data plot | **D3 Delaunay** / SVG<br>[官方效果来源](https://d3js.org/d3-delaunay)<br>[实现项目](https://github.com/d3/d3) | 不可见 Voronoi 索引让稀疏数据按数学最近点吸附焦点；不是按元素边界的光标准星。 | 稀疏星图散点中，焦点圆和信息标签连续吸附最近星体。<br>**Capture：**pointer 沿无点区域移动→跨越三个 Voronoi 边界→停在孤立点。 | 17/17/18/15/15/9 = **91** | **low**：必须由 Delaunay.find 计算，不能只监听 circle hover。 |
| 18 | `linked-brush-to-zoom-chart`<br>联动框选缩放图表<br>Linked brush-to-zoom chart | drag brush handles → Select a time interval in an overview and rescale a linked focus chart；continuous linked-domain manipulation；paired SVG charts | **D3 brush** / SVG<br>[官方效果来源](https://d3js.org/d3-brush)<br>[实现项目](https://github.com/d3/d3) | 下方概览 brush 的选择区间重设上方主图 domain；普通媒体 pan/zoom 没有双图联动。 | 一条气候曲线主图与迷你概览，下方选择窗拖动时上图重绘。<br>**Capture：**拖左 handle 缩小范围→整体平移 brush→双击 reset。 | 15/17/18/15/15/9 = **89** | **low**：交互偏功能性，需编辑式色彩和清晰过渡达到艺术线。 |
| 19 | `click-to-collapse-hierarchy-branches`<br>点击折叠层级分支<br>Click-to-collapse hierarchy branches | node click / keyboard activation → Collapse and restore descendant branches with animated tree reflow；discrete hierarchy state with layout transition；SVG tree | **D3 hierarchy/tree** / SVG<br>[官方效果来源](https://d3js.org/d3-hierarchy/tree)<br>[实现项目](https://github.com/d3/d3) | 点击节点移除/恢复后代并重新计算树布局；节点编辑器新建任意边，力网络没有层级深度。 | 创作流程树从“Concept”展开到文字、光线、声音，再折叠分支。<br>**Capture：**click 折叠最大分支→观察 sibling 重排→键盘重新展开。 | 15/17/18/15/14/9 = **88** | **medium**：动画 reflow 必须保持对象身份；瞬间重画会像普通图表。 |
| 20 | `velocity-sensitive-signature-ink`<br>速度感应签名墨迹<br>Velocity-sensitive signature ink | pointer draw → Vary smoothed ink width from signing velocity and preserve the completed signature；continuous stroke with velocity filtering；Canvas ink surface | **Signature Pad** / Canvas 2D<br>[官方效果来源](https://github.com/szimek/signature_pad)<br>[实现项目](https://github.com/szimek/signature_pad) | 笔宽根据签署速度平滑变化并可导出；perfect-freehand 更强调压力输入和填充轮廓。 | 在米白纸张上先慢写宽线，再快速甩出细尾，完成一枚抽象签名。<br>**Capture：**自动 pointer 以慢/快两段轨迹绘制→停在完成态→clear 重播。 | 16/17/18/15/15/9 = **90** | **low**：capture 要使用真实 pointer 输入；预烘焙 SVG 路径不合格。 |
| 21 | `pressure-shaped-freehand-stroke`<br>压力塑形自由笔触<br>Pressure-shaped freehand stroke | pointer pressure / drag → Convert raw pressure points into a smooth filled outline；continuous pressure-aware geometry；Canvas/SVG freehand surface | **perfect-freehand** / Canvas 2D<br>[官方效果来源](https://github.com/steveruizok/perfect-freehand)<br>[实现项目](https://github.com/steveruizok/perfect-freehand) | raw pressure 样本被转换为可填充变宽轮廓；签名墨迹以速度滤波为主。 | 同一条蛇形线随模拟 pressure 从针尖逐渐变成宽阔色带。<br>**Capture：**派发固定 pressure 0.1→0.9→0.2 的 pointer 轨迹→undo→重播。 | 17/17/19/15/15/9 = **92** | **medium**：鼠标 pressure 常固定，capture 必须合成真实 PointerEvent pressure 并记录。 |
| 22 | `drag-editable-bezier-curve-handles`<br>可拖拽编辑贝塞尔曲线手柄<br>Drag-editable Bézier curve handles | pointer drag → Move curve handles and continuously recompute path geometry and tangents；direct reversible geometry editing；Paper.js Canvas vector surface | **Paper.js** / Canvas 2D<br>[官方效果来源](https://github.com/paperjs/paper.js)<br>[实现项目](https://github.com/paperjs/paper.js) | 拖动可见控制点实时重算曲线与切线；曲线文字只沿既定路径运输。 | 三点霓虹曲线带两个可见手柄，拖动中点让光带从拱形变成 S 形。<br>**Capture：**drag 中点→drag 切线端→double click reset。 | 16/18/18/15/15/9 = **91** | **medium**：GitHub SPDX 未断言；需核验许可并避免退化为普通 draggable dot。 |
| 23 | `image-palette-ambient-color-transition`<br>图像取色环境色转场<br>Image-palette ambient color transition | image load / slide selection → Extract the dominant palette and transition the surrounding interface to match；discrete source-driven color handoff；background around media | **Color Thief + Web Animations API** / DOM + Canvas sampling<br>[官方效果来源](https://github.com/lokesh/color-thief)<br>[实现项目](https://github.com/lokesh/color-thief) | 界面背景色从当前图片像素提取并动画匹配；模糊视频 ambience 复用动态画面而非提取静态主色。 | 三张原创静物照片切换时，整页环境色从靛蓝过渡到赭石再到薄荷。<br>**Capture：**点击三张缩略图→等待 image load→录下两次主色 transition。 | 16/19/18/15/15/9 = **92** | **medium**：需本地同源图片避免 Canvas taint；必须真实调用取色 API。 |
| 24 | `blurhash-to-photo-progressive-reveal`<br>BlurHash 到照片渐进揭示<br>BlurHash-to-photo progressive reveal | image request/load → Decode a tiny content-aware color field and crossfade into the full image；progressive two-stage media load；image card | **BlurHash** / Canvas + image<br>[官方效果来源](https://github.com/woltapp/blurhash)<br>[实现项目](https://github.com/woltapp/blurhash) | 紧凑编码色场先出现再交接高清图；普通 skeleton 没有内容相关色彩，图像 ambience 不表达加载。 | 三张照片先显示 32×32 BlurHash 色块，延迟后高清图从中心清晰。<br>**Capture：**阻断图片 900ms→显示 hash→解除加载→录下交叉淡化。 | 15/18/17/15/14/9 = **88** | **low**：必须使用真实 hash decode；模糊同一图片不等于 BlurHash。 |
| 25 | `live-hand-landmark-video-overlay`<br>视频手部关键点叠加<br>Live hand-landmark video overlay | video frame inference → Track articulated hand landmarks and draw a live skeleton and fingertip trails；continuous model-driven tracking；video + Canvas overlay | **MediaPipe Hand Landmarker** / video + Canvas 2D<br>[官方效果来源](https://github.com/google-ai-edge/mediapipe)<br>[实现项目](https://github.com/google-ai-edge/mediapipe) | 模型从视频帧推导关节几何并保持手指身份；现有交互均不从媒体内容实时推理结构。 | 许可明确的本地手势短片上绘制 21 点骨架，指尖留下三色轨迹。<br>**Capture：**播放固定 5s 视频→录制张手/捏合/指向三姿态→循环。 | 19/18/19/15/15/8 = **94** | **high**：模型/WASM 大，必须打包许可明确视频；预标注 JSON 不能冒充推理。 |
| 26 | `frame-by-frame-gif-scrubber`<br>逐帧 GIF 擦洗器<br>Frame-by-frame GIF scrubber | range drag → Decode disposal-aware GIF frames and scrub them nonlinearly；direct discrete frame selection；Canvas media inspector | **gifuct-js** / Canvas 2D<br>[官方效果来源](https://github.com/matt-way/gifuct-js)<br>[实现项目](https://github.com/matt-way/gifuct-js) | range 非线性选择解码后的合成帧；目录中的 GIF 只是播放预览，视频 scrub 使用媒体 timecode。 | 原创 24 帧墨滴 GIF 旁带时间刻度，拖动可正放、倒放、跳帧。<br>**Capture：**drag slider 0→23→8→17，展示 disposal 后画面仍正确。 | 16/17/18/15/15/9 = **90** | **medium**：必须正确合成 disposal frames；逐帧 PNG 列表不算真实 GIF 解码。 |
| 27 | `scroll-controlled-video-scrubbing`<br>滚动控制视频擦洗<br>Scroll-controlled video scrubbing | scroll progress → Map section progress directly to the current time of one video；continuous reversible media scrub；video timeline | **Motion useScroll + HTMLVideoElement** / video<br>[官方效果来源](https://motion.dev/docs/react-use-scroll)<br>[实现项目](https://github.com/motiondivision/motion) | 规范化滚动进度直接设置视频 timecode；首屏影片按自身 duration 自动播放交接，文档回放改变 DOM 内容。 | 一段原创花朵开合影片被固定在纸面窗口，滚动逐帧控制开放程度。<br>**Capture：**真实 scroll 0→65%→20%→100%，证明正向与反向 scrub。 | 18/19/19/15/15/9 = **95** | **medium**：视频需关键帧密集且本地；不能通过切换预导出静帧模拟 currentTime。 |

## 高风险项

共有 **30 项 high risk**。高风险不代表拒绝，而是实现前必须先解决阻断条件：

1. `duration-aware-hero-film-handoff`：需制作四段本地可再分发媒体；不能把 GIF 里看不见的预载逻辑当作效果证据。
2. `hover-rehearsed-video-style-rail`：需要五段本地视频并同时验证键盘、hover 和 click 三种输入。
3. `playable-brand-minesweeper-footer`：不要膨胀成完整游戏；确定性雷区与键盘可用性是捕获前提。
4. `noise-cancellation-audio-comparison`：需原创双轨与真实同步音频；静音 GIF 必须靠波形和频段差解释。
5. `track-card-play-state-handoff`：创意余量仅 84；若素材与排版不足应在正式评分时删除。
6. `audio-equalizer-typography`：必须使用 AnalyserNode；随机 bar animation 直接拒绝。
7. `interactive-vector-state-machine`：必须有自制或许可明确的 .riv 资产；远程社区资产不可直接打包。
8. `dom-to-3d-scroll-synchronization`：React/WebGL 构建重；任何像素漂移都会破坏证据。
9. `pointer-injected-gpu-fluid`：GPU 差异和时间步会影响复现；需固定输入并逐机验收。
10. `sticky-card-stack-accumulation`：React Bits 仓库未给标准 SPDX；复制源码前必须补许可结论。
11. `velocity-reactive-marquee`：许可未明；必须测真实滚动速度而非只按方向切 class。
12. `scrubbed-word-blur-rotate-reveal`：许可未明；过度 blur 会损害可读性和 reduced-motion。
13. `pixel-grid-content-dissolve`：许可未明；必须显示真实单元传播，不可用 CSS mosaic filter 替代。
14. `bubble-to-navigation-morph`：许可未明；需避免与 clip-path menu 只做外观差异。
15. `neighbor-magnifying-navigation-dock`：许可未明；键盘 focus 必须有等价反馈，不能只做鼠标。
16. `layered-staggered-full-screen-menu`：许可未明；若仅标签 stagger 会与现有交错编排重复。
17. `hover-activated-image-marquee-menu`：许可未明；图片必须原创且 hover/focus 都可触发。
18. `drag-thrown-card-stack`：许可未明；随机旋转要固定，防止 capture 不可复现。
19. `metaball-blob-cursor`：许可未明；必须真正呈现融合，三个独立圆点不合格。
20. `velocity-spaced-image-trail`：源码约 39KB 且许可未明；图片资产与随机序列必须固定。
21. `gooey-pixel-cursor-wake`：许可未明；网格尺寸需在缩略图可见并固定 DPR。
22. `snapping-target-reticle-cursor`：许可未明；必须从 getBoundingClientRect 计算目标，不可写死坐标。
23. `pointer-reactive-cell-grid`：许可未明；需验证网格主体而非文字说明承担辨识度。
24. `collision-reactive-3d-physics-stack`：WASM、固定时间步与无声可读反馈都需验证。
25. `refractive-glass-transmission-sculpture`：禁止依赖无许可 HDRI；低端 GPU 需清楚降级。
26. `cinematic-map-camera-fly-to`：GitHub SPDX 未断言；必须使用本地 style/GeoJSON，不能依赖远程瓦片。
27. `curved-3d-text-orbit`：字体文件必须本地且许可明确；未等待 sync 会录到空白首帧。
28. `bending-webgl-gallery-ribbon`：React Bits 许可未明，源码约 26KB；图片资产和 WebGL 性能需控制。
29. `draggable-dome-gallery`：许可未明，源码约 35KB；需防止和 360 全景混淆并固定相机。
30. `live-hand-landmark-video-overlay`：模型/WASM 大，必须打包许可明确视频；预标注 JSON 不能冒充推理。

## 实施与准入顺序

1. 每批先挑 3 个代表项做 Demo、capture、provenance 和并排视觉验收，样本通过后再扩大。
2. 真实实现优先使用 JSON 中的 `implementation.library` 与 `snippet`；若因许可改写，必须保留相同 API 机制和主体行为，不能换技术做相似画面。
3. 随机、物理、流体、粒子和媒体系统固定种子、时间步、资源、输入轨迹、视口和 DPR。
4. 资产型效果只使用原创或许可明确的本地文件；远程视频、字体、Rive、HDRI、模型和手势素材不能靠缓存发布。
5. 每项完成后重新六维评分；总分或核心最低分不达标即从目录、README、manifest 和发布产物删除。

## 精确计数

- Batch A：20
- Batch B：27
- Batch C：27
- 新效果：74
- 当前入选：26
- 理论目标：`26 + 74 = 100`

JSON 是后续自动集成的规范来源；Markdown 的表格由同一 74 项数据生成，ID、批次、评分与风险保持一致。
