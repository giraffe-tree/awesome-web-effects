# Harbor Hall seat inventory proofboard

`harbor-hall-seat-inventory.jpg` is a fictional, project-local functional bitmap generated with the built-in ImageGen tool on 2026-07-21 and converted to a browser-friendly JPEG for the `spring-loaded-split-flap-counter` demo.

## File identity

- Dimensions: `960 × 640`
- Encoded bytes: `376201`
- MIME type: `image/jpeg`
- SHA-256: `3d9b707b5729214ce8283a62ee67fea4ea536f95f03ca3a44d3a52cc4dbd1edf`
- External brands, people, logos, and source photographs: none

The browser fetches this exact file, verifies its encoded byte SHA-256, decodes it with `HTMLImageElement.decode()`, draws it to a `96 × 64` analysis canvas, and reads all `6144` RGBA pixels. The analyzed colors are not decorative: their category counts determine the verified seat ceiling, their category means set the split-flap face and ink material, and the pixel below the user's inspection cursor sets the visible zone status and counter accent.

## ImageGen prompt

Use case: `productivity-visual`

Asset type: functional bitmap source for an interactive web demo about live venue ticket inventory.

Primary request: create a polished, fictional concert hall seat-inventory proofboard shown straight-on, with a dark graphite background and a clear symmetrical auditorium plan. Include five large, visually separated seating zones made from dense tiny seat dots and curved aisle bands: warm amber premium zone at bottom center, coral/red limited-availability zones on lower left and lower right, desaturated teal available zones on upper left and upper right, and a small mint-green central release zone. The colored zone coverage must be broad and saturated enough for JavaScript pixel sampling to classify availability by hue and luminance after downscaling. Add subtle cream grid lines, ticket perforation texture, and tactile paper/metal grain. Leave a clean dark margin around all edges for reliable cropping.

Scene/backdrop: museum-quality transport/venue operations evidence board, photographed or rendered orthographically with no perspective distortion.

Style/medium: premium editorial infographic-like bitmap, realistic screenprint texture, Swiss wayfinding clarity, restrained retro-futurist design.

Composition/framing: exact 3:2 landscape, centered seating plan, symmetrical, five large color-coded zones, no tiny critical detail at edges.

Lighting/mood: evenly lit, high contrast, calm operational confidence.

Color palette: charcoal `#171914`, cream `#e9dfc6`, amber `#e3a44c`, coral `#c95f51`, teal `#3f817c`, mint `#8bc7a5`.

Constraints: no logos, no brands, no people, no watermark, no readable words, no numbers, no UI chrome, no gradients over the color-coded zones; the bitmap will be decoded in browser and its pixels will drive real seat-state thresholds and split-flap material colors.

Avoid: maps, photographs of people, illegible generated typography, labels, noisy rainbow colors, low contrast, perspective angle, fake app mockup.

## Pixel QA reference

The source QA run in Chromium/SwiftShader produced:

- Downsampled pixel SHA-256: `96b9f9a4df7f5c4da2c87b6f2e7715b9bdc2095323261ecce729969fef6d3a01`
- FNV-style pixel checksum: `61bae33d`
- Distinct quantized colors: `173`
- Luma range: `81.8356`
- Robust category counts: teal `971`, mint `144`, amber `649`, coral `768`, neutral `3612`
- Pixel-derived verified seat ceiling: `370`

Decoded/resized pixel bytes can vary across browser, graphics, and color-management paths. Runtime validation therefore treats the derived digests as nonzero evidence of a real readback and gates on broad hue/luma/category ranges. Only the encoded source file SHA-256 is an exact cross-platform identity assertion.

## Usage

This asset is generated specifically for this repository's fictional Harbor Hall demo and may be redistributed with the demo. It is not evidence for a real venue or live ticket feed.
