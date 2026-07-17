# Demo 艺术创作准入评分体系与全量审计

审计日期：2026-07-17（Asia/Shanghai）  
评分体系版本：`2026-07-17`

## 结论

- 用户来这里不是为了浏览“流行前端库”，而是因为脑中已有创作意图，却不知道怎样准确描述某种视觉或交互效果。
- 因此，网站的最小发布单元必须是**一眼可辨、可以命名、足以启发创作、并有真实视觉证据的 Demo**。仓库 Stars、框架知名度和分类完整度都不能替代视觉质量。
- 本轮共审计 **242** 个既有候选：**28** 个具有真实预览并完成六维人工评分，**214** 个因缺少真实预览而发布准入分记为 0。
- 最终 **15 个入选**，**227 个从网站发布目录移除**。当前发布集的每个条目均有真实 GIF、明确评分和可追溯来源。

> “0 分”表示发布准入分为 0，不代表这个创意永远没有潜力。它表示当前没有足够视觉证据去诚实评价艺术感、动效质感和第一眼辨识度；补齐真实 Demo 后必须重新从零评审。

## 用户任务与产品边界

典型用户路径是：

1. 用户知道自己想营造的情绪、材质或互动体验，但不知道专业术语。
2. 用户通过真实预览辨认“就是这种感觉”，再获得稳定的中英文效果名。
3. 用户查看分数和分项，理解这个示例为什么值得参考，而不是被项目热度误导。
4. 用户复制最小代码或 Agent Prompt，把效果迁移到自己的创作中。

由此得到三条产品边界：

- 没有真实预览的技术条目不是 Demo，不进入发布目录。
- 只证明“库能运行”的入门场景不等于高质量创作示例。
- 分类可以暂时为空；不能为了目录看起来完整而放宽准入线。

## 100 分评分体系

| 维度 | 分值 | 高分标准 | 低分或拒绝信号 |
| --- | ---: | --- | --- |
| 创意与差异性 | 20 | 有明确视觉概念；与站内其他示例在主体行为上显著不同；不是常见组件换皮 | 通用入门示例、重复效果、只突出框架名 |
| 艺术与视觉完成度 | 20 | 构图、色彩、材质、层级、留白和文字共同服务效果；缩略图仍成立 | 教学占位、控制台感、装饰与主体脱节 |
| 动效与交互编排 | 20 | 节奏、缓动、轨迹、连续性、反馈和循环自然；触发与结果一致 | 只有位移或旋转、闪屏、突跳、循环断裂 |
| 效果辨识与可描述性 | 15 | 不看标题也能辨认核心效果；名称描述视觉结果而非工具 | 必须依赖说明文字；标题只说 React/Vue/WebGL |
| 创作启发与迁移价值 | 15 | 能启发多个创作方向；关键参数和应用场景可被用户复述 | 只适用于单一功能控件；没有可迁移的视觉词汇 |
| 证据与可复现性 | 10 | 真实预览、来源、版本、源码、捕获方式完整；画面与 Demo 一致 | 没有真实预览、来源不明、不能复现、GIF 与实现错配 |

总分为六项直接相加，不允许用 Stars、品牌知名度或“这个分类缺内容”加分。

## 硬门槛

满足以下全部条件才可发布：

1. 有可核验的官方真实素材，或有仓库内可运行 Demo 及其真实录制；否则发布准入分直接为 0。
2. 总分不低于 **80/100**。
3. 艺术与视觉完成度不低于 **14/20**。
4. 动效与交互编排不低于 **14/20**。
5. 效果辨识与可描述性不低于 **11/15**。
6. 证据与可复现性不低于 **8/10**。
7. 与已入选条目主体行为高度重复时，只保留更清晰、更完整、更可迁移的一项。

## 评审与复审流程

1. **证据预检**：先检查预览、源码、来源、版本、捕获配置和缩略图可读性；缺一项即停止发布评审。
2. **四帧与运行态检查**：至少查看起始、发展、峰值、复位四个时刻，并打开运行中的 Demo 核对触发、时序和画面一致性。
3. **独立打分**：逐维记录整数分与一句可证伪的理由；不得先看项目 Stars 再评分。
4. **相邻项对比**：与同分类及相似运动轨迹的条目并排查看，确认没有重复主体行为。
5. **发布门禁**：自动验证真实预览、总分、核心最低分、文件存在性和来源清单；失败即不得进入网站和 README。
6. **变更复审**：主体画面、动效时序、Demo 实现或预览来源任一变化，都必须重新评分；只改压缩率且画面无变化可沿用原分。

建议新条目由制作者先自评，再由至少一名未参与制作的人复核。两者任一给出硬门槛失败，条目都应退回修改，而不是平均后放行。

## 28 个真实预览的逐项评分

