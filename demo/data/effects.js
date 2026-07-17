import { additionalEffectSeeds } from './additional-effects.js';

export const snapshotDate = '2026-07-17';

export const categories = [
  { id: 'animation', label: 'Motion & choreography', labelZh: '动画与编排', description: 'Timelines, springs, tweens, class animation, and framework-native motion.', descriptionZh: '时间线、弹簧、补间、类动画与框架原生动效。' },
  { id: 'scroll', label: 'Scroll & reveal', labelZh: '滚动与揭示', description: 'Smooth scrolling, scroll-linked scenes, reveals, parallax, and snap navigation.', descriptionZh: '平滑滚动、滚动关联场景、进入揭示、视差与整屏吸附。' },
  { id: 'transition', label: 'Page & layout', labelZh: '页面与布局', description: 'Page transitions, FLIP motion, filtering, packing, and animated reflow.', descriptionZh: '页面转场、FLIP 动画、筛选、紧密排布与布局重排。' },
  { id: 'carousel', label: 'Navigation & overlays', labelZh: '导航与浮层', description: 'Carousel, lightbox, menus, tours, notifications, drag overlays, and spatial navigation.', descriptionZh: '轮播、灯箱、菜单、导览、通知、拖拽浮层与空间导航。' },
  { id: 'pointer', label: 'Pointer & hover', labelZh: '指针与悬停', description: 'Tilt, depth, custom cursors, magnetic motion, and image distortion.', descriptionZh: '倾斜、景深、自定义光标、磁性运动与图像扭曲。' },
  { id: 'vector', label: 'Text & SVG', labelZh: '文本与 SVG', description: 'Typing, text splitting, vector drawing, handwriting, and SVG morphing.', descriptionZh: '打字、文字拆分、矢量绘制、手写与 SVG 变形。' },
  { id: 'canvas', label: 'Canvas & 2D', labelZh: 'Canvas 与 2D', description: 'Scene graphs, creative coding, physics, drawing tools, and 2D renderers.', descriptionZh: '场景图、创意编程、物理、绘图工具与 2D 渲染器。' },
  { id: 'webgl', label: '3D & WebGL', labelZh: '3D 与 WebGL', description: '3D engines, declarative renderers, shader layers, and post-processing.', descriptionZh: '3D 引擎、声明式渲染器、着色器图层与后期处理。' },
  { id: 'background', label: 'Background & particles', labelZh: '背景与粒子', description: 'Fluid, particles, gradients, confetti, meshes, ribbons, and fireworks.', descriptionZh: '流体、粒子、渐变、彩纸、网格、丝带与烟花。' },
  { id: 'media', label: 'Media & image', labelZh: '媒体与图像', description: 'Comparison, pan-and-zoom, cropping, filters, lens zoom, and shader transitions.', descriptionZh: '前后对比、平移缩放、裁剪、滤镜、镜头放大与着色器转场。' }
];

const code = (...lines) => lines.join('\n');
const slugify = value => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const projectRegistry = new Map();

const previewOrigins = {
  aos: ['editorial-recreation', 'https://michalsnik.github.io/aos/'],
  'gl-transitions': ['editorial-recreation', 'https://gl-transitions.com/'],
  'gsap-scrolltrigger': ['editorial-recreation', 'https://gsap.com/scrolltrigger/'],
  'hover-effect': ['official-capture', 'https://github.com/robin-dela/hover-effect/blob/master/gifs/alex_brown.gif'],
  'img-comparison-slider': ['official-capture', 'https://github.com/sneas/img-comparison-slider/blob/master/docs/example.gif'],
  isotope: ['editorial-recreation', 'https://isotope.metafizzy.co/'],
  lenis: ['official-capture', 'https://assets.darkroom.engineering/lenis/banner.gif'],
  'lottie-web': ['official-capture', 'https://github.com/airbnb/lottie-web/blob/master/gifs/Example1.gif'],
  motion: ['editorial-recreation', 'https://motion.dev/docs'],
  'mouse-follower': ['official-capture', 'https://user-images.githubusercontent.com/11841379/162477170-5dd33ecd-0e72-4fe4-9053-53d7b5557637.gif'],
  parallax: ['editorial-recreation', 'http://wagerfield.github.io/parallax/'],
  photoswipe: ['editorial-recreation', 'https://photoswipe.com/getting-started/'],
  'react-three-fiber': ['official-capture', 'https://github.com/pmndrs/react-three-fiber/blob/master/docs/basic-app.gif'],
  scrollama: ['official-capture', 'https://pudding.cool/process/how-to-implement-scrollytelling/'],
  swiper: ['editorial-recreation', 'https://swiperjs.com/demos'],
  tsparticles: ['official-capture', 'https://github.com/tsparticles/tsparticles/blob/main/demo/vanilla/public/images/gifs/connect.gif'],
  'vanilla-tilt': ['editorial-recreation', 'https://micku7zu.github.io/vanilla-tilt.js/'],
  vivus: ['editorial-recreation', 'https://github.com/maxwellito/vivus#principles'],
  'webgl-fluid': ['editorial-recreation', 'https://paveldogreat.github.io/WebGL-Fluid-Simulation/']
};

const inferBehavior = (name, category) => {
  const value = name.toLowerCase();
  const trigger = category === 'scroll' || /scroll|viewport|scrollytelling/.test(value) ? 'scroll'
    : /hover|pointer|cursor|tilt|drag|swipe|pinch|magnetic|hotspot/.test(value) ? 'pointer or touch'
      : /modal|toast|drawer|menu|command|lightbox|upload|crop|comparison/.test(value) ? 'user action'
        : /entrance|reveal|drawing|typewriter|playback|decode/.test(value) ? 'mount or viewport entry'
          : 'state change or animation frame';
  const timing = /scrub|scroll|parallax/.test(value) ? 'continuous progress-linked'
    : /spring|physics|inertia|momentum/.test(value) ? 'spring or physics-based'
      : /stagger|sequence|timeline/.test(value) ? 'sequenced'
        : /loop|field|background|particle|fluid|firework/.test(value) ? 'continuous loop'
          : 'eased transition';
  const layer = category === 'background' ? 'background'
    : category === 'carousel' || /modal|toast|drawer|menu|popover|lightbox/.test(value) ? 'overlay or navigation'
      : category === 'canvas' ? 'canvas or 2D surface'
        : category === 'webgl' ? '3D or WebGL surface'
          : category === 'media' ? 'media surface'
            : 'content';
  return { trigger, response: name, timing, layer };
};

