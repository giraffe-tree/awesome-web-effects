# Cursor Heatmap Crystallization — Generated Material Plate

## Asset

- File: `phase-change-ceramic-micrograph.jpg`
- Purpose: p5.js decodes the committed plate, crops it to 16:9, and samples its actual RGBA pixels into an 80×45 lattice. Pixel luminance, red/blue bias, and material classification directly determine each cell's material zone, conductivity, heat capacity, and crystallization threshold. The bitmap is mechanism input, not a decorative background.
- Final format and dimensions: JPEG, 960×640 px (converted from the generated 1536×1024 PNG with JPEG quality 88)
- Final byte length: 456,215 bytes
- Final SHA-256: `52cc25a66d3f7b4bf699b3cf5b3f8ae3d50311d51638f190852a3d6c6aa1cd4f`
- Generated: 2026-07-21 (Asia/Shanghai)

## ImageGen provenance

- Source: OpenAI built-in ImageGen tool, default built-in tool mode
- Generated result file: `exec-3cb29ba7-e197-4342-b7b9-7df69ac711f6.png`
- Original generated dimensions: 1536×1024 px
- Workspace derivation: macOS `sips` resized the generated PNG to exactly 960×640 and encoded JPEG at quality 88. No compositing, relighting, text, or post-generation subject edits were applied.
- Runtime derivation: the source is cropped from `(0, 50)` to `960×540`, resized by p5.js to `80×45`, decoded to 3,600 RGBA samples, classified into ceramic/conductor/pore zones, and converted into heterogeneous thermal properties. Heat diffusion and crystallization read those properties for every finite solver iteration.
- QA-observed sampled-pixel SHA-256: `56024c2631c8f821e9ec6f44f36dc31a3596a8afe18433a8f06b4f4ee6b67973`
- Production Chrome QA sampled-pixel SHA-256: `876d98f635674869cc89a74145582d786a1ff5e6cb561dd5ee73798a171f05cd`
- QA-observed material-property checksum: `2034494115`
- QA-observed sampled zones: 2,415 ceramic cells, 370 conductive cells, and 815 pore cells (3,600 total)

The committed JPEG byte SHA is the portable identity check. Browser JPEG decoding and Canvas resampling can differ by a few channel values across renderers, so runtime admission verifies the 3,600-cell total, broad zone ranges, colour diversity, property ranges, and a nonzero checksum instead of treating the QA-observed derivative hashes as cross-platform file identities.

## Complete generation prompt

```text
Use case: scientific-educational
Asset type: fictional microscopy source plate for an interactive human-operated thermal crystallization material experiment
Primary request: create one visually convincing, fictional polarized-light micrograph of a phase-change ceramic thin film whose real image pixels will be sampled into material zones, thermal conductivity, heat capacity, and crystallization thresholds
Scene/backdrop: edge-to-edge microscopic material surface, no laboratory room and no interface overlay
Subject: broad interlocking mineral grains with a few dark porous inclusions, thin copper-amber conductive seams, cool blue-violet ceramic regions, and sparse pale crystalline nuclei; patterns should be physically plausible and varied rather than repetitive
Style/medium: high-resolution scientific microscopy photography, polarized-light texture, tactile but restrained, convincing microstructure, editorial scientific plate
Composition/framing: landscape 3:2, full-bleed surface, strong large regions and legible boundaries that survive reduction to 320x180; distributed detail across the whole frame; no empty background
Lighting/mood: transmitted polarized illumination, crisp material boundaries, deep but readable shadows, no glow effects
Color palette: graphite, indigo, ultramarine, oxidized copper, restrained amber, pale mineral white
Materials/textures: fine ceramic grain, microfractures, crystalline facets, porous inclusions, metallic conductive seams
Constraints: no text, no labels, no scale bar, no logo, no watermark, no border, no UI, no people, no instruments, no recognizable real specimen; fictional material; preserve readable material regions at thumbnail size
Avoid: neon cyberpunk, fantasy crystals, perfect geometric repetition, cellular honeycomb, obvious fractal pattern, excessive bloom, fake depth-of-field, microscopic organisms, fingerprints, letters, symbols
```

## AI / fictional-content disclosure

This is an AI-generated, fictional scientific material plate. It does not document a real specimen, measurement, institution, product, experiment, or phase-change result. All thermal values and material classifications in the demo are deterministic interaction-demo measurements derived from the committed image pixels; they are not claims about a physical material.
