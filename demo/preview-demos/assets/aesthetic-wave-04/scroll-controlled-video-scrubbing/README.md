# Bean Growth Study assets

Project-bound synthetic keyframes and the deterministic local video used by `scroll-controlled-video-scrubbing`.

## Generation and disclosure

- Generated: 2026-07-21 (Asia/Shanghai).
- Mode: built-in OpenAI ImageGen (`image_gen`), not the CLI fallback.
- Taxonomy: `photorealistic-natural` for the anchor frame, then `precise-object-edit` for growth continuity.
- AI disclosure: every photographic frame in this directory is AI-generated. It documents a fictional greenhouse study and must not be represented as a real experiment, real location, or measured biological record.
- External source material: none. The later frames use the preceding generated frame only as an edit target.
- Original generation size: 1536×1024 PNG.
- Project keyframe size: 960×540 JPEG, mechanically scaled to 960×640 and center-cropped 50 px from the top and bottom with FFmpeg.
- Runtime use: the five JPEGs are decoded and pixel-sampled for runtime asset checks; `bean-growth-study.mp4` is the actual seekable `HTMLVideoElement` source.
- Rights note: these are original synthetic project assets without requested brands, logos, people, or copied locations. This record documents provenance and does not replace a project-specific legal review.

## Asset manifest

| File | Purpose | Dimensions / duration | SHA-256 |
| --- | --- | --- | --- |
| `stage-01-emergence.jpg` | Initial paused frame / emergence chapter | 960×540 | `ec3569d0ffc990c82233aa4b1256866dcb2dc7ea24bca43065ca2c5f571e6c8c` |
| `stage-02-seedling.jpg` | Seedling chapter | 960×540 | `17c29e289b4fd0750b4358d5e4902a3a78fe0b49f313dac704d39a5d2012e91b` |
| `stage-03-climbing.jpg` | Corrected single-vine climbing chapter | 960×540 | `6861d5b295fc7aaddc1c7dea51a9b0f78882a7629ba8c2364008990184e62e59` |
| `stage-04-canopy.jpg` | Mature canopy chapter | 960×540 | `fefd112f6a1fa20134fcc84ca50981303a68f1980873244200a9b95df1ffa8a5` |
| `stage-05-first-bloom.jpg` | First-bloom chapter | 960×540 | `859c7d4b3e5543a2e5db73186a0db22a12e580d6e9aef1a497fddb255a037d6a` |
| `bean-growth-study.mp4` | Real local seek target | H.264, 960×540, 30 fps, 180 frames, 6.000 s, no audio | `80db47b4433dc45b016fc603379a6dbac00cc0f935dea3a4bda4ad3900b46722` |

## Deterministic derivation

Only the five accepted frames above are shipped. Each source PNG was converted with:

```bash
ffmpeg -hide_banner -loglevel error -y -i <generated.png> \
  -vf "scale=960:640,crop=960:540:0:50" -q:v 3 <stage-name.jpg>
```

The MP4 was derived without network access, randomness, runtime recording, or synthetic browser input. Five two-second still streams are joined by fixed one-second crossfades at seconds 1, 2, 3, and 4, then encoded with a fixed GOP:

