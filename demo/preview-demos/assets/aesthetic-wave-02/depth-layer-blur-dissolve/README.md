# Depth-layer blur dissolve · local mechanism assets

- Generated: 2026-07-21
- Source generator: built-in `image_gen`
- Runtime role: two aligned RGB sources plus one deterministic shared ordinal depth map for catalog 016, `depth-layer-blur-dissolve`
- Factual-use statement: both photographs depict the same fictional lakeside property and fictional landscape. They are not documentary photographs, a verified place, an existing architecture project, or a factual weather record.

## Final files

| File | Role | Dimensions | SHA-256 |
| --- | --- | ---: | --- |
| `lakeside-retreat-misty-dawn.jpg` | Scene A | 1280 × 720 RGB JPEG | `f8e526ddd14d19d7878ea1f5659fa488d4d81a9a42803b419d3b4c0e85d68a79` |
| `lakeside-retreat-golden-hour.jpg` | Scene B | 1280 × 720 RGB JPEG | `48ff42ae257a857a92abd15a1629c9f0929abb7467ac4a80cea635efc4c6b581` |
| `lakeside-retreat-depth-ordinal.svg` | Shared mask | 1280 × 720 SVG | `e4abd3963843068b3bc77005473f9096c99e35212157e024fda87babd3e1401e` |

The two JPEGs were resized from the reviewed 1672 × 941 built-in outputs with FFmpeg using aspect-preserving scale/crop and metadata removal. No Python image editing was used.

## Deterministic mask construction and validation

The mask was authored locally as SVG paths over the final 1280 × 720 composition; ImageGen was not used to create or infer it. Its four exact ordinal values are sky `32` (`#202020`), far `96` (`#606060`), middle `160` (`#a0a0a0`), and near `224` (`#e0e0e0`). The runtime rasterizes the SVG, converts antialiased edge values into normalized adjacent-band weights, and asserts:

- four band canvases exist and match the source dimensions;
- every band covers more than 5% of the frame;
- per-pixel band weights sum to one;
- known sky, mountain, water, and terrace samples resolve to four different ordinal bands.

The segmentation is deliberately ordinal rather than metric depth. It tracks the main sky, mountain/forest, water/retreat, and reeds/terrace regions at the two required display scales. The generated edit preserves macro geometry but fine fog, tree, reed, reflection, and mountain texture is not pixel-registered; the images must not be described as a scientific before/after pair.

## Scene A · complete ImageGen prompt

```text
Use case: photorealistic-natural
Asset type: aligned source photograph A for a 16:9 interactive depth-layer blur-dissolve compositor at 320×180
Primary request: Create one restrained photorealistic editorial landscape photograph of a remote lakeside retreat at cool misty dawn, deliberately composed into four unambiguous depth bands for later pixel masking.
Scene/backdrop: a quiet alpine lake seen from a fixed low terrace viewpoint; mist hangs over the far ridge.
Subject: foreground dark wet reeds and a rough stone terrace crossing the bottom quarter; middle-ground reflective water and one small glass-and-timber cabin on a peninsula; far-ground layered conifer ridge and mountain silhouette; open overcast sky above.
Style/medium: high-end natural travel and architecture photography, realistic optics, tactile material detail, no conceptual-art look.
Composition/framing: exact wide 16:9 landscape; strong, separable silhouettes between foreground reeds/stone, middle water/cabin, far ridge/mountains, and sky; keep the cabin near the right third; preserve useful detail across a center-safe 320x180 crop; no shallow depth of field.
Lighting/mood: cool pre-sunrise ambient light, gentle low mist, wet surfaces, quiet and believable.
Color palette: slate blue, charcoal, muted pine green, restrained warm interior cabin light.
Materials/textures: wet reed blades, coarse stone, glass, timber, rippled water, fine conifer texture.
Constraints: exactly one small cabin; no people; no animals; no vehicles; no boats; no text; no letters; no numbers; no logo; no watermark; no UI; no border. Every depth band must remain visually legible at thumbnail size. Straight horizon and cabin edges must provide blur references.
Avoid: fantasy landscape, surreal fog, dramatic advertising gloss, heavy bokeh, fisheye distortion, empty featureless foreground, overlapping foreground objects that obscure the cabin, extra buildings.
```

## Scene B · complete ImageGen edit prompt

```text
Use case: lighting-weather
Asset type: aligned source photograph B for the same 16:9 interactive depth-layer blur-dissolve compositor
Primary request: Edit the provided misty-dawn lakeside-retreat photograph into a restrained clear golden-hour state after rain.
Input images: Image 1 is the edit target and geometry reference.
Change only: weather, sky illumination, atmospheric visibility, water color/reflection, and natural light temperature; keep a subtle warm cabin interior.
Preserve exactly: camera position, focal length, framing, crop, mountain and ridge silhouettes, shoreline, peninsula, cabin architecture and position, every tree silhouette, foreground reeds, stone terrace geometry, horizon, object count, and the four depth-band boundaries.
Style/medium: photorealistic natural editorial travel and architecture photography, realistic optics and material texture.
Lighting/mood: late-afternoon sunlight breaking through after rain, clear but restrained, tactile wet stone, gentle warm directional light; far mountain visibly clearer than in the source.
Color palette: warm limestone-gray wet stone, deep teal lake, natural pine, pale gold light, blue-gray mountains.
Constraints: no new or removed objects; no people; no animals; no vehicles; no boats; no extra buildings; no text; no letters; no numbers; no logo; no watermark; no UI; no border.
Avoid: changing composition, moving or redesigning the cabin, changing tree positions, fantasy sunset, orange color cast, excessive bloom, heavy HDR, bokeh, fisheye distortion.
```
