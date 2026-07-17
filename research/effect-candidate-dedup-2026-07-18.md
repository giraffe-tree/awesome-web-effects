# 73 个扩展候选跨池去重与制作批次审计

审计日期：2026-07-18
输入池：`agent-ai-native-candidates-2026-07-18.md` 的 35 项 + `agent-github-candidates-2026-07-18.md` 的 38 项
发布基线：`demo/data/effects.js` 中已通过准入的 15 项
本报告性质：制作前审计；只决定是否进入当前 Demo 制作批次，不授予发布分。

## 先说结论

本次研究覆盖 **100 个 AI Native 官网**和 **34 个官方 GitHub 仓库**，合计是 **134 个一手来源**。这些来源经过效果抽取后形成 **73 个扩展候选**，不是 134 个效果，更不是 134 个发布条目。

73 个候选经过跨池去重、与现有 15 项对照和制作前风险检查后，分为：

- **current-build：11 项**。当前准备制作真实本地 Demo；完成后仍要逐项捕获 GIF、补 provenance、视觉评分，任何一项未过 80 分或核心最低分都不能发布。
- **future-batch：43 项**。效果签名仍有独立价值，但不进入当前批次；需要单独解决依赖、资产、许可、捕获稳定性或艺术设计。
- **preflight-reject：19 项**。当前不值得投入 Demo 成本，原因是与现有发布效果过近、视觉/创意余量小、来源许可不清、外部资产不可控或运行成本明显不适合本轮。

即使 11 个 current-build 全部通过，发布目录也只是从现有 15 项最多增长到 **26 项**；实际数量可能更少。**研究来源数衡量输入多样性，发布数量衡量证据充分且达到艺术门槛的结果，两者不能画等号。**

## 审计方法

每个候选都按 `trigger / progression / rendering / continuity` 四段效果签名检查：

1. 与现有 15 项主体行为是否相同，而不只比较库名、颜色和文案。
2. 与另一个候选池是否出现同触发、同进程、同渲染层、同连续性的硬重复。
3. 即使机制不同，在四帧 GIF 中是否可能被看成同一个效果。
4. 能否使用真实实现、本地资产、固定输入和可复现 capture 诚实证明。
5. 制作前预测分只用于排期；没有真实 Demo/GIF/provenance 时，正式证据分仍为 0。

状态含义：

- `current-build`：当前制作队列，不等于准入。
- `future-batch`：去重后保留，下一批重新评估。
- `preflight-reject`：当前审计拒绝；除非证据、许可、设计或实现条件改变，不进入制作队列。

## 已有 15 项对照基线

| # | 已发布 ID | 主体签名摘要 |
| ---: | --- | --- |
| 1 | `scroll-scrubbed-master-timeline` | 滚动连续擦洗主时间线 |
| 2 | `pinned-horizontal-scroll-scene` | 固定视口中的横向叙事 |
| 3 | `shared-layout-spring-morph` | 共享元素跨布局弹簧变形 |
| 4 | `staggered-transform-choreography` | 多元素错峰变换编排 |
| 5 | `motion-graphics-burst` | 固定舞台的径向动态图形爆发 |
| 6 | `visually-authored-keyframe-sequence` | 可视化关键姿态时间序列 |
| 7 | `compact-svg-shape-tween` | SVG 图形拓扑补间 |
| 8 | `filterable-grid-reflow` | 筛选、排序与网格补位 |
| 9 | `perspective-tilt-and-glare` | 指针驱动透视倾斜与反光 |
| 10 | `context-aware-custom-cursor` | 用户光标随内容语境换角色 |
| 11 | `displacement-map-image-hover` | 悬停触发两图位移纹理切换 |
| 12 | `svg-stroke-drawing` | SVG 路径逐笔显现 |
| 13 | `sketch-style-creative-coding-loop` | p5 多层生成艺术循环 |
| 14 | `functional-webgl-draw-commands` | GPU 实例化粒子涡旋 |
| 15 | `dom-synced-shader-planes` | 绑定 DOM 边界的虹彩着色器平面 |

## 当前准备制作的 11 项