```bash
ffmpeg -hide_banner -loglevel error -y \
  -framerate 30 -loop 1 -t 2 -i stage-01-emergence.jpg \
  -framerate 30 -loop 1 -t 2 -i stage-02-seedling.jpg \
  -framerate 30 -loop 1 -t 2 -i stage-03-climbing.jpg \
  -framerate 30 -loop 1 -t 2 -i stage-04-canopy.jpg \
  -framerate 30 -loop 1 -t 2 -i stage-05-first-bloom.jpg \
  -filter_complex "[0:v]settb=AVTB,setpts=PTS-STARTPTS[v0];[1:v]settb=AVTB,setpts=PTS-STARTPTS[v1];[2:v]settb=AVTB,setpts=PTS-STARTPTS[v2];[3:v]settb=AVTB,setpts=PTS-STARTPTS[v3];[4:v]settb=AVTB,setpts=PTS-STARTPTS[v4];[v0][v1]xfade=transition=fade:duration=1:offset=1[x1];[x1][v2]xfade=transition=fade:duration=1:offset=2[x2];[x2][v3]xfade=transition=fade:duration=1:offset=3[x3];[x3][v4]xfade=transition=fade:duration=1:offset=4,format=yuv420p[v]" \
  -map "[v]" -r 30 -t 6 -an -c:v libx264 -preset slow -crf 20 \
  -g 15 -keyint_min 15 -sc_threshold 0 -movflags +faststart bean-growth-study.mp4
```

Verified with FFprobe: H.264, 960×540, 30/1 fps, 180 frames, 6.000000 seconds.

## Full ImageGen prompts

### Call 1 — emergence anchor (accepted)

```text
Use case: photorealistic-natural
Asset type: scroll-scrub video keyframe 1 of 5 for a digital horticulture field log
Primary request: the first stage of a climbing bean plant growth sequence, a newly planted seed with one tiny pale-green shoot just breaking the soil
Scene/backdrop: quiet contemporary research greenhouse, ribbed translucent glass wall, subtle vertical measurement grid, mist-softened foliage far behind
Subject: one rectangular unglazed terracotta propagation pot centered on a slim dark steel bench; exactly one tiny bean shoot at the center of the soil; a thin black circular plant support arch fixed into the pot and remaining empty
Style/medium: photorealistic editorial botanical photography, real natural textures
Composition/framing: locked-off landscape camera, straight-on waist-level view, pot and support arch fully visible, symmetrical centered geometry, 16:9-safe crop, identical framing intended for a time-lapse sequence
Lighting/mood: soft overcast greenhouse daylight from upper left, calm documentary mood, controlled soft shadows
Color palette: mineral terracotta, charcoal steel, muted eucalyptus green, translucent cool gray
Materials/textures: damp granular soil, porous fired clay, powder-coated steel, slightly condensed ribbed greenhouse glass
Constraints: no people; no hands; no labels; no text; no logo; no watermark; no extra pots; no tools; no camera movement; no dramatic depth-of-field; preserve generous margins around the support arch
Avoid: flowers, mature leaves, multiple seedlings, fantasy plants, illustration, stylization, time-lapse motion blur
```

Generated original: `exec-37d50737-65c2-4189-ac91-fe9352455295.png`.

### Call 2 — seedling (accepted)

```text
Use case: precise-object-edit
Asset type: scroll-scrub video keyframe 2 of 5 for a digital horticulture field log
Input images: Image 1 is the exact previous keyframe and edit target
Primary request: advance only the bean plant by several days: replace the tiny shoot with one healthy 14-centimeter bean seedling, straight central stem, two open cotyledons and the first small pair of true leaves
Constraints: change only the plant growth emerging from the exact same center point in the soil; keep the locked camera, greenhouse wall, vertical grid marks, background foliage, rectangular terracotta pot, soil, black support arch, steel bench, crop, exposure, shadows, materials, and every object position unchanged; exactly one plant; botanically plausible growth; no flowers yet; no text; no logo; no watermark
Avoid: camera movement, changed pot geometry, changed support arch, new props, hands, people, extra seedlings, fantasy foliage, motion blur
```

Generated original: `exec-551038b2-f113-44e2-9831-af79797144f6.png`.

### Call 3 — initial climbing attempt (rejected)

This edit incorrectly retained the center seedling and added a second vine. It was visually rejected and is not shipped, but the prompt is retained for auditability.

