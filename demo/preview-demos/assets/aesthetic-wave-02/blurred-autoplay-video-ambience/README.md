# Blurred Autoplay Video Ambience — Hand-blown Glass Film

## Asset summary

- Generated: 2026-07-21
- Generator: built-in `image_gen`
- Subject: one coherent, entirely fictional hand-blown glass light-object study
- Storyboard master: `glass-storyboard-master.jpg`, 1664 × 936 baseline RGB JPEG
- Still frames: four 1280 × 720 baseline RGB JPEGs
- Film: `glass-ambience-loop.mp4`, H.264, 1280 × 720, 30 fps, 180 frames, no audio
- Poster: `glass-ambience-poster.jpg`, 1280 × 720 baseline RGB JPEG extracted from frame zero of the final MP4
- Intended use: one local film shown clearly in the foreground while that exact same source is enlarged and blurred into synchronized ambient color behind it

## Fictional-content declaration

The glass object, pedestal, studio set, campaign and film are AI-generated and entirely fictional. They do not depict or imitate an identifiable real product, brand, package, artist, client or campaign. The files contain no people, hands, text, letters, numbers, packaging, signage, logos, watermark, UI or branded objects.

## Final ImageGen prompt

```text
Use case: photorealistic-natural
Asset type: clean 2-by-2 storyboard master containing four independent 16:9 source frames for a same-source blurred video-ambience web demo
Primary request: create four coherent photorealistic campaign-film frames of one entirely fictional, unbranded hand-blown glass light object on a dark mineral pedestal, with changing light and camera distance that will produce clearly different ambient colors when the frames are animated and blurred
Layout: an exact 2-by-2 grid of four equal landscape frames; every quadrant is a complete 16:9 shot; edge-to-edge imagery with no gutters, no borders, no labels, no frame numbers, and no contact-sheet chrome
Shared subject: the same simple sculptural glass object in every quadrant — a low rounded transparent vessel with one asymmetric internal fold, no cap, no product label, no letters, no logo — resting on the same charcoal stone pedestal
Top-left shot — COBALT WIDE: restrained wide product shot, cool cobalt light passing through the glass, object on the right third, dark quiet negative space across the left 38 percent
Top-right shot — MAGENTA DETAIL: closer three-quarter view of the same object, restrained magenta refraction along its folded edge, realistic caustic light on the pedestal, darker uncluttered left side
Bottom-left shot — AMBER PROFILE: side profile of the same object with warm amber light moving through the glass, visible bubbles and natural handmade texture, right-weighted composition
Bottom-right shot — CYAN AFTERGLOW: darker closing frame of the same object with a narrow cyan rim and fading warm reflection, deep charcoal negative space on the left
Style/medium: refined contemporary product-film photography, natural glass optics, physically believable refraction and caustics, tactile stone, restrained editorial finish, subtle fine grain, not concept art and not glossy CGI
Continuity: identical object silhouette, internal fold, pedestal material, lens character, and set across all four shots; only camera distance and lighting phase change; every frame must remain recognisable at thumbnail size
Lighting/mood: controlled studio darkness with one colored key and a soft neutral fill in each frame, intimate and cinematic rather than neon cyberpunk
Color palette: charcoal, transparent glass, sequential cobalt, restrained magenta, amber, and cyan highlights; black levels remain rich enough for white HTML copy
Constraints: exactly one glass object per quadrant; no people; no hands; no text; no letters; no numbers; no packaging; no signage; no logo; no watermark; no UI; no decorative border; no grid lines or gutters; no real brand resemblance
Avoid: perfume branding, readable labels, duplicate objects within a quadrant, liquid splashes, fantasy glow, excessive bloom, plastic surfaces, impossible reflections, fisheye distortion, painterly rendering, inconsistent object identity
```

## Storyboard and still-frame processing

The built-in generator returned a 1672 × 941 RGB PNG. For exact quadrant boundaries, ffmpeg center-cropped it to 1664 × 936 (`crop=1664:936:(iw-1664)/2:(ih-936)/2`) and encoded the local master with `-q:v 2`, removing metadata.

