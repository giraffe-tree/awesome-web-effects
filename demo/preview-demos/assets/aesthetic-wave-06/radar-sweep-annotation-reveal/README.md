# Radar-sweep annotation reveal — functional survey asset

## Disclosure and role

`storm-port-multispectral-survey.jpg` is an original AI-generated, entirely fictional multispectral training scene created with the built-in OpenAI ImageGen tool on 2026-07-21. It does not depict a real port, real storm damage, measured temperatures, or an actual inspection result.

The bitmap is a functional input, not a decorative backdrop. The demo loads the committed JPEG through p5.js, crops and downsamples its actual pixels to 96×54, segments warm pixels, finds four connected components, and derives every revealed target's position, evidence-pixel count, heat index, and severity from those components. The heat index is a deterministic fictional training score, not a temperature measurement. If the asset pixels change, the target evidence and runtime checks change or fail.

## Full generation prompt

```text
Use case: scientific-educational
Asset type: functional multispectral aerial survey input for an interactive browser radar-inspection demo
Primary request: create an original fictional top-down drone survey image of a compact storm-damaged coastal cargo terminal roof complex, designed so image-pixel analysis can reliably find exactly four spatially separated thermal anomalies
Scene/backdrop: directly overhead orthographic view of flat warehouse roofs, narrow service roads, concrete aprons, a small dark-water edge, drainage channels, and sparse utility equipment; the image must read as a continuous aerial survey, not a UI mockup
Subject: four distinct compact thermal anomaly patches embedded naturally in different roof or service-yard regions; each anomaly is a coherent bright amber-to-orange patch with a small pale-yellow core, separated by large cool regions; the rest of the terminal uses muted deep navy, slate blue, oxidized teal, charcoal, and desaturated concrete
Style/medium: polished false-color multispectral aerial imaging, realistic material texture but clearly fictional, high-detail scientific survey photography rather than concept-art spectacle
Composition/framing: 3:2 landscape, true top-down orthographic; terminal fills the entire frame edge to edge; distribute four warm anomalies across different quadrants, keep each away from the outer 8 percent border, and keep at least 18 percent of image width between anomaly centers; no single dominant central object; no perspective horizon
Lighting/mood: cool post-storm dusk survey palette, crisp local contrast, controlled atmospheric softness only over water
Color palette: cool navy/slate/teal base with exactly four visually separated amber/orange/yellow anomaly islands; no other warm orange or yellow elements elsewhere
Materials/textures: ribbed metal roofs, wet concrete, dark water, drainage seams, subtle storm debris, plausible multispectral heat bloom
Constraints: no text, labels, numbers, map pins, interface graphics, borders, legends, grids, logos, trademarks, watermark, people, vehicles with visible branding, or decorative glow; exactly four warm anomaly clusters and no extra warm spots; each warm cluster must have enough contiguous pixels for downsampled color segmentation; keep all important regions visible after a centered 3:2 crop
Avoid: radar circles, crosshairs, HUD overlays, perspective view, city skyline, tiny scattered orange lights, fire or flames, photorealistic claims about a real place
```

## Source and derived files

| Stage | Dimensions | Format | Bytes | SHA-256 |
| --- | ---: | --- | ---: | --- |
| Built-in ImageGen output | 1536×1024 | PNG | 2,953,258 | `3fc896469455dd85d25d8ea5a8b49fb9d846358f9ce563e67dfb43095f39312d` |
| Committed functional asset | 960×640 | JPEG | 274,991 | `a6179b9be47d700e55f452f44ce82b285b692d7d0a99e8521a78434e4fdb9329` |

The generated PNG is provenance material and is not shipped in the repository. The committed JPEG is the only runtime asset.

## Deterministic conversion

The selected ImageGen PNG was copied to a local working file and converted with the macOS `sips` utility:

```bash
sips -z 640 960 \
  -s format jpeg \
  -s formatOptions 88 \
  radar-sweep-source.png \
  --out storm-port-multispectral-survey.jpg
```

No retouching, compositing, labels, or interface graphics were added after generation. The browser uses source crop `(0, 50, 960, 540)` so the 3:2 image fills the 16:9 preview without distorting the scene; this same crop is used for displayed pixels and anomaly analysis.