const buildPrompt = ({ name, nameZh, category, behavior, project, snippet }) => `Implement the "${name}" (${nameZh}) web interaction effect in the current project.

Use ${project.name} (${project.repo}) as the recommended implementation unless the existing stack makes a dependency-free equivalent more appropriate. Recreate this specific ${category} interaction, not a generic animation.

Interaction contract:
- Trigger: ${behavior.trigger}
- Visual response: ${behavior.response}
- Timing relationship: ${behavior.timing}
- Page layer: ${behavior.layer}

Requirements:
- Integrate with the existing design system and component structure.
- Support keyboard and touch input whenever the interaction is actionable.
- Respect prefers-reduced-motion with a clear non-animated fallback.
- Avoid layout shift, scroll traps, inaccessible focus behavior, and unnecessary dependencies.
- Keep the implementation responsive and clean up listeners, timers, and animation instances.

Start from this minimal API shape:

\`\`\`js
${snippet}
\`\`\`

Return the working code, the files changed, and a short explanation of how to tune timing, easing, distance, and reduced-motion behavior.`;

const registerProject = (name, repo, stars, options) => {
  const registryKey = repo.toLowerCase();
  if (!projectRegistry.has(registryKey)) {
    projectRegistry.set(registryKey, {
      id: slugify(repo),
      name,
      repo,
      url: `https://github.com/${repo}`,
      stars,
      addedIn: options.addedIn || (options.isNew === false ? 'baseline' : '2026-expansion'),
      legacy: options.legacy ?? false
    });
  }
  return projectRegistry.get(registryKey);
};

const effect = (projectName, repo, category, name, nameZh, stars, snippet, options = {}) => {
  const source = registerProject(projectName, repo, stars, options);
  const id = options.id || slugify(name);
  const behavior = options.behavior || inferBehavior(name, category);
  const origin = options.preview ? previewOrigins[options.preview] : null;
  return {
    id,
    category,
    name,
    nameZh,
    addedIn: options.addedIn || (options.isNew === false ? 'baseline' : '2026-expansion'),
    research: options.research || null,
    behavior,
    prompt: buildPrompt({ name, nameZh, category, behavior, project: source, snippet }),
    sources: [{
      projectId: source.id,
      recommended: true,
      snippet,
      preview: options.preview || `generated/${id}`,
      previewKind: origin?.[0] || 'editorial-recreation',
      originUrl: origin?.[1] || null,
      previewRecipe: options.preview ? null : id
    }]
  };
};

