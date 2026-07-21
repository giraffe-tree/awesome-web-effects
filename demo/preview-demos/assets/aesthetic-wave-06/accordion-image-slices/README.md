# Accordion Image Slices — local image asset

## Asset record

- File: `tidal-gallery-proof.jpg`
- Dimensions: `960 × 640`
- Format: JPEG, converted from the generated PNG at quality 88 with macOS `sips`
- SHA-256: `220ad04c64ee1b8d8266e62aa93c16819406d7082956595f4fce6fffb34be0b5`
- Generated: 2026-07-21 (Asia/Shanghai)
- Generator: OpenAI built-in ImageGen tool (default built-in mode)
- Built-in output record: `exec-4afdeb4e-b752-42a9-a269-41b60b94dc30.png` (`1536 × 1024` PNG)
- Input images: none
- Intended use: the single continuous raster source sampled into nine vertical panels by `accordion-image-slices`

## Full generation prompt

```text
Use case: photorealistic-natural
Asset type: continuous panoramic fine-art photograph for an interactive museum accordion-slice inspection demo
Primary request: create one wide editorial architectural photograph of a quiet coastal modernist gallery pavilion at blue hour, seen straight-on across a tidal wetland; a single continuous scene with strong large-scale visual landmarks that remain recognizable when cut into nine vertical slices
Scene/backdrop: low dark wetland grasses and reflective tidal water in the foreground, a long pale concrete pavilion crossing the middle, deep indigo sea and hazy cliffs behind it
Subject: the pavilion has one large warm amber illuminated rectangular exhibition room slightly right of center and a smaller cobalt-blue recess on the left, creating clear anchors across the panorama
Style/medium: photorealistic fine-art architecture photography, restrained contemporary editorial art direction, natural material texture, plausible construction and reflections
Composition/framing: wide 3:2 landscape, camera level and orthographic-feeling, horizon in upper third, uninterrupted image from left edge to right edge, important details distributed across the full width, no extreme edge-dependent subject, suitable for center-crop to 960×640 and for vertical accordion slicing
Lighting/mood: calm blue hour, cool slate and indigo environment, warm amber interior glow, subtle soft atmospheric depth, not glossy CGI
Color palette: bone concrete, deep indigo, muted teal, warm amber; high enough tonal separation for a 144×81 thumbnail
Constraints: one continuous photograph; no collage, no split panels, no frames, no people, no vehicles, no words, no signage, no logos, no watermark; architecture and reflections must be physically plausible; avoid repetitive window patterns; avoid fake text and decorative graphic overlays
Avoid: surreal geometry, floating structures, heavy fog, crushed blacks, neon cyberpunk, excessive bloom, shallow depth of field, centered symmetry, visible brands
```

## AI disclosure and visual review

This is an AI-generated fictional architectural scene, not documentary evidence of a real pavilion, exhibition, artist, or location. The final local JPEG was visually inspected after conversion: it contains no visible text, logo, watermark, people, vehicles, or obvious disconnected structure; the cobalt doorway, amber room, pale concrete band, and tidal reflection remain legible when reduced to the catalog thumbnail scale. Runtime code fetches and decodes this exact file, verifies its recorded SHA-256, samples its pixels, and draws those pixels into the p5 canvas; it does not reconstruct the image from prompt-derived colors.
