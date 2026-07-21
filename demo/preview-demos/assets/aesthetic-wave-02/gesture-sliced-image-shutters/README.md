# Gesture-sliced Image Shutters — Functional North Quay Gate Inspection

## Asset record

- Generated: 2026-07-21
- Generator: built-in `image_gen`
- File: `north-quay-gate-inspection.jpg`
- Original generated source: 1536 × 1024 RGB PNG
- Final local asset: 960 × 640 (3:2) RGB JPEG, 316,760 bytes
- SHA-256: `fd7fae2dc69bf2488bf1ffdce5784093380ad889b29430cee7d15100cc28bdb1`
- Intended use: exact browser-decoded pixels are divided into eight vertical gate-bay bands and determine each Motion shutter's evidence class, risk, displacement weight, critical bay, and final human-revealed disposition

## Fictional-content declaration

This is an AI-generated, entirely fictional North Quay storm-surge barrier. It is not documentary photography and does not identify a real port, civil structure, operator, inspection record, incident, campaign, or client. The image contains no readable text, numbers, signage, people, logos, trademarks, watermark, UI, diagram overlay, border, or baked-in shutter effect.

## Processing

The built-in generator produced a 1536 × 1024 RGB PNG. The final project asset was locally resized with macOS `sips` to 960 × 640 and encoded as JPEG at quality 88. No compositing, repainting, textual annotation, independently generated shutter, or evidence overlay was added. The committed JPEG is fetched as exact bytes in the browser, verified by SHA-256, decoded, resized to a 96 × 64 readback canvas, and classified per bay. The derived pixel digest is recorded at runtime but is not compared to a fixed cross-renderer constant because JPEG decode and canvas resize can vary slightly across browser and GPU pipelines.

## Final prompt

```text
Use case: photorealistic-natural
Asset type: functional source photograph for an interactive browser demo that analyzes exact image pixels
Primary request: create a fictional coastal flood-barrier field inspection photograph showing one continuous North Quay storm-gate structure divided into exactly eight clearly legible vertical gate bays. The eight bays must remain part of one coherent scene but have meaningfully different local evidence: restrained teal protective paint, warm orange-brown corrosion, pale mineral salt deposits, dark wet waterline stains, and concrete gray in varied amounts from bay to bay. These real pixel differences will be sampled by code to determine eight shutter weights and an operational review status.
Scene/backdrop: utilitarian coastal storm-surge barrier at low tide, sea channel and weathered service deck, entirely fictional and unbranded
Subject: frontal elevated inspection view of eight tall adjacent sluice-gate bays with strong vertical divisions, structural continuity across the whole frame, visible waterline and believable maintenance wear
Style/medium: photorealistic editorial industrial field photography, crisp material detail, subtle natural sensor grain, not an illustration and not a UI mockup
Composition/framing: landscape 3:2, nearly orthographic frontal/elevated view; the barrier spans edge to edge; exactly eight equal-ish vertical bays are easy to segment; keep key evidence away from the outer crop edges; no people needed
Lighting/mood: overcast coastal daylight with controlled contrast, serious but calm operations-documentation mood
Color palette: deep blue-black water, weathered concrete, desaturated teal coatings, localized orange corrosion, pale salt bloom; ensure each evidence color occupies substantial pixel areas rather than tiny accents
Materials/textures: damp concrete pores, rust streaks, peeling marine paint, salt crust, steel seams, tidal water
Constraints: exactly eight visible vertical gate bays; one continuous coherent photograph; strong readable vertical bay boundaries; realistic operational evidence; no readable text, numbers, labels, logos, trademarks, flags, UI, diagram overlays, borders, watermark, split-screen, collage, fantasy architecture, vehicles, dramatic fire, disaster scene, or decorative color swatches. The eight bays must not be identical or repetitive clones.
```

## Functional pixel roles

The browser reads all 6,144 pixels in a 96 × 64 sample and assigns every pixel to protected coating, corrosion, salt bloom, waterline, or balanced surface. Each of the eight 12 × 64 source bands produces its own evidence counts, luma, contrast, checksum, risk score, displacement weight, and evidence class. These results create eight paused Motion controllers and determine the critical bay shown after the user separates the shutters. No color, status, risk, shutter profile, or final bay result is inferred from this README or from the generation prompt.

## Visual verification

- 720 × 405 passed in real headless Chrome: the full operations workspace, continuous eight-bay proof, separated shutters, inspected-bay marker, evidence readout, and controls remain legible.
- 320 × 180 passed with a real CDP touch stream: the proof remains the dominant visual, and the narrow evidence panel and human controls stay usable.
- 144 × 81 passed with a real CDP pen stream plus keyboard reset: the proof expands to full content width; the eight-shutter rhythm, selected-bay marker, separation amount, and reversible controls remain recognizable.
- QA screenshots are temporary evidence at `/private/tmp/gesture-shutters-{720,320,144}-*.png`; they are not runtime assets and are not required for the Demo to load.
