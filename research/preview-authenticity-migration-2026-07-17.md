# Preview authenticity migration — 2026-07-17

## Outcome

- Removed 234 editorial/concept GIFs from the published `demo/gifs/` tree.
- Removed the synthetic GIF generator so new previews cannot fall back to category templates.
- Kept 8 source-verified official previews.
- Added 12 runnable, library-backed demos across WebGL, DOM, SVG, and Canvas 2D, then captured their browser output as GIFs.
- Marked the remaining 222 source relations as `unavailable`; the catalog renders “No real preview / 暂无真实预览” instead of an image.
- Added one-to-one provenance, exact hash checks, perceptual duplicate detection, GIF format checks, and local-demo path checks.

## Initial accepted local-demo batch

| Effect ID | Runtime | Reusable source | Published demo | GIF | Capture result | Visual acceptance |
| --- | --- | --- | --- | --- | --- | --- |
| `functional-webgl-draw-commands` | `regl@2.1.1` | `demo/preview-demos/functional-webgl-draw-commands.html` | `demo/preview-demos/dist/functional-webgl-draw-commands.html` | `demo/gifs/captured/functional-webgl-draw-commands.gif` | 36/36 distinct frames | GPU particle flow is immediately recognizable |
| `dom-synced-shader-planes` | `curtainsjs@8.1.6` | `demo/preview-demos/dom-synced-shader-planes.html` | `demo/preview-demos/dist/dom-synced-shader-planes.html` | `demo/gifs/captured/dom-synced-shader-planes.gif` | 36/36 distinct frames | Moving DOM bounds visibly stay aligned with the shader plane |
| `accessible-interactive-3d-product-view` | `@google/model-viewer@4.3.1` | `demo/preview-demos/accessible-interactive-3d-product-view.html` | `demo/preview-demos/dist/accessible-interactive-3d-product-view.html` | `demo/gifs/captured/accessible-interactive-3d-product-view.gif` | 36/36 distinct frames | Orbitable astronaut product view is clearly visible |
| `declarative-html-3d-scene` | `aframe@1.8.0` | `demo/preview-demos/declarative-html-3d-scene.html` | `demo/preview-demos/dist/declarative-html-3d-scene.html` | `demo/gifs/captured/declarative-html-3d-scene.gif` | 36/36 distinct frames | Declarative neon city scene is distinct from the other 3D demos |
| `vue-declarative-three-js` | `@tresjs/core@5.8.3`, `vue@3.5.40` | `demo/preview-demos/vue-declarative-three-js.html` | `demo/preview-demos/dist/vue-declarative-three-js.html` | `demo/gifs/captured/vue-declarative-three-js.gif` | 36/36 distinct frames | Vue component data sculpture has a unique silhouette and motion |
| `svelte-declarative-three-js` | `@threlte/core@8.5.16`, `svelte@5.56.6` | `demo/preview-demos/svelte-declarative-three-js.html` | `demo/preview-demos/dist/svelte-declarative-three-js.html` | `demo/gifs/captured/svelte-declarative-three-js.gif` | 36/36 distinct frames | Svelte orbital scene has a unique planet, ring, and moon motion |

## Second accepted local-demo batch

| Effect ID | Runtime | Core runtime proof | Capture result |
| --- | --- | --- | --- |
| `scroll-scrubbed-master-timeline` | `gsap@3.15.0` | `ScrollTrigger.create()` owns the timeline; real scroll position scrubs it | 36/36 distinct frames |
| `filterable-grid-reflow` | `isotope-layout@3.0.6` | Isotope filters, sorts, and animates item reflow with a `.32s` transition | 36/36 distinct frames |
| `perspective-tilt-and-glare` | `vanilla-tilt@1.8.1` | Pointer events drive the library-created tilt and glare layer | 36/36 distinct frames |
| `svg-stroke-drawing` | `vivus@0.4.6` | Vivus measures and reveals the real SVG path map | 28/36 distinct frames |
| `sketch-style-creative-coding-loop` | `p5@2.3.0` | A real p5 instance-mode Canvas 2D draw loop renders the field | 36/36 distinct frames |
| `anchored-popover-flip-and-shift` | `@floating-ui/dom@1.8.0` | `computePosition()` runs offset, flip, shift, and arrow middleware | 36/36 distinct frames |

Each published demo was loaded from the static `demo/` tree, matched its pinned manifest version, exposed the expected live WebGL/Canvas/SVG/DOM surface, passed any library-specific runtime assertion, and completed without page errors. The six second-batch GIFs were also reviewed as distinct visual sequences rather than accepted on script output alone.

