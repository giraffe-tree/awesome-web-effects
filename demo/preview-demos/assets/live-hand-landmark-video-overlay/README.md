# Live hand landmark video overlay assets

These local assets support the `live-hand-landmark-video-overlay` preview demo. The depicted hand is an AI-generated, fictional calibration sample. It is not a real patient, live-camera capture, or biometric record.

## Source plate

- File: `hand-open-calibration-source.jpg`
- Purpose: anatomically legible source plate for a local wrist-mobility calibration exercise
- Generated with: built-in ImageGen tool
- Generation date: 2026-07-21
- Original generation: 1672 × 941 PNG
- Final local source: 960 × 540 JPEG
- SHA-256: `b5dbfa6e539d6dcef5979492500a2ee92b3ef89a415714d4c9e3d81fa4acd013`

Full generation prompt:

```text
Use case: photorealistic-natural
Asset type: source plate for a local hand-rehabilitation motion calibration video with a 21-landmark overlay
Primary request: an anatomically plausible fictional adult right hand performing a neutral open-hand wrist-mobility calibration pose, shown alone with no identifiable person
Scene/backdrop: clean matte deep navy rehabilitation exercise mat, nearly uniform and uncluttered, subtle fine-grain texture only
Subject: right hand and short distal forearm only, palm facing the camera, wrist entering from the bottom center, thumb on the viewer's left, all five fingers naturally separated and gently extended, joints clearly readable, relaxed therapeutic pose
Style/medium: photorealistic clinical editorial photography, realistic skin texture, natural proportions, unretouched but neutral
Composition/framing: strict overhead camera, landscape 16:9 composition, hand centered, fingertips near the upper middle, wrist near the lower middle, generous dark negative space around the full silhouette, entire hand and wrist visible without cropping
Lighting/mood: soft controlled therapy-studio light from upper left, gentle dimensional shadows, high edge contrast against the dark mat, calm and non-dramatic
Color palette: warm neutral skin, deep navy background, pale sage fabric cuff at the wrist
Materials/textures: realistic skin creases and fingernails, soft woven cuff, fine matte exercise-mat texture
Constraints: exactly one anatomically correct hand with exactly five complete fingers; no extra, missing, fused, duplicated, or cropped digits; no face, head, torso, identifying body features, tattoos, scars, jewelry, nail polish, logos, text, letters, numbers, watermark, UI, tracking dots, skeleton lines, medical devices, or props; fictional calibration sample, not a real patient
Avoid: glamour photography, dramatic color grading, distorted hands, macro crop, bent or occluded fingers, busy clinic background, stock-photo gestures, visible identity
```

## Derived video

- File: `wrist-sweep-calibration.mp4`
- Purpose: deterministic, local, user-controlled wrist-sweep motion sample
- Format: H.264 MP4, 960 × 540, 15 fps, 45 frames, 3.000 seconds, no audio
- File size: 650,861 bytes
- SHA-256: `1adbdd03356e4570087ac784b2f7faf59a3df93e913f7fb894a63a1d9646367f`

Exact derivation command, run from this directory:

```sh
ffmpeg -y -loop 1 -framerate 15 -i hand-open-calibration-source.jpg \
  -vf "rotate=0.10*sin(2*PI*t/3):ow=iw:oh=ih:c=0x07192d,format=yuv420p" \
  -t 3 -r 15 -c:v libx264 -preset slow -crf 18 \
  -g 15 -keyint_min 15 -sc_threshold 0 -movflags +faststart -an \
  wrist-sweep-calibration.mp4
```

The fixed 15-frame GOP creates seek points at 0, 1, and 2 seconds so direct human scrubbing does not depend on decoding from a single opening keyframe.

## Landmark derivation

The JavaScript source contains 21 hand-labeled coordinates aligned to the generated source plate. For video frame `f` at 15 fps, every point is rotated around `(480, 270)` by:

```text
angle(f) = 0.10 × sin(2π × (f / 15) / 3)
```

The formula matches the video transform exactly. User calibration offsets are then added to the transformed coordinates. No live hand detector, webcam, network inference, or hidden fallback is used.