The master was divided on exact 832 × 468 boundaries, and every quadrant was scaled to 1280 × 720 and encoded with `-q:v 3`, again with metadata removed:

| Shot | Master crop |
| --- | --- |
| `01-cobalt-wide.jpg` | `crop=832:468:0:0` |
| `02-magenta-detail.jpg` | `crop=832:468:832:0` |
| `03-amber-profile.jpg` | `crop=832:468:0:468` |
| `04-cyan-afterglow.jpg` | `crop=832:468:832:468` |

## Film construction

Each source still receives a distinct, restrained ffmpeg `zoompan`; all four then join through three ten-frame crossfades:

| Shot | Source frames | Zoom/pan expression |
| --- | ---: | --- |
| Cobalt wide | 51 | `z=min(zoom+0.00060,1.031)`; x 64%; y 50% |
| Magenta detail | 54 | `z=min(zoom+0.00052,1.029)`; x travels from 72% to 45%; y 48% |
| Amber profile | 51 | `z=min(zoom+0.00068,1.035)`; x 58%; y travels from 34% to 58% |
| Cyan afterglow | 54 | `z=min(zoom+0.00050,1.028)`; x travels from 75% to 55%; y 52% |

The `xfade=transition=fade` duration is `0.333333` seconds at offsets `1.366667`, `2.833334` and `4.200000` seconds. The result is limited to exactly 180 frames.

Encoding: `libx264`, preset `medium`, CRF 20, `yuv420p`, television color range, 30 fps, `+faststart`, no audio and removed metadata. `ffprobe` measured H.264, 1280 × 720, `yuv420p`, 30/1 fps, 180 frames and an exact duration of `6.000000` seconds. The poster was extracted from the encoded video's first frame, not independently generated.

## Checksums

| File | Bytes | SHA-256 |
| --- | ---: | --- |
| `glass-storyboard-master.jpg` | 292,961 | `0e7b7693ef31a599d35571415f60aaa6624e5a4222a674c2809cce87a77dee8a` |
| `01-cobalt-wide.jpg` | 61,291 | `cf9bfeb86b69c9eda0f77e23d42ae5c69972c75538e2a4fd6a67eade3a8a5daf` |
| `02-magenta-detail.jpg` | 96,041 | `b114a9f7bee6291607acced32a955939762820d0445b37572e3f44c77d115eae` |
| `03-amber-profile.jpg` | 117,410 | `a93e84f436815653fd77c6f7df4e56698fbbeeb5d4ee2828241a7155e2bfb508` |
| `04-cyan-afterglow.jpg` | 81,884 | `5dd556d5b2e867155708f2a1dbd49295ce83883c5593dcac8fe1ea67b96eb9ca` |
| `glass-ambience-loop.mp4` | 955,887 | `827f7c958ccf2042f296c2acf74ec60b6a98f73c785f00d858614f2e898bb8c8` |
| `glass-ambience-poster.jpg` | 41,652 | `f027aa167a1e407fcf89117c4162c2114146b512b001e4f22ee6095cfa37c403` |

## Visual verification

- Master: exact edge-to-edge 2 × 2 storyboard with no gutter, label or contact-sheet chrome. The same rounded glass silhouette, internal fold, bubbles and mineral pedestal remain coherent across all four lighting phases.
- Four 720 × 405 frames: refraction, handmade bubbles, inner fold, stone texture and caustic light remain detailed; the object stays right-weighted with rich dark space for HTML copy.
- Four 144 × 81 frames: object silhouette and cobalt, magenta, amber and cyan phases remain immediately distinguishable at catalog scale.
- Video samples at 0.00, 1.45, 2.95, 4.32 and 5.90 seconds: valid imagery at the start, all three crossfade regions, middle and end; no black frame or unsafe crop. The brief double exposure is the intended crossfade between lighting phases.

All contact sheets and timeline samples used for QA were temporary inspection files and are not project assets.