```text
Use case: precise-object-edit
Asset type: scroll-scrub video keyframe 3 of 5 for a digital horticulture field log
Input images: Image 1 is the exact previous keyframe and edit target
Primary request: advance only the same bean plant to an early climbing stage: a slender healthy vine reaches approximately halfway up the left side of the black support arch, naturally twining around it, with six to eight medium green bean leaves distributed along the single vine
Constraints: change only the plant growth from the exact same center point in the soil; keep the locked camera, greenhouse wall, vertical grid marks, background foliage, rectangular terracotta pot, soil, black support arch, steel bench, crop, exposure, shadows, materials, and every object position unchanged; exactly one connected plant; botanically plausible; no flowers yet; no text; no logo; no watermark
Avoid: camera movement, changed pot geometry, changed arch, new props, hands, people, separate seedlings, dense bush, fantasy foliage, motion blur
```

Rejected original: `exec-6592db84-83ea-4a80-8811-5f3587de44b5.png` (not copied into the project).

### Call 4 — climbing correction (accepted as stage 3)

```text
Use case: precise-object-edit
Asset type: corrected scroll-scrub video keyframe 3 of 5
Input images: Image 1 is the edit target
Primary request: remove only the separate small center seedling completely and restore undisturbed damp soil in that exact center spot; keep the healthy climbing bean vine on the left side of the support arch as the one and only plant
Constraints: change only the duplicate center seedling and the tiny soil area directly beneath it; preserve the locked camera, greenhouse, grid marks, background, rectangular terracotta pot, all other soil, black support arch, steel bench, crop, exposure, shadows, and the entire left climbing vine pixel-consistently; exactly one connected climbing plant remains; no text; no logo; no watermark
Avoid: adding foliage, changing the left vine, changing geometry, camera movement, new props, people
```

Generated original: `exec-97836bae-a701-413d-ab13-35f8a1ffcd44.png`.

### Call 5 — mature canopy (accepted)

```text
Use case: precise-object-edit
Asset type: scroll-scrub video keyframe 4 of 5 for a digital horticulture field log
Input images: Image 1 is the exact previous keyframe and edit target
Primary request: advance only the same climbing bean plant to a mature vegetative stage: extend the existing single vine naturally across the top of the black support arch toward the upper-right, with twelve to sixteen healthy medium green leaves following the arch and two small side tendrils; no flowers yet
Constraints: continue the exact existing vine from its current tip; change only plant growth; keep the locked camera, greenhouse wall, vertical grid marks, background foliage, rectangular terracotta pot, soil, black support arch, steel bench, crop, exposure, shadows, materials, and every object position unchanged; exactly one connected plant; botanically plausible; no text; no logo; no watermark
Avoid: camera movement, changed geometry, separate seedlings, dense bush hiding the arch, fantasy foliage, flowers, fruit, motion blur, props, hands, people
```

Generated original: `exec-95e8bb53-98d1-4837-ab16-032c1b8ddf37.png`.

### Call 6 — first bloom (accepted)

```text
Use case: precise-object-edit
Asset type: scroll-scrub video keyframe 5 of 5 for a digital horticulture field log
Input images: Image 1 is the exact previous keyframe and edit target
Primary request: advance only the same mature bean plant to first bloom: preserve the full existing vine and add exactly seven small delicate white bean flowers with subtle warm-cream centers, spaced naturally among the leaves across the upper half of the arch; add two tiny unopened buds near the upper-right tip
Constraints: change only the reproductive growth on the existing plant; keep the locked camera, greenhouse wall, vertical grid marks, background foliage, rectangular terracotta pot, soil, black support arch, steel bench, crop, exposure, shadows, materials, every object position, and all existing leaves and vine geometry unchanged; exactly one connected plant; botanically plausible; flowers readable at thumbnail size; no pods yet; no text; no logo; no watermark
Avoid: camera movement, changed pot or arch, new seedlings, bouquets, oversized flowers, fantasy colors, fruit, motion blur, props, hands, people
```

Generated original: `exec-87daf22f-878f-46d7-ad45-b788bab2c1af.png`.
