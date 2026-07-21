# Kinetic Paper-fold Map — Harbor Arts Walking Map

## Asset record

- Generated: 2026-07-21 (Asia/Shanghai)
- Generator: built-in OpenAI ImageGen (`image_gen`), default tool mode
- Built-in result ID: `exec-1603f963-940a-482d-ac62-22415df47e6b.png`
- Original generated source: 1536 × 1024 RGB PNG, 3,714,748 bytes
- Original PNG SHA-256: `4497046922707d55c51ba0fe1a699ac51356c39eb00063e339f869cc7988ee34`
- Final project file: `harbor-arts-walking-map.jpg`
- Final local asset: 960 × 540 RGB JPEG, 267,598 bytes
- Final JPEG SHA-256: `21b5265a21ba86ce963df14d267875320c0d723d16761c3c5be37c36e4fbdafd`
- Source-browser QA decoded-pixel FNV-1a fingerprint: `3314351648`
- Intended use: the one continuous map surface sampled into four affine p5/Canvas fold faces; its red walking route and three landmark positions remain registered while the sheet folds

## Fictional and AI-generated disclosure

This map, district, route, buildings, shoreline, market hall, lookout pavilion, and glasshouse are AI-generated and entirely fictional. They do not depict a real city, venue, transit system, route recommendation, accessibility condition, travel time, client, campaign, map provider, or measured geography. The asset must not be presented as factual navigation. It contains no people, words, letters, numbers, labels, logos, watermarks, real-world place names, or branded map UI.

## Deterministic processing

The accepted 1536 × 1024 PNG was mechanically scaled to 960 × 640, center-cropped by 50 pixels at the top and bottom to 960 × 540, encoded as a JPEG, and stripped of metadata:

```bash
ffmpeg -hide_banner -loglevel error -y -i <generated.png> \
  -vf scale=960:640,crop=960:540:0:50 \
  -q:v 3 -map_metadata -1 harbor-arts-walking-map.jpg
```

No retouching, compositing, recoloring, route replacement, fold geometry, crease, shadow, marker animation, control, or interface element was baked into the project asset. The image is stored locally; runtime behavior does not depend on the generation service or another network origin.

## Final ImageGen prompt

```text
Use case: infographic-diagram
Asset type: raster texture for an interactive foldable walking-map demo
Primary request: create an original fictional top-down illustrated walking map of a compact harbor arts district, designed to be printed on one portable paper map and folded into four panels
Scene/backdrop: one uninterrupted map sheet filling the entire landscape canvas edge to edge
Subject: a curved deep-blue harbor on the left, cream pedestrian blocks, a rust-red market hall near the upper right, a circular teal glasshouse near the lower right, a small coral lookout pavilion near the lower center, connected by a single clearly visible vermilion walking route with three round waypoint markers; trees, plazas, footbridges, and shoreline texture provide spatial identity
Style/medium: refined editorial cartography, screen-printed gouache and colored-pencil texture, crisp enough for UI sampling, tactile paper grain, deliberately fictional
Composition/framing: 3:2 landscape, straight top-down orthographic view, continuous geometry across the full image; major route crosses the vertical and horizontal fold axes; strong large-scale shapes remain legible at thumbnail size
Color palette: warm ivory paper, ink navy water, muted sage parks, vermilion route, rust red and teal landmarks
Materials/textures: printed paper grain, painted water, crisp route ink, coherent architectural footprints
Constraints: absolutely no words, letters, numbers, legends, labels, compass text, logos, watermarks, borders, mockup perspective, hands, people, pins shaped like commercial map apps, or existing real-world geography; no creases or shadows baked into the image; make every landmark architecturally coherent and keep the route continuous and unobstructed
Avoid: satellite imagery, photorealism, interface chrome, decorative title blocks, fake typography, repeated nonsensical buildings
```

## Map registration and mechanism role

The source image is divided only at runtime into four adjacent 240 × 540 source regions. Each region is rendered as two affine-mapped triangles, producing eight real textured triangles on the p5-managed Canvas 2D surface. Neighboring faces reuse numerically identical destination crease vertices, while their source bounds meet at exact `x = 240`, `480`, and `720` pixel seams. A runtime assertion requires four faces, eight triangles, 960 pixels of source coverage, and a maximum source/destination seam error below `1e-6`.

The route origin and destinations are registered to committed-image pixels rather than decorative HTML:

| Runtime role | Source pixel `(x, y)` | Fold panel |
| --- | ---: | ---: |
| Harbor route origin | `(333, 236)` | 2 |
| Fictional Market Hall | `(754, 95)` | 4 |
| Fictional Harbor Lookout | `(483, 436)` | 3 |
| Fictional Glasshouse Dome | `(820, 497)` | 4 |

Destination buttons and keys `1`–`3` select one of these registered map points. The marker is projected through the same piecewise-affine transform as the image, so it remains attached to the landmark as the paper faces compress. Fold depth, alternating face shading, creases, paper shadow, focus treatment, and selection rings are code-generated. Removing or replacing the image invalidates the exact byte SHA, dimensions, source coverage, and registered route evidence, and changes the decoded-pixel fingerprint.

The committed JPEG byte SHA is the portable identity check. JPEG decoding can differ by a few channel values between browser renderers, so runtime admission verifies dimensions, RGBA coverage, opaque and distinct landmark samples, and a nonzero whole-image fingerprint instead of treating the source-browser QA fingerprint as a cross-platform file identity.

## Visual verification

- 720 × 405 source page: passed. The open map occupies the live stage; drag produces a readable four-panel accordion with a stable destination marker and no canvas scaling mismatch.
- 320 × 180 source page: passed. The route, harbor, market hall, lookout, glasshouse, three destination controls, fold controls, and active state remain clear.
- 144 × 81 source page: passed. The map is still recognizable as a folded harbor route, the large red line and three landmark masses survive, and compact controls remain operable.
- Asset inspection: passed. No pseudo-text, logo, watermark, real place name, baked fold, malformed landmark geometry, or disconnected route was observed.

QA screenshots are temporary inspection artifacts and are not project assets.