| 输入键 | 最终 ID | 来源与效果 | 与现有 15 项及 GitHub 池的去重结论 | 当前入队理由 |
| --- | --- | --- | --- | --- |
| AI-01 | `depth-layer-blur-dissolve` | Black Forest Labs · 深度图排序模糊溶解 | 现有 `displacement-map-image-hover` 用位移纹理切换两图；本项由深度图决定近、中、远区域的时间顺序。GH-09 是指针深度视差，GH-14 是单图指针涟漪，均非深度排序转场。 | 原创图与深度图即可稳定复现，视觉签名强，机制可通过深度小窗证明。 |
| AI-04 | `dom-aware-drag-spawned-fish-flock` | Sakana AI · 拖拽生成且避让 DOM 的鱼群 | 现有粒子涡旋没有 boids 群集、拖拽增殖和 DOM 前向避障；GH-15/19/21 分别是刚体、吸引排斥粒子和 3D 碰撞，也不共享群集规则。 | 交互、群体行为和页面 DOM 三层关系独特；本地 p5 与固定输入可复现。 |
| AI-05 | `synchronized-scenario-scene-handoff` | Vapi · 多层同步场景换幕 | 不是现有共享布局 morph：背景媒体、遮罩、正文、3D 标签由一个场景状态原子切换。GH-04 Swup 是跨路由交换，GH-01 Rive 是矢量状态机，粒度不同。 | 同一状态协调多层消费者，艺术完整性和 GIF 可读性都高。 |
| AI-03 | `prompt-select-replace-loop` | Granola · 输入—选中—替换提示词循环 | 不等于普通逐字输入，也不与现有 SVG morph/关键帧重合；GH-13 分瓣翻牌是字符显示机械结构，没有编辑器选择语义。 | typing、selection、replacement、chip 四阶段清楚，原生 DOM/Motion 即可稳定证明。 |
| AI-10 | `traveling-dot-headline-rewriter` | PolyAI · 旅行圆点擦除并重写标题 | 现有 SVG 描边画的是既有路径；本项圆点根据文字实测边界擦掉旧词再写入新词。GH-10/12 是材质化文字，GH-28 是 3D 弯曲文字，主体不同。 | 标题级视觉签名明确，短 GIF 能完整包含擦除与重写两阶段。 |
| AI-07 | `infinite-curved-text-conveyor` | Wispr Flow · 无限曲线文字传送带 | 路径真实参与 SVG 排字；不等于直线 marquee。GH-28 把 SDF 字体弯进 3D 圆柱，GH-13 翻牌字符，现有 SVG morph 改图形形状，均非开放曲线上的连续文字运输。 | 无外部资产、依赖低，路径与运动关系第一眼可辨。 |
| AI-21 | `autonomous-agent-cursor-constellation` | InVideo · 自主 Agent 光标星座 | 现有 `context-aware-custom-cursor` 是一个跟随用户的光标；本项是多个具名 Agent 自主巡游、停靠、批注的叙事角色。 | 可直接表达多 Agent 协作，是 AI Native 场景中特别有迁移价值的视觉语言。 |
| AI-06 | `scroll-linked-multilayer-starfield` | Fathom · 滚动联动多层星空 | 现有 p5 循环和 regl 涡旋由时间推进；本项三层星场按滚动以不同密度和速度连续映射。GH-08 Parallax 是指针/设备方向触发，不是文档滚动。 | 触发、空间深度和视觉参照清楚；固定三层种子后可重复捕获。 |
| AI-11 | `staggered-multichart-telemetry-boot` | Pinecone · 交错多图表遥测启动 | 不等于现有普通 stagger：每块图先 spinner、再刻度、再按真实数据进度绘线。GH-36 是连续滑动数据窗口，GH-27 是 3D 数据拾取，GH-37 是节点拓扑编辑。 | 多图形态、系统上线叙事与数据绘制绑定，缩略图可识别。 |
| AI-14 | `delayed-dropdown-promo-sweep` | Glean · 延迟下拉推广扫光 | 不是普通菜单进场：dropdown 完成后延迟 200ms 才触发 1.3s 扫光。GH-06 是速度感知抽屉，GH-07 是空间幻灯片，均无“展开完成后再强调”的语义节拍。 | 原生 CSS/JS 即可，真实延迟节奏容易验证，艺术设计余量充足。 |
| AI-13 | `self-inverting-fixed-navigation` | Luma AI · 自动反色固定导航 | 通过 `mix-blend-difference` 连续响应底层像素，不是滚动阈值换 class。现有目录和 GitHub 池没有相同合成式导航机制。 | 机制纯粹、无远程依赖，可通过四种底层材质一次证明。 |

