# Northline depth atlas

- File: `northline-depth-atlas.jpg`
- Dimensions: 960 × 640
- Bytes: 311,455
- SHA-256: `a64e63a15681acf9651f7905b54775cf70ef0a0f2e1cbabcc93c43e3b3608169`
- Generated: 2026-07-21 with the built-in OpenAI ImageGen tool.
- Use: fictional Northline underground-facility cutaway created specifically for `accordion-depth-tunnel-navigation`.

## Functional role

This is not a decorative background. The browser fetches the committed JPEG from the preview origin, checks the exact source-byte SHA-256, decodes it, downsamples it to a 96 × 64 canvas, and reads five deliberately separated horizontal strata. Per-stratum mean colour, luminance variance, warmth, moisture proxy, texture proxy and depth pressure produce the displayed risk score. The highest pixel-derived score becomes the live `TARGET` destination. The same source file is then bound to every accordion panel and its sampled mean colours become the panel/evidence accents.

The derived canvas-pixel SHA-256 is retained as evidence that pixels were read, but is intentionally validated only as a non-zero 64-character digest. JPEG decode and canvas scaling can differ by a few values across browser and GPU paths, so portable QA relies on robust luminance/risk ranges, five non-empty bands, colour diversity and source-byte identity instead of an exact derived digest.

## Generation prompt

> Create a photorealistic editorial cutaway photograph of a fictional underground civil-infrastructure archive and utility tunnel for browser pixel sampling. Show five clearly separated horizontal depth strata: a warm dry intake concourse, a cool blue records vault, an amber cable service gallery, a dark damp pump chamber, and a deep red-orange geothermal inspection chamber. Use straight-on architectural-model composition, realistic concrete, metal, pipes, shelves, water and heat-stained steel. Keep all five bands visually distinct at thumbnail size. No readable text, logos, people, border, UI overlay or watermark.

The generated 1536 × 1024 PNG was converted locally to a 960 × 640 quality-90 JPEG. The committed JPEG above is the runtime source of truth.
