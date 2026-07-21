# North Atlantic passage current source

Project-specific source raster for `flow-field-ribbon-advection`.

- File: `north-atlantic-passage-current-source.jpg`
- Role: functional runtime evidence for current vectors, streamline direction and speed, grounding hazards, local probe readings, and route-risk recommendations
- Source: generated for this repository with the built-in OpenAI ImageGen tool on 2026-07-21
- Original built-in output: `exec-75c42383-6c6b-443b-8214-7ee99d83e958.png`
- Repository conversion: resized to 960 × 640 and encoded as JPEG at quality 88 with macOS `sips`
- Dimensions: 960 × 640
- Byte length: 266749
- SHA-256: `e732c36053e0657291b4846ff0e1ef2d2d484f31bc886709cf271c7329cd1b3b`
- License/use basis: newly generated project asset; no third-party source image was supplied

## Runtime use

The browser fetches this exact same-origin JPEG, verifies its byte length and SHA-256, decodes it independently through both `HTMLImageElement` and `p5.Image`, and samples a 96 × 64 RGBA field. Luminance and cyan/warm chroma gradients determine the 6,144 p5 flow vectors. Pixel edges, warm sediment, neutral rock, and bright-shallow evidence determine grounding risk. Every route evaluation reads those vectors and hazard values; replacing the raster changes the current ribbons, probe readings, safest gate, route checksum, risk, assist, and distance.

## Final prompt

```text
Use case: scientific-educational
Asset type: runtime source raster for an interactive p5.js ocean-current route planning demo
Primary request: create a photorealistic top-down multispectral remote-sensing composite of a fictional narrow North Atlantic island passage, showing ocean surface currents and bathymetric influence through natural water-color structure rather than labels
Scene/backdrop: full-frame aerial ocean chart, deep navy open water on the west and east, a broken basalt island chain framing a navigable central passage, pale turquoise shallows around rocks, long cyan and teal current filaments bending through the strait, a few amber-brown suspended-sediment plumes marking hazardous shoals
Style/medium: plausible scientific satellite/oceanographic survey raster fused with restrained editorial photography; realistic water texture, materially rich, visually legible at thumbnail scale
Composition/framing: landscape 3:2; full bleed; strong continuous current corridor travels from lower-left toward upper-right through the central channel; several alternative stream branches and eddies; avoid a symmetrical composition
Lighting/mood: overcast high-latitude survey light, calm precise technical atmosphere
Color palette: deep indigo, petrol blue, oxidized teal, pale cyan, basalt charcoal, restrained ochre sediment accents
Constraints: no text, no letters, no numbers, no legends, no UI, no borders, no route line, no arrows, no boats, no people, no buildings, no watermark; keep currents and hazards encoded in actual pixel color and gradients so code can sample them
Avoid: generic fantasy map, abstract wallpaper, neon glow, decorative vector streaks, flat illustration, satellite labels, logos
```
