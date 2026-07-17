# Preview authenticity migration — 2026-07-17

## Outcome

- Removed 234 editorial/concept GIFs from the published `demo/gifs/` tree.
- Removed the synthetic GIF generator so new previews cannot fall back to category templates.
- Kept 8 source-verified official previews.
- Added 6 runnable, library-backed WebGL demos and captured their browser output as GIFs.
- Marked the remaining 228 source relations as `unavailable`; the catalog renders “No real preview / 暂无真实预览” instead of an image.
- Added one-to-one provenance, exact hash checks, perceptual duplicate detection, GIF format checks, and local-demo path checks.

## Accepted local-demo batch

| Effect ID | Runtime | Reusable source | Published demo | GIF | Capture result | Visual acceptance |
| --- | --- | --- | --- | --- | --- | --- |
| `functional-webgl-draw-commands` | `regl@2.1.1` | `demo/preview-demos/functional-webgl-draw-commands.html` | `demo/preview-demos/dist/functional-webgl-draw-commands.html` | `demo/gifs/captured/functional-webgl-draw-commands.gif` | 36/36 distinct frames | GPU particle flow is immediately recognizable |
| `dom-synced-shader-planes` | `curtainsjs@8.1.6` | `demo/preview-demos/dom-synced-shader-planes.html` | `demo/preview-demos/dist/dom-synced-shader-planes.html` | `demo/gifs/captured/dom-synced-shader-planes.gif` | 36/36 distinct frames | Moving DOM bounds visibly stay aligned with the shader plane |
| `accessible-interactive-3d-product-view` | `@google/model-viewer@4.3.1` | `demo/preview-demos/accessible-interactive-3d-product-view.html` | `demo/preview-demos/dist/accessible-interactive-3d-product-view.html` | `demo/gifs/captured/accessible-interactive-3d-product-view.gif` | 36/36 distinct frames | Orbitable astronaut product view is clearly visible |
| `declarative-html-3d-scene` | `aframe@1.8.0` | `demo/preview-demos/declarative-html-3d-scene.html` | `demo/preview-demos/dist/declarative-html-3d-scene.html` | `demo/gifs/captured/declarative-html-3d-scene.gif` | 36/36 distinct frames | Declarative neon city scene is distinct from the other 3D demos |
| `vue-declarative-three-js` | `@tresjs/core@5.8.3`, `vue@3.5.40` | `demo/preview-demos/vue-declarative-three-js.html` | `demo/preview-demos/dist/vue-declarative-three-js.html` | `demo/gifs/captured/vue-declarative-three-js.gif` | 36/36 distinct frames | Vue component data sculpture has a unique silhouette and motion |
| `svelte-declarative-three-js` | `@threlte/core@8.5.16`, `svelte@5.56.6` | `demo/preview-demos/svelte-declarative-three-js.html` | `demo/preview-demos/dist/svelte-declarative-three-js.html` | `demo/gifs/captured/svelte-declarative-three-js.gif` | 36/36 distinct frames | Svelte orbital scene has a unique planet, ring, and moon motion |

Each published demo was loaded from the static `demo/` tree, reported the expected library metadata, created at least one live WebGL context, and completed without page errors when launched with the capture browser's WebGL flags.

## Final audit

```text
effects: 242
authentic: 14
official: 8
localDemo: 6
unavailable: 228
legacyGeneratedEditorial: 0
orphanedGifFiles: 0
provenanceRecords: 14
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

The 228 unavailable entries are deliberately incomplete rather than misleading. Migrate them only in reviewed batches: build a runnable demo with the named implementation, capture the browser result, add provenance, compare neighboring GIFs visually, and pass the authenticity audit before changing `previewKind` from `unavailable`.
