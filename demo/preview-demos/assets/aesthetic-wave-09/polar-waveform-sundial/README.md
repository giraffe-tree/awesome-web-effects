# Acoustic response plate source

Project-specific functional raster for `polar-waveform-sundial`.

- File: `acoustic-response-plate-source.jpg`
- Role: runtime pixel evidence for polar waveform amplitude/color, low/mid/high acoustic energy, selected phase level, hover probe, quietest recording window, gnomon length, and acoustic conclusion
- Source: generated for this repository with the built-in OpenAI ImageGen tool on 2026-07-21
- Original built-in output: `exec-9cd44a41-96eb-4ac3-b28b-d746324e61ae.png`
- Repository conversion: resized to 960 × 640 and encoded as JPEG at quality 88 with macOS `sips`
- Dimensions: 960 × 640
- Byte length: 314778
- SHA-256: `6000df299e322ee164dbb2b5695a750ed4fdb2e37718e84d529e783697d5eef8`
- License/use basis: newly generated project asset; no third-party source image was supplied

## Runtime use

The browser fetches this exact same-origin JPEG, verifies byte length and SHA-256, decodes it through both `HTMLImageElement` and `p5.Image`, then downsamples the full source to a 120 × 80 RGBA field. Code samples three real pixel radii for each of 256 angular bins at the selected native frequency range. Luminance, copper/teal chroma, radial contrast, and angular contrast determine the polar waveform and acoustic energy. The same evidence determines the selected dB level, response material, quietest phase, gnomon shadow length, hover probe, and recording recommendation. Changing the source raster changes every one of those results.

## Final prompt

```text
Use case: scientific-educational
Asset type: functional runtime source raster for an interactive p5.js polar waveform sundial and acoustic-session planner
Primary request: create a photorealistic top-down calibration photograph of a fictional circular acoustic response plate used to map a full day of environmental sound
Scene/backdrop: a large precisely circular resonant plate occupies the right two-thirds of a dark mineral work surface; the left third is calm dark slate negative space; the plate contains many organic concentric response bands and radial material variations that can be sampled as real pixel data
Subject: a crafted circular acoustic instrument made from oxidized brass, smoke-gray ceramic, charcoal stone, and subtle translucent resin; concentric rings shift between quiet dark sectors and energetic amber/copper sectors; one broad quiet sector near the upper-left of the circle and several high-energy copper sectors near the lower-right; no mechanical pointer because code will draw the gnomon
Style/medium: high-end scientific archive photography with convincing physical material, precise top-down geometry, understated editorial art direction
Composition/framing: landscape 3:2, full bleed; circle center near 68 percent width and 50 percent height; circle radius about 38 percent of image height; enough clear dark space on the left for interface copy; all concentric rings remain fully inside the frame
Lighting/mood: soft raking observatory light, calm analytical atmosphere, crisp material texture without harsh reflections
Color palette: graphite, deep blue-black, warm oxidized brass, muted copper, pale bone highlights, restrained teal patina
Constraints: no text, no letters, no numbers, no labels, no chart marks, no UI, no hands, no people, no buildings, no logos, no watermark; the bands must contain genuine pixel-level luminance and chroma variation around every angle so browser code can derive waveform amplitude and frequency energy
Avoid: abstract neon infographic, vinyl record, clock face, compass labels, decorative fantasy object, flat vector art, excessive symmetry, radial blur, empty featureless rings
```
