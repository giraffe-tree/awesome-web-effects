# Awesome Web Effects

[English (default)](README.md) · [在线 Demo](https://giraffe-tree.github.io/awesome-interaction/)

一个经过双重去重、以代码为先的开源 Web 视觉效果图鉴。共收录 **10 类 120 个项目**，其中在原有 20 个基础上**新增 101 个**。Demo 为每个项目提供可复制的最小代码；英文是默认界面和默认文档语言，同时提供完整中文文档与中文界面。

## 本次更新

- 新增 101 个经 GitHub 核验的项目，不把原有 20 个计入新增数量。
- 做两层去重：先按仓库去重，再按可见效果签名 **触发方式 + 视觉变化 + 时间关系 + 页面层级** 去重。
- 同类优先保留维护更活跃、生态更强、官方示例更清楚的项目。14 个技术栈较旧但仍有参考价值的项目明确标注为“经典旧版”；最终目录不包含已归档仓库。
- 保留 19 个项目专属 GIF；其余代码优先条目使用有明确标签的抽象占位图，不拿无关素材冒充项目效果。
- GIF 总体积从 **27.28 MiB 压缩到 15.81 MiB**，减少 42.03%；720×450 尺寸、帧数、帧率和时长保持不变。
- 新增 GitHub Pages 静态发布工作流。

## 收录与去重规则

1. 效果必须能出现在普通网页中：动画、转场、绘制、2D/3D 渲染、指针响应或媒体展示。
2. 仓库必须公开且可以核验。Stars 是 **2026-07-16** 的快照，不是实时计数器。
3. 相似库只有在代表性可见结果或集成模型存在实质差异时才同时保留。
4. 重复候选中优先较新、持续维护、文档清楚的方案；只有交互范式仍然独特时才保留较旧但未归档的项目，并标注“经典旧版”。
5. 最小代码只展示最小而有用的 API 调用，不复制完整脚手架应用。

## 分类概览

| 分类 | 项目数 | 关注结果 |
| --- | ---: | --- |
| [动画引擎](#animation) | 12 | 时间线、弹簧、补间、类动画与框架原生动效。 |
| [滚动与揭示](#scroll) | 12 | 平滑滚动、滚动关联场景、进入揭示、视差与整屏吸附。 |
| [页面与布局](#transition) | 12 | 页面转场、FLIP 动画、筛选、紧密排布与布局重排。 |
| [导航与浮层](#carousel) | 12 | 轮播、灯箱、菜单、导览、通知、拖拽浮层与空间导航。 |
| [指针与悬停](#pointer) | 12 | 倾斜、景深、自定义光标、磁性运动与图像扭曲。 |
| [文本与 SVG](#vector) | 12 | 打字、文字拆分、矢量绘制、手写与 SVG 变形。 |
| [Canvas 与 2D](#canvas) | 12 | 场景图、创意编程、物理、绘图工具与 2D 渲染器。 |
| [3D 与 WebGL](#webgl) | 12 | 3D 引擎、声明式渲染器、着色器图层与后期处理。 |
| [背景与粒子](#background) | 12 | 流体、粒子、渐变、彩纸、网格、丝带与烟花。 |
| [媒体与图像](#media) | 12 | 前后对比、平移缩放、裁剪、滤镜、镜头放大与着色器转场。 |

## 项目目录

<a id="animation"></a>

### 动画引擎

时间线、弹簧、补间、类动画与框架原生动效。

| 项目 | 可见效果 | Stars | 状态 | 最小代码 |
| --- | --- | ---: | --- | --- |
| [GSAP](https://github.com/greensock/GSAP) | 滚动擦洗主时间线 | 26,600 | 原有 | [打开](https://giraffe-tree.github.io/awesome-interaction/#gsap-scrolltrigger) |
| [Motion](https://github.com/motiondivision/motion) | 共享布局弹簧变形 | 32,819 | 原有 | [打开](https://giraffe-tree.github.io/awesome-interaction/#motion) |
| [Anime.js](https://github.com/juliangarnier/anime) | 交错变换编排 | 71,056 | 新增 | [打开](https://giraffe-tree.github.io/awesome-interaction/#juliangarnier-anime) |
| [Tween.js](https://github.com/tweenjs/tween.js) | 与渲染器无关的数值补间 | 10,129 | 新增 | [打开](https://giraffe-tree.github.io/awesome-interaction/#tweenjs-tween-js) |
| [Mo.js](https://github.com/mojs/mojs) | 动态图形爆发 | 18,728 | 新增 | [打开](https://giraffe-tree.github.io/awesome-interaction/#mojs-mojs) |
| [Theatre.js](https://github.com/theatre-js/theatre) | 可视化编排关键帧序列 | 12,541 | 新增 | [打开](https://giraffe-tree.github.io/awesome-interaction/#theatre-js-theatre) |
| [Popmotion](https://github.com/Popmotion/popmotion) | 函数式数值管线 | 20,167 | 新增 | [打开](https://giraffe-tree.github.io/awesome-interaction/#popmotion-popmotion) |
| [React Spring](https://github.com/pmndrs/react-spring) | Hook 驱动弹簧动画 | 29,127 | 新增 | [打开](https://giraffe-tree.github.io/awesome-interaction/#pmndrs-react-spring) |
| [KUTE.js](https://github.com/thednp/kute.js) | 轻量 SVG 形状补间 | 2,639 | 新增 | [打开](https://giraffe-tree.github.io/awesome-interaction/#thednp-kute-js) |
| [VueUse Motion](https://github.com/vueuse/motion) | Vue 指令式动效状态 | 2,753 | 新增 | [打开](https://giraffe-tree.github.io/awesome-interaction/#vueuse-motion) |
| [Animate.css](https://github.com/animate-css/animate.css) | CSS 类进入动画 | 82,667 | 新增 | [打开](https://giraffe-tree.github.io/awesome-interaction/#animate-css-animate-css) |
| [Rive Web](https://github.com/rive-app/rive-wasm) | 交互式矢量状态机 | 954 | 新增 | [打开](https://giraffe-tree.github.io/awesome-interaction/#rive-app-rive-wasm) |

<a id="scroll"></a>

### 滚动与揭示

平滑滚动、滚动关联场景、进入揭示、视差与整屏吸附。

| 项目 | 可见效果 | Stars | 状态 | 最小代码 |
| --- | --- | ---: | --- | --- |
| [Lenis](https://github.com/darkroomengineering/lenis) | 兼容原生语义的惯性滚动 | 14,373 | 原有 | [打开](https://giraffe-tree.github.io/awesome-interaction/#lenis) |
| [Scrollama](https://github.com/russellsamora/scrollama) | 分步滚动叙事 | 5,985 | 原有 | [打开](https://giraffe-tree.github.io/awesome-interaction/#scrollama) |
| [AOS](https://github.com/michalsnik/aos) | 数据属性视口揭示 | 28,069 | 原有 | [打开](https://giraffe-tree.github.io/awesome-interaction/#aos) |
| [Locomotive Scroll](https://github.com/locomotivemtl/locomotive-scroll) | 数据驱动滚动变换 | 8,825 | 新增 | [打开](https://giraffe-tree.github.io/awesome-interaction/#locomotivemtl-locomotive-scroll) |
| [Smooth Scrollbar](https://github.com/dolphin-wood/smooth-scrollbar) | 惯性自定义滚动容器 | 3,354 | 新增 | [打开](https://giraffe-tree.github.io/awesome-interaction/#dolphin-wood-smooth-scrollbar) |
| [r3f-scroll-rig](https://github.com/14islands/r3f-scroll-rig) | DOM 与 3D 滚动同步 | 954 | 新增 | [打开](https://giraffe-tree.github.io/awesome-interaction/#14islands-r3f-scroll-rig) |
| [scroll-into-view-if-needed](https://github.com/scroll-into-view/scroll-into-view-if-needed) | 按需聚焦目标滚动 | 1,449 | 新增 | [打开](https://giraffe-tree.github.io/awesome-interaction/#scroll-into-view-scroll-into-view-if-needed) |
| [SimpleBar](https://github.com/Grsmto/simplebar) | 保留原生滚动的样式化滚动条 | 6,411 | 新增 | [打开](https://giraffe-tree.github.io/awesome-interaction/#grsmto-simplebar) |
| [TanStack Virtual](https://github.com/TanStack/virtual) | 窗口化百万行滚动 | 7,004 | 新增 | [打开](https://giraffe-tree.github.io/awesome-interaction/#tanstack-virtual) |
| [Infinite Scroll](https://github.com/metafizzy/infinite-scroll) | 到达阈值追加连续信息流 | 7,483 | 新增 | [打开](https://giraffe-tree.github.io/awesome-interaction/#metafizzy-infinite-scroll) |
| [fullPage.js](https://github.com/alvarotrigo/fullPage.js) | 全屏分区吸附 | 35,422 | 新增 | [打开](https://giraffe-tree.github.io/awesome-interaction/#alvarotrigo-fullpage-js) |
| [multiScroll.js](https://github.com/alvarotrigo/multiscroll.js) | 反向移动分屏面板 | 1,572 | 经典旧版 | [打开](https://giraffe-tree.github.io/awesome-interaction/#alvarotrigo-multiscroll-js) |

<a id="transition"></a>

### 页面与布局

页面转场、FLIP 动画、筛选、紧密排布与布局重排。

| 项目 | 可见效果 | Stars | 状态 | 最小代码 |
| --- | --- | ---: | --- | --- |
| [Swup](https://github.com/swup/swup) | 渐进增强页面替换 | 5,198 | 新增 | [打开](https://giraffe-tree.github.io/awesome-interaction/#swup-swup) |
| [Isotope](https://github.com/metafizzy/isotope) | 可筛选网格重排 | 11,103 | 经典旧版 | [打开](https://giraffe-tree.github.io/awesome-interaction/#isotope) |
| [AutoAnimate](https://github.com/FormKit/auto-animate) | 一行调用 DOM 重排动画 | 13,875 | 新增 | [打开](https://giraffe-tree.github.io/awesome-interaction/#formkit-auto-animate) |
| [React Flip Toolkit](https://github.com/aholachek/react-flip-toolkit) | FLIP 共享元素转场 | 4,189 | 新增 | [打开](https://giraffe-tree.github.io/awesome-interaction/#aholachek-react-flip-toolkit) |
| [Muuri](https://github.com/haltu/muuri) | 可拖拽紧密网格 | 10,949 | 新增 | [打开](https://giraffe-tree.github.io/awesome-interaction/#haltu-muuri) |
| [Masonry](https://github.com/desandro/masonry) | 列式瀑布流布局 | 16,710 | 新增 | [打开](https://giraffe-tree.github.io/awesome-interaction/#desandro-masonry) |
| [Packery](https://github.com/metafizzy/packery) | 填补空隙的装箱布局 | 4,316 | 新增 | [打开](https://giraffe-tree.github.io/awesome-interaction/#metafizzy-packery) |
| [React Transition Group](https://github.com/reactjs/react-transition-group) | 组件进出状态机 | 10,234 | 新增 | [打开](https://giraffe-tree.github.io/awesome-interaction/#reactjs-react-transition-group) |
| [Vaul](https://github.com/emilkowalski/vaul) | 速度感知滑动抽屉 | 8,479 | 新增 | [打开](https://giraffe-tree.github.io/awesome-interaction/#emilkowalski-vaul) |
| [GridStack](https://github.com/gridstack/gridstack.js) | 拖拽缩放仪表盘碰撞重排 | 8,994 | 新增 | [打开](https://giraffe-tree.github.io/awesome-interaction/#gridstack-gridstack-js) |
| [Split.js](https://github.com/nathancahill/split) | 可拖拽分栏尺寸调整 | 6,277 | 新增 | [打开](https://giraffe-tree.github.io/awesome-interaction/#nathancahill-split) |
| [next-view-transitions](https://github.com/shuding/next-view-transitions) | 原生跨路由共享元素变形 | 2,385 | 新增 | [打开](https://giraffe-tree.github.io/awesome-interaction/#shuding-next-view-transitions) |

<a id="carousel"></a>

### 导航与浮层

轮播、灯箱、菜单、导览、通知、拖拽浮层与空间导航。

| 项目 | 可见效果 | Stars | 状态 | 最小代码 |
| --- | --- | ---: | --- | --- |
| [Swiper](https://github.com/nolimits4web/swiper) | 惯性触摸轮播 | 41,869 | 原有 | [打开](https://giraffe-tree.github.io/awesome-interaction/#swiper) |
| [PhotoSwipe](https://github.com/dimsemenov/PhotoSwipe) | 缩略图到灯箱缩放 | 25,215 | 原有 | [打开](https://giraffe-tree.github.io/awesome-interaction/#photoswipe) |
| [mmenu.js](https://github.com/FrDH/mmenu-js) | 嵌套式画布外导航面板 | 2,574 | 新增 | [打开](https://giraffe-tree.github.io/awesome-interaction/#frdh-mmenu-js) |
| [Driver.js](https://github.com/nilbuild/driver.js) | 焦点交接式聚光导览 | 26,283 | 新增 | [打开](https://giraffe-tree.github.io/awesome-interaction/#nilbuild-driver-js) |
| [SweetAlert2](https://github.com/sweetalert2/sweetalert2) | 动画无障碍模态提示 | 18,099 | 新增 | [打开](https://giraffe-tree.github.io/awesome-interaction/#sweetalert2-sweetalert2) |
| [cmdk](https://github.com/dip/cmdk) | 筛选式命令面板浮层 | 12,799 | 新增 | [打开](https://giraffe-tree.github.io/awesome-interaction/#dip-cmdk) |
| [react-hot-toast](https://github.com/timolins/react-hot-toast) | 堆叠可关闭通知队列 | 10,956 | 新增 | [打开](https://giraffe-tree.github.io/awesome-interaction/#timolins-react-hot-toast) |
| [Floating UI](https://github.com/floating-ui/floating-ui) | 锚点浮层翻转与位移 | 32,665 | 新增 | [打开](https://giraffe-tree.github.io/awesome-interaction/#floating-ui-floating-ui) |
| [React Menu](https://github.com/szhsin/react-menu) | 嵌套菜单与子菜单转场 | 1,218 | 新增 | [打开](https://giraffe-tree.github.io/awesome-interaction/#szhsin-react-menu) |
| [dnd kit](https://github.com/clauderic/dnd-kit) | 拖拽浮层与落点预览 | 17,408 | 新增 | [打开](https://giraffe-tree.github.io/awesome-interaction/#clauderic-dnd-kit) |
| [use-gesture](https://github.com/pmndrs/use-gesture) | 带边界的弹簧拖拽与捏合 | 9,620 | 新增 | [打开](https://giraffe-tree.github.io/awesome-interaction/#pmndrs-use-gesture) |
| [reveal.js](https://github.com/hakimel/reveal.js) | 空间化演示文稿导航 | 71,936 | 新增 | [打开](https://giraffe-tree.github.io/awesome-interaction/#hakimel-reveal-js) |

<a id="pointer"></a>

### 指针与悬停

倾斜、景深、自定义光标、磁性运动与图像扭曲。

| 项目 | 可见效果 | Stars | 状态 | 最小代码 |
| --- | --- | ---: | --- | --- |
| [Parallax.js](https://github.com/wagerfield/parallax) | 指针驱动图层景深 | 16,583 | 原有 | [打开](https://giraffe-tree.github.io/awesome-interaction/#parallax) |
| [vanilla-tilt.js](https://github.com/micku7zu/vanilla-tilt.js) | 透视倾斜与高光 | 4,019 | 原有 | [打开](https://giraffe-tree.github.io/awesome-interaction/#vanilla-tilt) |
| [mouse-follower](https://github.com/Cuberto/mouse-follower) | 情境感知自定义光标 | 818 | 原有 | [打开](https://giraffe-tree.github.io/awesome-interaction/#mouse-follower) |
| [hover-effect](https://github.com/robin-dela/hover-effect) | 位移贴图图像悬停 | 1,874 | 原有 | [打开](https://giraffe-tree.github.io/awesome-interaction/#hover-effect) |
| [Hover.css](https://github.com/IanLunn/Hover) | 可复用 CSS 悬停词汇 | 29,395 | 新增 | [打开](https://giraffe-tree.github.io/awesome-interaction/#ianlunn-hover) |
| [cursor-effects](https://github.com/tholman/cursor-effects) | 尾随光标粒子 | 4,013 | 新增 | [打开](https://giraffe-tree.github.io/awesome-interaction/#tholman-cursor-effects) |
| [fake3d](https://github.com/akella/fake3d) | 深度图人像视差 | 545 | 经典旧版 | [打开](https://giraffe-tree.github.io/awesome-interaction/#akella-fake3d) |
| [Magnetic Buttons](https://github.com/codrops/MagneticButtons) | 指针吸引按钮运动 | 485 | 经典旧版 | [打开](https://giraffe-tree.github.io/awesome-interaction/#codrops-magneticbuttons) |
| [Direction-Aware Hover](https://github.com/codrops/DirectionAwareHoverEffect) | 按接近方向进入的遮罩 | 393 | 经典旧版 | [打开](https://giraffe-tree.github.io/awesome-interaction/#codrops-directionawarehovereffect) |
| [Gooey Text Hover](https://github.com/codrops/GooeyTextHoverEffect) | SVG 滤镜黏液文字悬停 | 155 | 新增 | [打开](https://giraffe-tree.github.io/awesome-interaction/#codrops-gooeytexthovereffect) |
| [Interactive Points](https://github.com/codrops/InteractivePoints) | 热点揭示图像区域 | 302 | 经典旧版 | [打开](https://giraffe-tree.github.io/awesome-interaction/#codrops-interactivepoints) |
| [Stack Motion Hover](https://github.com/codrops/StackMotionHoverEffects) | 展开式彩色卡片堆栈 | 499 | 经典旧版 | [打开](https://giraffe-tree.github.io/awesome-interaction/#codrops-stackmotionhovereffects) |

<a id="vector"></a>

### 文本与 SVG

打字、文字拆分、矢量绘制、手写与 SVG 变形。

| 项目 | 可见效果 | Stars | 状态 | 最小代码 |
| --- | --- | ---: | --- | --- |
| [Vivus](https://github.com/maxwellito/vivus) | SVG 描边绘制 | 15,479 | 经典旧版 | [打开](https://giraffe-tree.github.io/awesome-interaction/#vivus) |
| [lottie-web](https://github.com/airbnb/lottie-web) | After Effects 矢量播放 | 32,014 | 原有 | [打开](https://giraffe-tree.github.io/awesome-interaction/#lottie-web) |
| [Typed.js](https://github.com/mattboldt/typed.js) | 循环打字序列 | 16,283 | 新增 | [打开](https://giraffe-tree.github.io/awesome-interaction/#mattboldt-typed-js) |
| [Splitting](https://github.com/shshaw/Splitting) | 文本拆字符 CSS 变量 | 1,755 | 新增 | [打开](https://giraffe-tree.github.io/awesome-interaction/#shshaw-splitting) |
| [Blotter](https://github.com/bradley/Blotter) | 着色器处理字体 | 3,076 | 经典旧版 | [打开](https://giraffe-tree.github.io/awesome-interaction/#bradley-blotter) |
| [use-scramble](https://github.com/tol-is/use-scramble) | 随机解码文本揭示 | 143 | 新增 | [打开](https://giraffe-tree.github.io/awesome-interaction/#tol-is-use-scramble) |
| [SVG.js](https://github.com/svgdotjs/svg.js) | 流式 SVG 场景动画 | 11,802 | 新增 | [打开](https://giraffe-tree.github.io/awesome-interaction/#svgdotjs-svg-js) |
| [Rough.js](https://github.com/rough-stuff/rough) | 手绘感矢量渲染 | 21,074 | 新增 | [打开](https://giraffe-tree.github.io/awesome-interaction/#rough-stuff-rough) |
| [Vara](https://github.com/akzhy/Vara) | 手写路径字形 | 289 | 新增 | [打开](https://giraffe-tree.github.io/awesome-interaction/#akzhy-vara) |
| [smart-ticker](https://github.com/tombcato/smart-ticker) | 字符差异文本转场 | 165 | 新增 | [打开](https://giraffe-tree.github.io/awesome-interaction/#tombcato-smart-ticker) |
| [Flip](https://github.com/pqina/flip) | 机械翻牌字符变化 | 1,018 | 新增 | [打开](https://giraffe-tree.github.io/awesome-interaction/#pqina-flip) |
| [Flubber](https://github.com/veltman/flubber) | 拓扑安全 SVG 形状变形 | 6,923 | 新增 | [打开](https://giraffe-tree.github.io/awesome-interaction/#veltman-flubber) |

<a id="canvas"></a>

### Canvas 与 2D

场景图、创意编程、物理、绘图工具与 2D 渲染器。

| 项目 | 可见效果 | Stars | 状态 | 最小代码 |
| --- | --- | ---: | --- | --- |
| [PixiJS](https://github.com/pixijs/pixijs) | GPU 加速 2D 场景图 | 47,790 | 新增 | [打开](https://giraffe-tree.github.io/awesome-interaction/#pixijs-pixijs) |
| [p5.js](https://github.com/processing/p5.js) | 草图式创意编程循环 | 23,797 | 新增 | [打开](https://giraffe-tree.github.io/awesome-interaction/#processing-p5-js) |
| [Paper.js](https://github.com/paperjs/paper.js) | Canvas 上的矢量几何 | 15,061 | 新增 | [打开](https://giraffe-tree.github.io/awesome-interaction/#paperjs-paper-js) |
| [Fabric.js](https://github.com/fabricjs/fabric.js) | 交互式对象画布 | 31,321 | 新增 | [打开](https://giraffe-tree.github.io/awesome-interaction/#fabricjs-fabric-js) |
| [Konva](https://github.com/konvajs/konva) | 分层可拖拽 Canvas 节点 | 14,619 | 新增 | [打开](https://giraffe-tree.github.io/awesome-interaction/#konvajs-konva) |
| [Two.js](https://github.com/jonobr1/two.js) | 跨渲染器 2D 图元 | 8,643 | 新增 | [打开](https://giraffe-tree.github.io/awesome-interaction/#jonobr1-two-js) |
| [EaselJS](https://github.com/CreateJS/EaselJS) | 显示列表 Canvas 动画 | 8,169 | 新增 | [打开](https://giraffe-tree.github.io/awesome-interaction/#createjs-easeljs) |
| [Phaser](https://github.com/phaserjs/phaser) | 浏览器游戏场景生命周期 | 39,960 | 新增 | [打开](https://giraffe-tree.github.io/awesome-interaction/#phaserjs-phaser) |
| [Matter.js](https://github.com/liabru/matter-js) | 网页刚体物理 | 18,321 | 新增 | [打开](https://giraffe-tree.github.io/awesome-interaction/#liabru-matter-js) |
| [Pts](https://github.com/williamngan/pts) | 基于点的生成式几何 | 5,336 | 新增 | [打开](https://giraffe-tree.github.io/awesome-interaction/#williamngan-pts) |
| [Zdog](https://github.com/metafizzy/zdog) | 伪 3D 扁平插画 | 10,634 | 新增 | [打开](https://giraffe-tree.github.io/awesome-interaction/#metafizzy-zdog) |
| [tldraw](https://github.com/tldraw/tldraw) | 无限协作绘图画布 | 48,780 | 新增 | [打开](https://giraffe-tree.github.io/awesome-interaction/#tldraw-tldraw) |

<a id="webgl"></a>

### 3D 与 WebGL

3D 引擎、声明式渲染器、着色器图层与后期处理。

| 项目 | 可见效果 | Stars | 状态 | 最小代码 |
| --- | --- | ---: | --- | --- |
| [react-three-fiber](https://github.com/pmndrs/react-three-fiber) | 声明式 React 3D 场景 | 31,433 | 原有 | [打开](https://giraffe-tree.github.io/awesome-interaction/#react-three-fiber) |
| [three.js](https://github.com/mrdoob/three.js) | 通用 WebGL 场景图 | 113,755 | 新增 | [打开](https://giraffe-tree.github.io/awesome-interaction/#mrdoob-three-js) |
| [Babylon.js](https://github.com/BabylonJS/Babylon.js) | 功能齐全 3D 引擎 | 25,806 | 新增 | [打开](https://giraffe-tree.github.io/awesome-interaction/#babylonjs-babylon-js) |
| [PlayCanvas Engine](https://github.com/playcanvas/engine) | 实体组件 3D 运行时 | 16,245 | 新增 | [打开](https://giraffe-tree.github.io/awesome-interaction/#playcanvas-engine) |
| [OGL](https://github.com/oframe/ogl) | 极简 WebGL 抽象 | 4,582 | 新增 | [打开](https://giraffe-tree.github.io/awesome-interaction/#oframe-ogl) |
| [regl](https://github.com/regl-project/regl) | 函数式 WebGL 绘制命令 | 5,557 | 新增 | [打开](https://giraffe-tree.github.io/awesome-interaction/#regl-project-regl) |
| [Curtains.js](https://github.com/martinlaxenaire/curtainsjs) | 与 DOM 同步的着色器平面 | 1,823 | 新增 | [打开](https://giraffe-tree.github.io/awesome-interaction/#martinlaxenaire-curtainsjs) |
| [<model-viewer>](https://github.com/google/model-viewer) | 无障碍交互式 3D 商品查看 | 8,161 | 新增 | [打开](https://giraffe-tree.github.io/awesome-interaction/#google-model-viewer) |
| [A-Frame](https://github.com/aframevr/aframe) | 声明式 HTML 3D 场景 | 17,586 | 新增 | [打开](https://giraffe-tree.github.io/awesome-interaction/#aframevr-aframe) |
| [TresJS](https://github.com/Tresjs/tres) | Vue 声明式 Three.js | 3,625 | 新增 | [打开](https://giraffe-tree.github.io/awesome-interaction/#tresjs-tres) |
| [Threlte](https://github.com/threlte/threlte) | Svelte 声明式 Three.js | 3,300 | 新增 | [打开](https://giraffe-tree.github.io/awesome-interaction/#threlte-threlte) |
| [postprocessing](https://github.com/pmndrs/postprocessing) | 合并式实时辉光后期 | 2,811 | 新增 | [打开](https://giraffe-tree.github.io/awesome-interaction/#pmndrs-postprocessing) |

<a id="background"></a>

### 背景与粒子

流体、粒子、渐变、彩纸、网格、丝带与烟花。

| 项目 | 可见效果 | Stars | 状态 | 最小代码 |
| --- | --- | ---: | --- | --- |
| [WebGL Fluid Simulation](https://github.com/PavelDoGreat/WebGL-Fluid-Simulation) | 指针注入 GPU 流体 | 16,493 | 原有 | [打开](https://giraffe-tree.github.io/awesome-interaction/#webgl-fluid) |
| [tsParticles](https://github.com/tsparticles/tsparticles) | 可配置响应式粒子场 | 8,920 | 原有 | [打开](https://giraffe-tree.github.io/awesome-interaction/#tsparticles) |
| [Vanta](https://github.com/tengbao/vanta) | 即插即用 WebGL 动态背景 | 6,608 | 新增 | [打开](https://giraffe-tree.github.io/awesome-interaction/#tengbao-vanta) |
| [canvas-confetti](https://github.com/catdad/canvas-confetti) | 事件触发彩纸爆发 | 12,648 | 新增 | [打开](https://giraffe-tree.github.io/awesome-interaction/#catdad-canvas-confetti) |
| [Granim.js](https://github.com/sarcadass/granim.js) | 动态渐变状态转场 | 5,304 | 经典旧版 | [打开](https://giraffe-tree.github.io/awesome-interaction/#sarcadass-granim-js) |
| [Trianglify](https://github.com/qrohlf/trianglify) | 程序化低多边形网格 | 10,089 | 新增 | [打开](https://giraffe-tree.github.io/awesome-interaction/#qrohlf-trianglify) |
| [Fireworks.js](https://github.com/crashmax-dev/fireworks-js) | 交互式烟花场 | 1,380 | 新增 | [打开](https://giraffe-tree.github.io/awesome-interaction/#crashmax-dev-fireworks-js) |
| [ribbon.js](https://github.com/hustcc/ribbon.js) | 程序化丝带轨迹 | 237 | 经典旧版 | [打开](https://giraffe-tree.github.io/awesome-interaction/#hustcc-ribbon-js) |
| [Flat Surface Shader](https://github.com/wagerfield/flat-surface-shader) | 带光照低多边形曲面 | 2,469 | 经典旧版 | [打开](https://giraffe-tree.github.io/awesome-interaction/#wagerfield-flat-surface-shader) |
| [CSS Doodle](https://github.com/css-doodle/css-doodle) | 生成式 CSS 网格图案动画 | 6,020 | 新增 | [打开](https://giraffe-tree.github.io/awesome-interaction/#css-doodle-css-doodle) |
| [shader-web-background](https://github.com/xemantic/shader-web-background) | 全页片段着色器背景 | 280 | 新增 | [打开](https://giraffe-tree.github.io/awesome-interaction/#xemantic-shader-web-background) |
| [Particle Life](https://github.com/hunar4321/particle-life) | 涌现式吸引排斥粒子群 | 3,343 | 新增 | [打开](https://giraffe-tree.github.io/awesome-interaction/#hunar4321-particle-life) |

<a id="media"></a>

### 媒体与图像

前后对比、平移缩放、裁剪、滤镜、镜头放大与着色器转场。

| 项目 | 可见效果 | Stars | 状态 | 最小代码 |
| --- | --- | ---: | --- | --- |
| [img-comparison-slider](https://github.com/sneas/img-comparison-slider) | 拖拽揭示图像对比 | 864 | 原有 | [打开](https://giraffe-tree.github.io/awesome-interaction/#img-comparison-slider) |
| [GL Transitions](https://github.com/gl-transitions/gl-transitions) | 可复用 GLSL 媒体转场 | 2,115 | 原有 | [打开](https://giraffe-tree.github.io/awesome-interaction/#gl-transitions) |
| [medium-zoom](https://github.com/francoischalifour/medium-zoom) | 行内图片聚焦缩放 | 3,936 | 新增 | [打开](https://giraffe-tree.github.io/awesome-interaction/#francoischalifour-medium-zoom) |
| [Panzoom](https://github.com/timmywil/panzoom) | 指针平移与捏合缩放 | 2,440 | 新增 | [打开](https://giraffe-tree.github.io/awesome-interaction/#timmywil-panzoom) |
| [OpenSeadragon](https://github.com/openseadragon/openseadragon) | 深度缩放切片图像 | 3,479 | 新增 | [打开](https://giraffe-tree.github.io/awesome-interaction/#openseadragon-openseadragon) |
| [Cropper.js](https://github.com/fengyuanchen/cropperjs) | 交互式图像裁剪变换 | 13,857 | 新增 | [打开](https://giraffe-tree.github.io/awesome-interaction/#fengyuanchen-cropperjs) |
| [Drift](https://github.com/strawdynamics/drift) | 电商镜头放大 | 1,562 | 新增 | [打开](https://giraffe-tree.github.io/awesome-interaction/#strawdynamics-drift) |
| [CamanJS](https://github.com/meltingice/CamanJS) | 可链式 Canvas 照片滤镜 | 3,571 | 经典旧版 | [打开](https://giraffe-tree.github.io/awesome-interaction/#meltingice-camanjs) |
| [glfx.js](https://github.com/evanw/glfx.js) | GPU 图像滤镜画布 | 3,449 | 经典旧版 | [打开](https://giraffe-tree.github.io/awesome-interaction/#evanw-glfx-js) |
| [FilePond](https://github.com/pqina/filepond) | 拖拽上传图片预览转场 | 16,382 | 新增 | [打开](https://giraffe-tree.github.io/awesome-interaction/#pqina-filepond) |
| [TUI Image Editor](https://github.com/nhn/tui.image-editor) | 完整图像编辑画布工作区 | 7,660 | 新增 | [打开](https://giraffe-tree.github.io/awesome-interaction/#nhn-tui-image-editor) |
| [Media Chrome](https://github.com/muxinc/media-chrome) | 响应式自定义媒体控制条 | 2,710 | 新增 | [打开](https://giraffe-tree.github.io/awesome-interaction/#muxinc-media-chrome) |

## Demo

Demo 只使用静态 HTML、CSS、JavaScript 模块和 GIF，无第三方运行依赖。它支持搜索、分类筛选、排序、中英文切换、项目直达锚点和代码复制。

```bash
python3 -m http.server 4173 --directory demo
```

打开 [http://localhost:4173](http://localhost:4173)。目录使用 ES Module，因此需要本地 HTTP 服务，不能直接双击文件运行。

## GIF 压缩

从原始 GIF 运行可复现的压缩脚本：

```bash
./scripts/optimize-gifs.sh
```

脚本使用自适应 128 色调色板、Bayer 抖动与差异矩形编码。只有候选文件更小时才替换源文件，并强制核验尺寸、时长、帧率与帧数。调色板缩减属于感知压缩；如果以后需要重新编码，应在优化输出之外保留原始素材。

## GitHub Pages

可以。Demo 完全静态且只使用相对路径，适合 GitHub Pages。仓库内工作流会在推送到 `main` 后发布 `demo/`，也支持手动运行。首次部署前需要在 **Settings → Pages → Source** 选择 **GitHub Actions**。详见 [中文部署说明](docs/GITHUB_PAGES.zh-CN.md)。

预计地址：[https://giraffe-tree.github.io/awesome-interaction/](https://giraffe-tree.github.io/awesome-interaction/)

## 维护目录

- 修改唯一数据源 `demo/data/projects.js`。
- 运行 `node scripts/build-docs.mjs` 同步生成两份 README。
- 提交前运行 `node scripts/validate.mjs`。
- 始终区分真实项目 GIF 与代码优先占位图。

GIF 与项目名称仅用于研究、索引和比较，权利归各自作者所有。
