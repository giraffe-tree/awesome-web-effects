# Device Silhouette Masked Video — Folding Kayak Film

Generated on 2026-07-21 for demo `#030 device-silhouette-masked-video`.

This asset set is a short, silent, loopable product story designed to remain legible when clipped through narrow phone silhouettes, square watch silhouettes, foldable screens, and the full 16:9 preview.

## Deliverables

| File | Purpose | Dimensions / format |
| --- | --- | --- |
| `folding-kayak-device-film.mp4` | Final loop | 1280×720, H.264 High, 30 fps, 5.8 s, silent |
| `folding-kayak-device-poster.jpg` | Video poster | 1280×720 JPEG |
| `01-packed-frame.jpg` | Packed product state | 1280×720 JPEG |
| `02-unfolded-frame.jpg` | Unfolded product state | 1280×720 JPEG |
| `03-underway-frame.jpg` | Product in use | 1280×720 JPEG |
| `04-carry-frame.jpg` | Carry-away state | 1280×720 JPEG |
| `folding-kayak-storyboard-master-source.png` | Corrected 2×2 Imagegen master | 1672×941 RGB PNG |

## Imagegen provenance

Generator: the built-in OpenAI Imagegen tool in generated-image mode. The final project master is a copy of the corrected generated output. No external stock media were used.

Initial prompt, verbatim:

```text
Use case: photorealistic-natural
Asset type: strict 2-by-2 storyboard master containing four independent 16:9 source frames for a real silent product film that will be clipped through phone, watch, foldable-screen, and other device silhouettes
Primary request: create four coherent photorealistic outdoor-product film frames showing one entirely fictional, unbranded, lightweight folding sea kayak system in restrained burnt orange, moving through a clear pack–unfold–paddle–carry story at a cold volcanic bay
Layout: an exact 2-by-2 grid of four equal landscape frames; every quadrant is a complete 16:9 shot; perfectly straight equal divisions; edge-to-edge imagery with no gutters, no borders, no labels, no frame numbers, no contact-sheet chrome, and no objects crossing between quadrants
Shared product identity: the same compact burnt-orange folding kayak in every frame, with the same low angular hull, visible but subtle fold seams, matte black rim, dark graphite paddle, charcoal technical pack, plain fasteners, and absolutely no brand marks
Top-left shot — PACKED: the folded kayak system secured as one compact charcoal-and-orange rectangular backpack standing upright on a wet black-basalt shore; product centered in the middle 38 percent; no person
Top-right shot — UNFOLDED: the same kayak fully assembled on the shoreline in clean side three-quarter view, showing believable folded-panel construction and lightweight geometry; centered product with generous basalt and water around it; no person
Bottom-left shot — UNDERWAY: the same kayak gliding across deep-teal water with one distant adult paddler seen only from behind, face completely invisible, wearing plain charcoal outerwear and a simple unbranded safety vest; kayak and paddler centered in the middle 38 percent
Bottom-right shot — CARRY: one distant adult seen from behind carrying the same folded charcoal-and-orange kayak pack along the basalt shore, face completely invisible, product pack centered and clearly recognisable
Style/medium: refined contemporary outdoor-equipment campaign photography, realistic optics, natural water and material physics, tactile editorial detail, subtle fine grain, not concept art and not glossy CGI
Continuity: identical orange color, fold-seam pattern, hardware, graphite paddle, charcoal pack, overcast weather, bay geology, and restrained lens character across all four frames; believable product transformation rather than four unrelated products
Lighting/mood: cool overcast northern daylight just after rain, soft side light, fine atmospheric mist, practical calm confidence rather than extreme adventure
Color palette: charcoal basalt and gear, deep teal water, fog blue-grey, one restrained burnt-orange product accent
Materials/textures: wet volcanic rock, matte laminated folding panels, woven technical fabric, graphite paddle shaft, rippled seawater, fine water droplets
Composition/framing: keep every critical product feature inside the central 38 percent width and 18–80 percent height of each frame so the footage survives narrow phone, square watch, and foldable-screen masks; each frame must remain legible at thumbnail size
Constraints: exactly one kayak system per quadrant; no person in the first two quadrants; at most one distant adult in each lower quadrant; no visible face detail; no children; no text; no letters; no numbers; no signage; no logo; no watermark; no UI; no device frame; no decorative border; no grid gutters; no famous landmark; no identifiable real brand or location
Avoid: duplicate boats within a quadrant, extra paddles, malformed limbs or hands, close-up faces, luxury-fashion styling, extreme expedition danger, tropical water, dramatic storm, excessive spray, fisheye distortion, surreal cliffs, plastic toy surfaces, painterly rendering, inconsistent kayak shape or orange color
```

The initial result had a tiny yellow-green mark on the top-right kayak. It was removed with one Imagegen edit. Correction prompt, verbatim:

```text
Edit the supplied 2-by-2 folding-kayak storyboard master with one precise correction only: remove the tiny yellow-green mark from the burnt-orange kayak in the top-right quadrant and replace it with seamless matching plain burnt-orange folding-panel material. Preserve every other pixel-level visual choice as closely as possible: exact 2-by-2 layout, all four compositions, identical product shape and orange color, people shown only from behind, weather, basalt shore, water, framing, lighting, and resolution. Do not add text, letters, numbers, logos, labels, watermarks, extra hardware, extra people, extra boats, borders, gutters, or UI. The corrected top-right kayak must be entirely unbranded.
```

## Frame processing

