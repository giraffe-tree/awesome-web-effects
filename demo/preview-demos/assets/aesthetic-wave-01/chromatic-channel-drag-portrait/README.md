# Chromatic Channel Drag Portrait · Press Registration Source

- Generated: 2026-07-21
- Generator: built-in `image_gen` (`gpt-image-2` default tool path)
- File used by the demo: `press-registration-portrait.jpg`
- Generated master: 1536 × 1024 PNG
- Local output: 960 × 640 RGB JPEG, resized with macOS `sips` and encoded at JPEG quality 88
- Local byte length: 187,977 bytes
- Local SHA-256: `d6cb131901608c02b00af6c3e8c4455cf90ca963fc714910f78388e969d210de`
- Intended use: decoded pixel source for RGB plate extraction, pointer sampling, color-reference detection, channel-energy metrics, and registration scoring

The earlier `editorial-portrait-rgb-source.jpg` remains in this dedicated folder as the recoverable source used by the previous version of the demo. The live demo now consumes `press-registration-portrait.jpg`.

## Provenance

This is an AI-generated portrait of an entirely fictional adult print technician. It is not documentary photography and does not depict a real person, customer, employee, public figure, or famous person. It must not be assigned a real identity or presented as evidence of a real individual.

The registration marks and color bars are deliberately nonverbal. No brand, readable text, logo, watermark, or remote dependency is embedded in the image.

## Final prompt

```text
Use case: photorealistic-natural
Asset type: local pixel source for an interactive RGB print-registration forensic demo
Primary request: create a sophisticated horizontal editorial photograph of one entirely fictional adult print technician as a color-registration proof portrait; this will be decoded and split into red, green, and blue pixel planes in a web canvas
Scene/backdrop: quiet archival print studio with a pale warm-gray paper backdrop, no readable signage and no brand context
Subject: exactly one fictional adult, head and upper torso, calm direct expression, cropped dark work jacket, visually distinct natural skin and hair edges; the person must not resemble any public figure or famous person
Style/medium: refined contemporary editorial photography combined with a physical offset-print proof aesthetic; sharp, realistic pores, hair and paper grain; source portrait itself must be cleanly registered, not pre-glitched
Composition/framing: landscape 3:2; subject occupies the right two-thirds; generous quiet negative space on the left for UI overlay; full head visible; shoulders not cropped awkwardly; include a slim nonverbal column of clean cyan, magenta, yellow, red, green, and blue calibration swatches along the far right edge, plus small abstract crop/registration marks without letters or numbers
Lighting/mood: soft neutral frontal light, crisp cool rim light and restrained warm fill, controlled contrast, museum-conservation calm
Color palette: warm paper gray and graphite with deliberately measurable saturated cyan, magenta, yellow, red, green and blue reference areas
Materials/textures: uncoated paper tooth, subtle halftone grain only in the backdrop, believable woven jacket, realistic skin and hair
Constraints: exactly one person; fictional identity; no readable text; no letters; no numbers; no logos; no watermark; no jewelry; no hands; no props held by the subject; no extra face; no UI chrome; no brand; no famous-person resemblance; aligned source image with no RGB channel displacement
Avoid: cyberpunk neon, horror, surveillance mugshot aesthetics, glossy beauty retouching, pre-separated RGB ghosting, fake labels, gibberish typography, distorted eyes or facial anatomy, duplicated features, extreme expression
```

## Mechanism role

The JavaScript fetches this exact committed JPEG, verifies its byte SHA, decodes all 614,400 pixels, and builds three true red-only, green-only, and blue-only raster plates. A 153,600-sample analysis derives channel energy, edge density, saturated-pixel coverage, and the presence of six registration-reference hues from the file itself.

Those measurements are functional: source pixels populate the hover probe and plate rasters, while edge density and saturation change the tolerance and penalty used by the live registration score. Mouse, touch, or pen drag moves the selected plate with pointer capture; the range, channel buttons, arrow keys, and Align/Home/Escape paths provide reversible human control. There is no autoplay, timer-driven state path, synthetic-event rehearsal, or preview-clock visual mutation.