| # | Demo | 创意与差异性 (20) | 艺术与视觉完成度 (20) | 动效与交互编排 (20) | 效果辨识与可描述性 (15) | 创作启发与迁移价值 (15) | 证据与可复现性 (10) | 总分 | 结论 | 评语 |
| ---: | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- | --- |
| 1 | `scroll-scrubbed-master-timeline`<br>滚动擦洗主时间线 | 13 | 16 | 17 | 15 | 14 | 10 | **85** | ✅ 入选 | 滚动进度、三段卡片状态与时间线关系清楚，视觉完成度足以作为编排参考。 |
| 2 | `pinned-horizontal-scroll-scene`<br>固定式横向滚动场景 | 18 | 19 | 19 | 15 | 15 | 10 | **96** | ✅ 入选 | 编辑式构图、固定视口与横向叙事形成完整创作语言，动作和空间关系一眼可辨。 |
| 3 | `shared-layout-spring-morph`<br>共享布局弹簧变形 | 16 | 19 | 19 | 15 | 15 | 10 | **94** | ✅ 入选 | 共享元素在紧凑与展开布局间连续变形，弹簧质感、层级和视觉焦点都很完整。 |
| 4 | `staggered-transform-choreography`<br>交错变换编排 | 16 | 18 | 19 | 15 | 14 | 10 | **92** | ✅ 入选 | 多元素错峰、轨迹和聚散关系明确，能直接转译为“交错编排”创作描述。 |
| 5 | `render-agnostic-value-tween`<br>与渲染器无关的数值补间 | 8 | 14 | 15 | 11 | 11 | 10 | **69** | ❌ 拒绝 | 实现证据完整，但画面更像数值补间测试台，艺术表达和创作启发不足。 |
| 6 | `motion-graphics-burst`<br>动态图形爆发 | 16 | 18 | 19 | 15 | 14 | 10 | **92** | ✅ 入选 | 径向爆发、层次、节奏和循环复位完整，是可直接命名和迁移的动态图形事件。 |
| 7 | `visually-authored-keyframe-sequence`<br>可视化编排关键帧序列 | 13 | 16 | 18 | 13 | 14 | 10 | **84** | ✅ 入选 | 五个关键姿态、路径和时间游标同时可见，既有表现力也能解释关键帧编排。 |
| 8 | `functional-value-pipeline`<br>函数式数值管线 | 13 | 15 | 16 | 12 | 13 | 10 | **79** | ❌ 拒绝 | 数值管线的解释性很好，但主体仍偏技术仪表，艺术完成度未达到严格准入线。 |
| 9 | `compact-svg-shape-tween`<br>轻量 SVG 形状补间 | 14 | 18 | 18 | 15 | 14 | 10 | **89** | ✅ 入选 | 星形与心形的拓扑变形干净、连贯、辨识度高，适合作为形状补间的视觉词汇。 |
| 10 | `native-friendly-inertial-scrolling`<br>兼容原生语义的惯性滚动 | 11 | 17 | 14 | 10 | 13 | 8 | **73** | ❌ 拒绝 | 官方画面具有强烈品牌艺术指导，但短预览难以清楚传达惯性滚动本身。 |
| 11 | `step-based-scrollytelling`<br>分步滚动叙事 | 10 | 10 | 13 | 12 | 11 | 8 | **64** | ❌ 拒绝 | 滚动步骤关系可见，但示例构图接近教学占位，缺少足够艺术完成度。 |
| 12 | `filterable-grid-reflow`<br>可筛选网格重排 | 12 | 17 | 17 | 15 | 14 | 10 | **85** | ✅ 入选 | 筛选、排序、补位和卡片层级在同一画面中清楚发生，编排完整且可复用。 |
| 13 | `anchored-popover-flip-and-shift`<br>锚点浮层翻转与位移 | 7 | 14 | 15 | 15 | 11 | 10 | **72** | ❌ 拒绝 | 浮层避碰行为表达准确，但属于功能验证界面，创意性和艺术表达不足。 |
| 14 | `perspective-tilt-and-glare`<br>透视倾斜与高光 | 14 | 18 | 18 | 15 | 15 | 10 | **90** | ✅ 入选 | 透视、景深与移动高光共同形成清楚的材质感，完成度和迁移价值都很高。 |
| 15 | `context-aware-custom-cursor`<br>情境感知自定义光标 | 17 | 17 | 17 | 13 | 14 | 8 | **86** | ✅ 入选 | 光标随内容语境切换媒体和文字角色，具备鲜明的互动叙事和品牌启发价值。 |
| 16 | `displacement-map-image-hover`<br>位移贴图图像悬停 | 18 | 18 | 18 | 14 | 14 | 8 | **90** | ✅ 入选 | 图像通过位移纹理发生具有材质感的变形过渡，视觉签名鲜明且具有艺术张力。 |
| 17 | `svg-stroke-drawing`<br>SVG 描边绘制 | 13 | 16 | 18 | 15 | 14 | 10 | **86** | ✅ 入选 | 路径逐笔显现并完成纸飞机图形，动作含义、时序和缩略图辨识度都可靠。 |
| 18 | `after-effects-vector-playback`<br>After Effects 矢量播放 | 9 | 12 | 13 | 13 | 12 | 8 | **67** | ❌ 拒绝 | 矢量播放真实可见，但示例是通用图标集合，缺少独立艺术概念和视觉叙事。 |
| 19 | `sketch-style-creative-coding-loop`<br>草图式创意编程循环 | 17 | 18 | 17 | 14 | 15 | 10 | **91** | ✅ 入选 | 多层波形、粒子与色彩构成稳定的生成艺术循环，既有风格也便于继续创作。 |
| 20 | `declarative-react-3d-scene`<br>声明式 React 3D 场景 | 7 | 11 | 10 | 7 | 9 | 8 | **52** | ❌ 拒绝 | 旋转方块能证明渲染能力，但它是框架入门示例，不是独特、可描述的艺术效果。 |
| 21 | `functional-webgl-draw-commands`<br>GPU 实例化粒子涡旋 | 19 | 19 | 19 | 14 | 15 | 10 | **96** | ✅ 入选 | 实例化粒子形成持续演化的涡旋流场，空间、节奏与色彩均达到完整生成艺术水准。 |
| 22 | `dom-synced-shader-planes`<br>DOM 绑定虹彩着色器平面 | 18 | 19 | 18 | 14 | 15 | 10 | **94** | ✅ 入选 | DOM 边界内的虹彩着色器形变具有清晰材质签名，技术机制与视觉结果高度一致。 |
| 23 | `accessible-interactive-3d-product-view`<br>无障碍交互式 3D 商品查看 | 9 | 14 | 15 | 15 | 13 | 10 | **76** | ❌ 拒绝 | 三维查看行为清晰且实现可靠，但更接近标准商品查看器，创意和艺术差异不足。 |
| 24 | `declarative-html-3d-scene`<br>声明式 HTML 3D 场景 | 10 | 16 | 14 | 9 | 12 | 10 | **71** | ❌ 拒绝 | 霓虹空间构图完整，但“声明式 HTML 3D”描述的是实现方式，视觉效果本身不够独特。 |
| 25 | `vue-declarative-three-js`<br>Vue 声明式 Three.js | 11 | 18 | 16 | 8 | 12 | 10 | **75** | ❌ 拒绝 | 结形雕塑有较好视觉质感，但条目仍以框架而非独特效果命名，与同类 3D 场景区分不足。 |
| 26 | `svelte-declarative-three-js`<br>Svelte 声明式 Three.js | 10 | 17 | 15 | 8 | 12 | 10 | **72** | ❌ 拒绝 | 低多边形行星画面美观，但核心是框架演示，作为独立特效的概念辨识度不足。 |
| 27 | `configurable-reactive-particle-field`<br>可配置响应式粒子场 | 10 | 13 | 14 | 13 | 11 | 8 | **69** | ❌ 拒绝 | 粒子响应清楚但形态常见，官方控制面板也削弱了艺术画面的完整性。 |
| 28 | `drag-to-reveal-image-comparison`<br>拖拽揭示图像对比 | 10 | 12 | 14 | 15 | 12 | 8 | **71** | ❌ 拒绝 | 拖拽前后对比非常清楚，但属于常规功能控件，创意和艺术性未达到策展门槛。 |

## 最终入选的 15 个 Demo

