# Registration proof sheet asset

`registration-proof-sheet.jpg` is a fictional, project-local functional source plate for the human-operated `stencil-text-scanline-window` print-inspection demo.

## File identity

- Generator: built-in ImageGen tool (`gpt-image-2` path), generated 2026-07-21.
- Final project asset: `960 × 640` JPEG, `246388` encoded bytes.
- Exact committed-file SHA-256: `36471dadbf8888ddf16ae2b68156b39e587f3a4bb323f76f9b8456903c42a7e4`.
- Original generated source: `1536 × 1024` PNG; locally downsampled to the committed JPEG at quality 88.
- Real brands, products, people, logos, source photographs, and live production claims: none. This is a fictional inspection specimen.

## ImageGen prompt

Use case: `product-mockup`

Asset type: functional raster input for an interactive web demo about screen-print registration inspection.

Primary request: create a fictional four-ink screen-print production proof photographed or scanned perfectly straight-on, designed as a real prepress inspection specimen whose pixels can be sampled by software.

Scene/backdrop: one warm uncoated off-white proof sheet filling the entire landscape frame edge to edge, with no desk, hands, or surrounding objects.

Subject: bold full-bleed abstract stencil composition with large contiguous fields of cyan/teal, vermilion red, golden yellow, deep cobalt, and carbon black; several high-contrast black/white calibration wedges, registration crosses, halftone rosettes, thin geometric rules, and exactly four visually distinct small misregistration target areas where colored ink edges are intentionally offset into visible fringes.

Style/medium: premium editorial print-production photograph or high-resolution flatbed scan, with realistic paper fibers, ink gain, subtle screen-print grain, and crisp but tactile edges.

Composition/framing: 3:2 landscape, orthographic top-down, graphic evidence distributed across the whole frame with meaningful detail in all four quarters; broad color regions large enough for reliable pixel sampling after downscaling.

Lighting/mood: even neutral diffuse scan lighting, with no dramatic shadows or glare.

Constraints: fictional generic production proof; no brands, logos, readable words, numbers, signatures, watermark, mockup perspective, hands, desk, UI, or decorative gradients; preserve clear local color separations and visible registration imperfections.

## Functional binding

This bitmap is not a decorative background. At runtime the browser:

1. fetches this exact same-origin JPEG and verifies its encoded byte SHA-256;
2. decodes it with `HTMLImageElement.decode()` and reads every pixel in a `192 × 128` analysis canvas;
3. classifies the sampled pixels into paper, black, cyan, red, yellow, blue, and residual ink categories;
4. derives the live CSS palette from the category means;
5. derives a local edge-risk field from neighboring RGB differences;
6. finds four separated high-diversity registration targets from real category transitions and edge energy;
7. uses the pixel below the human-controlled scan probe for ink, coverage, and risk readouts;
8. computes the final press disposition from the four detected target severities.

The same image is visible full-stage and is clipped through the moving `REGISTER` stencil. Replacing the asset changes the visible print, the CSS palette, target positions, live metrics, and the evaluation result.

The encoded source-file SHA is the stable cross-platform identity assertion. The runtime also records a SHA-256 and FNV-style checksum for the browser-decoded `192 × 128` pixel bytes, but intentionally gates those derived values only as non-zero evidence plus robust topology, range, and category conditions because JPEG decode and canvas resizing can differ across graphics stacks.

## Chromium QA reference

The source-only QA run in Chromium/SwiftShader produced the following diagnostic reference values. They are recorded for auditability, not used as exact cross-platform runtime gates:

- Downsampled pixel SHA-256: `2e678c2daa553b337b16d1f65540c248fa52a4342796169196bdaa1c5f820c83`
- FNV-style pixel checksum: `9f42e6f7`
- Distinct 5-bit quantized colors: `1048`
- Luma range: `238.8596`
- Edge-response range: `0.85082`
- Category counts `[paper, black, cyan, red, yellow, blue, neutral]`: `[6261, 3987, 3582, 5246, 2263, 2280, 957]`
- Detected target sample coordinates: `(101,115)`, `(77,21)`, `(183,63)`, `(17,63)`
- Pixel-derived global defect severity: `88.41325 / 100`
- Pixel-derived source disposition: `hold`