## Final audit

```text
effects: 242
authentic: 20
official: 8
localDemo: 12
unavailable: 222
legacyGeneratedEditorial: 0
orphanedGifFiles: 0
provenanceRecords: 20
invalidProvenanceRecords: 0
perceptualDuplicatePairs: 0
blockingIssues: 0
```

Commands run:

```bash
npm run build --prefix demo/preview-demos
python3 scripts/capture-real-preview-gifs.py --built --skip-install
node scripts/build-docs.mjs
node scripts/audit-preview-authenticity.mjs
node scripts/validate.mjs
git diff --check
```

## Remaining work

The 222 unavailable entries are deliberately incomplete rather than misleading. Migrate them only in reviewed batches: build a runnable demo with the named implementation, capture the browser result, add provenance, compare neighboring GIFs visually, and pass the authenticity audit before changing `previewKind` from `unavailable`.

## Why the first migration left 228 entries without a preview

`unavailable` is an evidence state, not a rendering error. The previous catalog made 234 editorial animations look like implementation evidence. This migration removed those files, retained eight verifiable official previews, and replaced six entries with real local demos. The remaining 228 were not promoted because none yet had the complete chain `named implementation -> runnable source -> deterministic browser capture -> GIF -> provenance -> visual review`.

The follow-up batch then completed that chain for six more entries, reducing the current unavailable count from 228 to 222. The baseline inventory below is retained so the original workload classification remains auditable.

The backlog is structurally mixed:

- 121 entries came from the 2026 effect research expansion, 95 from the earlier project expansion, and 12 from the baseline catalog. Many research snippets prove an API shape but are not complete applications.
- 87 entries are in Canvas, WebGL, background, or media categories. These commonly need GPU support, deterministic media/model fixtures, shader sources, or an explicit interaction track before capture.
- 46 entries recommend React Bits. Reusing its visual idea without running the named component would be another editorial recreation, so these need a pinned React workspace and the actual component source/dependency chain.
- 37 snippets are explicitly framework-shaped. They need a real React/Vue/Svelte mount and build, not HTML that merely imitates the component.
- 14 entries point to legacy implementations. A modern rewrite may demonstrate a similar behavior but would not prove that the named implementation produced it; these require an upstream-version decision before work starts.
- At least four entries depend on microphone, webcam, or live ML input. Others require video, audio, maps, models, fonts, Rive files, splats, or image/depth fixtures. Those assets need local, redistributable, deterministic provenance.
- Sixteen entries use repository-native code and are comparatively straightforward, but even they still need reusable source, scripted input, capture metadata, and entry-specific visual acceptance.

The backlog therefore cannot be solved honestly by one generic generator. Similar build tooling can be shared, but every published GIF still needs an entry-specific proof.

### Current category distribution

| Category | Unavailable |
| --- | ---: |
| Animation | 22 |
| Scroll | 23 |
| Transition | 24 |
| Carousel / overlay | 21 |
| Pointer / hover | 23 |
| Vector / text | 23 |
| Canvas / 2D | 23 |
| WebGL / 3D | 15 |
| Background / particles | 23 |
| Media / image | 25 |
| **Total** | **222** |

## Baseline migration bands (228-entry inventory)

The bands below classify production work, not visual importance. IDs remain in catalog order so the next batch is mechanically selected: take the first uncompleted IDs in the band, never cherry-pick only the easy-looking GIFs.

| Band | Count | Difficulty | Dependency risk | Local reproducibility | Batch size |
| --- | ---: | --- | --- | --- | ---: |
| A — deterministic DOM and motion | 53 | Low–medium | Low–medium | High | 8 |
| B — SVG, Canvas, data, and media tools | 49 | Medium | Medium | High with fixed fixtures | 8 |
| C — framework component workspace | 52 | Medium–high | Medium–high | High after source pinning | 8 |
| D — GPU, physics, and asset-backed media | 51 | High | Medium–high | Conditional on GPU/assets | 6 |
| E — blocked/legacy/permission/service | 23 | High–very high | High | Conditional or low | 1–4 after unblock |

### Band A — deterministic DOM and motion (53)

These effects can run in a small Vite/HTML workspace with synthetic DOM content and scripted scroll/pointer input. They do not require a copyrighted visual asset to communicate the core behavior.

