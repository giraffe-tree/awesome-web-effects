# Awesome Web Effects

[English (default)](README.md) · [在线 Demo](https://giraffe-tree.github.io/awesome-interaction/)

一个**以效果为先**的开源 Web 交互图鉴。当前收录 **10 类 240 种不同效果**，背后有 **154 个来源项目**。每种效果独占一行，拥有稳定语义 Key、GIF 预览、可复制的最小代码，以及可一键交给 Codex 或 Claude Code 的实现提示词。英文是默认界面与默认文档语言，同时提供完整中文文档与中文界面。

## 效果优先模型

- **效果是目录主键。** 锚点、搜索结果、行、分类与代码示例都从用户看得见的交互出发，而不是从仓库出发。
- **项目是实现来源。** 一个项目可以实现多种不同效果；当前种子目录已有 12 个来源项目明确展示这种关系。
- **一种效果可以有多个实现。** 每个来源关系拥有自己的最小代码和 GIF，因此替代方案可以放在同一行中比较，不必复制效果行。
- **去重发生在可见效果层。** 候选按触发方式、视觉变化、时间关系和页面层级比较；更新、维护更好、文档更清楚的实现成为推荐来源。

## 目录快照

- 240 行效果，其中 20 种为基线效果。
- 最近一次效果级扩展独立调研并新增 119 种效果。
- 154 个唯一 GitHub 来源项目；2026 扩展阶段新增 101 个。
- 240 个与具体来源对应的 GIF：8 个官方捕获，232 个明确标注的编辑重现。
- 240 份一键实现提示词，每种效果都有一份。
- 14 个较旧但仍有参考价值的来源标记为“经典旧版”；不包含已归档仓库。
- Stars 是 **2026-07-17** 的快照，不是实时计数器。
- 被目录引用的 GIF 优化后总计 **10.19 MiB**；每个预览均为 320×180、最长三秒且小于 1 MiB。

## 收录与去重规则

1. 每一行只能描述一种能在普通网页中呈现的可见交互效果。
2. 每种效果必须有稳定的中英文名称、语义化效果 ID、分类和至少一个可核验来源。
3. 同一仓库出现在不同效果行中是合法的；重复的效果 ID 或效果名称不合法。
4. 每种效果必须且只能有一个推荐来源；替代实现应加入同一行，不能复制效果。
5. 最小代码与预览媒体属于“效果 × 来源”关系，因为不同项目的实现方式不同。

## 分类概览

| 分类 | 效果数 | 来源项目 | 关注结果 |
| --- | ---: | ---: | --- |
| [动画与编排](#animation) | 22 | 14 | 时间线、弹簧、补间、类动画与框架原生动效。 |
| [滚动与揭示](#scroll) | 25 | 18 | 平滑滚动、滚动关联场景、进入揭示、视差与整屏吸附。 |
| [页面与布局](#transition) | 25 | 16 | 页面转场、FLIP 动画、筛选、紧密排布与布局重排。 |
| [导航与浮层](#carousel) | 22 | 14 | 轮播、灯箱、菜单、导览、通知、拖拽浮层与空间导航。 |
| [指针与悬停](#pointer) | 26 | 14 | 倾斜、景深、自定义光标、磁性运动与图像扭曲。 |
| [文本与 SVG](#vector) | 25 | 20 | 打字、文字拆分、矢量绘制、手写与 SVG 变形。 |
| [Canvas 与 2D](#canvas) | 24 | 20 | 场景图、创意编程、物理、绘图工具与 2D 渲染器。 |
| [3D 与 WebGL](#webgl) | 22 | 20 | 3D 引擎、声明式渲染器、着色器图层与后期处理。 |
| [背景与粒子](#background) | 24 | 15 | 流体、粒子、渐变、彩纸、网格、丝带与烟花。 |
| [媒体与图像](#media) | 25 | 23 | 前后对比、平移缩放、裁剪、滤镜、镜头放大与着色器转场。 |

## 效果目录

<a id="animation"></a>

### 动画与编排

时间线、弹簧、补间、类动画与框架原生动效。

| 效果 | 推荐来源 | Stars | 实现数 | 状态 | 实现 |
| --- | --- | ---: | ---: | --- | --- |
| [滚动擦洗主时间线](https://giraffe-tree.github.io/awesome-interaction/#scroll-scrubbed-master-timeline) | [GSAP](https://github.com/greensock/GSAP) | 26,600 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#scroll-scrubbed-master-timeline) |
| [共享布局弹簧变形](https://giraffe-tree.github.io/awesome-interaction/#shared-layout-spring-morph) | [Motion](https://github.com/motiondivision/motion) | 32,819 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#shared-layout-spring-morph) |
| [交错变换编排](https://giraffe-tree.github.io/awesome-interaction/#staggered-transform-choreography) | [Anime.js](https://github.com/juliangarnier/anime) | 71,056 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#staggered-transform-choreography) |
| [与渲染器无关的数值补间](https://giraffe-tree.github.io/awesome-interaction/#render-agnostic-value-tween) | [Tween.js](https://github.com/tweenjs/tween.js) | 10,129 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#render-agnostic-value-tween) |
| [动态图形爆发](https://giraffe-tree.github.io/awesome-interaction/#motion-graphics-burst) | [Mo.js](https://github.com/mojs/mojs) | 18,728 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#motion-graphics-burst) |
| [可视化编排关键帧序列](https://giraffe-tree.github.io/awesome-interaction/#visually-authored-keyframe-sequence) | [Theatre.js](https://github.com/theatre-js/theatre) | 12,541 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#visually-authored-keyframe-sequence) |
| [函数式数值管线](https://giraffe-tree.github.io/awesome-interaction/#functional-value-pipeline) | [Popmotion](https://github.com/Popmotion/popmotion) | 20,167 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#functional-value-pipeline) |
| [Hook 驱动弹簧动画](https://giraffe-tree.github.io/awesome-interaction/#hook-driven-spring-motion) | [React Spring](https://github.com/pmndrs/react-spring) | 29,127 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#hook-driven-spring-motion) |
| [轻量 SVG 形状补间](https://giraffe-tree.github.io/awesome-interaction/#compact-svg-shape-tween) | [KUTE.js](https://github.com/thednp/kute.js) | 2,639 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#compact-svg-shape-tween) |
| [Vue 指令式动效状态](https://giraffe-tree.github.io/awesome-interaction/#vue-directive-motion-state) | [VueUse Motion](https://github.com/vueuse/motion) | 2,753 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#vue-directive-motion-state) |
| [CSS 类进入动画](https://giraffe-tree.github.io/awesome-interaction/#css-class-entrance-animation) | [Animate.css](https://github.com/animate-css/animate.css) | 82,667 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#css-class-entrance-animation) |
| [交互式矢量状态机](https://giraffe-tree.github.io/awesome-interaction/#interactive-vector-state-machine) | [Rive Web](https://github.com/rive-app/rive-wasm) | 954 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#interactive-vector-state-machine) |
| [弹性扇形卡片入场](https://giraffe-tree.github.io/awesome-interaction/#elastic-fan-card-entrance) | [React Bits](https://github.com/DavidHDev/react-bits) | 43,496 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#elastic-fan-card-entrance) |
| [噪声电流描边](https://giraffe-tree.github.io/awesome-interaction/#noisy-electric-border-trace) | [React Bits](https://github.com/DavidHDev/react-bits) | 43,496 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#noisy-electric-border-trace) |
| [弹簧插值数字递增](https://giraffe-tree.github.io/awesome-interaction/#spring-interpolated-count-up) | [React Bits](https://github.com/DavidHDev/react-bits) | 43,496 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#spring-interpolated-count-up) |
| [分段旋转词槽](https://giraffe-tree.github.io/awesome-interaction/#segmented-rotating-word-slot) | [React Bits](https://github.com/DavidHDev/react-bits) | 43,496 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#segmented-rotating-word-slot) |
| [环绕星光边框](https://giraffe-tree.github.io/awesome-interaction/#orbiting-star-perimeter) | [React Bits](https://github.com/DavidHDev/react-bits) | 43,496 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#orbiting-star-perimeter) |
| [旋转环形字母](https://giraffe-tree.github.io/awesome-interaction/#rotating-circular-letter-ring) | [React Bits](https://github.com/DavidHDev/react-bits) | 43,496 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#rotating-circular-letter-ring) |
| [移动聚焦框标题](https://giraffe-tree.github.io/awesome-interaction/#moving-focus-window-headline) | [React Bits](https://github.com/DavidHDev/react-bits) | 43,496 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#moving-focus-window-headline) |
| [DOM 节点连接光束](https://giraffe-tree.github.io/awesome-interaction/#dom-node-connection-beam) | [Magic UI](https://github.com/magicuidesign/magicui) | 21,567 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#dom-node-connection-beam) |
| [动画环形仪表填充](https://giraffe-tree.github.io/awesome-interaction/#animated-circular-gauge-fill) | [Magic UI](https://github.com/magicuidesign/magicui) | 21,567 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#animated-circular-gauge-fill) |
| [彩色光带文字扫过](https://giraffe-tree.github.io/awesome-interaction/#chromatic-band-text-sweep) | [Magic UI](https://github.com/magicuidesign/magicui) | 21,567 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#chromatic-band-text-sweep) |

<a id="scroll"></a>

### 滚动与揭示

平滑滚动、滚动关联场景、进入揭示、视差与整屏吸附。

| 效果 | 推荐来源 | Stars | 实现数 | 状态 | 实现 |
| --- | --- | ---: | ---: | --- | --- |
| [固定式横向滚动场景](https://giraffe-tree.github.io/awesome-interaction/#pinned-horizontal-scroll-scene) | [GSAP](https://github.com/greensock/GSAP) | 26,600 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#pinned-horizontal-scroll-scene) |
| [兼容原生语义的惯性滚动](https://giraffe-tree.github.io/awesome-interaction/#native-friendly-inertial-scrolling) | [Lenis](https://github.com/darkroomengineering/lenis) | 14,373 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#native-friendly-inertial-scrolling) |
| [分步滚动叙事](https://giraffe-tree.github.io/awesome-interaction/#step-based-scrollytelling) | [Scrollama](https://github.com/russellsamora/scrollama) | 5,985 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#step-based-scrollytelling) |
| [数据属性视口揭示](https://giraffe-tree.github.io/awesome-interaction/#data-attribute-viewport-reveal) | [AOS](https://github.com/michalsnik/aos) | 28,069 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#data-attribute-viewport-reveal) |
| [数据驱动滚动变换](https://giraffe-tree.github.io/awesome-interaction/#data-driven-scroll-transforms) | [Locomotive Scroll](https://github.com/locomotivemtl/locomotive-scroll) | 8,825 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#data-driven-scroll-transforms) |
| [惯性自定义滚动容器](https://giraffe-tree.github.io/awesome-interaction/#inertial-custom-scroll-container) | [Smooth Scrollbar](https://github.com/dolphin-wood/smooth-scrollbar) | 3,354 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#inertial-custom-scroll-container) |
| [DOM 与 3D 滚动同步](https://giraffe-tree.github.io/awesome-interaction/#dom-to-3d-scroll-synchronization) | [r3f-scroll-rig](https://github.com/14islands/r3f-scroll-rig) | 954 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#dom-to-3d-scroll-synchronization) |
| [按需聚焦目标滚动](https://giraffe-tree.github.io/awesome-interaction/#conditional-focus-to-target-scroll) | [scroll-into-view-if-needed](https://github.com/scroll-into-view/scroll-into-view-if-needed) | 1,449 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#conditional-focus-to-target-scroll) |
| [保留原生滚动的样式化滚动条](https://giraffe-tree.github.io/awesome-interaction/#styled-native-scrollbar-surface) | [SimpleBar](https://github.com/Grsmto/simplebar) | 6,411 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#styled-native-scrollbar-surface) |
| [窗口化百万行滚动](https://giraffe-tree.github.io/awesome-interaction/#windowed-million-row-scrolling) | [TanStack Virtual](https://github.com/TanStack/virtual) | 7,004 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#windowed-million-row-scrolling) |
| [到达阈值追加连续信息流](https://giraffe-tree.github.io/awesome-interaction/#append-at-threshold-continuous-feed) | [Infinite Scroll](https://github.com/metafizzy/infinite-scroll) | 7,483 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#append-at-threshold-continuous-feed) |
| [全屏分区吸附](https://giraffe-tree.github.io/awesome-interaction/#full-screen-section-snapping) | [fullPage.js](https://github.com/alvarotrigo/fullPage.js) | 35,422 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#full-screen-section-snapping) |
| [反向移动分屏面板](https://giraffe-tree.github.io/awesome-interaction/#counter-moving-split-screen-panels) | [multiScroll.js](https://github.com/alvarotrigo/multiscroll.js) | 1,572 | 1 | 经典旧版 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#counter-moving-split-screen-panels) |
| [粘性卡片堆叠累积](https://giraffe-tree.github.io/awesome-interaction/#sticky-card-stack-accumulation) | [React Bits](https://github.com/DavidHDev/react-bits) | 43,496 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#sticky-card-stack-accumulation) |
| [滚动速度响应跑马灯](https://giraffe-tree.github.io/awesome-interaction/#velocity-reactive-marquee) | [React Bits](https://github.com/DavidHDev/react-bits) | 43,496 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#velocity-reactive-marquee) |
| [滚动擦洗浮动字符](https://giraffe-tree.github.io/awesome-interaction/#scroll-scrubbed-floating-characters) | [React Bits](https://github.com/DavidHDev/react-bits) | 43,496 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#scroll-scrubbed-floating-characters) |
| [擦洗式逐词模糊旋转揭示](https://giraffe-tree.github.io/awesome-interaction/#scrubbed-word-blur-and-rotate-reveal) | [React Bits](https://github.com/DavidHDev/react-bits) | 43,496 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#scrubbed-word-blur-and-rotate-reveal) |
| [渐进式滚动边缘模糊](https://giraffe-tree.github.io/awesome-interaction/#progressive-scroll-edge-blur) | [React Bits](https://github.com/DavidHDev/react-bits) | 43,496 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#progressive-scroll-edge-blur) |
| [固定阅读进度轨](https://giraffe-tree.github.io/awesome-interaction/#fixed-reading-progress-rail) | [Magic UI](https://github.com/magicuidesign/magicui) | 21,567 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#fixed-reading-progress-rail) |
| [粘性段落逐词着色](https://giraffe-tree.github.io/awesome-interaction/#sticky-paragraph-ink-reveal) | [Magic UI](https://github.com/magicuidesign/magicui) | 21,567 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#sticky-paragraph-ink-reveal) |
| [进入视口触发指标计数](https://giraffe-tree.github.io/awesome-interaction/#viewport-triggered-metric-count) | [Motion Primitives](https://github.com/ibelick/motion-primitives) | 5,695 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#viewport-triggered-metric-count) |
| [按滚动方向自动隐藏页头](https://giraffe-tree.github.io/awesome-interaction/#scroll-direction-auto-hiding-header) | [Motion](https://github.com/motiondivision/motion) | 32,819 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#scroll-direction-auto-hiding-header) |
| [滚动控制视频擦洗](https://giraffe-tree.github.io/awesome-interaction/#scroll-controlled-video-scrubbing) | [Motion](https://github.com/motiondivision/motion) | 32,819 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#scroll-controlled-video-scrubbing) |
| [滚动擦洗文档生成回放](https://giraffe-tree.github.io/awesome-interaction/#scroll-scrubbed-document-generation-playback) | [GSAP](https://github.com/greensock/GSAP) | 26,600 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#scroll-scrubbed-document-generation-playback) |
| [带滞回的滚动阈值页头改色](https://giraffe-tree.github.io/awesome-interaction/#hysteretic-scroll-threshold-header-restyle) | [Awesome Web Effects](https://github.com/giraffe-tree/awesome-web-effects) | 0 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#hysteretic-scroll-threshold-header-restyle) |

<a id="transition"></a>

### 页面与布局

页面转场、FLIP 动画、筛选、紧密排布与布局重排。

| 效果 | 推荐来源 | Stars | 实现数 | 状态 | 实现 |
| --- | --- | ---: | ---: | --- | --- |
| [渐进增强页面替换](https://giraffe-tree.github.io/awesome-interaction/#progressively-enhanced-page-swap) | [Swup](https://github.com/swup/swup) | 5,198 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#progressively-enhanced-page-swap) |
| [可筛选网格重排](https://giraffe-tree.github.io/awesome-interaction/#filterable-grid-reflow) | [Isotope](https://github.com/metafizzy/isotope) | 11,103 | 1 | 经典旧版 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#filterable-grid-reflow) |
| [一行调用 DOM 重排动画](https://giraffe-tree.github.io/awesome-interaction/#one-call-dom-reflow-animation) | [AutoAnimate](https://github.com/FormKit/auto-animate) | 13,875 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#one-call-dom-reflow-animation) |
| [FLIP 共享元素转场](https://giraffe-tree.github.io/awesome-interaction/#flip-shared-element-transition) | [React Flip Toolkit](https://github.com/aholachek/react-flip-toolkit) | 4,189 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#flip-shared-element-transition) |
| [可拖拽紧密网格](https://giraffe-tree.github.io/awesome-interaction/#draggable-packed-grid) | [Muuri](https://github.com/haltu/muuri) | 10,949 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#draggable-packed-grid) |
| [列式瀑布流布局](https://giraffe-tree.github.io/awesome-interaction/#column-based-masonry-layout) | [Masonry](https://github.com/desandro/masonry) | 16,710 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#column-based-masonry-layout) |
| [填补空隙的装箱布局](https://giraffe-tree.github.io/awesome-interaction/#gap-filling-bin-pack-layout) | [Packery](https://github.com/metafizzy/packery) | 4,316 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#gap-filling-bin-pack-layout) |
| [组件进出状态机](https://giraffe-tree.github.io/awesome-interaction/#component-enter-exit-state-machine) | [React Transition Group](https://github.com/reactjs/react-transition-group) | 10,234 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#component-enter-exit-state-machine) |
| [速度感知滑动抽屉](https://giraffe-tree.github.io/awesome-interaction/#velocity-aware-swipe-drawer) | [Vaul](https://github.com/emilkowalski/vaul) | 8,479 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#velocity-aware-swipe-drawer) |
| [拖拽缩放仪表盘碰撞重排](https://giraffe-tree.github.io/awesome-interaction/#drag-resize-dashboard-collision-reflow) | [GridStack](https://github.com/gridstack/gridstack.js) | 8,994 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#drag-resize-dashboard-collision-reflow) |
| [可拖拽分栏尺寸调整](https://giraffe-tree.github.io/awesome-interaction/#draggable-split-pane-resize) | [Split.js](https://github.com/nathancahill/split) | 6,277 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#draggable-split-pane-resize) |
| [原生跨路由共享元素变形](https://giraffe-tree.github.io/awesome-interaction/#native-cross-route-shared-element-morph) | [next-view-transitions](https://github.com/shuding/next-view-transitions) | 2,385 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#native-cross-route-shared-element-morph) |
| [透视卡组轮换](https://giraffe-tree.github.io/awesome-interaction/#perspective-card-deck-swap) | [React Bits](https://github.com/DavidHDev/react-bits) | 43,496 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#perspective-card-deck-swap) |
| [像素网格内容溶解](https://giraffe-tree.github.io/awesome-interaction/#pixel-grid-content-dissolve) | [React Bits](https://github.com/DavidHDev/react-bits) | 43,496 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#pixel-grid-content-dissolve) |
| [分层文件夹开合](https://giraffe-tree.github.io/awesome-interaction/#layered-folder-open-close) | [React Bits](https://github.com/DavidHDev/react-bits) | 43,496 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#layered-folder-open-close) |
| [方向感知式步骤切换](https://giraffe-tree.github.io/awesome-interaction/#directional-wizard-step-transition) | [React Bits](https://github.com/DavidHDev/react-bits) | 43,496 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#directional-wizard-step-transition) |
| [气泡到导航变形](https://giraffe-tree.github.io/awesome-interaction/#bubble-to-navigation-morph) | [React Bits](https://github.com/DavidHDev/react-bits) | 43,496 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#bubble-to-navigation-morph) |
| [弹簧高度手风琴展开](https://giraffe-tree.github.io/awesome-interaction/#spring-height-accordion-disclosure) | [Motion Primitives](https://github.com/ibelick/motion-primitives) | 5,695 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#spring-height-accordion-disclosure) |
| [可展开操作工具栏揭示](https://giraffe-tree.github.io/awesome-interaction/#expandable-action-toolbar-reveal) | [Motion Primitives](https://github.com/ibelick/motion-primitives) | 5,695 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#expandable-action-toolbar-reveal) |
| [上下文切换动态工具栏](https://giraffe-tree.github.io/awesome-interaction/#context-switching-dynamic-toolbar) | [Motion Primitives](https://github.com/ibelick/motion-primitives) | 5,695 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#context-switching-dynamic-toolbar) |
| [自适应高度标签面板滑动](https://giraffe-tree.github.io/awesome-interaction/#adaptive-height-tab-panel-slide) | [Motion Primitives](https://github.com/ibelick/motion-primitives) | 5,695 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#adaptive-height-tab-panel-slide) |
| [裁剪形状主题揭示](https://giraffe-tree.github.io/awesome-interaction/#clip-shape-theme-reveal) | [Magic UI](https://github.com/magicuidesign/magicui) | 21,567 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#clip-shape-theme-reveal) |
| [混合模式自反色固定导航](https://giraffe-tree.github.io/awesome-interaction/#blend-mode-self-inverting-fixed-navigation) | [Awesome Web Effects](https://github.com/giraffe-tree/awesome-web-effects) | 0 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#blend-mode-self-inverting-fixed-navigation) |
| [延迟触发的下拉菜单推广光扫](https://giraffe-tree.github.io/awesome-interaction/#delayed-dropdown-promo-sweep) | [Awesome Web Effects](https://github.com/giraffe-tree/awesome-web-effects) | 0 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#delayed-dropdown-promo-sweep) |
| [场景同步换幕](https://giraffe-tree.github.io/awesome-interaction/#synchronized-scenario-scene-handoff) | [Awesome Web Effects](https://github.com/giraffe-tree/awesome-web-effects) | 0 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#synchronized-scenario-scene-handoff) |

<a id="carousel"></a>

### 导航与浮层

轮播、灯箱、菜单、导览、通知、拖拽浮层与空间导航。

| 效果 | 推荐来源 | Stars | 实现数 | 状态 | 实现 |
| --- | --- | ---: | ---: | --- | --- |
| [惯性触摸轮播](https://giraffe-tree.github.io/awesome-interaction/#momentum-touch-carousel) | [Swiper](https://github.com/nolimits4web/swiper) | 41,869 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#momentum-touch-carousel) |
| [缩略图到灯箱缩放](https://giraffe-tree.github.io/awesome-interaction/#thumbnail-to-lightbox-zoom) | [PhotoSwipe](https://github.com/dimsemenov/PhotoSwipe) | 25,215 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#thumbnail-to-lightbox-zoom) |
| [嵌套式画布外导航面板](https://giraffe-tree.github.io/awesome-interaction/#nested-off-canvas-navigation-panels) | [mmenu.js](https://github.com/FrDH/mmenu-js) | 2,574 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#nested-off-canvas-navigation-panels) |
| [焦点交接式聚光导览](https://giraffe-tree.github.io/awesome-interaction/#spotlight-tour-with-focus-handoff) | [Driver.js](https://github.com/nilbuild/driver.js) | 26,283 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#spotlight-tour-with-focus-handoff) |
| [动画无障碍模态提示](https://giraffe-tree.github.io/awesome-interaction/#animated-accessible-modal-alert) | [SweetAlert2](https://github.com/sweetalert2/sweetalert2) | 18,099 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#animated-accessible-modal-alert) |
| [筛选式命令面板浮层](https://giraffe-tree.github.io/awesome-interaction/#filtered-command-palette-overlay) | [cmdk](https://github.com/dip/cmdk) | 12,799 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#filtered-command-palette-overlay) |
| [堆叠可关闭通知队列](https://giraffe-tree.github.io/awesome-interaction/#stacking-dismissible-toast-queue) | [react-hot-toast](https://github.com/timolins/react-hot-toast) | 10,956 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#stacking-dismissible-toast-queue) |
| [锚点浮层翻转与位移](https://giraffe-tree.github.io/awesome-interaction/#anchored-popover-flip-and-shift) | [Floating UI](https://github.com/floating-ui/floating-ui) | 32,665 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#anchored-popover-flip-and-shift) |
| [嵌套菜单与子菜单转场](https://giraffe-tree.github.io/awesome-interaction/#nested-menu-and-submenu-transition) | [React Menu](https://github.com/szhsin/react-menu) | 1,218 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#nested-menu-and-submenu-transition) |
| [拖拽浮层与落点预览](https://giraffe-tree.github.io/awesome-interaction/#drag-overlay-and-drop-preview) | [dnd kit](https://github.com/clauderic/dnd-kit) | 17,408 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#drag-overlay-and-drop-preview) |
| [带边界的弹簧拖拽与捏合](https://giraffe-tree.github.io/awesome-interaction/#bound-spring-drag-and-pinch) | [use-gesture](https://github.com/pmndrs/use-gesture) | 9,620 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#bound-spring-drag-and-pinch) |
| [空间化演示文稿导航](https://giraffe-tree.github.io/awesome-interaction/#spatial-slide-deck-navigation) | [reveal.js](https://github.com/hakimel/reveal.js) | 71,936 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#spatial-slide-deck-navigation) |
| [速度倾斜 3D 卡片轮播](https://giraffe-tree.github.io/awesome-interaction/#velocity-tilted-3d-card-carousel) | [React Bits](https://github.com/DavidHDev/react-bits) | 43,496 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#velocity-tilted-3d-card-carousel) |
| [弯曲 WebGL 图库丝带](https://giraffe-tree.github.io/awesome-interaction/#bending-webgl-gallery-ribbon) | [React Bits](https://github.com/DavidHDev/react-bits) | 43,496 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#bending-webgl-gallery-ribbon) |
| [可拖拽穹顶图库](https://giraffe-tree.github.io/awesome-interaction/#draggable-dome-gallery) | [React Bits](https://github.com/DavidHDev/react-bits) | 43,496 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#draggable-dome-gallery) |
| [无限球面菜单](https://giraffe-tree.github.io/awesome-interaction/#infinite-spherical-menu) | [React Bits](https://github.com/DavidHDev/react-bits) | 43,496 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#infinite-spherical-menu) |
| [无缝 Logo 循环跑马灯](https://giraffe-tree.github.io/awesome-interaction/#seamless-logo-loop-marquee) | [React Bits](https://github.com/DavidHDev/react-bits) | 43,496 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#seamless-logo-loop-marquee) |
| [邻项放大导航坞](https://giraffe-tree.github.io/awesome-interaction/#neighbor-magnifying-navigation-dock) | [React Bits](https://github.com/DavidHDev/react-bits) | 43,496 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#neighbor-magnifying-navigation-dock) |
| [分层交错全屏菜单](https://giraffe-tree.github.io/awesome-interaction/#layered-staggered-full-screen-menu) | [React Bits](https://github.com/DavidHDev/react-bits) | 43,496 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#layered-staggered-full-screen-menu) |
| [悬停激活图像跑马菜单](https://giraffe-tree.github.io/awesome-interaction/#hover-activated-image-marquee-menu) | [React Bits](https://github.com/DavidHDev/react-bits) | 43,496 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#hover-activated-image-marquee-menu) |
| [键盘无障碍径向上下文菜单](https://giraffe-tree.github.io/awesome-interaction/#keyboard-accessible-radial-context-menu) | [Animate UI](https://github.com/imskyleen/animate-ui) | 3,867 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#keyboard-accessible-radial-context-menu) |
| [拖拽甩出卡片堆](https://giraffe-tree.github.io/awesome-interaction/#drag-thrown-card-stack) | [React Bits](https://github.com/DavidHDev/react-bits) | 43,496 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#drag-thrown-card-stack) |

<a id="pointer"></a>

### 指针与悬停

倾斜、景深、自定义光标、磁性运动与图像扭曲。

| 效果 | 推荐来源 | Stars | 实现数 | 状态 | 实现 |
| --- | --- | ---: | ---: | --- | --- |
| [指针驱动图层景深](https://giraffe-tree.github.io/awesome-interaction/#pointer-driven-layer-depth) | [Parallax.js](https://github.com/wagerfield/parallax) | 16,583 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#pointer-driven-layer-depth) |
| [透视倾斜与高光](https://giraffe-tree.github.io/awesome-interaction/#perspective-tilt-and-glare) | [vanilla-tilt.js](https://github.com/micku7zu/vanilla-tilt.js) | 4,019 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#perspective-tilt-and-glare) |
| [情境感知自定义光标](https://giraffe-tree.github.io/awesome-interaction/#context-aware-custom-cursor) | [mouse-follower](https://github.com/Cuberto/mouse-follower) | 818 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#context-aware-custom-cursor) |
| [位移贴图图像悬停](https://giraffe-tree.github.io/awesome-interaction/#displacement-map-image-hover) | [hover-effect](https://github.com/robin-dela/hover-effect) | 1,874 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#displacement-map-image-hover) |
| [可复用 CSS 悬停词汇](https://giraffe-tree.github.io/awesome-interaction/#reusable-css-hover-vocabulary) | [Hover.css](https://github.com/IanLunn/Hover) | 29,395 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#reusable-css-hover-vocabulary) |
| [尾随光标粒子](https://giraffe-tree.github.io/awesome-interaction/#trailing-cursor-particles) | [cursor-effects](https://github.com/tholman/cursor-effects) | 4,013 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#trailing-cursor-particles) |
| [深度图人像视差](https://giraffe-tree.github.io/awesome-interaction/#depth-map-portrait-parallax) | [fake3d](https://github.com/akella/fake3d) | 545 | 1 | 经典旧版 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#depth-map-portrait-parallax) |
| [指针吸引按钮运动](https://giraffe-tree.github.io/awesome-interaction/#pointer-attracted-button-motion) | [Magnetic Buttons](https://github.com/codrops/MagneticButtons) | 485 | 1 | 经典旧版 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#pointer-attracted-button-motion) |
| [按接近方向进入的遮罩](https://giraffe-tree.github.io/awesome-interaction/#approach-direction-overlay-entrance) | [Direction-Aware Hover](https://github.com/codrops/DirectionAwareHoverEffect) | 393 | 1 | 经典旧版 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#approach-direction-overlay-entrance) |
| [SVG 滤镜黏液文字悬停](https://giraffe-tree.github.io/awesome-interaction/#svg-filter-gooey-text-hover) | [Gooey Text Hover](https://github.com/codrops/GooeyTextHoverEffect) | 155 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#svg-filter-gooey-text-hover) |
| [热点揭示图像区域](https://giraffe-tree.github.io/awesome-interaction/#hotspot-revealed-image-regions) | [Interactive Points](https://github.com/codrops/InteractivePoints) | 302 | 1 | 经典旧版 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#hotspot-revealed-image-regions) |
| [展开式彩色卡片堆栈](https://giraffe-tree.github.io/awesome-interaction/#expanding-colored-card-stack) | [Stack Motion Hover](https://github.com/codrops/StackMotionHoverEffects) | 499 | 1 | 经典旧版 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#expanding-colored-card-stack) |
| [点击原点火花爆发](https://giraffe-tree.github.io/awesome-interaction/#click-origin-spark-burst) | [React Bits](https://github.com/DavidHDev/react-bits) | 43,496 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#click-origin-spark-burst) |
| [融球液滴光标](https://giraffe-tree.github.io/awesome-interaction/#metaball-blob-cursor) | [React Bits](https://github.com/DavidHDev/react-bits) | 43,496 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#metaball-blob-cursor) |
| [辉光幽灵光标轨迹](https://giraffe-tree.github.io/awesome-interaction/#blooming-spectral-cursor-trail) | [React Bits](https://github.com/DavidHDev/react-bits) | 43,496 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#blooming-spectral-cursor-trail) |
| [速度间隔图像尾迹](https://giraffe-tree.github.io/awesome-interaction/#velocity-spaced-image-trail) | [React Bits](https://github.com/DavidHDev/react-bits) | 43,496 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#velocity-spaced-image-trail) |
| [黏性像素光标尾流](https://giraffe-tree.github.io/awesome-interaction/#gooey-pixel-cursor-wake) | [React Bits](https://github.com/DavidHDev/react-bits) | 43,496 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#gooey-pixel-cursor-wake) |
| [光标局部卡片聚光](https://giraffe-tree.github.io/awesome-interaction/#cursor-localized-card-spotlight) | [React Bits](https://github.com/DavidHDev/react-bits) | 43,496 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#cursor-localized-card-spotlight) |
| [吸附目标准星光标](https://giraffe-tree.github.io/awesome-interaction/#snapping-target-reticle-cursor) | [React Bits](https://github.com/DavidHDev/react-bits) | 43,496 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#snapping-target-reticle-cursor) |
| [漂浮文字光标尾迹](https://giraffe-tree.github.io/awesome-interaction/#floating-word-cursor-trail) | [React Bits](https://github.com/DavidHDev/react-bits) | 43,496 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#floating-word-cursor-trail) |
| [指针响应单元格网格](https://giraffe-tree.github.io/awesome-interaction/#pointer-reactive-cell-grid) | [React Bits](https://github.com/DavidHDev/react-bits) | 43,496 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#pointer-reactive-cell-grid) |
| [指针雕刻着色器孔径](https://giraffe-tree.github.io/awesome-interaction/#pointer-carved-shader-aperture) | [React Bits](https://github.com/DavidHDev/react-bits) | 43,496 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#pointer-carved-shader-aperture) |
| [四角裁切标记悬停显现](https://giraffe-tree.github.io/awesome-interaction/#four-corner-hover-crop-marks) | [Awesome Web Effects](https://github.com/giraffe-tree/awesome-web-effects) | 0 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#four-corner-hover-crop-marks) |
| [卡片元数据到 CTA 角色互换](https://giraffe-tree.github.io/awesome-interaction/#card-metadata-to-cta-role-swap) | [Awesome Web Effects](https://github.com/giraffe-tree/awesome-web-effects) | 0 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#card-metadata-to-cta-role-swap) |
| [反向对冲斜移 CTA](https://giraffe-tree.github.io/awesome-interaction/#opposed-diagonal-offset-cta) | [Awesome Web Effects](https://github.com/giraffe-tree/awesome-web-effects) | 0 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#opposed-diagonal-offset-cta) |
| [交互历史驱动招聘徽章](https://giraffe-tree.github.io/awesome-interaction/#interaction-history-hiring-badge) | [Awesome Web Effects](https://github.com/giraffe-tree/awesome-web-effects) | 0 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#interaction-history-hiring-badge) |

<a id="vector"></a>

### 文本与 SVG

打字、文字拆分、矢量绘制、手写与 SVG 变形。

| 效果 | 推荐来源 | Stars | 实现数 | 状态 | 实现 |
| --- | --- | ---: | ---: | --- | --- |
| [SVG 描边绘制](https://giraffe-tree.github.io/awesome-interaction/#svg-stroke-drawing) | [Vivus](https://github.com/maxwellito/vivus) | 15,479 | 1 | 经典旧版 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#svg-stroke-drawing) |
| [After Effects 矢量播放](https://giraffe-tree.github.io/awesome-interaction/#after-effects-vector-playback) | [lottie-web](https://github.com/airbnb/lottie-web) | 32,014 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#after-effects-vector-playback) |
| [循环打字序列](https://giraffe-tree.github.io/awesome-interaction/#looping-typewriter-sequence) | [Typed.js](https://github.com/mattboldt/typed.js) | 16,283 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#looping-typewriter-sequence) |
| [文本拆字符 CSS 变量](https://giraffe-tree.github.io/awesome-interaction/#text-to-character-css-variables) | [Splitting](https://github.com/shshaw/Splitting) | 1,755 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#text-to-character-css-variables) |
| [着色器处理字体](https://giraffe-tree.github.io/awesome-interaction/#shader-processed-typography) | [Blotter](https://github.com/bradley/Blotter) | 3,076 | 1 | 经典旧版 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#shader-processed-typography) |
| [随机解码文本揭示](https://giraffe-tree.github.io/awesome-interaction/#randomized-decode-text-reveal) | [use-scramble](https://github.com/tol-is/use-scramble) | 143 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#randomized-decode-text-reveal) |
| [流式 SVG 场景动画](https://giraffe-tree.github.io/awesome-interaction/#fluent-svg-scene-animation) | [SVG.js](https://github.com/svgdotjs/svg.js) | 11,802 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#fluent-svg-scene-animation) |
| [手绘感矢量渲染](https://giraffe-tree.github.io/awesome-interaction/#hand-drawn-vector-rendering) | [Rough.js](https://github.com/rough-stuff/rough) | 21,074 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#hand-drawn-vector-rendering) |
| [手写路径字形](https://giraffe-tree.github.io/awesome-interaction/#handwritten-path-lettering) | [Vara](https://github.com/akzhy/Vara) | 289 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#handwritten-path-lettering) |
| [字符差异文本转场](https://giraffe-tree.github.io/awesome-interaction/#character-diff-text-transition) | [smart-ticker](https://github.com/tombcato/smart-ticker) | 165 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#character-diff-text-transition) |
| [机械翻牌字符变化](https://giraffe-tree.github.io/awesome-interaction/#mechanical-split-flap-character-change) | [Flip](https://github.com/pqina/flip) | 1,018 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#mechanical-split-flap-character-change) |
| [拓扑安全 SVG 形状变形](https://giraffe-tree.github.io/awesome-interaction/#topology-safe-svg-shape-morph) | [Flubber](https://github.com/veltman/flubber) | 6,923 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#topology-safe-svg-shape-morph) |
| [手绘标注动画](https://giraffe-tree.github.io/awesome-interaction/#animated-hand-drawn-annotation) | [Rough Notation](https://github.com/rough-stuff/rough-notation) | 9,640 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#animated-hand-drawn-annotation) |
| [Voronoi 最近点悬停聚焦](https://giraffe-tree.github.io/awesome-interaction/#voronoi-nearest-point-hover-focus) | [D3](https://github.com/d3/d3) | 113,233 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#voronoi-nearest-point-hover-focus) |
| [联动框选缩放图表](https://giraffe-tree.github.io/awesome-interaction/#linked-brush-to-zoom-chart) | [D3](https://github.com/d3/d3) | 113,233 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#linked-brush-to-zoom-chart) |
| [可拖拽力导向 SVG 网络](https://giraffe-tree.github.io/awesome-interaction/#draggable-force-directed-svg-network) | [D3](https://github.com/d3/d3) | 113,233 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#draggable-force-directed-svg-network) |
| [手柄连线动画节点编辑器](https://giraffe-tree.github.io/awesome-interaction/#handle-connected-animated-node-editor) | [React Flow](https://github.com/xyflow/xyflow) | 37,667 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#handle-connected-animated-node-editor) |
| [点击折叠层级分支](https://giraffe-tree.github.io/awesome-interaction/#click-to-collapse-hierarchy-branches) | [D3](https://github.com/d3/d3) | 113,233 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#click-to-collapse-hierarchy-branches) |
| [悬停高亮分级设色地图](https://giraffe-tree.github.io/awesome-interaction/#hover-highlighted-choropleth-map) | [D3](https://github.com/d3/d3) | 113,233 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#hover-highlighted-choropleth-map) |
| [闪烁式 SVG 内容骨架屏](https://giraffe-tree.github.io/awesome-interaction/#shimmering-svg-content-skeleton) | [React Content Loader](https://github.com/danilowoz/react-content-loader) | 13,997 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#shimmering-svg-content-skeleton) |
| [可点击生成图回调](https://giraffe-tree.github.io/awesome-interaction/#clickable-generated-diagram-callback) | [Mermaid](https://github.com/mermaid-js/mermaid) | 89,262 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#clickable-generated-diagram-callback) |
| [SVG 曲线运动路径跟随](https://giraffe-tree.github.io/awesome-interaction/#svg-curve-motion-path-follower) | [Motion](https://github.com/motiondivision/motion) | 32,819 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#svg-curve-motion-path-follower) |
| [无限曲线路径文字传送带](https://giraffe-tree.github.io/awesome-interaction/#infinite-curved-text-path-conveyor) | [GSAP](https://github.com/greensock/GSAP) | 26,600 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#infinite-curved-text-path-conveyor) |
| [输入选中替换提示词循环](https://giraffe-tree.github.io/awesome-interaction/#type-select-replace-prompt-loop) | [Motion](https://github.com/motiondivision/motion) | 32,819 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#type-select-replace-prompt-loop) |
| [旅行圆点擦写标题](https://giraffe-tree.github.io/awesome-interaction/#traveling-dot-headline-eraser-writer) | [Awesome Web Effects](https://github.com/giraffe-tree/awesome-web-effects) | 0 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#traveling-dot-headline-eraser-writer) |

<a id="canvas"></a>

### Canvas 与 2D

场景图、创意编程、物理、绘图工具与 2D 渲染器。

| 效果 | 推荐来源 | Stars | 实现数 | 状态 | 实现 |
| --- | --- | ---: | ---: | --- | --- |
| [GPU 加速 2D 场景图](https://giraffe-tree.github.io/awesome-interaction/#gpu-accelerated-2d-scene-graph) | [PixiJS](https://github.com/pixijs/pixijs) | 47,790 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#gpu-accelerated-2d-scene-graph) |
| [草图式创意编程循环](https://giraffe-tree.github.io/awesome-interaction/#sketch-style-creative-coding-loop) | [p5.js](https://github.com/processing/p5.js) | 23,797 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#sketch-style-creative-coding-loop) |
| [Canvas 上的矢量几何](https://giraffe-tree.github.io/awesome-interaction/#vector-geometry-on-canvas) | [Paper.js](https://github.com/paperjs/paper.js) | 15,061 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#vector-geometry-on-canvas) |
| [交互式对象画布](https://giraffe-tree.github.io/awesome-interaction/#interactive-object-canvas) | [Fabric.js](https://github.com/fabricjs/fabric.js) | 31,321 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#interactive-object-canvas) |
| [分层可拖拽 Canvas 节点](https://giraffe-tree.github.io/awesome-interaction/#layered-draggable-canvas-nodes) | [Konva](https://github.com/konvajs/konva) | 14,619 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#layered-draggable-canvas-nodes) |
| [跨渲染器 2D 图元](https://giraffe-tree.github.io/awesome-interaction/#renderer-agnostic-2d-primitives) | [Two.js](https://github.com/jonobr1/two.js) | 8,643 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#renderer-agnostic-2d-primitives) |
| [显示列表 Canvas 动画](https://giraffe-tree.github.io/awesome-interaction/#display-list-canvas-animation) | [EaselJS](https://github.com/CreateJS/EaselJS) | 8,169 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#display-list-canvas-animation) |
| [浏览器游戏场景生命周期](https://giraffe-tree.github.io/awesome-interaction/#browser-game-scene-lifecycle) | [Phaser](https://github.com/phaserjs/phaser) | 39,960 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#browser-game-scene-lifecycle) |
| [网页刚体物理](https://giraffe-tree.github.io/awesome-interaction/#rigid-body-web-physics) | [Matter.js](https://github.com/liabru/matter-js) | 18,321 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#rigid-body-web-physics) |
| [基于点的生成式几何](https://giraffe-tree.github.io/awesome-interaction/#point-based-generative-geometry) | [Pts](https://github.com/williamngan/pts) | 5,336 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#point-based-generative-geometry) |
| [伪 3D 扁平插画](https://giraffe-tree.github.io/awesome-interaction/#pseudo-3d-flat-illustration) | [Zdog](https://github.com/metafizzy/zdog) | 10,634 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#pseudo-3d-flat-illustration) |
| [无限协作绘图画布](https://giraffe-tree.github.io/awesome-interaction/#infinite-collaborative-drawing-surface) | [tldraw](https://github.com/tldraw/tldraw) | 48,780 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#infinite-collaborative-drawing-surface) |
| [麦克风响应频谱环](https://giraffe-tree.github.io/awesome-interaction/#microphone-reactive-spectrum-ring) | [p5.sound](https://github.com/processing/p5.sound.js) | 47 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#microphone-reactive-spectrum-ring) |
| [速度感应签名墨迹](https://giraffe-tree.github.io/awesome-interaction/#velocity-sensitive-signature-ink) | [Signature Pad](https://github.com/szimek/signature_pad) | 11,976 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#velocity-sensitive-signature-ink) |
| [压力塑形自由笔触](https://giraffe-tree.github.io/awesome-interaction/#pressure-shaped-freehand-stroke) | [perfect-freehand](https://github.com/steveruizok/perfect-freehand) | 5,630 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#pressure-shaped-freehand-stroke) |
| [悬停扩张动画环形图](https://giraffe-tree.github.io/awesome-interaction/#hover-expanding-animated-doughnut-chart) | [Chart.js](https://github.com/chartjs/Chart.js) | 67,584 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#hover-expanding-animated-doughnut-chart) |
| [流式折线图过渡](https://giraffe-tree.github.io/awesome-interaction/#streaming-line-chart-transition) | [Apache ECharts](https://github.com/apache/echarts) | 66,818 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#streaming-line-chart-transition) |
| [多图同步游标](https://giraffe-tree.github.io/awesome-interaction/#synchronized-multi-chart-cursor) | [uPlot](https://github.com/leeoniya/uPlot) | 10,330 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#synchronized-multi-chart-cursor) |
| [可拖拽编辑贝塞尔曲线手柄](https://giraffe-tree.github.io/awesome-interaction/#drag-editable-b-zier-curve-handles) | [Paper.js](https://github.com/paperjs/paper.js) | 15,061 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#drag-editable-b-zier-curve-handles) |
| [指针跟随置换涟漪](https://giraffe-tree.github.io/awesome-interaction/#pointer-following-displacement-ripple) | [PixiJS](https://github.com/pixijs/pixijs) | 47,790 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#pointer-following-displacement-ripple) |
| [缩放旋转变换手柄](https://giraffe-tree.github.io/awesome-interaction/#resize-and-rotate-transform-handles) | [Konva](https://github.com/konvajs/konva) | 14,619 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#resize-and-rotate-transform-handles) |
| [悬停命中变色高亮](https://giraffe-tree.github.io/awesome-interaction/#hover-hit-test-color-highlight) | [LeaferJS](https://github.com/leaferjs/leafer-ui) | 4,270 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#hover-hit-test-color-highlight) |
| [交错多图表遥测启动](https://giraffe-tree.github.io/awesome-interaction/#staggered-multi-chart-telemetry-boot) | [Awesome Web Effects](https://github.com/giraffe-tree/awesome-web-effects) | 0 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#staggered-multi-chart-telemetry-boot) |
| [拖拽生成且避让 DOM 的鱼群](https://giraffe-tree.github.io/awesome-interaction/#drag-spawned-dom-aware-fish-flock) | [Awesome Web Effects](https://github.com/giraffe-tree/awesome-web-effects) | 0 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#drag-spawned-dom-aware-fish-flock) |

<a id="webgl"></a>

### 3D 与 WebGL

3D 引擎、声明式渲染器、着色器图层与后期处理。

| 效果 | 推荐来源 | Stars | 实现数 | 状态 | 实现 |
| --- | --- | ---: | ---: | --- | --- |
| [声明式 React 3D 场景](https://giraffe-tree.github.io/awesome-interaction/#declarative-react-3d-scene) | [react-three-fiber](https://github.com/pmndrs/react-three-fiber) | 31,433 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#declarative-react-3d-scene) |
| [通用 WebGL 场景图](https://giraffe-tree.github.io/awesome-interaction/#general-purpose-webgl-scene-graph) | [three.js](https://github.com/mrdoob/three.js) | 113,755 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#general-purpose-webgl-scene-graph) |
| [功能齐全 3D 引擎](https://giraffe-tree.github.io/awesome-interaction/#batteries-included-3d-engine) | [Babylon.js](https://github.com/BabylonJS/Babylon.js) | 25,806 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#batteries-included-3d-engine) |
| [实体组件 3D 运行时](https://giraffe-tree.github.io/awesome-interaction/#entity-component-3d-runtime) | [PlayCanvas Engine](https://github.com/playcanvas/engine) | 16,245 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#entity-component-3d-runtime) |
| [极简 WebGL 抽象](https://giraffe-tree.github.io/awesome-interaction/#minimal-webgl-abstraction) | [OGL](https://github.com/oframe/ogl) | 4,582 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#minimal-webgl-abstraction) |
| [函数式 WebGL 绘制命令](https://giraffe-tree.github.io/awesome-interaction/#functional-webgl-draw-commands) | [regl](https://github.com/regl-project/regl) | 5,557 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#functional-webgl-draw-commands) |
| [与 DOM 同步的着色器平面](https://giraffe-tree.github.io/awesome-interaction/#dom-synced-shader-planes) | [Curtains.js](https://github.com/martinlaxenaire/curtainsjs) | 1,823 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#dom-synced-shader-planes) |
| [无障碍交互式 3D 商品查看](https://giraffe-tree.github.io/awesome-interaction/#accessible-interactive-3d-product-view) | [<model-viewer>](https://github.com/google/model-viewer) | 8,161 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#accessible-interactive-3d-product-view) |
| [声明式 HTML 3D 场景](https://giraffe-tree.github.io/awesome-interaction/#declarative-html-3d-scene) | [A-Frame](https://github.com/aframevr/aframe) | 17,586 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#declarative-html-3d-scene) |
| [Vue 声明式 Three.js](https://giraffe-tree.github.io/awesome-interaction/#vue-declarative-three-js) | [TresJS](https://github.com/Tresjs/tres) | 3,625 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#vue-declarative-three-js) |
| [Svelte 声明式 Three.js](https://giraffe-tree.github.io/awesome-interaction/#svelte-declarative-three-js) | [Threlte](https://github.com/threlte/threlte) | 3,300 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#svelte-declarative-three-js) |
| [合并式实时辉光后期](https://giraffe-tree.github.io/awesome-interaction/#merged-real-time-bloom-pass) | [postprocessing](https://github.com/pmndrs/postprocessing) | 2,811 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#merged-real-time-bloom-pass) |
| [滑杆控制 3D 爆炸装配图](https://giraffe-tree.github.io/awesome-interaction/#slider-controlled-exploded-3d-assembly) | [three.js](https://github.com/mrdoob/three.js) | 113,755 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#slider-controlled-exploded-3d-assembly) |
| [碰撞响应式 3D 物理堆栈](https://giraffe-tree.github.io/awesome-interaction/#collision-reactive-3d-physics-stack) | [React Three Rapier](https://github.com/pmndrs/react-three-rapier) | 1,410 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#collision-reactive-3d-physics-stack) |
| [折射玻璃透射物体](https://giraffe-tree.github.io/awesome-interaction/#refractive-glass-transmission-object) | [Drei](https://github.com/pmndrs/drei) | 9,744 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#refractive-glass-transmission-object) |
| [可轨道浏览高斯泼溅场景](https://giraffe-tree.github.io/awesome-interaction/#orbitable-gaussian-splat-scene) | [GaussianSplats3D](https://github.com/mkkellogg/GaussianSplats3D) | 2,823 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#orbitable-gaussian-splat-scene) |
| [指针旋转点阵地球](https://giraffe-tree.github.io/awesome-interaction/#pointer-rotated-dotted-globe) | [COBE](https://github.com/shuding/cobe) | 5,472 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#pointer-rotated-dotted-globe) |
| [电影式地图相机飞行](https://giraffe-tree.github.io/awesome-interaction/#cinematic-map-camera-fly-to) | [MapLibre GL JS](https://github.com/maplibre/maplibre-gl-js) | 11,067 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#cinematic-map-camera-fly-to) |
| [延时地球昼夜扫过](https://giraffe-tree.github.io/awesome-interaction/#time-lapse-globe-daylight-sweep) | [CesiumJS](https://github.com/CesiumGS/cesium) | 15,469 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#time-lapse-globe-daylight-sweep) |
| [可拾取挤出数据柱](https://giraffe-tree.github.io/awesome-interaction/#pickable-extruded-data-columns) | [deck.gl](https://github.com/visgl/deck.gl) | 14,319 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#pickable-extruded-data-columns) |
| [弯曲三维文字环绕](https://giraffe-tree.github.io/awesome-interaction/#curved-3d-text-orbit) | [Troika](https://github.com/protectwise/troika) | 1,960 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#curved-3d-text-orbit) |
| [光标投射三维表面标记](https://giraffe-tree.github.io/awesome-interaction/#cursor-projected-3d-surface-marker) | [three.js](https://github.com/mrdoob/three.js) | 113,755 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#cursor-projected-3d-surface-marker) |

<a id="background"></a>

### 背景与粒子

流体、粒子、渐变、彩纸、网格、丝带与烟花。

| 效果 | 推荐来源 | Stars | 实现数 | 状态 | 实现 |
| --- | --- | ---: | ---: | --- | --- |
| [指针注入 GPU 流体](https://giraffe-tree.github.io/awesome-interaction/#pointer-injected-gpu-fluid) | [WebGL Fluid Simulation](https://github.com/PavelDoGreat/WebGL-Fluid-Simulation) | 16,493 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#pointer-injected-gpu-fluid) |
| [可配置响应式粒子场](https://giraffe-tree.github.io/awesome-interaction/#configurable-reactive-particle-field) | [tsParticles](https://github.com/tsparticles/tsparticles) | 8,920 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#configurable-reactive-particle-field) |
| [即插即用 WebGL 动态背景](https://giraffe-tree.github.io/awesome-interaction/#drop-in-animated-webgl-background) | [Vanta](https://github.com/tengbao/vanta) | 6,608 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#drop-in-animated-webgl-background) |
| [事件触发彩纸爆发](https://giraffe-tree.github.io/awesome-interaction/#event-triggered-confetti-burst) | [canvas-confetti](https://github.com/catdad/canvas-confetti) | 12,648 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#event-triggered-confetti-burst) |
| [动态渐变状态转场](https://giraffe-tree.github.io/awesome-interaction/#animated-gradient-state-transitions) | [Granim.js](https://github.com/sarcadass/granim.js) | 5,304 | 1 | 经典旧版 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#animated-gradient-state-transitions) |
| [程序化低多边形网格](https://giraffe-tree.github.io/awesome-interaction/#procedural-low-poly-mesh) | [Trianglify](https://github.com/qrohlf/trianglify) | 10,089 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#procedural-low-poly-mesh) |
| [交互式烟花场](https://giraffe-tree.github.io/awesome-interaction/#interactive-fireworks-field) | [Fireworks.js](https://github.com/crashmax-dev/fireworks-js) | 1,380 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#interactive-fireworks-field) |
| [程序化丝带轨迹](https://giraffe-tree.github.io/awesome-interaction/#procedural-ribbon-trail) | [ribbon.js](https://github.com/hustcc/ribbon.js) | 237 | 1 | 经典旧版 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#procedural-ribbon-trail) |
| [带光照低多边形曲面](https://giraffe-tree.github.io/awesome-interaction/#lit-low-poly-surface) | [Flat Surface Shader](https://github.com/wagerfield/flat-surface-shader) | 2,469 | 1 | 经典旧版 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#lit-low-poly-surface) |
| [生成式 CSS 网格图案动画](https://giraffe-tree.github.io/awesome-interaction/#generated-css-grid-pattern-animation) | [CSS Doodle](https://github.com/css-doodle/css-doodle) | 6,020 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#generated-css-grid-pattern-animation) |
| [全页片段着色器背景](https://giraffe-tree.github.io/awesome-interaction/#full-page-fragment-shader-backdrop) | [shader-web-background](https://github.com/xemantic/shader-web-background) | 280 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#full-page-fragment-shader-backdrop) |
| [涌现式吸引排斥粒子群](https://giraffe-tree.github.io/awesome-interaction/#emergent-attraction-repulsion-swarm) | [Particle Life](https://github.com/hunar4321/particle-life) | 3,343 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#emergent-attraction-repulsion-swarm) |
| [分层极光丝带背景](https://giraffe-tree.github.io/awesome-interaction/#layered-aurora-ribbon-background) | [React Bits](https://github.com/DavidHDev/react-bits) | 43,496 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#layered-aurora-ribbon-background) |
| [鼠标排斥旋涡星系](https://giraffe-tree.github.io/awesome-interaction/#mouse-repelling-spiral-galaxy) | [React Bits](https://github.com/DavidHDev/react-bits) | 43,496 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#mouse-repelling-spiral-galaxy) |
| [程序化闪电背景](https://giraffe-tree.github.io/awesome-interaction/#procedural-lightning-bolt-background) | [React Bits](https://github.com/DavidHDev/react-bits) | 43,496 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#procedural-lightning-bolt-background) |
| [指针扰动抖动波纹](https://giraffe-tree.github.io/awesome-interaction/#pointer-disturbed-dither-waves) | [React Bits](https://github.com/DavidHDev/react-bits) | 43,496 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#pointer-disturbed-dither-waves) |
| [流动丝绸着色器背景](https://giraffe-tree.github.io/awesome-interaction/#flowing-silk-shader-background) | [React Bits](https://github.com/DavidHDev/react-bits) | 43,496 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#flowing-silk-shader-background) |
| [光标响应纤维线场](https://giraffe-tree.github.io/awesome-interaction/#cursor-reactive-filament-threads) | [React Bits](https://github.com/DavidHDev/react-bits) | 43,496 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#cursor-reactive-filament-threads) |
| [平滑矩阵字符故障场](https://giraffe-tree.github.io/awesome-interaction/#smooth-matrix-letter-glitch-field) | [React Bits](https://github.com/DavidHDev/react-bits) | 43,496 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#smooth-matrix-letter-glitch-field) |
| [交互式超高速公路](https://giraffe-tree.github.io/awesome-interaction/#interactive-hyperspeed-highway) | [React Bits](https://github.com/DavidHDev/react-bits) | 43,496 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#interactive-hyperspeed-highway) |
| [指针扭曲 Balatro 等离子](https://giraffe-tree.github.io/awesome-interaction/#pointer-warped-balatro-plasma) | [React Bits](https://github.com/DavidHDev/react-bits) | 43,496 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#pointer-warped-balatro-plasma) |
| [CRT 故障终端像素场](https://giraffe-tree.github.io/awesome-interaction/#crt-faulty-terminal-pixel-field) | [React Bits](https://github.com/DavidHDev/react-bits) | 43,496 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#crt-faulty-terminal-pixel-field) |
| [滚动联动多层星野漂移](https://giraffe-tree.github.io/awesome-interaction/#scroll-linked-multilayer-starfield-drift) | [GSAP](https://github.com/greensock/GSAP) | 26,600 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#scroll-linked-multilayer-starfield-drift) |
| [模糊自播视频氛围层](https://giraffe-tree.github.io/awesome-interaction/#blurred-autoplay-video-ambience) | [Awesome Web Effects](https://github.com/giraffe-tree/awesome-web-effects) | 0 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#blurred-autoplay-video-ambience) |

<a id="media"></a>

### 媒体与图像

前后对比、平移缩放、裁剪、滤镜、镜头放大与着色器转场。

| 效果 | 推荐来源 | Stars | 实现数 | 状态 | 实现 |
| --- | --- | ---: | ---: | --- | --- |
| [拖拽揭示图像对比](https://giraffe-tree.github.io/awesome-interaction/#drag-to-reveal-image-comparison) | [img-comparison-slider](https://github.com/sneas/img-comparison-slider) | 864 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#drag-to-reveal-image-comparison) |
| [可复用 GLSL 媒体转场](https://giraffe-tree.github.io/awesome-interaction/#reusable-glsl-media-transition) | [GL Transitions](https://github.com/gl-transitions/gl-transitions) | 2,115 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#reusable-glsl-media-transition) |
| [行内图片聚焦缩放](https://giraffe-tree.github.io/awesome-interaction/#inline-image-focus-zoom) | [medium-zoom](https://github.com/francoischalifour/medium-zoom) | 3,936 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#inline-image-focus-zoom) |
| [指针平移与捏合缩放](https://giraffe-tree.github.io/awesome-interaction/#pointer-pan-and-pinch-zoom) | [Panzoom](https://github.com/timmywil/panzoom) | 2,440 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#pointer-pan-and-pinch-zoom) |
| [深度缩放切片图像](https://giraffe-tree.github.io/awesome-interaction/#deep-zoom-tiled-imagery) | [OpenSeadragon](https://github.com/openseadragon/openseadragon) | 3,479 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#deep-zoom-tiled-imagery) |
| [交互式图像裁剪变换](https://giraffe-tree.github.io/awesome-interaction/#interactive-image-crop-transform) | [Cropper.js](https://github.com/fengyuanchen/cropperjs) | 13,857 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#interactive-image-crop-transform) |
| [电商镜头放大](https://giraffe-tree.github.io/awesome-interaction/#e-commerce-lens-magnification) | [Drift](https://github.com/strawdynamics/drift) | 1,562 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#e-commerce-lens-magnification) |
| [可链式 Canvas 照片滤镜](https://giraffe-tree.github.io/awesome-interaction/#chainable-canvas-photo-filters) | [CamanJS](https://github.com/meltingice/CamanJS) | 3,571 | 1 | 经典旧版 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#chainable-canvas-photo-filters) |
| [GPU 图像滤镜画布](https://giraffe-tree.github.io/awesome-interaction/#gpu-image-filter-canvas) | [glfx.js](https://github.com/evanw/glfx.js) | 3,449 | 1 | 经典旧版 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#gpu-image-filter-canvas) |
| [拖拽上传图片预览转场](https://giraffe-tree.github.io/awesome-interaction/#drop-upload-image-preview-transition) | [FilePond](https://github.com/pqina/filepond) | 16,382 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#drop-upload-image-preview-transition) |
| [完整图像编辑画布工作区](https://giraffe-tree.github.io/awesome-interaction/#full-image-editing-canvas-workspace) | [TUI Image Editor](https://github.com/nhn/tui.image-editor) | 7,660 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#full-image-editing-canvas-workspace) |
| [响应式自定义媒体控制条](https://giraffe-tree.github.io/awesome-interaction/#responsive-custom-media-controls) | [Media Chrome](https://github.com/muxinc/media-chrome) | 2,710 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#responsive-custom-media-controls) |
| [可擦洗音频波形](https://giraffe-tree.github.io/awesome-interaction/#scrubbable-audio-waveform) | [WaveSurfer.js](https://github.com/katspaugh/wavesurfer.js) | 10,340 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#scrubbable-audio-waveform) |
| [可拖拽缩放音频循环区](https://giraffe-tree.github.io/awesome-interaction/#drag-resizable-audio-loop-region) | [WaveSurfer.js](https://github.com/katspaugh/wavesurfer.js) | 10,340 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#drag-resizable-audio-loop-region) |
| [拖拽环视 360 全景](https://giraffe-tree.github.io/awesome-interaction/#drag-to-look-360-panorama) | [Photo Sphere Viewer](https://github.com/mistic100/Photo-Sphere-Viewer) | 2,328 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#drag-to-look-360-panorama) |
| [直接操作图像标注](https://giraffe-tree.github.io/awesome-interaction/#direct-manipulation-image-annotation) | [Annotorious](https://github.com/annotorious/annotorious) | 850 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#direct-manipulation-image-annotation) |
| [行内摄像头拍摄预览](https://giraffe-tree.github.io/awesome-interaction/#inline-webcam-capture-preview) | [Uppy](https://github.com/transloadit/uppy) | 30,876 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#inline-webcam-capture-preview) |
| [实时人像背景虚化](https://giraffe-tree.github.io/awesome-interaction/#real-time-portrait-background-blur) | [TensorFlow.js Models](https://github.com/tensorflow/tfjs-models) | 14,786 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#real-time-portrait-background-blur) |
| [实时手部关键点相机叠加](https://giraffe-tree.github.io/awesome-interaction/#live-hand-landmark-camera-overlay) | [MediaPipe](https://github.com/google-ai-edge/mediapipe) | 36,124 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#live-hand-landmark-camera-overlay) |
| [逐帧 GIF 擦洗器](https://giraffe-tree.github.io/awesome-interaction/#frame-by-frame-gif-scrubber) | [gifuct-js](https://github.com/matt-way/gifuct-js) | 514 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#frame-by-frame-gif-scrubber) |
| [BlurHash 到照片渐进揭示](https://giraffe-tree.github.io/awesome-interaction/#blurhash-to-photo-progressive-reveal) | [BlurHash](https://github.com/woltapp/blurhash) | 17,040 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#blurhash-to-photo-progressive-reveal) |
| [图像取色环境色转场](https://giraffe-tree.github.io/awesome-interaction/#image-palette-ambient-color-transition) | [Color Thief](https://github.com/lokesh/color-thief) | 13,600 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#image-palette-ambient-color-transition) |
| [深度图分层模糊溶解](https://giraffe-tree.github.io/awesome-interaction/#depth-map-ordered-blur-dissolve) | [three.js](https://github.com/mrdoob/three.js) | 113,755 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#depth-map-ordered-blur-dissolve) |
| [设备轮廓蒙版视频](https://giraffe-tree.github.io/awesome-interaction/#device-silhouette-masked-video) | [Awesome Web Effects](https://github.com/giraffe-tree/awesome-web-effects) | 0 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#device-silhouette-masked-video) |
| [按片段时长分层接力的首屏影片](https://giraffe-tree.github.io/awesome-interaction/#duration-aware-layered-hero-film-handoff) | [Awesome Web Effects](https://github.com/giraffe-tree/awesome-web-effects) | 0 | 1 | 当前推荐 | [代码 + 提示词](https://giraffe-tree.github.io/awesome-interaction/#duration-aware-layered-hero-film-handoff) |

## Demo

Demo 只使用静态 HTML、CSS、JavaScript 模块和 GIF，无第三方运行依赖。它支持效果搜索、分类筛选、效果优先排序、中英文切换、稳定效果锚点、移动端可见预览、展开来源详情、代码复制和 Agent 提示词一键复制。

```bash
python3 -m http.server 4173 --directory demo
```

打开 [http://localhost:4173](http://localhost:4173)。目录使用 ES Module，因此需要本地 HTTP 服务，不能直接双击文件运行。

## GIF 压缩

生成缺失的编辑预览，再规范化导入的来源 GIF：

```bash
node scripts/generate-gif-previews.mjs
node scripts/normalize-gif-previews.mjs
```

两个脚本使用确定性渲染或有边界的 FFmpeg 压缩；验证器会检查内容哈希唯一性、尺寸、时长、帧数、可解码性和单文件大小预算。

## GitHub Pages

Demo 完全静态且只使用相对路径。仓库内工作流会在推送到 `main` 后发布 `demo/`，也支持手动运行。首次部署前需要在 **Settings → Pages → Source** 选择 **GitHub Actions**。详见 [中文部署说明](docs/GITHUB_PAGES.zh-CN.md)。

预计地址：[https://giraffe-tree.github.io/awesome-interaction/](https://giraffe-tree.github.io/awesome-interaction/)

## 维护目录

- 核心目录修改 `demo/data/effects.js`，独立调研的扩展记录修改 `demo/data/additional-effects.js`。
- `effect.id` 必须语义化且保持稳定，禁止从仓库名派生。
- 同一项目可被多个效果复用；替代实现加入效果的 `sources` 数组。
- 代码与预览必须放在来源关系上，不能放到项目或效果根节点。
- 运行 `node scripts/build-docs.mjs` 同步生成两份 README。
- 提交前运行 `node scripts/validate.mjs`。

GIF 与项目名称仅用于研究、索引和比较，权利归各自作者所有。
