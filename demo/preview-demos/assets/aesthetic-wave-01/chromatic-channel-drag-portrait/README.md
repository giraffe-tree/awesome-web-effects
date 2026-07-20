# Chromatic Channel Drag Portrait · Raster Source

- Generated: 2026-07-21
- Generator: built-in `image_gen`
- File: `editorial-portrait-rgb-source.jpg`
- Output: 768 × 768 RGB JPEG, locally cropped from the generated 941 × 1672 PNG (`x=0`, `y=130`, `width=941`, `height=941`), then resized with Lanczos filtering and encoded as an optimized baseline JPEG
- Intended use: source pixels for the demo's true red, green, and blue channel extraction and screen-mode recomposition

## Provenance

This is an AI-generated portrait of an entirely fictional adult creative professional. It is not documentary photography and does not depict a real person, customer, employee, public figure, or famous person. It must not be assigned a real identity or presented as evidence of a real individual.

No text, logo, watermark, jewelry, props, or remote dependency is embedded in the image. The prompt explicitly prohibits resemblance to a famous person.

## Final prompt

```text
Use case: photorealistic-natural
Asset type: source portrait for a 320×180 interactive web demo that separates RGB color channels under pointer drag
Primary request: a photorealistic editorial portrait of one fictional adult creative professional, designed so red, green, and blue channel offsets clearly reveal facial and hair contours
Scene/backdrop: seamless matte charcoal studio backdrop, uncluttered
Subject: one fictional adult, head and shoulders only, calm neutral expression, mostly frontal with a very slight three-quarter turn, natural skin and hair texture, simple unbranded dark crew-neck garment
Style/medium: refined contemporary editorial photography, realistic rather than conceptual
Composition/framing: vertical portrait crop, face centered with generous margin around hair and shoulders, full head visible, strong clean silhouette, eyes near the upper third; suitable for later cropping into a tall card
Lighting/mood: one crisp cool side light and a soft warm fill, controlled contrast, distinct edge highlights around face and hair, quiet and intelligent mood
Color palette: neutral skin, charcoal, restrained cool and warm highlights; enough tonal separation for RGB-channel displacement
Constraints: exactly one person; no text; no letters; no numbers; no logo; no watermark; no jewelry; no props; no hands; no background objects; no frame or UI chrome; no famous-person resemblance; realistic pores and hair, no plastic retouching
Avoid: beauty-ad gloss, neon cyberpunk styling, colored gels covering the whole face, extreme expression, cropped forehead, distorted facial features, duplicate facial parts
```

## Mechanism role

The JavaScript reads this file's actual pixels, builds separate red-only, green-only, and blue-only raster buffers, and recomposes them with `screen` blending. Pointer, touch, and keyboard input separate the red and blue buffers around the fixed green registration layer; releasing input springs all three buffers back into exact alignment. The image is the mechanism's data source, not decoration, so removing it would invalidate the effect.
