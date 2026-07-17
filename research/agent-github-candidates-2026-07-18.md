# GitHub 交互特效候选池（多 Agent 并行调研）

调研日期：2026-07-18
调研范围：仅使用项目官方 GitHub 仓库、官方 README、仓库内示例或组件源码；不使用二次转载、聚合文章和截图猜测。
输出目的：为下一轮真实本地 Demo 制作提供去重候选，不代表已经通过发布准入。

## 结论

- 本轮得到 **38 个**与现有 15 个发布效果不重叠的效果签名，来自 **34 个独立官方仓库**（three.js 与 React Bits 各提供多种机制明显不同的候选）。
- 下表中的分数是“按指定 Demo 方案完成、真实 GIF/provenance/视觉验收全部通过时”的**目标分数**，不是预先授予的发布分。未做出真实 Demo 时，按现行规则证据分为 0，仍然必须拒绝。
- 当前硬门槛保持不变：总分至少 80；艺术完成度至少 14、动效编排至少 14、辨识度至少 11、证据质量至少 8。
- 优先建议先做 10 个高价值样本：指针流体、抖动波纹、粒子生命、表面投射标记、爆炸装配、Pixi 位移涟漪、黏液文字、机械翻牌、手绘标注、COBE 点阵地球。它们兼顾视觉签名、实现可控性和稳定录制。

## 去重口径

效果签名统一写成：`trigger / progression / rendering / continuity`。

- `trigger`：加载、滚动、悬停、拖拽、点击、时间、媒体输入等。
- `progression`：一次触发、连续映射、物理反馈、分阶段、状态切换等。
- `rendering`：DOM、SVG、Canvas 2D、WebGL、视频或组合层。
- `continuity`：是否连续可逆、是否保持对象身份、是否循环、是否存在离散换幕。

已排除与现有发布目录实质相同的通用时间线、固定横向滚动、共享布局弹簧、普通交错动画、径向爆发、普通 SVG morph/描边、网格筛选、卡片倾斜高光、自定义光标、两图位移切换、p5 生成循环、regl 粒子涡旋、DOM 绑定着色器平面等。

## 评分记法

`C/A/M/L/T/E` 依次代表：创意 20、艺术完成度 20、动效编排 20、辨识度 15、迁移价值 15、证据质量 10。

## 38 个去重候选