`scroll-scrubbed-master-timeline`, `pinned-horizontal-scroll-scene`, `shared-layout-spring-morph`, `staggered-transform-choreography`, `render-agnostic-value-tween`, `motion-graphics-burst`, `visually-authored-keyframe-sequence`, `functional-value-pipeline`, `compact-svg-shape-tween`, `css-class-entrance-animation`, `data-attribute-viewport-reveal`, `data-driven-scroll-transforms`, `inertial-custom-scroll-container`, `conditional-focus-to-target-scroll`, `styled-native-scrollbar-surface`, `windowed-million-row-scrolling`, `append-at-threshold-continuous-feed`, `full-screen-section-snapping`, `progressively-enhanced-page-swap`, `one-call-dom-reflow-animation`, `draggable-packed-grid`, `column-based-masonry-layout`, `gap-filling-bin-pack-layout`, `drag-resize-dashboard-collision-reflow`, `draggable-split-pane-resize`, `momentum-touch-carousel`, `thumbnail-to-lightbox-zoom`, `nested-off-canvas-navigation-panels`, `spotlight-tour-with-focus-handoff`, `animated-accessible-modal-alert`, `anchored-popover-flip-and-shift`, `spatial-slide-deck-navigation`, `pointer-driven-layer-depth`, `perspective-tilt-and-glare`, `reusable-css-hover-vocabulary`, `trailing-cursor-particles`, `svg-filter-gooey-text-hover`, `event-triggered-confetti-burst`, `procedural-low-poly-mesh`, `interactive-fireworks-field`, `generated-css-grid-pattern-animation`, `emergent-attraction-repulsion-swarm`, `scroll-direction-auto-hiding-header`, `scroll-linked-multilayer-starfield-drift`, `scroll-scrubbed-document-generation-playback`, `blend-mode-self-inverting-fixed-navigation`, `delayed-dropdown-promo-sweep`, `four-corner-hover-crop-marks`, `hysteretic-scroll-threshold-header-restyle`, `card-metadata-to-cta-role-swap`, `opposed-diagonal-offset-cta`, `interaction-history-hiring-badge`, `autonomous-agent-cursor-constellation`.

### Band B — SVG, Canvas, data, and deterministic media tools (49)

These need library-specific surfaces and local fixtures, but no live service or permission. The demo must use the named renderer/parser/editor; drawing a similar result with unrelated Canvas/SVG code is not acceptable.

`looping-typewriter-sequence`, `text-to-character-css-variables`, `randomized-decode-text-reveal`, `fluent-svg-scene-animation`, `hand-drawn-vector-rendering`, `character-diff-text-transition`, `mechanical-split-flap-character-change`, `topology-safe-svg-shape-morph`, `sketch-style-creative-coding-loop`, `vector-geometry-on-canvas`, `interactive-object-canvas`, `layered-draggable-canvas-nodes`, `renderer-agnostic-2d-primitives`, `display-list-canvas-animation`, `point-based-generative-geometry`, `pseudo-3d-flat-illustration`, `inline-image-focus-zoom`, `pointer-pan-and-pinch-zoom`, `interactive-image-crop-transform`, `e-commerce-lens-magnification`, `drop-upload-image-preview-transition`, `full-image-editing-canvas-workspace`, `responsive-custom-media-controls`, `animated-hand-drawn-annotation`, `voronoi-nearest-point-hover-focus`, `linked-brush-to-zoom-chart`, `draggable-force-directed-svg-network`, `click-to-collapse-hierarchy-branches`, `hover-highlighted-choropleth-map`, `shimmering-svg-content-skeleton`, `clickable-generated-diagram-callback`, `svg-curve-motion-path-follower`, `velocity-sensitive-signature-ink`, `pressure-shaped-freehand-stroke`, `hover-expanding-animated-doughnut-chart`, `streaming-line-chart-transition`, `synchronized-multi-chart-cursor`, `drag-editable-b-zier-curve-handles`, `resize-and-rotate-transform-handles`, `hover-hit-test-color-highlight`, `direct-manipulation-image-annotation`, `frame-by-frame-gif-scrubber`, `blurhash-to-photo-progressive-reveal`, `image-palette-ambient-color-transition`, `infinite-curved-text-path-conveyor`, `type-select-replace-prompt-loop`, `staggered-multi-chart-telemetry-boot`, `drag-spawned-dom-aware-fish-flock`, `traveling-dot-headline-eraser-writer`.

### Band C — framework component workspace (52)

