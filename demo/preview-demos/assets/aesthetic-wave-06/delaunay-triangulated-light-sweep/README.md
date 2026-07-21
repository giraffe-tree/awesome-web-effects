# `delaunay-triangulated-light-sweep` image asset

## Disclosure and intended use

`composite-laminate-inspection.jpg` is an original, AI-generated fictional material-inspection photograph created with Codex's built-in ImageGen tool on 2026-07-21. It does not depict a real manufacturer, production coupon, test result, facility, or certified defect diagnosis. No outside photograph was used as an input or edit target.

The image is functional input to the Demo rather than decorative scenery. The browser fetches and SHA-verifies the committed JPEG, p5.js decodes its full RGBA pixel buffer, and a 96×54 crop sample drives Delaunay vertex offsets, anomaly-seed insertion, per-face material color, edge strength, void/delamination signal, and the live inspection classification.

## Complete generation prompt

```text
Use case: photorealistic-natural
Asset type: functional source image for an interactive Delaunay triangulated industrial material-inspection demo
Primary request: create a high-resolution macro inspection photograph of a fictional carbon-fiber composite laminate coupon under oblique polarized laboratory light, showing a sophisticated but physically plausible material surface with woven fibers, resin-rich translucent regions, a few tiny circular voids, and one subtle diagonal delamination seam that a light sweep could reveal
Scene/backdrop: the composite inspection coupon fills the entire frame edge-to-edge; no table, no tools, no people
Subject: charcoal graphite woven laminate with nuanced blue-black and bronze reflections; distributed micro-texture and locally distinct defect zones across the whole image so real pixel sampling can drive triangulation density and anomaly classification
Style/medium: premium editorial industrial macro photography, realistic optics, crisp material texture, credible nondestructive-testing imagery, not an illustration
Composition/framing: wide 3:2 landscape, surface fills frame, defect seam runs diagonally from lower-left quadrant toward upper-right, several small voids dispersed away from the seam, enough variation at left/center/right for pixel algorithms
Lighting/mood: directional grazing light with a cool cyan inspection beam and restrained warm copper specular highlights, dark but readable, high local contrast without crushed blacks
Color palette: graphite black, blue-black, muted cyan, restrained copper/amber highlights
Materials/textures: carbon weave, translucent resin, micro-scratches, pinhole voids, subtle delamination edge
Constraints: no text, no labels, no UI, no logos, no watermark, no hands, no machinery, no fake scanning graphics; must remain readable when cropped to 320x180; the image will be downscaled and sampled by code to determine vertices, triangle colors, and defect evidence
Avoid: sci-fi holograms, neon grids, fantasy crystals, excessive bloom, generic abstract wallpaper, perfectly repetitive texture
```

## Source and derived file record

- Built-in ImageGen source: PNG, 1536×1024, RGB, SHA-256 `afcf4e7336ec5a3ebddaee8dc73bff513ffdae14db4d6736dafdd7b25bcfe1c3`.
- Committed derivative: `composite-laminate-inspection.jpg`, JPEG, 960×640, 353,080 bytes (345 KiB), SHA-256 `7836b637c6d44e631e61b15bf99afb0d70c67a3075b82d3eb3bc40f596c7a837`.
- Conversion: macOS `sips -s format jpeg -s formatOptions 88 --resampleWidth 960 <generated-png> --out composite-laminate-inspection.jpg`; aspect ratio remained 3:2 and no crop, compositing, retouching, text, or overlays were added.
- Runtime crop: p5.js reads source rectangle `(0, 50, 960, 540)` and downsamples it to 96×54 for algorithmic evidence while the uncropped derivative remains the committed source asset.
