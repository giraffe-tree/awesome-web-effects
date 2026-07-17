# Awesome Web Effects

[中文文档](README.zh-CN.md) · [Live demo](https://giraffe-tree.github.io/awesome-web-effects/)

An **effect-first**, curator-reviewed atlas of open-source interactions for the web. It publishes **26 distinct effects across 7 active categories**, backed by **14 source projects**. Every published effect has a real preview and a visible score of at least **80/100**, plus copyable minimal code and a one-click implementation prompt for Codex or Claude Code. English is the default interface and documentation language.

## Effect-first model

- **Effect is the catalog key.** Anchors, search results, rows, categories, and code examples begin with the visible interaction—not the repository.
- **Projects are implementation sources.** One project may power several distinct effects; 3 source projects currently demonstrate this relation in the catalog.
- **An effect may have multiple implementations.** Each source relation owns its own minimal snippet and preview status, so alternatives can be compared without duplicating the effect row.
- **Deduplication happens at the visible-effect level.** Candidates are compared by trigger, visual change, time relationship, and page layer; the newer, maintained, better-documented implementation becomes the recommended source.

## Catalog snapshot

- 315 candidates were audited; **26 passed** and **289 were removed from publication**.
- 26 admitted effect rows, including 8 baseline effects.
- 11 independently researched effects were added in the latest effect-level expansion.
- 14 unique GitHub source projects; 7 were added during the 2026 expansion.
- 26 verified source-specific GIF previews: 2 official captures and 24 captures from runnable local demos.
- 0 published source relations have no verified preview. The admission gate requires this number to remain zero.
- 26 one-click implementation prompts, one for every effect.
- 18 source-backed AI homepage references are integrated into 15 existing effect rows, covering 18 companies; each effect shows at most three representative companies.
- 2 useful older sources are marked **Legacy**; no archived repository is included.
- Stars are a snapshot from **2026-07-18**, not a live counter.
- The verified, optimized GIF set is **5.99 MiB**; each published preview is 320×180, at most three seconds, and below 1 MiB.

The implementation source and the website where an effect was observed are separate relationships. Read the [demo admission policy and current 315-candidate audit](research/demo-admission-audit-2026-07-18.md). See the [Chinese-first 100-company audit](research/ai-native-homepages-100.md) for all observations, including common patterns that were not duplicated as new effect rows.

## Selection rules

1. Every row must have a verifiable real preview and describe one visible interaction effect that can appear in a normal web page.
2. Human reviewers score creativity (20), art direction (20), motion craft (20), effect legibility (15), creative transfer (15), and evidence quality (10).
3. Admission requires at least 80/100 plus the core-dimension minimums in the policy; a popular library or an empty category never overrides the threshold.
4. Every effect needs a stable bilingual name, a semantic effect ID, a category, and at least one verifiable source.
5. Every effect has exactly one recommended source. Alternatives belong inside the same row instead of creating duplicate effects.
6. Rejected records may remain only in the audited candidate dataset for traceability; they are not exported to the website, README catalog, or release asset set.

## Categories

| Category | Effects | Source projects | Visible result |
| --- | ---: | ---: | --- |
| [Motion & choreography](#animation) | 7 | 6 | Timelines, springs, tweens, class animation, and framework-native motion. |
| [Scroll & reveal](#scroll) | 3 | 3 | Smooth scrolling, scroll-linked scenes, reveals, parallax, and snap navigation. |
| [Page & layout](#transition) | 3 | 2 | Page transitions, FLIP motion, filtering, packing, and animated reflow. |
| [Pointer & hover](#pointer) | 3 | 3 | Tilt, depth, custom cursors, magnetic motion, and image distortion. |
| [Text & SVG](#vector) | 4 | 2 | Typing, text splitting, vector drawing, handwriting, and SVG morphing. |
| [Canvas & 2D](#canvas) | 4 | 1 | Scene graphs, creative coding, physics, drawing tools, and 2D renderers. |
| [3D & WebGL](#webgl) | 2 | 2 | 3D engines, declarative renderers, shader layers, and post-processing. |

## Effect catalog

<a id="animation"></a>

### Motion & choreography

Timelines, springs, tweens, class animation, and framework-native motion.

| Effect | Recommended implementation | Curatorial score | AI homepage references (max 3) | Stars | Implementations | Status | Implementation |
| --- | --- | ---: | --- | ---: | ---: | --- | --- |
| [Scroll-scrubbed master timeline](https://giraffe-tree.github.io/awesome-web-effects/#scroll-scrubbed-master-timeline) | [GSAP](https://github.com/greensock/GSAP) | **85/100** | [Hebbia](https://www.hebbia.com/)<br>[Decagon](https://decagon.ai/) | 26,600 | 1 | Recommended | [Score + code + prompt](https://giraffe-tree.github.io/awesome-web-effects/#scroll-scrubbed-master-timeline) |
| [Shared-layout spring morph](https://giraffe-tree.github.io/awesome-web-effects/#shared-layout-spring-morph) | [Motion](https://github.com/motiondivision/motion) | **94/100** | — | 32,819 | 1 | Recommended | [Score + code + prompt](https://giraffe-tree.github.io/awesome-web-effects/#shared-layout-spring-morph) |
| [Staggered transform choreography](https://giraffe-tree.github.io/awesome-web-effects/#staggered-transform-choreography) | [Anime.js](https://github.com/juliangarnier/anime) | **92/100** | [Factory](https://factory.ai/)<br>[Read AI](https://www.read.ai/)<br>[Cursor (Anysphere)](https://cursor.com/) | 71,056 | 1 | Recommended | [Score + code + prompt](https://giraffe-tree.github.io/awesome-web-effects/#staggered-transform-choreography) |
| [Motion-graphics burst](https://giraffe-tree.github.io/awesome-web-effects/#motion-graphics-burst) | [Mo.js](https://github.com/mojs/mojs) | **92/100** | — | 18,728 | 1 | Recommended | [Score + code + prompt](https://giraffe-tree.github.io/awesome-web-effects/#motion-graphics-burst) |
| [Visually authored keyframe sequence](https://giraffe-tree.github.io/awesome-web-effects/#visually-authored-keyframe-sequence) | [Theatre.js](https://github.com/theatre-js/theatre) | **84/100** | — | 12,541 | 1 | Recommended | [Score + code + prompt](https://giraffe-tree.github.io/awesome-web-effects/#visually-authored-keyframe-sequence) |
| [Compact SVG shape tween](https://giraffe-tree.github.io/awesome-web-effects/#compact-svg-shape-tween) | [KUTE.js](https://github.com/thednp/kute.js) | **89/100** | — | 2,639 | 1 | Recommended | [Score + code + prompt](https://giraffe-tree.github.io/awesome-web-effects/#compact-svg-shape-tween) |
| [Autonomous agent-cursor constellation](https://giraffe-tree.github.io/awesome-web-effects/#autonomous-agent-cursor-constellation) | [Motion](https://github.com/motiondivision/motion) | **95/100** | [InVideo](https://invideo.io/) | 32,819 | 1 | Recommended | [Score + code + prompt](https://giraffe-tree.github.io/awesome-web-effects/#autonomous-agent-cursor-constellation) |

<a id="scroll"></a>

### Scroll & reveal

Smooth scrolling, scroll-linked scenes, reveals, parallax, and snap navigation.

| Effect | Recommended implementation | Curatorial score | AI homepage references (max 3) | Stars | Implementations | Status | Implementation |
| --- | --- | ---: | --- | ---: | ---: | --- | --- |
| [Pinned horizontal scroll scene](https://giraffe-tree.github.io/awesome-web-effects/#pinned-horizontal-scroll-scene) | [GSAP](https://github.com/greensock/GSAP) | **96/100** | — | 26,600 | 1 | Recommended | [Score + code + prompt](https://giraffe-tree.github.io/awesome-web-effects/#pinned-horizontal-scroll-scene) |
| [Scroll-linked multilayer starfield drift](https://giraffe-tree.github.io/awesome-web-effects/#scroll-linked-multilayer-starfield) | [p5.js](https://github.com/processing/p5.js) | **94/100** | [Fathom](https://fathom.video/) | 23,797 | 1 | Recommended | [Score + code + prompt](https://giraffe-tree.github.io/awesome-web-effects/#scroll-linked-multilayer-starfield) |
| [Self-inverting fixed navigation](https://giraffe-tree.github.io/awesome-web-effects/#self-inverting-fixed-navigation) | [Motion](https://github.com/motiondivision/motion) | **92/100** | [Luma AI](https://lumalabs.ai/) | 32,819 | 1 | Recommended | [Score + code + prompt](https://giraffe-tree.github.io/awesome-web-effects/#self-inverting-fixed-navigation) |

<a id="transition"></a>

### Page & layout

Page transitions, FLIP motion, filtering, packing, and animated reflow.

| Effect | Recommended implementation | Curatorial score | AI homepage references (max 3) | Stars | Implementations | Status | Implementation |
| --- | --- | ---: | --- | ---: | ---: | --- | --- |
| [Filterable grid reflow](https://giraffe-tree.github.io/awesome-web-effects/#filterable-grid-reflow) | [Isotope](https://github.com/metafizzy/isotope) | **85/100** | [Ideogram](https://ideogram.ai/) | 11,103 | 1 | Legacy | [Score + code + prompt](https://giraffe-tree.github.io/awesome-web-effects/#filterable-grid-reflow) |
| [Synchronized scenario scene handoff](https://giraffe-tree.github.io/awesome-web-effects/#synchronized-scenario-scene-handoff) | [Motion](https://github.com/motiondivision/motion) | **98/100** | [Vapi](https://vapi.ai/) | 32,819 | 1 | Recommended | [Score + code + prompt](https://giraffe-tree.github.io/awesome-web-effects/#synchronized-scenario-scene-handoff) |
| [Delayed dropdown promo sweep](https://giraffe-tree.github.io/awesome-web-effects/#delayed-dropdown-promo-sweep) | [Motion](https://github.com/motiondivision/motion) | **92/100** | [Glean](https://www.glean.com/) | 32,819 | 1 | Recommended | [Score + code + prompt](https://giraffe-tree.github.io/awesome-web-effects/#delayed-dropdown-promo-sweep) |

<a id="pointer"></a>

### Pointer & hover

Tilt, depth, custom cursors, magnetic motion, and image distortion.

| Effect | Recommended implementation | Curatorial score | AI homepage references (max 3) | Stars | Implementations | Status | Implementation |
| --- | --- | ---: | --- | ---: | ---: | --- | --- |
| [Perspective tilt and glare](https://giraffe-tree.github.io/awesome-web-effects/#perspective-tilt-and-glare) | [vanilla-tilt.js](https://github.com/micku7zu/vanilla-tilt.js) | **90/100** | — | 4,019 | 1 | Recommended | [Score + code + prompt](https://giraffe-tree.github.io/awesome-web-effects/#perspective-tilt-and-glare) |
| [Context-aware custom cursor](https://giraffe-tree.github.io/awesome-web-effects/#context-aware-custom-cursor) | [mouse-follower](https://github.com/Cuberto/mouse-follower) | **86/100** | — | 818 | 1 | Recommended | [Score + code + prompt](https://giraffe-tree.github.io/awesome-web-effects/#context-aware-custom-cursor) |
| [Displacement-map image hover](https://giraffe-tree.github.io/awesome-web-effects/#displacement-map-image-hover) | [hover-effect](https://github.com/robin-dela/hover-effect) | **90/100** | — | 1,874 | 1 | Recommended | [Score + code + prompt](https://giraffe-tree.github.io/awesome-web-effects/#displacement-map-image-hover) |

<a id="vector"></a>

### Text & SVG

Typing, text splitting, vector drawing, handwriting, and SVG morphing.

| Effect | Recommended implementation | Curatorial score | AI homepage references (max 3) | Stars | Implementations | Status | Implementation |
| --- | --- | ---: | --- | ---: | ---: | --- | --- |
| [SVG stroke drawing](https://giraffe-tree.github.io/awesome-web-effects/#svg-stroke-drawing) | [Vivus](https://github.com/maxwellito/vivus) | **86/100** | — | 15,479 | 1 | Legacy | [Score + code + prompt](https://giraffe-tree.github.io/awesome-web-effects/#svg-stroke-drawing) |
| [Type-select-replace prompt loop](https://giraffe-tree.github.io/awesome-web-effects/#prompt-select-replace-loop) | [Motion](https://github.com/motiondivision/motion) | **97/100** | [Granola](https://www.granola.ai/) | 32,819 | 1 | Recommended | [Score + code + prompt](https://giraffe-tree.github.io/awesome-web-effects/#prompt-select-replace-loop) |
| [Traveling-dot headline eraser-writer](https://giraffe-tree.github.io/awesome-web-effects/#traveling-dot-headline-rewriter) | [Motion](https://github.com/motiondivision/motion) | **97/100** | [PolyAI](https://poly.ai/) | 32,819 | 1 | Recommended | [Score + code + prompt](https://giraffe-tree.github.io/awesome-web-effects/#traveling-dot-headline-rewriter) |
| [Infinite curved text-path conveyor](https://giraffe-tree.github.io/awesome-web-effects/#infinite-curved-text-conveyor) | [Motion](https://github.com/motiondivision/motion) | **96/100** | [Wispr Flow](https://wisprflow.ai/) | 32,819 | 1 | Recommended | [Score + code + prompt](https://giraffe-tree.github.io/awesome-web-effects/#infinite-curved-text-conveyor) |

<a id="canvas"></a>

### Canvas & 2D

Scene graphs, creative coding, physics, drawing tools, and 2D renderers.

| Effect | Recommended implementation | Curatorial score | AI homepage references (max 3) | Stars | Implementations | Status | Implementation |
| --- | --- | ---: | --- | ---: | ---: | --- | --- |
| [Sketch-style creative coding loop](https://giraffe-tree.github.io/awesome-web-effects/#sketch-style-creative-coding-loop) | [p5.js](https://github.com/processing/p5.js) | **91/100** | [Hume AI](https://www.hume.ai/) | 23,797 | 1 | Recommended | [Score + code + prompt](https://giraffe-tree.github.io/awesome-web-effects/#sketch-style-creative-coding-loop) |
| [Depth-layer ordered blur dissolve](https://giraffe-tree.github.io/awesome-web-effects/#depth-layer-blur-dissolve) | [p5.js](https://github.com/processing/p5.js) | **96/100** | [Black Forest Labs](https://bfl.ai/) | 23,797 | 1 | Recommended | [Score + code + prompt](https://giraffe-tree.github.io/awesome-web-effects/#depth-layer-blur-dissolve) |
| [DOM-aware drag-spawned fish flock](https://giraffe-tree.github.io/awesome-web-effects/#dom-aware-drag-spawned-fish-flock) | [p5.js](https://github.com/processing/p5.js) | **98/100** | [Sakana AI](https://sakana.ai/) | 23,797 | 1 | Recommended | [Score + code + prompt](https://giraffe-tree.github.io/awesome-web-effects/#dom-aware-drag-spawned-fish-flock) |
| [Staggered multi-chart telemetry boot](https://giraffe-tree.github.io/awesome-web-effects/#staggered-multichart-telemetry-boot) | [p5.js](https://github.com/processing/p5.js) | **95/100** | [Pinecone](https://www.pinecone.io/) | 23,797 | 1 | Recommended | [Score + code + prompt](https://giraffe-tree.github.io/awesome-web-effects/#staggered-multichart-telemetry-boot) |

<a id="webgl"></a>

### 3D & WebGL

3D engines, declarative renderers, shader layers, and post-processing.

| Effect | Recommended implementation | Curatorial score | AI homepage references (max 3) | Stars | Implementations | Status | Implementation |
| --- | --- | ---: | --- | ---: | ---: | --- | --- |
| [GPU-instanced particle vortex](https://giraffe-tree.github.io/awesome-web-effects/#functional-webgl-draw-commands) | [regl](https://github.com/regl-project/regl) | **96/100** | — | 5,557 | 1 | Recommended | [Score + code + prompt](https://giraffe-tree.github.io/awesome-web-effects/#functional-webgl-draw-commands) |
| [DOM-bound iridescent shader plane](https://giraffe-tree.github.io/awesome-web-effects/#dom-synced-shader-planes) | [Curtains.js](https://github.com/martinlaxenaire/curtainsjs) | **94/100** | — | 1,823 | 1 | Recommended | [Score + code + prompt](https://giraffe-tree.github.io/awesome-web-effects/#dom-synced-shader-planes) |

## Demo

The demo is dependency-free static HTML, CSS, JavaScript modules, and verified GIF assets. It supports effect search, category filtering, score sorting, English/Chinese UI, stable effect anchors, visible score breakdowns, real mobile previews, expandable source details, copyable minimal code, and one-click prompts for coding agents.

```bash
python3 -m http.server 4173 --directory demo
```

Open [http://localhost:4173](http://localhost:4173). A local HTTP server is required because the catalog is loaded as an ES module.

## Real GIF capture and optimization

First build a runnable, reusable HTML demo in `demo/preview-demos/` and verify that it uses the named implementation. Capture the running browser output, then normalize verified official GIFs:

```bash
npm ci --prefix demo/preview-demos
npm run build --prefix demo/preview-demos
python3 scripts/capture-real-preview-gifs.py --built --skip-install
node scripts/normalize-gif-previews.mjs
```

The capture step records the real local demo; normalization only processes source-verified official media. The validator checks provenance state, demo and GIF existence, unique content hashes, dimensions, duration, frame count, decodability, and the per-file size budget. If a source has neither a verified official asset nor a runnable captured demo, leave it unavailable.

See the [preview authenticity migration report](research/preview-authenticity-migration-2026-07-17.md) and the machine-readable [preview provenance manifest](demo/gifs/provenance.json).

## GitHub Pages

The demo is fully static and uses only relative paths. The included workflow publishes `demo/` on pushes to `main` and supports manual runs. Before the first deployment, set **Settings → Pages → Source** to **GitHub Actions**. See [the deployment notes](docs/GITHUB_PAGES.md).

Expected project URL: [https://giraffe-tree.github.io/awesome-web-effects/](https://giraffe-tree.github.io/awesome-web-effects/)

## Maintaining the catalog

- Add only curator-approved records to `demo/data/effects.js`; rejected candidates belong in the dated admission audit, not the release catalog.
- Store the score and six dimension values on every published effect and update `demo/data/demo-admission.js` when the policy changes.
- Keep `effect.id` semantic and stable; never derive it from a repository name.
- Reusing a project across effects is valid. Add alternative implementations to an effect's `sources` array.
- Keep snippets and previews on the source relation, not on the project or effect root.
- Run `node scripts/build-docs.mjs` to regenerate both README files.
- Run `node scripts/validate.mjs` before committing.

GIFs and project names are used for research, indexing, and comparison. Rights remain with their respective authors.