| # | 效果 | ID | 推荐实现 | 评分 |
| ---: | --- | --- | --- | ---: |
| 1 | [滚动擦洗主时间线](../demo/index.html#scroll-scrubbed-master-timeline) | `scroll-scrubbed-master-timeline` | GSAP | **85/100** |
| 2 | [固定式横向滚动场景](../demo/index.html#pinned-horizontal-scroll-scene) | `pinned-horizontal-scroll-scene` | GSAP | **96/100** |
| 3 | [共享布局弹簧变形](../demo/index.html#shared-layout-spring-morph) | `shared-layout-spring-morph` | Motion | **94/100** |
| 4 | [交错变换编排](../demo/index.html#staggered-transform-choreography) | `staggered-transform-choreography` | Anime.js | **92/100** |
| 5 | [动态图形爆发](../demo/index.html#motion-graphics-burst) | `motion-graphics-burst` | Mo.js | **92/100** |
| 6 | [可视化编排关键帧序列](../demo/index.html#visually-authored-keyframe-sequence) | `visually-authored-keyframe-sequence` | Theatre.js | **84/100** |
| 7 | [轻量 SVG 形状补间](../demo/index.html#compact-svg-shape-tween) | `compact-svg-shape-tween` | KUTE.js | **89/100** |
| 8 | [可筛选网格重排](../demo/index.html#filterable-grid-reflow) | `filterable-grid-reflow` | Isotope | **85/100** |
| 9 | [透视倾斜与高光](../demo/index.html#perspective-tilt-and-glare) | `perspective-tilt-and-glare` | vanilla-tilt.js | **90/100** |
| 10 | [情境感知自定义光标](../demo/index.html#context-aware-custom-cursor) | `context-aware-custom-cursor` | mouse-follower | **86/100** |
| 11 | [位移贴图图像悬停](../demo/index.html#displacement-map-image-hover) | `displacement-map-image-hover` | hover-effect | **90/100** |
| 12 | [SVG 描边绘制](../demo/index.html#svg-stroke-drawing) | `svg-stroke-drawing` | Vivus | **86/100** |
| 13 | [草图式创意编程循环](../demo/index.html#sketch-style-creative-coding-loop) | `sketch-style-creative-coding-loop` | p5.js | **91/100** |
| 14 | [GPU 实例化粒子涡旋](../demo/index.html#functional-webgl-draw-commands) | `functional-webgl-draw-commands` | regl | **96/100** |
| 15 | [DOM 绑定虹彩着色器平面](../demo/index.html#dom-synced-shader-planes) | `dom-synced-shader-planes` | Curtains.js | **94/100** |

## 缺少真实预览的 214 个候选

这些候选原先只有名称、来源和代码片段，无法完成艺术与动效验收。它们的发布准入分统一为 **0/100**，全部拒绝；不以推测分数伪装成视觉评审。

| # | ID | 名称 | 分类 | 来源 | 发布准入分 | 结论 |
| ---: | --- | --- | --- | --- | ---: | --- |
| 1 | `hook-driven-spring-motion` | Hook 驱动弹簧动画 | 动画与编排 | React Spring | **0** | ❌ 缺少可核验真实预览 |
| 2 | `vue-directive-motion-state` | Vue 指令式动效状态 | 动画与编排 | VueUse Motion | **0** | ❌ 缺少可核验真实预览 |
| 3 | `css-class-entrance-animation` | CSS 类进入动画 | 动画与编排 | Animate.css | **0** | ❌ 缺少可核验真实预览 |
| 4 | `interactive-vector-state-machine` | 交互式矢量状态机 | 动画与编排 | Rive Web | **0** | ❌ 缺少可核验真实预览 |
| 5 | `data-attribute-viewport-reveal` | 数据属性视口揭示 | 滚动与揭示 | AOS | **0** | ❌ 缺少可核验真实预览 |
| 6 | `data-driven-scroll-transforms` | 数据驱动滚动变换 | 滚动与揭示 | Locomotive Scroll | **0** | ❌ 缺少可核验真实预览 |
| 7 | `inertial-custom-scroll-container` | 惯性自定义滚动容器 | 滚动与揭示 | Smooth Scrollbar | **0** | ❌ 缺少可核验真实预览 |
| 8 | `dom-to-3d-scroll-synchronization` | DOM 与 3D 滚动同步 | 滚动与揭示 | r3f-scroll-rig | **0** | ❌ 缺少可核验真实预览 |
| 9 | `conditional-focus-to-target-scroll` | 按需聚焦目标滚动 | 滚动与揭示 | scroll-into-view-if-needed | **0** | ❌ 缺少可核验真实预览 |
| 10 | `styled-native-scrollbar-surface` | 保留原生滚动的样式化滚动条 | 滚动与揭示 | SimpleBar | **0** | ❌ 缺少可核验真实预览 |
| 11 | `windowed-million-row-scrolling` | 窗口化百万行滚动 | 滚动与揭示 | TanStack Virtual | **0** | ❌ 缺少可核验真实预览 |
| 12 | `append-at-threshold-continuous-feed` | 到达阈值追加连续信息流 | 滚动与揭示 | Infinite Scroll | **0** | ❌ 缺少可核验真实预览 |
| 13 | `full-screen-section-snapping` | 全屏分区吸附 | 滚动与揭示 | fullPage.js | **0** | ❌ 缺少可核验真实预览 |
| 14 | `counter-moving-split-screen-panels` | 反向移动分屏面板 | 滚动与揭示 | multiScroll.js | **0** | ❌ 缺少可核验真实预览 |
| 15 | `progressively-enhanced-page-swap` | 渐进增强页面替换 | 页面与布局 | Swup | **0** | ❌ 缺少可核验真实预览 |
| 16 | `one-call-dom-reflow-animation` | 一行调用 DOM 重排动画 | 页面与布局 | AutoAnimate | **0** | ❌ 缺少可核验真实预览 |
| 17 | `flip-shared-element-transition` | FLIP 共享元素转场 | 页面与布局 | React Flip Toolkit | **0** | ❌ 缺少可核验真实预览 |
| 18 | `draggable-packed-grid` | 可拖拽紧密网格 | 页面与布局 | Muuri | **0** | ❌ 缺少可核验真实预览 |
| 19 | `column-based-masonry-layout` | 列式瀑布流布局 | 页面与布局 | Masonry | **0** | ❌ 缺少可核验真实预览 |
| 20 | `gap-filling-bin-pack-layout` | 填补空隙的装箱布局 | 页面与布局 | Packery | **0** | ❌ 缺少可核验真实预览 |
| 21 | `component-enter-exit-state-machine` | 组件进出状态机 | 页面与布局 | React Transition Group | **0** | ❌ 缺少可核验真实预览 |
| 22 | `velocity-aware-swipe-drawer` | 速度感知滑动抽屉 | 页面与布局 | Vaul | **0** | ❌ 缺少可核验真实预览 |
| 23 | `drag-resize-dashboard-collision-reflow` | 拖拽缩放仪表盘碰撞重排 | 页面与布局 | GridStack | **0** | ❌ 缺少可核验真实预览 |
| 24 | `draggable-split-pane-resize` | 可拖拽分栏尺寸调整 | 页面与布局 | Split.js | **0** | ❌ 缺少可核验真实预览 |
| 25 | `native-cross-route-shared-element-morph` | 原生跨路由共享元素变形 | 页面与布局 | next-view-transitions | **0** | ❌ 缺少可核验真实预览 |
| 26 | `momentum-touch-carousel` | 惯性触摸轮播 | 导航与浮层 | Swiper | **0** | ❌ 缺少可核验真实预览 |
| 27 | `thumbnail-to-lightbox-zoom` | 缩略图到灯箱缩放 | 导航与浮层 | PhotoSwipe | **0** | ❌ 缺少可核验真实预览 |
| 28 | `nested-off-canvas-navigation-panels` | 嵌套式画布外导航面板 | 导航与浮层 | mmenu.js | **0** | ❌ 缺少可核验真实预览 |
| 29 | `spotlight-tour-with-focus-handoff` | 焦点交接式聚光导览 | 导航与浮层 | Driver.js | **0** | ❌ 缺少可核验真实预览 |
| 30 | `animated-accessible-modal-alert` | 动画无障碍模态提示 | 导航与浮层 | SweetAlert2 | **0** | ❌ 缺少可核验真实预览 |
| 31 | `filtered-command-palette-overlay` | 筛选式命令面板浮层 | 导航与浮层 | cmdk | **0** | ❌ 缺少可核验真实预览 |
| 32 | `stacking-dismissible-toast-queue` | 堆叠可关闭通知队列 | 导航与浮层 | react-hot-toast | **0** | ❌ 缺少可核验真实预览 |
| 33 | `nested-menu-and-submenu-transition` | 嵌套菜单与子菜单转场 | 导航与浮层 | React Menu | **0** | ❌ 缺少可核验真实预览 |
| 34 | `drag-overlay-and-drop-preview` | 拖拽浮层与落点预览 | 导航与浮层 | dnd kit | **0** | ❌ 缺少可核验真实预览 |
| 35 | `bound-spring-drag-and-pinch` | 带边界的弹簧拖拽与捏合 | 导航与浮层 | use-gesture | **0** | ❌ 缺少可核验真实预览 |
| 36 | `spatial-slide-deck-navigation` | 空间化演示文稿导航 | 导航与浮层 | reveal.js | **0** | ❌ 缺少可核验真实预览 |
| 37 | `pointer-driven-layer-depth` | 指针驱动图层景深 | 指针与悬停 | Parallax.js | **0** | ❌ 缺少可核验真实预览 |
| 38 | `reusable-css-hover-vocabulary` | 可复用 CSS 悬停词汇 | 指针与悬停 | Hover.css | **0** | ❌ 缺少可核验真实预览 |
| 39 | `trailing-cursor-particles` | 尾随光标粒子 | 指针与悬停 | cursor-effects | **0** | ❌ 缺少可核验真实预览 |
| 40 | `depth-map-portrait-parallax` | 深度图人像视差 | 指针与悬停 | fake3d | **0** | ❌ 缺少可核验真实预览 |
| 41 | `pointer-attracted-button-motion` | 指针吸引按钮运动 | 指针与悬停 | Magnetic Buttons | **0** | ❌ 缺少可核验真实预览 |
| 42 | `approach-direction-overlay-entrance` | 按接近方向进入的遮罩 | 指针与悬停 | Direction-Aware Hover | **0** | ❌ 缺少可核验真实预览 |
| 43 | `svg-filter-gooey-text-hover` | SVG 滤镜黏液文字悬停 | 指针与悬停 | Gooey Text Hover | **0** | ❌ 缺少可核验真实预览 |
| 44 | `hotspot-revealed-image-regions` | 热点揭示图像区域 | 指针与悬停 | Interactive Points | **0** | ❌ 缺少可核验真实预览 |
| 45 | `expanding-colored-card-stack` | 展开式彩色卡片堆栈 | 指针与悬停 | Stack Motion Hover | **0** | ❌ 缺少可核验真实预览 |
| 46 | `looping-typewriter-sequence` | 循环打字序列 | 文本与 SVG | Typed.js | **0** | ❌ 缺少可核验真实预览 |
| 47 | `text-to-character-css-variables` | 文本拆字符 CSS 变量 | 文本与 SVG | Splitting | **0** | ❌ 缺少可核验真实预览 |
| 48 | `shader-processed-typography` | 着色器处理字体 | 文本与 SVG | Blotter | **0** | ❌ 缺少可核验真实预览 |
| 49 | `randomized-decode-text-reveal` | 随机解码文本揭示 | 文本与 SVG | use-scramble | **0** | ❌ 缺少可核验真实预览 |
| 50 | `fluent-svg-scene-animation` | 流式 SVG 场景动画 | 文本与 SVG | SVG.js | **0** | ❌ 缺少可核验真实预览 |
| 51 | `hand-drawn-vector-rendering` | 手绘感矢量渲染 | 文本与 SVG | Rough.js | **0** | ❌ 缺少可核验真实预览 |
| 52 | `handwritten-path-lettering` | 手写路径字形 | 文本与 SVG | Vara | **0** | ❌ 缺少可核验真实预览 |
| 53 | `character-diff-text-transition` | 字符差异文本转场 | 文本与 SVG | smart-ticker | **0** | ❌ 缺少可核验真实预览 |
| 54 | `mechanical-split-flap-character-change` | 机械翻牌字符变化 | 文本与 SVG | Flip | **0** | ❌ 缺少可核验真实预览 |
| 55 | `topology-safe-svg-shape-morph` | 拓扑安全 SVG 形状变形 | 文本与 SVG | Flubber | **0** | ❌ 缺少可核验真实预览 |
| 56 | `gpu-accelerated-2d-scene-graph` | GPU 加速 2D 场景图 | Canvas 与 2D | PixiJS | **0** | ❌ 缺少可核验真实预览 |
| 57 | `vector-geometry-on-canvas` | Canvas 上的矢量几何 | Canvas 与 2D | Paper.js | **0** | ❌ 缺少可核验真实预览 |
| 58 | `interactive-object-canvas` | 交互式对象画布 | Canvas 与 2D | Fabric.js | **0** | ❌ 缺少可核验真实预览 |
| 59 | `layered-draggable-canvas-nodes` | 分层可拖拽 Canvas 节点 | Canvas 与 2D | Konva | **0** | ❌ 缺少可核验真实预览 |
| 60 | `renderer-agnostic-2d-primitives` | 跨渲染器 2D 图元 | Canvas 与 2D | Two.js | **0** | ❌ 缺少可核验真实预览 |
| 61 | `display-list-canvas-animation` | 显示列表 Canvas 动画 | Canvas 与 2D | EaselJS | **0** | ❌ 缺少可核验真实预览 |
| 62 | `browser-game-scene-lifecycle` | 浏览器游戏场景生命周期 | Canvas 与 2D | Phaser | **0** | ❌ 缺少可核验真实预览 |
| 63 | `rigid-body-web-physics` | 网页刚体物理 | Canvas 与 2D | Matter.js | **0** | ❌ 缺少可核验真实预览 |
| 64 | `point-based-generative-geometry` | 基于点的生成式几何 | Canvas 与 2D | Pts | **0** | ❌ 缺少可核验真实预览 |
| 65 | `pseudo-3d-flat-illustration` | 伪 3D 扁平插画 | Canvas 与 2D | Zdog | **0** | ❌ 缺少可核验真实预览 |
| 66 | `infinite-collaborative-drawing-surface` | 无限协作绘图画布 | Canvas 与 2D | tldraw | **0** | ❌ 缺少可核验真实预览 |
| 67 | `general-purpose-webgl-scene-graph` | 通用 WebGL 场景图 | 3D 与 WebGL | three.js | **0** | ❌ 缺少可核验真实预览 |
| 68 | `batteries-included-3d-engine` | 功能齐全 3D 引擎 | 3D 与 WebGL | Babylon.js | **0** | ❌ 缺少可核验真实预览 |
| 69 | `entity-component-3d-runtime` | 实体组件 3D 运行时 | 3D 与 WebGL | PlayCanvas Engine | **0** | ❌ 缺少可核验真实预览 |
| 70 | `minimal-webgl-abstraction` | 极简 WebGL 抽象 | 3D 与 WebGL | OGL | **0** | ❌ 缺少可核验真实预览 |
| 71 | `merged-real-time-bloom-pass` | 合并式实时辉光后期 | 3D 与 WebGL | postprocessing | **0** | ❌ 缺少可核验真实预览 |
| 72 | `pointer-injected-gpu-fluid` | 指针注入 GPU 流体 | 背景与粒子 | WebGL Fluid Simulation | **0** | ❌ 缺少可核验真实预览 |
| 73 | `drop-in-animated-webgl-background` | 即插即用 WebGL 动态背景 | 背景与粒子 | Vanta | **0** | ❌ 缺少可核验真实预览 |
| 74 | `event-triggered-confetti-burst` | 事件触发彩纸爆发 | 背景与粒子 | canvas-confetti | **0** | ❌ 缺少可核验真实预览 |
| 75 | `animated-gradient-state-transitions` | 动态渐变状态转场 | 背景与粒子 | Granim.js | **0** | ❌ 缺少可核验真实预览 |
| 76 | `procedural-low-poly-mesh` | 程序化低多边形网格 | 背景与粒子 | Trianglify | **0** | ❌ 缺少可核验真实预览 |
| 77 | `interactive-fireworks-field` | 交互式烟花场 | 背景与粒子 | Fireworks.js | **0** | ❌ 缺少可核验真实预览 |
| 78 | `procedural-ribbon-trail` | 程序化丝带轨迹 | 背景与粒子 | ribbon.js | **0** | ❌ 缺少可核验真实预览 |
| 79 | `lit-low-poly-surface` | 带光照低多边形曲面 | 背景与粒子 | Flat Surface Shader | **0** | ❌ 缺少可核验真实预览 |
| 80 | `generated-css-grid-pattern-animation` | 生成式 CSS 网格图案动画 | 背景与粒子 | CSS Doodle | **0** | ❌ 缺少可核验真实预览 |
| 81 | `full-page-fragment-shader-backdrop` | 全页片段着色器背景 | 背景与粒子 | shader-web-background | **0** | ❌ 缺少可核验真实预览 |
| 82 | `emergent-attraction-repulsion-swarm` | 涌现式吸引排斥粒子群 | 背景与粒子 | Particle Life | **0** | ❌ 缺少可核验真实预览 |
| 83 | `reusable-glsl-media-transition` | 可复用 GLSL 媒体转场 | 媒体与图像 | GL Transitions | **0** | ❌ 缺少可核验真实预览 |
| 84 | `inline-image-focus-zoom` | 行内图片聚焦缩放 | 媒体与图像 | medium-zoom | **0** | ❌ 缺少可核验真实预览 |
| 85 | `pointer-pan-and-pinch-zoom` | 指针平移与捏合缩放 | 媒体与图像 | Panzoom | **0** | ❌ 缺少可核验真实预览 |
| 86 | `deep-zoom-tiled-imagery` | 深度缩放切片图像 | 媒体与图像 | OpenSeadragon | **0** | ❌ 缺少可核验真实预览 |
| 87 | `interactive-image-crop-transform` | 交互式图像裁剪变换 | 媒体与图像 | Cropper.js | **0** | ❌ 缺少可核验真实预览 |
| 88 | `e-commerce-lens-magnification` | 电商镜头放大 | 媒体与图像 | Drift | **0** | ❌ 缺少可核验真实预览 |
| 89 | `chainable-canvas-photo-filters` | 可链式 Canvas 照片滤镜 | 媒体与图像 | CamanJS | **0** | ❌ 缺少可核验真实预览 |
| 90 | `gpu-image-filter-canvas` | GPU 图像滤镜画布 | 媒体与图像 | glfx.js | **0** | ❌ 缺少可核验真实预览 |
| 91 | `drop-upload-image-preview-transition` | 拖拽上传图片预览转场 | 媒体与图像 | FilePond | **0** | ❌ 缺少可核验真实预览 |
| 92 | `full-image-editing-canvas-workspace` | 完整图像编辑画布工作区 | 媒体与图像 | TUI Image Editor | **0** | ❌ 缺少可核验真实预览 |
| 93 | `responsive-custom-media-controls` | 响应式自定义媒体控制条 | 媒体与图像 | Media Chrome | **0** | ❌ 缺少可核验真实预览 |
| 94 | `elastic-fan-card-entrance` | 弹性扇形卡片入场 | 动画与编排 | React Bits | **0** | ❌ 缺少可核验真实预览 |
| 95 | `noisy-electric-border-trace` | 噪声电流描边 | 动画与编排 | React Bits | **0** | ❌ 缺少可核验真实预览 |
| 96 | `spring-interpolated-count-up` | 弹簧插值数字递增 | 动画与编排 | React Bits | **0** | ❌ 缺少可核验真实预览 |
| 97 | `segmented-rotating-word-slot` | 分段旋转词槽 | 动画与编排 | React Bits | **0** | ❌ 缺少可核验真实预览 |
| 98 | `orbiting-star-perimeter` | 环绕星光边框 | 动画与编排 | React Bits | **0** | ❌ 缺少可核验真实预览 |
| 99 | `rotating-circular-letter-ring` | 旋转环形字母 | 动画与编排 | React Bits | **0** | ❌ 缺少可核验真实预览 |
| 100 | `moving-focus-window-headline` | 移动聚焦框标题 | 动画与编排 | React Bits | **0** | ❌ 缺少可核验真实预览 |
| 101 | `dom-node-connection-beam` | DOM 节点连接光束 | 动画与编排 | Magic UI | **0** | ❌ 缺少可核验真实预览 |
| 102 | `animated-circular-gauge-fill` | 动画环形仪表填充 | 动画与编排 | Magic UI | **0** | ❌ 缺少可核验真实预览 |
| 103 | `chromatic-band-text-sweep` | 彩色光带文字扫过 | 动画与编排 | Magic UI | **0** | ❌ 缺少可核验真实预览 |
| 104 | `sticky-card-stack-accumulation` | 粘性卡片堆叠累积 | 滚动与揭示 | React Bits | **0** | ❌ 缺少可核验真实预览 |
| 105 | `velocity-reactive-marquee` | 滚动速度响应跑马灯 | 滚动与揭示 | React Bits | **0** | ❌ 缺少可核验真实预览 |
| 106 | `scroll-scrubbed-floating-characters` | 滚动擦洗浮动字符 | 滚动与揭示 | React Bits | **0** | ❌ 缺少可核验真实预览 |
| 107 | `scrubbed-word-blur-and-rotate-reveal` | 擦洗式逐词模糊旋转揭示 | 滚动与揭示 | React Bits | **0** | ❌ 缺少可核验真实预览 |
| 108 | `progressive-scroll-edge-blur` | 渐进式滚动边缘模糊 | 滚动与揭示 | React Bits | **0** | ❌ 缺少可核验真实预览 |
| 109 | `fixed-reading-progress-rail` | 固定阅读进度轨 | 滚动与揭示 | Magic UI | **0** | ❌ 缺少可核验真实预览 |
| 110 | `sticky-paragraph-ink-reveal` | 粘性段落逐词着色 | 滚动与揭示 | Magic UI | **0** | ❌ 缺少可核验真实预览 |
| 111 | `viewport-triggered-metric-count` | 进入视口触发指标计数 | 滚动与揭示 | Motion Primitives | **0** | ❌ 缺少可核验真实预览 |
| 112 | `scroll-direction-auto-hiding-header` | 按滚动方向自动隐藏页头 | 滚动与揭示 | Motion | **0** | ❌ 缺少可核验真实预览 |
| 113 | `scroll-controlled-video-scrubbing` | 滚动控制视频擦洗 | 滚动与揭示 | Motion | **0** | ❌ 缺少可核验真实预览 |
| 114 | `perspective-card-deck-swap` | 透视卡组轮换 | 页面与布局 | React Bits | **0** | ❌ 缺少可核验真实预览 |
| 115 | `pixel-grid-content-dissolve` | 像素网格内容溶解 | 页面与布局 | React Bits | **0** | ❌ 缺少可核验真实预览 |
| 116 | `layered-folder-open-close` | 分层文件夹开合 | 页面与布局 | React Bits | **0** | ❌ 缺少可核验真实预览 |
| 117 | `directional-wizard-step-transition` | 方向感知式步骤切换 | 页面与布局 | React Bits | **0** | ❌ 缺少可核验真实预览 |
| 118 | `bubble-to-navigation-morph` | 气泡到导航变形 | 页面与布局 | React Bits | **0** | ❌ 缺少可核验真实预览 |
| 119 | `spring-height-accordion-disclosure` | 弹簧高度手风琴展开 | 页面与布局 | Motion Primitives | **0** | ❌ 缺少可核验真实预览 |
| 120 | `expandable-action-toolbar-reveal` | 可展开操作工具栏揭示 | 页面与布局 | Motion Primitives | **0** | ❌ 缺少可核验真实预览 |
| 121 | `context-switching-dynamic-toolbar` | 上下文切换动态工具栏 | 页面与布局 | Motion Primitives | **0** | ❌ 缺少可核验真实预览 |
| 122 | `adaptive-height-tab-panel-slide` | 自适应高度标签面板滑动 | 页面与布局 | Motion Primitives | **0** | ❌ 缺少可核验真实预览 |
| 123 | `clip-shape-theme-reveal` | 裁剪形状主题揭示 | 页面与布局 | Magic UI | **0** | ❌ 缺少可核验真实预览 |
| 124 | `velocity-tilted-3d-card-carousel` | 速度倾斜 3D 卡片轮播 | 导航与浮层 | React Bits | **0** | ❌ 缺少可核验真实预览 |
| 125 | `bending-webgl-gallery-ribbon` | 弯曲 WebGL 图库丝带 | 导航与浮层 | React Bits | **0** | ❌ 缺少可核验真实预览 |
| 126 | `draggable-dome-gallery` | 可拖拽穹顶图库 | 导航与浮层 | React Bits | **0** | ❌ 缺少可核验真实预览 |
| 127 | `infinite-spherical-menu` | 无限球面菜单 | 导航与浮层 | React Bits | **0** | ❌ 缺少可核验真实预览 |
| 128 | `seamless-logo-loop-marquee` | 无缝 Logo 循环跑马灯 | 导航与浮层 | React Bits | **0** | ❌ 缺少可核验真实预览 |
| 129 | `neighbor-magnifying-navigation-dock` | 邻项放大导航坞 | 导航与浮层 | React Bits | **0** | ❌ 缺少可核验真实预览 |
| 130 | `layered-staggered-full-screen-menu` | 分层交错全屏菜单 | 导航与浮层 | React Bits | **0** | ❌ 缺少可核验真实预览 |
| 131 | `hover-activated-image-marquee-menu` | 悬停激活图像跑马菜单 | 导航与浮层 | React Bits | **0** | ❌ 缺少可核验真实预览 |
| 132 | `keyboard-accessible-radial-context-menu` | 键盘无障碍径向上下文菜单 | 导航与浮层 | Animate UI | **0** | ❌ 缺少可核验真实预览 |
| 133 | `drag-thrown-card-stack` | 拖拽甩出卡片堆 | 导航与浮层 | React Bits | **0** | ❌ 缺少可核验真实预览 |
| 134 | `click-origin-spark-burst` | 点击原点火花爆发 | 指针与悬停 | React Bits | **0** | ❌ 缺少可核验真实预览 |
| 135 | `metaball-blob-cursor` | 融球液滴光标 | 指针与悬停 | React Bits | **0** | ❌ 缺少可核验真实预览 |
| 136 | `blooming-spectral-cursor-trail` | 辉光幽灵光标轨迹 | 指针与悬停 | React Bits | **0** | ❌ 缺少可核验真实预览 |
| 137 | `velocity-spaced-image-trail` | 速度间隔图像尾迹 | 指针与悬停 | React Bits | **0** | ❌ 缺少可核验真实预览 |
| 138 | `gooey-pixel-cursor-wake` | 黏性像素光标尾流 | 指针与悬停 | React Bits | **0** | ❌ 缺少可核验真实预览 |
| 139 | `cursor-localized-card-spotlight` | 光标局部卡片聚光 | 指针与悬停 | React Bits | **0** | ❌ 缺少可核验真实预览 |
| 140 | `snapping-target-reticle-cursor` | 吸附目标准星光标 | 指针与悬停 | React Bits | **0** | ❌ 缺少可核验真实预览 |
| 141 | `floating-word-cursor-trail` | 漂浮文字光标尾迹 | 指针与悬停 | React Bits | **0** | ❌ 缺少可核验真实预览 |
| 142 | `pointer-reactive-cell-grid` | 指针响应单元格网格 | 指针与悬停 | React Bits | **0** | ❌ 缺少可核验真实预览 |
| 143 | `pointer-carved-shader-aperture` | 指针雕刻着色器孔径 | 指针与悬停 | React Bits | **0** | ❌ 缺少可核验真实预览 |
| 144 | `animated-hand-drawn-annotation` | 手绘标注动画 | 文本与 SVG | Rough Notation | **0** | ❌ 缺少可核验真实预览 |
| 145 | `voronoi-nearest-point-hover-focus` | Voronoi 最近点悬停聚焦 | 文本与 SVG | D3 | **0** | ❌ 缺少可核验真实预览 |
| 146 | `linked-brush-to-zoom-chart` | 联动框选缩放图表 | 文本与 SVG | D3 | **0** | ❌ 缺少可核验真实预览 |
| 147 | `draggable-force-directed-svg-network` | 可拖拽力导向 SVG 网络 | 文本与 SVG | D3 | **0** | ❌ 缺少可核验真实预览 |
| 148 | `handle-connected-animated-node-editor` | 手柄连线动画节点编辑器 | 文本与 SVG | React Flow | **0** | ❌ 缺少可核验真实预览 |
| 149 | `click-to-collapse-hierarchy-branches` | 点击折叠层级分支 | 文本与 SVG | D3 | **0** | ❌ 缺少可核验真实预览 |
| 150 | `hover-highlighted-choropleth-map` | 悬停高亮分级设色地图 | 文本与 SVG | D3 | **0** | ❌ 缺少可核验真实预览 |
| 151 | `shimmering-svg-content-skeleton` | 闪烁式 SVG 内容骨架屏 | 文本与 SVG | React Content Loader | **0** | ❌ 缺少可核验真实预览 |
| 152 | `clickable-generated-diagram-callback` | 可点击生成图回调 | 文本与 SVG | Mermaid | **0** | ❌ 缺少可核验真实预览 |
| 153 | `svg-curve-motion-path-follower` | SVG 曲线运动路径跟随 | 文本与 SVG | Motion | **0** | ❌ 缺少可核验真实预览 |
| 154 | `microphone-reactive-spectrum-ring` | 麦克风响应频谱环 | Canvas 与 2D | p5.sound | **0** | ❌ 缺少可核验真实预览 |
| 155 | `velocity-sensitive-signature-ink` | 速度感应签名墨迹 | Canvas 与 2D | Signature Pad | **0** | ❌ 缺少可核验真实预览 |
| 156 | `pressure-shaped-freehand-stroke` | 压力塑形自由笔触 | Canvas 与 2D | perfect-freehand | **0** | ❌ 缺少可核验真实预览 |
| 157 | `hover-expanding-animated-doughnut-chart` | 悬停扩张动画环形图 | Canvas 与 2D | Chart.js | **0** | ❌ 缺少可核验真实预览 |
| 158 | `streaming-line-chart-transition` | 流式折线图过渡 | Canvas 与 2D | Apache ECharts | **0** | ❌ 缺少可核验真实预览 |
| 159 | `synchronized-multi-chart-cursor` | 多图同步游标 | Canvas 与 2D | uPlot | **0** | ❌ 缺少可核验真实预览 |
| 160 | `drag-editable-b-zier-curve-handles` | 可拖拽编辑贝塞尔曲线手柄 | Canvas 与 2D | Paper.js | **0** | ❌ 缺少可核验真实预览 |
| 161 | `pointer-following-displacement-ripple` | 指针跟随置换涟漪 | Canvas 与 2D | PixiJS | **0** | ❌ 缺少可核验真实预览 |
| 162 | `resize-and-rotate-transform-handles` | 缩放旋转变换手柄 | Canvas 与 2D | Konva | **0** | ❌ 缺少可核验真实预览 |
| 163 | `hover-hit-test-color-highlight` | 悬停命中变色高亮 | Canvas 与 2D | LeaferJS | **0** | ❌ 缺少可核验真实预览 |
| 164 | `slider-controlled-exploded-3d-assembly` | 滑杆控制 3D 爆炸装配图 | 3D 与 WebGL | three.js | **0** | ❌ 缺少可核验真实预览 |
| 165 | `collision-reactive-3d-physics-stack` | 碰撞响应式 3D 物理堆栈 | 3D 与 WebGL | React Three Rapier | **0** | ❌ 缺少可核验真实预览 |
| 166 | `refractive-glass-transmission-object` | 折射玻璃透射物体 | 3D 与 WebGL | Drei | **0** | ❌ 缺少可核验真实预览 |
| 167 | `orbitable-gaussian-splat-scene` | 可轨道浏览高斯泼溅场景 | 3D 与 WebGL | GaussianSplats3D | **0** | ❌ 缺少可核验真实预览 |
| 168 | `pointer-rotated-dotted-globe` | 指针旋转点阵地球 | 3D 与 WebGL | COBE | **0** | ❌ 缺少可核验真实预览 |
| 169 | `cinematic-map-camera-fly-to` | 电影式地图相机飞行 | 3D 与 WebGL | MapLibre GL JS | **0** | ❌ 缺少可核验真实预览 |
| 170 | `time-lapse-globe-daylight-sweep` | 延时地球昼夜扫过 | 3D 与 WebGL | CesiumJS | **0** | ❌ 缺少可核验真实预览 |
| 171 | `pickable-extruded-data-columns` | 可拾取挤出数据柱 | 3D 与 WebGL | deck.gl | **0** | ❌ 缺少可核验真实预览 |
| 172 | `curved-3d-text-orbit` | 弯曲三维文字环绕 | 3D 与 WebGL | Troika | **0** | ❌ 缺少可核验真实预览 |
| 173 | `cursor-projected-3d-surface-marker` | 光标投射三维表面标记 | 3D 与 WebGL | three.js | **0** | ❌ 缺少可核验真实预览 |
| 174 | `layered-aurora-ribbon-background` | 分层极光丝带背景 | 背景与粒子 | React Bits | **0** | ❌ 缺少可核验真实预览 |
| 175 | `mouse-repelling-spiral-galaxy` | 鼠标排斥旋涡星系 | 背景与粒子 | React Bits | **0** | ❌ 缺少可核验真实预览 |
| 176 | `procedural-lightning-bolt-background` | 程序化闪电背景 | 背景与粒子 | React Bits | **0** | ❌ 缺少可核验真实预览 |
| 177 | `pointer-disturbed-dither-waves` | 指针扰动抖动波纹 | 背景与粒子 | React Bits | **0** | ❌ 缺少可核验真实预览 |
| 178 | `flowing-silk-shader-background` | 流动丝绸着色器背景 | 背景与粒子 | React Bits | **0** | ❌ 缺少可核验真实预览 |
| 179 | `cursor-reactive-filament-threads` | 光标响应纤维线场 | 背景与粒子 | React Bits | **0** | ❌ 缺少可核验真实预览 |
| 180 | `smooth-matrix-letter-glitch-field` | 平滑矩阵字符故障场 | 背景与粒子 | React Bits | **0** | ❌ 缺少可核验真实预览 |
| 181 | `interactive-hyperspeed-highway` | 交互式超高速公路 | 背景与粒子 | React Bits | **0** | ❌ 缺少可核验真实预览 |
| 182 | `pointer-warped-balatro-plasma` | 指针扭曲 Balatro 等离子 | 背景与粒子 | React Bits | **0** | ❌ 缺少可核验真实预览 |
| 183 | `crt-faulty-terminal-pixel-field` | CRT 故障终端像素场 | 背景与粒子 | React Bits | **0** | ❌ 缺少可核验真实预览 |
| 184 | `scrubbable-audio-waveform` | 可擦洗音频波形 | 媒体与图像 | WaveSurfer.js | **0** | ❌ 缺少可核验真实预览 |
| 185 | `drag-resizable-audio-loop-region` | 可拖拽缩放音频循环区 | 媒体与图像 | WaveSurfer.js | **0** | ❌ 缺少可核验真实预览 |
| 186 | `drag-to-look-360-panorama` | 拖拽环视 360 全景 | 媒体与图像 | Photo Sphere Viewer | **0** | ❌ 缺少可核验真实预览 |
| 187 | `direct-manipulation-image-annotation` | 直接操作图像标注 | 媒体与图像 | Annotorious | **0** | ❌ 缺少可核验真实预览 |
| 188 | `inline-webcam-capture-preview` | 行内摄像头拍摄预览 | 媒体与图像 | Uppy | **0** | ❌ 缺少可核验真实预览 |
| 189 | `real-time-portrait-background-blur` | 实时人像背景虚化 | 媒体与图像 | TensorFlow.js Models | **0** | ❌ 缺少可核验真实预览 |
| 190 | `live-hand-landmark-camera-overlay` | 实时手部关键点相机叠加 | 媒体与图像 | MediaPipe | **0** | ❌ 缺少可核验真实预览 |
| 191 | `frame-by-frame-gif-scrubber` | 逐帧 GIF 擦洗器 | 媒体与图像 | gifuct-js | **0** | ❌ 缺少可核验真实预览 |
| 192 | `blurhash-to-photo-progressive-reveal` | BlurHash 到照片渐进揭示 | 媒体与图像 | BlurHash | **0** | ❌ 缺少可核验真实预览 |
| 193 | `image-palette-ambient-color-transition` | 图像取色环境色转场 | 媒体与图像 | Color Thief | **0** | ❌ 缺少可核验真实预览 |
| 194 | `depth-map-ordered-blur-dissolve` | 深度图分层模糊溶解 | 媒体与图像 | three.js | **0** | ❌ 缺少可核验真实预览 |
| 195 | `scroll-linked-multilayer-starfield-drift` | 滚动联动多层星野漂移 | 背景与粒子 | GSAP | **0** | ❌ 缺少可核验真实预览 |
| 196 | `infinite-curved-text-path-conveyor` | 无限曲线路径文字传送带 | 文本与 SVG | GSAP | **0** | ❌ 缺少可核验真实预览 |
| 197 | `scroll-scrubbed-document-generation-playback` | 滚动擦洗文档生成回放 | 滚动与揭示 | GSAP | **0** | ❌ 缺少可核验真实预览 |
| 198 | `type-select-replace-prompt-loop` | 输入选中替换提示词循环 | 文本与 SVG | Motion | **0** | ❌ 缺少可核验真实预览 |
| 199 | `device-silhouette-masked-video` | 设备轮廓蒙版视频 | 媒体与图像 | Awesome Web Effects | **0** | ❌ 缺少可核验真实预览 |
| 200 | `blend-mode-self-inverting-fixed-navigation` | 混合模式自反色固定导航 | 页面与布局 | Awesome Web Effects | **0** | ❌ 缺少可核验真实预览 |
| 201 | `delayed-dropdown-promo-sweep` | 延迟触发的下拉菜单推广光扫 | 页面与布局 | Awesome Web Effects | **0** | ❌ 缺少可核验真实预览 |
| 202 | `four-corner-hover-crop-marks` | 四角裁切标记悬停显现 | 指针与悬停 | Awesome Web Effects | **0** | ❌ 缺少可核验真实预览 |
| 203 | `duration-aware-layered-hero-film-handoff` | 按片段时长分层接力的首屏影片 | 媒体与图像 | Awesome Web Effects | **0** | ❌ 缺少可核验真实预览 |
| 204 | `blurred-autoplay-video-ambience` | 模糊自播视频氛围层 | 背景与粒子 | Awesome Web Effects | **0** | ❌ 缺少可核验真实预览 |
| 205 | `hysteretic-scroll-threshold-header-restyle` | 带滞回的滚动阈值页头改色 | 滚动与揭示 | Awesome Web Effects | **0** | ❌ 缺少可核验真实预览 |
| 206 | `card-metadata-to-cta-role-swap` | 卡片元数据到 CTA 角色互换 | 指针与悬停 | Awesome Web Effects | **0** | ❌ 缺少可核验真实预览 |
| 207 | `opposed-diagonal-offset-cta` | 反向对冲斜移 CTA | 指针与悬停 | Awesome Web Effects | **0** | ❌ 缺少可核验真实预览 |
| 208 | `staggered-multi-chart-telemetry-boot` | 交错多图表遥测启动 | Canvas 与 2D | Awesome Web Effects | **0** | ❌ 缺少可核验真实预览 |
| 209 | `drag-spawned-dom-aware-fish-flock` | 拖拽生成且避让 DOM 的鱼群 | Canvas 与 2D | Awesome Web Effects | **0** | ❌ 缺少可核验真实预览 |
| 210 | `interaction-history-hiring-badge` | 交互历史驱动招聘徽章 | 指针与悬停 | Awesome Web Effects | **0** | ❌ 缺少可核验真实预览 |
| 211 | `traveling-dot-headline-eraser-writer` | 旅行圆点擦写标题 | 文本与 SVG | Awesome Web Effects | **0** | ❌ 缺少可核验真实预览 |
| 212 | `synchronized-scenario-scene-handoff` | 场景同步换幕 | 页面与布局 | Awesome Web Effects | **0** | ❌ 缺少可核验真实预览 |
| 213 | `hover-rehearsed-video-style-rail` | 悬停预演视频风格轨 | 媒体与图像 | Awesome Web Effects | **0** | ❌ 缺少可核验真实预览 |
| 214 | `autonomous-agent-cursor-constellation` | 自主 Agent 光标星座 | 动画与编排 | Awesome Web Effects | **0** | ❌ 缺少可核验真实预览 |

## 删除与可追溯性

- 被拒绝条目不再导出到网站目录，也不再生成到 README 效果表。
- 被拒绝且曾有本地 Demo/GIF 的条目，其发布 Demo、捕获 GIF、manifest 与 provenance 记录一并删除，避免成为可直接访问的“幽灵示例”。
- 本文保留全部候选的 ID、名称、评分或 0 分原因，作为审计证据；保留审计记录不等于继续收录。
- 未来重新提交被拒条目时，必须提供新的真实预览并使用当时最新评分版本完整复审，不能继承本次分数。

数据来源：`demo/data/demo-admission.js`、审计前的 242 个目录候选及真实预览逐帧检查。发布状态以 `demo/data/effects.js` 的当前导出为准。