## 跨池近邻簇审计

73 项中没有发现四段签名完全相同的跨池硬重复，但有以下近邻簇。当前批次只取最适合稳定证明的一部分，其余降为 future-batch 或 preflight-reject。

| 近邻簇 | 涉及候选 | 判定 |
| --- | --- | --- |
| 深度与图像变形 | AI-01、GH-09、GH-14、现有位移图悬停 | 分别是深度排序时间轴、指针深度视差、移动位移场、两图切换；不硬判重。AI-01 当前制作，GH 两项以后并排验收。 |
| 场景与状态切换 | AI-05、GH-01、GH-04、现有共享布局 morph | 分别是多媒体原子换幕、矢量状态机、跨路由交换、共享 DOM 身份 morph；机制不同。只在当前批次制作 AI-05。 |
| 曲线与材质化文字 | AI-03、AI-07、AI-10、GH-10、GH-12、GH-13、GH-28 | 编辑替换、曲线路径运输、圆点擦写、黏液滤镜、液态 shader、机械翻牌、3D SDF 曲率均可描述为不同词汇；通过 Demo 构图继续拉开。 |
| 生成背景与粒子 | AI-06、GH-18、GH-19、GH-30—33、现有 p5/regl | 滚动视差、流体、群落、抖动波、速度隧道、闪电、丝绸的场方程和触发不同；本批只取滚动星场，避免一次新增过多全屏背景。 |
| 物理与群体行为 | AI-04、GH-15、GH-19、GH-21 | boids + DOM 避障、2D 刚体、吸引排斥种群、3D 刚体碰撞；不硬判重。AI-04 最能体现网页 DOM 与生成系统结合。 |
| 数据与系统可视化 | AI-11、GH-27、GH-36、GH-37、AI-29、AI-32 | 遥测启动、3D 拾取、流数据推进、图拓扑编辑是独立机制；普通实施时间线和一次性 SVG 图解因靠近现有 stagger/SVG 描边而拒绝。 |
| 导航与覆盖层 | AI-13、AI-14、GH-03—07、AI-25 | 合成反色、延迟扫光、反向分屏、路由交换、拖拽网格、速度抽屉、空间幻灯片、clip 帘幕各有独立触发；当前批选最低依赖且证据最清楚的两项。 |
| 光标角色 | AI-21、现有情境光标、GH-29 | 多 Agent 自主角色、用户语境光标、3D raycast 表面标记并非同一主体；AI-21 当前制作，GH-29 后续制作。 |

## AI Native 池其余 24 项

