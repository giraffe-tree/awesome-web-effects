# One-source Video Look Study

- Generated: 2026-07-21
- Generator: built-in `image_gen`
- Master: `look-master-source.jpg` — 1280 × 720 baseline RGB JPEG
- Derived media: `look-master-push-in.mp4` — 1280 × 720 H.264, 30 fps, 90 frames, 3 seconds, muted
- Use: the one shared media source behind all five code-applied looks in the hover-rehearsal rail

## Provenance

The adult dancer, architecture, and scene are AI-generated and entirely fictional. This is not documentary footage and does not depict a real person, building, campaign, client, or film production. The media contains no embedded text, logos, brands, signage, or watermark.

## Final image-generation prompt

```text
Use case: photorealistic-natural
Asset type: master 16:9 source frame for an interactive video color-grading style rail; the exact same frame will appear under five different code-applied looks and may be converted locally into a subtle 3-second pan-and-zoom video
Primary request: a restrained cinematic editorial frame of one fictional adult dancer in a flowing burnt-orange coat crossing a monumental rain-darkened concrete atrium; the person is mid-stride and clearly readable at small thumbnail size
Scene/backdrop: modern brutalist cultural space after rain, broad concrete planes, one shallow reflecting surface, distant mist-softened opening to pale sky
Subject: one adult dancer, full figure, natural proportions and believable motion, burnt-orange coat creating a strong consistent color reference; no other people
Style/medium: photorealistic natural cinematography, premium independent film still, tactile real-world texture, subtle 35mm grain, not glossy advertising CGI
Composition/framing: wide 16:9 landscape; dancer slightly right of center and occupies roughly one third of image height; clear architectural lines and foreground reflections provide recognizable anchors for comparing multiple looks; keep bottom 22% low-detail and dark enough for a compact HTML style rail; preserve safe margins around the figure for a subtle code-driven push-in
Lighting/mood: cool overcast daylight with one soft warm shaft grazing the coat, contemplative, tactile, believable
Color palette: neutral graphite concrete, pale fog blue, burnt orange coat, soft silver reflections; balanced source grade with recoverable highlights and shadows so code filters can visibly create warm, cool, faded, and monochrome looks
Materials/textures: wet concrete, woven fabric, shallow water reflection, fine mist
Constraints: this is the single identical mechanism input for every look; one adult only; no embedded UI, captions, text, letters, numbers, logos, signage, brands, watermark, borders, crop marks, duplicated limbs, distorted hands, impossible reflection, or extra architecture subjects
Avoid: fashion campaign gloss, neon cyberpunk, surreal geometry, extreme orange-and-teal grade, over-saturated color, heavy bokeh, close-up face, crowd, busy props
```

## Local derivation

The generated 1672 × 941 RGB PNG was scaled/cropped with ffmpeg to the 1280 × 720 master JPEG, with metadata removed. That exact JPEG was then looped through ffmpeg's `zoompan` filter (`zoom + 0.0005`, capped at `1.045`) and encoded once with `libx264`, `yuv420p`, CRF 21, `+faststart`, and no audio. No independently generated look videos exist.

## Mechanism role

The canvas draws frames from this single MP4 and applies only code-side filters/tints. Hover starts that source at frame zero under a temporary look; leaving pauses, rewinds, and restores the committed look; click/tap or keyboard activation commits and centers the chosen grade. Removing either the master or its same-source video derivative invalidates the comparison mechanism.
