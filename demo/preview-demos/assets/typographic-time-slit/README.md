# North Sea Review version proof

`north-sea-review-version-proof-v2.jpg` is the active fictional editorial proof generated with OpenAI ImageGen on 2026-07-21 for the `typographic-time-slit` demo. `north-sea-review-version-proof.jpg` is the preserved first-generation baseline and is not loaded at runtime.

- Generated source: 1536×1024 PNG, 2,107,188 bytes.
- Generated source SHA-256: `00e8416ca3948cf69d7ed5de07f0eba135b133c87963edc798ddd873ab2e6fc6`.
- ImageGen result identifier: `019f8410-0c38-7452-955f-71b72a06a23f/exec-575df915-82b6-4c3b-a058-e3cc36b134be.png`.
- Active derivative: 960×640 baseline RGB JPEG, 201,120 bytes.
- Active derivative SHA-256: `c198935149ddc604574425ab9c5934025e8495e6b96d663be8cbefdc7ec12bfa`.
- Preserved baseline: 960×640 JPEG, 205,508 bytes, SHA-256 `178791e71456f72bd2d7a64bdbf20fbccc359b8bbe2c021fb413ff1a84d36f26`.
- Subject: two flat, related editorial versions of the same fictional North Atlantic tidal research-station feature.
- Functional role: the demo decodes both proof panels, samples their real pixels, calculates per-cell change evidence and image-derived palettes, and uses that evidence to determine the visible review score and `PASS` / `REVIEW` result. The left proof supplies the base timeline; the horizontal p5 clip exposes the right proof.
- Reality note: the station, publication, versions, and review outcome are fictional. This image must not be described as a real location, publication, or audit result.

The v2 refinement narrows the semantic difference between the panels: it keeps the same fictional station, flatter panel geometry, matched image windows and closer subject scale while reserving the strongest differences for draft/release color, contrast, sea texture and editorial furniture. Large crop-safe shapes remain readable at 320×180 and 144×81. Interface labels are rendered by the demo rather than baked into the raster.

## Complete v2 edit prompt

```text
Use case: precise-object-edit
Asset type: functional two-version editorial proof raster for a p5.js time-slit comparison
Primary request: Refine the provided side-by-side fictional North Sea editorial proof so the left draft and right release use the exact same camera position, horizon, offshore station geometry, subject scale, and image crop. The two panels must register spatially when cropped and overlaid: every major building edge, platform leg, bridge, horizon line, and sea boundary should align. Preserve the existing two-panel flat proof-sheet composition, registration marks, safe margins, and overall visual language.
Change only the version treatment: left remains muted blue-gray draft with quieter contrast; right becomes the accepted cyan-and-rust release with stronger tonal separation and a refined lower information block. Keep meaningful pixel differences in sky, sea, shadows, color grade, and editorial bars so image-derived comparison yields multiple changed regions.
Constraints: same fictional structure and exact aligned geometry in both panels; no perspective mockup; no people, brands, logos, watermark, signatures, legible generated words, pseudo-text, location names, UI overlays, arrows, or glowing effects. Keep large crop-safe image areas and sufficient color/texture diversity for 72×72 sampling. Preserve 3:2 landscape aspect ratio.
```

The built-in ImageGen tool produced the 1536×1024 PNG. The project derivative was created without compositing or subject edits:

```text
sips -z 640 960 -s format jpeg -s formatOptions 88 <generated.png> --out north-sea-review-version-proof-v2.jpg
```

The generated PNG remains in the ImageGen store; the compressed project derivative is the exact runtime input. The committed JPEG SHA-256 is the portable identity assertion. Browser-decoded comparison pixels use conservative diversity, delta, changed-region and topology ranges instead of an exact renderer-dependent sampled-pixel hash.
