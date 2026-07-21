# Four-ink tension proof

This original raster asset is a fictional printmaker's proof sheet for `kinetic-typography-letter-springs`. It is not a photograph of a real studio, print edition, artist, brand, or product.

## AI disclosure and functional use

- Generated on 2026-07-21 with Codex's built-in ImageGen tool (`product-mockup` use case).
- No user image, brand reference, trademark, remote runtime asset, or third-party raster was used.
- The generated PNG was visually inspected for unwanted text, logos, watermarks, hands, malformed paper geometry, and ambiguous ink zones.
- The selected PNG was deterministically resized to a 960 × 640 baseline JPEG with macOS `sips`; the generated original remains in the local Codex image store and is not a runtime dependency.
- The browser fetches and hashes the committed JPEG bytes, decodes those exact bytes through both `HTMLImageElement.decode()` and `p5.Image`, downsamples the image to 96 × 64 pixels, and samples the four ink regions plus the central paper region.
- Sampled pixels determine every letter's ink color, the outline rule, spring stiffness, damping, safe displacement, material readout, and proof conclusion. The asset is therefore a functional mechanism input, not a decorative backdrop.

## Final project asset

| File | Size | Bytes | SHA-256 |
| --- | --- | ---: | --- |
| `four-ink-tension-proof.jpg` | 960 × 640 JPEG | 316790 | `19742a0f7aa7a5a91f50c9ea04f285bc34017195cbdd157b9971e5ce05e73af1` |

## Generation record

Built-in result ID: `exec-0a7eaf9d-dab5-4e97-9420-ae1a52f380ef.png`

Generated PNG: 1536 × 1024, SHA-256 `bbdf0680ebd02610f5476223b3981a5442ef249d1c77bc8ea82ea0933dc2571e`

```text
Use case: product-mockup
Asset type: functional raster input for a browser-based kinetic typography proofing tool
Primary request: create an original top-down printmaker's title-proof sheet whose real pixels can supply paper texture and four distinct ink palettes
Scene/backdrop: a single large landscape sheet of warm uncoated cream paper lying flat on a very dark charcoal print studio table
Subject: the paper is mostly open and unprinted through the center; four broad abstract ink swatches sit clearly in the four corner zones — vermilion at upper left, deep cobalt at upper right, acid chartreuse at lower left, and saturated violet-magenta at lower right; each swatch has tactile screen-print edges, roller grain, and visibly different ink density
Style/medium: photorealistic editorial product flat lay, premium independent print studio proof, restrained and tactile
Composition/framing: landscape, perfectly top-down, the paper fills almost the entire frame edge-to-edge with a slim dark table margin; central 60 percent remains calm and light for browser-rendered typography; each colored corner region is large enough to remain distinct after 96 by 64 pixel sampling
Lighting/mood: soft neutral overhead studio light, controlled shadows, accurate paper and ink color
Color palette: warm cream stock, vermilion, deep cobalt blue, acid chartreuse, saturated violet-magenta, charcoal table
Materials/textures: visible cotton paper fibre, slight deckled paper edge, screen-print roller grain, subtle ink overprint texture
Constraints: no words, no letters, no numbers, no logos, no watermark, no brand marks, no hands, no tools crossing the paper, no people; all four colored corner zones must be separated by the cream paper center and visually unambiguous for pixel sampling
Avoid: poster text, fake typography, scattered props, perspective tilt, curled paper, glossy paper, color swatches in the center, large shadows covering the ink zones
```
