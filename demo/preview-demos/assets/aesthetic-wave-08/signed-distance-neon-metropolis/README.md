# Signed-distance neon metropolis asset

## Asset

- `night-clearance-occupancy-survey.jpg`
- 960 × 640 px, JPEG, 345,787 bytes
- SHA-256: `8b46933f1b6da5075914f317d723fc3f27c38b853035de6e892004b1c9700263`
- Generated: 2026-07-21 with the built-in OpenAI ImageGen tool, then locally resized and encoded as an 88-quality JPEG.
- This is an original fictional architectural visualization. It does not depict or document a real city, property, emergency, or planning decision.

## Functional role

The image is committed input data, not a decorative background. The browser fetches the exact local JPEG, verifies its byte length and SHA-256, decodes it, crops it to 16:9, and samples 128 × 72 real pixels. Warm high-luminance pixels become occupied building mass; dark pixels become street space. The p5.js runtime computes a signed distance field from the resulting boundary and uses it for the city glow, adjustable buffer band, probe distance, and `CLEAR` / `TIGHT` / `BLOCKED` result.

The committed image is also decoded as a real `p5.Image`. No colors, building rectangles, verdicts, or distance values are copied from the prompt.

## Final ImageGen prompt

```text
Use case: stylized-concept
Asset type: functional raster input for a browser-based signed-distance-field city clearance demo
Primary request: create an original top-down metropolitan occupancy survey at night whose real pixels can be thresholded into building footprints
Scene/backdrop: dense modern city plan viewed straight down, with dark asphalt streets and alleys separating many discrete city blocks
Subject: 18 to 24 large, clearly separated flat-roof building footprints in warm ivory, pale amber, and soft concrete white; a few internal courtyards; roads remain very dark charcoal and deep navy
Style/medium: polished editorial architectural visualization, orthographic top-down, graphic yet richly textured, credible urban materials, no perspective tilt
Composition/framing: landscape, edge-to-edge city plan, buildings distributed across the whole frame with several legible dark street corridors; no large empty margins; important blocks remain readable at thumbnail size
Lighting/mood: midnight survey lighting, warm rooftops against near-black streets, restrained cyan and magenta edge lighting only along some roads
Color palette: near-black navy, warm ivory, muted amber, restrained cyan and magenta accents
Materials/textures: subtle rooftop gravel, vents and seams, wet asphalt glints, but maintain strongly separated light building masses and dark streets
Constraints: functional high-contrast occupancy map; warm bright rooftop areas must be visually distinct from dark roads so pixel classification is reliable; no people, no cars, no labels, no numbers, no letters, no logos, no watermark, no border, no UI chrome
Avoid: aerial perspective, horizon, skyline view, isometric view, dense illegible tiny buildings, blown-out neon, text-like rooftop markings
```
