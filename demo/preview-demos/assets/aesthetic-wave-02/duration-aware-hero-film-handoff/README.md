# Duration-aware Hero Film Handoff — Basalt Bathhouse Storyboard

## Asset summary

- Generated: 2026-07-21
- Generator: built-in `image_gen`
- Subject: one coherent, entirely fictional basalt coastal bathhouse campaign
- Storyboard master: `bathhouse-storyboard-master.jpg`, 1664 × 936 baseline RGB JPEG
- Still frames: four 1280 × 720 baseline RGB JPEGs
- Derived films: four local 1280 × 720 H.264 MP4s, 30 fps, no audio, intentionally unequal measured durations
- Intended use: real media inputs whose individual metadata durations drive the preload window and hero-film handoff

## Fictional-content declaration

The bathhouse, architecture, coastline, interiors, campaign and location are AI-generated and entirely fictional. The files are not documentary photography or footage and do not depict an identifiable hotel, spa, building, landmark, client or real location. They contain no people, text, letters, numbers, signage, logos, watermark, UI or branded objects.

## Final ImageGen prompt

```text
Use case: photorealistic-natural
Asset type: clean 2-by-2 storyboard master containing four independent 16:9 source frames for a duration-aware interactive hero-film handoff
Primary request: create four coherent, photorealistic editorial campaign shots of one entirely fictional basalt coastal bathhouse, showing four distinct tempos of the same quiet hospitality story
Layout: an exact 2-by-2 grid of four equal landscape frames; every quadrant is a complete 16:9 shot; edge-to-edge imagery with no gutters, no borders, no labels, no frame numbers, and no contact-sheet chrome
Shared subject and art direction: one low charcoal-basalt bathhouse beside a cold northern sea, pale limestone interiors, a narrow reflecting pool, restrained warm interior light, realistic natural materials, no people
Top-left shot — ARRIVAL: wide misty-dawn exterior, bathhouse on the right third, dark wet rocks and calm sea horizon, quiet darker negative space across the left 38 percent for HTML title copy
Top-right shot — WATER: medium view along the reflecting pool toward the sea, crisp pool edge and subtle ripples, architectural focal detail on the right, darker uncluttered left side
Bottom-left shot — MATERIAL: intimate but still spatial view through a basalt doorway toward pale limestone, linen, and reflected water; tactile stone grain, right-weighted composition, calm shadow on the left
Bottom-right shot — AFTERGLOW: blue-hour terrace and glowing glazing facing the ocean, building and warm light on the right third, deep navy negative space on the left
Style/medium: refined contemporary architecture and hospitality photography, natural lenses, realistic optics and surface texture, restrained editorial color grade, subtle fine grain, not concept art and not glossy CGI
Continuity: the same fictional material palette and architectural language across all four shots; believable changes of viewpoint and time; each quadrant must read clearly at thumbnail size and remain recognisable during a short crossfade
Lighting/mood: misty cool dawn, silver daylight on water, soft interior shade, and blue-hour warmth respectively; contemplative, tactile, cinematic, and believable
Color palette: charcoal basalt, pale limestone, deep teal water, fog blue, restrained amber glazing
Constraints: no people; no text; no letters; no numbers; no signage; no logo; no watermark; no UI; no decorative border; no grid lines or gutters; no famous landmark; no identifiable real hotel or location; no duplicated architectural fragments across quadrant boundaries
Avoid: surreal architecture, impossible reflections, tropical resort styling, dramatic advertising gloss, excessive bloom, fisheye distortion, painterly rendering, empty featureless frames, inconsistent material identity
```

## Storyboard and still-frame processing

The built-in generator returned a 1672 × 941 RGB PNG. To obtain exact half-frame boundaries, ffmpeg center-cropped it to a 1664 × 936 master (`crop=1664:936:(iw-1664)/2:(ih-936)/2`) and encoded the local master JPEG with `-q:v 2` and metadata removed.

