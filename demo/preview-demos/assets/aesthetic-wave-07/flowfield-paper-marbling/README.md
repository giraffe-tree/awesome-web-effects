# Mizu Press pigment / paper calibration scan

Project-bound raster input for `#125 flowfield-paper-marbling`.

## Generation and disclosure

- Generated: 2026-07-21 (Asia/Shanghai).
- Tool path: Codex built-in ImageGen (`image_gen`), not the CLI fallback.
- Use-case taxonomy: `product-mockup`.
- Original generated output: `1536 × 1024` PNG in the local Codex generated-image store.
- Project asset: `pigment-paper-calibration.jpg`, mechanically downsampled to `960 × 640` with macOS `sips`, JPEG quality 86.
- Final byte length: `423661` bytes.
- Final SHA-256: `f368a7e66e8e91c8118739f5bddb7979a55b4aa0397c6007882bc1b80d12be01`.
- External source material: none.
- Rights/provenance note: this is an original AI-generated fictional material scan. It does not depict a real print shop, artist, historical paper, pigment formula, product, archive, certification, or measured quality record.

## Functional runtime use

The asset is not a decorative background. The browser fetches the exact same-origin JPEG, verifies its bytes and SHA-256, decodes it independently in the browser and in `p5@2.3.0`, and samples a `72 × 48` raster. Those decoded pixels materially initialize:

1. pigment category and density for every flow cell;
2. local luminance gradients, hue-derived angles, and flow-vector magnitude;
3. dark low-chroma contamination evidence and the initial proof score;
4. the color, width, and direction of visible streamlines;
5. the trusted hover probe's color/category/load readout;
6. the retained field deformation produced by captured mouse, touch, or pen combing.

The runtime gate requires the exact source-file hash and dimensions, but treats decode-derived pixel hashes, vector checksums, and metrics as evidence with robust ranges rather than cross-platform exact constants.

## Exact ImageGen prompt

```text
Use case: product-mockup
Asset type: functional raster calibration input for a browser-based paper marbling and printmaking quality-control tool
Primary request: create a fictional but physically plausible flatbed scanner capture of a handmade paper-marbling pigment calibration sheet used in a small artisan print studio
Scene/backdrop: the entire frame is the calibration sheet lying perfectly flat under a scanner, edge-to-edge, orthographic top-down, no surrounding desk or scanner body
Subject: richly marbled absorbent cotton paper with broad measurable regions of indigo, ultramarine, oxidized teal, madder red, burnt orange, warm ochre, bone paper, and a few dark pigment contamination flecks; organic combed veins and fluid cellular whorls run across the full sheet; include one visually calmer light paper region and several denser saturated pools so pixel sampling has meaningful luminance, hue, and contamination variation
Style/medium: photorealistic archival material scan, tactile cotton fibers, handmade suminagashi and western comb-marbling hybrid, restrained editorial art direction, technically credible pigment behavior
Composition/framing: landscape 3:2, full bleed texture, no borders, no labels, no rulers, no UI, no hands; large coherent pigment zones remain legible at thumbnail size while fine comb lines support close sampling
Lighting/mood: neutral scanner illumination, flat and even, no cast shadows, no vignette, no specular glare
Color palette: deep indigo and teal are dominant; madder red, burnt orange, ochre, and warm ivory form clearly separated secondary regions; preserve both dark and bright pixels
Materials/textures: visible cotton paper tooth, feathered pigment edges, liquid vein boundaries, occasional plausible dark speck contamination
Constraints: no text, no letters, no numbers, no logos, no watermark, no frame, no mockup perspective, no people, no objects; this must read as a real scanned material sample rather than digital generative art; avoid symmetrical kaleidoscope geometry and avoid evenly tiled repetition
```

Built-in result file: `exec-729845ff-24d3-43ba-87b5-897fe5f3c242.png`.

## Processing and visual QA

The accepted generated PNG was inspected at original resolution for pseudo-text, logos, watermarks, unwanted objects, implausible shadows, and repeated tiling. It was copied to a temporary local path and converted with:

```sh
sips -s format jpeg -s formatOptions 86 \
  --resampleHeightWidth 640 960 \
  marbling-pigment-calibration-source.png \
  --out pigment-paper-calibration.jpg
```

The final 960 × 640 RGB JPEG was inspected again at original resolution. Its broad indigo/teal, madder/orange, warm paper, and dark-speck regions remain visually distinct, while the cotton tooth and combed veins remain available to the runtime sampler.

The live source demo was then inspected at `720 × 405`, `320 × 180`, and `144 × 81`. At every size the generated paper remains the dominant live surface rather than a small inset. QA covered initial stillness, trusted hover sampling, a captured diagonal comb drag, retained field deformation, range input, keyboard tine adjustment, undo, reset, and approval. The smallest run retained one five-point stroke, produced 257 visible flow deformations, accepted 14 trusted inputs with zero rejected inputs, balanced two pointer captures with two releases, and passed its runtime assertion without console errors. No timer, preview clock, autoplay, synthetic event, or rehearsal path changes the proof.

## Factual declaration

The image and all browser-derived quality readings are fictional interaction-demo material. “Mizu Press,” pigment density, contamination, proof score, and approval status are interface fiction designed to demonstrate causal pixel analysis and human-operated marbling. They are not conservation advice, laboratory measurements, manufacturing specifications, or evidence about any real artwork or print process.