| 输入键 | 候选 | 状态 | 原因 |
| --- | --- | --- | --- |
| AI-02 | 滚动擦洗式文档生成回放 | `future-batch` | 机制独特且预测上限高，但需同时证明外层滚动、内层 `scrollTop`、行裁剪和光标，capture 复杂度高于当前批次。 |
| AI-08 | 按片段时长接力的首屏影片 | `future-batch` | 需要制作四段许可明确的本地影片并证明按 duration 预载/交接；资产成本高。 |
| AI-09 | 悬停预演的视频风格轨 | `future-batch` | hover 临时预演与 click 持久选择独特，但需要五段本地视频、键盘语义和真实居中捕获。 |
| AI-12 | 设备轮廓蒙版视频 | `future-batch` | 可做，但需要原创 alpha mask 和动态媒体；与当前 11 项相比互动层次较少。 |
| AI-15 | 四角裁切标记悬停 | `future-batch` | 低依赖且签名清楚，但艺术完成度高度依赖摄影卡与排版，留给独立小批人工验收。 |
| AI-16 | 交互历史驱动招聘徽章 | `future-batch` | 多次 hover 记忆独特，但动效/艺术预测余量小；需证明 1—4 次状态都能在短 capture 中读懂。 |
| AI-17 | 卡片元数据到 CTA 角色互换 | `future-batch` | 与普通 hover 的距离依赖构图；需先做单样本并与现有 pointer 类并排验收。 |
| AI-18 | 反向对冲斜移 CTA | `future-batch` | 机制清楚但体量小，容易被看成普通按钮位移；需要更强版画式艺术设计。 |
| AI-19 | 模糊自播视频氛围层 | `future-batch` | 必须复用同一动态源并制作本地媒体；效果偏氛围层，当前先不占制作额度。 |
| AI-20 | 带滞回的滚动阈值页头改色 | `preflight-reject` | 主体更接近功能性状态稳定器，艺术 15/20、动效 16/20 的预测余量有限，不优先制作。 |
| AI-22 | ASCII 编排信号扫过 | `future-batch` | 视觉语言强，但需要固定字符场、扫描前沿、离屏暂停和缩略图可读性专项设计。 |
| AI-23 | 惯性竖向能力轨 | `future-batch` | 必须在短 GIF 内同时表达抓取、甩动、衰减、恢复自动漂移，capture 成本较高。 |
| AI-24 | 可见性门控 Agent 终端回放 | `future-batch` | 状态叙事有价值，但需要真实离屏冻结、Escape 中断和多行输出，适合单独做长时序批次。 |
| AI-25 | 裁剪路径菜单帘幕 | `future-batch` | 与 Swup/全屏导航近邻但触发不同；以后需要并排确认不是普通 clip-path 入场。 |
| AI-26 | 边缘渐隐且悬停暂停的焕彩 Logo 带 | `preflight-reject` | 由 HeyGen 与 Suno 两个来源行为综合，不是单站完整机制；provenance 语义容易误导，预测仅 85。 |
| AI-27 | 悬停启动斜纹 CTA 传送带 | `preflight-reject` | 即使行为证据真实，仍容易被看成常规 hover 背景动画，创意迁移价值不足以占制作成本。 |
| AI-28 | 可玩的品牌扫雷页脚 | `future-batch` | 签名独特，但容易膨胀成完整游戏；需限制交互范围并另做胜负状态 capture。 |
| AI-29 | 滚动激活的实施时间线 | `preflight-reject` | 节点错峰、overshoot 与 halo 在主体上仍靠近现有 `staggered-transform-choreography`，差异主要是内容语义。 |
| AI-30 | 网格轨道手风琴展开 | `preflight-reject` | 预测 82 分且艺术/动效只略过最低线，属于功能控件，准入余量过小。 |
| AI-31 | 滚动感知目录与一次性图解播放 | `preflight-reject` | 多机制组合但主体偏功能导航，预测 85；目录追踪与视口触发不足以形成高辨识艺术词汇。 |
| AI-32 | 一次性入视口矢量图解 | `preflight-reject` | 与现有 SVG 描边和可视化关键帧序列过近，预测 81，无法证明值得新增独立条目。 |
| AI-33 | 降噪音频 A/B 交叉试听 | `future-batch` | 机制可迁移，但需要原创双音轨、真实 Web Audio crossfade 与波形同步。 |
| AI-34 | 音轨卡播放态协同切换 | `future-batch` | 普通播放器风险较高，必须把材质苏醒/休眠设计到足以脱离功能控件后再制作。 |
| AI-35 | 活跃音轨均衡器雕塑 | `future-batch` | 必须使用真实频谱数据而非随机柱；需要本地音频、分析器和静音 GIF 的视觉解释。 |

AI Native 余项统计：`future-batch` 17，`preflight-reject` 7。

## GitHub 池 38 项