These require an actual framework mount and the named component/source. Build shared pinned workspaces by upstream family—React Bits first, then Magic UI/Motion Primitives, then the remaining React/Vue packages—but keep each demo entry independent and reusable.

`hook-driven-spring-motion`, `vue-directive-motion-state`, `flip-shared-element-transition`, `component-enter-exit-state-machine`, `velocity-aware-swipe-drawer`, `native-cross-route-shared-element-morph`, `filtered-command-palette-overlay`, `stacking-dismissible-toast-queue`, `nested-menu-and-submenu-transition`, `drag-overlay-and-drop-preview`, `bound-spring-drag-and-pinch`, `elastic-fan-card-entrance`, `noisy-electric-border-trace`, `spring-interpolated-count-up`, `segmented-rotating-word-slot`, `orbiting-star-perimeter`, `rotating-circular-letter-ring`, `moving-focus-window-headline`, `dom-node-connection-beam`, `animated-circular-gauge-fill`, `chromatic-band-text-sweep`, `sticky-card-stack-accumulation`, `velocity-reactive-marquee`, `scroll-scrubbed-floating-characters`, `scrubbed-word-blur-and-rotate-reveal`, `progressive-scroll-edge-blur`, `fixed-reading-progress-rail`, `sticky-paragraph-ink-reveal`, `viewport-triggered-metric-count`, `perspective-card-deck-swap`, `pixel-grid-content-dissolve`, `layered-folder-open-close`, `directional-wizard-step-transition`, `bubble-to-navigation-morph`, `spring-height-accordion-disclosure`, `expandable-action-toolbar-reveal`, `context-switching-dynamic-toolbar`, `adaptive-height-tab-panel-slide`, `clip-shape-theme-reveal`, `seamless-logo-loop-marquee`, `neighbor-magnifying-navigation-dock`, `layered-staggered-full-screen-menu`, `hover-activated-image-marquee-menu`, `keyboard-accessible-radial-context-menu`, `drag-thrown-card-stack`, `click-origin-spark-burst`, `cursor-localized-card-spotlight`, `snapping-target-reticle-cursor`, `floating-word-cursor-trail`, `handle-connected-animated-node-editor`, `smooth-matrix-letter-glitch-field`, `crt-faulty-terminal-pixel-field`.

### Band D — GPU, physics, and asset-backed media (51)

These are locally achievable only after fixtures and capture support are explicit. Pin a WebGL-capable browser; vendor small redistributable models, images, video, audio, tile, depth, and shader fixtures; record their origin/hash/usage basis; and fail closed when the named runtime or asset does not load.

`dom-to-3d-scroll-synchronization`, `gpu-accelerated-2d-scene-graph`, `browser-game-scene-lifecycle`, `rigid-body-web-physics`, `infinite-collaborative-drawing-surface`, `general-purpose-webgl-scene-graph`, `batteries-included-3d-engine`, `entity-component-3d-runtime`, `minimal-webgl-abstraction`, `merged-real-time-bloom-pass`, `pointer-injected-gpu-fluid`, `drop-in-animated-webgl-background`, `full-page-fragment-shader-backdrop`, `reusable-glsl-media-transition`, `deep-zoom-tiled-imagery`, `scroll-controlled-video-scrubbing`, `velocity-tilted-3d-card-carousel`, `bending-webgl-gallery-ribbon`, `draggable-dome-gallery`, `infinite-spherical-menu`, `metaball-blob-cursor`, `blooming-spectral-cursor-trail`, `velocity-spaced-image-trail`, `gooey-pixel-cursor-wake`, `pointer-reactive-cell-grid`, `pointer-carved-shader-aperture`, `pointer-following-displacement-ripple`, `slider-controlled-exploded-3d-assembly`, `collision-reactive-3d-physics-stack`, `refractive-glass-transmission-object`, `pointer-rotated-dotted-globe`, `pickable-extruded-data-columns`, `curved-3d-text-orbit`, `cursor-projected-3d-surface-marker`, `layered-aurora-ribbon-background`, `mouse-repelling-spiral-galaxy`, `procedural-lightning-bolt-background`, `pointer-disturbed-dither-waves`, `flowing-silk-shader-background`, `cursor-reactive-filament-threads`, `interactive-hyperspeed-highway`, `pointer-warped-balatro-plasma`, `scrubbable-audio-waveform`, `drag-resizable-audio-loop-region`, `drag-to-look-360-panorama`, `depth-map-ordered-blur-dissolve`, `device-silhouette-masked-video`, `duration-aware-layered-hero-film-handoff`, `blurred-autoplay-video-ambience`, `synchronized-scenario-scene-handoff`, `hover-rehearsed-video-style-rail`.

