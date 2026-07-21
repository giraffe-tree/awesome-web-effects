# Animated Bezier route cartography — checkpoint atlas

This directory contains the project-local raster evidence used by
`animated-bezier-route-cartography`.

## Disclosure and use

- The image was generated with Codex's built-in ImageGen tool on 2026-07-21.
- Every depot, road, clinic, payload and delivery event shown here is fictional.
- It is not a photograph of a real route, shipment, medical record or institution.
- The atlas is mechanism input, not a decorative background: the live demo selects one
  of its three deterministic crops when the SVG route reaches or selects the matching
  checkpoint, and its runtime contract fetches, hashes, decodes and samples the committed
  pixels before marking the preview ready.

## Final project asset

| File | Dimensions | Format | Bytes | SHA-256 |
| --- | ---: | --- | ---: | --- |
| `checkpoint-atlas.jpg` | 960 × 640 | RGB JPEG | 252,082 | `4511d72d39ff9954a5f4d5aa86fee96e3f4d520babbacca0a0d8208f81751e62` |

The three equal source regions are `[0, 0, 320, 640]`, `[320, 0, 320, 640]`, and
`[640, 0, 320, 640]`. The demo samples every region into a 64 × 64 canvas for pixel
evidence and displays it with atlas background positions `0%`, `50%`, and `100%`.

## Generation record

- Tool mode: built-in ImageGen (not CLI fallback)
- Built-in result file ID: `exec-b9bd69d4-bdac-4365-9334-743fcdabf209.png`
- Generated source dimensions: 1536 × 1024 PNG
- Generated source SHA-256: `057230ac6e94955205fbf602eb9938a2d39fae02730292722a463d073a7bc5f8`
- Final derivation: resize the source proportionally to 960 × 640, convert to RGB JPEG,
  and encode at JPEG quality 88 with macOS `sips`; no crop, compositing, retouching,
  generated text, or manual pixel replacement was applied.
- Reproduction command shape:

  ```bash
  sips -Z 960 -s format jpeg -s formatOptions 88 <built-in-output.png> \
    --out checkpoint-atlas.jpg
  ```

## Full prompt

```text
Use case: photorealistic-natural
Asset type: three-stop route inspection atlas for an interactive SVG delivery-map demo
Primary request: create one original horizontal documentary contact sheet containing exactly three equal-width vertical photographs of the same fictional alpine cold-chain bicycle delivery route, with clean straight boundaries between panels.
Scene/backdrop: panel 1 is a compact dark-stone dispatch depot at blue dawn with one sealed coral insulated medicine crate beside the loading door; panel 2 is a wind-exposed pale concrete switchback overlook above a deep green valley with the same sealed coral crate secured on a parked cargo bicycle; panel 3 is a small remote mountain clinic entrance at warm early-morning light with the same sealed coral crate placed safely at the reception threshold.
Subject: the three operational checkpoints and the repeated sealed coral crate are the evidence that each route stop belongs to one delivery task.
Style/medium: photorealistic editorial field documentation, believable weathered materials, restrained color, natural light, subtle grain, no cinematic fantasy.
Composition/framing: 3:2 landscape canvas; exactly three equal vertical panels from left to right; each checkpoint centered and readable when cropped independently; strong simple silhouettes; no people; enough breathing room around the crate.
Lighting/mood: coherent dawn-to-morning progression, cool slate and pine tones with the coral crate as the only saturated accent.
Constraints: no text, no letters, no numbers, no map graphics, no icons, no logos, no brands, no watermark; no duplicated buildings; no extra panels; no collage captions; the route and place are explicitly fictional; avoid surreal geometry and impossible bicycle parts.
```

## Visual QA

The selected generation was accepted because all three panels are plainly distinct at
thumbnail scale, the coral sealed case provides continuity without labels, the cargo
bicycle is mechanically plausible, buildings and mountain roads have no obvious
structural breaks, and the image contains no visible wordmark, brand, caption or
watermark. Any later replacement must update the byte length, SHA-256, dimensions,
crop evidence and runtime assertion together.