| # | 候选与一手来源 | 效果签名 | 独特性与本地 Demo 方案 | 建议依赖 | 真实性风险 | 目标六维评分 → 总分 |
| ---: | --- | --- | --- | --- | --- | --- |
| 1 | **交互式矢量状态机** · [rive-app/rive-wasm](https://github.com/rive-app/rive-wasm) | pointer/click / finite-state transitions / WASM Canvas/WebGL vector / continuous state identity | 不是普通时间线播放：悬停、按下、成功三种输入共同驱动一个有记忆的矢量控制。Demo 做一枚“休眠→警觉→确认”的生物按钮，并把状态标签同步显示。 | `@rive-app/canvas` | 必须使用可再分发或本项目自制 `.riv` 文件；远程社区资产许可不清会直接阻断。 | `18/18/19/15/15/9` → **94** |
| 2 | **DOM 与 3D 滚动锁步同步** · [14islands/r3f-scroll-rig](https://github.com/14islands/r3f-scroll-rig) | scroll / continuous geometry tracking / React DOM + shared WebGL canvas / reversible lockstep | 与已入选的 DOM 内着色器平面不同：WebGL 物体在滚动中持续追踪真实 DOM 卡片的尺寸与位置。Demo 用三个编辑式图像框，滚过折叠、跨栏和放大布局时 3D 材质仍紧贴代理框。 | `@14islands/r3f-scroll-rig`, `@react-three/fiber`, `three`, `react` | React 构建链较重；必须真实滚动并检查 DOM/WebGL 不漂移，不能用 CSS 假贴图。 | `19/19/19/14/15/9` → **95** |
| 3 | **反向移动分屏场景** · [alvarotrigo/multiscroll.js](https://github.com/alvarotrigo/multiscroll.js) | wheel/keyboard / discrete section snapping / paired DOM columns / reversible opposite continuity | 左右半屏沿相反方向换幕，主体合拢后形成一张完整海报；不同于单轨横向滚动。Demo 做四幕“昼夜植物标本”，键盘、滚轮都可推进。 | `multiscroll.js`, `jquery` | 上游偏旧且 GitHub API 未给出标准 SPDX；需要单独核验许可与移动端行为，否则只保留研究态。 | `15/18/18/15/14/8` → **88** |
| 4 | **场景擦除式渐进页面交换** · [swup/swup](https://github.com/swup/swup) | route activation / staged leave-fetch-enter / DOM page swap + CSS clip / discrete but identity-aware | 不只做淡入淡出：离场标题先压缩成一道缝，下一页图像从同一缝隙展开。Demo 用两个真实 HTML 路由和共享导航，确保 Swup 真正执行页面替换。 | `swup` | 必须在 HTTP 服务中跨页面运行；不能把单页两个 div 切换冒充 Swup 路由。 | `16/18/18/14/15/9` → **90** |
| 5 | **可拖拽紧密编辑墙** · [haltu/muuri](https://github.com/haltu/muuri) | drag / physics-like reorder + packing / DOM transforms / continuous object identity | 相较已入选的筛选网格，这里核心是抓起卡片、相邻卡片避让、落下后紧密装箱。Demo 用不等高海报与明显空隙，自动拖拽一张跨两列卡片。 | `muuri` | 录制必须真正派发 pointer drag；只调用排序 API 不足以证明拖拽手感。 | `15/17/18/15/14/9` → **88** |
| 6 | **速度感知抽屉回弹** · [emilkowalski/vaul](https://github.com/emilkowalski/vaul) | touch/pointer drag / velocity + snap points / DOM overlay / reversible gesture continuity | 抽屉跟随手指、根据甩动速度越过吸附点，并让背景同步缩放；不同于简单的进出场面板。Demo 做三段式“声音混音台”底部抽屉。 | `vaul`, `react`, `react-dom` | 自动录制要包含慢拖与快速甩动；键盘打开/关闭和焦点回收也必须验证。 | `14/16/18/15/13/9` → **85** |
| 7 | **空间化演示文稿导航** · [hakimel/reveal.js](https://github.com/hakimel/reveal.js) | keyboard/swipe / 2D slide graph navigation / DOM 3D transforms / discrete spatial continuity | 横向章节与纵向分支构成可见空间地图，而不是普通轮播。Demo 做一张“星图档案”，先横移再下潜到子章节，并用 overview 收束。 | `reveal.js` | 要避免只是默认主题；必须通过原创构图让空间关系在缩略图中可辨。 | `15/18/17/15/14/9` → **88** |
| 8 | **指针驱动多层景深舞台** · [wagerfield/parallax](https://github.com/wagerfield/parallax) | pointer/device orientation / continuous depth-weighted offsets / layered DOM / reversible | 与卡片整体倾斜不同：前景枝叶、标题、远景月亮按深度系数产生不同位移。Demo 使用原创 SVG 分层夜景，并提供 touch/陀螺仪降级。 | `parallax-js` | 桌面捕获使用真实 pointer；移动端方向传感器权限不能成为唯一触发方式。 | `14/18/18/15/14/9` → **88** |
| 9 | **深度图人像视差** · [akella/fake3d](https://github.com/akella/fake3d) | pointer / continuous depth sampling offset / WebGL image + depth map / reversible | 使用灰度深度图让人物前后层发生不同视差，不是把多个 DOM 图层手工平移。Demo 自制抽象头像与对应深度图，指针左右移动时肩部、脸和背景分离。 | 上游源码或同 API 的本地模块 | 上游许可字段不明确且实现偏旧；必须自制图片与深度图，并核验复用边界。 | `18/18/18/14/15/8` → **91** |
| 10 | **SVG 滤镜黏液文字悬停** · [codrops/GooeyTextHoverEffect](https://github.com/codrops/GooeyTextHoverEffect) | hover/focus / staged blob merge and glyph reveal / SVG filter + DOM text / reversible | 字母不是缩放或模糊，而是由液滴聚合成文字再散开。Demo 用“LIQUID TYPE”两行标题，键盘 focus 与 pointer hover 触发同一状态。 | 上游模块、原生 SVG filters | `feGaussianBlur`/`feColorMatrix` 在不同浏览器的边界可能裁切；需固定 filter region。 | `18/19/18/15/15/8` → **93** |
| 11 | **动画手绘语义标注** · [rough-stuff/rough-notation](https://github.com/rough-stuff/rough-notation) | viewport/button / sequenced annotations / SVG overlay on live DOM / additive continuity | 与已入选的 SVG 描边不同：下划线、圈选、高亮围绕真实文字尺寸生成，并按论证顺序出现。Demo 做一页“编辑批注”，三种标注依次锁定关键词。 | `rough-notation` | 必须让库围绕实际 DOM 计算，不可提前画死 SVG；字体加载后再记录尺寸。 | `16/17/18/15/15/9` → **90** |
| 12 | **液态着色器排印** · [bradley/Blotter](https://github.com/bradley/Blotter) | pointer/time / continuous material parameter modulation / WebGL text canvas / reversible loop | 字体轮廓内部出现液态折射，指针临近时扭曲增强；不是整张 DOM 平面的虹彩着色器。Demo 仅保留一词“VISCOSITY”和一个清楚的扭曲场。 | `blotter.js` 或仓库构建 | 上游较老、GitHub 未给 SPDX；字体与 WebGL 扩展兼容性要单独核验。 | `19/19/18/14/15/8` → **93** |
| 13 | **机械分瓣翻牌字符** · [pqina/flip](https://github.com/pqina/flip) | timer/state update / per-glyph split-flap sequence / DOM/CSS 3D / discrete value continuity | 每个数字的上下半页物理式接力翻转，不是逐字符 typing 或 SVG morph。Demo 做“档案编号”从 0098 翻到 0104，刻意展示进位传播。 | `@pqina/flip` | 需要确保捕获帧中上下叶片方向正确、没有背面镜像；字体宽度必须固定。 | `15/18/18/15/14/9` → **89** |
| 14 | **指针跟随位移涟漪** · [pixijs/pixijs](https://github.com/pixijs/pixijs) | pointer / continuous moving displacement field / PixiJS WebGL 2D / reversible decay | 与现有两张图悬停切换不同：单张图像被一个移动的位移纹理持续推开，并在离开后弹性回稳。Demo 用原创棋盘花窗，涟漪位置和扭曲方向一眼可见。 | `pixi.js` | 位移贴图必须本地生成并正确绑定过滤器；不能用 CSS blur 假装变形。 | `18/19/18/14/15/9` → **93** |
| 15 | **可抓取刚体海报堆** · [liabru/matter-js](https://github.com/liabru/matter-js) | pointer drag + gravity / continuous collision simulation / Canvas 2D / persistent physical state | 多张带文字的海报落下、碰撞、可抓起后再次砸入；比普通拖拽重排多了旋转、质量和碰撞传递。Demo 固定世界种子与初始姿态。 | `matter-js` | 物理步长、像素比和初始条件必须固定；捕获不能依赖不可重复随机数。 | `17/18/19/15/15/9` → **93** |
| 16 | **点构成的生成式花冠** · [williamngan/pts](https://github.com/williamngan/pts) | pointer/time / continuous geometric recomputation / Canvas 2D / loop with reversible local response | 点群依据距离、角度和指针形成层叠花冠，强调 Pts 的点/向量关系，而不是通用 p5 波形。Demo 用固定采样点和 12 秒闭环。 | `pts` | 必须固定采样与时间相位；装饰文字不能承担辨识度。 | `18/18/18/14/15/9` → **92** |
| 17 | **可拖拽伪 3D 机械花** · [metafizzy/zdog](https://github.com/metafizzy/zdog) | drag/time / direct rotation + authored hinge motion / Canvas or SVG pseudo-3D / continuous | 由厚描边圆片组成的平面机械花在拖拽时转向、自动时逐层开合；不是通用 3D 方块。Demo 保留 Zdog 的圆润插画语言。 | `zdog` | GitHub API 未提供标准 SPDX；发布前核验上游许可。录制需同时展示自动开合与一次真实拖拽。 | `17/19/17/15/15/9` → **92** |
| 18 | **指针注入 GPU 流体** · [PavelDoGreat/WebGL-Fluid-Simulation](https://github.com/PavelDoGreat/WebGL-Fluid-Simulation) | pointer drag / continuous advection-diffusion / WebGL framebuffer simulation / persistent dissipating trails | 指针把速度与染料真实注入流场，形成卷吸和混色；不是预录视频或普通渐变。Demo 用两次稳定的 S 形拖动和受控配色。 | 上游 WebGL 实现 | 要从真实模拟捕获；需固定模拟分辨率、时间步和 splat 输入，避免 GPU 差异造成空白或闪烁。 | `19/20/20/15/15/9` → **98** |
| 19 | **涌现式粒子生命群落** · [hunar4321/particle-life](https://github.com/hunar4321/particle-life) | time/pointer / attraction-repulsion simulation / Canvas 2D / emergent persistent motion | 不同颜色粒子按种群规则相吸相斥，自动形成追逐、膜和群落；与现有涡旋粒子没有固定旋转场。Demo 用固定 4×4 作用矩阵和固定种子。 | 上游算法或本地模块 | 随机种子、力矩阵和边界必须记录；不能挑选一次偶然好看的录屏。 | `19/18/19/14/15/9` → **94** |
| 20 | **滑杆控制 3D 爆炸装配** · [mrdoob/three.js](https://github.com/mrdoob/three.js) | range/drag / continuous authored part separation / WebGL mesh scene / reversible structural continuity | 一个机械对象沿各自装配轴拆开并重新合拢，改变的是物件结构而不是相机。Demo 用原创“轨道相机”六部件和剖面标记。 | `three` | 不使用外部模型可避开资产许可；必须让 slider 真正控制各 mesh 的相对位置。 | `17/19/18/15/15/10` → **94** |
| 21 | **碰撞响应 3D 物理堆栈** · [pmndrs/react-three-rapier](https://github.com/pmndrs/react-three-rapier) | click/spawn + physics / continuous rigid-body collisions / React Three Fiber + Rapier WASM / persistent | 玻璃方块落到基座时根据碰撞冲量发光并发声波环；区别于二维 Matter 堆栈和无交互的粒子场。 | `@react-three/rapier`, `@react-three/fiber`, `three`, `react` | WASM 加载和固定步长是关键；音频不是核心证据，静音捕获也应看懂碰撞反馈。 | `18/19/20/15/15/9` → **96** |
| 22 | **折射玻璃透射雕塑** · [pmndrs/drei](https://github.com/pmndrs/drei) | pointer/time / continuous optical response / WebGL PBR transmission / continuous material identity | 旋转玻璃结体折射背后的彩色条纹，并随厚度产生色散；不同于已入选虹彩平面和普通高光卡片。 | `@react-three/drei`, `@react-three/fiber`, `three`, `react` | 不得依赖无许可 HDRI；用程序化几何和本地条纹环境。低端 GPU 降级需保留清楚轮廓。 | `18/20/18/15/15/9` → **95** |
| 23 | **可轨道浏览高斯泼溅场景** · [mkkellogg/GaussianSplats3D](https://github.com/mkkellogg/GaussianSplats3D) | drag / continuous orbit + progressive splat load / WebGL Gaussian splats / persistent radiance field | 体积感来自大量定向高斯而非三角网格；拖拽时半透明点云维持真实视差。Demo 用明确允许再分发的小型 splat 资产。 | `@mkkellogg/gaussian-splats-3d` | 最大风险是场景资产许可、体积和加载稳定性；没有合格资产就不发布。 | `20/20/18/14/15/8` → **95** |
| 24 | **指针旋转点阵地球** · [shuding/cobe](https://github.com/shuding/cobe) | pointer drag/time / inertial globe rotation / compact WebGL point globe / continuous | 专用点阵地球带地理标记与拖拽惯性；不像通用 3D 引擎示例，也不同于平面地图。Demo 用三处“信号到达”标记和一个完整半圈拖拽。 | `cobe` | 要固定 DPR 和地图采样；marker 数据可本地写死，不依赖网络。 | `17/19/18/15/15/9` → **93** |
| 25 | **电影式地图相机飞行** · [maplibre/maplibre-gl-js](https://github.com/maplibre/maplibre-gl-js) | click/timer / eased center-zoom-pitch-bearing interpolation / WebGL vector map / continuous geographic camera | 相机从世界视角沿带弧度的路径飞入城市，同时俯仰和旋转；不是普通 3D orbit。Demo 在无标签的艺术化矢量底图上飞往一个发光节点。 | `maplibre-gl` | 远程瓦片会破坏可复现性；最终必须使用本地 style/GeoJSON 或可核验且稳定的官方测试资源。 | `15/18/18/15/14/9` → **89** |
| 26 | **地球昼夜分界线延时扫过** · [CesiumGS/cesium](https://github.com/CesiumGS/cesium) | simulated time / continuous solar lighting / Cesium 3D globe / deterministic temporal continuity | 固定相机下，时间推进让晨昏线横扫地球，城市灯光在阴影侧出现；核心是时间与照明，不是地图飞行。 | `cesium` | Cesium 静态资源较大；避免 token 与商业影像依赖，使用本地可再分发底图或纯色地球。 | `18/20/18/15/15/9` → **95** |
| 27 | **可拾取挤出数据柱** · [visgl/deck.gl](https://github.com/visgl/deck.gl) | hover/drag / continuous camera + discrete picking / WebGL2 instanced columns / persistent data identity | 城市数据柱按数值高度发光，悬停时单柱升起并显示标签；不是 Canvas 图表或纯相机飞行。Demo 使用本地 36 个固定点，无底图也可看懂。 | `@deck.gl/core`, `@deck.gl/layers` | 必须用真实 picking 回调；不要靠 DOM hover 区域模拟命中。 | `16/18/18/15/14/9` → **90** |
| 28 | **弯曲三维文字环绕** · [protectwise/troika](https://github.com/protectwise/troika) | pointer/time / continuous orbit + curvature / SDF WebGL text / continuous glyph identity | 清晰 SDF 字体沿圆柱弯曲并穿过视野，字符仍可读；不同于平面曲线路径文字和 SVG 字形动画。 | `troika-three-text`, `three` | 字体文件必须本地、许可明确并等待 `sync()`；否则首帧会空白。 | `18/19/18/15/15/9` → **94** |
| 29 | **光标投射三维表面标记** · [mrdoob/three.js](https://github.com/mrdoob/three.js) | pointer / continuous raycast hit tracking / WebGL mesh + surface-normal marker / reversible | 二维光标经 raycaster 命中起伏表面，圆环沿交点法线贴合并留下短暂墨迹；不是 DOM 光标跟随或平面图像涟漪。 | `three` | 必须真正使用 `Raycaster.intersectObject` 与面法线；用屏幕坐标直接移动标记属于伪造。 | `18/18/18/15/15/10` → **94** |
| 30 | **指针扰动抖动波纹** · [React Bits Dither 源码](https://github.com/DavidHDev/react-bits/blob/main/public/r/Dither-TS-TW.json) | pointer/time / continuous local wave disturbance / WebGL ordered-dither shader / continuous loop | 连续波被量化成低色阶抖动图案，指针推开局部波面；视觉语言与流体、粒子、渐变都不同。Demo 用 4 色青紫调和明显的局部干扰半径。 | React Bits 组件依赖、`ogl`, `react` | 官方仓库 GitHub API 未给标准 SPDX；合入前必须核验组件许可。不要改写成普通 Canvas 像素网格。 | `19/19/19/15/15/9` → **96** |
| 31 | **交互式超高速公路** · [React Bits Hyperspeed 源码](https://github.com/DavidHDev/react-bits/blob/main/public/r/Hyperspeed-TS-TW.json) | pointer hold/time / speed ramp + perspective rush / WebGL road-light scene / continuous forward continuity | 车灯与道路标线从消失点冲向镜头，按住指针进入加速态；项目现有目录没有前进式速度隧道。 | React Bits 组件依赖、`three`, `postprocessing`, `react` | 源码约 48KB，依赖与 shader 较重；必须保留真实加速输入、固定相机，不可用视频替代。许可需复核。 | `20/20/20/15/15/9` → **99** |
| 32 | **程序化闪电背景** · [React Bits Lightning 源码](https://github.com/DavidHDev/react-bits/blob/main/public/r/Lightning-TS-TW.json) | time/pointer / stochastic-looking but deterministic branching / WebGL shader / looping discontinuous flashes | 一条主放电路径分叉并短促闪烁，视觉主体是电弧拓扑而非粒子爆炸。Demo 固定噪声种子与 6 秒放电节奏。 | React Bits 组件依赖、`ogl`, `react` | 需要给随机噪声可复现种子或固定时间输入；许可复核，避免癫痫风险并提供 reduced-motion 静态帧。 | `18/19/19/15/14/9` → **94** |
| 33 | **流动丝绸着色器** · [React Bits Silk 源码](https://github.com/DavidHDev/react-bits/blob/main/public/r/Silk-TS-TW.json) | time/pointer optional / continuous anisotropic folds / WebGL fragment shader / seamless loop | 明暗褶皱与细噪声共同产生织物光泽，区别于虹彩平面和抽象渐变。Demo 让指针轻微改变褶皱方向，不改变核心材质。 | React Bits 组件依赖、`three` 或 `ogl`, `react` | 只有好看背景但没有可描述交互时会降低创意/辨识度；需要主体构图和真实参数响应。许可复核。 | `18/20/18/15/15/9` → **95** |
| 34 | **可拖拽缩放音频循环区** · [katspaugh/wavesurfer.js](https://github.com/katspaugh/wavesurfer.js) | drag/click / continuous region-boundary editing + loop playback / Canvas waveform + audio / persistent time selection | 用户拖动两端改变循环区，播放头到达右端会返回左端；不同于普通媒体控制和单点 seek。Demo 用本地生成的 8 秒节奏 WAV。 | `wavesurfer.js` Regions plugin | 自动录制通常静音，因此必须让播放头、边界和回环在画面上独立可读；音频和波形均本地。 | `17/17/18/15/15/9` → **91** |
| 35 | **拖拽环视 360 全景** · [mistic100/Photo-Sphere-Viewer](https://github.com/mistic100/Photo-Sphere-Viewer) | drag/wheel / continuous spherical camera rotation / WebGL equirectangular media / reversible | 视点位于全景内部，拖拽改变观看方向而非移动平面图像。Demo 使用本项目生成且许可明确的抽象“纸雕房间”全景。 | `@photo-sphere-viewer/core` | 全景资产是主要证据；普通宽图拉伸或外部不明素材不可用。捕获需明显跨越 90° 视角。 | `16/19/18/15/15/9` → **92** |
| 36 | **流式折线图窗口推进** · [apache/echarts](https://github.com/apache/echarts) | timer/data event / continuous data-window interpolation / Canvas or SVG chart / persistent recent-history continuity | 新数据从右端进入、旧数据滑出，阈值事件让整段曲线短促变色；不是静态图表 hover。Demo 用固定遥测序列而非随机数。 | `echarts` | 使用固定数据与时间轴；仅 `setInterval(Math.random())` 不可复现，也缺乏艺术完成度。 | `15/18/18/15/14/9` → **89** |
| 37 | **手柄连线动画节点编辑器** · [xyflow/xyflow](https://github.com/xyflow/xyflow) | drag/connect / direct topology edit + animated flow / DOM/SVG graph UI / persistent graph identity | 从节点手柄拖出连线，成功连接后流光沿边移动，并触发下游节点状态；与被动力导向网络不同。Demo 做三节点“输入→模型→输出”管线。 | `@xyflow/react`, `react`, `react-dom` | 必须真实从 source handle 拖到 target handle；预先写死 SVG 连线不合格。 | `15/17/18/15/15/9` → **89** |
| 38 | **视频手部关键点叠加** · [google-ai-edge/mediapipe](https://github.com/google-ai-edge/mediapipe) | video frames / continuous model inference / video + Canvas overlay / tracked landmark identity | 手指关节随视频动作连续移动，并用骨架、指尖轨迹表达模型理解；现有目录没有从媒体内容推导交互几何的视觉效果。 | `@mediapipe/tasks-vision` | 模型和 WASM 较大；为了可复现，使用许可明确的本地短视频而非摄像头权限。必须实际运行 Hand Landmarker，不能读取预标注 JSON。 | `19/18/19/15/15/8` → **94** |

## 最推荐的 10 项

这里按“视觉签名 × 可稳定本地录制 × 对用户描述特效的启发价值”排序，而不是单看理论总分。

| 优先级 | 候选 | 目标分 | 推荐原因 | 预计实施难度 |
| ---: | --- | ---: | --- | --- |
| 1 | 指针注入 GPU 流体 | 98 | 第一眼辨识度极高，真实交互与渲染机制一致，固定输入后可重复录制。 | 中 |
| 2 | 指针扰动抖动波纹 | 96 | 低色阶抖动是明确艺术语言，与现有所有背景机制区分明显。 | 中 |
| 3 | 涌现式粒子生命群落 | 94 | 简单规则产生复杂群体行为，适合创作者迁移到品牌叙事。 | 低—中 |
| 4 | 光标投射三维表面标记 | 94 | 能把“2D 指针怎样落到 3D 物体上”清楚可视化，且无外部资产。 | 中 |
| 5 | 滑杆控制 3D 爆炸装配 | 94 | 交互契约清晰、可逆、结构变化强，浏览器录制稳定。 | 中 |
| 6 | 指针跟随位移涟漪 | 93 | 机制明确、视觉强、依赖成熟；和现有两图切换不会混淆。 | 中 |
| 7 | SVG 滤镜黏液文字悬停 | 93 | 文字本身成为材质，适合用户描述“液滴聚成字”这类难说清的创意。 | 中 |
| 8 | 机械分瓣翻牌字符 | 89 | 低风险快速样本，进位传播让 GIF 在缩略图中也清楚。 | 低 |
| 9 | 动画手绘语义标注 | 90 | 直接围绕真实 DOM 文字工作，既艺术化又有产品叙事价值。 | 低 |
| 10 | 指针旋转点阵地球 | 93 | 无需远程地图资源即可呈现精致 3D 交互，捕获路径可控。 | 低—中 |

如果首批样本全部通过，再扩到：折射玻璃、3D 物理堆栈、Troika 弯曲文字、DOM/3D 锁步同步和 Hyperspeed。后三者视觉上限更高，但依赖、渲染和捕获复杂度也更高。

## 实施前的硬性风险处置

1. **许可不是星标数的替代品。** GitHub API 没有给出标准 SPDX 的项目（本表明确标出）必须在使用源码、样例资产或官方 GIF 前再次核验；不明确则只借鉴机制，使用本项目自写实现与自制资产。
2. **外部资产默认不进发布包。** Rive、Gaussian splat、全景、字体、HDRI、视频等都必须有可追溯许可；没有就改用程序化资产或删除候选。
3. **捕获必须执行真实输入。** drag、scroll、raycast、connect、region resize、state-machine input 都需要由自动化脚本真实触发，不能直接调用“终态”函数冒充交互。
4. **随机系统必须可复现。** Matter、Particle Life、Pts、闪电、流体等需固定种子、时间步、视口和输入轨迹。
5. **框架能力不是效果。** 每个 Demo 必须有独立艺术概念；默认立方体、默认图表、默认主题即使技术正确也不能获得表中目标分。

## 一手来源核验说明

2026-07-18 使用 GitHub API 检查了上述官方仓库的仓库状态、描述、许可字段和最近更新状态；检查时列出的仓库均未归档。React Bits 的 Dither、Hyperspeed、Lightning、Silk 还逐一核验了仓库内 `public/r/*-TS-TW.json` 源文件存在。分数仍需以本地真实 Demo、GIF、provenance 和人工视觉验收为准。