### Band E — blocked, legacy, permission, or service-dependent (23)

Do not schedule GIF production for these until the listed blocker is resolved in an evidence ticket. Legacy entries need a pinned runnable upstream commit or a catalog-source decision. Permission-driven demos need deterministic fake devices that still exercise the real browser API. Service/map demos need credential-free local fixtures. Asset-format demos need redistributable source files.

`interactive-vector-state-machine`, `counter-moving-split-screen-panels`, `filterable-grid-reflow`, `depth-map-portrait-parallax`, `pointer-attracted-button-motion`, `approach-direction-overlay-entrance`, `hotspot-revealed-image-regions`, `expanding-colored-card-stack`, `svg-stroke-drawing`, `shader-processed-typography`, `handwritten-path-lettering`, `animated-gradient-state-transitions`, `procedural-ribbon-trail`, `lit-low-poly-surface`, `chainable-canvas-photo-filters`, `gpu-image-filter-canvas`, `microphone-reactive-spectrum-ring`, `orbitable-gaussian-splat-scene`, `cinematic-map-camera-fly-to`, `time-lapse-globe-daylight-sweep`, `inline-webcam-capture-preview`, `real-time-portrait-background-blur`, `live-hand-landmark-camera-overlay`.

## Executable batch plan

1. **Freeze the contract before coding.** For every selected ID, add a short acceptance contract to the batch issue: named implementation and pinned version, real trigger, observable core response, deterministic input track, required local assets, and what must remain recognizable at 320x180. A title or badge is never an observable.
2. **Run one two-entry pilot for each new workspace family.** A pilot must complete source, build, capture, provenance, audit, and side-by-side human review. Do not expand the family if either pilot fails.
3. **Produce Band A in seven batches of at most eight IDs.** Use the list order. This validates scroll, pointer, layout, and DOM capture actions before introducing expensive runtimes.
4. **Produce Band B in seven batches of at most eight IDs.** Split by SVG/data, Canvas scene graph, charting/drawing, and image/media tools so one dependency failure cannot block unrelated demos.
5. **Produce Band C in seven batches of at most eight IDs.** Start with upstream-family batches. Pin actual component source or package versions and record any copied upstream source path/commit; never translate a React component into a visual approximation.
6. **Produce Band D in nine batches of at most six IDs.** Separate Canvas/physics, base WebGL engines, shader/post-processing, 3D assets, audio, and video. A fixture license/provenance review happens before implementation, not after capture.
7. **Resolve Band E one evidence ticket at a time.** Promote an ID into a production batch only after its blocker, version, assets, and CI capture method are documented. An unresolved entry remains `unavailable`.
8. **Promote atomically.** Source, published build, GIF, capture manifest, provenance, data relation, audit, and human visual acceptance land together. A failed member stays unavailable; the batch does not receive a placeholder.

At 8/8/8/6 entry limits, Bands A–D require 30 reviewed production batches after their pilots. This is intentionally slower than generic generation: the review unit is evidence, not image count.

## Per-demo authenticity acceptance contract

Every demo, regardless of band, must pass all universal gates and the gate for its effect family. Review is performed against the running demo and the GIF side by side.

### Universal hard gates

