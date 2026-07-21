# Draggable rigid-body poster pile assets

Generated on 2026-07-21 with OpenAI's built-in ImageGen tool for the local demo
`draggable-rigid-body-poster-pile`.

These four images are original AI-generated fictional festival-poster artworks. They
do not depict a real festival, brand, venue, event, or commissioned design. They are
used as the real image textures on p5-rendered rigid bodies, not as a decorative
background. Event titles, dates, numbering, and venues are added by the demo's Canvas
renderer so the generated bitmaps contain no pseudo-text.

## Final local files

| File | Final size | Role |
| --- | --- | --- |
| `orbit-screenprint.jpg` | 639 × 1000 JPEG | Warm, graphic orange/blue screenprint candidate |
| `acid-ribbon.jpg` | 639 × 1000 JPEG | Dark material-study candidate with acid-green film |
| `paper-signal.jpg` | 800 × 1000 JPEG | Cobalt/lavender overhead cut-paper candidate |
| `resin-bloom.jpg` | 800 × 1000 JPEG | Powder-pink macro resin/ink candidate |

The built-in PNG outputs were copied into the project by converting them to JPEG,
limiting the long edge to 1000 px, and using JPEG quality 88. The source generations
remain in the Codex generated-images store. All final assets are local and require no
runtime network request.

## Generation prompts

### `orbit-screenprint.jpg`

```text
Use case: stylized-concept
Asset type: portrait event-poster artwork used as a draggable card texture in a web interaction
Primary request: original graphic artwork for one poster in a fictional independent arts festival series
Scene/backdrop: edge-to-edge warm ivory paper field, no frame and no mockup
Subject: one huge vermilion-orange orbital disc intersected by a fine cobalt-blue arc and a small ultramarine square, with layered screenprint misregistration and a few translucent overlaps
Style/medium: Swiss-modernist editorial screenprint combined with risograph grain; bold, sophisticated, clearly legible at thumbnail scale
Composition/framing: vertical 4:5 composition; oversized central disc; preserve a clean narrow band near the top-left and a clean block near the bottom for real Canvas text to be overlaid later
Color palette: warm ivory, vermilion, cobalt blue, small charcoal accent
Materials/textures: tactile uncoated stock, subtle halftone and ink grain
Constraints: artwork only; absolutely no letters, words, numbers, logos, signatures, watermarks, brands, people, hands, device mockups, room setting, borders, curled paper, drop shadows
Avoid: fake typography, tiny decorative details, generic gradients, stock-photo look, duplicate motifs
```

### `acid-ribbon.jpg`

```text
Use case: stylized-concept
Asset type: portrait event-poster artwork used as a draggable card texture in a web interaction
Primary request: original graphic artwork for a second poster in a fictional independent arts festival series, visually very different from an orange geometric screenprint
Scene/backdrop: edge-to-edge near-black charcoal paper field, no frame and no mockup
Subject: a single sculptural ribbon of translucent acid-lime green film twisting vertically like an impossible loop, photographed with crisp studio highlights; a sparse constellation of tiny brushed-aluminum dots; no additional objects
Style/medium: experimental material-study photography combined with restrained editorial art direction; tactile, premium, bold at thumbnail scale
Composition/framing: vertical 4:5 composition; ribbon occupies the central and lower two-thirds; preserve a quiet top-left strip and a calm lower-right strip for real Canvas typography to be overlaid later
Lighting/mood: dark studio, precise rim lighting, high contrast, mysterious but clean
Color palette: charcoal black, acid lime, small cool-silver accents
Materials/textures: translucent gel film, brushed aluminum, subtle uncoated paper grain
Constraints: artwork only; absolutely no letters, words, numbers, logos, signatures, watermarks, brands, people, hands, device mockups, room setting, borders, curled paper, drop shadows
Avoid: fake typography, neon cyberpunk city, generic gradient, clutter, duplicate objects, stock imagery
```

### `paper-signal.jpg`

```text
Use case: stylized-concept
Asset type: portrait event-poster artwork used as a draggable card texture in a web interaction
Primary request: original graphic artwork for a third poster in a fictional independent arts festival series, clearly distinct from both an orange circle print and a dark acid-green ribbon
Scene/backdrop: edge-to-edge saturated cobalt-blue field, no frame and no mockup
Subject: an architectural stack of torn lavender and pale-cyan paper planes rising diagonally, with one coral-red circular cutout casting a crisp physical shadow through the stack
Style/medium: tactile cut-paper sculpture photographed from directly overhead, sharp Bauhaus editorial composition, large simple shapes, premium art-direction
Composition/framing: vertical 4:5; diagonal structure runs from lower-left toward upper-right; preserve an uncluttered top-left zone and a dark calm bottom band for real Canvas text to be overlaid later
Lighting/mood: hard directional gallery light, crisp paper shadows, confident and optimistic
Color palette: cobalt blue, lavender, pale cyan, one coral-red accent, small off-white highlight
Materials/textures: torn matte paper fibers, lightly embossed cardstock
Constraints: artwork only; absolutely no letters, words, numbers, logos, signatures, watermarks, brands, people, hands, device mockups, room setting, borders, curled poster corners
Avoid: fake typography, tiny decorative details, generic 3D render, confetti, stock imagery, duplicate motifs
```

### `resin-bloom.jpg`

```text
Use case: stylized-concept
Asset type: portrait event-poster artwork used as a draggable card texture in a web interaction
Primary request: original graphic artwork for a fourth poster in a fictional independent arts festival series, visually distinct from geometric screenprint, green film, and blue paper sculpture
Scene/backdrop: edge-to-edge soft powder-pink paper field, no frame and no mockup
Subject: one oversized obsidian-black ink bloom suspended in clear resin, spreading organically from the lower center, crossed by a narrow transparent amber glass rod; a single tiny crimson sphere near the top
Style/medium: macro material photography with Japanese editorial restraint; tactile, high-fashion cultural poster art, extremely clear silhouette at thumbnail scale
Composition/framing: vertical 4:5; dense organic form in lower two-thirds; broad quiet negative space across upper-left and a clean bottom-right corner for real Canvas typography later
Lighting/mood: soft diffuse gallery light with delicate caustics, calm, curious, elegant
Color palette: powder pink, obsidian black, transparent amber, tiny crimson accent
Materials/textures: resin, liquid ink, glass, fibrous matte paper
Constraints: artwork only; absolutely no letters, words, numbers, logos, signatures, watermarks, brands, people, hands, device mockups, room setting, borders, curled poster corners
Avoid: fake typography, smoke, flowers, faces, generic gradients, clutter, product packaging, stock imagery
```

## Visual QA

- No generated lettering, logos, signatures, watermarks, people, or real-world brand
  claims are present.
- Each image has a distinct large-scale silhouette and palette that remains recognizable
  when the full interaction is reduced to a 144 × 81 catalog card.
- Quiet zones and contrast were intentionally reserved for the real Canvas text layer.
- The outputs were reviewed for malformed object structure, duplicate motifs, unwanted
  mockup frames, and obvious synthetic text artifacts before integration.
