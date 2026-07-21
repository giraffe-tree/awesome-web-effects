# Materia 115 biomaterial culture substrate

Project-bound raster input for `#115 reaction-diffusion-growth-field`.

## Generation and disclosure

- Generated: 2026-07-21 (Asia/Shanghai).
- Tool path: Codex built-in ImageGen (`image_gen`), not the CLI fallback.
- Use-case taxonomy: `scientific-educational`.
- Original generated output: `1536 × 1024` PNG in the local Codex generated-image store.
- Project asset: `biomaterial-culture-substrate.jpg`, mechanically downsampled to `960 × 640` with macOS `sips`, JPEG quality 88.
- Final byte length: `418008` bytes.
- Final SHA-256: `316ec17368475dafffaba704a2be2b5ecff9a436698f8947263f9e1f47e5f46a`.
- External source material: none.
- Rights/provenance note: this is an original AI-generated fictional material scan. It does not depict a real specimen, laboratory, organism, assay, clinical result, manufacturing batch, or scientific finding.

## Functional runtime use

The asset is not a decorative backdrop. The browser fetches the exact same-origin JPEG, verifies its byte length and SHA-256, decodes it independently in the browser and in `p5@2.3.0`, then crops and samples a `80 × 45` raster. Those 3,600 decoded cells materially determine:

1. cellulose, agar, mineral, biofilm, rust-seam, and mixed substrate classifications;
2. the local Gray–Scott feed, kill, diffusion-A, and diffusion-B values for every solver cell;
3. seven high-edge initial seed anchors and their accepted cells;
4. the full-stage material rendering, reaction tint, and trusted hover probe readout;
5. the acceptance strength of human-dragged mouse, touch, pen, or keyboard inoculum.

The runtime gate requires the exact source-file hash and dimensions. Decode-derived pixel hashes, zone counts, luminance, saturation, edge strength, and parameter ranges are checked with robust nonzero/range assertions rather than fragile cross-platform exact constants.

## Exact ImageGen prompt

```text
Use case: scientific-educational
Asset type: functional raster input for an interactive reaction–diffusion growth-field web demo
Primary request: create a photorealistic top-down laboratory material-scan photograph of a rectangular biomaterial culture substrate. The image must contain clearly distinct natural zones whose real pixel brightness, hue, saturation, and edge density can drive Gray–Scott reaction parameters: pale fibrous cellulose, warm amber nutrient agar, cool blue-green mineral deposits, charcoal porous biofilm, and narrow rust-red transition seams.
Scene/backdrop: the culture substrate fills the entire landscape frame edge to edge, viewed perfectly overhead, no tray rim, no table, no surrounding objects.
Style/medium: high-detail macro scientific photography, materially believable fibers, pores, mineral blooms and liquid boundaries; coherent continuous substrate rather than an infographic.
Composition/framing: landscape 3:2, broad contiguous regions plus fine branching boundaries distributed across the full frame; strong tonal range and many useful edges at both large and small scales.
Lighting/mood: diffuse neutral laboratory illumination, crisp readable texture, no dramatic vignette.
Color palette: parchment ivory, amber ochre, oxidized teal, graphite charcoal, restrained rust red.
Constraints: no people, no hands, no instruments, no petri-dish rim, no labels, no arrows, no typography, no grid, no UI, no watermark. Avoid a uniform background, empty corners, glossy 3D render appearance, or decorative composition unrelated to material sampling.
```

Built-in result file: `exec-b0f0d147-57a2-44b5-834c-f79f00258c9d.png`.

## Processing and visual QA

The accepted generated PNG was inspected at original resolution for pseudo-text, logos, watermarks, unwanted objects, implausible perspective, and repeated tiling. It was copied to a temporary local path and converted with:

```sh
sips -s format jpeg -s formatOptions 88 \
  --resampleHeightWidth 640 960 \
  biomaterial-culture-substrate-source.png \
  --out biomaterial-culture-substrate.jpg
```

The final `960 × 640` RGB JPEG was inspected again at original resolution. Its broad cellulose, agar, mineral, biofilm, and seam regions remain legible at thumbnail size; pores, fibers, and material boundaries remain available to the runtime sampler.

The browser-decoded `80 × 45` crop produced 3,600 RGBA samples / 14,400 bytes, 2,048 quantized distinct colors, a luminance range of `0.1014–0.8643` (mean `0.4978`), mean saturation `0.2961`, and 7,075 horizontal/vertical edge-pair comparisons. Local edge strength spanned `0.0075–0.5042` with mean `0.1274`. The image yielded all six declared zones: 522 cellulose, 360 agar, 205 mineral, 425 biofilm, 1,045 seam, and 1,043 mixed cells. The resulting robust parameter ranges were feed `0.026512–0.042124`, kill `0.050651–0.059751`, diffusion-A `0.907434–1.091815`, and diffusion-B `0.438780–0.591981`. Seven spatially separated edge-ranked anchors seeded 91 cells; their mean image-edge strength was `0.4123`.

The source demo uses no autonomous growth path: loading produces one held, image-derived initial condition; dragging deposits inoculum without advancing the solver; every visible Step button or Space key press runs exactly eight finite Gray–Scott iterations and immediately holds again. Undo and Reset are explicit human actions. Preview time, requestAnimationFrame, timers, synthetic events, automatic rehearsals, and fallbacks never mutate the field.

Live QA ran the unbuilt Vite source at `720 × 405`, `320 × 180`, and `144 × 81`. The runs used trusted captured mouse, touch, and pen drags respectively, plus visible Step controls, the nutrient range, arrow-key probing, Enter inoculation, Space stepping, Undo, and Reset. Every viewport reported full canvas/stage coverage, balanced pointer capture and release, zero rejected inputs, zero page errors, and a passing runtime assertion. The reference run advanced six finite batches to generation 48, then Undo restored generation 40 and Reset restored generation 0 with the exact initial field checksum.

## Factual declaration

The image and all browser-derived readings are fictional interaction-demo material. “Materia 115,” substrate zones, nutrient bias, feed/kill values, generations, and culture activity are interface fiction designed to demonstrate causal pixel analysis and human-operated reaction diffusion. They are not biological, clinical, environmental, conservation, or manufacturing measurements or advice.