The corrected 1672×941 master was split with these exact source crops. Each crop was scaled to 1280×720 with Lanczos resampling and encoded as JPEG with FFmpeg quality setting `-q:v 2`.

| Output | FFmpeg crop |
| --- | --- |
| `01-packed-frame.jpg` | `crop=836:470:0:0` |
| `02-unfolded-frame.jpg` | `crop=836:470:836:0` |
| `03-underway-frame.jpg` | `crop=836:470:0:471` |
| `04-carry-frame.jpg` | `crop=836:470:836:471` |

The bottom crops begin at `y=471` to exclude the master's one-pixel horizontal division.

Equivalent per-frame command:

```sh
ffmpeg -i folding-kayak-storyboard-master-source.png \
  -vf "crop=836:470:X:Y,scale=1280:720:flags=lanczos" \
  -q:v 2 OUTPUT.jpg
```

## Video processing

Each state is held for 48 frames with a restrained 2.4–2.64% center push-in. Adjacent states use 0.2-second dissolves at 1.4, 2.8, and 4.2 seconds. The return dissolve begins at 5.4 seconds and resolves completely to a static copy of the opening frame before the 5.8-second endpoint, preventing a ghosted last frame or a visible loop jump.

Exact filter graph:

```text
[0:v]zoompan=z='min(zoom+0.00050,1.024)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=48:s=1280x720:fps=30,setsar=1[v0];
[1:v]zoompan=z='min(zoom+0.00050,1.024)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=48:s=1280x720:fps=30,setsar=1[v1];
[2:v]zoompan=z='min(zoom+0.00055,1.0264)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=48:s=1280x720:fps=30,setsar=1[v2];
[3:v]zoompan=z='min(zoom+0.00050,1.024)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=48:s=1280x720:fps=30,setsar=1[v3];
[4:v]zoompan=z='1':x='0':y='0':d=48:s=1280x720:fps=30,setsar=1[v4];
[v0][v1]xfade=transition=fade:duration=0.2:offset=1.4[v01];
[v01][v2]xfade=transition=fade:duration=0.2:offset=2.8[v012];
[v012][v3]xfade=transition=fade:duration=0.2:offset=4.2[v0123];
[v0123][v4]xfade=transition=fade:duration=0.2:offset=5.4,
trim=duration=5.8,setpts=PTS-STARTPTS[vout]
```

Encode settings:

```text
-an -c:v libx264 -preset slow -crf 18 -profile:v high -level:v 4.0
-pix_fmt yuv420p -color_range tv -r 30 -movflags +faststart
```

The poster was extracted from the final encoded movie at 0.10 seconds:

```sh
ffmpeg -ss 0.10 -i folding-kayak-device-film.mp4 \
  -frames:v 1 -q:v 2 folding-kayak-device-poster.jpg
```

## Final probe

```text
index=0
codec_name=h264
profile=High
codec_type=video
width=1280
height=720
pix_fmt=yuv420p
color_range=tv
r_frame_rate=30/1
avg_frame_rate=30/1
nb_frames=174
duration=5.800000
size=1475774
bit_rate=2035550
```

`ffprobe` reported one video stream and no audio stream.

## Visual QA

- Inspected the corrected 1672×941 master and all four 1280×720 source frames at original resolution.
- Inspected final video frames at 0.000, 0.350, 1.750, 3.150, 4.550, and 5.766 seconds, each rendered at exactly 720×405. The final sampled frame is a clean packed-product frame with no carry-frame ghosting.
- Inspected the same sampled sequence at exactly 144×81 per frame. The orange/charcoal pack, unfolded hull, paddler-and-kayak silhouette, and carried pack remain distinguishable.
- Inspected center-safe device crops from every source frame: portrait `crop=405:720:437:0` and square `crop=720:720:280:0`. The packed, underway, and carry subjects remain fully centered. The wide unfolded hull intentionally becomes a close product-detail crop in the portrait mask while retaining the orange hull, black rim, fold construction, and cockpit cues.
- Confirmed: no visible words, logos, watermarks, UI, identifiable faces, children, famous landmarks, or real-brand identifiers.

## Factual declaration

Everything depicted is AI-generated and fictional: the kayak system, pack, people, campaign photography, weather, and location. This is not documentary footage, a photograph of a real product, a real customer, or a real trip. It makes no verified claim about foldability, performance, safety, materials, geography, or product availability. The two human figures are synthetic, distant, and shown only from behind; they do not represent identifiable people. Use this media as a visual demo asset, not as factual product evidence or safety guidance.

## SHA-256

```text
6da5ef22c68fa1ef2ea9f395575bb20754284583030b857273f94a166df8e280  01-packed-frame.jpg
e3ed022a3325c45e568c918629e625cf06166178547897320afbb9eff84e70b1  02-unfolded-frame.jpg
c6e7af244e4b51560445ec4ac86578b1c5189e5740f5e8ed3c14f8be74b40063  03-underway-frame.jpg
18dc246af5a808c99efa2f844909e76255c501e6d2eb65e7f78d0c6356bc5236  04-carry-frame.jpg
c35ba30b5d373457eeb5842b618c869817e878a83dbc71019d562cfe36f7408b  folding-kayak-device-film.mp4
384e732dbc0a38ba23d3a067fec2bc5875dd8761d93337b6e45f821036a5bdc6  folding-kayak-device-poster.jpg
45e772f02c04a633584806460906a564431a872c26e5cd34f7c3d2246ce1bad7  folding-kayak-storyboard-master-source.png
```