| 输入键 | 候选与官方仓库 | 状态 | 原因 |
| --- | --- | --- | --- |
| GH-01 | 交互式矢量状态机 · rive-app/rive-wasm | `future-batch` | 独特且高潜力，但必须先获得可再分发或自制 `.riv` 资产。 |
| GH-02 | DOM 与 3D 滚动锁步同步 · 14islands/r3f-scroll-rig | `future-batch` | 与现有 DOM shader 不同，但 React/WebGL/滚动三层构建和漂移验收成本高。 |
| GH-03 | 反向移动分屏场景 · alvarotrigo/multiscroll.js | `preflight-reject` | 上游偏旧、依赖 jQuery，标准 SPDX 不明确；在许可和移动端行为解决前不制作。 |
| GH-04 | 场景擦除式渐进页面交换 · swup/swup | `future-batch` | 需要真实双路由 HTTP capture；机制保留但不与当前同步场景换幕同批制作。 |
| GH-05 | 可拖拽紧密编辑墙 · haltu/muuri | `future-batch` | 区别于现有筛选网格，但要派发真实 pointer drag 并验证碰撞避让。 |
| GH-06 | 速度感知抽屉回弹 · emilkowalski/vaul | `future-batch` | 需要 React、慢拖/快甩双路径、键盘焦点回收；适合手势专项批次。 |
| GH-07 | 空间化演示文稿导航 · hakimel/reveal.js | `future-batch` | 机制独立，但默认主题会低分，必须另做完整原创空间构图。 |
| GH-08 | 指针驱动多层景深舞台 · wagerfield/parallax | `future-batch` | 与当前滚动星场触发不同；保留到 pointer-depth 批次并做移动端降级。 |
| GH-09 | 深度图人像视差 · akella/fake3d | `preflight-reject` | 上游许可字段不明确且实现偏旧；在许可和自制深度资产方案确定前不进入队列。 |
| GH-10 | SVG 滤镜黏液文字悬停 · codrops/GooeyTextHoverEffect | `future-batch` | 高辨识但需跨浏览器处理 SVG filter region；与本批两个文字效果分批验收。 |
| GH-11 | 动画手绘语义标注 · rough-stuff/rough-notation | `future-batch` | 低依赖、可制作；暂缓是批次容量原因，后续需等待字体后计算真实 DOM 边界。 |
| GH-12 | 液态着色器排印 · bradley/Blotter | `preflight-reject` | 上游较老且 GitHub 未给标准 SPDX；兼容性和许可未解决。 |
| GH-13 | 机械分瓣翻牌字符 · pqina/flip | `future-batch` | 机制清楚且风险低；以后与曲线文字、圆点擦写并排检查，避免文字类目录过密。 |
| GH-14 | 指针跟随位移涟漪 · pixijs/pixijs | `future-batch` | 与现有两图位移切换不同，但必须并排证明单图连续涟漪不是同一效果换皮。 |
| GH-15 | 可抓取刚体海报堆 · liabru/matter-js | `future-batch` | 固定物理步长和真实 pointer capture 后有较高价值，留给物理专项批次。 |
| GH-16 | 点构成的生成式花冠 · williamngan/pts | `future-batch` | 与现有 p5 生成循环近邻；需先做艺术构图再进行感知重复检查。 |
| GH-17 | 可拖拽伪 3D 机械花 · metafizzy/zdog | `preflight-reject` | GitHub API 未给标准 SPDX；许可核验完成前不制作。 |
| GH-18 | 指针注入 GPU 流体 · PavelDoGreat/WebGL-Fluid-Simulation | `future-batch` | 视觉上限很高，但需要固定模拟步长、输入轨迹和 GPU 兼容性；单独做渲染批次。 |
| GH-19 | 涌现式粒子生命群落 · hunar4321/particle-life | `future-batch` | 与本批鱼群都属群体系统但规则不同；分批制作可避免相邻预览视觉拥挤。 |
| GH-20 | 滑杆控制 3D 爆炸装配 · mrdoob/three.js | `future-batch` | 无外部资产也可做，保留为下一批 three.js 高优先项。 |
| GH-21 | 碰撞响应 3D 物理堆栈 · pmndrs/react-three-rapier | `future-batch` | Rapier WASM、React Three Fiber 与固定时间步增加构建/捕获成本。 |
| GH-22 | 折射玻璃透射雕塑 · pmndrs/drei | `future-batch` | 需要程序化环境替代 HDRI，并验证低端 GPU；机制与现有虹彩平面不同。 |
| GH-23 | 可轨道浏览高斯泼溅场景 · mkkellogg/GaussianSplats3D | `preflight-reject` | 没有已核验许可的小型 splat 资产；资产来源、体积和加载任一项不满足就不能发布。 |
| GH-24 | 指针旋转点阵地球 · shuding/cobe | `future-batch` | 依赖轻、无远程地图，可作为下一批 WebGL 快速样本。 |
| GH-25 | 电影式地图相机飞行 · maplibre/maplibre-gl-js | `future-batch` | 需先建立本地 style/GeoJSON，避免远程瓦片破坏可复现性。 |
| GH-26 | 地球昼夜分界线延时扫过 · CesiumGS/cesium | `preflight-reject` | 当前批次不接受 Cesium 大体积静态资源和潜在远程底图依赖；需独立离线方案。 |
| GH-27 | 可拾取挤出数据柱 · visgl/deck.gl | `future-batch` | 可无底图实现；以后必须用真实 GPU picking，而非 DOM hover 模拟。 |
| GH-28 | 弯曲三维文字环绕 · protectwise/troika | `future-batch` | 需要本地许可字体和 `sync()` 加载门禁；与当前 SVG 曲线文字分批。 |
| GH-29 | 光标投射三维表面标记 · mrdoob/three.js | `future-batch` | 无外部资产且机制清楚，是下一批 three.js 高优先项；需真实 raycast/法线证据。 |
| GH-30 | 指针扰动抖动波纹 · DavidHDev/react-bits | `preflight-reject` | 官方仓库未给标准 SPDX；组件源码许可未单独解决前不复制或制作发布 Demo。 |
| GH-31 | 交互式超高速公路 · DavidHDev/react-bits | `preflight-reject` | 同样存在许可问题，且组件源码/依赖较重；本轮不接受 48KB 组件直接引入。 |
| GH-32 | 程序化闪电背景 · DavidHDev/react-bits | `preflight-reject` | 许可未明确；还需固定噪声并做闪烁安全/reduced-motion 专项验收。 |
| GH-33 | 流动丝绸着色器 · DavidHDev/react-bits | `preflight-reject` | 许可未明确，且若指针响应不够强会退化成单纯好看的背景，不满足交互策展目标。 |
| GH-34 | 可拖拽缩放音频循环区 · katspaugh/wavesurfer.js | `future-batch` | 需要本地生成音频、Regions 插件和静音 GIF 中可见的播放头回环。 |
| GH-35 | 拖拽环视 360 全景 · mistic100/Photo-Sphere-Viewer | `preflight-reject` | 尚无已核验且适合的原创/可再分发全景资产；普通宽图不能冒充全景。 |
| GH-36 | 流式折线图窗口推进 · apache/echarts | `future-batch` | 机制独立；需固定遥测序列与强艺术设计，避免默认图表低分。 |
| GH-37 | 手柄连线动画节点编辑器 · xyflow/xyflow | `future-batch` | 需要真实 handle-to-handle 拖拽；留给数据/节点 UI 专项批次。 |
| GH-38 | 视频手部关键点叠加 · google-ai-edge/mediapipe | `preflight-reject` | 模型/WASM/视频资产较重，且没有已核验的本地手势视频；不能用预标注 JSON 伪造推理。 |

