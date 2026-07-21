# Topographic wave contour reveal asset

This directory contains the local raster input for `topographic-wave-contour-reveal`.

## Image generation disclosure

- Tool: Codex built-in ImageGen (`image_gen`), default built-in mode.
- Generated: 2026-07-21.
- Use: fictional alpine watershed survey plate for a hiking / flash-flood route scanner.
- Disclosure: this is AI-generated fictional terrain. It does not depict a real place and must not be presented as factual cartography, survey data, or a real emergency forecast.
- Mechanism role: the submitted JPEG is loaded by p5.js and reduced to an `80 × 45` pixel field. Its real RGB and luminance values determine the smoothed elevation index, flood-risk field, nine marching-squares contour topologies, probe readout, and the dynamic safer-route solution. The image is not a decorative backdrop.

## Final generation prompt

```text
Use case: scientific-educational
Asset type: functional raster input for an interactive hiking and flash-flood topographic scanner
Primary request: Create a fictional alpine watershed seen from a high, near-orthographic aerial survey viewpoint, with one clearly legible winding river in the valley floor, several branching gullies, a low meadow basin, a steep rocky ridge, and a safe higher traverse path corridor suggested only by terrain geometry.
Scene/backdrop: entirely natural mountain terrain filling the frame edge to edge; no sky and no horizon.
Style/medium: photorealistic editorial aerial terrain photography with believable rock, scrub, grass, soil, and water texture; restrained field-survey mood.
Composition/framing: wide landscape composition, strong continuous valley running from upper-left toward lower-right, distinct high ridges around it, readable macro landforms even as a tiny thumbnail; avoid a centered mountain peak.
Lighting/mood: soft overcast morning light with enough luminance separation between low wet ground and high dry ridges for deterministic pixel sampling.
Color palette: mineral slate, moss green, muted ochre, cold blue-grey water; controlled, natural, not neon.
Constraints: fictional place only; the raster pixels must contain genuine tonal and color variation that can be sampled to derive elevation, flood risk, and contour thresholds; no added contour lines, no interface overlay, no humans, no buildings, no vehicles, no signs, no text, no labels, no logos, no watermark.
Avoid: fantasy geography, satellite map labels, fake UI, dramatic clouds, tilt-shift blur, excessive fog, vignette, oversaturated colors.
```

## Files and conversion record

| Stage | File | Dimensions | Format | Bytes | SHA-256 |
| --- | --- | ---: | --- | ---: | --- |
| Original ImageGen output (not committed) | `exec-540378ca-62f0-4acd-813f-6dd12b2c6418.png` | 1536 × 1024 | PNG | 4,098,274 | `f7e9b45f7081b5e179341a4771cf3ece1848acf2f7b7835f7efcc533b1ce6304` |
| Runtime asset | `alpine-watershed-aerial.jpg` | 960 × 640 | JPEG | 379,323 | `1821a74b46476b03c5f0aa9a8105c03602873e1ea0ba076da7084daf340e2522` |

The original built-in output was copied into the workspace for conversion, then transformed with macOS `sips`:

```bash
sips -z 640 960 -s format jpeg -s formatOptions 88 alpine-watershed-aerial-source.png \
  --out alpine-watershed-aerial.jpg
```

Only the derived runtime JPEG is committed. The demo verifies the committed byte length and SHA-256 before decoding it through both the browser image pipeline and `p5.Image`.

## Visual QA notes

- Wide, edge-to-edge terrain remains legible at the 320 × 180 catalog scale.
- Valley, river, meadow, scree, ridge, and higher traverse corridor are visually distinct without labels.
- No text, logos, watermark, people, vehicles, or real-place claims were observed.
- The generated image is accepted only as fictional functional input; the demo's on-screen elevations and flood status are computed indices, not real measurements.
