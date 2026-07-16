# Awesome Web Effects

[中文文档](README.zh-CN.md) · [Live demo](https://giraffe-tree.github.io/awesome-interaction/)

An **effect-first**, code-first atlas of open-source interactions for the web. It catalogs **121 distinct effects across 10 categories**, backed by **120 source projects**. Each effect is one row with a stable semantic key, a recommended implementation, and copyable minimal code. English is the default interface and documentation language.

## Effect-first model

- **Effect is the catalog key.** Anchors, search results, rows, categories, and code examples begin with the visible interaction—not the repository.
- **Projects are implementation sources.** One project may power several distinct effects; 1 source project currently demonstrates this relation in the seed catalog.
- **An effect may have multiple implementations.** Each source relation owns its own minimal snippet and GIF preview, so alternatives can be compared without duplicating the effect row.
- **Deduplication happens at the visible-effect level.** Candidates are compared by trigger, visual change, time relationship, and page layer; the newer, maintained, better-documented implementation becomes the recommended source.

## Catalog snapshot

- 121 effect rows, including 20 baseline effects.
- 120 unique GitHub source projects; 101 were added during the 2026 expansion.
- 19 source-specific GIF previews; all other rows are explicitly code-first.
- 14 useful older sources are marked **Legacy**; no archived repository is included.
- Stars are a snapshot from **2026-07-16**, not a live counter.
- The optimized GIF set remains **15.81 MiB**, down from 27.28 MiB (42.03% smaller).

## Selection rules

1. Every row must describe one visible interaction effect that can appear in a normal web page.
2. Every effect needs a stable bilingual name, a semantic effect ID, a category, and at least one verifiable source.
3. Repository duplication across different effect rows is valid; duplicate effect IDs or effect names are not.
4. Every effect has exactly one recommended source. Alternatives belong inside the same row instead of creating duplicate effects.
5. Minimal code and preview media belong to the effect–source relation, because implementations differ by project.

## Categories

| Category | Effects | Source projects | Visible result |
| --- | ---: | ---: | --- |
| [Motion & choreography](#animation) | 12 | 12 | Timelines, springs, tweens, class animation, and framework-native motion. |
| [Scroll & reveal](#scroll) | 13 | 13 | Smooth scrolling, scroll-linked scenes, reveals, parallax, and snap navigation. |
| [Page & layout](#transition) | 12 | 12 | Page transitions, FLIP motion, filtering, packing, and animated reflow. |
| [Navigation & overlays](#carousel) | 12 | 12 | Carousel, lightbox, menus, tours, notifications, drag overlays, and spatial navigation. |
| [Pointer & hover](#pointer) | 12 | 12 | Tilt, depth, custom cursors, magnetic motion, and image distortion. |
| [Text & SVG](#vector) | 12 | 12 | Typing, text splitting, vector drawing, handwriting, and SVG morphing. |
| [Canvas & 2D](#canvas) | 12 | 12 | Scene graphs, creative coding, physics, drawing tools, and 2D renderers. |
| [3D & WebGL](#webgl) | 12 | 12 | 3D engines, declarative renderers, shader layers, and post-processing. |
| [Background & particles](#background) | 12 | 12 | Fluid, particles, gradients, confetti, meshes, ribbons, and fireworks. |
| [Media & image](#media) | 12 | 12 | Comparison, pan-and-zoom, cropping, filters, lens zoom, and shader transitions. |

## Effect catalog

<a id="animation"></a>

### Motion & choreography

Timelines, springs, tweens, class animation, and framework-native motion.

| Effect | Recommended source | Stars | Implementations | Status | Minimal code |
| --- | --- | ---: | ---: | --- | --- |
| [Scroll-scrubbed master timeline](https://giraffe-tree.github.io/awesome-interaction/#scroll-scrubbed-master-timeline) | [GSAP](https://github.com/greensock/GSAP) | 26,600 | 1 | Recommended | [Open](https://giraffe-tree.github.io/awesome-interaction/#scroll-scrubbed-master-timeline) |
| [Shared-layout spring morph](https://giraffe-tree.github.io/awesome-interaction/#shared-layout-spring-morph) | [Motion](https://github.com/motiondivision/motion) | 32,819 | 1 | Recommended | [Open](https://giraffe-tree.github.io/awesome-interaction/#shared-layout-spring-morph) |
| [Staggered transform choreography](https://giraffe-tree.github.io/awesome-interaction/#staggered-transform-choreography) | [Anime.js](https://github.com/juliangarnier/anime) | 71,056 | 1 | Recommended | [Open](https://giraffe-tree.github.io/awesome-interaction/#staggered-transform-choreography) |
| [Render-agnostic value tween](https://giraffe-tree.github.io/awesome-interaction/#render-agnostic-value-tween) | [Tween.js](https://github.com/tweenjs/tween.js) | 10,129 | 1 | Recommended | [Open](https://giraffe-tree.github.io/awesome-interaction/#render-agnostic-value-tween) |
| [Motion-graphics burst](https://giraffe-tree.github.io/awesome-interaction/#motion-graphics-burst) | [Mo.js](https://github.com/mojs/mojs) | 18,728 | 1 | Recommended | [Open](https://giraffe-tree.github.io/awesome-interaction/#motion-graphics-burst) |
| [Visually authored keyframe sequence](https://giraffe-tree.github.io/awesome-interaction/#visually-authored-keyframe-sequence) | [Theatre.js](https://github.com/theatre-js/theatre) | 12,541 | 1 | Recommended | [Open](https://giraffe-tree.github.io/awesome-interaction/#visually-authored-keyframe-sequence) |
| [Functional value pipeline](https://giraffe-tree.github.io/awesome-interaction/#functional-value-pipeline) | [Popmotion](https://github.com/Popmotion/popmotion) | 20,167 | 1 | Recommended | [Open](https://giraffe-tree.github.io/awesome-interaction/#functional-value-pipeline) |
| [Hook-driven spring motion](https://giraffe-tree.github.io/awesome-interaction/#hook-driven-spring-motion) | [React Spring](https://github.com/pmndrs/react-spring) | 29,127 | 1 | Recommended | [Open](https://giraffe-tree.github.io/awesome-interaction/#hook-driven-spring-motion) |
| [Compact SVG shape tween](https://giraffe-tree.github.io/awesome-interaction/#compact-svg-shape-tween) | [KUTE.js](https://github.com/thednp/kute.js) | 2,639 | 1 | Recommended | [Open](https://giraffe-tree.github.io/awesome-interaction/#compact-svg-shape-tween) |
| [Vue directive motion state](https://giraffe-tree.github.io/awesome-interaction/#vue-directive-motion-state) | [VueUse Motion](https://github.com/vueuse/motion) | 2,753 | 1 | Recommended | [Open](https://giraffe-tree.github.io/awesome-interaction/#vue-directive-motion-state) |
| [CSS class entrance animation](https://giraffe-tree.github.io/awesome-interaction/#css-class-entrance-animation) | [Animate.css](https://github.com/animate-css/animate.css) | 82,667 | 1 | Recommended | [Open](https://giraffe-tree.github.io/awesome-interaction/#css-class-entrance-animation) |
| [Interactive vector state machine](https://giraffe-tree.github.io/awesome-interaction/#interactive-vector-state-machine) | [Rive Web](https://github.com/rive-app/rive-wasm) | 954 | 1 | Recommended | [Open](https://giraffe-tree.github.io/awesome-interaction/#interactive-vector-state-machine) |

<a id="scroll"></a>

### Scroll & reveal

Smooth scrolling, scroll-linked scenes, reveals, parallax, and snap navigation.

| Effect | Recommended source | Stars | Implementations | Status | Minimal code |
| --- | --- | ---: | ---: | --- | --- |
| [Pinned horizontal scroll scene](https://giraffe-tree.github.io/awesome-interaction/#pinned-horizontal-scroll-scene) | [GSAP](https://github.com/greensock/GSAP) | 26,600 | 1 | Recommended | [Open](https://giraffe-tree.github.io/awesome-interaction/#pinned-horizontal-scroll-scene) |
| [Native-friendly inertial scrolling](https://giraffe-tree.github.io/awesome-interaction/#native-friendly-inertial-scrolling) | [Lenis](https://github.com/darkroomengineering/lenis) | 14,373 | 1 | Recommended | [Open](https://giraffe-tree.github.io/awesome-interaction/#native-friendly-inertial-scrolling) |
| [Step-based scrollytelling](https://giraffe-tree.github.io/awesome-interaction/#step-based-scrollytelling) | [Scrollama](https://github.com/russellsamora/scrollama) | 5,985 | 1 | Recommended | [Open](https://giraffe-tree.github.io/awesome-interaction/#step-based-scrollytelling) |
| [Data-attribute viewport reveal](https://giraffe-tree.github.io/awesome-interaction/#data-attribute-viewport-reveal) | [AOS](https://github.com/michalsnik/aos) | 28,069 | 1 | Recommended | [Open](https://giraffe-tree.github.io/awesome-interaction/#data-attribute-viewport-reveal) |
| [Data-driven scroll transforms](https://giraffe-tree.github.io/awesome-interaction/#data-driven-scroll-transforms) | [Locomotive Scroll](https://github.com/locomotivemtl/locomotive-scroll) | 8,825 | 1 | Recommended | [Open](https://giraffe-tree.github.io/awesome-interaction/#data-driven-scroll-transforms) |
| [Inertial custom scroll container](https://giraffe-tree.github.io/awesome-interaction/#inertial-custom-scroll-container) | [Smooth Scrollbar](https://github.com/dolphin-wood/smooth-scrollbar) | 3,354 | 1 | Recommended | [Open](https://giraffe-tree.github.io/awesome-interaction/#inertial-custom-scroll-container) |
| [DOM-to-3D scroll synchronization](https://giraffe-tree.github.io/awesome-interaction/#dom-to-3d-scroll-synchronization) | [r3f-scroll-rig](https://github.com/14islands/r3f-scroll-rig) | 954 | 1 | Recommended | [Open](https://giraffe-tree.github.io/awesome-interaction/#dom-to-3d-scroll-synchronization) |
| [Conditional focus-to-target scroll](https://giraffe-tree.github.io/awesome-interaction/#conditional-focus-to-target-scroll) | [scroll-into-view-if-needed](https://github.com/scroll-into-view/scroll-into-view-if-needed) | 1,449 | 1 | Recommended | [Open](https://giraffe-tree.github.io/awesome-interaction/#conditional-focus-to-target-scroll) |
| [Styled native scrollbar surface](https://giraffe-tree.github.io/awesome-interaction/#styled-native-scrollbar-surface) | [SimpleBar](https://github.com/Grsmto/simplebar) | 6,411 | 1 | Recommended | [Open](https://giraffe-tree.github.io/awesome-interaction/#styled-native-scrollbar-surface) |
| [Windowed million-row scrolling](https://giraffe-tree.github.io/awesome-interaction/#windowed-million-row-scrolling) | [TanStack Virtual](https://github.com/TanStack/virtual) | 7,004 | 1 | Recommended | [Open](https://giraffe-tree.github.io/awesome-interaction/#windowed-million-row-scrolling) |
| [Append-at-threshold continuous feed](https://giraffe-tree.github.io/awesome-interaction/#append-at-threshold-continuous-feed) | [Infinite Scroll](https://github.com/metafizzy/infinite-scroll) | 7,483 | 1 | Recommended | [Open](https://giraffe-tree.github.io/awesome-interaction/#append-at-threshold-continuous-feed) |
| [Full-screen section snapping](https://giraffe-tree.github.io/awesome-interaction/#full-screen-section-snapping) | [fullPage.js](https://github.com/alvarotrigo/fullPage.js) | 35,422 | 1 | Recommended | [Open](https://giraffe-tree.github.io/awesome-interaction/#full-screen-section-snapping) |
| [Counter-moving split-screen panels](https://giraffe-tree.github.io/awesome-interaction/#counter-moving-split-screen-panels) | [multiScroll.js](https://github.com/alvarotrigo/multiscroll.js) | 1,572 | 1 | Legacy | [Open](https://giraffe-tree.github.io/awesome-interaction/#counter-moving-split-screen-panels) |

<a id="transition"></a>

### Page & layout

Page transitions, FLIP motion, filtering, packing, and animated reflow.

| Effect | Recommended source | Stars | Implementations | Status | Minimal code |
| --- | --- | ---: | ---: | --- | --- |
| [Progressively enhanced page swap](https://giraffe-tree.github.io/awesome-interaction/#progressively-enhanced-page-swap) | [Swup](https://github.com/swup/swup) | 5,198 | 1 | Recommended | [Open](https://giraffe-tree.github.io/awesome-interaction/#progressively-enhanced-page-swap) |
| [Filterable grid reflow](https://giraffe-tree.github.io/awesome-interaction/#filterable-grid-reflow) | [Isotope](https://github.com/metafizzy/isotope) | 11,103 | 1 | Legacy | [Open](https://giraffe-tree.github.io/awesome-interaction/#filterable-grid-reflow) |
| [One-call DOM reflow animation](https://giraffe-tree.github.io/awesome-interaction/#one-call-dom-reflow-animation) | [AutoAnimate](https://github.com/FormKit/auto-animate) | 13,875 | 1 | Recommended | [Open](https://giraffe-tree.github.io/awesome-interaction/#one-call-dom-reflow-animation) |
| [FLIP shared-element transition](https://giraffe-tree.github.io/awesome-interaction/#flip-shared-element-transition) | [React Flip Toolkit](https://github.com/aholachek/react-flip-toolkit) | 4,189 | 1 | Recommended | [Open](https://giraffe-tree.github.io/awesome-interaction/#flip-shared-element-transition) |
| [Draggable packed grid](https://giraffe-tree.github.io/awesome-interaction/#draggable-packed-grid) | [Muuri](https://github.com/haltu/muuri) | 10,949 | 1 | Recommended | [Open](https://giraffe-tree.github.io/awesome-interaction/#draggable-packed-grid) |
| [Column-based masonry layout](https://giraffe-tree.github.io/awesome-interaction/#column-based-masonry-layout) | [Masonry](https://github.com/desandro/masonry) | 16,710 | 1 | Recommended | [Open](https://giraffe-tree.github.io/awesome-interaction/#column-based-masonry-layout) |
| [Gap-filling bin-pack layout](https://giraffe-tree.github.io/awesome-interaction/#gap-filling-bin-pack-layout) | [Packery](https://github.com/metafizzy/packery) | 4,316 | 1 | Recommended | [Open](https://giraffe-tree.github.io/awesome-interaction/#gap-filling-bin-pack-layout) |
| [Component enter-exit state machine](https://giraffe-tree.github.io/awesome-interaction/#component-enter-exit-state-machine) | [React Transition Group](https://github.com/reactjs/react-transition-group) | 10,234 | 1 | Recommended | [Open](https://giraffe-tree.github.io/awesome-interaction/#component-enter-exit-state-machine) |
| [Velocity-aware swipe drawer](https://giraffe-tree.github.io/awesome-interaction/#velocity-aware-swipe-drawer) | [Vaul](https://github.com/emilkowalski/vaul) | 8,479 | 1 | Recommended | [Open](https://giraffe-tree.github.io/awesome-interaction/#velocity-aware-swipe-drawer) |
| [Drag-resize dashboard collision reflow](https://giraffe-tree.github.io/awesome-interaction/#drag-resize-dashboard-collision-reflow) | [GridStack](https://github.com/gridstack/gridstack.js) | 8,994 | 1 | Recommended | [Open](https://giraffe-tree.github.io/awesome-interaction/#drag-resize-dashboard-collision-reflow) |
| [Draggable split-pane resize](https://giraffe-tree.github.io/awesome-interaction/#draggable-split-pane-resize) | [Split.js](https://github.com/nathancahill/split) | 6,277 | 1 | Recommended | [Open](https://giraffe-tree.github.io/awesome-interaction/#draggable-split-pane-resize) |
| [Native cross-route shared-element morph](https://giraffe-tree.github.io/awesome-interaction/#native-cross-route-shared-element-morph) | [next-view-transitions](https://github.com/shuding/next-view-transitions) | 2,385 | 1 | Recommended | [Open](https://giraffe-tree.github.io/awesome-interaction/#native-cross-route-shared-element-morph) |

<a id="carousel"></a>

### Navigation & overlays

Carousel, lightbox, menus, tours, notifications, drag overlays, and spatial navigation.

| Effect | Recommended source | Stars | Implementations | Status | Minimal code |
| --- | --- | ---: | ---: | --- | --- |
| [Momentum touch carousel](https://giraffe-tree.github.io/awesome-interaction/#momentum-touch-carousel) | [Swiper](https://github.com/nolimits4web/swiper) | 41,869 | 1 | Recommended | [Open](https://giraffe-tree.github.io/awesome-interaction/#momentum-touch-carousel) |
| [Thumbnail-to-lightbox zoom](https://giraffe-tree.github.io/awesome-interaction/#thumbnail-to-lightbox-zoom) | [PhotoSwipe](https://github.com/dimsemenov/PhotoSwipe) | 25,215 | 1 | Recommended | [Open](https://giraffe-tree.github.io/awesome-interaction/#thumbnail-to-lightbox-zoom) |
| [Nested off-canvas navigation panels](https://giraffe-tree.github.io/awesome-interaction/#nested-off-canvas-navigation-panels) | [mmenu.js](https://github.com/FrDH/mmenu-js) | 2,574 | 1 | Recommended | [Open](https://giraffe-tree.github.io/awesome-interaction/#nested-off-canvas-navigation-panels) |
| [Spotlight tour with focus handoff](https://giraffe-tree.github.io/awesome-interaction/#spotlight-tour-with-focus-handoff) | [Driver.js](https://github.com/nilbuild/driver.js) | 26,283 | 1 | Recommended | [Open](https://giraffe-tree.github.io/awesome-interaction/#spotlight-tour-with-focus-handoff) |
| [Animated accessible modal alert](https://giraffe-tree.github.io/awesome-interaction/#animated-accessible-modal-alert) | [SweetAlert2](https://github.com/sweetalert2/sweetalert2) | 18,099 | 1 | Recommended | [Open](https://giraffe-tree.github.io/awesome-interaction/#animated-accessible-modal-alert) |
| [Filtered command-palette overlay](https://giraffe-tree.github.io/awesome-interaction/#filtered-command-palette-overlay) | [cmdk](https://github.com/dip/cmdk) | 12,799 | 1 | Recommended | [Open](https://giraffe-tree.github.io/awesome-interaction/#filtered-command-palette-overlay) |
| [Stacking dismissible toast queue](https://giraffe-tree.github.io/awesome-interaction/#stacking-dismissible-toast-queue) | [react-hot-toast](https://github.com/timolins/react-hot-toast) | 10,956 | 1 | Recommended | [Open](https://giraffe-tree.github.io/awesome-interaction/#stacking-dismissible-toast-queue) |
| [Anchored popover flip and shift](https://giraffe-tree.github.io/awesome-interaction/#anchored-popover-flip-and-shift) | [Floating UI](https://github.com/floating-ui/floating-ui) | 32,665 | 1 | Recommended | [Open](https://giraffe-tree.github.io/awesome-interaction/#anchored-popover-flip-and-shift) |
| [Nested menu and submenu transition](https://giraffe-tree.github.io/awesome-interaction/#nested-menu-and-submenu-transition) | [React Menu](https://github.com/szhsin/react-menu) | 1,218 | 1 | Recommended | [Open](https://giraffe-tree.github.io/awesome-interaction/#nested-menu-and-submenu-transition) |
| [Drag overlay and drop preview](https://giraffe-tree.github.io/awesome-interaction/#drag-overlay-and-drop-preview) | [dnd kit](https://github.com/clauderic/dnd-kit) | 17,408 | 1 | Recommended | [Open](https://giraffe-tree.github.io/awesome-interaction/#drag-overlay-and-drop-preview) |
| [Bound spring drag and pinch](https://giraffe-tree.github.io/awesome-interaction/#bound-spring-drag-and-pinch) | [use-gesture](https://github.com/pmndrs/use-gesture) | 9,620 | 1 | Recommended | [Open](https://giraffe-tree.github.io/awesome-interaction/#bound-spring-drag-and-pinch) |
| [Spatial slide-deck navigation](https://giraffe-tree.github.io/awesome-interaction/#spatial-slide-deck-navigation) | [reveal.js](https://github.com/hakimel/reveal.js) | 71,936 | 1 | Recommended | [Open](https://giraffe-tree.github.io/awesome-interaction/#spatial-slide-deck-navigation) |

<a id="pointer"></a>

### Pointer & hover

Tilt, depth, custom cursors, magnetic motion, and image distortion.

| Effect | Recommended source | Stars | Implementations | Status | Minimal code |
| --- | --- | ---: | ---: | --- | --- |
| [Pointer-driven layer depth](https://giraffe-tree.github.io/awesome-interaction/#pointer-driven-layer-depth) | [Parallax.js](https://github.com/wagerfield/parallax) | 16,583 | 1 | Recommended | [Open](https://giraffe-tree.github.io/awesome-interaction/#pointer-driven-layer-depth) |
| [Perspective tilt and glare](https://giraffe-tree.github.io/awesome-interaction/#perspective-tilt-and-glare) | [vanilla-tilt.js](https://github.com/micku7zu/vanilla-tilt.js) | 4,019 | 1 | Recommended | [Open](https://giraffe-tree.github.io/awesome-interaction/#perspective-tilt-and-glare) |
| [Context-aware custom cursor](https://giraffe-tree.github.io/awesome-interaction/#context-aware-custom-cursor) | [mouse-follower](https://github.com/Cuberto/mouse-follower) | 818 | 1 | Recommended | [Open](https://giraffe-tree.github.io/awesome-interaction/#context-aware-custom-cursor) |
| [Displacement-map image hover](https://giraffe-tree.github.io/awesome-interaction/#displacement-map-image-hover) | [hover-effect](https://github.com/robin-dela/hover-effect) | 1,874 | 1 | Recommended | [Open](https://giraffe-tree.github.io/awesome-interaction/#displacement-map-image-hover) |
| [Reusable CSS hover vocabulary](https://giraffe-tree.github.io/awesome-interaction/#reusable-css-hover-vocabulary) | [Hover.css](https://github.com/IanLunn/Hover) | 29,395 | 1 | Recommended | [Open](https://giraffe-tree.github.io/awesome-interaction/#reusable-css-hover-vocabulary) |
| [Trailing cursor particles](https://giraffe-tree.github.io/awesome-interaction/#trailing-cursor-particles) | [cursor-effects](https://github.com/tholman/cursor-effects) | 4,013 | 1 | Recommended | [Open](https://giraffe-tree.github.io/awesome-interaction/#trailing-cursor-particles) |
| [Depth-map portrait parallax](https://giraffe-tree.github.io/awesome-interaction/#depth-map-portrait-parallax) | [fake3d](https://github.com/akella/fake3d) | 545 | 1 | Legacy | [Open](https://giraffe-tree.github.io/awesome-interaction/#depth-map-portrait-parallax) |
| [Pointer-attracted button motion](https://giraffe-tree.github.io/awesome-interaction/#pointer-attracted-button-motion) | [Magnetic Buttons](https://github.com/codrops/MagneticButtons) | 485 | 1 | Legacy | [Open](https://giraffe-tree.github.io/awesome-interaction/#pointer-attracted-button-motion) |
| [Approach-direction overlay entrance](https://giraffe-tree.github.io/awesome-interaction/#approach-direction-overlay-entrance) | [Direction-Aware Hover](https://github.com/codrops/DirectionAwareHoverEffect) | 393 | 1 | Legacy | [Open](https://giraffe-tree.github.io/awesome-interaction/#approach-direction-overlay-entrance) |
| [SVG-filter gooey text hover](https://giraffe-tree.github.io/awesome-interaction/#svg-filter-gooey-text-hover) | [Gooey Text Hover](https://github.com/codrops/GooeyTextHoverEffect) | 155 | 1 | Recommended | [Open](https://giraffe-tree.github.io/awesome-interaction/#svg-filter-gooey-text-hover) |
| [Hotspot-revealed image regions](https://giraffe-tree.github.io/awesome-interaction/#hotspot-revealed-image-regions) | [Interactive Points](https://github.com/codrops/InteractivePoints) | 302 | 1 | Legacy | [Open](https://giraffe-tree.github.io/awesome-interaction/#hotspot-revealed-image-regions) |
| [Expanding colored card stack](https://giraffe-tree.github.io/awesome-interaction/#expanding-colored-card-stack) | [Stack Motion Hover](https://github.com/codrops/StackMotionHoverEffects) | 499 | 1 | Legacy | [Open](https://giraffe-tree.github.io/awesome-interaction/#expanding-colored-card-stack) |

<a id="vector"></a>

### Text & SVG

Typing, text splitting, vector drawing, handwriting, and SVG morphing.

| Effect | Recommended source | Stars | Implementations | Status | Minimal code |
| --- | --- | ---: | ---: | --- | --- |
| [SVG stroke drawing](https://giraffe-tree.github.io/awesome-interaction/#svg-stroke-drawing) | [Vivus](https://github.com/maxwellito/vivus) | 15,479 | 1 | Legacy | [Open](https://giraffe-tree.github.io/awesome-interaction/#svg-stroke-drawing) |
| [After Effects vector playback](https://giraffe-tree.github.io/awesome-interaction/#after-effects-vector-playback) | [lottie-web](https://github.com/airbnb/lottie-web) | 32,014 | 1 | Recommended | [Open](https://giraffe-tree.github.io/awesome-interaction/#after-effects-vector-playback) |
| [Looping typewriter sequence](https://giraffe-tree.github.io/awesome-interaction/#looping-typewriter-sequence) | [Typed.js](https://github.com/mattboldt/typed.js) | 16,283 | 1 | Recommended | [Open](https://giraffe-tree.github.io/awesome-interaction/#looping-typewriter-sequence) |
| [Text-to-character CSS variables](https://giraffe-tree.github.io/awesome-interaction/#text-to-character-css-variables) | [Splitting](https://github.com/shshaw/Splitting) | 1,755 | 1 | Recommended | [Open](https://giraffe-tree.github.io/awesome-interaction/#text-to-character-css-variables) |
| [Shader-processed typography](https://giraffe-tree.github.io/awesome-interaction/#shader-processed-typography) | [Blotter](https://github.com/bradley/Blotter) | 3,076 | 1 | Legacy | [Open](https://giraffe-tree.github.io/awesome-interaction/#shader-processed-typography) |
| [Randomized decode text reveal](https://giraffe-tree.github.io/awesome-interaction/#randomized-decode-text-reveal) | [use-scramble](https://github.com/tol-is/use-scramble) | 143 | 1 | Recommended | [Open](https://giraffe-tree.github.io/awesome-interaction/#randomized-decode-text-reveal) |
| [Fluent SVG scene animation](https://giraffe-tree.github.io/awesome-interaction/#fluent-svg-scene-animation) | [SVG.js](https://github.com/svgdotjs/svg.js) | 11,802 | 1 | Recommended | [Open](https://giraffe-tree.github.io/awesome-interaction/#fluent-svg-scene-animation) |
| [Hand-drawn vector rendering](https://giraffe-tree.github.io/awesome-interaction/#hand-drawn-vector-rendering) | [Rough.js](https://github.com/rough-stuff/rough) | 21,074 | 1 | Recommended | [Open](https://giraffe-tree.github.io/awesome-interaction/#hand-drawn-vector-rendering) |
| [Handwritten path lettering](https://giraffe-tree.github.io/awesome-interaction/#handwritten-path-lettering) | [Vara](https://github.com/akzhy/Vara) | 289 | 1 | Recommended | [Open](https://giraffe-tree.github.io/awesome-interaction/#handwritten-path-lettering) |
| [Character-diff text transition](https://giraffe-tree.github.io/awesome-interaction/#character-diff-text-transition) | [smart-ticker](https://github.com/tombcato/smart-ticker) | 165 | 1 | Recommended | [Open](https://giraffe-tree.github.io/awesome-interaction/#character-diff-text-transition) |
| [Mechanical split-flap character change](https://giraffe-tree.github.io/awesome-interaction/#mechanical-split-flap-character-change) | [Flip](https://github.com/pqina/flip) | 1,018 | 1 | Recommended | [Open](https://giraffe-tree.github.io/awesome-interaction/#mechanical-split-flap-character-change) |
| [Topology-safe SVG shape morph](https://giraffe-tree.github.io/awesome-interaction/#topology-safe-svg-shape-morph) | [Flubber](https://github.com/veltman/flubber) | 6,923 | 1 | Recommended | [Open](https://giraffe-tree.github.io/awesome-interaction/#topology-safe-svg-shape-morph) |

<a id="canvas"></a>

### Canvas & 2D

Scene graphs, creative coding, physics, drawing tools, and 2D renderers.

| Effect | Recommended source | Stars | Implementations | Status | Minimal code |
| --- | --- | ---: | ---: | --- | --- |
| [GPU-accelerated 2D scene graph](https://giraffe-tree.github.io/awesome-interaction/#gpu-accelerated-2d-scene-graph) | [PixiJS](https://github.com/pixijs/pixijs) | 47,790 | 1 | Recommended | [Open](https://giraffe-tree.github.io/awesome-interaction/#gpu-accelerated-2d-scene-graph) |
| [Sketch-style creative coding loop](https://giraffe-tree.github.io/awesome-interaction/#sketch-style-creative-coding-loop) | [p5.js](https://github.com/processing/p5.js) | 23,797 | 1 | Recommended | [Open](https://giraffe-tree.github.io/awesome-interaction/#sketch-style-creative-coding-loop) |
| [Vector geometry on Canvas](https://giraffe-tree.github.io/awesome-interaction/#vector-geometry-on-canvas) | [Paper.js](https://github.com/paperjs/paper.js) | 15,061 | 1 | Recommended | [Open](https://giraffe-tree.github.io/awesome-interaction/#vector-geometry-on-canvas) |
| [Interactive object canvas](https://giraffe-tree.github.io/awesome-interaction/#interactive-object-canvas) | [Fabric.js](https://github.com/fabricjs/fabric.js) | 31,321 | 1 | Recommended | [Open](https://giraffe-tree.github.io/awesome-interaction/#interactive-object-canvas) |
| [Layered draggable Canvas nodes](https://giraffe-tree.github.io/awesome-interaction/#layered-draggable-canvas-nodes) | [Konva](https://github.com/konvajs/konva) | 14,619 | 1 | Recommended | [Open](https://giraffe-tree.github.io/awesome-interaction/#layered-draggable-canvas-nodes) |
| [Renderer-agnostic 2D primitives](https://giraffe-tree.github.io/awesome-interaction/#renderer-agnostic-2d-primitives) | [Two.js](https://github.com/jonobr1/two.js) | 8,643 | 1 | Recommended | [Open](https://giraffe-tree.github.io/awesome-interaction/#renderer-agnostic-2d-primitives) |
| [Display-list Canvas animation](https://giraffe-tree.github.io/awesome-interaction/#display-list-canvas-animation) | [EaselJS](https://github.com/CreateJS/EaselJS) | 8,169 | 1 | Recommended | [Open](https://giraffe-tree.github.io/awesome-interaction/#display-list-canvas-animation) |
| [Browser game scene lifecycle](https://giraffe-tree.github.io/awesome-interaction/#browser-game-scene-lifecycle) | [Phaser](https://github.com/phaserjs/phaser) | 39,960 | 1 | Recommended | [Open](https://giraffe-tree.github.io/awesome-interaction/#browser-game-scene-lifecycle) |
| [Rigid-body web physics](https://giraffe-tree.github.io/awesome-interaction/#rigid-body-web-physics) | [Matter.js](https://github.com/liabru/matter-js) | 18,321 | 1 | Recommended | [Open](https://giraffe-tree.github.io/awesome-interaction/#rigid-body-web-physics) |
| [Point-based generative geometry](https://giraffe-tree.github.io/awesome-interaction/#point-based-generative-geometry) | [Pts](https://github.com/williamngan/pts) | 5,336 | 1 | Recommended | [Open](https://giraffe-tree.github.io/awesome-interaction/#point-based-generative-geometry) |
| [Pseudo-3D flat illustration](https://giraffe-tree.github.io/awesome-interaction/#pseudo-3d-flat-illustration) | [Zdog](https://github.com/metafizzy/zdog) | 10,634 | 1 | Recommended | [Open](https://giraffe-tree.github.io/awesome-interaction/#pseudo-3d-flat-illustration) |
| [Infinite collaborative drawing surface](https://giraffe-tree.github.io/awesome-interaction/#infinite-collaborative-drawing-surface) | [tldraw](https://github.com/tldraw/tldraw) | 48,780 | 1 | Recommended | [Open](https://giraffe-tree.github.io/awesome-interaction/#infinite-collaborative-drawing-surface) |

<a id="webgl"></a>

### 3D & WebGL

3D engines, declarative renderers, shader layers, and post-processing.

| Effect | Recommended source | Stars | Implementations | Status | Minimal code |
| --- | --- | ---: | ---: | --- | --- |
| [Declarative React 3D scene](https://giraffe-tree.github.io/awesome-interaction/#declarative-react-3d-scene) | [react-three-fiber](https://github.com/pmndrs/react-three-fiber) | 31,433 | 1 | Recommended | [Open](https://giraffe-tree.github.io/awesome-interaction/#declarative-react-3d-scene) |
| [General-purpose WebGL scene graph](https://giraffe-tree.github.io/awesome-interaction/#general-purpose-webgl-scene-graph) | [three.js](https://github.com/mrdoob/three.js) | 113,755 | 1 | Recommended | [Open](https://giraffe-tree.github.io/awesome-interaction/#general-purpose-webgl-scene-graph) |
| [Batteries-included 3D engine](https://giraffe-tree.github.io/awesome-interaction/#batteries-included-3d-engine) | [Babylon.js](https://github.com/BabylonJS/Babylon.js) | 25,806 | 1 | Recommended | [Open](https://giraffe-tree.github.io/awesome-interaction/#batteries-included-3d-engine) |
| [Entity-component 3D runtime](https://giraffe-tree.github.io/awesome-interaction/#entity-component-3d-runtime) | [PlayCanvas Engine](https://github.com/playcanvas/engine) | 16,245 | 1 | Recommended | [Open](https://giraffe-tree.github.io/awesome-interaction/#entity-component-3d-runtime) |
| [Minimal WebGL abstraction](https://giraffe-tree.github.io/awesome-interaction/#minimal-webgl-abstraction) | [OGL](https://github.com/oframe/ogl) | 4,582 | 1 | Recommended | [Open](https://giraffe-tree.github.io/awesome-interaction/#minimal-webgl-abstraction) |
| [Functional WebGL draw commands](https://giraffe-tree.github.io/awesome-interaction/#functional-webgl-draw-commands) | [regl](https://github.com/regl-project/regl) | 5,557 | 1 | Recommended | [Open](https://giraffe-tree.github.io/awesome-interaction/#functional-webgl-draw-commands) |
| [DOM-synced shader planes](https://giraffe-tree.github.io/awesome-interaction/#dom-synced-shader-planes) | [Curtains.js](https://github.com/martinlaxenaire/curtainsjs) | 1,823 | 1 | Recommended | [Open](https://giraffe-tree.github.io/awesome-interaction/#dom-synced-shader-planes) |
| [Accessible interactive 3D product view](https://giraffe-tree.github.io/awesome-interaction/#accessible-interactive-3d-product-view) | [<model-viewer>](https://github.com/google/model-viewer) | 8,161 | 1 | Recommended | [Open](https://giraffe-tree.github.io/awesome-interaction/#accessible-interactive-3d-product-view) |
| [Declarative HTML 3D scene](https://giraffe-tree.github.io/awesome-interaction/#declarative-html-3d-scene) | [A-Frame](https://github.com/aframevr/aframe) | 17,586 | 1 | Recommended | [Open](https://giraffe-tree.github.io/awesome-interaction/#declarative-html-3d-scene) |
| [Vue declarative Three.js](https://giraffe-tree.github.io/awesome-interaction/#vue-declarative-three-js) | [TresJS](https://github.com/Tresjs/tres) | 3,625 | 1 | Recommended | [Open](https://giraffe-tree.github.io/awesome-interaction/#vue-declarative-three-js) |
| [Svelte declarative Three.js](https://giraffe-tree.github.io/awesome-interaction/#svelte-declarative-three-js) | [Threlte](https://github.com/threlte/threlte) | 3,300 | 1 | Recommended | [Open](https://giraffe-tree.github.io/awesome-interaction/#svelte-declarative-three-js) |
| [Merged real-time bloom pass](https://giraffe-tree.github.io/awesome-interaction/#merged-real-time-bloom-pass) | [postprocessing](https://github.com/pmndrs/postprocessing) | 2,811 | 1 | Recommended | [Open](https://giraffe-tree.github.io/awesome-interaction/#merged-real-time-bloom-pass) |

<a id="background"></a>

### Background & particles

Fluid, particles, gradients, confetti, meshes, ribbons, and fireworks.

| Effect | Recommended source | Stars | Implementations | Status | Minimal code |
| --- | --- | ---: | ---: | --- | --- |
| [Pointer-injected GPU fluid](https://giraffe-tree.github.io/awesome-interaction/#pointer-injected-gpu-fluid) | [WebGL Fluid Simulation](https://github.com/PavelDoGreat/WebGL-Fluid-Simulation) | 16,493 | 1 | Recommended | [Open](https://giraffe-tree.github.io/awesome-interaction/#pointer-injected-gpu-fluid) |
| [Configurable reactive particle field](https://giraffe-tree.github.io/awesome-interaction/#configurable-reactive-particle-field) | [tsParticles](https://github.com/tsparticles/tsparticles) | 8,920 | 1 | Recommended | [Open](https://giraffe-tree.github.io/awesome-interaction/#configurable-reactive-particle-field) |
| [Drop-in animated WebGL background](https://giraffe-tree.github.io/awesome-interaction/#drop-in-animated-webgl-background) | [Vanta](https://github.com/tengbao/vanta) | 6,608 | 1 | Recommended | [Open](https://giraffe-tree.github.io/awesome-interaction/#drop-in-animated-webgl-background) |
| [Event-triggered confetti burst](https://giraffe-tree.github.io/awesome-interaction/#event-triggered-confetti-burst) | [canvas-confetti](https://github.com/catdad/canvas-confetti) | 12,648 | 1 | Recommended | [Open](https://giraffe-tree.github.io/awesome-interaction/#event-triggered-confetti-burst) |
| [Animated gradient state transitions](https://giraffe-tree.github.io/awesome-interaction/#animated-gradient-state-transitions) | [Granim.js](https://github.com/sarcadass/granim.js) | 5,304 | 1 | Legacy | [Open](https://giraffe-tree.github.io/awesome-interaction/#animated-gradient-state-transitions) |
| [Procedural low-poly mesh](https://giraffe-tree.github.io/awesome-interaction/#procedural-low-poly-mesh) | [Trianglify](https://github.com/qrohlf/trianglify) | 10,089 | 1 | Recommended | [Open](https://giraffe-tree.github.io/awesome-interaction/#procedural-low-poly-mesh) |
| [Interactive fireworks field](https://giraffe-tree.github.io/awesome-interaction/#interactive-fireworks-field) | [Fireworks.js](https://github.com/crashmax-dev/fireworks-js) | 1,380 | 1 | Recommended | [Open](https://giraffe-tree.github.io/awesome-interaction/#interactive-fireworks-field) |
| [Procedural ribbon trail](https://giraffe-tree.github.io/awesome-interaction/#procedural-ribbon-trail) | [ribbon.js](https://github.com/hustcc/ribbon.js) | 237 | 1 | Legacy | [Open](https://giraffe-tree.github.io/awesome-interaction/#procedural-ribbon-trail) |
| [Lit low-poly surface](https://giraffe-tree.github.io/awesome-interaction/#lit-low-poly-surface) | [Flat Surface Shader](https://github.com/wagerfield/flat-surface-shader) | 2,469 | 1 | Legacy | [Open](https://giraffe-tree.github.io/awesome-interaction/#lit-low-poly-surface) |
| [Generated CSS grid pattern animation](https://giraffe-tree.github.io/awesome-interaction/#generated-css-grid-pattern-animation) | [CSS Doodle](https://github.com/css-doodle/css-doodle) | 6,020 | 1 | Recommended | [Open](https://giraffe-tree.github.io/awesome-interaction/#generated-css-grid-pattern-animation) |
| [Full-page fragment shader backdrop](https://giraffe-tree.github.io/awesome-interaction/#full-page-fragment-shader-backdrop) | [shader-web-background](https://github.com/xemantic/shader-web-background) | 280 | 1 | Recommended | [Open](https://giraffe-tree.github.io/awesome-interaction/#full-page-fragment-shader-backdrop) |
| [Emergent attraction-repulsion swarm](https://giraffe-tree.github.io/awesome-interaction/#emergent-attraction-repulsion-swarm) | [Particle Life](https://github.com/hunar4321/particle-life) | 3,343 | 1 | Recommended | [Open](https://giraffe-tree.github.io/awesome-interaction/#emergent-attraction-repulsion-swarm) |

<a id="media"></a>

### Media & image

Comparison, pan-and-zoom, cropping, filters, lens zoom, and shader transitions.

| Effect | Recommended source | Stars | Implementations | Status | Minimal code |
| --- | --- | ---: | ---: | --- | --- |
| [Drag-to-reveal image comparison](https://giraffe-tree.github.io/awesome-interaction/#drag-to-reveal-image-comparison) | [img-comparison-slider](https://github.com/sneas/img-comparison-slider) | 864 | 1 | Recommended | [Open](https://giraffe-tree.github.io/awesome-interaction/#drag-to-reveal-image-comparison) |
| [Reusable GLSL media transition](https://giraffe-tree.github.io/awesome-interaction/#reusable-glsl-media-transition) | [GL Transitions](https://github.com/gl-transitions/gl-transitions) | 2,115 | 1 | Recommended | [Open](https://giraffe-tree.github.io/awesome-interaction/#reusable-glsl-media-transition) |
| [Inline image focus zoom](https://giraffe-tree.github.io/awesome-interaction/#inline-image-focus-zoom) | [medium-zoom](https://github.com/francoischalifour/medium-zoom) | 3,936 | 1 | Recommended | [Open](https://giraffe-tree.github.io/awesome-interaction/#inline-image-focus-zoom) |
| [Pointer pan and pinch zoom](https://giraffe-tree.github.io/awesome-interaction/#pointer-pan-and-pinch-zoom) | [Panzoom](https://github.com/timmywil/panzoom) | 2,440 | 1 | Recommended | [Open](https://giraffe-tree.github.io/awesome-interaction/#pointer-pan-and-pinch-zoom) |
| [Deep-zoom tiled imagery](https://giraffe-tree.github.io/awesome-interaction/#deep-zoom-tiled-imagery) | [OpenSeadragon](https://github.com/openseadragon/openseadragon) | 3,479 | 1 | Recommended | [Open](https://giraffe-tree.github.io/awesome-interaction/#deep-zoom-tiled-imagery) |
| [Interactive image crop transform](https://giraffe-tree.github.io/awesome-interaction/#interactive-image-crop-transform) | [Cropper.js](https://github.com/fengyuanchen/cropperjs) | 13,857 | 1 | Recommended | [Open](https://giraffe-tree.github.io/awesome-interaction/#interactive-image-crop-transform) |
| [E-commerce lens magnification](https://giraffe-tree.github.io/awesome-interaction/#e-commerce-lens-magnification) | [Drift](https://github.com/strawdynamics/drift) | 1,562 | 1 | Recommended | [Open](https://giraffe-tree.github.io/awesome-interaction/#e-commerce-lens-magnification) |
| [Chainable Canvas photo filters](https://giraffe-tree.github.io/awesome-interaction/#chainable-canvas-photo-filters) | [CamanJS](https://github.com/meltingice/CamanJS) | 3,571 | 1 | Legacy | [Open](https://giraffe-tree.github.io/awesome-interaction/#chainable-canvas-photo-filters) |
| [GPU image filter canvas](https://giraffe-tree.github.io/awesome-interaction/#gpu-image-filter-canvas) | [glfx.js](https://github.com/evanw/glfx.js) | 3,449 | 1 | Legacy | [Open](https://giraffe-tree.github.io/awesome-interaction/#gpu-image-filter-canvas) |
| [Drop-upload image preview transition](https://giraffe-tree.github.io/awesome-interaction/#drop-upload-image-preview-transition) | [FilePond](https://github.com/pqina/filepond) | 16,382 | 1 | Recommended | [Open](https://giraffe-tree.github.io/awesome-interaction/#drop-upload-image-preview-transition) |
| [Full image-editing canvas workspace](https://giraffe-tree.github.io/awesome-interaction/#full-image-editing-canvas-workspace) | [TUI Image Editor](https://github.com/nhn/tui.image-editor) | 7,660 | 1 | Recommended | [Open](https://giraffe-tree.github.io/awesome-interaction/#full-image-editing-canvas-workspace) |
| [Responsive custom media controls](https://giraffe-tree.github.io/awesome-interaction/#responsive-custom-media-controls) | [Media Chrome](https://github.com/muxinc/media-chrome) | 2,710 | 1 | Recommended | [Open](https://giraffe-tree.github.io/awesome-interaction/#responsive-custom-media-controls) |

## Demo

The demo is dependency-free static HTML, CSS, JavaScript modules, and GIF assets. It supports effect search, category filtering, effect-first sorting, English/Chinese UI, stable effect anchors, expandable source details, and copyable minimal code.

```bash
python3 -m http.server 4173 --directory demo
```

Open [http://localhost:4173](http://localhost:4173). A local HTTP server is required because the catalog is loaded as an ES module.

## GIF optimization

Run the reproducible optimizer from original source GIFs:

```bash
./scripts/optimize-gifs.sh
```

It uses an adaptive 128-color palette, Bayer dithering, and difference-rectangle encoding. A candidate only replaces the source when it is smaller, and dimensions, duration, frame rate, and frame count are validated.

## GitHub Pages

The demo is fully static and uses only relative paths. The included workflow publishes `demo/` on pushes to `main` and supports manual runs. Before the first deployment, set **Settings → Pages → Source** to **GitHub Actions**. See [the deployment notes](docs/GITHUB_PAGES.md).

Expected project URL: [https://giraffe-tree.github.io/awesome-interaction/](https://giraffe-tree.github.io/awesome-interaction/)

## Maintaining the catalog

- Edit `demo/data/effects.js`, the single source of truth.
- Keep `effect.id` semantic and stable; never derive it from a repository name.
- Reusing a project across effects is valid. Add alternative implementations to an effect's `sources` array.
- Keep snippets and previews on the source relation, not on the project or effect root.
- Run `node scripts/build-docs.mjs` to regenerate both README files.
- Run `node scripts/validate.mjs` before committing.

GIFs and project names are used for research, indexing, and comparison. Rights remain with their respective authors.
