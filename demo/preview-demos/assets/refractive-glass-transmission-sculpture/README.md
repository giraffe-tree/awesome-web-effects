# Refractive glass transmission sculpture assets

These two fictional studio plates were generated specifically for the `refractive-glass-transmission-sculpture` demo. They are not photographs of a real laboratory, product, venue, or brand.

## Generation record

- Generation date: 2026-07-21
- Tool: built-in OpenAI ImageGen tool
- Use: real WebGL environment textures sampled by the ray-marched glass transmission shader
- Final format: JPEG, 960×540 px, sRGB
- AI disclosure: both images are AI-generated fictional environments
- Runtime policy: assets are stored locally; the demo does not call an image service at runtime

## `01-cobalt-amber-calibration-bay.jpg`

Purpose: the default high-contrast studio sweep. Its cobalt, amber, white, and black vertical references make distortion, chromatic dispersion, and silhouette changes legible through the glass form.

Original ImageGen output: 1774×887 PNG. Final project asset: centered 16:9 crop, resized to 960×540 JPEG.

SHA-256: `11184be8acca9f004f091a87a835c61b0c029c61ff280c4f627e9d5a20eeaf43`

Prompt:

```text
Use case: product-mockup
Asset type: WebGL refraction environment texture for an interactive glass material inspection demo
Primary request: a high-contrast professional optical calibration studio viewed straight on, designed as a background plate whose geometry will visibly bend through transparent glass
Scene/backdrop: deep charcoal seamless cyclorama with a matte black floor, broad vertical luminous panels in saturated cobalt blue and warm amber, two narrow neutral-white light bars, a subtle horizon line, no foreground object
Subject: the empty studio environment itself; clean graphic areas and crisp straight edges that make refraction immediately legible
Style/medium: photorealistic premium product photography, physically plausible light, restrained editorial finish
Composition/framing: wide landscape frame, symmetrical but not sterile, full-bleed, large uninterrupted color fields, strong straight vertical and horizontal references, useful detail across the entire frame
Lighting/mood: dramatic controlled studio lighting, deep blacks, bright calibrated highlights, high dynamic range without blown-out glare
Color palette: charcoal black, cobalt blue, warm amber, clean neutral white
Materials/textures: matte cyclorama paint, brushed dark metal trim, soft floor reflections, realistic studio surfaces
Constraints: no product, no glass object, no people, no furniture, no text, no letters, no numbers, no logos, no trademarks, no watermark, no fake UI, no vignette; must remain recognizable when cropped to 16:9 and sampled as a WebGL texture
Avoid: neon cyberpunk clutter, busy props, fantasy elements, haze obscuring the straight reference lines, gradients without physical light sources
```

## `02-cyan-red-grid-bay.jpg`

Purpose: the inspection environment. The orthogonal luminous grid gives the operator a precise visual reference for checking magnification, edge distortion, and chromatic separation.

Original ImageGen output: 1536×1024 PNG. Final project asset: centered 16:9 crop, resized to 960×540 JPEG.

SHA-256: `34a1e8bea6434849535cd10269d68f5b06b02fe19eca60877732897fe776bc6b`

Prompt:

```text
Use case: product-mockup
Asset type: second WebGL refraction environment texture for the same interactive glass material inspection demo
Primary request: a high-contrast professional optical calibration studio from the same product-photography series, built around a crisp luminous measurement grid so transparent-glass distortion is unmistakable
Scene/backdrop: deep charcoal seamless cyclorama and matte black floor, one large centered off-white illuminated grid wall with evenly spaced thin orthogonal lines, narrow saturated cyan side light on one edge and vivid signal-red side light on the other, dark metal framing, no foreground object
Subject: the empty studio calibration environment itself; straight grid lines and colored edges are the visual measurement references
Style/medium: photorealistic premium product photography matching a controlled industrial design lab
Composition/framing: wide landscape frame, centered one-point perspective, full-bleed, readable grid across most of the image, generous dark perimeter, crisp geometry that remains legible at thumbnail scale
Lighting/mood: precise laboratory studio lighting, high contrast, clean bright grid, deep blacks, subtle physically plausible floor reflection
Color palette: charcoal black, warm off-white, cyan, signal red
Materials/textures: matte cyclorama paint, powder-coated dark metal, frosted luminous panels, soft floor reflections
Constraints: no product, no glass object, no people, no furniture, no text, no letters, no numbers, no logos, no trademarks, no watermark, no fake UI, no vignette; must remain recognizable when cropped to 16:9 and sampled as a WebGL texture
Avoid: cyberpunk clutter, tiny busy details, fantasy elements, perspective warping of the grid, haze, bloom that erases the straight lines, checkerboard transparency pattern
```

Both final assets were visually checked for unintended text, logos, watermarks, people, and obvious structural artifacts before use.