The master was split on exact 832 × 468 quadrant boundaries, then each quadrant was scaled to 1280 × 720 and encoded with `-q:v 3`, with metadata removed:

| Shot | Master crop |
| --- | --- |
| `01-arrival.jpg` | `crop=832:468:0:0` |
| `02-water.jpg` | `crop=832:468:832:0` |
| `03-material.jpg` | `crop=832:468:0:468` |
| `04-afterglow.jpg` | `crop=832:468:832:468` |

## Local video derivation

Each MP4 was generated only from its matching final JPEG. All use ffmpeg `zoompan`, `format=yuv420p`, 30 fps, `libx264`, preset `medium`, CRF 21, `+faststart`, no audio and removed metadata. Frame counts are explicit, so the clips have real, intentionally unequal durations.

| Shot | Frames | Zoom/pan expression | ffprobe duration |
| --- | ---: | --- | ---: |
| Arrival | 72 | `z=min(zoom+0.00055,1.040)`; x travels from 46% to 68% of available crop; y 50% | 2.400000 s |
| Water | 93 | `z=min(zoom+0.00040,1.037)`; x travels from 20% to 55%; y 46% | 3.100000 s |
| Material | 81 | `z=min(zoom+0.00065,1.052)`; x 62%; y travels from 20% to 55% | 2.700000 s |
| Afterglow | 108 | `z=min(zoom+0.00035,1.038)`; x travels from 78% to 42%; y 56% | 3.600000 s |

`ffprobe` also confirmed all four streams as H.264, 1280 × 720, 30/1 fps, with respective frame counts 72, 93, 81 and 108.

## Checksums

| File | Bytes | SHA-256 |
| --- | ---: | --- |
| `bathhouse-storyboard-master.jpg` | 284,149 | `8ae10d25d63a6eed87f2cf57fca12e72ca1bd47def3d79de908d27d12a864189` |
| `01-arrival.jpg` | 62,835 | `b3d24b5d0a671b1db5587b4c29bb54fedcc97e28ea65e222f73d026ba28261cb` |
| `02-water.jpg` | 105,406 | `c9f9912f85976921200c6de3c69e5af1623b8a3cbdd7848fefaf333676ec39f1` |
| `03-material.jpg` | 94,589 | `633ad1197cfe02f34912fc9dc458b959e64fdf8752812035fc4fd08cbfbbf9ad` |
| `04-afterglow.jpg` | 70,962 | `c2b7066fab2570f0640acc0bfe06cbb6c21b178ea48b55d405bef7296cb2c289` |
| `01-arrival.mp4` | 203,037 | `4871362b53138e8b7ffc6df7fb07c7b83b3c6c4910fe9cbd3d67fda3e000b9f4` |
| `02-water.mp4` | 329,300 | `38d83aeacf14c0c216e0b4b5520fc7f3a55678120a3244a1c205191d61759364` |
| `03-material.mp4` | 293,821 | `8620b334336ae9c4dce0ee997f00b55507d42684ad22f62745bef99d6a8b9bd0` |
| `04-afterglow.mp4` | 279,445 | `a9c0d31d654ff80b911c2e8585944a84f4e4da8bc7dce2949508d9bf3f7e0411` |

## Visual verification

- Master: exact edge-to-edge 2 × 2 composition with no gutter, label, frame number or contact-sheet chrome; all quadrants retain one material identity.
- Four 720 × 405 views: Arrival, Water, Material and Afterglow are immediately distinct; architecture stays right-weighted and the left side remains usable for HTML copy.
- Four 144 × 81 views: the misty exterior, pool axis, limestone interior aperture and amber night glazing remain recognisable at catalog scale.
- Video endpoint contact sheet: all four subtle zoom/pan paths preserve the architectural subject and copy-safe area; no black frames, geometry discontinuity or unsafe crop was found.

All contact sheets and endpoint stills used for QA were temporary inspection files and are not project assets.
