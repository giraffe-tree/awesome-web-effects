# Real preview demos

These pages are the capture sources for 12 catalog previews across WebGL, DOM, SVG, and Canvas. Each page imports and runs the library named by the catalog entry; none is a hand-drawn approximation or a shared placeholder scene.

| Effect id | Runtime used by the page | What the demo proves |
| --- | --- | --- |
| `functional-webgl-draw-commands` | `regl` | Reusable regl draw commands render a GPU point flow and energy core. |
| `dom-synced-shader-planes` | `curtainsjs` | A Curtains `Plane` follows the live bounds of a moving DOM card. |
| `accessible-interactive-3d-product-view` | `@google/model-viewer` | The real web component loads a GLB and exposes orbit, zoom, pointer, and keyboard controls. |
| `declarative-html-3d-scene` | `aframe` | A scene is assembled from A-Frame HTML entities and rendered by its runtime. |
| `vue-declarative-three-js` | Vue + `@tresjs/core` | A Vue SFC describes and animates a component-based Three.js sculpture. |
| `svelte-declarative-three-js` | Svelte + `@threlte/core` | Svelte components describe and animate an orbital Three.js scene. |
| `scroll-scrubbed-master-timeline` | `gsap` + ScrollTrigger | Real scroll progress controls one sequenced GSAP timeline. |
| `filterable-grid-reflow` | `isotope-layout` | Isotope filters, sorts, and lays out the same DOM grid items. |
| `perspective-tilt-and-glare` | `vanilla-tilt` | Pointer coordinates drive the library's perspective transform and glare layer. |
| `svg-stroke-drawing` | `vivus` | Vivus measures and reveals the actual SVG paths one by one. |
| `sketch-style-creative-coding-loop` | `p5` | A p5 instance-mode draw loop renders a generative wave field on Canvas 2D. |
| `anchored-popover-flip-and-shift` | `@floating-ui/dom` | Floating UI's offset, flip, shift, and arrow middleware resolve collision-safe placement. |

Run locally:

```bash
npm --prefix demo/preview-demos ci
npm --prefix demo/preview-demos run dev
```

From the repository root, build the static pages and capture all deterministic GIFs:

```bash
npm ci --prefix demo/preview-demos
npm run build --prefix demo/preview-demos
python3 scripts/capture-real-preview-gifs.py --built --skip-install
```

Use `--only=effect-id` to capture one page. Add `--built` to capture and verify the committed static `dist` pages exactly as GitHub Pages will serve them. The script checks page-reported library metadata, the declared live WebGL/Canvas/SVG/DOM surface, readiness, and frame variation before it writes `demo/gifs/captured/<effect-id>.gif`.

## Asset attribution

`assets/Astronaut.glb` is the sample Astronaut model distributed by the Google `model-viewer` project. Its upstream source is `https://modelviewer.dev/shared-assets/models/Astronaut.glb`; see the model-viewer repository for the sample asset's license and attribution details.
