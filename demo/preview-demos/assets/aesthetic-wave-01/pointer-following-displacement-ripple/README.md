# Pointer-following displacement ripple · raster source

- Generated: 2026-07-21
- Generator: built-in `image_gen`
- File: `coastal-pavilion-displacement-source.jpg`
- Dimensions: 1280 × 720 RGB JPEG, locally resized from the generated source at quality 88
- Intended use: local `regl.texture` input for `pointer-following-displacement-ripple`; the tile grid, mullions, glass blocks, pool edges, horizon, and reflections provide visible geometry for UV displacement, refraction, expansion, and elastic recovery.
- Provenance note: this is an AI-generated fictional architecture visualization, not a documentary photograph, verified building, real project, or factual depiction of a specific location. It must not be presented as evidence of an existing property or credited to a real architect.
- Publishing note: no text, logo, signage, watermark, people, or remote runtime dependency is embedded in the asset.

## Final prompt

```text
Use case: photorealistic-natural
Asset type: 16:9 source photograph for an interactive WebGL pointer-following displacement-ripple demo in an architecture and travel project archive
Primary request: Create one photorealistic editorial photograph of a serene modernist coastal swimming pavilion, designed so localized image-coordinate distortion is immediately visible when a circular ripple passes over it.
Scene/backdrop: A long tiled reflecting pool beside a low pale-stone pavilion, slim dark window mullions, a glass-block screen, calm sea horizon beyond, no people.
Style/medium: High-end contemporary architecture photography, natural material texture, realistic optics, restrained editorial finish.
Composition/framing: Wide 16:9 landscape; strong perspective lines run across the frame; distribute crisp tile grids, pool waterline, repeated vertical mullions, glass-block pattern, stone edges, and soft reflections across foreground, center, and background; keep important architecture inside a center-safe 320x180 crop.
Lighting/mood: Clear late-afternoon side light, quiet and tactile, warm limestone balanced by deep teal water and pale blue sky.
Constraints: The scene must remain visually legible at thumbnail size; include enough straight edges and repeating fine detail to reveal warping, displacement, refraction, and recovery. No text, no letters, no signage, no logo, no watermark, no UI, no decorative border.
Avoid: people, vehicles, branded objects, surreal warped architecture, fisheye distortion, excessive bloom, heavy depth of field, painterly rendering, empty featureless sky or walls.
```

## Mechanism role

This image is not a decorative layer. The fragment shader samples it directly and offsets its UV coordinates around the latest real pointer, touch, or keyboard event. Removing the image removes the straight and repeated reference geometry needed to see the displacement and recovery mechanism.