const coreEffects = [
  // Animation engines
  effect('GSAP', 'greensock/GSAP', 'animation', 'Scroll-scrubbed master timeline', '滚动擦洗主时间线', 26600, code("import { gsap } from 'gsap';", "import { ScrollTrigger } from 'gsap/ScrollTrigger';", "gsap.registerPlugin(ScrollTrigger);", "const timeline = gsap.timeline({ scrollTrigger: { trigger: '.scene', scrub: true } });", "timeline.to('.card', { x: 80 }).to('.card', { rotate: 6 });"), { preview: 'gsap-scrolltrigger', isNew: false }),
  effect('GSAP', 'greensock/GSAP', 'scroll', 'Pinned horizontal scroll scene', '固定式横向滚动场景', 26600, code("import { gsap } from 'gsap';", "import { ScrollTrigger } from 'gsap/ScrollTrigger';", "gsap.registerPlugin(ScrollTrigger);", "gsap.to('.track', { xPercent: -75, ease: 'none', scrollTrigger: { trigger: '.gallery', pin: true, scrub: 1, end: '+=2400' } });"), { isNew: false }),
  effect('Motion', 'motiondivision/motion', 'animation', 'Shared-layout spring morph', '共享布局弹簧变形', 32819, code("import { animate } from 'motion';", "animate('.card', { x: 80, borderRadius: 24 }, { type: 'spring' });"), { preview: 'motion', isNew: false }),
  effect('Anime.js', 'juliangarnier/anime', 'animation', 'Staggered transform choreography', '交错变换编排', 71056, code("import { animate, stagger } from 'animejs';", "animate('.dot', { x: 80, delay: stagger(60) });")),
  effect('Tween.js', 'tweenjs/tween.js', 'animation', 'Render-agnostic value tween', '与渲染器无关的数值补间', 10129, code("import * as TWEEN from '@tweenjs/tween.js';", "new TWEEN.Tween({ x: 0 }).to({ x: 80 }, 600).onUpdate(({ x }) => card.style.translate = `${x}px`).start();", "requestAnimationFrame(function frame(t) { TWEEN.update(t); requestAnimationFrame(frame); });")),
  effect('Mo.js', 'mojs/mojs', 'animation', 'Motion-graphics burst', '动态图形爆发', 18728, code("import mojs from '@mojs/core';", "new mojs.Burst({ parent: '#stage', radius: { 0: 80 }, count: 10 }).play();")),
  effect('Theatre.js', 'theatre-js/theatre', 'animation', 'Visually authored keyframe sequence', '可视化编排关键帧序列', 12541, code("import { getProject } from '@theatre/core';", "const sheet = getProject('Demo').sheet('Scene');", "const card = sheet.object('Card', { x: 0 }); card.onValuesChange(({ x }) => element.style.translate = `${x}px`);")),
  effect('Popmotion', 'Popmotion/popmotion', 'animation', 'Functional value pipeline', '函数式数值管线', 20167, code("import { animate } from 'popmotion';", "animate({ from: 0, to: 80, onUpdate: x => card.style.translate = `${x}px` });")),
  effect('React Spring', 'pmndrs/react-spring', 'animation', 'Hook-driven spring motion', 'Hook 驱动弹簧动画', 29127, code("import { animated, useSpring } from '@react-spring/web';", "const style = useSpring({ from: { x: 0 }, x: 80 });", "return <animated.div style={style}>Spring</animated.div>;")),
  effect('KUTE.js', 'thednp/kute.js', 'animation', 'Compact SVG shape tween', '轻量 SVG 形状补间', 2639, code("import KUTE from 'kute.js';", "KUTE.to('#shape-a', { path: '#shape-b' }, { duration: 700 }).start();")),
  effect('VueUse Motion', 'vueuse/motion', 'animation', 'Vue directive motion state', 'Vue 指令式动效状态', 2753, code("import { MotionPlugin } from '@vueuse/motion';", "app.use(MotionPlugin);", "// <div v-motion :initial=\"{ x: 0 }\" :enter=\"{ x: 80 }\" />")),
  effect('Animate.css', 'animate-css/animate.css', 'animation', 'CSS class entrance animation', 'CSS 类进入动画', 82667, code("import 'animate.css';", "card.classList.add('animate__animated', 'animate__fadeInUp');")),
  effect('Rive Web', 'rive-app/rive-wasm', 'animation', 'Interactive vector state machine', '交互式矢量状态机', 954, code("import { Rive } from '@rive-app/canvas';", "new Rive({ src: 'button.riv', canvas, autoplay: true, stateMachines: 'Hover' });")),

  // Scroll and reveal
  effect('Lenis', 'darkroomengineering/lenis', 'scroll', 'Native-friendly inertial scrolling', '兼容原生语义的惯性滚动', 14373, code("import Lenis from 'lenis';", "const lenis = new Lenis();", "requestAnimationFrame(function raf(t) { lenis.raf(t); requestAnimationFrame(raf); });"), { preview: 'lenis', isNew: false }),
  effect('Scrollama', 'russellsamora/scrollama', 'scroll', 'Step-based scrollytelling', '分步滚动叙事', 5985, code("import scrollama from 'scrollama';", "scrollama().setup({ step: '.step' }).onStepEnter(({ index }) => draw(index));"), { preview: 'scrollama', isNew: false }),
  effect('AOS', 'michalsnik/aos', 'scroll', 'Data-attribute viewport reveal', '数据属性视口揭示', 28069, code("import AOS from 'aos';", "import 'aos/dist/aos.css';", "AOS.init(); // <article data-aos=\"fade-up\">"), { preview: 'aos', isNew: false }),
  effect('Locomotive Scroll', 'locomotivemtl/locomotive-scroll', 'scroll', 'Data-driven scroll transforms', '数据驱动滚动变换', 8825, code("import LocomotiveScroll from 'locomotive-scroll';", "new LocomotiveScroll(); // use data-scroll-speed on an element")),
  effect('Smooth Scrollbar', 'dolphin-wood/smooth-scrollbar', 'scroll', 'Inertial custom scroll container', '惯性自定义滚动容器', 3354, code("import Scrollbar from 'smooth-scrollbar';", "Scrollbar.init(document.querySelector('#scroll-area'), { damping: 0.08 });")),
  effect('r3f-scroll-rig', '14islands/r3f-scroll-rig', 'scroll', 'DOM-to-3D scroll synchronization', 'DOM 与 3D 滚动同步', 954, code("import { GlobalCanvas, SmoothScrollbar } from '@14islands/r3f-scroll-rig';", "return <><GlobalCanvas /><SmoothScrollbar />{page}</>;")),
  effect('scroll-into-view-if-needed', 'scroll-into-view/scroll-into-view-if-needed', 'scroll', 'Conditional focus-to-target scroll', '按需聚焦目标滚动', 1449, code("import scrollIntoView from 'scroll-into-view-if-needed';", "scrollIntoView(target, { behavior: 'smooth', scrollMode: 'if-needed' });")),
  effect('SimpleBar', 'Grsmto/simplebar', 'scroll', 'Styled native scrollbar surface', '保留原生滚动的样式化滚动条', 6411, code("import SimpleBar from 'simplebar';", "import 'simplebar/dist/simplebar.css';", "new SimpleBar(document.querySelector('#feed'), { autoHide: false });")),
  effect('TanStack Virtual', 'TanStack/virtual', 'scroll', 'Windowed million-row scrolling', '窗口化百万行滚动', 7004, code("import { useVirtualizer } from '@tanstack/react-virtual';", "const rows = useVirtualizer({ count: 1_000_000, getScrollElement: () => parent.current, estimateSize: () => 32 });")),
  effect('Infinite Scroll', 'metafizzy/infinite-scroll', 'scroll', 'Append-at-threshold continuous feed', '到达阈值追加连续信息流', 7483, code("import InfiniteScroll from 'infinite-scroll';", "new InfiniteScroll('.feed', { path: '.pagination__next', append: '.post', history: false });")),
  effect('fullPage.js', 'alvarotrigo/fullPage.js', 'scroll', 'Full-screen section snapping', '全屏分区吸附', 35422, code("import fullpage from 'fullpage.js';", "new fullpage('#fullpage', { autoScrolling: true, navigation: true });")),
  effect('multiScroll.js', 'alvarotrigo/multiscroll.js', 'scroll', 'Counter-moving split-screen panels', '反向移动分屏面板', 1572, code("import 'multiscroll.js';", "import 'multiscroll.js/jquery.multiscroll.css';", "$('#multiscroll').multiscroll({ navigation: true, scrollingSpeed: 700 });"), { legacy: true }),

  // Page and layout transitions
  effect('Swup', 'swup/swup', 'transition', 'Progressively enhanced page swap', '渐进增强页面替换', 5198, code("import Swup from 'swup';", "new Swup(); // animate #swup with .transition-* CSS")),
  effect('Isotope', 'metafizzy/isotope', 'transition', 'Filterable grid reflow', '可筛选网格重排', 11103, code("import Isotope from 'isotope-layout';", "const grid = new Isotope('.grid', { itemSelector: '.item' });", "grid.arrange({ filter: '.featured' });"), { preview: 'isotope', isNew: false, legacy: true }),
  effect('AutoAnimate', 'FormKit/auto-animate', 'transition', 'One-call DOM reflow animation', '一行调用 DOM 重排动画', 13875, code("import autoAnimate from '@formkit/auto-animate';", "autoAnimate(document.querySelector('.list'));")),
  effect('React Flip Toolkit', 'aholachek/react-flip-toolkit', 'transition', 'FLIP shared-element transition', 'FLIP 共享元素转场', 4189, code("import { Flipper, Flipped } from 'react-flip-toolkit';", "return <Flipper flipKey={open}><Flipped flipId=\"card\"><Card /></Flipped></Flipper>;")),
  effect('Muuri', 'haltu/muuri', 'transition', 'Draggable packed grid', '可拖拽紧密网格', 10949, code("import Muuri from 'muuri';", "new Muuri('.grid', { dragEnabled: true, layoutDuration: 400 });")),
  effect('Masonry', 'desandro/masonry', 'transition', 'Column-based masonry layout', '列式瀑布流布局', 16710, code("import Masonry from 'masonry-layout';", "new Masonry('.grid', { itemSelector: '.item', columnWidth: 240 });")),
  effect('Packery', 'metafizzy/packery', 'transition', 'Gap-filling bin-pack layout', '填补空隙的装箱布局', 4316, code("import Packery from 'packery';", "new Packery('.grid', { itemSelector: '.item', gutter: 12 });")),
  effect('React Transition Group', 'reactjs/react-transition-group', 'transition', 'Component enter-exit state machine', '组件进出状态机', 10234, code("import { CSSTransition } from 'react-transition-group';", "return <CSSTransition in={open} timeout={250} classNames=\"fade\"><Panel /></CSSTransition>;")),
  effect('Vaul', 'emilkowalski/vaul', 'transition', 'Velocity-aware swipe drawer', '速度感知滑动抽屉', 8479, code("import { Drawer } from 'vaul';", "return <Drawer.Root><Drawer.Trigger>Open</Drawer.Trigger><Drawer.Portal><Drawer.Overlay /><Drawer.Content>Panel</Drawer.Content></Drawer.Portal></Drawer.Root>;")),
  effect('GridStack', 'gridstack/gridstack.js', 'transition', 'Drag-resize dashboard collision reflow', '拖拽缩放仪表盘碰撞重排', 8994, code("import { GridStack } from 'gridstack';", "import 'gridstack/dist/gridstack.min.css';", "GridStack.init({ float: true, cellHeight: 80 });")),
  effect('Split.js', 'nathancahill/split', 'transition', 'Draggable split-pane resize', '可拖拽分栏尺寸调整', 6277, code("import Split from 'split.js';", "Split(['#left', '#right'], { sizes: [50, 50], gutterSize: 8 });")),
  effect('next-view-transitions', 'shuding/next-view-transitions', 'transition', 'Native cross-route shared-element morph', '原生跨路由共享元素变形', 2385, code("import { ViewTransitions } from 'next-view-transitions';", "export default ({ children }) => <ViewTransitions>{children}</ViewTransitions>;")),

  // Carousel and gallery
  effect('Swiper', 'nolimits4web/swiper', 'carousel', 'Momentum touch carousel', '惯性触摸轮播', 41869, code("import Swiper from 'swiper';", "new Swiper('.swiper', { loop: true, effect: 'coverflow' });"), { preview: 'swiper', isNew: false }),
  effect('PhotoSwipe', 'dimsemenov/PhotoSwipe', 'carousel', 'Thumbnail-to-lightbox zoom', '缩略图到灯箱缩放', 25215, code("import PhotoSwipeLightbox from 'photoswipe/lightbox';", "new PhotoSwipeLightbox({ gallery: '#gallery', children: 'a', pswpModule: () => import('photoswipe') }).init();"), { preview: 'photoswipe', isNew: false }),
  effect('mmenu.js', 'FrDH/mmenu-js', 'carousel', 'Nested off-canvas navigation panels', '嵌套式画布外导航面板', 2574, code("import Mmenu from 'mmenu-js';", "import 'mmenu-js/dist/mmenu.css';", "new Mmenu('#menu', { offCanvas: { position: 'right' } });")),
  effect('Driver.js', 'nilbuild/driver.js', 'carousel', 'Spotlight tour with focus handoff', '焦点交接式聚光导览', 26283, code("import { driver } from 'driver.js';", "const tour = driver({ steps: [{ element: '#search', popover: { title: 'Search' } }] });", "tour.drive();")),
  effect('SweetAlert2', 'sweetalert2/sweetalert2', 'carousel', 'Animated accessible modal alert', '动画无障碍模态提示', 18099, code("import Swal from 'sweetalert2';", "Swal.fire({ title: 'Saved', icon: 'success', showConfirmButton: false, timer: 1200 });")),
  effect('cmdk', 'dip/cmdk', 'carousel', 'Filtered command-palette overlay', '筛选式命令面板浮层', 12799, code("import { Command } from 'cmdk';", "return <Command><Command.Input /><Command.List><Command.Item>Open file</Command.Item></Command.List></Command>;")),
  effect('react-hot-toast', 'timolins/react-hot-toast', 'carousel', 'Stacking dismissible toast queue', '堆叠可关闭通知队列', 10956, code("import toast, { Toaster } from 'react-hot-toast';", "toast.success('Saved');", "return <Toaster position=\"bottom-right\" />;")),
  effect('Floating UI', 'floating-ui/floating-ui', 'carousel', 'Anchored popover flip and shift', '锚点浮层翻转与位移', 32665, code("import { computePosition, flip, shift } from '@floating-ui/dom';", "computePosition(button, tooltip, { middleware: [flip(), shift()] }).then(({ x, y }) => Object.assign(tooltip.style, { left: `${x}px`, top: `${y}px` }));")),
  effect('React Menu', 'szhsin/react-menu', 'carousel', 'Nested menu and submenu transition', '嵌套菜单与子菜单转场', 1218, code("import { Menu, MenuItem, MenuButton } from '@szhsin/react-menu';", "return <Menu menuButton={<MenuButton>Actions</MenuButton>} transition><MenuItem>Edit</MenuItem></Menu>;")),
  effect('dnd kit', 'clauderic/dnd-kit', 'carousel', 'Drag overlay and drop preview', '拖拽浮层与落点预览', 17408, code("import { DndContext, DragOverlay } from '@dnd-kit/core';", "return <DndContext onDragEnd={drop}><Items /><DragOverlay>{active && <Card />}</DragOverlay></DndContext>;")),
  effect('use-gesture', 'pmndrs/use-gesture', 'carousel', 'Bound spring drag and pinch', '带边界的弹簧拖拽与捏合', 9620, code("import { useDrag } from '@use-gesture/react';", "const bind = useDrag(({ offset: [x, y] }) => api.start({ x, y }));", "return <animated.div {...bind()} style={springs} />;")),
  effect('reveal.js', 'hakimel/reveal.js', 'carousel', 'Spatial slide-deck navigation', '空间化演示文稿导航', 71936, code("import Reveal from 'reveal.js';", "const deck = new Reveal({ embedded: true });", "await deck.initialize();")),

  // Pointer and hover
  effect('Parallax.js', 'wagerfield/parallax', 'pointer', 'Pointer-driven layer depth', '指针驱动图层景深', 16583, code("import Parallax from 'parallax-js';", "new Parallax(document.querySelector('#scene'), { relativeInput: true });"), { preview: 'parallax', isNew: false }),
  effect('vanilla-tilt.js', 'micku7zu/vanilla-tilt.js', 'pointer', 'Perspective tilt and glare', '透视倾斜与高光', 4019, code("import VanillaTilt from 'vanilla-tilt';", "VanillaTilt.init(document.querySelector('.card'), { max: 12, glare: true });"), { preview: 'vanilla-tilt', isNew: false }),
  effect('mouse-follower', 'Cuberto/mouse-follower', 'pointer', 'Context-aware custom cursor', '情境感知自定义光标', 818, code("import MouseFollower from 'mouse-follower';", "new MouseFollower({ speed: 0.35 });"), { preview: 'mouse-follower', isNew: false }),
  effect('hover-effect', 'robin-dela/hover-effect', 'pointer', 'Displacement-map image hover', '位移贴图图像悬停', 1874, code("import hoverEffect from 'hover-effect';", "new hoverEffect({ parent: document.querySelector('.tile'), image1: 'a.jpg', image2: 'b.jpg', displacementImage: 'disp.png' });"), { preview: 'hover-effect', isNew: false }),
  effect('Hover.css', 'IanLunn/Hover', 'pointer', 'Reusable CSS hover vocabulary', '可复用 CSS 悬停词汇', 29395, code("import 'hover.css/css/hover-min.css';", "button.classList.add('hvr-float-shadow');")),
  effect('cursor-effects', 'tholman/cursor-effects', 'pointer', 'Trailing cursor particles', '尾随光标粒子', 4013, code("import { trailingCursor } from 'cursor-effects';", "new trailingCursor({ particles: 18 });")),
  effect('fake3d', 'akella/fake3d', 'pointer', 'Depth-map portrait parallax', '深度图人像视差', 545, code("<div id=\"gl\" data-image-original=\"portrait.jpg\" data-image-depth=\"depth.jpg\" data-horizontal-threshold=\"35\" data-vertical-threshold=\"15\"></div>", "<script src=\"./js/app.js\"></script>"), { legacy: true }),
  effect('Magnetic Buttons', 'codrops/MagneticButtons', 'pointer', 'Pointer-attracted button motion', '指针吸引按钮运动', 485, code("import ButtonCtrl from './src/js/demo1/buttonCtrl';", "const button = new ButtonCtrl(document.querySelector('.button'));", "button.on('enter', () => cursor.enter());"), { legacy: true }),
  effect('Direction-Aware Hover', 'codrops/DirectionAwareHoverEffect', 'pointer', 'Approach-direction overlay entrance', '按接近方向进入的遮罩', 393, code("import './js/jquery.hoverdir.js';", "$('#da-thumbs > li').hoverdir({ hoverDelay: 75, hoverElem: '.overlay' });"), { legacy: true }),
  effect('Gooey Text Hover', 'codrops/GooeyTextHoverEffect', 'pointer', 'SVG-filter gooey text hover', 'SVG 滤镜黏液文字悬停', 155, code("import Menu from './src/js/demo1/menu';", "new Menu(document.querySelector('nav.menu'));")),
  effect('Interactive Points', 'codrops/InteractivePoints', 'pointer', 'Hotspot-revealed image regions', '热点揭示图像区域', 302, code("// Load the repository's js/main.js, then initialize the exported global.", "new PointsMap(document.querySelector('#interactive-1'));"), { legacy: true }),
  effect('Stack Motion Hover', 'codrops/StackMotionHoverEffects', 'pointer', 'Expanding colored card stack', '展开式彩色卡片堆栈', 499, code("// Load js/anime.min.js and js/main.js from the repository.", "document.querySelectorAll('.grid--effect-vega > .grid__item').forEach(item => new VegaFx(item));"), { legacy: true }),

  // Text and SVG
  effect('Vivus', 'maxwellito/vivus', 'vector', 'SVG stroke drawing', 'SVG 描边绘制', 15479, code("import Vivus from 'vivus';", "new Vivus('logo', { duration: 120, type: 'oneByOne' });"), { preview: 'vivus', isNew: false, legacy: true }),
  effect('lottie-web', 'airbnb/lottie-web', 'vector', 'After Effects vector playback', 'After Effects 矢量播放', 32014, code("import lottie from 'lottie-web';", "lottie.loadAnimation({ container: document.querySelector('#icon'), renderer: 'svg', path: 'icon.json' });"), { preview: 'lottie-web', isNew: false }),
  effect('Typed.js', 'mattboldt/typed.js', 'vector', 'Looping typewriter sequence', '循环打字序列', 16283, code("import Typed from 'typed.js';", "new Typed('#typed', { strings: ['Motion', 'Meaning'], typeSpeed: 55, loop: true });")),
  effect('Splitting', 'shshaw/Splitting', 'vector', 'Text-to-character CSS variables', '文本拆字符 CSS 变量', 1755, code("import Splitting from 'splitting';", "Splitting({ target: '.headline', by: 'chars' });")),
  effect('Blotter', 'bradley/Blotter', 'vector', 'Shader-processed typography', '着色器处理字体', 3076, code("const material = new Blotter.LiquidDistortMaterial();", "const blotter = new Blotter(material, { texts: new Blotter.Text('WAVE') });", "blotter.forText(blotter.texts[0]).appendTo(stage);"), { legacy: true }),
  effect('use-scramble', 'tol-is/use-scramble', 'vector', 'Randomized decode text reveal', '随机解码文本揭示', 143, code("import { useScramble } from 'use-scramble';", "const { ref } = useScramble({ text: 'Decoded', speed: 0.7 });", "return <span ref={ref} />;")),
  effect('SVG.js', 'svgdotjs/svg.js', 'vector', 'Fluent SVG scene animation', '流式 SVG 场景动画', 11802, code("import { SVG } from '@svgdotjs/svg.js';", "SVG().addTo('#stage').circle(80).fill('#b7ff56').animate(600).move(120, 20);")),
  effect('Rough.js', 'rough-stuff/rough', 'vector', 'Hand-drawn vector rendering', '手绘感矢量渲染', 21074, code("import rough from 'roughjs';", "rough.svg(document.querySelector('svg')).rectangle(10, 10, 120, 70, { fill: '#b7ff56' });")),
  effect('Vara', 'akzhy/Vara', 'vector', 'Handwritten path lettering', '手写路径字形', 289, code("import Vara from 'vara';", "new Vara('#stage', 'font.json', [{ text: 'Hello', duration: 1200 }]);")),
  effect('smart-ticker', 'tombcato/smart-ticker', 'vector', 'Character-diff text transition', '字符差异文本转场', 165, code("import { Ticker } from '@tombcato/smart-ticker';", "import '@tombcato/smart-ticker/style.css';", "return <Ticker value=\"12,480\" duration={800} easing=\"easeInOut\" />;")),
  effect('Flip', 'pqina/flip', 'vector', 'Mechanical split-flap character change', '机械翻牌字符变化', 1018, code("import Tick from '@pqina/flip';", "const tick = Tick.DOM.create(document.querySelector('.tick'));", "tick.value = 42;")),
  effect('Flubber', 'veltman/flubber', 'vector', 'Topology-safe SVG shape morph', '拓扑安全 SVG 形状变形', 6923, code("import { interpolate } from 'flubber';", "const morph = interpolate(pathA, pathB);", "path.setAttribute('d', morph(0.5));")),

  // Canvas and 2D
  effect('PixiJS', 'pixijs/pixijs', 'canvas', 'GPU-accelerated 2D scene graph', 'GPU 加速 2D 场景图', 47790, code("import { Application, Graphics } from 'pixi.js';", "const app = new Application(); await app.init({ resizeTo: window });", "document.body.append(app.canvas); app.stage.addChild(new Graphics().circle(80, 80, 36).fill('#b7ff56'));")),
  effect('p5.js', 'processing/p5.js', 'canvas', 'Sketch-style creative coding loop', '草图式创意编程循环', 23797, code("import p5 from 'p5';", "new p5(p => { p.setup = () => p.createCanvas(320, 180); p.draw = () => p.circle(p.mouseX, p.mouseY, 40); });")),
  effect('Paper.js', 'paperjs/paper.js', 'canvas', 'Vector geometry on Canvas', 'Canvas 上的矢量几何', 15061, code("import paper from 'paper';", "paper.setup(document.querySelector('canvas'));", "new paper.Path.Circle({ center: [80, 80], radius: 36, fillColor: '#b7ff56' });")),
  effect('Fabric.js', 'fabricjs/fabric.js', 'canvas', 'Interactive object canvas', '交互式对象画布', 31321, code("import { Canvas, Rect } from 'fabric';", "const canvas = new Canvas('stage');", "canvas.add(new Rect({ left: 30, top: 30, width: 90, height: 60, fill: '#b7ff56' }));")),
  effect('Konva', 'konvajs/konva', 'canvas', 'Layered draggable Canvas nodes', '分层可拖拽 Canvas 节点', 14619, code("import Konva from 'konva';", "const stage = new Konva.Stage({ container: 'stage', width: 320, height: 180 });", "const layer = new Konva.Layer(); layer.add(new Konva.Circle({ x: 80, y: 80, radius: 36, fill: '#b7ff56', draggable: true })); stage.add(layer);")),
  effect('Two.js', 'jonobr1/two.js', 'canvas', 'Renderer-agnostic 2D primitives', '跨渲染器 2D 图元', 8643, code("import Two from 'two.js';", "const two = new Two({ width: 320, height: 180 }).appendTo(stage);", "two.makeCircle(80, 80, 36).fill = '#b7ff56'; two.update();")),
  effect('EaselJS', 'CreateJS/EaselJS', 'canvas', 'Display-list Canvas animation', '显示列表 Canvas 动画', 8169, code("const stage = new createjs.Stage('canvas');", "const shape = new createjs.Shape(); shape.graphics.beginFill('#b7ff56').drawCircle(0, 0, 36);", "shape.x = shape.y = 80; stage.addChild(shape); stage.update();")),
  effect('Phaser', 'phaserjs/phaser', 'canvas', 'Browser game scene lifecycle', '浏览器游戏场景生命周期', 39960, code("import Phaser from 'phaser';", "new Phaser.Game({ type: Phaser.AUTO, width: 320, height: 180, scene: { create() { this.add.circle(80, 80, 36, 0xb7ff56); } } });")),
  effect('Matter.js', 'liabru/matter-js', 'canvas', 'Rigid-body web physics', '网页刚体物理', 18321, code("import { Engine, Bodies, Composite } from 'matter-js';", "const engine = Engine.create(); Composite.add(engine.world, Bodies.circle(80, 20, 20));", "Engine.run(engine);")),
  effect('Pts', 'williamngan/pts', 'canvas', 'Point-based generative geometry', '基于点的生成式几何', 5336, code("import { CanvasSpace, Pt } from 'pts';", "new CanvasSpace('#stage').setup({ resize: true }).add(({ form, pointer }) => form.fill('#b7ff56').point(pointer, 28)).play();")),
  effect('Zdog', 'metafizzy/zdog', 'canvas', 'Pseudo-3D flat illustration', '伪 3D 扁平插画', 10634, code("import Zdog from 'zdog';", "const illo = new Zdog.Illustration({ element: '#stage', dragRotate: true });", "new Zdog.Shape({ addTo: illo, stroke: 80, color: '#b7ff56' }); illo.updateRenderGraph();")),
  effect('tldraw', 'tldraw/tldraw', 'canvas', 'Infinite collaborative drawing surface', '无限协作绘图画布', 48780, code("import { Tldraw } from 'tldraw';", "import 'tldraw/tldraw.css';", "export default () => <div style={{ position: 'fixed', inset: 0 }}><Tldraw /></div>;")),

  // 3D and WebGL
  effect('react-three-fiber', 'pmndrs/react-three-fiber', 'webgl', 'Declarative React 3D scene', '声明式 React 3D 场景', 31433, code("import { Canvas } from '@react-three/fiber';", "return <Canvas><mesh><boxGeometry /><meshStandardMaterial color=\"#b7ff56\" /></mesh></Canvas>;"), { preview: 'react-three-fiber', isNew: false }),
  effect('three.js', 'mrdoob/three.js', 'webgl', 'General-purpose WebGL scene graph', '通用 WebGL 场景图', 113755, code("import * as THREE from 'three';", "const renderer = new THREE.WebGLRenderer({ canvas });", "const scene = new THREE.Scene(); scene.add(new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshNormalMaterial())); renderer.render(scene, camera);")),
  effect('Babylon.js', 'BabylonJS/Babylon.js', 'webgl', 'Batteries-included 3D engine', '功能齐全 3D 引擎', 25806, code("import { Engine, Scene, ArcRotateCamera, HemisphericLight } from '@babylonjs/core';", "const engine = new Engine(canvas); const scene = new Scene(engine);", "new ArcRotateCamera('camera', 0, 1, 5, undefined, scene); new HemisphericLight('light', undefined, scene); engine.runRenderLoop(() => scene.render());")),
  effect('PlayCanvas Engine', 'playcanvas/engine', 'webgl', 'Entity-component 3D runtime', '实体组件 3D 运行时', 16245, code("import * as pc from 'playcanvas';", "const app = new pc.Application(canvas); app.start();", "const camera = new pc.Entity(); camera.addComponent('camera'); app.root.addChild(camera);")),
  effect('OGL', 'oframe/ogl', 'webgl', 'Minimal WebGL abstraction', '极简 WebGL 抽象', 4582, code("import { Renderer, Geometry, Program, Mesh } from 'ogl';", "const renderer = new Renderer();", "const mesh = new Mesh(renderer.gl, { geometry: new Geometry(renderer.gl), program: new Program(renderer.gl, { vertex, fragment }) });")),
  effect('regl', 'regl-project/regl', 'webgl', 'Functional WebGL draw commands', '函数式 WebGL 绘制命令', 5557, code("import createREGL from 'regl';", "const regl = createREGL();", "regl({ frag, vert, count: 3 })();")),
  effect('Curtains.js', 'martinlaxenaire/curtainsjs', 'webgl', 'DOM-synced shader planes', '与 DOM 同步的着色器平面', 1823, code("import { Curtains, Plane } from 'curtainsjs';", "const curtains = new Curtains({ container: 'canvas' });", "new Plane(curtains, document.querySelector('.plane'), { vertexShader, fragmentShader });")),
  effect('<model-viewer>', 'google/model-viewer', 'webgl', 'Accessible interactive 3D product view', '无障碍交互式 3D 商品查看', 8161, code("import '@google/model-viewer';", "// <model-viewer src=\"shoe.glb\" camera-controls auto-rotate></model-viewer>")),
  effect('A-Frame', 'aframevr/aframe', 'webgl', 'Declarative HTML 3D scene', '声明式 HTML 3D 场景', 17586, code("import 'aframe';", "// <a-scene><a-box position=\"0 1 -3\" color=\"#b7ff56\"></a-box></a-scene>")),
  effect('TresJS', 'Tresjs/tres', 'webgl', 'Vue declarative Three.js', 'Vue 声明式 Three.js', 3625, code("import { TresCanvas } from '@tresjs/core';", "// <TresCanvas><TresMesh><TresBoxGeometry /><TresMeshNormalMaterial /></TresMesh></TresCanvas>")),
  effect('Threlte', 'threlte/threlte', 'webgl', 'Svelte declarative Three.js', 'Svelte 声明式 Three.js', 3300, code("import { Canvas } from '@threlte/core';", "// <Canvas><T.Mesh><T.BoxGeometry /><T.MeshNormalMaterial /></T.Mesh></Canvas>")),
  effect('postprocessing', 'pmndrs/postprocessing', 'webgl', 'Merged real-time bloom pass', '合并式实时辉光后期', 2811, code("import { EffectComposer, EffectPass, BloomEffect } from 'postprocessing';", "const composer = new EffectComposer(renderer);", "composer.addPass(new EffectPass(camera, new BloomEffect())); composer.render();")),

  // Background and particles
  effect('WebGL Fluid Simulation', 'PavelDoGreat/WebGL-Fluid-Simulation', 'background', 'Pointer-injected GPU fluid', '指针注入 GPU 流体', 16493, code("// Host the project build, then use the canvas as a full-bleed layer.", "document.querySelector('canvas').classList.add('fluid-background');"), { preview: 'webgl-fluid', isNew: false }),
  effect('tsParticles', 'tsparticles/tsparticles', 'background', 'Configurable reactive particle field', '可配置响应式粒子场', 8920, code("import { tsParticles } from '@tsparticles/engine';", "await tsParticles.load({ id: 'particles', options: { particles: { number: { value: 60 }, links: { enable: true } } } });"), { preview: 'tsparticles', isNew: false }),
  effect('Vanta', 'tengbao/vanta', 'background', 'Drop-in animated WebGL background', '即插即用 WebGL 动态背景', 6608, code("import NET from 'vanta/dist/vanta.net.min';", "NET({ el: '#hero', mouseControls: true, color: 0xb7ff56 });")),
  effect('canvas-confetti', 'catdad/canvas-confetti', 'background', 'Event-triggered confetti burst', '事件触发彩纸爆发', 12648, code("import confetti from 'canvas-confetti';", "confetti({ particleCount: 120, spread: 70, origin: { y: 0.7 } });")),
  effect('Granim.js', 'sarcadass/granim.js', 'background', 'Animated gradient state transitions', '动态渐变状态转场', 5304, code("import Granim from 'granim';", "new Granim({ element: '#gradient', states: { default: { gradients: [['#8a70ff', '#b7ff56'], ['#ff694e', '#151613']] } } });"), { legacy: true }),
  effect('Trianglify', 'qrohlf/trianglify', 'background', 'Procedural low-poly mesh', '程序化低多边形网格', 10089, code("import trianglify from 'trianglify';", "const pattern = trianglify({ width: 900, height: 500, cellSize: 90 });", "hero.append(pattern.toCanvas());")),
  effect('Fireworks.js', 'crashmax-dev/fireworks-js', 'background', 'Interactive fireworks field', '交互式烟花场', 1380, code("import { Fireworks } from 'fireworks-js';", "new Fireworks(document.querySelector('#stage'), { intensity: 24 }).start();")),
  effect('ribbon.js', 'hustcc/ribbon.js', 'background', 'Procedural ribbon trail', '程序化丝带轨迹', 237, code("import Ribbons from 'ribbon.js';", "new Ribbons({ colorSaturation: '80%', colorBrightness: '60%' });"), { legacy: true }),
  effect('Flat Surface Shader', 'wagerfield/flat-surface-shader', 'background', 'Lit low-poly surface', '带光照低多边形曲面', 2469, code("const scene = new FSS.Scene();", "const mesh = new FSS.Mesh(new FSS.Plane(900, 500, 12, 8), new FSS.Material('#111', '#b7ff56'));", "scene.add(mesh);"), { legacy: true }),
  effect('CSS Doodle', 'css-doodle/css-doodle', 'background', 'Generated CSS grid pattern animation', '生成式 CSS 网格图案动画', 6020, code("import 'css-doodle';", "// <css-doodle>@grid: 8 / 100%; background: @pick(#b7ff56,#8a70ff); transform: scale(@rand(.2,1));</css-doodle>")),
  effect('shader-web-background', 'xemantic/shader-web-background', 'background', 'Full-page fragment shader backdrop', '全页片段着色器背景', 280, code("<script src=\"https://xemantic.github.io/shader-web-background/dist/shader-web-background.min.js\"></script>", "<script>shaderWebBackground.shade({ shaders: { image: { uniforms: { iTime: (gl, loc) => gl.uniform1f(loc, performance.now()/1000) } } } });</script>")),
  effect('Particle Life', 'hunar4321/particle-life', 'background', 'Emergent attraction-repulsion swarm', '涌现式吸引排斥粒子群', 3343, code("const green = create(200, 'green'), red = create(200, 'red');", "function update() { rule(green, red, -0.17); drawAtoms(); requestAnimationFrame(update); }", "update();")),

  // Media and image
  effect('img-comparison-slider', 'sneas/img-comparison-slider', 'media', 'Drag-to-reveal image comparison', '拖拽揭示图像对比', 864, code("import 'img-comparison-slider';", "// <img-comparison-slider><img slot=\"first\" src=\"before.jpg\"><img slot=\"second\" src=\"after.jpg\"></img-comparison-slider>"), { preview: 'img-comparison-slider', isNew: false }),
  effect('GL Transitions', 'gl-transitions/gl-transitions', 'media', 'Reusable GLSL media transition', '可复用 GLSL 媒体转场', 2115, code("import transitions from 'gl-transitions';", "const dissolve = transitions.find(item => item.name === 'Dissolve');", "renderTransition(dissolve.glsl, fromTexture, toTexture, progress);"), { preview: 'gl-transitions', isNew: false }),
  effect('medium-zoom', 'francoischalifour/medium-zoom', 'media', 'Inline image focus zoom', '行内图片聚焦缩放', 3936, code("import mediumZoom from 'medium-zoom';", "mediumZoom('article img', { margin: 32, background: '#0c0d0b' });")),
  effect('Panzoom', 'timmywil/panzoom', 'media', 'Pointer pan and pinch zoom', '指针平移与捏合缩放', 2440, code("import Panzoom from '@panzoom/panzoom';", "const panzoom = Panzoom(document.querySelector('#art'), { maxScale: 5 });", "document.querySelector('#viewport').addEventListener('wheel', panzoom.zoomWithWheel);")),
  effect('OpenSeadragon', 'openseadragon/openseadragon', 'media', 'Deep-zoom tiled imagery', '深度缩放切片图像', 3479, code("import OpenSeadragon from 'openseadragon';", "OpenSeadragon({ id: 'viewer', tileSources: 'image.dzi', prefixUrl: '/icons/' });")),
  effect('Cropper.js', 'fengyuanchen/cropperjs', 'media', 'Interactive image crop transform', '交互式图像裁剪变换', 13857, code("import Cropper from 'cropperjs';", "const cropper = new Cropper(document.querySelector('img'), { viewMode: 1 });", "const result = cropper.getCroppedCanvas();")),
  effect('Drift', 'strawdynamics/drift', 'media', 'E-commerce lens magnification', '电商镜头放大', 1562, code("import Drift from 'drift-zoom';", "new Drift(document.querySelector('.product'), { paneContainer: document.querySelector('.zoom-pane') });")),
  effect('CamanJS', 'meltingice/CamanJS', 'media', 'Chainable Canvas photo filters', '可链式 Canvas 照片滤镜', 3571, code("Caman('#photo', function () {", "  this.brightness(8).contrast(12).vintage().render();", "});"), { legacy: true }),
  effect('glfx.js', 'evanw/glfx.js', 'media', 'GPU image filter canvas', 'GPU 图像滤镜画布', 3449, code("const canvas = fx.canvas();", "const texture = canvas.texture(image);", "canvas.draw(texture).vignette(0.5, 0.6).update();"), { legacy: true }),
  effect('FilePond', 'pqina/filepond', 'media', 'Drop-upload image preview transition', '拖拽上传图片预览转场', 16382, code("import * as FilePond from 'filepond';", "import 'filepond/dist/filepond.min.css';", "FilePond.create(document.querySelector('input[type=file]'), { allowReorder: true });")),
  effect('TUI Image Editor', 'nhn/tui.image-editor', 'media', 'Full image-editing canvas workspace', '完整图像编辑画布工作区', 7660, code("import ImageEditor from 'tui-image-editor';", "const editor = new ImageEditor('#editor', { cssMaxWidth: 900, cssMaxHeight: 600 });", "await editor.loadImageFromURL('photo.jpg', 'Photo');")),
  effect('Media Chrome', 'muxinc/media-chrome', 'media', 'Responsive custom media controls', '响应式自定义媒体控制条', 2710, code("import 'media-chrome';", "// <media-controller><video slot=\"media\" src=\"clip.mp4\"></video><media-control-bar><media-play-button></media-play-button><media-time-range></media-time-range></media-control-bar></media-controller>"))
];

const researchedEffects = additionalEffectSeeds.map(item => effect(
  item.projectName,
  item.repo,
  item.category,
  item.name,
  item.nameZh,
  item.stars,
  item.snippet,
  {
    addedIn: '2026-effect-expansion',
    behavior: item.behavior,
    research: {
      sourceUrl: item.sourceUrl,
      difference: item.difference,
      verifiedAt: item.verifiedAt || '2026-07-16'
    }
  }
));

export const effects = [...coreEffects, ...researchedEffects]
  .map((item, index) => ({ ...item, order: index + 1 }));

export const projects = [...projectRegistry.values()];
