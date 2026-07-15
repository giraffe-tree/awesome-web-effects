# Awesome Web Effects

[中文文档](README.zh-CN.md) · [Live demo](https://giraffe-tree.github.io/awesome-interaction/)

A deduplicated, code-first atlas of open-source visual effects for the web. It contains **120 projects across 10 categories**, including **101 additions** beyond the original 20. Every project has a copyable minimal example in the demo; English is the default interface and documentation language.

## What changed

- Added 101 verified GitHub projects without counting the original 20.
- Deduplicated twice: first by repository, then by the visible-effect signature: **trigger + visual change + time relationship + page layer**.
- Preferred maintained projects with strong ecosystems and clear official examples. 14 useful older implementations are explicitly marked **Legacy**; no archived repository is included.
- Kept 19 project-specific GIF previews. Code-first entries use labeled abstract placeholders instead of unrelated footage.
- Compressed the GIF set from **27.28 MiB to 15.81 MiB** (42.03% smaller) without changing 720×450 dimensions, frame counts, frame rates, or durations.
- Added a static GitHub Pages workflow for the live demo.

## Selection rules

1. The result must be visible in a normal web page: motion, transition, drawing, 2D/3D rendering, pointer response, or media presentation.
2. A repository must be public and verifiable. Stars are a snapshot from **2026-07-16**, not a live counter.
3. Similar libraries remain only when their best-known visible result or integration model is materially different.
4. Newer, maintained, well-documented choices win a duplicate comparison. Older but unarchived projects may remain only when their interaction pattern is still distinctive, and are marked Legacy.
5. A minimal example should expose the smallest useful API call, not reproduce an entire starter application.

## Categories

| Category | Projects | Visible result |
| --- | ---: | --- |
| [Animation engines](#animation) | 12 | Timelines, springs, tweens, class animation, and framework-native motion. |
| [Scroll & reveal](#scroll) | 12 | Smooth scrolling, scroll-linked scenes, reveals, parallax, and snap navigation. |
| [Page & layout](#transition) | 12 | Page transitions, FLIP motion, filtering, packing, and animated reflow. |
| [Navigation & overlays](#carousel) | 12 | Carousel, lightbox, menus, tours, notifications, drag overlays, and spatial navigation. |
| [Pointer & hover](#pointer) | 12 | Tilt, depth, custom cursors, magnetic motion, and image distortion. |
| [Text & SVG](#vector) | 12 | Typing, text splitting, vector drawing, handwriting, and SVG morphing. |
| [Canvas & 2D](#canvas) | 12 | Scene graphs, creative coding, physics, drawing tools, and 2D renderers. |
| [3D & WebGL](#webgl) | 12 | 3D engines, declarative renderers, shader layers, and post-processing. |
| [Background & particles](#background) | 12 | Fluid, particles, gradients, confetti, meshes, ribbons, and fireworks. |
| [Media & image](#media) | 12 | Comparison, pan-and-zoom, cropping, filters, lens zoom, and shader transitions. |

## Project catalog

<a id="animation"></a>

### Animation engines

Timelines, springs, tweens, class animation, and framework-native motion.

| Project | Visible effect | Stars | Status | Minimal code |
| --- | --- | ---: | --- | --- |
| [GSAP](https://github.com/greensock/GSAP) | Scroll-scrubbed master timeline | 26,600 | Original | [Open](https://giraffe-tree.github.io/awesome-interaction/#gsap-scrolltrigger) |
| [Motion](https://github.com/motiondivision/motion) | Shared-layout spring morph | 32,819 | Original | [Open](https://giraffe-tree.github.io/awesome-interaction/#motion) |
| [Anime.js](https://github.com/juliangarnier/anime) | Staggered transform choreography | 71,056 | New | [Open](https://giraffe-tree.github.io/awesome-interaction/#juliangarnier-anime) |
| [Tween.js](https://github.com/tweenjs/tween.js) | Render-agnostic value tween | 10,129 | New | [Open](https://giraffe-tree.github.io/awesome-interaction/#tweenjs-tween-js) |
| [Mo.js](https://github.com/mojs/mojs) | Motion-graphics burst | 18,728 | New | [Open](https://giraffe-tree.github.io/awesome-interaction/#mojs-mojs) |
| [Theatre.js](https://github.com/theatre-js/theatre) | Visually authored keyframe sequence | 12,541 | New | [Open](https://giraffe-tree.github.io/awesome-interaction/#theatre-js-theatre) |
| [Popmotion](https://github.com/Popmotion/popmotion) | Functional value pipeline | 20,167 | New | [Open](https://giraffe-tree.github.io/awesome-interaction/#popmotion-popmotion) |
| [React Spring](https://github.com/pmndrs/react-spring) | Hook-driven spring motion | 29,127 | New | [Open](https://giraffe-tree.github.io/awesome-interaction/#pmndrs-react-spring) |
| [KUTE.js](https://github.com/thednp/kute.js) | Compact SVG shape tween | 2,639 | New | [Open](https://giraffe-tree.github.io/awesome-interaction/#thednp-kute-js) |
| [VueUse Motion](https://github.com/vueuse/motion) | Vue directive motion state | 2,753 | New | [Open](https://giraffe-tree.github.io/awesome-interaction/#vueuse-motion) |
| [Animate.css](https://github.com/animate-css/animate.css) | CSS class entrance animation | 82,667 | New | [Open](https://giraffe-tree.github.io/awesome-interaction/#animate-css-animate-css) |
| [Rive Web](https://github.com/rive-app/rive-wasm) | Interactive vector state machine | 954 | New | [Open](https://giraffe-tree.github.io/awesome-interaction/#rive-app-rive-wasm) |

<a id="scroll"></a>

### Scroll & reveal

Smooth scrolling, scroll-linked scenes, reveals, parallax, and snap navigation.

| Project | Visible effect | Stars | Status | Minimal code |
| --- | --- | ---: | --- | --- |
| [Lenis](https://github.com/darkroomengineering/lenis) | Native-friendly inertial scrolling | 14,373 | Original | [Open](https://giraffe-tree.github.io/awesome-interaction/#lenis) |
| [Scrollama](https://github.com/russellsamora/scrollama) | Step-based scrollytelling | 5,985 | Original | [Open](https://giraffe-tree.github.io/awesome-interaction/#scrollama) |
| [AOS](https://github.com/michalsnik/aos) | Data-attribute viewport reveal | 28,069 | Original | [Open](https://giraffe-tree.github.io/awesome-interaction/#aos) |
| [Locomotive Scroll](https://github.com/locomotivemtl/locomotive-scroll) | Data-driven scroll transforms | 8,825 | New | [Open](https://giraffe-tree.github.io/awesome-interaction/#locomotivemtl-locomotive-scroll) |
| [Smooth Scrollbar](https://github.com/dolphin-wood/smooth-scrollbar) | Inertial custom scroll container | 3,354 | New | [Open](https://giraffe-tree.github.io/awesome-interaction/#dolphin-wood-smooth-scrollbar) |
| [r3f-scroll-rig](https://github.com/14islands/r3f-scroll-rig) | DOM-to-3D scroll synchronization | 954 | New | [Open](https://giraffe-tree.github.io/awesome-interaction/#14islands-r3f-scroll-rig) |
| [scroll-into-view-if-needed](https://github.com/scroll-into-view/scroll-into-view-if-needed) | Conditional focus-to-target scroll | 1,449 | New | [Open](https://giraffe-tree.github.io/awesome-interaction/#scroll-into-view-scroll-into-view-if-needed) |
| [SimpleBar](https://github.com/Grsmto/simplebar) | Styled native scrollbar surface | 6,411 | New | [Open](https://giraffe-tree.github.io/awesome-interaction/#grsmto-simplebar) |
| [TanStack Virtual](https://github.com/TanStack/virtual) | Windowed million-row scrolling | 7,004 | New | [Open](https://giraffe-tree.github.io/awesome-interaction/#tanstack-virtual) |
| [Infinite Scroll](https://github.com/metafizzy/infinite-scroll) | Append-at-threshold continuous feed | 7,483 | New | [Open](https://giraffe-tree.github.io/awesome-interaction/#metafizzy-infinite-scroll) |
| [fullPage.js](https://github.com/alvarotrigo/fullPage.js) | Full-screen section snapping | 35,422 | New | [Open](https://giraffe-tree.github.io/awesome-interaction/#alvarotrigo-fullpage-js) |
| [multiScroll.js](https://github.com/alvarotrigo/multiscroll.js) | Counter-moving split-screen panels | 1,572 | Legacy | [Open](https://giraffe-tree.github.io/awesome-interaction/#alvarotrigo-multiscroll-js) |

<a id="transition"></a>

### Page & layout

Page transitions, FLIP motion, filtering, packing, and animated reflow.

| Project | Visible effect | Stars | Status | Minimal code |
| --- | --- | ---: | --- | --- |
| [Swup](https://github.com/swup/swup) | Progressively enhanced page swap | 5,198 | New | [Open](https://giraffe-tree.github.io/awesome-interaction/#swup-swup) |
| [Isotope](https://github.com/metafizzy/isotope) | Filterable grid reflow | 11,103 | Legacy | [Open](https://giraffe-tree.github.io/awesome-interaction/#isotope) |
| [AutoAnimate](https://github.com/FormKit/auto-animate) | One-call DOM reflow animation | 13,875 | New | [Open](https://giraffe-tree.github.io/awesome-interaction/#formkit-auto-animate) |
| [React Flip Toolkit](https://github.com/aholachek/react-flip-toolkit) | FLIP shared-element transition | 4,189 | New | [Open](https://giraffe-tree.github.io/awesome-interaction/#aholachek-react-flip-toolkit) |
| [Muuri](https://github.com/haltu/muuri) | Draggable packed grid | 10,949 | New | [Open](https://giraffe-tree.github.io/awesome-interaction/#haltu-muuri) |
| [Masonry](https://github.com/desandro/masonry) | Column-based masonry layout | 16,710 | New | [Open](https://giraffe-tree.github.io/awesome-interaction/#desandro-masonry) |
| [Packery](https://github.com/metafizzy/packery) | Gap-filling bin-pack layout | 4,316 | New | [Open](https://giraffe-tree.github.io/awesome-interaction/#metafizzy-packery) |
| [React Transition Group](https://github.com/reactjs/react-transition-group) | Component enter-exit state machine | 10,234 | New | [Open](https://giraffe-tree.github.io/awesome-interaction/#reactjs-react-transition-group) |
| [Vaul](https://github.com/emilkowalski/vaul) | Velocity-aware swipe drawer | 8,479 | New | [Open](https://giraffe-tree.github.io/awesome-interaction/#emilkowalski-vaul) |
| [GridStack](https://github.com/gridstack/gridstack.js) | Drag-resize dashboard collision reflow | 8,994 | New | [Open](https://giraffe-tree.github.io/awesome-interaction/#gridstack-gridstack-js) |
| [Split.js](https://github.com/nathancahill/split) | Draggable split-pane resize | 6,277 | New | [Open](https://giraffe-tree.github.io/awesome-interaction/#nathancahill-split) |
| [next-view-transitions](https://github.com/shuding/next-view-transitions) | Native cross-route shared-element morph | 2,385 | New | [Open](https://giraffe-tree.github.io/awesome-interaction/#shuding-next-view-transitions) |

<a id="carousel"></a>

### Navigation & overlays

Carousel, lightbox, menus, tours, notifications, drag overlays, and spatial navigation.

| Project | Visible effect | Stars | Status | Minimal code |
| --- | --- | ---: | --- | --- |
| [Swiper](https://github.com/nolimits4web/swiper) | Momentum touch carousel | 41,869 | Original | [Open](https://giraffe-tree.github.io/awesome-interaction/#swiper) |
| [PhotoSwipe](https://github.com/dimsemenov/PhotoSwipe) | Thumbnail-to-lightbox zoom | 25,215 | Original | [Open](https://giraffe-tree.github.io/awesome-interaction/#photoswipe) |
| [mmenu.js](https://github.com/FrDH/mmenu-js) | Nested off-canvas navigation panels | 2,574 | New | [Open](https://giraffe-tree.github.io/awesome-interaction/#frdh-mmenu-js) |
| [Driver.js](https://github.com/nilbuild/driver.js) | Spotlight tour with focus handoff | 26,283 | New | [Open](https://giraffe-tree.github.io/awesome-interaction/#nilbuild-driver-js) |
| [SweetAlert2](https://github.com/sweetalert2/sweetalert2) | Animated accessible modal alert | 18,099 | New | [Open](https://giraffe-tree.github.io/awesome-interaction/#sweetalert2-sweetalert2) |
| [cmdk](https://github.com/dip/cmdk) | Filtered command-palette overlay | 12,799 | New | [Open](https://giraffe-tree.github.io/awesome-interaction/#dip-cmdk) |
| [react-hot-toast](https://github.com/timolins/react-hot-toast) | Stacking dismissible toast queue | 10,956 | New | [Open](https://giraffe-tree.github.io/awesome-interaction/#timolins-react-hot-toast) |
| [Floating UI](https://github.com/floating-ui/floating-ui) | Anchored popover flip and shift | 32,665 | New | [Open](https://giraffe-tree.github.io/awesome-interaction/#floating-ui-floating-ui) |
| [React Menu](https://github.com/szhsin/react-menu) | Nested menu and submenu transition | 1,218 | New | [Open](https://giraffe-tree.github.io/awesome-interaction/#szhsin-react-menu) |
| [dnd kit](https://github.com/clauderic/dnd-kit) | Drag overlay and drop preview | 17,408 | New | [Open](https://giraffe-tree.github.io/awesome-interaction/#clauderic-dnd-kit) |
| [use-gesture](https://github.com/pmndrs/use-gesture) | Bound spring drag and pinch | 9,620 | New | [Open](https://giraffe-tree.github.io/awesome-interaction/#pmndrs-use-gesture) |
| [reveal.js](https://github.com/hakimel/reveal.js) | Spatial slide-deck navigation | 71,936 | New | [Open](https://giraffe-tree.github.io/awesome-interaction/#hakimel-reveal-js) |

<a id="pointer"></a>

### Pointer & hover

Tilt, depth, custom cursors, magnetic motion, and image distortion.

| Project | Visible effect | Stars | Status | Minimal code |
| --- | --- | ---: | --- | --- |
| [Parallax.js](https://github.com/wagerfield/parallax) | Pointer-driven layer depth | 16,583 | Original | [Open](https://giraffe-tree.github.io/awesome-interaction/#parallax) |
| [vanilla-tilt.js](https://github.com/micku7zu/vanilla-tilt.js) | Perspective tilt and glare | 4,019 | Original | [Open](https://giraffe-tree.github.io/awesome-interaction/#vanilla-tilt) |
| [mouse-follower](https://github.com/Cuberto/mouse-follower) | Context-aware custom cursor | 818 | Original | [Open](https://giraffe-tree.github.io/awesome-interaction/#mouse-follower) |
| [hover-effect](https://github.com/robin-dela/hover-effect) | Displacement-map image hover | 1,874 | Original | [Open](https://giraffe-tree.github.io/awesome-interaction/#hover-effect) |
| [Hover.css](https://github.com/IanLunn/Hover) | Reusable CSS hover vocabulary | 29,395 | New | [Open](https://giraffe-tree.github.io/awesome-interaction/#ianlunn-hover) |
| [cursor-effects](https://github.com/tholman/cursor-effects) | Trailing cursor particles | 4,013 | New | [Open](https://giraffe-tree.github.io/awesome-interaction/#tholman-cursor-effects) |
| [fake3d](https://github.com/akella/fake3d) | Depth-map portrait parallax | 545 | Legacy | [Open](https://giraffe-tree.github.io/awesome-interaction/#akella-fake3d) |
| [Magnetic Buttons](https://github.com/codrops/MagneticButtons) | Pointer-attracted button motion | 485 | Legacy | [Open](https://giraffe-tree.github.io/awesome-interaction/#codrops-magneticbuttons) |
| [Direction-Aware Hover](https://github.com/codrops/DirectionAwareHoverEffect) | Approach-direction overlay entrance | 393 | Legacy | [Open](https://giraffe-tree.github.io/awesome-interaction/#codrops-directionawarehovereffect) |
| [Gooey Text Hover](https://github.com/codrops/GooeyTextHoverEffect) | SVG-filter gooey text hover | 155 | New | [Open](https://giraffe-tree.github.io/awesome-interaction/#codrops-gooeytexthovereffect) |
| [Interactive Points](https://github.com/codrops/InteractivePoints) | Hotspot-revealed image regions | 302 | Legacy | [Open](https://giraffe-tree.github.io/awesome-interaction/#codrops-interactivepoints) |
| [Stack Motion Hover](https://github.com/codrops/StackMotionHoverEffects) | Expanding colored card stack | 499 | Legacy | [Open](https://giraffe-tree.github.io/awesome-interaction/#codrops-stackmotionhovereffects) |

<a id="vector"></a>

### Text & SVG

Typing, text splitting, vector drawing, handwriting, and SVG morphing.

| Project | Visible effect | Stars | Status | Minimal code |
| --- | --- | ---: | --- | --- |
| [Vivus](https://github.com/maxwellito/vivus) | SVG stroke drawing | 15,479 | Legacy | [Open](https://giraffe-tree.github.io/awesome-interaction/#vivus) |
| [lottie-web](https://github.com/airbnb/lottie-web) | After Effects vector playback | 32,014 | Original | [Open](https://giraffe-tree.github.io/awesome-interaction/#lottie-web) |
| [Typed.js](https://github.com/mattboldt/typed.js) | Looping typewriter sequence | 16,283 | New | [Open](https://giraffe-tree.github.io/awesome-interaction/#mattboldt-typed-js) |
| [Splitting](https://github.com/shshaw/Splitting) | Text-to-character CSS variables | 1,755 | New | [Open](https://giraffe-tree.github.io/awesome-interaction/#shshaw-splitting) |
| [Blotter](https://github.com/bradley/Blotter) | Shader-processed typography | 3,076 | Legacy | [Open](https://giraffe-tree.github.io/awesome-interaction/#bradley-blotter) |
| [use-scramble](https://github.com/tol-is/use-scramble) | Randomized decode text reveal | 143 | New | [Open](https://giraffe-tree.github.io/awesome-interaction/#tol-is-use-scramble) |
| [SVG.js](https://github.com/svgdotjs/svg.js) | Fluent SVG scene animation | 11,802 | New | [Open](https://giraffe-tree.github.io/awesome-interaction/#svgdotjs-svg-js) |
| [Rough.js](https://github.com/rough-stuff/rough) | Hand-drawn vector rendering | 21,074 | New | [Open](https://giraffe-tree.github.io/awesome-interaction/#rough-stuff-rough) |
| [Vara](https://github.com/akzhy/Vara) | Handwritten path lettering | 289 | New | [Open](https://giraffe-tree.github.io/awesome-interaction/#akzhy-vara) |
| [smart-ticker](https://github.com/tombcato/smart-ticker) | Character-diff text transition | 165 | New | [Open](https://giraffe-tree.github.io/awesome-interaction/#tombcato-smart-ticker) |
| [Flip](https://github.com/pqina/flip) | Mechanical split-flap character change | 1,018 | New | [Open](https://giraffe-tree.github.io/awesome-interaction/#pqina-flip) |
| [Flubber](https://github.com/veltman/flubber) | Topology-safe SVG shape morph | 6,923 | New | [Open](https://giraffe-tree.github.io/awesome-interaction/#veltman-flubber) |

<a id="canvas"></a>

### Canvas & 2D

Scene graphs, creative coding, physics, drawing tools, and 2D renderers.

| Project | Visible effect | Stars | Status | Minimal code |
| --- | --- | ---: | --- | --- |
| [PixiJS](https://github.com/pixijs/pixijs) | GPU-accelerated 2D scene graph | 47,790 | New | [Open](https://giraffe-tree.github.io/awesome-interaction/#pixijs-pixijs) |
| [p5.js](https://github.com/processing/p5.js) | Sketch-style creative coding loop | 23,797 | New | [Open](https://giraffe-tree.github.io/awesome-interaction/#processing-p5-js) |
| [Paper.js](https://github.com/paperjs/paper.js) | Vector geometry on Canvas | 15,061 | New | [Open](https://giraffe-tree.github.io/awesome-interaction/#paperjs-paper-js) |
| [Fabric.js](https://github.com/fabricjs/fabric.js) | Interactive object canvas | 31,321 | New | [Open](https://giraffe-tree.github.io/awesome-interaction/#fabricjs-fabric-js) |
| [Konva](https://github.com/konvajs/konva) | Layered draggable Canvas nodes | 14,619 | New | [Open](https://giraffe-tree.github.io/awesome-interaction/#konvajs-konva) |
| [Two.js](https://github.com/jonobr1/two.js) | Renderer-agnostic 2D primitives | 8,643 | New | [Open](https://giraffe-tree.github.io/awesome-interaction/#jonobr1-two-js) |
| [EaselJS](https://github.com/CreateJS/EaselJS) | Display-list Canvas animation | 8,169 | New | [Open](https://giraffe-tree.github.io/awesome-interaction/#createjs-easeljs) |
| [Phaser](https://github.com/phaserjs/phaser) | Browser game scene lifecycle | 39,960 | New | [Open](https://giraffe-tree.github.io/awesome-interaction/#phaserjs-phaser) |
| [Matter.js](https://github.com/liabru/matter-js) | Rigid-body web physics | 18,321 | New | [Open](https://giraffe-tree.github.io/awesome-interaction/#liabru-matter-js) |
| [Pts](https://github.com/williamngan/pts) | Point-based generative geometry | 5,336 | New | [Open](https://giraffe-tree.github.io/awesome-interaction/#williamngan-pts) |
| [Zdog](https://github.com/metafizzy/zdog) | Pseudo-3D flat illustration | 10,634 | New | [Open](https://giraffe-tree.github.io/awesome-interaction/#metafizzy-zdog) |
| [tldraw](https://github.com/tldraw/tldraw) | Infinite collaborative drawing surface | 48,780 | New | [Open](https://giraffe-tree.github.io/awesome-interaction/#tldraw-tldraw) |

<a id="webgl"></a>

### 3D & WebGL

3D engines, declarative renderers, shader layers, and post-processing.

| Project | Visible effect | Stars | Status | Minimal code |
| --- | --- | ---: | --- | --- |
| [react-three-fiber](https://github.com/pmndrs/react-three-fiber) | Declarative React 3D scene | 31,433 | Original | [Open](https://giraffe-tree.github.io/awesome-interaction/#react-three-fiber) |
| [three.js](https://github.com/mrdoob/three.js) | General-purpose WebGL scene graph | 113,755 | New | [Open](https://giraffe-tree.github.io/awesome-interaction/#mrdoob-three-js) |
| [Babylon.js](https://github.com/BabylonJS/Babylon.js) | Batteries-included 3D engine | 25,806 | New | [Open](https://giraffe-tree.github.io/awesome-interaction/#babylonjs-babylon-js) |
| [PlayCanvas Engine](https://github.com/playcanvas/engine) | Entity-component 3D runtime | 16,245 | New | [Open](https://giraffe-tree.github.io/awesome-interaction/#playcanvas-engine) |
| [OGL](https://github.com/oframe/ogl) | Minimal WebGL abstraction | 4,582 | New | [Open](https://giraffe-tree.github.io/awesome-interaction/#oframe-ogl) |
| [regl](https://github.com/regl-project/regl) | Functional WebGL draw commands | 5,557 | New | [Open](https://giraffe-tree.github.io/awesome-interaction/#regl-project-regl) |
| [Curtains.js](https://github.com/martinlaxenaire/curtainsjs) | DOM-synced shader planes | 1,823 | New | [Open](https://giraffe-tree.github.io/awesome-interaction/#martinlaxenaire-curtainsjs) |
| [<model-viewer>](https://github.com/google/model-viewer) | Accessible interactive 3D product view | 8,161 | New | [Open](https://giraffe-tree.github.io/awesome-interaction/#google-model-viewer) |
| [A-Frame](https://github.com/aframevr/aframe) | Declarative HTML 3D scene | 17,586 | New | [Open](https://giraffe-tree.github.io/awesome-interaction/#aframevr-aframe) |
| [TresJS](https://github.com/Tresjs/tres) | Vue declarative Three.js | 3,625 | New | [Open](https://giraffe-tree.github.io/awesome-interaction/#tresjs-tres) |
| [Threlte](https://github.com/threlte/threlte) | Svelte declarative Three.js | 3,300 | New | [Open](https://giraffe-tree.github.io/awesome-interaction/#threlte-threlte) |
| [postprocessing](https://github.com/pmndrs/postprocessing) | Merged real-time bloom pass | 2,811 | New | [Open](https://giraffe-tree.github.io/awesome-interaction/#pmndrs-postprocessing) |

<a id="background"></a>

### Background & particles

Fluid, particles, gradients, confetti, meshes, ribbons, and fireworks.

| Project | Visible effect | Stars | Status | Minimal code |
| --- | --- | ---: | --- | --- |
| [WebGL Fluid Simulation](https://github.com/PavelDoGreat/WebGL-Fluid-Simulation) | Pointer-injected GPU fluid | 16,493 | Original | [Open](https://giraffe-tree.github.io/awesome-interaction/#webgl-fluid) |
| [tsParticles](https://github.com/tsparticles/tsparticles) | Configurable reactive particle field | 8,920 | Original | [Open](https://giraffe-tree.github.io/awesome-interaction/#tsparticles) |
| [Vanta](https://github.com/tengbao/vanta) | Drop-in animated WebGL background | 6,608 | New | [Open](https://giraffe-tree.github.io/awesome-interaction/#tengbao-vanta) |
| [canvas-confetti](https://github.com/catdad/canvas-confetti) | Event-triggered confetti burst | 12,648 | New | [Open](https://giraffe-tree.github.io/awesome-interaction/#catdad-canvas-confetti) |
| [Granim.js](https://github.com/sarcadass/granim.js) | Animated gradient state transitions | 5,304 | Legacy | [Open](https://giraffe-tree.github.io/awesome-interaction/#sarcadass-granim-js) |
| [Trianglify](https://github.com/qrohlf/trianglify) | Procedural low-poly mesh | 10,089 | New | [Open](https://giraffe-tree.github.io/awesome-interaction/#qrohlf-trianglify) |
| [Fireworks.js](https://github.com/crashmax-dev/fireworks-js) | Interactive fireworks field | 1,380 | New | [Open](https://giraffe-tree.github.io/awesome-interaction/#crashmax-dev-fireworks-js) |
| [ribbon.js](https://github.com/hustcc/ribbon.js) | Procedural ribbon trail | 237 | Legacy | [Open](https://giraffe-tree.github.io/awesome-interaction/#hustcc-ribbon-js) |
| [Flat Surface Shader](https://github.com/wagerfield/flat-surface-shader) | Lit low-poly surface | 2,469 | Legacy | [Open](https://giraffe-tree.github.io/awesome-interaction/#wagerfield-flat-surface-shader) |
| [CSS Doodle](https://github.com/css-doodle/css-doodle) | Generated CSS grid pattern animation | 6,020 | New | [Open](https://giraffe-tree.github.io/awesome-interaction/#css-doodle-css-doodle) |
| [shader-web-background](https://github.com/xemantic/shader-web-background) | Full-page fragment shader backdrop | 280 | New | [Open](https://giraffe-tree.github.io/awesome-interaction/#xemantic-shader-web-background) |
| [Particle Life](https://github.com/hunar4321/particle-life) | Emergent attraction-repulsion swarm | 3,343 | New | [Open](https://giraffe-tree.github.io/awesome-interaction/#hunar4321-particle-life) |

<a id="media"></a>

### Media & image

Comparison, pan-and-zoom, cropping, filters, lens zoom, and shader transitions.

| Project | Visible effect | Stars | Status | Minimal code |
| --- | --- | ---: | --- | --- |
| [img-comparison-slider](https://github.com/sneas/img-comparison-slider) | Drag-to-reveal image comparison | 864 | Original | [Open](https://giraffe-tree.github.io/awesome-interaction/#img-comparison-slider) |
| [GL Transitions](https://github.com/gl-transitions/gl-transitions) | Reusable GLSL media transition | 2,115 | Original | [Open](https://giraffe-tree.github.io/awesome-interaction/#gl-transitions) |
| [medium-zoom](https://github.com/francoischalifour/medium-zoom) | Inline image focus zoom | 3,936 | New | [Open](https://giraffe-tree.github.io/awesome-interaction/#francoischalifour-medium-zoom) |
| [Panzoom](https://github.com/timmywil/panzoom) | Pointer pan and pinch zoom | 2,440 | New | [Open](https://giraffe-tree.github.io/awesome-interaction/#timmywil-panzoom) |
| [OpenSeadragon](https://github.com/openseadragon/openseadragon) | Deep-zoom tiled imagery | 3,479 | New | [Open](https://giraffe-tree.github.io/awesome-interaction/#openseadragon-openseadragon) |
| [Cropper.js](https://github.com/fengyuanchen/cropperjs) | Interactive image crop transform | 13,857 | New | [Open](https://giraffe-tree.github.io/awesome-interaction/#fengyuanchen-cropperjs) |
| [Drift](https://github.com/strawdynamics/drift) | E-commerce lens magnification | 1,562 | New | [Open](https://giraffe-tree.github.io/awesome-interaction/#strawdynamics-drift) |
| [CamanJS](https://github.com/meltingice/CamanJS) | Chainable Canvas photo filters | 3,571 | Legacy | [Open](https://giraffe-tree.github.io/awesome-interaction/#meltingice-camanjs) |
| [glfx.js](https://github.com/evanw/glfx.js) | GPU image filter canvas | 3,449 | Legacy | [Open](https://giraffe-tree.github.io/awesome-interaction/#evanw-glfx-js) |
| [FilePond](https://github.com/pqina/filepond) | Drop-upload image preview transition | 16,382 | New | [Open](https://giraffe-tree.github.io/awesome-interaction/#pqina-filepond) |
| [TUI Image Editor](https://github.com/nhn/tui.image-editor) | Full image-editing canvas workspace | 7,660 | New | [Open](https://giraffe-tree.github.io/awesome-interaction/#nhn-tui-image-editor) |
| [Media Chrome](https://github.com/muxinc/media-chrome) | Responsive custom media controls | 2,710 | New | [Open](https://giraffe-tree.github.io/awesome-interaction/#muxinc-media-chrome) |

## Demo

The demo is dependency-free static HTML, CSS, JavaScript modules, and GIF assets. It supports search, category filtering, sorting, English/Chinese UI, direct project anchors, and copyable code.

```bash
python3 -m http.server 4173 --directory demo
```

Open [http://localhost:4173](http://localhost:4173). A local HTTP server is required because the catalog is loaded as an ES module.

## GIF optimization

Run the reproducible optimizer from original source GIFs:

```bash
./scripts/optimize-gifs.sh
```

It uses an adaptive 128-color palette, Bayer dithering, and difference-rectangle encoding. A candidate only replaces the source when it is smaller, and dimensions, duration, frame rate, and frame count are validated. Palette reduction is perceptual compression, so keep original source material outside the optimized output when future re-encoding is expected.

## GitHub Pages

Yes—this project can run on GitHub Pages because the demo is fully static and uses only relative paths. The included workflow publishes `demo/` on pushes to `main` and supports manual runs. Before the first deployment, set **Settings → Pages → Source** to **GitHub Actions**. See [the deployment notes](docs/GITHUB_PAGES.md).

Expected project URL: [https://giraffe-tree.github.io/awesome-interaction/](https://giraffe-tree.github.io/awesome-interaction/)

## Maintaining the catalog

- Edit `demo/data/projects.js`, the single source of truth.
- Run `node scripts/build-docs.mjs` to regenerate both README files.
- Run `node scripts/validate.mjs` before committing.
- Preserve the distinction between a real project GIF and a code-first placeholder.

GIFs and project names are used for research, indexing, and comparison. Rights remain with their respective authors.