GitHub 余项统计：`future-batch` 26，`preflight-reject` 12。

## 数量核对

| 层级 | 数量 | 含义 |
| --- | ---: | --- |
| AI Native 官网来源 | 100 | 被检查的一手网站，不等于效果数量 |
| GitHub 官方仓库来源 | 34 | 被核验的一手仓库，不等于效果数量 |
| 来源合计 | 134 | 研究输入规模 |
| AI Native 扩展候选 | 35 | 从官网行为抽出的候选签名 |
| GitHub 扩展候选 | 38 | 从官方仓库抽出的候选签名 |
| 扩展候选合计 | 73 | 制作前候选规模 |
| current-build | 11 | 当前只准备制作 Demo，尚未准入 |
| future-batch | 43 | 去重后保留、后续再制作 |
| preflight-reject | 19 | 当前不进入制作队列 |
| 现有已发布 | 15 | 已有真实证据并通过评分的条目 |
| 理论最大新目录 | 26 | 只有当当前 11 项全部通过才可能达到 |

核对公式：`35 + 38 = 73`；`11 + 43 + 19 = 73`；`17 + 26 = 43`；`7 + 12 = 19`。

## 发布门禁仍然独立执行

current-build 只代表先投入制作。每项完成后仍必须：

1. 使用声明的真实库、源码或浏览器能力制作可独立运行的 Demo。
2. 固定视口、DPR、时间、输入轨迹、随机种子和等待条件。
3. 从真实浏览器结果捕获 GIF，建立一一对应 provenance。
4. 检查起始、发展、峰值、复位四个阶段，并与近邻效果并排做感知重复检查。
5. 按六维 100 分制重新评分；总分低于 80，或艺术、动效、辨识、证据任一核心最低分不达标，立即从发布数据删除。

因此，本报告不承诺新增 11 项，只承诺这 11 项比其余 62 项更值得先接受真实 Demo 与评分检验。
