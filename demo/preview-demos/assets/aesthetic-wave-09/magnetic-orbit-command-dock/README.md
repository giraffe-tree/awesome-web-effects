# Harbor command source

`harbor-command-source.jpg` is an original fictional aerial harbor image generated with the built-in OpenAI ImageGen tool on 2026-07-21 for `magnetic-orbit-command-dock`.

It is not presented as documentary photography of a real place. The image is a functional algorithm input: the demo fetches the exact same-origin JPEG, verifies its SHA-256, decodes it in the browser, samples a 96 × 54 center crop, and uses local luminance, saturation, edge energy, variance, warmth, and RGB to rank five commands, choose the recommendation, color the sample indicator, and calculate each command's magnetic pull.

## Final asset

- File: `harbor-command-source.jpg`
- Dimensions: 960 × 640
- Format: JPEG, quality 88
- Bytes: 257,814
- SHA-256: `6491e95d92172869c9dcacd2b1b3128cd23e4e050156aac3add581ed8cb105a6`
- Runtime crop: source `(0, 50, 960, 540)` → sampled `96 × 54`
- Origin: built-in ImageGen, then locally resized and encoded with `sips`; no compositing or paint-over

## Generation prompt

```text
Use case: photorealistic-natural
Asset type: same-origin pixel-analysis source for an interactive web demo, 3:2 landscape
Primary request: create a fictional top-down drone survey photograph of a compact coastal working harbor for a media-inspection command dock. The image must provide meaningfully different pixel-analysis zones: deep charcoal-blue open water with low luminance and soft texture; a dense pale concrete pier network with crisp high-frequency edges; a compact warm rust-orange equipment and container zone with high saturation; a bright silver-white water reflection zone; and a balanced slate-gray quay zone. These regions should be visually connected as one plausible harbor, not a collage.
Style/medium: highly realistic editorial aerial photography, subtle natural grain, physically plausible geometry
Composition/framing: true overhead orthographic-feeling view, wide 3:2 frame, useful detail across the full frame, clear large regions that survive downsampling to 96x64
Lighting/mood: cool late-afternoon overcast with a controlled bright reflection, professional survey-document mood
Color palette: navy, slate, pale concrete, rust orange, limited teal water, neutral highlights
Constraints: fictional location, no people, no vehicles with readable plates, no brands, no logos, no text, no numbers, no map labels, no UI, no watermark; strong real luminance, saturation, and edge-density variation across zones; plausible connected piers and shoreline; image will be sampled by JavaScript and every region must contain genuine photographic texture
Avoid: infographic appearance, isometric illustration, split panels, collage seams, fantasy architecture, illegible pseudo-text, dominant vignette, extreme cinematic color grade
```

## Visual and safety review

- No visible logo, watermark, map label, or readable text.
- The harbor is explicitly fictional; the interface calls it a fictional scan.
- Large dark-water, reflective-water, concrete-edge, warm-equipment, and mixed-texture areas remain distinct at thumbnail scale.
- The project does not depend on the generation service at runtime.
