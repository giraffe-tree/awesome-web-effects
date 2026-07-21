# Elastic Voronoi focus mosaic asset

This directory contains the functional image input for `elastic-voronoi-focus-mosaic`.

## Disclosure and intended use

- Generated on 2026-07-21 with the built-in OpenAI ImageGen tool.
- The scene is AI-generated and fictional. It is a plausible coastal-restoration survey plate, not evidence of a real location, field visit, or habitat assessment.
- The image is not decorative. The demo loads and decodes the committed JPEG with both the browser and `p5@2.3.0`, samples real RGBA pixels around every Voronoi site, derives site colors and habitat-classification evidence from those pixels, and uses the same image inside the changing power-diagram cells.
- No brand, person, logo, watermark, or third-party factual claim is represented.

## Complete generation prompt

```text
Use case: photorealistic-natural
Asset type: functional image-analysis input for an interactive Voronoi focus mosaic
Primary request: a plausible top-down drone survey photograph of a coastal restoration site where multiple natural habitat materials meet organically
Scene/backdrop: shallow teal tidal pools, pale sand and salt flats, dark basalt rock, olive-green marsh grass, and a small area of weathered driftwood, all connected as one continuous landscape
Subject: clear, naturally separated habitat textures and color regions that an image-classification interface can inspect; no people, animals, vehicles, buildings, instruments, or overlays
Style/medium: photorealistic editorial aerial field-survey photography, physically plausible natural textures, restrained color grading
Composition/framing: wide landscape, near-orthographic top-down view, useful detail across the full frame, major habitat types distributed across the image with no single empty area
Lighting/mood: soft overcast coastal daylight, calm, scientific, highly legible surface texture
Color palette: mineral sand, basalt charcoal, tidal teal, marsh olive, driftwood tan
Constraints: one continuous natural scene; no collage borders; no text; no labels; no logos; no watermark; no artificial geometric Voronoi pattern; no UI elements; avoid fantasy colors and impossible geology
```

## Original and derived files

| Stage | File / disposition | Dimensions | Format | Bytes | SHA-256 |
| --- | --- | ---: | --- | ---: | --- |
| ImageGen original | uncommitted generation output; removed from the repo after derivation | 1536×1024 | RGB PNG | 3,906,584 | `62499e30b51bb25262f16a85ee70a760d91d89e393a59e190202934a0d46f8a6` |
| Runtime derivative | `coastal-restoration-survey.jpg` | 960×640 | baseline RGB JPEG | 360,838 | `45a73a7734337e154e4bb3a28a2ee86833228661d2a4b385791fb2af798f2a9a` |

The checked-in derivative was produced on macOS with:

```sh
sips -s format jpeg -s formatOptions 84 -z 640 960 \
  coastal-restoration-survey-source.png \
  --out coastal-restoration-survey.jpg
```

The original PNG is intentionally not shipped because the 960×640 JPEG is the exact asset fetched, hashed, decoded, sampled, classified, and drawn at runtime. Keeping the smaller committed input also avoids adding an unused 3.7 MiB duplicate.
