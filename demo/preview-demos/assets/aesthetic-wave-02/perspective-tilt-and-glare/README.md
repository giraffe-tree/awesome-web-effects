# Perspective Tilt and Glare — Observatory Field-pass Artwork

## Asset record

- Generated: 2026-07-21
- Generator: built-in `image_gen`
- File: `observatory-field-pass-artwork.jpg`
- Original generated source: 1586 × 992 RGB PNG
- Final local asset: 1280 × 800 (8:5) baseline RGB JPEG, 116,879 bytes
- SHA-256: `73451f04829c2505e9b4173bfd93a790f1c799f2120d952aa3dfd1e172ea1802`
- Intended use: the flat printed artwork layer beneath code-generated event-pass typography, depth layers, foil treatment, pointer perspective and moving glare

## Fictional-content declaration

This is an AI-generated, entirely fictional high-desert observatory and landscape. It is not documentary photography and does not depict an identifiable observatory, scientific facility, event, brand, landmark, client or location. The artwork contains no people, vehicles, text, letters, numbers, signage, logos, watermark, UI or branded elements.

## Processing

The built-in generator produced a 1586 × 992 RGB PNG, already very close to the requested 8:5 aspect ratio. The source was center-cropped by one pixel on each outer edge to 1584 × 990 (exactly 8:5), scaled to 1280 × 800 with ffmpeg, encoded as a baseline RGB JPEG with `-q:v 3`, and stripped of metadata with `-map_metadata -1`. No retouching, perspective transform, glare, foil, border, card shape or UI was added.

## Final prompt

```text
Use case: photorealistic-natural
Asset type: flat landscape artwork source for the front face of an interactive premium event pass with pointer-driven perspective tilt and glare
Primary request: create one photorealistic editorial night photograph of an entirely fictional high-desert observatory, designed as the image layer beneath code-generated event-pass typography, microprinting, foil, and moving glare
Scene/backdrop: a low dark-stone observatory pavilion on a quiet mineral plateau, one small silver dome and a narrow warm-lit entrance on the right third, distant layered desert ridges, clear indigo night sky with a restrained field of stars
Style/medium: refined contemporary architecture and astronomy editorial photography, realistic optics and material texture, subtle fine grain, tactile and premium rather than glossy advertising CGI
Composition/framing: wide 8:5 landscape; observatory and dome contained in the right 45 percent; calm darker negative space across the left 42 percent for HTML title and pass metadata; horizon near the lower third; all important features inside the central 88 percent for rounded-card cropping
Lighting/mood: deep blue-hour starlight, faint cool rim on the dome, one restrained amber doorway glow, quiet anticipation and scientific curiosity
Color palette: midnight indigo, charcoal stone, dusty mauve ridges, silver dome, restrained amber accent
Materials/textures: matte dark stone, brushed metal dome, dry mineral ground, natural atmospheric haze
Constraints: this is only the flat printed artwork layer; no card shape; no rounded border; no perspective view; no baked glare; no holographic flare; no foil; no UI; no text; no letters; no numbers; no logo; no watermark; no signage; no people; no vehicles; no famous landmark; no identifiable real observatory or event
Avoid: Milky Way spectacle, giant moon, fantasy planets, aurora, neon cyberpunk lighting, excessive bloom, surreal architecture, fisheye distortion, empty featureless gradients, painterly rendering, postcard saturation
```

## Material-mechanism role

The photograph deliberately combines materially different surfaces: matte dark stone, a brushed silver dome, rough mineral ground, hazy mauve ridges and a small amber opening. Those surfaces give a future pointer-driven glare layer meaningful contrast—the same moving highlight can remain soft over stone, tighten over metal and pass quietly across sky—while the generated artwork itself stays perfectly flat. Perspective, parallax, foil, specular glare and card-edge depth must remain code-generated; baking them into this file would invalidate the mechanism.

## Visual verification

- Full 1280 × 800 artwork: passed. Observatory, dome and warm entrance stay in the right portion; the left field remains dark, quiet and usable for HTML copy. No card border, perspective skew or baked glare is present.
- 144 × 81 center-crop check: passed. The silver dome and amber doorway remain visible at catalog size, while the left negative space survives.
- 720 × 405 center-crop check: passed. Stone, metal, mineral ground, distant ridges and stars remain legible; the central safe crop does not cut the observatory.

The two 16:9 QA derivatives were temporary inspection files only and are not project assets.
