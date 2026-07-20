# Awesome Web Effects

[English (default)](README.md) · [在线 Demo](https://giraffe-tree.github.io/awesome-web-effects/)

一个**以效果为先、经过策展评分**的开源 Web 交互图鉴。当前发布 **7 个有效分类中的 100 种效果**，背后有 **14 个来源项目**。每个发布条目都有真实预览和不低于 **80/100** 的明确评分，并提供可复制的最小代码与可一键交给 Codex 或 Claude Code 的实现提示词。

## 效果优先模型

- **效果是目录主键。** 锚点、搜索结果、行、分类与代码示例都从用户看得见的交互出发，而不是从仓库出发。
- **项目是实现来源。** 一个项目可以实现多种不同效果；当前种子目录已有 4 个来源项目明确展示这种关系。
- **一种效果可以有多个实现。** 每个来源关系拥有自己的最小代码和预览状态，因此替代方案可以放在同一行中比较，不必复制效果行。
- **去重发生在可见效果层。** 候选按触发方式、视觉变化、时间关系和页面层级比较；更新、维护更好、文档更清楚的实现成为推荐来源。

## 目录快照

- 已审计 346 个候选；**100 个通过**，**246 个已从发布目录移除**。
- 100 行入选效果，其中 8 种为基线效果。
- 最近一次效果级扩展独立调研并新增 85 种效果。
- 14 个唯一 GitHub 来源项目；2026 扩展阶段新增 7 个。
- 100 个与具体来源对应的真实 GIF：2 个官方素材捕获，98 个来自可运行本地 Demo 的录制。
- 发布目录中有 0 个来源关系缺少已核验预览；准入门禁要求该数字始终为零。
- 100 份一键实现提示词，每种效果都有一份。
- 已把 40 条有证据的 AI 官网参考整合进 37 个原有特效行，共覆盖 35 家公司；每种特效最多展示 3 家代表公司。
- 2 个较旧但仍有参考价值的来源标记为“经典旧版”；不包含已归档仓库。
- Stars 是 **2026-07-20** 的快照，不是实时计数器。
- 已核验 GIF 优化后总计 **17.20 MiB**；每个发布预览均为 320×180、最长三秒且小于 1 MiB。

“推荐实现”和“在哪家公司官网观察到”是两种不同关系，现在会在同一个特效行中同时展示。先阅读 [Demo 准入评分体系与 346 个候选的当前审计](research/demo-admission-audit-2026-07-20.md)。完整官网观察记录见 [100 家 AI 公司主页特效调研](research/ai-native-homepages-100.md)。

## 收录与去重规则

1. 每一行必须有可核验的真实预览，并只描述一种能在普通网页中呈现的可见交互效果。
2. 人工评审按创意（20）、艺术完成度（20）、动效编排（20）、效果辨识（15）、创作迁移（15）、证据质量（10）评分。
3. 准入必须达到 80/100，并通过核心维度最低分；项目知名度和分类空缺不能降低门槛。
4. 每种效果必须有稳定的中英文名称、语义化效果 ID、分类和至少一个可核验来源。
5. 每种效果必须且只能有一个推荐来源；替代实现应加入同一行，不能复制效果。
6. 被拒绝的记录只可留在可追溯的候选审计数据中，不得进入网站、README 目录或发布资产集。

## 分类概览

| 分类 | 效果数 | 来源项目 | 关注结果 |
| --- | ---: | ---: | --- |
| [动画与编排](#animation) | 16 | 7 | 时间线、弹簧、补间、类动画与框架原生动效。 |
| [滚动与揭示](#scroll) | 11 | 3 | 平滑滚动、滚动关联场景、进入揭示、视差与整屏吸附。 |
| [页面与布局](#transition) | 12 | 3 | 页面转场、FLIP 动画、筛选、紧密排布与布局重排。 |
| [指针与悬停](#pointer) | 17 | 5 | 倾斜、景深、自定义光标、磁性运动与图像扭曲。 |
| [文本与 SVG](#vector) | 13 | 3 | 打字、文字拆分、矢量绘制、手写与 SVG 变形。 |
| [Canvas 与 2D](#canvas) | 18 | 3 | 场景图、创意编程、物理、绘图工具与 2D 渲染器。 |
| [3D 与 WebGL](#webgl) | 13 | 3 | 3D 引擎、声明式渲染器、着色器图层与后期处理。 |

## 效果目录

<a id="animation"></a>

### 动画与编排

时间线、弹簧、补间、类动画与框架原生动效。

| 效果 | 推荐实现 | 策展评分 | AI 官网参考（最多 3 家） | Stars | 实现数 | 状态 | 实现 |
| --- | --- | ---: | --- | ---: | ---: | --- | --- |
| [滚动擦洗主时间线](https://giraffe-tree.github.io/awesome-web-effects/#scroll-scrubbed-master-timeline) | [GSAP](https://github.com/greensock/GSAP) | **85/100** | [Hebbia](https://www.hebbia.com/)<br>[Decagon](https://decagon.ai/) | 26,600 | 1 | 当前推荐 | [评分 + 代码 + 提示词](https://giraffe-tree.github.io/awesome-web-effects/#scroll-scrubbed-master-timeline) |
| [共享布局弹簧变形](https://giraffe-tree.github.io/awesome-web-effects/#shared-layout-spring-morph) | [Motion](https://github.com/motiondivision/motion) | **94/100** | — | 32,819 | 1 | 当前推荐 | [评分 + 代码 + 提示词](https://giraffe-tree.github.io/awesome-web-effects/#shared-layout-spring-morph) |
| [交错变换编排](https://giraffe-tree.github.io/awesome-web-effects/#staggered-transform-choreography) | [Anime.js](https://github.com/juliangarnier/anime) | **92/100** | [Factory](https://factory.ai/)<br>[Read AI](https://www.read.ai/)<br>[Cursor (Anysphere)](https://cursor.com/) | 71,056 | 1 | 当前推荐 | [评分 + 代码 + 提示词](https://giraffe-tree.github.io/awesome-web-effects/#staggered-transform-choreography) |
| [动态图形爆发](https://giraffe-tree.github.io/awesome-web-effects/#motion-graphics-burst) | [Mo.js](https://github.com/mojs/mojs) | **92/100** | — | 18,728 | 1 | 当前推荐 | [评分 + 代码 + 提示词](https://giraffe-tree.github.io/awesome-web-effects/#motion-graphics-burst) |
| [可视化编排关键帧序列](https://giraffe-tree.github.io/awesome-web-effects/#visually-authored-keyframe-sequence) | [Theatre.js](https://github.com/theatre-js/theatre) | **84/100** | — | 12,541 | 1 | 当前推荐 | [评分 + 代码 + 提示词](https://giraffe-tree.github.io/awesome-web-effects/#visually-authored-keyframe-sequence) |
| [轻量 SVG 形状补间](https://giraffe-tree.github.io/awesome-web-effects/#compact-svg-shape-tween) | [KUTE.js](https://github.com/thednp/kute.js) | **89/100** | — | 2,639 | 1 | 当前推荐 | [评分 + 代码 + 提示词](https://giraffe-tree.github.io/awesome-web-effects/#compact-svg-shape-tween) |
| [自主 Agent 光标星座](https://giraffe-tree.github.io/awesome-web-effects/#autonomous-agent-cursor-constellation) | [Motion](https://github.com/motiondivision/motion) | **95/100** | [InVideo](https://invideo.io/) | 32,819 | 1 | 当前推荐 | [评分 + 代码 + 提示词](https://giraffe-tree.github.io/awesome-web-effects/#autonomous-agent-cursor-constellation) |
| [按片段时长接力的首屏影片](https://giraffe-tree.github.io/awesome-web-effects/#duration-aware-hero-film-handoff) | [Motion](https://github.com/motiondivision/motion) | **94/100** | [Kling](https://kling.ai/) | 32,819 | 1 | 当前推荐 | [评分 + 代码 + 提示词](https://giraffe-tree.github.io/awesome-web-effects/#duration-aware-hero-film-handoff) |
| [悬停预演的视频风格轨](https://giraffe-tree.github.io/awesome-web-effects/#hover-rehearsed-video-style-rail) | [Motion](https://github.com/motiondivision/motion) | **95/100** | [Captions](https://captions.ai/) | 32,819 | 1 | 当前推荐 | [评分 + 代码 + 提示词](https://giraffe-tree.github.io/awesome-web-effects/#hover-rehearsed-video-style-rail) |
| [设备轮廓蒙版视频](https://giraffe-tree.github.io/awesome-web-effects/#device-silhouette-masked-video) | [Motion](https://github.com/motiondivision/motion) | **92/100** | [Pika](https://pika.art/) | 32,819 | 1 | 当前推荐 | [评分 + 代码 + 提示词](https://giraffe-tree.github.io/awesome-web-effects/#device-silhouette-masked-video) |
| [模糊自播视频氛围层](https://giraffe-tree.github.io/awesome-web-effects/#blurred-autoplay-video-ambience) | [Motion](https://github.com/motiondivision/motion) | **91/100** | [Replicate](https://replicate.com/) | 32,819 | 1 | 当前推荐 | [评分 + 代码 + 提示词](https://giraffe-tree.github.io/awesome-web-effects/#blurred-autoplay-video-ambience) |
| [可见性门控 Agent 终端回放](https://giraffe-tree.github.io/awesome-web-effects/#visibility-gated-agent-terminal-replay) | [Motion](https://github.com/motiondivision/motion) | **93/100** | [Poolside](https://poolside.ai/) | 32,819 | 1 | 当前推荐 | [评分 + 代码 + 提示词](https://giraffe-tree.github.io/awesome-web-effects/#visibility-gated-agent-terminal-replay) |
| [音轨卡播放态协同切换](https://giraffe-tree.github.io/awesome-web-effects/#track-card-play-state-handoff) | [Motion](https://github.com/motiondivision/motion) | **84/100** | [Udio](https://www.udio.com/) | 32,819 | 1 | 当前推荐 | [评分 + 代码 + 提示词](https://giraffe-tree.github.io/awesome-web-effects/#track-card-play-state-handoff) |
| [交互式矢量状态机](https://giraffe-tree.github.io/awesome-web-effects/#interactive-vector-state-machine) | [Motion](https://github.com/motiondivision/motion) | **94/100** | — | 32,819 | 1 | 当前推荐 | [评分 + 代码 + 提示词](https://giraffe-tree.github.io/awesome-web-effects/#interactive-vector-state-machine) |
| [图像取色环境色转场](https://giraffe-tree.github.io/awesome-web-effects/#image-palette-ambient-color-transition) | [p5.js](https://github.com/processing/p5.js) | **92/100** | — | 23,797 | 1 | 当前推荐 | [评分 + 代码 + 提示词](https://giraffe-tree.github.io/awesome-web-effects/#image-palette-ambient-color-transition) |
| [BlurHash 到照片渐进揭示](https://giraffe-tree.github.io/awesome-web-effects/#blurhash-to-photo-progressive-reveal) | [p5.js](https://github.com/processing/p5.js) | **88/100** | — | 23,797 | 1 | 当前推荐 | [评分 + 代码 + 提示词](https://giraffe-tree.github.io/awesome-web-effects/#blurhash-to-photo-progressive-reveal) |

<a id="scroll"></a>

### 滚动与揭示

平滑滚动、滚动关联场景、进入揭示、视差与整屏吸附。

| 效果 | 推荐实现 | 策展评分 | AI 官网参考（最多 3 家） | Stars | 实现数 | 状态 | 实现 |
| --- | --- | ---: | --- | ---: | ---: | --- | --- |
| [固定式横向滚动场景](https://giraffe-tree.github.io/awesome-web-effects/#pinned-horizontal-scroll-scene) | [GSAP](https://github.com/greensock/GSAP) | **96/100** | — | 26,600 | 1 | 当前推荐 | [评分 + 代码 + 提示词](https://giraffe-tree.github.io/awesome-web-effects/#pinned-horizontal-scroll-scene) |
| [滚动联动多层星空](https://giraffe-tree.github.io/awesome-web-effects/#scroll-linked-multilayer-starfield) | [p5.js](https://github.com/processing/p5.js) | **94/100** | [Fathom](https://fathom.video/) | 23,797 | 1 | 当前推荐 | [评分 + 代码 + 提示词](https://giraffe-tree.github.io/awesome-web-effects/#scroll-linked-multilayer-starfield) |
| [自动反色的固定导航](https://giraffe-tree.github.io/awesome-web-effects/#self-inverting-fixed-navigation) | [Motion](https://github.com/motiondivision/motion) | **92/100** | [Luma AI](https://lumalabs.ai/) | 32,819 | 1 | 当前推荐 | [评分 + 代码 + 提示词](https://giraffe-tree.github.io/awesome-web-effects/#self-inverting-fixed-navigation) |
| [滚动擦洗式文档生成回放](https://giraffe-tree.github.io/awesome-web-effects/#scroll-scrubbed-document-generation-playback) | [Motion](https://github.com/motiondivision/motion) | **97/100** | [Granola](https://www.granola.ai/) | 32,819 | 1 | 当前推荐 | [评分 + 代码 + 提示词](https://giraffe-tree.github.io/awesome-web-effects/#scroll-scrubbed-document-generation-playback) |
| [惯性竖向能力轨](https://giraffe-tree.github.io/awesome-web-effects/#inertial-vertical-capability-rail) | [Motion](https://github.com/motiondivision/motion) | **91/100** | [Augmentcode](https://www.augmentcode.com/) | 32,819 | 1 | 当前推荐 | [评分 + 代码 + 提示词](https://giraffe-tree.github.io/awesome-web-effects/#inertial-vertical-capability-rail) |
| [DOM 与 3D 滚动锁步同步](https://giraffe-tree.github.io/awesome-web-effects/#dom-to-3d-scroll-synchronization) | [Motion](https://github.com/motiondivision/motion) | **95/100** | — | 32,819 | 1 | 当前推荐 | [评分 + 代码 + 提示词](https://giraffe-tree.github.io/awesome-web-effects/#dom-to-3d-scroll-synchronization) |
| [粘性卡片堆叠累积](https://giraffe-tree.github.io/awesome-web-effects/#sticky-card-stack-accumulation) | [Motion](https://github.com/motiondivision/motion) | **95/100** | — | 32,819 | 1 | 当前推荐 | [评分 + 代码 + 提示词](https://giraffe-tree.github.io/awesome-web-effects/#sticky-card-stack-accumulation) |
| [滚动速度响应跑马灯](https://giraffe-tree.github.io/awesome-web-effects/#velocity-reactive-marquee) | [Motion](https://github.com/motiondivision/motion) | **93/100** | — | 32,819 | 1 | 当前推荐 | [评分 + 代码 + 提示词](https://giraffe-tree.github.io/awesome-web-effects/#velocity-reactive-marquee) |
| [擦洗式逐词模糊旋转揭示](https://giraffe-tree.github.io/awesome-web-effects/#scrubbed-word-blur-rotate-reveal) | [Motion](https://github.com/motiondivision/motion) | **93/100** | — | 32,819 | 1 | 当前推荐 | [评分 + 代码 + 提示词](https://giraffe-tree.github.io/awesome-web-effects/#scrubbed-word-blur-rotate-reveal) |
| [粘性段落逐词着色](https://giraffe-tree.github.io/awesome-web-effects/#sticky-paragraph-ink-reveal) | [Motion](https://github.com/motiondivision/motion) | **91/100** | — | 32,819 | 1 | 当前推荐 | [评分 + 代码 + 提示词](https://giraffe-tree.github.io/awesome-web-effects/#sticky-paragraph-ink-reveal) |
| [滚动控制视频擦洗](https://giraffe-tree.github.io/awesome-web-effects/#scroll-controlled-video-scrubbing) | [p5.js](https://github.com/processing/p5.js) | **95/100** | [Motion](https://motion.dev/docs/react-use-scroll) | 23,797 | 1 | 当前推荐 | [评分 + 代码 + 提示词](https://giraffe-tree.github.io/awesome-web-effects/#scroll-controlled-video-scrubbing) |

<a id="transition"></a>

### 页面与布局

页面转场、FLIP 动画、筛选、紧密排布与布局重排。

| 效果 | 推荐实现 | 策展评分 | AI 官网参考（最多 3 家） | Stars | 实现数 | 状态 | 实现 |
| --- | --- | ---: | --- | ---: | ---: | --- | --- |
| [可筛选网格重排](https://giraffe-tree.github.io/awesome-web-effects/#filterable-grid-reflow) | [Isotope](https://github.com/metafizzy/isotope) | **85/100** | [Ideogram](https://ideogram.ai/) | 11,103 | 1 | 经典旧版 | [评分 + 代码 + 提示词](https://giraffe-tree.github.io/awesome-web-effects/#filterable-grid-reflow) |
| [多层同步场景换幕](https://giraffe-tree.github.io/awesome-web-effects/#synchronized-scenario-scene-handoff) | [Motion](https://github.com/motiondivision/motion) | **98/100** | [Vapi](https://vapi.ai/) | 32,819 | 1 | 当前推荐 | [评分 + 代码 + 提示词](https://giraffe-tree.github.io/awesome-web-effects/#synchronized-scenario-scene-handoff) |
| [延迟触发的下拉推广扫光](https://giraffe-tree.github.io/awesome-web-effects/#delayed-dropdown-promo-sweep) | [Motion](https://github.com/motiondivision/motion) | **92/100** | [Glean](https://www.glean.com/) | 32,819 | 1 | 当前推荐 | [评分 + 代码 + 提示词](https://giraffe-tree.github.io/awesome-web-effects/#delayed-dropdown-promo-sweep) |
| [裁剪路径菜单帘幕](https://giraffe-tree.github.io/awesome-web-effects/#clip-path-menu-curtain) | [Motion](https://github.com/motiondivision/motion) | **89/100** | [Anthropic](https://www.anthropic.com/) | 32,819 | 1 | 当前推荐 | [评分 + 代码 + 提示词](https://giraffe-tree.github.io/awesome-web-effects/#clip-path-menu-curtain) |
| [场景擦除式渐进页面交换](https://giraffe-tree.github.io/awesome-web-effects/#scene-wipe-progressive-page-swap) | [Motion](https://github.com/motiondivision/motion) | **90/100** | — | 32,819 | 1 | 当前推荐 | [评分 + 代码 + 提示词](https://giraffe-tree.github.io/awesome-web-effects/#scene-wipe-progressive-page-swap) |
| [可拖拽紧密编辑墙](https://giraffe-tree.github.io/awesome-web-effects/#draggable-packed-editorial-wall) | [Motion](https://github.com/motiondivision/motion) | **88/100** | — | 32,819 | 1 | 当前推荐 | [评分 + 代码 + 提示词](https://giraffe-tree.github.io/awesome-web-effects/#draggable-packed-editorial-wall) |
| [速度感知抽屉回弹](https://giraffe-tree.github.io/awesome-web-effects/#velocity-aware-swipe-drawer) | [Motion](https://github.com/motiondivision/motion) | **85/100** | — | 32,819 | 1 | 当前推荐 | [评分 + 代码 + 提示词](https://giraffe-tree.github.io/awesome-web-effects/#velocity-aware-swipe-drawer) |
| [空间化演示文稿导航](https://giraffe-tree.github.io/awesome-web-effects/#spatial-slide-deck-navigation) | [Motion](https://github.com/motiondivision/motion) | **88/100** | — | 32,819 | 1 | 当前推荐 | [评分 + 代码 + 提示词](https://giraffe-tree.github.io/awesome-web-effects/#spatial-slide-deck-navigation) |
| [像素网格内容溶解](https://giraffe-tree.github.io/awesome-web-effects/#pixel-grid-content-dissolve) | [p5.js](https://github.com/processing/p5.js) | **95/100** | — | 23,797 | 1 | 当前推荐 | [评分 + 代码 + 提示词](https://giraffe-tree.github.io/awesome-web-effects/#pixel-grid-content-dissolve) |
| [气泡到导航变形](https://giraffe-tree.github.io/awesome-web-effects/#bubble-to-navigation-morph) | [Motion](https://github.com/motiondivision/motion) | **95/100** | — | 32,819 | 1 | 当前推荐 | [评分 + 代码 + 提示词](https://giraffe-tree.github.io/awesome-web-effects/#bubble-to-navigation-morph) |
| [分层交错全屏菜单](https://giraffe-tree.github.io/awesome-web-effects/#layered-staggered-full-screen-menu) | [Motion](https://github.com/motiondivision/motion) | **94/100** | — | 32,819 | 1 | 当前推荐 | [评分 + 代码 + 提示词](https://giraffe-tree.github.io/awesome-web-effects/#layered-staggered-full-screen-menu) |
| [裁剪形状主题揭示](https://giraffe-tree.github.io/awesome-web-effects/#clip-shape-theme-reveal) | [Motion](https://github.com/motiondivision/motion) | **93/100** | — | 32,819 | 1 | 当前推荐 | [评分 + 代码 + 提示词](https://giraffe-tree.github.io/awesome-web-effects/#clip-shape-theme-reveal) |

<a id="pointer"></a>

### 指针与悬停

倾斜、景深、自定义光标、磁性运动与图像扭曲。

| 效果 | 推荐实现 | 策展评分 | AI 官网参考（最多 3 家） | Stars | 实现数 | 状态 | 实现 |
| --- | --- | ---: | --- | ---: | ---: | --- | --- |
| [透视倾斜与高光](https://giraffe-tree.github.io/awesome-web-effects/#perspective-tilt-and-glare) | [vanilla-tilt.js](https://github.com/micku7zu/vanilla-tilt.js) | **90/100** | — | 4,019 | 1 | 当前推荐 | [评分 + 代码 + 提示词](https://giraffe-tree.github.io/awesome-web-effects/#perspective-tilt-and-glare) |
| [情境感知自定义光标](https://giraffe-tree.github.io/awesome-web-effects/#context-aware-custom-cursor) | [mouse-follower](https://github.com/Cuberto/mouse-follower) | **86/100** | — | 818 | 1 | 当前推荐 | [评分 + 代码 + 提示词](https://giraffe-tree.github.io/awesome-web-effects/#context-aware-custom-cursor) |
| [位移贴图图像悬停](https://giraffe-tree.github.io/awesome-web-effects/#displacement-map-image-hover) | [hover-effect](https://github.com/robin-dela/hover-effect) | **90/100** | — | 1,874 | 1 | 当前推荐 | [评分 + 代码 + 提示词](https://giraffe-tree.github.io/awesome-web-effects/#displacement-map-image-hover) |
| [四角裁切标记悬停](https://giraffe-tree.github.io/awesome-web-effects/#four-corner-hover-crop-marks) | [Motion](https://github.com/motiondivision/motion) | **92/100** | [Cognition](https://cognition.ai/) | 32,819 | 1 | 当前推荐 | [评分 + 代码 + 提示词](https://giraffe-tree.github.io/awesome-web-effects/#four-corner-hover-crop-marks) |
| [交互历史驱动招聘徽章](https://giraffe-tree.github.io/awesome-web-effects/#interaction-history-hiring-badge) | [Motion](https://github.com/motiondivision/motion) | **89/100** | [Clay](https://www.clay.com/) | 32,819 | 1 | 当前推荐 | [评分 + 代码 + 提示词](https://giraffe-tree.github.io/awesome-web-effects/#interaction-history-hiring-badge) |
| [卡片元数据到 CTA 角色互换](https://giraffe-tree.github.io/awesome-web-effects/#card-metadata-to-cta-role-swap) | [Motion](https://github.com/motiondivision/motion) | **91/100** | [Together](https://www.together.ai/) | 32,819 | 1 | 当前推荐 | [评分 + 代码 + 提示词](https://giraffe-tree.github.io/awesome-web-effects/#card-metadata-to-cta-role-swap) |
| [反向对冲斜移 CTA](https://giraffe-tree.github.io/awesome-web-effects/#opposed-diagonal-offset-cta) | [Motion](https://github.com/motiondivision/motion) | **92/100** | [Unstructured](https://unstructured.io/) | 32,819 | 1 | 当前推荐 | [评分 + 代码 + 提示词](https://giraffe-tree.github.io/awesome-web-effects/#opposed-diagonal-offset-cta) |
| [可玩的品牌扫雷页脚](https://giraffe-tree.github.io/awesome-web-effects/#playable-brand-minesweeper-footer) | [Motion](https://github.com/motiondivision/motion) | **90/100** | [Tavus](https://www.tavus.io/) | 32,819 | 1 | 当前推荐 | [评分 + 代码 + 提示词](https://giraffe-tree.github.io/awesome-web-effects/#playable-brand-minesweeper-footer) |
| [指针驱动多层景深舞台](https://giraffe-tree.github.io/awesome-web-effects/#pointer-driven-multilayer-depth-stage) | [Motion](https://github.com/motiondivision/motion) | **88/100** | — | 32,819 | 1 | 当前推荐 | [评分 + 代码 + 提示词](https://giraffe-tree.github.io/awesome-web-effects/#pointer-driven-multilayer-depth-stage) |
| [邻项放大导航坞](https://giraffe-tree.github.io/awesome-web-effects/#neighbor-magnifying-navigation-dock) | [Motion](https://github.com/motiondivision/motion) | **91/100** | — | 32,819 | 1 | 当前推荐 | [评分 + 代码 + 提示词](https://giraffe-tree.github.io/awesome-web-effects/#neighbor-magnifying-navigation-dock) |
| [悬停激活图像跑马菜单](https://giraffe-tree.github.io/awesome-web-effects/#hover-activated-image-marquee-menu) | [Motion](https://github.com/motiondivision/motion) | **95/100** | — | 32,819 | 1 | 当前推荐 | [评分 + 代码 + 提示词](https://giraffe-tree.github.io/awesome-web-effects/#hover-activated-image-marquee-menu) |
| [拖拽甩出卡片堆](https://giraffe-tree.github.io/awesome-web-effects/#drag-thrown-card-stack) | [Motion](https://github.com/motiondivision/motion) | **94/100** | — | 32,819 | 1 | 当前推荐 | [评分 + 代码 + 提示词](https://giraffe-tree.github.io/awesome-web-effects/#drag-thrown-card-stack) |
| [融球液滴光标](https://giraffe-tree.github.io/awesome-web-effects/#metaball-blob-cursor) | [Motion](https://github.com/motiondivision/motion) | **95/100** | — | 32,819 | 1 | 当前推荐 | [评分 + 代码 + 提示词](https://giraffe-tree.github.io/awesome-web-effects/#metaball-blob-cursor) |
| [速度间隔图像尾迹](https://giraffe-tree.github.io/awesome-web-effects/#velocity-spaced-image-trail) | [p5.js](https://github.com/processing/p5.js) | **96/100** | — | 23,797 | 1 | 当前推荐 | [评分 + 代码 + 提示词](https://giraffe-tree.github.io/awesome-web-effects/#velocity-spaced-image-trail) |
| [黏性像素光标尾流](https://giraffe-tree.github.io/awesome-web-effects/#gooey-pixel-cursor-wake) | [p5.js](https://github.com/processing/p5.js) | **94/100** | — | 23,797 | 1 | 当前推荐 | [评分 + 代码 + 提示词](https://giraffe-tree.github.io/awesome-web-effects/#gooey-pixel-cursor-wake) |
| [吸附目标准星光标](https://giraffe-tree.github.io/awesome-web-effects/#snapping-target-reticle-cursor) | [Motion](https://github.com/motiondivision/motion) | **94/100** | — | 32,819 | 1 | 当前推荐 | [评分 + 代码 + 提示词](https://giraffe-tree.github.io/awesome-web-effects/#snapping-target-reticle-cursor) |
| [指针响应单元格网格](https://giraffe-tree.github.io/awesome-web-effects/#pointer-reactive-cell-grid) | [p5.js](https://github.com/processing/p5.js) | **91/100** | — | 23,797 | 1 | 当前推荐 | [评分 + 代码 + 提示词](https://giraffe-tree.github.io/awesome-web-effects/#pointer-reactive-cell-grid) |

<a id="vector"></a>

### 文本与 SVG

打字、文字拆分、矢量绘制、手写与 SVG 变形。

| 效果 | 推荐实现 | 策展评分 | AI 官网参考（最多 3 家） | Stars | 实现数 | 状态 | 实现 |
| --- | --- | ---: | --- | ---: | ---: | --- | --- |
| [SVG 描边绘制](https://giraffe-tree.github.io/awesome-web-effects/#svg-stroke-drawing) | [Vivus](https://github.com/maxwellito/vivus) | **86/100** | — | 15,479 | 1 | 经典旧版 | [评分 + 代码 + 提示词](https://giraffe-tree.github.io/awesome-web-effects/#svg-stroke-drawing) |
| [输入—选中—替换提示词循环](https://giraffe-tree.github.io/awesome-web-effects/#prompt-select-replace-loop) | [Motion](https://github.com/motiondivision/motion) | **97/100** | [Granola](https://www.granola.ai/) | 32,819 | 1 | 当前推荐 | [评分 + 代码 + 提示词](https://giraffe-tree.github.io/awesome-web-effects/#prompt-select-replace-loop) |
| [旅行圆点擦写标题](https://giraffe-tree.github.io/awesome-web-effects/#traveling-dot-headline-rewriter) | [Motion](https://github.com/motiondivision/motion) | **97/100** | [PolyAI](https://poly.ai/) | 32,819 | 1 | 当前推荐 | [评分 + 代码 + 提示词](https://giraffe-tree.github.io/awesome-web-effects/#traveling-dot-headline-rewriter) |
| [无限曲线文字传送带](https://giraffe-tree.github.io/awesome-web-effects/#infinite-curved-text-conveyor) | [Motion](https://github.com/motiondivision/motion) | **96/100** | [Wispr Flow](https://wisprflow.ai/) | 32,819 | 1 | 当前推荐 | [评分 + 代码 + 提示词](https://giraffe-tree.github.io/awesome-web-effects/#infinite-curved-text-conveyor) |
| [动画手绘语义标注](https://giraffe-tree.github.io/awesome-web-effects/#animated-hand-drawn-semantic-annotation) | [Motion](https://github.com/motiondivision/motion) | **90/100** | — | 32,819 | 1 | 当前推荐 | [评分 + 代码 + 提示词](https://giraffe-tree.github.io/awesome-web-effects/#animated-hand-drawn-semantic-annotation) |
| [机械分瓣翻牌字符](https://giraffe-tree.github.io/awesome-web-effects/#mechanical-split-flap-character-change) | [Motion](https://github.com/motiondivision/motion) | **89/100** | — | 32,819 | 1 | 当前推荐 | [评分 + 代码 + 提示词](https://giraffe-tree.github.io/awesome-web-effects/#mechanical-split-flap-character-change) |
| [SVG 滤镜黏液文字悬停](https://giraffe-tree.github.io/awesome-web-effects/#svg-filter-gooey-text-hover) | [Motion](https://github.com/motiondivision/motion) | **93/100** | — | 32,819 | 1 | 当前推荐 | [评分 + 代码 + 提示词](https://giraffe-tree.github.io/awesome-web-effects/#svg-filter-gooey-text-hover) |
| [手柄连线动画节点编辑器](https://giraffe-tree.github.io/awesome-web-effects/#handle-connected-animated-node-editor) | [Motion](https://github.com/motiondivision/motion) | **89/100** | — | 32,819 | 1 | 当前推荐 | [评分 + 代码 + 提示词](https://giraffe-tree.github.io/awesome-web-effects/#handle-connected-animated-node-editor) |
| [DOM 节点连接光束](https://giraffe-tree.github.io/awesome-web-effects/#animated-dom-node-connection-beam) | [Motion](https://github.com/motiondivision/motion) | **93/100** | — | 32,819 | 1 | 当前推荐 | [评分 + 代码 + 提示词](https://giraffe-tree.github.io/awesome-web-effects/#animated-dom-node-connection-beam) |
| [可拖拽力导向 SVG 网络](https://giraffe-tree.github.io/awesome-web-effects/#draggable-force-directed-svg-network) | [p5.js](https://github.com/processing/p5.js) | **92/100** | [D3js](https://d3js.org/d3-force) | 23,797 | 1 | 当前推荐 | [评分 + 代码 + 提示词](https://giraffe-tree.github.io/awesome-web-effects/#draggable-force-directed-svg-network) |
| [Voronoi 最近点悬停聚焦](https://giraffe-tree.github.io/awesome-web-effects/#voronoi-nearest-point-hover-focus) | [p5.js](https://github.com/processing/p5.js) | **91/100** | [D3js](https://d3js.org/d3-delaunay) | 23,797 | 1 | 当前推荐 | [评分 + 代码 + 提示词](https://giraffe-tree.github.io/awesome-web-effects/#voronoi-nearest-point-hover-focus) |
| [联动框选缩放图表](https://giraffe-tree.github.io/awesome-web-effects/#linked-brush-to-zoom-chart) | [p5.js](https://github.com/processing/p5.js) | **89/100** | [D3js](https://d3js.org/d3-brush) | 23,797 | 1 | 当前推荐 | [评分 + 代码 + 提示词](https://giraffe-tree.github.io/awesome-web-effects/#linked-brush-to-zoom-chart) |
| [点击折叠层级分支](https://giraffe-tree.github.io/awesome-web-effects/#click-to-collapse-hierarchy-branches) | [Motion](https://github.com/motiondivision/motion) | **88/100** | [D3js](https://d3js.org/d3-hierarchy/tree) | 32,819 | 1 | 当前推荐 | [评分 + 代码 + 提示词](https://giraffe-tree.github.io/awesome-web-effects/#click-to-collapse-hierarchy-branches) |

<a id="canvas"></a>

### Canvas 与 2D

场景图、创意编程、物理、绘图工具与 2D 渲染器。

| 效果 | 推荐实现 | 策展评分 | AI 官网参考（最多 3 家） | Stars | 实现数 | 状态 | 实现 |
| --- | --- | ---: | --- | ---: | ---: | --- | --- |
| [草图式创意编程循环](https://giraffe-tree.github.io/awesome-web-effects/#sketch-style-creative-coding-loop) | [p5.js](https://github.com/processing/p5.js) | **91/100** | [Hume AI](https://www.hume.ai/) | 23,797 | 1 | 当前推荐 | [评分 + 代码 + 提示词](https://giraffe-tree.github.io/awesome-web-effects/#sketch-style-creative-coding-loop) |
| [景深分层顺序模糊溶解](https://giraffe-tree.github.io/awesome-web-effects/#depth-layer-blur-dissolve) | [p5.js](https://github.com/processing/p5.js) | **96/100** | [Black Forest Labs](https://bfl.ai/) | 23,797 | 1 | 当前推荐 | [评分 + 代码 + 提示词](https://giraffe-tree.github.io/awesome-web-effects/#depth-layer-blur-dissolve) |
| [拖拽生成且避让 DOM 的鱼群](https://giraffe-tree.github.io/awesome-web-effects/#dom-aware-drag-spawned-fish-flock) | [p5.js](https://github.com/processing/p5.js) | **98/100** | [Sakana AI](https://sakana.ai/) | 23,797 | 1 | 当前推荐 | [评分 + 代码 + 提示词](https://giraffe-tree.github.io/awesome-web-effects/#dom-aware-drag-spawned-fish-flock) |
| [交错多图表遥测启动](https://giraffe-tree.github.io/awesome-web-effects/#staggered-multichart-telemetry-boot) | [p5.js](https://github.com/processing/p5.js) | **95/100** | [Pinecone](https://www.pinecone.io/) | 23,797 | 1 | 当前推荐 | [评分 + 代码 + 提示词](https://giraffe-tree.github.io/awesome-web-effects/#staggered-multichart-telemetry-boot) |
| [ASCII 编排信号扫过](https://giraffe-tree.github.io/awesome-web-effects/#ascii-orchestration-signal-sweep) | [p5.js](https://github.com/processing/p5.js) | **94/100** | [Augmentcode](https://www.augmentcode.com/) | 23,797 | 1 | 当前推荐 | [评分 + 代码 + 提示词](https://giraffe-tree.github.io/awesome-web-effects/#ascii-orchestration-signal-sweep) |
| [降噪音频 A/B 交叉试听](https://giraffe-tree.github.io/awesome-web-effects/#noise-cancellation-audio-comparison) | [Motion](https://github.com/motiondivision/motion) | **87/100** | [Krisp](https://krisp.ai/) | 32,819 | 1 | 当前推荐 | [评分 + 代码 + 提示词](https://giraffe-tree.github.io/awesome-web-effects/#noise-cancellation-audio-comparison) |
| [活跃音轨均衡器排印](https://giraffe-tree.github.io/awesome-web-effects/#audio-equalizer-typography) | [p5.js](https://github.com/processing/p5.js) | **86/100** | [Soundraw](https://soundraw.io/) | 23,797 | 1 | 当前推荐 | [评分 + 代码 + 提示词](https://giraffe-tree.github.io/awesome-web-effects/#audio-equalizer-typography) |
| [指针跟随位移涟漪](https://giraffe-tree.github.io/awesome-web-effects/#pointer-following-displacement-ripple) | [regl](https://github.com/regl-project/regl) | **93/100** | — | 5,557 | 1 | 当前推荐 | [评分 + 代码 + 提示词](https://giraffe-tree.github.io/awesome-web-effects/#pointer-following-displacement-ripple) |
| [可抓取刚体海报堆](https://giraffe-tree.github.io/awesome-web-effects/#draggable-rigid-body-poster-pile) | [p5.js](https://github.com/processing/p5.js) | **93/100** | — | 23,797 | 1 | 当前推荐 | [评分 + 代码 + 提示词](https://giraffe-tree.github.io/awesome-web-effects/#draggable-rigid-body-poster-pile) |
| [点构成的生成式花冠](https://giraffe-tree.github.io/awesome-web-effects/#point-constructed-generative-corolla) | [p5.js](https://github.com/processing/p5.js) | **92/100** | — | 23,797 | 1 | 当前推荐 | [评分 + 代码 + 提示词](https://giraffe-tree.github.io/awesome-web-effects/#point-constructed-generative-corolla) |
| [涌现式粒子生命群落](https://giraffe-tree.github.io/awesome-web-effects/#emergent-particle-life-colonies) | [p5.js](https://github.com/processing/p5.js) | **94/100** | — | 23,797 | 1 | 当前推荐 | [评分 + 代码 + 提示词](https://giraffe-tree.github.io/awesome-web-effects/#emergent-particle-life-colonies) |
| [可拖拽缩放音频循环区](https://giraffe-tree.github.io/awesome-web-effects/#drag-resizable-audio-loop-region) | [p5.js](https://github.com/processing/p5.js) | **91/100** | — | 23,797 | 1 | 当前推荐 | [评分 + 代码 + 提示词](https://giraffe-tree.github.io/awesome-web-effects/#drag-resizable-audio-loop-region) |
| [流式折线图窗口推进](https://giraffe-tree.github.io/awesome-web-effects/#streaming-line-chart-window) | [p5.js](https://github.com/processing/p5.js) | **89/100** | — | 23,797 | 1 | 当前推荐 | [评分 + 代码 + 提示词](https://giraffe-tree.github.io/awesome-web-effects/#streaming-line-chart-window) |
| [速度感应签名墨迹](https://giraffe-tree.github.io/awesome-web-effects/#velocity-sensitive-signature-ink) | [p5.js](https://github.com/processing/p5.js) | **90/100** | — | 23,797 | 1 | 当前推荐 | [评分 + 代码 + 提示词](https://giraffe-tree.github.io/awesome-web-effects/#velocity-sensitive-signature-ink) |
| [压力塑形自由笔触](https://giraffe-tree.github.io/awesome-web-effects/#pressure-shaped-freehand-stroke) | [p5.js](https://github.com/processing/p5.js) | **92/100** | — | 23,797 | 1 | 当前推荐 | [评分 + 代码 + 提示词](https://giraffe-tree.github.io/awesome-web-effects/#pressure-shaped-freehand-stroke) |
| [可拖拽编辑贝塞尔曲线手柄](https://giraffe-tree.github.io/awesome-web-effects/#drag-editable-bezier-curve-handles) | [p5.js](https://github.com/processing/p5.js) | **91/100** | — | 23,797 | 1 | 当前推荐 | [评分 + 代码 + 提示词](https://giraffe-tree.github.io/awesome-web-effects/#drag-editable-bezier-curve-handles) |
| [视频手部关键点叠加](https://giraffe-tree.github.io/awesome-web-effects/#live-hand-landmark-video-overlay) | [p5.js](https://github.com/processing/p5.js) | **94/100** | — | 23,797 | 1 | 当前推荐 | [评分 + 代码 + 提示词](https://giraffe-tree.github.io/awesome-web-effects/#live-hand-landmark-video-overlay) |
| [逐帧 GIF 擦洗器](https://giraffe-tree.github.io/awesome-web-effects/#frame-by-frame-gif-scrubber) | [p5.js](https://github.com/processing/p5.js) | **90/100** | — | 23,797 | 1 | 当前推荐 | [评分 + 代码 + 提示词](https://giraffe-tree.github.io/awesome-web-effects/#frame-by-frame-gif-scrubber) |

<a id="webgl"></a>

### 3D 与 WebGL

3D 引擎、声明式渲染器、着色器图层与后期处理。

| 效果 | 推荐实现 | 策展评分 | AI 官网参考（最多 3 家） | Stars | 实现数 | 状态 | 实现 |
| --- | --- | ---: | --- | ---: | ---: | --- | --- |
| [GPU 实例化粒子涡旋](https://giraffe-tree.github.io/awesome-web-effects/#functional-webgl-draw-commands) | [regl](https://github.com/regl-project/regl) | **96/100** | — | 5,557 | 1 | 当前推荐 | [评分 + 代码 + 提示词](https://giraffe-tree.github.io/awesome-web-effects/#functional-webgl-draw-commands) |
| [DOM 绑定虹彩着色器平面](https://giraffe-tree.github.io/awesome-web-effects/#dom-synced-shader-planes) | [Curtains.js](https://github.com/martinlaxenaire/curtainsjs) | **94/100** | — | 1,823 | 1 | 当前推荐 | [评分 + 代码 + 提示词](https://giraffe-tree.github.io/awesome-web-effects/#dom-synced-shader-planes) |
| [指针旋转点阵地球](https://giraffe-tree.github.io/awesome-web-effects/#pointer-rotated-dot-matrix-globe) | [p5.js](https://github.com/processing/p5.js) | **93/100** | — | 23,797 | 1 | 当前推荐 | [评分 + 代码 + 提示词](https://giraffe-tree.github.io/awesome-web-effects/#pointer-rotated-dot-matrix-globe) |
| [指针注入 GPU 流体](https://giraffe-tree.github.io/awesome-web-effects/#pointer-injected-gpu-fluid) | [regl](https://github.com/regl-project/regl) | **98/100** | — | 5,557 | 1 | 当前推荐 | [评分 + 代码 + 提示词](https://giraffe-tree.github.io/awesome-web-effects/#pointer-injected-gpu-fluid) |
| [滑杆控制 3D 爆炸装配](https://giraffe-tree.github.io/awesome-web-effects/#slider-controlled-exploded-3d-assembly) | [p5.js](https://github.com/processing/p5.js) | **94/100** | — | 23,797 | 1 | 当前推荐 | [评分 + 代码 + 提示词](https://giraffe-tree.github.io/awesome-web-effects/#slider-controlled-exploded-3d-assembly) |
| [碰撞响应 3D 物理堆栈](https://giraffe-tree.github.io/awesome-web-effects/#collision-reactive-3d-physics-stack) | [p5.js](https://github.com/processing/p5.js) | **96/100** | — | 23,797 | 1 | 当前推荐 | [评分 + 代码 + 提示词](https://giraffe-tree.github.io/awesome-web-effects/#collision-reactive-3d-physics-stack) |
| [折射玻璃透射雕塑](https://giraffe-tree.github.io/awesome-web-effects/#refractive-glass-transmission-sculpture) | [p5.js](https://github.com/processing/p5.js) | **95/100** | — | 23,797 | 1 | 当前推荐 | [评分 + 代码 + 提示词](https://giraffe-tree.github.io/awesome-web-effects/#refractive-glass-transmission-sculpture) |
| [电影式地图相机飞行](https://giraffe-tree.github.io/awesome-web-effects/#cinematic-map-camera-fly-to) | [p5.js](https://github.com/processing/p5.js) | **89/100** | — | 23,797 | 1 | 当前推荐 | [评分 + 代码 + 提示词](https://giraffe-tree.github.io/awesome-web-effects/#cinematic-map-camera-fly-to) |
| [可拾取挤出数据柱](https://giraffe-tree.github.io/awesome-web-effects/#pickable-extruded-data-columns) | [p5.js](https://github.com/processing/p5.js) | **90/100** | — | 23,797 | 1 | 当前推荐 | [评分 + 代码 + 提示词](https://giraffe-tree.github.io/awesome-web-effects/#pickable-extruded-data-columns) |
| [弯曲三维文字环绕](https://giraffe-tree.github.io/awesome-web-effects/#curved-3d-text-orbit) | [p5.js](https://github.com/processing/p5.js) | **94/100** | — | 23,797 | 1 | 当前推荐 | [评分 + 代码 + 提示词](https://giraffe-tree.github.io/awesome-web-effects/#curved-3d-text-orbit) |
| [光标投射三维表面标记](https://giraffe-tree.github.io/awesome-web-effects/#cursor-projected-3d-surface-marker) | [p5.js](https://github.com/processing/p5.js) | **94/100** | — | 23,797 | 1 | 当前推荐 | [评分 + 代码 + 提示词](https://giraffe-tree.github.io/awesome-web-effects/#cursor-projected-3d-surface-marker) |
| [弯曲 WebGL 图库丝带](https://giraffe-tree.github.io/awesome-web-effects/#bending-webgl-gallery-ribbon) | [p5.js](https://github.com/processing/p5.js) | **97/100** | — | 23,797 | 1 | 当前推荐 | [评分 + 代码 + 提示词](https://giraffe-tree.github.io/awesome-web-effects/#bending-webgl-gallery-ribbon) |
| [可拖拽穹顶图库](https://giraffe-tree.github.io/awesome-web-effects/#draggable-dome-gallery) | [p5.js](https://github.com/processing/p5.js) | **96/100** | — | 23,797 | 1 | 当前推荐 | [评分 + 代码 + 提示词](https://giraffe-tree.github.io/awesome-web-effects/#draggable-dome-gallery) |

## Demo

Demo 只使用静态 HTML、CSS、JavaScript 模块和已核验 GIF，无第三方运行依赖。它支持效果搜索、分类筛选、按评分排序、中英文切换、稳定效果锚点、评分维度明细、移动端真实预览、展开来源详情、代码复制和 Agent 提示词一键复制。

```bash
python3 -m http.server 4173 --directory demo
```

打开 [http://localhost:4173](http://localhost:4173)。目录使用 ES Module，因此需要本地 HTTP 服务，不能直接双击文件运行。

## 真实 GIF 录制与压缩

先在 `demo/preview-demos/` 编写可运行、可复用且确实使用对应实现的 HTML Demo，核验后录制真实浏览器输出，再规范化来源已核验的官方 GIF：

```bash
npm ci --prefix demo/preview-demos
npm run build --prefix demo/preview-demos
python3 scripts/capture-real-preview-gifs.py --built --skip-install
node scripts/normalize-gif-previews.mjs
```

录制步骤捕获真实本地 Demo，规范化步骤只处理来源已经核验的官方素材。验证器会检查来源状态、Demo 与 GIF 是否存在、内容哈希唯一性、尺寸、时长、帧数、可解码性和单文件大小预算。既没有可靠官方素材、也没有可运行录制 Demo 时，应保持“暂无真实预览”。

参见[预览真实性迁移报告](research/preview-authenticity-migration-2026-07-17.md)与机器可读的[预览来源清单](demo/gifs/provenance.json)。

## GitHub Pages

Demo 完全静态且只使用相对路径。仓库内工作流会在推送到 `main` 后发布 `demo/`，也支持手动运行。首次部署前需要在 **Settings → Pages → Source** 选择 **GitHub Actions**。详见 [中文部署说明](docs/GITHUB_PAGES.zh-CN.md)。

预计地址：[https://giraffe-tree.github.io/awesome-web-effects/](https://giraffe-tree.github.io/awesome-web-effects/)

## 维护目录

- 只有通过策展准入的记录才能加入 `demo/data/effects.js`；被拒候选只保留在带日期的审计文档中，不能进入发布目录。
- 每个发布效果必须保存总分与六个维度分；评分体系变化时同步更新 `demo/data/demo-admission.js`。
- `effect.id` 必须语义化且保持稳定，禁止从仓库名派生。
- 同一项目可被多个效果复用；替代实现加入效果的 `sources` 数组。
- 代码与预览必须放在来源关系上，不能放到项目或效果根节点。
- 运行 `node scripts/build-docs.mjs` 同步生成两份 README。
- 提交前运行 `node scripts/validate.mjs`。

GIF 与项目名称仅用于研究、索引和比较，权利归各自作者所有。
