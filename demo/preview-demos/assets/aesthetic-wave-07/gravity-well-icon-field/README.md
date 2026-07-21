# Deep-field gravity lens asset

This directory contains the functional image input for `gravity-well-icon-field`.

## Disclosure and intended use

- Generated on 2026-07-21 with the built-in OpenAI ImageGen tool.
- The image is AI-generated and fictional. It resembles a plausible deep-field telescope survey, but it is not an observation from a real instrument, programme, or sky coordinate.
- The image is not decorative. The demo fetches and hashes the committed JPEG, decodes it with both the browser and `p5@2.3.0`, samples real RGBA pixels across the visible survey crop, derives local edge energy, blue excess, field structure, candidate positions, confidence, and the live conclusion from those pixels, and magnifies the same committed pixels inside the human-controlled gravity lens.
- No brand, person, logo, watermark, or third-party factual claim is represented.

## Complete generation prompt

```text
Use case: scientific-educational
Asset type: functional raster evidence source for an interactive browser gravitational-lensing inspection demo
Primary request: create a photorealistic deep-field astronomical survey plate showing a dense star field, several distant galaxies, one plausible galaxy cluster, faint blue gravitational arcs, dusty amber nebula traces, and areas of genuinely dark empty sky; the image will be sampled pixel-by-pixel by code, so it needs broad local variation in luminance, edge density, saturation, and blue/amber color ratios.
Scene/backdrop: authentic black-blue deep space, no borders or interface framing
Style/medium: calibrated orbital telescope photography, scientifically plausible, subtle sensor grain, crisp but natural star PSFs, not fantasy concept art
Composition/framing: landscape 3:2, edge-to-edge field; distribute 4-6 visually distinct candidate regions across the image instead of centering everything; reserve some dark sky between them
Lighting/mood: low-key, high dynamic range, restrained and analytical
Color palette: near-black navy, cool white, faint cyan/blue arcs, restrained dusty amber galaxies
Constraints: no UI, no labels, no text, no logos, no watermark, no decorative frame; no giant planet; no single dominant centered object; must read as a continuous survey photograph suitable for real pixel analysis
Avoid: science-fiction spacecraft, fantasy portals, neon vortex, duplicated galaxy motifs, excessive bloom, poster typography
```

## Original and derived files

| Stage | File / disposition | Dimensions | Format | Bytes | SHA-256 |
| --- | --- | ---: | --- | ---: | --- |
| ImageGen original | uncommitted generation output; retained outside the repository | 1536×1024 | RGB PNG | 2,214,281 | `cbe5f44d58db9f1670033331e2a0276cbb1192ab4bcb72d7c74b7c8facfc848f` |
| Runtime derivative | `deep-field-lensing-survey.jpg` | 960×640 | baseline RGB JPEG | 192,363 | `aa5095130a0a1424c6d43d95229728fd06a703beda30c5cb93b501f5be0c7c6a` |

The checked-in derivative was produced on macOS with:

```sh
sips -s format jpeg -s formatOptions 84 -z 640 960 \
  gravity-well-deep-field-source.png \
  --out deep-field-lensing-survey.jpg
```

Only the 960×640 JPEG is committed because it is the exact asset fetched, hashed, decoded, sampled, analysed, and rendered at runtime.
