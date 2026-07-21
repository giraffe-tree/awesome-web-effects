# Magnetic pixel-sort field asset

`archive-spectrum-scan.jpg` is a project-specific ImageGen source image for `magnetic-pixel-sort-field`.

## Generation record

- Generated: 2026-07-21 (Asia/Shanghai)
- Tool: built-in OpenAI ImageGen
- Use case: `photorealistic-natural`
- Original built-in output: 1536×1024 PNG
- Committed derivative: 960×640 JPEG, converted locally at quality 87
- File size: 269655 bytes
- SHA-256: `b8b8d852b997df2fca2fb6d0dda7b561c3eca97599d55c09195e6723062c5275`
- Factual status: generated editorial still life, not a photograph of a real archive, artwork, institution, or preservation record

## Functional role

The bitmap is algorithmic evidence, not a decorative background. At runtime the demo:

1. fetches the exact same-origin JPEG and verifies its byte SHA-256;
2. decodes both a browser `Image` and a real `p5.Image`;
3. crops the source to 960×540 and samples it to a 160×90 RGBA field;
4. derives luminance spread, saturation, directional edge energy, five hue clusters, the recommended sort axis, the sort key, and a media-quality conclusion from those sampled pixels;
5. uses the sampled RGB values themselves as the visible pixel-sort material under human hover, captured drag, touch, pen, keyboard, range, and button input.

If this file changes, update the exact SHA in the source and re-run the pixel-evidence checks. Do not replace it with a remote URL or a synthetic fallback.

## Final prompt

```text
Use case: photorealistic-natural
Asset type: functional source image for an interactive p5.js magnetic pixel-sorting demo
Primary request: an overhead editorial photograph of a contemporary color-archive scanning table used to inspect damaged media, with one large abstract analog print composed of broad cobalt blue, vermilion red, amber yellow, bone white, charcoal black, and teal pigment fields; include a few translucent color film strips and small brushed-metal registration tabs around the print, arranged like a real preservation workbench
Scene/backdrop: matte near-black scanner bed and dark graphite tabletop, no room visible
Subject: the large abstract pigment print must occupy most of the frame and have strong vertical and diagonal boundaries, rich color clusters, varied luminance, fine paper grain, and several deliberately streaked ink regions that will produce visually meaningful pixel sorting
Style/medium: photorealistic high-end editorial still-life photography, realistic paper fibers, pigment bloom, translucent film, subtle metal texture
Composition/framing: strict overhead landscape composition, 3:2 ratio, central print fills roughly 78% of frame, strong large-scale shapes remain recognizable at thumbnail size, balanced edge padding
Lighting/mood: soft directional museum conservation light, controlled reflections, deep but readable shadows, precise and calm
Color palette: cobalt, vermilion, amber, bone, charcoal, teal with strong contrast and separated hue families
Constraints: no people, no hands, no readable text, no letters, no numbers, no logos, no watermark, no screen UI, no brand marks; avoid tiny clutter; avoid fake labels; all physical geometry and reflections must be plausible
Output intent: a project-local same-origin JPEG whose decoded RGB pixels will be hashed, sampled, clustered, and physically rearranged in-browser; make the pixel distribution genuinely useful for hue clustering and axis inference
```

Visual QA checked the generated image and the committed JPEG at full resolution: no readable text, logo, watermark, malformed hands, or implausible primary geometry is present; the broad color boundaries remain legible at preview scale.
