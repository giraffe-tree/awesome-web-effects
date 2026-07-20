# Batch B implementation report — 2026-07-20

## Outcome

Batch B now contains 27 executable, locally hosted interaction demos. Every demo has its own HTML entry and JavaScript implementation under `demo/preview-demos/`, uses a three-second seekable loop, exposes the shared preview readiness and metadata contracts, and provides pointer, keyboard, wheel, focus, or click interaction appropriate to its mechanism.

The source-research plan remains the authority for inspiration and upstream evidence. `batch-b-runtime-2026-07-20.json` intentionally describes the dependency that actually executes in each local demo: Motion, p5.js, or regl.

## High-risk prototype gate

Three representative high-risk mechanisms were implemented and tested before the remaining batch:

| Stable ID | Risk covered | Runtime | Timeline evidence |
| --- | --- | --- | --- |
| `interactive-vector-state-machine` | authored vector-state continuity | Motion + SVG | 7/7 sampled frames distinct |
| `pointer-injected-gpu-fluid` | real GPU fragment rendering and pointer injection | regl + WebGL | 7/7 sampled frames distinct |
| `drag-thrown-card-stack` | gesture-driven ordered stack motion | Motion + DOM | 5/7 sampled frames distinct |

All three passed readiness, exact metadata, runtime assertion, seekability, interaction, and page-error checks before expansion continued.

## Implemented stable IDs

| # | Stable ID | Runtime / renderer | Primary interaction |
| ---: | --- | --- | --- |
| 1 | `interactive-vector-state-machine` | Motion / SVG | click, Enter, Space |
| 2 | `dom-to-3d-scroll-synchronization` | Motion / DOM | wheel, arrow keys |
| 3 | `scene-wipe-progressive-page-swap` | Motion / DOM | click, Enter, arrows |
| 4 | `draggable-packed-editorial-wall` | Motion / DOM | pointer drag, arrows |
| 5 | `velocity-aware-swipe-drawer` | Motion / DOM | swipe drag, arrows |
| 6 | `spatial-slide-deck-navigation` | Motion / DOM | buttons, arrow keys |
| 7 | `pointer-driven-multilayer-depth-stage` | Motion / DOM | pointer move, arrows |
| 8 | `svg-filter-gooey-text-hover` | Motion / SVG | pointer, click, keyboard |
| 9 | `pointer-following-displacement-ripple` | regl / WebGL | pointer move, arrows |
| 10 | `draggable-rigid-body-poster-pile` | p5.js / Canvas 2D | pointer drag, keyboard |
| 11 | `point-constructed-generative-corolla` | p5.js / Canvas 2D | pointer move, arrows |
| 12 | `pointer-injected-gpu-fluid` | regl / WebGL | pointer injection, arrows |
| 13 | `emergent-particle-life-colonies` | p5.js / Canvas 2D | pointer reset, keyboard |
| 14 | `sticky-card-stack-accumulation` | Motion / DOM | wheel, arrows |
| 15 | `velocity-reactive-marquee` | Motion / DOM | wheel, arrows |
| 16 | `scrubbed-word-blur-rotate-reveal` | Motion / DOM | wheel, arrows |
| 17 | `pixel-grid-content-dissolve` | p5.js / Canvas 2D | click, keyboard |
| 18 | `bubble-to-navigation-morph` | Motion / DOM | click, keyboard |
| 19 | `neighbor-magnifying-navigation-dock` | Motion / DOM | hover, focus, click |
| 20 | `layered-staggered-full-screen-menu` | Motion / DOM | click, keyboard |
| 21 | `hover-activated-image-marquee-menu` | Motion / DOM | hover, focus, click |
| 22 | `drag-thrown-card-stack` | Motion / DOM | pointer throw, keyboard |
| 23 | `metaball-blob-cursor` | Motion / SVG | pointer move, arrows |
| 24 | `velocity-spaced-image-trail` | p5.js / Canvas 2D | pointer move, arrows |
| 25 | `gooey-pixel-cursor-wake` | p5.js / Canvas 2D | pointer move, arrows |
| 26 | `snapping-target-reticle-cursor` | Motion / DOM | hover, focus, click, arrows |
| 27 | `pointer-reactive-cell-grid` | p5.js / Canvas 2D | pointer move/click, arrows |

## Runtime contract

Each page provides:

- `window.__PREVIEW_READY__ === true` after its first valid render.
- `window.__PREVIEW_META__` with the exact stable ID, actual package version, renderer, and `capture: "real-demo"`.
- `window.__PREVIEW_RUNTIME_ASSERT__()` returning `true` only after the expected runtime objects and scene primitives exist.
- `window.__setPreviewTime(seconds)` for deterministic capture at any point in the seamless three-second loop.

The shared Batch B utility module is `demo/preview-demos/src/batch-b-utils.js`; no Batch B-specific central catalog, admission, manifest, Vite, provenance, capture, or UI file was changed in this implementation slice.

## Verification

### Static verification

- File inventory: 27/27 HTML entries and 27/27 JavaScript implementations present and non-empty.
- JavaScript parsing: 27/27 passed individual `node --check` execution.
- The initially detected ambiguous compressed ternary in `spatial-slide-deck-navigation-demo.js` was expanded and corrected before browser validation.

### Browser runtime verification

The full batch ran in Chromium at the production preview viewport of 320 × 180. For each ID, the test loaded the actual Vite module graph and checked readiness, exact metadata, runtime assertion, deterministic time seeking at 0, 0.5, 1, 1.5, 2, 2.5, and 2.99 seconds, interaction response, script errors, and failed HTTP responses.

- Ready and metadata contract: 27/27 passed.
- Runtime assertions: 27/27 returned `true`.
- Seekable motion: 27/27 produced at least four distinct sampled frames; 16 produced seven distinct frames.
- Interaction response: 27/27 changed visually after pointer/wheel/keyboard input.
- Page script errors: 0.
- Failed non-favicon HTTP responses: 0.
- Final browser gate: **27 passed, 0 failed**.

Central build, capture generation, catalog admission, provenance aggregation, and gallery integration are deliberately left to the parent integration pass.