1. **Named implementation is executed.** The runtime reports the expected library/component and pinned version. Removing or failing that import must make the demo fail, not silently fall back to a hand-written approximation.
2. **Source is reusable.** A reader can run the source from a clean checkout using the documented install/build command. Source HTML/component files, dependency declarations, local fixtures, and interaction instructions are present.
3. **The trigger is real.** Capture sends actual wheel, pointer, drag, keyboard, media-time, or state-change input through the browser. Directly assigning the expected final style only for recording is not acceptable.
4. **The core response is observable.** The batch contract names a measurable visual/state change unique to the effect. At least the before, active, and result states appear in the captured frames when those states exist.
5. **Input is deterministic.** Viewport, device scale, reduced-motion preference, random seed, initial scroll, pointer path, fixture data, and timing are fixed. Repeated captures produce the same semantic sequence.
6. **Assets are evidence-bearing.** Every model, image, font, video, audio, map/tile, shader, depth map, Rive file, and ML model has an origin, local path, hash or pinned version, and usage basis. A remote URL or personal cache is not a fixture.
7. **No hidden network dependency.** The built demo runs from the static `demo/` tree without login, token, third-party iframe, or mutable remote response. Any unavoidable service dependency keeps the entry in Band E.
8. **Capture is faithful.** Post-processing is limited to fixed crop, scale, frame rate, palette, and compression. It cannot add motion, objects, masks, blur, or transitions absent from the demo.
9. **Failure is visible.** Missing libraries/assets, WebGL loss, media decode failure, and permission failure produce a capture error and non-zero command, never a plausible blank or substitute animation.
10. **The thumbnail explains itself.** At 320x180, a reviewer can identify the core behavior without reading the effect name. Adjacent entries in the same family have materially different subject, trajectory, or interaction.
11. **Accessibility remains real.** Actionable demos expose their keyboard/focus/touch route and a reduced-motion fallback. Capture may use motion, but source cannot remove those paths for convenience.
12. **Evidence is one-to-one.** Catalog relation, source, build entry, capture manifest, GIF, and provenance share the same effect ID; authenticity audit, exact/perceptual duplicate checks, GIF checks, and console-error checks pass.

### Family-specific observable gates

| Family | Entry-specific pass evidence |
| --- | --- |
| Animation | The named timeline/spring/tween/state machine advances values over multiple frames; easing, overshoot, stagger, sequencing, or state transition named by the effect is visible rather than a generic translate/fade. |
| Scroll | Scripted real scrolling changes progress; pinning, reveal, direction, scrubbing, virtualization, or threshold behavior follows scroll position in both directions where relevant. A time-based autoplay substitute fails. |
| Transition/layout | Capture shows the actual pre-change DOM/layout, the library-driven transition/reflow, and the stable post-change state. Replacing the nodes with a pre-rendered animation fails. |
| Carousel/overlay | Real pointer/keyboard input changes the active item or overlay state. Momentum, focus handoff, nesting, collision/flip, drag, or dismissal behavior named by the entry is visible and focus remains valid. |
| Pointer/hover | A fixed pointer trajectory dispatches actual browser pointer events. The output follows position, velocity, entry direction, hit test, or hover state as claimed; an autonomous loop fails. |
| Vector/text | The named SVG/text/parser library produces or mutates real paths, glyphs, nodes, or text. Stroke draw, morph topology, scramble, annotation, or chart interaction is distinguishable in the GIF. |
| Canvas/2D | The named Canvas renderer owns the scene/draw objects. Capture shows its real hit testing, dragging, physics, drawing, or data update; exporting a static raster and moving it with CSS fails. |
| WebGL/3D | A live WebGL context and the named engine/render layer are present. Geometry, camera, shader, post-process, picking, or physics behavior unique to the entry changes across frames; a 2D lookalike fails. |
| Background/particles | The actual particle/fluid/shader/mesh system evolves from fixed seed/input and, when claimed, responds to scripted pointer/scroll input. Merely changing palette on a shared field fails. |
| Media/image | The named decoder/player/editor/model operates on a local provenanced fixture. Capture shows genuine time seeking, crop, zoom, comparison, filter, annotation, segmentation, or handoff—not an animation placed over a still image. |

### Additional gates for high-risk entries

- **Framework components:** the framework devtools/runtime tree or build metadata must identify the mounted component. Copying only its CSS/keyframes is not proof.
- **Legacy libraries:** provenance records an exact upstream commit/tag and how it was made runnable. If only a clean-room rewrite works, the catalog must recommend that implementation instead of attributing the GIF to the legacy project.
- **Camera/microphone:** CI may use Chromium fake media devices, but the demo must call the real `MediaDevices` API and consume the resulting track. A bundled video/audio file bypassing the API fails.
- **ML segmentation/landmarks:** the named model loads locally, inference completes, and output changes with deterministic frames. A hand-authored mask or landmark JSON fails.
- **Maps/globes/tiles:** the named renderer uses local, attributed tiles/style/data and scripted camera operations. Screenshots or remote embeds fail.
- **3D/model/splat/depth assets:** the loader parses the documented local fixture at runtime; provenance includes its source and usage basis. Replacing it with unrelated primitive geometry fails the entry-specific claim.
- **Video/audio handoffs:** capture proves actual decoded playback/current-time or waveform state and the transition boundary. CSS-only opacity changes between poster images fail.

An entry can be technically runnable and still fail authenticity. When the named core response is not legible or unique at thumbnail size, it remains `unavailable` until the demo presentation—not the label—is improved.
