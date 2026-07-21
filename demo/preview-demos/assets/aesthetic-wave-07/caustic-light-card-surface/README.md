# Caustic light card surface asset

`aquatic-material-calibration.jpg` is a project-local, AI-generated functional source plate for the human-operated aquatic material inspection demo.

- Generator: built-in `imagegen` tool (`gpt-image-2` path), generated 2026-07-21.
- Final project asset: 960 × 640 JPEG, 277,104 bytes.
- Exact committed-file SHA-256: `72850e8dad0c1c0f34b2f2b3eafef430c24cbe5bddc5aa88434a0e2371ed967c`.
- Original generated source: 1536 × 1024 PNG; locally downsampled to the committed 960 × 640 JPEG at quality 90.
- Prompt summary: a photorealistic orthographic aquatic-club calibration card beneath shallow clear water, with five large and separable glass, limestone, ceramic, rubber, and brushed-metal regions plus a pearl optical target; no people, logos, legible text, or watermark.

## Functional binding

This bitmap is not a decorative background. The browser fetches it from the same origin, verifies the exact file-byte SHA-256, decodes it through both `Image.decode()` and p5.js, and reads a 96 × 54 crop-derived pixel field. Each sampled pixel contributes:

- luminance for the local refractive-index adjustment;
- neighboring luminance gradients for surface roughness and caustic-line displacement;
- chroma for caustic response gain;
- a pixel-derived material class for the live surface, IOR, and scatter readouts.

The same decoded p5 image is also the visible plate and the locally displaced image inside the human-positioned inspection lens. Removing or replacing this asset therefore changes both the evidence and the optical behavior.

The committed source-file SHA is the stable identity gate. The browser records a SHA-256 for the p5-decoded and resized 96 × 54 pixel bytes, but intentionally validates only a 64-character non-zero digest plus robust color, luminance, roughness, response, and material-topology ranges. JPEG decode and canvas/p5 resize bytes can differ across browser renderers and operating systems.
