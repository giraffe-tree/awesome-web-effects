# Catalog Audit — 120 Distinct Web Visual-Effect Projects

Audit date: 2026-07-16 (Asia/Shanghai). Default language: English.

## Result

- Final catalog: **120 repositories in 10 categories (12 each)**.
- Existing catalog retained: **19 of 20**. `barbajs/barba` is replaced by `swup/swup` because the visual signature is the same while Swup is materially more active.
- Net-new relative to the current 20-item README: **101 repositories**.
- Repository dedupe: **0 duplicate canonical repositories** in the final 120. Redirected names were normalized, notably `kamranahmedse/driver.js` → `nilbuild/driver.js` and `pacocoursey/cmdk` → `dip/cmdk`.
- Candidate audit: **38 of the proposed 120 candidates were removed/replaced**: 32 for a duplicate visual signature and 6 for archive/maintenance/scope quality.
- Verification: every final URL returned a real public repository through GitHub's repository API during this audit. Archived repositories were excluded from the final list.

The effect signature is: **trigger + visible change + timing relationship + page layer**. “Legacy” below means the project is not archived but its implementation/demo stack is old enough that the demo should be isolated and the library should not be presented as a default production choice.

## 1. Animation orchestration (12)

| # | Repository | Recommended effect | Legacy | Retain / replacement rationale |
| ---: | --- | --- | :---: | --- |
| 001 | [greensock/GSAP](https://github.com/greensock/GSAP) | Scroll-scrubbed, reversible master timeline | No | Retain existing; clearest production-grade timeline and official demos. |
| 002 | [motiondivision/motion](https://github.com/motiondivision/motion) | Shared-layout morph with spring continuity | No | Retain existing; strongest React/DOM shared-layout representative. |
| 003 | [juliangarnier/anime](https://github.com/juliangarnier/anime) | Staggered multi-target choreography | No | Keep for concise stagger and sequencing demos, not layout morphing. |
| 004 | [tweenjs/tween.js](https://github.com/tweenjs/tween.js) | Deterministic numeric/object interpolation | No | Keeps the low-level tween signature separate from DOM frameworks. |
| 005 | [mojs/mojs](https://github.com/mojs/mojs) | Shape burst and radial motion graphics | No | Unique one-shot shape choreography; not a generic entrance preset. |
| 006 | [theatre-js/theatre](https://github.com/theatre-js/theatre) | Visually authored keyframed scene sequence | No | Replaces inactive Velocity; adds an editor-driven motion signature. |
| 007 | [Popmotion/popmotion](https://github.com/Popmotion/popmotion) | Inertial decay after drag release | No | Keep specifically for momentum/decay, avoiding Motion's layout demo. |
| 008 | [pmndrs/react-spring](https://github.com/pmndrs/react-spring) | Chained spring trail across components | No | Distinct multi-component spring propagation and interruption behavior. |
| 009 | [thednp/kute.js](https://github.com/thednp/kute.js) | Complex SVG path morph | No | Best candidate for a compact path-to-path morph demo. |
| 010 | [vueuse/motion](https://github.com/vueuse/motion) | Vue variant/state transition | No | Framework-specific variant composition with maintained docs and demo. |
| 011 | [animate-css/animate.css](https://github.com/animate-css/animate.css) | CSS-only entrance/exit preset | No | Keep one CSS preset collection; absorbs Magic's duplicate signature. |
| 012 | [rive-app/rive-wasm](https://github.com/rive-app/rive-wasm) | Interactive vector state-machine animation | No | Replaces Magic; adds stateful vector behavior rather than another preset pack. |

## 2. Scroll and viewport (12)

| # | Repository | Recommended effect | Legacy | Retain / replacement rationale |
| ---: | --- | --- | :---: | --- |
| 013 | [darkroomengineering/lenis](https://github.com/darkroomengineering/lenis) | Whole-page inertial smooth scrolling | No | Retain existing; current, focused, and ecosystem-backed smooth-scroll winner. |
| 014 | [russellsamora/scrollama](https://github.com/russellsamora/scrollama) | Step-driven pinned scrollytelling | No | Retain existing; discrete narrative steps are a unique signature. |
| 015 | [michalsnik/aos](https://github.com/michalsnik/aos) | Viewport-triggered content reveal | No | Retain as the sole preset reveal winner over ScrollReveal and sal. |
| 016 | [locomotivemtl/locomotive-scroll](https://github.com/locomotivemtl/locomotive-scroll) | Per-element scroll-speed scene | No | Keeps authored speed layers; replaces overlapping Rellax/Jarallax entries. |
| 017 | [dolphin-wood/smooth-scrollbar](https://github.com/dolphin-wood/smooth-scrollbar) | Nested scroll container with elastic overscroll | No | Distinct container/overscroll signature; not a second whole-page Lenis demo. |
| 018 | [alvarotrigo/fullPage.js](https://github.com/alvarotrigo/fullPage.js) | Full-viewport section snapping | No | Unique discrete section navigation with strong official examples. |
| 019 | [14islands/r3f-scroll-rig](https://github.com/14islands/r3f-scroll-rig) | DOM-to-3D scroll synchronization | No | Replaces archived lax.js with a current, visually distinct scroll/3D bridge. |
| 020 | [scroll-into-view/scroll-into-view-if-needed](https://github.com/scroll-into-view/scroll-into-view-if-needed) | Conditional smooth focus-to-target scroll | No | Replaces archived smooth-scroll; trigger is target focus, not wheel inertia. |
| 021 | [Grsmto/simplebar](https://github.com/Grsmto/simplebar) | Styled scrollbar while retaining native scroll | No | Adds a scrollbar-surface effect without replacing native mechanics. |
| 022 | [TanStack/virtual](https://github.com/TanStack/virtual) | Windowed million-row scrolling | No | Adds virtualization as a visibly continuous large-content effect. |
| 023 | [metafizzy/infinite-scroll](https://github.com/metafizzy/infinite-scroll) | Seamless append-at-threshold feed | No | Unique content-growth timing; not parallax, reveal, or smooth scrolling. |
| 024 | [alvarotrigo/multiscroll.js](https://github.com/alvarotrigo/multiscroll.js) | Counter-moving split-screen panels | Yes | Kept for a unique opposing-panel result despite an older implementation. |

## 3. Page, layout, and component transitions (12)

| # | Repository | Recommended effect | Legacy | Retain / replacement rationale |
| ---: | --- | --- | :---: | --- |
| 025 | [swup/swup](https://github.com/swup/swup) | Seamless server-rendered page transition | No | Replaces Barba and archived Highway; same signature, much more active. |
| 026 | [metafizzy/isotope](https://github.com/metafizzy/isotope) | Filtered grid reflow | Yes | Retain existing signature; more recognizable than archived MixItUp. |
| 027 | [formkit/auto-animate](https://github.com/formkit/auto-animate) | Zero-config insert/remove/reorder animation | No | Active cross-framework default for implicit DOM-change transitions. |
| 028 | [aholachek/react-flip-toolkit](https://github.com/aholachek/react-flip-toolkit) | Configurable FLIP shared-element transition | No | Wins over react-flip-move through richer FLIP controls and docs. |
| 029 | [haltu/muuri](https://github.com/haltu/muuri) | Live drag-sort grid reflow | No | Distinct direct-manipulation reflow, separate from filter-triggered Isotope. |
| 030 | [desandro/masonry](https://github.com/desandro/masonry) | Waterfall column packing | No | Unique layout geometry even when no filtering is involved. |
| 031 | [metafizzy/packery](https://github.com/metafizzy/packery) | Gapless bin-packed draggable grid | No | Different visible packing result from Masonry's fixed columns. |
| 032 | [reactjs/react-transition-group](https://github.com/reactjs/react-transition-group) | Mount/unmount enter-exit state transition | No | Keeps a component-lifecycle signature, not a layout algorithm. |
| 033 | [emilkowalski/vaul](https://github.com/emilkowalski/vaul) | Velocity-aware swipe drawer | No | Replaces a duplicate transition manager with modern direct manipulation. |
| 034 | [gridstack/gridstack.js](https://github.com/gridstack/gridstack.js) | Drag-resize dashboard tiles | No | Adds two-axis resizing and collision reflow with an excellent demo. |
| 035 | [nathancahill/split](https://github.com/nathancahill/split) | Draggable split-pane resize | No | Unique divider-controlled geometry change; minimal demo is straightforward. |
| 036 | [shuding/next-view-transitions](https://github.com/shuding/next-view-transitions) | Native cross-route shared-element morph | No | Adds View Transitions API coverage instead of another JS page-fade manager. |

## 4. Navigation, overlays, and direct manipulation (12)

| # | Repository | Recommended effect | Legacy | Retain / replacement rationale |
| ---: | --- | --- | :---: | --- |
| 037 | [nolimits4web/swiper](https://github.com/nolimits4web/swiper) | Touch coverflow with momentum snap | No | Retain existing; sole carousel winner after seven equivalent sliders were removed. |
| 038 | [dimsemenov/PhotoSwipe](https://github.com/dimsemenov/PhotoSwipe) | Thumbnail-to-fullscreen lightbox zoom | No | Retain existing; sole gallery-lightbox winner over three equivalents. |
| 039 | [FrDH/mmenu-js](https://github.com/FrDH/mmenu-js) | Nested off-canvas navigation panels | No | Replaces a duplicate carousel with a different page-layer transition. |
| 040 | [nilbuild/driver.js](https://github.com/nilbuild/driver.js) | Spotlight tour with focus handoff | No | Current canonical repository; strong official demo and unique overlay mask. |
| 041 | [sweetalert2/sweetalert2](https://github.com/sweetalert2/sweetalert2) | Animated accessible modal alert | No | Adds modal scale/backdrop choreography, not another lightbox. |
| 042 | [dip/cmdk](https://github.com/dip/cmdk) | Filtered command-palette overlay | No | Canonical successor of pacocoursey/cmdk; distinctive search-to-result motion. |
| 043 | [timolins/react-hot-toast](https://github.com/timolins/react-hot-toast) | Entering, stacking, dismissing toast queue | No | Unique transient edge-layer timing and clear runnable examples. |
| 044 | [floating-ui/floating-ui](https://github.com/floating-ui/floating-ui) | Tooltip/popover flip-and-shift placement | No | Dynamic anchored repositioning is visually unlike modal or menu transitions. |
| 045 | [szhsin/react-menu](https://github.com/szhsin/react-menu) | Nested menu/submenu transition | No | Adds hierarchical anchored navigation with current framework support. |
| 046 | [clauderic/dnd-kit](https://github.com/clauderic/dnd-kit) | Drag overlay and drop-preview movement | No | Modern direct-manipulation representative with a strong demo surface. |
| 047 | [pmndrs/use-gesture](https://github.com/pmndrs/use-gesture) | Bound spring drag/pinch interaction | No | Keeps generic gesture physics separate from image-only pan/zoom. |
| 048 | [hakimel/reveal.js](https://github.com/hakimel/reveal.js) | Spatial slide-deck navigation | No | Replaces a duplicate lightbox with nested horizontal/vertical navigation. |

## 5. Pointer and hover (12)

| # | Repository | Recommended effect | Legacy | Retain / replacement rationale |
| ---: | --- | --- | :---: | --- |
| 049 | [wagerfield/parallax](https://github.com/wagerfield/parallax) | Pointer/device-orientation depth layers | No | Retain existing; trigger differs from scroll parallax. |
| 050 | [micku7zu/vanilla-tilt.js](https://github.com/micku7zu/vanilla-tilt.js) | Perspective card tilt with moving glare | No | Retain as sole tilt winner over Atropos, react-parallax-tilt, and tilt.js. |
| 051 | [Cuberto/mouse-follower](https://github.com/Cuberto/mouse-follower) | Contextual cursor that changes media/text | No | Retain existing; effect is a semantic cursor layer, not a trail. |
| 052 | [robin-dela/hover-effect](https://github.com/robin-dela/hover-effect) | Displacement-map image hover transition | No | Retain existing; wins over webgl-mouseover-effects for focused API/demo. |
| 053 | [IanLunn/Hover](https://github.com/IanLunn/Hover) | CSS underline/sweep hover reveal | No | Keep one CSS hover collection; demo a non-tilt, non-image-warp preset. |
| 054 | [tholman/cursor-effects](https://github.com/tholman/cursor-effects) | Persistent cursor particle trail | No | Distinct temporal trail signature with a maintained demo gallery. |
| 055 | [akella/fake3d](https://github.com/akella/fake3d) | Pointer-driven depth-map portrait | Yes | Unique pseudo-3D image displacement; old but self-contained demo. |
| 056 | [codrops/MagneticButtons](https://github.com/codrops/MagneticButtons) | Button attracted toward the pointer | Yes | Replaces duplicate tilt candidates with magnetic positional feedback. |
| 057 | [codrops/DirectionAwareHoverEffect](https://github.com/codrops/DirectionAwareHoverEffect) | Overlay enters from pointer approach direction | Yes | Unique direction-sensitive timing; isolate its older jQuery demo. |
| 058 | [codrops/GooeyTextHoverEffect](https://github.com/codrops/GooeyTextHoverEffect) | SVG-filter gooey text hover | No | Recent Codrops demo; different output from scramble or displacement images. |
| 059 | [codrops/InteractivePoints](https://github.com/codrops/InteractivePoints) | Hotspot hover revealing hidden image regions | Yes | Replaces broad Shery.js with a single reproducible visual signature. |
| 060 | [codrops/StackMotionHoverEffects](https://github.com/codrops/StackMotionHoverEffects) | Colored card stack expands behind hovered item | Yes | Replaces momentum-slider's carousel duplicate with layered stack motion. |

## 6. Text and SVG (12)

| # | Repository | Recommended effect | Legacy | Retain / replacement rationale |
| ---: | --- | --- | :---: | --- |
| 061 | [maxwellito/vivus](https://github.com/maxwellito/vivus) | SVG stroke-drawing reveal | Yes | Retain existing and remove Walkway's identical result; demo remains clear. |
| 062 | [airbnb/lottie-web](https://github.com/airbnb/lottie-web) | State-controlled vector illustration | No | Retain existing; strongest vector motion asset ecosystem. |
| 063 | [mattboldt/typed.js](https://github.com/mattboldt/typed.js) | Typewriter with erase/retype loop | No | Sole typewriter winner over TypeIt and typewriterjs. |
| 064 | [shshaw/Splitting](https://github.com/shshaw/Splitting) | Per-character CSS stagger | No | Adds DOM text segmentation and cascading variables, not typing. |
| 065 | [bradley/Blotter](https://github.com/bradley/Blotter) | Shader-distorted live typography | Yes | Unique text-material effect; old rendering stack warrants a legacy label. |
| 066 | [tol-is/use-scramble](https://github.com/tol-is/use-scramble) | Randomized decode/scramble reveal | No | Replaces archived Baffle with an active equivalent. |
| 067 | [svgdotjs/svg.js](https://github.com/svgdotjs/svg.js) | Interactive programmatic SVG animation | No | Maintained SVG foundation with strong runnable examples. |
| 068 | [rough-stuff/rough](https://github.com/rough-stuff/rough) | Hand-drawn path appearance and seed transition | No | Adds a sketch-material result, visually distinct from clean SVG strokes. |
| 069 | [akzhy/Vara](https://github.com/akzhy/Vara) | Handwritten text path animation | No | Keep for font-like handwriting, distinct from arbitrary-path Vivus. |
| 070 | [tombcato/smart-ticker](https://github.com/tombcato/smart-ticker) | Character-diff text/number transition | No | Active multilingual replacement for archived Odometer-style counters. |
| 071 | [pqina/flip](https://github.com/pqina/flip) | Mechanical split-flap character change | No | Adds a materialized flip-clock result with maintained official demo. |
| 072 | [veltman/flubber](https://github.com/veltman/flubber) | Smooth SVG shape-to-shape interpolation | No | Replaces Walkway's duplicate drawing slot with actual topology morphing. |

## 7. Canvas 2D and creative coding (12)

| # | Repository | Recommended effect | Legacy | Retain / replacement rationale |
| ---: | --- | --- | :---: | --- |
| 073 | [pixijs/pixijs](https://github.com/pixijs/pixijs) | Filtered sprite field with interaction | No | High-performance scene/filter representative with extensive examples. |
| 074 | [processing/p5.js](https://github.com/processing/p5.js) | Generative noise-flow sketch | No | Best approachable creative-coding demo ecosystem. |
| 075 | [paperjs/paper.js](https://github.com/paperjs/paper.js) | Boolean/path geometry animation | No | Unique vector-geometry scripting on Canvas. |
| 076 | [fabricjs/fabric.js](https://github.com/fabricjs/fabric.js) | Select/rotate/scale canvas objects | No | Focus on editable serialized objects, not a general scene renderer. |
| 077 | [konvajs/konva](https://github.com/konvajs/konva) | Layered drag-and-transform canvas nodes | No | Strong event/layer demo; use a multi-node transformer effect. |
| 078 | [jonobr1/two.js](https://github.com/jonobr1/two.js) | Renderer-agnostic animated vector scene | No | Unique same-scene Canvas/SVG/WebGL renderer comparison. |
| 079 | [CreateJS/EaselJS](https://github.com/CreateJS/EaselJS) | Hierarchical display-list scene | No | Mature but recently updated; clear nested-transform signature. |
| 080 | [phaserjs/phaser](https://github.com/phaserjs/phaser) | Arcade sprite/tile interaction | No | Adds game-loop camera and sprite behavior, not a design editor. |
| 081 | [liabru/matter-js](https://github.com/liabru/matter-js) | Pointer-driven rigid-body pile | No | Canonical 2D physics visual with excellent demos. |
| 082 | [williamngan/pts](https://github.com/williamngan/pts) | Geometric point-field response | No | Focused interactive geometry style distinct from p5's sketch API. |
| 083 | [metafizzy/zdog](https://github.com/metafizzy/zdog) | Drag-to-rotate pseudo-3D illustration | No | Flat, rounded pseudo-3D output is visually unlike real WebGL. |
| 084 | [tldraw/tldraw](https://github.com/tldraw/tldraw) | Infinite-canvas shapes/connectors | No | Adds camera-space direct manipulation and production-quality demo. |

## 8. 3D and WebGL (12)

| # | Repository | Recommended effect | Legacy | Retain / replacement rationale |
| ---: | --- | --- | :---: | --- |
| 085 | [pmndrs/react-three-fiber](https://github.com/pmndrs/react-three-fiber) | Declarative interactive 3D component scene | No | Retain existing; strongest React/Three integration and examples. |
| 086 | [mrdoob/three.js](https://github.com/mrdoob/three.js) | Morph-target mesh animation | No | Core ecosystem winner; choose morph targets to avoid framework duplication. |
| 087 | [BabylonJS/Babylon.js](https://github.com/BabylonJS/Babylon.js) | Glow-layer real-time scene | No | Use engine-native glow/material demo, not another basic rotating cube. |
| 088 | [playcanvas/engine](https://github.com/playcanvas/engine) | WebGPU/WebGL Gaussian-splat scene | No | Distinct splat-rendered spatial result and current engine activity. |
| 089 | [oframe/ogl](https://github.com/oframe/ogl) | Lightweight instanced geometry field | No | Minimal renderer with official live examples and tiny demo code. |
| 090 | [regl-project/regl](https://github.com/regl-project/regl) | Functional GPU draw-loop visualization | No | Unique data-driven command model; use an instanced point cloud. |
| 091 | [martinlaxenaire/curtainsjs](https://github.com/martinlaxenaire/curtainsjs) | DOM image converted to interactive WebGL plane | No | Keeps HTML/WebGL alignment as its defining visual signature. |
| 092 | [google/model-viewer](https://github.com/google/model-viewer) | Product model orbit plus AR handoff | No | Purpose-built and accessible product-viewing effect. |
| 093 | [aframevr/aframe](https://github.com/aframevr/aframe) | Immersive WebXR scene navigation | No | Unique immersive page layer; active official examples. |
| 094 | [Tresjs/tres](https://github.com/Tresjs/tres) | Vue-declarative portal/environment scene | No | Vue ecosystem representative; demo a portal rather than a basic model. |
| 095 | [threlte/threlte](https://github.com/threlte/threlte) | Svelte-declarative 3D transition | No | Svelte-specific transition integration and current documentation. |
| 096 | [pmndrs/postprocessing](https://github.com/pmndrs/postprocessing) | Bloom/DOF post-processing stack | No | Adds screen-space material change, not another scene graph. |

## 9. Backgrounds and ambient effects (12)

| # | Repository | Recommended effect | Legacy | Retain / replacement rationale |
| ---: | --- | --- | :---: | --- |
| 097 | [PavelDoGreat/WebGL-Fluid-Simulation](https://github.com/PavelDoGreat/WebGL-Fluid-Simulation) | Cursor-injected color fluid | No | Retain existing; uniquely recognizable GPU simulation. |
| 098 | [tsparticles/tsparticles](https://github.com/tsparticles/tsparticles) | Continuous responsive particle network | No | Retain as sole ambient-particle winner over particles.js/particleground. |
| 099 | [tengbao/vanta](https://github.com/tengbao/vanta) | Drop-in animated 3D hero background | No | Curated full-surface background presets with clear official demo. |
| 100 | [catdad/canvas-confetti](https://github.com/catdad/canvas-confetti) | One-shot gravity confetti burst | No | Event-timed foreground celebration differs from ambient particles. |
| 101 | [sarcadass/granim.js](https://github.com/sarcadass/granim.js) | Fluid multi-stop gradient transition | Yes | Unique gradient material effect; old but self-contained and documented. |
| 102 | [qrohlf/trianglify](https://github.com/qrohlf/trianglify) | Seeded low-poly mosaic transition | No | Adds deterministic polygon texture, not a particle field. |
| 103 | [crashmax-dev/fireworks-js](https://github.com/crashmax-dev/fireworks-js) | Night-sky fireworks with trails | No | Visually distinct pyrotechnic timing and active framework wrappers. |
| 104 | [hustcc/ribbon.js](https://github.com/hustcc/ribbon.js) | Minimal drifting canvas ribbon | Yes | Unique 1 KB ribbon result; present as legacy inspiration only. |
| 105 | [wagerfield/flat-surface-shader](https://github.com/wagerfield/flat-surface-shader) | Lit triangulated wave surface | Yes | Unique low-poly lighting signature; legacy implementation, excellent demo. |
| 106 | [css-doodle/css-doodle](https://github.com/css-doodle/css-doodle) | Generated CSS grid pattern animation | No | Replaces old particle slot with active CSS-native generative visuals. |
| 107 | [xemantic/shader-web-background](https://github.com/xemantic/shader-web-background) | Full-page fragment-shader background | No | Current, focused bridge for Shadertoy-style backgrounds. |
| 108 | [hunar4321/particle-life](https://github.com/hunar4321/particle-life) | Emergent attraction/repulsion swarms | No | Replaces old Stardust slot with a maintained emergent-system visual. |

## 10. Image and media effects (12)

| # | Repository | Recommended effect | Legacy | Retain / replacement rationale |
| ---: | --- | --- | :---: | --- |
| 109 | [sneas/img-comparison-slider](https://github.com/sneas/img-comparison-slider) | Drag-to-reveal before/after comparison | No | Retain existing; unique direct ratio control. |
| 110 | [gl-transitions/gl-transitions](https://github.com/gl-transitions/gl-transitions) | Shader image/video transition | No | Retain existing; active open transition collection. |
| 111 | [francoischalifour/medium-zoom](https://github.com/francoischalifour/medium-zoom) | In-document focal image zoom | No | Sole lightweight single-image zoom winner over Zooming/Lightense. |
| 112 | [timmywil/panzoom](https://github.com/timmywil/panzoom) | Pinch/wheel pan-and-zoom surface | No | Generic transform surface; separate from PhotoSwipe's gallery overlay. |
| 113 | [openseadragon/openseadragon](https://github.com/openseadragon/openseadragon) | Tiled gigapixel deep zoom | No | Unique progressive tile-loading spatial effect and active project. |
| 114 | [fengyuanchen/cropperjs](https://github.com/fengyuanchen/cropperjs) | Interactive crop box and image transform | No | Strong current crop UI and official demo. |
| 115 | [strawdynamics/drift](https://github.com/strawdynamics/drift) | Hover magnifier lens | No | Pointer lens/page-layer signature differs from click-to-zoom. |
| 116 | [meltingice/CamanJS](https://github.com/meltingice/CamanJS) | Canvas vintage-filter crossfade | Yes | Keep only for the Canvas filter pipeline; do not recommend for new apps. |
| 117 | [evanw/glfx.js](https://github.com/evanw/glfx.js) | WebGL bulge/pinch image warp | Yes | Unique real-time warp result; legacy API should stay inside demo. |
| 118 | [pqina/filepond](https://github.com/pqina/filepond) | Drop-upload image preview transition | No | Replaces duplicate image viewer with a different media lifecycle. |
| 119 | [nhn/tui.image-editor](https://github.com/nhn/tui.image-editor) | Full image-editing canvas UI | No | Adds crop/draw/filter workspace rather than passive viewing. |
| 120 | [muxinc/media-chrome](https://github.com/muxinc/media-chrome) | Responsive custom media-control chrome | No | Replaces duplicate zoom slot with maintained audio/video UI visuals. |

## Duplicate and replacement audit

The proposed list had no literal repository-name duplicates, but visual-signature dedupe removed equivalent outcomes. The main decisions are:

| Removed candidates | Duplicate / quality finding | Winner or replacement |
| --- | --- | --- |
| `julianshapiro/velocity`, `miniMAC/magic` | Inactive/generic animation results already covered | `theatre-js/theatre`, `rive-app/rive-wasm` |
| `jlmakes/scrollreveal`, `mciastek/sal` | Same viewport reveal as AOS | `michalsnik/aos` |
| `alexfoxy/lax.js` | Archived and overlaps scroll-linked transforms | `14islands/r3f-scroll-rig` |
| `janpaepke/ScrollMagic` | Same scroll-scrub timeline as current GSAP demo | `greensock/GSAP` |
| `dixonandmoe/rellax`, `nk-o/jarallax` | Same continuous scroll-parallax result | `locomotivemtl/locomotive-scroll` |
| `barbajs/barba`, `dept/highway` | Same seamless page-transition signature; Highway archived | `swup/swup` |
| `joshwcomeau/react-flip-move` | Same FLIP list/layout motion | `aholachek/react-flip-toolkit` |
| `patrickkunka/mixitup` | Archived and duplicates filter/sort reflow | `metafizzy/isotope` |
| Embla, Splide, Keen, Glide, Flickity, tiny-slider, Slick | Seven equivalent drag/snap carousel results | `nolimits4web/swiper`; slots become navigation/overlay effects |
| lightGallery, GLightbox, Yet Another React Lightbox | Three equivalent gallery overlays | `dimsemenov/PhotoSwipe` |
| Atropos, react-parallax-tilt, tilt.js | Same pointer-to-perspective card tilt | `micku7zu/vanilla-tilt.js` |
| `akella/webgl-mouseover-effects` | Same displacement-image hover result | `robin-dela/hover-effect` |
| `sheryianscodingschool/sheryjs` | Composite pack whose showcased signatures already have focused winners | Mouse Follower, Hover Effect, Splitting |
| `lmgonzalves/momentum-slider` | Another drag/momentum slider | Pointer hotspot/stack effects instead |
| TypeIt, typewriterjs | Same typing/erase loop | `mattboldt/typed.js` |
| `camwiegert/baffle` | Archived scramble effect | `tol-is/use-scramble` |
| `ConnorAtherton/walkway` | Same SVG path draw as Vivus | `maxwellito/vivus`; add Flubber morph |
| particles.js, particleground | Same ambient particle-network result | `tsparticles/tsparticles` |
| `stardustjs/stardust` | Old visualization toolkit, weak background-specific demo | CSS Doodle / shader-web-background / Particle Life |
| Zooming, Lightense Images | Same click-to-zoom image result | `francoischalifour/medium-zoom` |
| Viewer.js | Same full-screen gallery/viewer layer as PhotoSwipe | `dimsemenov/PhotoSwipe` |

## Handoff notes

1. Keep the final catalog keyed by canonical `owner/repo`; never key by display title.
2. Put the **14 legacy entries** in the main table only if the demo can be isolated with no obsolete dependency leaking into the site build. Otherwise move them to Backup without changing the 120-project research record.
3. For general engines, capture only the recommended effect above. This is what makes Three.js, Babylon.js, PlayCanvas, OGL, and regl visually non-duplicative.
4. The current `barba.gif` and Barba demo should be replaced by Swup rather than keeping both.
5. Re-run the GitHub API check before publishing stars and `pushed_at`; these are snapshots, not durable catalog data.
