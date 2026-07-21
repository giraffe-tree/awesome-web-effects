# DOM-synced shader plane registration asset

- File: `museum-media-registration.jpg`
- Final format: JPEG, 960 × 600, 132,620 bytes
- SHA-256: `217bc3ea171d79543115d14c2b124dee525074ad89cd9679167575db84b9d7a1`
- Generated: 2026-07-21 with the built-in ImageGen tool
- Use case: `dom-synced-shader-planes`

## Generation intent

The image depicts a fictional cobalt-glass museum media installation with a warm amber focal panel. Its strong verticals, rectangular focal target, reflections, and high blue/amber separation remain legible at the 320 × 180 catalog scale and make DOM-to-GPU registration drift easy to see. The generation prompt explicitly excluded people, logos, watermarks, captions, UI chrome, and pseudo-text.

Final prompt:

> Create a cinematic editorial photograph of a contemporary museum media installation: a cobalt-blue translucent glass pavilion standing in a pale concrete gallery, with a single warm amber rectangular light panel reflected on a shallow polished floor. Landscape 3:2; center the architectural subject and give all four quadrants crisp straight edges that stay readable at 320 × 180. Use quiet late-evening museum light, deep navy shadows, cobalt glass, warm amber focus, and high tonal separation. No people, text, letters, numbers, logos, watermarks, UI chrome, frames, borders, fake captions, distorted architecture, or excessive detail.

## Functional role

The committed JPEG is not decorative background art. The browser decodes the exact file, Curtains.js uploads it as the plane's `uMedia` sampler, and the same decoded pixels are sampled on a 64 × 40 grid. Tonal range, blue-field ratio, warm-target ratio, and edge energy determine the shader inspection energy. The runtime also verifies the exact byte length and SHA-256, confirms a single texture is bound to the Curtains.js plane, and compares the DOM rectangle with the library's plane and WebGL bounds after every trusted move, resize, or layout change.

## Visual review

The final asset was checked at full size and reduced preview size. The architecture has coherent geometry, crisp registration-friendly edges, no visible watermark or logo, no generated text, no people, and no anatomy concerns. The image represents a fictional editorial scene rather than a real institution or documented location.
