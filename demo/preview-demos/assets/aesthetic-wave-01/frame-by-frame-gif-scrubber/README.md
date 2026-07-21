# Frame-by-frame GIF scrubber assets

Original, AI-assisted assets for the `frame-by-frame-gif-scrubber` demo. The final GIF is a fictional motion-design QA sample, not a recording of a real product, brand, or location.

Generated on 2026-07-21 with the built-in OpenAI ImageGen tool. Two independent ImageGen calls produced the studio background plate and the isolated folded-paper subject. The subject was generated against a chroma-key background and processed locally with the installed ImageGen `remove_chroma_key.py` helper. The final short GIF was then derived deterministically with Pillow; no external imagery or remote runtime dependency is used.

## Files and use

- `studio-base.jpg` — 960 × 640 px, 3:2; generated studio background and derivation source.
- `kinetic-marker-chroma.png` — 720 × 720 px; mechanically resized chroma-key generation retained as source/provenance.
- `kinetic-marker.png` — 720 × 720 px RGBA; locally extracted moving subject used in the GIF composite.
- `occlusion-check.gif` — 480 × 320 px, 12 frames, 1,210 ms; disposal-aware animation inspected by the demo.

`occlusion-check.gif` SHA-256:

```text
d9541344f4edc43a137a0e68a856183173463adca25d7cc59aeac33e3c0e2b77
```

## Deterministic GIF derivation

The background plate was resized to 480 × 320. The extracted subject's visible bounds were cropped and scaled to fit within 176 × 126. Across 12 frames, its center follows a smoothstep horizontal path from x=66 to x=414, a ±13 px sinusoidal vertical path, and a ±5.5° sinusoidal rotation.

Each frame composites, in order:

1. the generated studio plate and fixed one-pixel alignment rails;
2. an 18%-opacity subject echo;
3. a 34%-opacity, 7 px Gaussian-blurred subject shadow;
4. the opaque extracted subject;
5. a semi-transparent ribbed glass panel;
6. two opaque foreground gates that create explicit occlusion boundaries;
7. three deterministic hub glints that make subtle temporal differences inspectable.

Frame delays in milliseconds:

```text
140, 80, 70, 90, 60, 180, 60, 70, 90, 70, 80, 220
```

Graphics Control Extension disposal methods:

```text
1, 1, 2, 2, 1, 1, 2, 2, 1, 1, 2, 2
```

Pillow's optimized GIF writer was used with an infinite loop declaration. The demo does not trust handwritten metadata: it fetches the committed GIF bytes, parses every Graphics Control Extension and image descriptor, decodes complete disposal-composited frames with the browser `ImageDecoder`, reads native frame timing, and computes a pixel checksum for each decoded frame.

## Full ImageGen prompts

### `studio-base.jpg`

```text
Use case: photorealistic-natural
Asset type: base plate for a browser-based frame-by-frame GIF compositing and occlusion QA tool
Primary request: create an original contemporary motion-design studio background plate with no moving subject
Scene/backdrop: a wide dark slate cyclorama with a pale mineral floor, viewed straight on; restrained cyan light from the left and warm coral light from the right; subtle atmospheric depth
Subject: an empty low brushed-aluminum plinth centered in the lower third, with generous clear travel space across the middle for a composited object
Style/medium: high-end editorial still-life photography, tactile real materials, precise art direction, subtle film grain
Composition/framing: wide 3:2 landscape, symmetrical but not sterile, a clean uninterrupted horizontal motion corridor from left to right, strong readable depth at thumbnail scale
Lighting/mood: controlled studio lighting, analytical, calm, premium, with soft pools of cyan and coral light
Color palette: graphite, mineral gray, muted cyan, restrained coral, warm off-white
Materials/textures: brushed aluminum, fine mineral floor, matte cyclorama
Constraints: fictional studio; original image; background plate only; empty motion corridor; no people, animals, vehicles, objects on the plinth, pillars, vertical bars, text, letters, numbers, logos, watermark, UI, border, collage, or multiple panels
Avoid: product branding, busy props, futuristic spaceship, neon cyberpunk, dramatic fog, excessive blur, lens flare, impossible geometry
```

### `kinetic-marker-chroma.png`

```text
Use case: product-mockup
Asset type: isolated moving subject for a browser-based frame-by-frame GIF compositing and occlusion QA tool
Primary request: create one original folded-paper kinetic sculpture shaped like a compact winged survey marker, designed to travel horizontally across a studio scene
Scene/backdrop: a perfectly flat, solid #00ff00 chroma-key background for background removal
Subject: one centered, fully visible origami-like sculpture with a wide diamond silhouette, layered ivory and safety-orange paper planes, a small matte cobalt circular hub, no separate loose pieces
Style/medium: premium still-life product photography of a real paper sculpture, crisp tactile folds, plausible geometry
Composition/framing: square-friendly centered isolation, straight-on slight three-quarter angle, generous uniform padding on every side, silhouette readable at 40 pixels
Lighting/mood: soft neutral studio lighting confined to the subject
Color palette: warm ivory, safety orange, cobalt blue; do not use green anywhere in the subject
Materials/textures: thick folded paper, matte painted metal hub
Constraints: background must be exactly one uniform #00ff00 color with no shadows, gradients, texture, floor plane, reflection, or lighting variation; subject fully separated from background; crisp edges; no cast shadow, no contact shadow, no people, hands, support wires, text, letters, numbers, logos, watermark, border, collage, or multiple panels
Avoid: green tint or green reflections on the subject, translucent materials, feathers, fabric, hair, motion blur, complex holes, tiny parts, fantasy creature anatomy
```

