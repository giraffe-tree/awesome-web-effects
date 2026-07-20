# Filterable grid field-catalog storyboard

- Generated: 2026-07-21
- Generator: Codex built-in `image_gen` tool
- Intended use: six coherent, independently filterable catalog cards for `filterable-grid-reflow`.
- Generated source: 1774 × 887 RGB PNG (exactly 2:1).
- Normalized master: `storyboard-master.jpg`, 2400 × 1200 baseline JPEG.
- Final cards: six baseline RGB JPEGs, each exactly 800 × 600 (4:3).
- Processing: Lanczos resize to the normalized master, then lossless-coordinate cell extraction followed by JPEG encoding; export metadata removed.

## Exact prompt

```text
Use case: product-mockup
Asset type: a strict six-image catalog storyboard master that will be cut into six independent 4:3 product cards for a filterable and sortable web grid
Primary request: create one single photorealistic contact-sheet master with EXACTLY six equal cells arranged in a perfectly regular 3 columns × 2 rows grid; each cell contains exactly one distinct fictional, unbranded field-catalog object from the fixed list below; all six must share one coherent visual system
Scene/backdrop: every cell uses the same seamless warm light-stone studio surface, subtle paper-like mineral texture, no horizon line, no scenery; visible narrow and perfectly straight warm-grey gutters clearly separate every cell; generous outer padding around the whole grid
Subject placement by cell, left to right:
TOP LEFT — one compact burnt-orange handled folding camp trowel, closed/packed and safe, plausible mechanical construction
TOP CENTER — one compact charcoal-black field binocular, eyepieces facing slightly upward, plausible optics
TOP RIGHT — one ivory enamel field mug with a thin charcoal rim, empty
BOTTOM LEFT — one low-profile olive waxed-canvas zip pouch, zipper closed
BOTTOM CENTER — one ochre clothbound field journal with a completely blank cover, closed
BOTTOM RIGHT — one cream archival slide tray holding four small abstract landscape transparencies, with absolutely no labels or writing
Style/medium: premium photorealistic editorial catalog photography, contemporary outdoor archive, tactile and credible rather than glossy CGI
Composition/framing: master canvas ratio exactly 2:1; strict 3×2 storyboard; six cells identical in size and exact alignment; within every cell keep the single object centered, fully visible, isolated, and contained inside the central 68% of that cell with ample breathing room on every side; consistent high three-quarter camera angle; every cell must remain suitable for an independent 4:3 crop; no object, shadow, or material may cross a gutter
Lighting/mood: identical large softbox from upper left across all cells, very soft short contact shadow under each object, calm archival daylight, consistent exposure and white balance
Color palette: warm stone, burnt orange, charcoal, ivory, muted olive, ochre, cream; restrained saturation and one coherent grade
Materials/textures: realistic anodized metal, optical rubber, enamel, waxed canvas, book cloth, archival paper and translucent film; fine believable wear only
Text (verbatim): ""
Constraints: exactly six cells, exactly the six listed objects, exactly one main object per cell, strict order and no substitutions; no visible letters, numbers, text, logo, watermark, emblem, brand label, monogram, barcode, price, handwriting, map markings, interface, border frame around the master, people, hands, plants, extra props, duplicate objects, open blades, or cross-cell shadows; all objects must be entirely fictional and copyright-safe
Avoid: collage overlap, irregular masonry layout, tilted grid, uneven cell sizes, missing gutters, objects touching gutters, decorative labels, captions, category headers, collectible cards, packaging, excessive distressing, dramatic shadows, clutter, floating objects, surreal geometry, impossible hardware, branded resemblance, oversaturation
```

## Crop map

Coordinates refer to the normalized 2400 × 1200 `storyboard-master.jpg`; the origin is the upper-left corner. Every extraction is 800 × 600.

| Cell | File | x | y | width | height | Visual output |
| --- | --- | ---: | ---: | ---: | ---: | --- |
| top-left | `01-folding-field-tool.jpg` | 0 | 0 | 800 | 600 | Closed burnt-orange folding field tool |
| top-center | `02-field-binoculars.jpg` | 800 | 0 | 800 | 600 | Charcoal field binoculars |
| top-right | `03-enamel-field-mug.jpg` | 1600 | 0 | 800 | 600 | Ivory enamel field mug |
| bottom-left | `04-waxed-canvas-pouch.jpg` | 0 | 600 | 800 | 600 | Olive waxed-canvas zip pouch |
| bottom-center | `05-clothbound-field-journal.jpg` | 800 | 600 | 800 | 600 | Ochre clothbound field journal |
| bottom-right | `06-archival-slide-tray.jpg` | 1600 | 600 | 800 | 600 | Cream four-image archival slide tray |

The generated top-left object reads visually as a closed folding field tool rather than an unmistakable trowel, so the delivered filename and catalog suggestion follow the visible output instead of overstating the object identity.

## Suggested catalog data

| File | Filter category | Suggested sort rank | Material cue | Dominant color |
| --- | --- | ---: | --- | --- |
| `01-folding-field-tool.jpg` | Field tools | 1 | polymer + dark metal | burnt orange |
| `02-field-binoculars.jpg` | Field tools | 2 | rubber + optical glass | charcoal |
| `03-enamel-field-mug.jpg` | Camp utility | 3 | enamelled steel | ivory |
| `04-waxed-canvas-pouch.jpg` | Camp utility | 4 | waxed canvas | muted olive |
| `05-clothbound-field-journal.jpg` | Field archive | 5 | book cloth + paper | ochre |
| `06-archival-slide-tray.jpg` | Field archive | 6 | archival polymer + film | cream |

This yields three balanced two-item filters: `field-tools`, `camp-utility`, and `field-archive`. The numerical rank provides a deterministic default sort; material and dominant color provide believable secondary sort/filter facets.

## SHA-256

| File | SHA-256 |
| --- | --- |
| `storyboard-master.jpg` | `140e3ce48054ec6e5d5b5e470ded09e44885c91b43fd331d0695657dda29af60` |
| `01-folding-field-tool.jpg` | `4c6e3ad5437ad8d634d0911761e185cba89e11a68ce5e13d4a241d9c52ae1645` |
| `02-field-binoculars.jpg` | `a6c47be075c3ce44122509cd0b2aca223a1340af84fe1cf4453afe7e915a2469` |
| `03-enamel-field-mug.jpg` | `8c53b1b2c11379392ac8a29db4cede2f8427f9742e4a59fd094fe992e7837790` |
| `04-waxed-canvas-pouch.jpg` | `a634b431a71e6e6f4a75bc33daf47c9c90cc9a4bb5ed8de1093175a5fb1cbdbf` |
| `05-clothbound-field-journal.jpg` | `5079b5782efee0bc78ee9993ddfc39e4a99da0578ce3c26ba128fcb47143dca3` |
| `06-archival-slide-tray.jpg` | `660962f3d68e5d43de639dc14c4401c28f50827f6e328d6ce15f52bdf50d7496` |

## Visual QA

The generated master, normalized master, all six 800 × 600 cards, and individual 144 × 108 derivatives were visually inspected. The objects remain immediately distinguishable at thumbnail size, stay fully inside their cells, retain coherent lighting/background treatment, and show no visible text, logo, watermark, person, cross-cell content, or clipped main subject.

## Factual declaration

These are AI-generated depictions of fictional, unbranded catalog objects created specifically for this repository demo. They do not document real products, brands, product campaigns, publications, people, or locations, and were not copied from a third-party product photograph. The small landscapes inside the fictional slide tray are also generated content rather than reproductions of identifiable photographs.
