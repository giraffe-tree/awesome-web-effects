# North Atlantic observation plate

`north-atlantic-observation-plate.jpg` is a project-owned, fictional night-field observation plate generated for the `cursor-drawn-constellation-thread` demo. It is functional evidence, not a decorative backdrop: the browser fetches the committed JPEG from the demo origin, verifies its file digest, decodes it with the browser and p5, samples a 160×90 crop, identifies local luminance maxima, and derives the only 18 connectable stars plus the six-fix route and confidence values from those pixels.

## Generation record

- Tool: Codex built-in ImageGen (`image_gen`), generated 2026-07-21.
- Use-case taxonomy: `scientific-educational`.
- Original generated artifact: `exec-9e226a4e-3732-486b-9789-0106feba0951.png` (1536×1024).
- Project transform: exported with macOS `sips` as a 960×640 JPEG at quality 88. No compositing, repainting, labels, or subject replacement was applied.
- Committed source SHA-256: `f4b2f9f14bb24fca891ca88dbc385f06d2f803516095956f6d7afb58bd596e2d`.
- Committed size: 960×640, 178,986 bytes.
- Rights basis: original synthetic image generated for this repository; no third-party source photograph is embedded.

## Final prompt

> Use case: scientific-educational. Asset type: browser-based interactive night navigation observation plate; functional pixel-sampling source. Create a realistic long-exposure field photograph from a fictional remote North Atlantic coastal observation station, looking across a dark rocky headland and calm sea toward a crystal-clear star field. The upper 80% must contain many discrete, small, high-contrast stars with varied brightness and several recognizable loose chains, while remaining natural and scientifically plausible; the lower 20% should be a nearly-black coastal horizon with a tiny warm amber instrument shelter at far left. Add a subtle blue-green atmospheric glow near the horizon and a faint Milky Way dust band, but preserve clean dark negative space between stars so local-brightness peak detection can reliably isolate individual points. Photorealistic documentary astrophotography, fine natural film grain, high dynamic range without clipped bloom. Wide landscape, horizon low, no fisheye distortion, no foreground people, no centered hero object. Deep navy moonless night, quiet and operational, sparse amber shelter light. No text, labels, drawn constellation lines, UI, border, or watermark; stars must be crisp point sources, not streaks. Avoid fantasy planets, aurora curtains, star trails, oversized sparkling stars, visible logos, and typography.

## Portability note

The committed JPEG byte digest is an exact identity check. The p5-decoded, resized 160×90 pixel digest is recorded at runtime only as decode evidence; JPEG decoding and resize rounding may vary across browser/GPU pipelines, so release validation should require a 64-character nonzero digest plus robust candidate-count, confidence-range, ordering, and topology invariants rather than one cross-platform derived digest.
