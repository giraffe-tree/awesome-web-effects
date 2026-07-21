# Procedural Folding Kaleidoscope artwork

`wrapping-printmaster.jpg` is an original, AI-generated print artwork used by the `procedural-folding-kaleidoscope` demo as a functional raster input. The browser fetches and decodes this exact file, p5.js samples its pixels, and every visible kaleidoscope sector draws a crop from it. Pointer position changes the sampled crop; captured drag and fold controls change the alternating mirrored-sector topology. Local pixel measurements also drive the visible ink-coverage, luminance-delta, and press-readiness proof.

## Generation disclosure

- Generated with: OpenAI built-in ImageGen tool (default tool path; not the CLI/API fallback)
- Generation date: 2026-07-21
- Content status: AI-generated and fictional. It is not a scan from a real print studio, brand, packaging line, artist catalogue, or commercial pattern library.
- Rights/provenance intent: created specifically for this repository demo; no supplied third-party image was used as a reference or edit target.
- Runtime policy: the committed local JPEG is the only visual source. The demo does not call an image service or remote URL at runtime.

## Final prompt

```text
Use case: stylized-concept
Asset type: functional print artwork source for an interactive packaging kaleidoscope and folding proof demo
Primary request: Create a square flat printmaster artwork for premium wrapping paper, designed to yield clearly different symmetrical kaleidoscope results when sampled from different regions.
Scene/backdrop: edge-to-edge flat artwork only, no photographed environment, no product mockup, no frame.
Subject: a dense but controlled arrangement of hand-cut paper forms inspired by seed pods, folded leaves, fan pleats, small starbursts, concentric arcs, and registration-like dots; distribute several distinct motif clusters across the sheet so source-position sampling is visibly meaningful.
Style/medium: tactile screenprint and risograph collage, slightly imperfect ink edges, real paper grain, sophisticated editorial craft.
Composition/framing: square seamless-feeling print field, strong motifs reach all areas, no central logo or single focal object, enough local variation for mirrored wedge sampling.
Color palette: warm uncoated ivory paper, deep aubergine, tomato vermilion, electric cobalt, saffron, small mint accents.
Lighting/mood: evenly scanned print artwork, flat diffuse capture, no shadows or perspective.
Materials/textures: subtle fibrous paper, opaque layered inks, crisp silhouettes with minor print registration texture.
Constraints: no words, no letters, no numbers, no logos, no watermark, no human figure, no hands, no packaging object, no photographic room, no mockup perspective; every visible mark must belong to the printable pattern.
```

## File record and deterministic conversion

| Stage | Dimensions | Format | Bytes | SHA-256 |
| --- | ---: | --- | ---: | --- |
| Built-in ImageGen output | 1254 × 1254 | RGB PNG | 3,484,906 | `be699c75e25e9146a88871e5e72e6bbca9c13d5fffacd22429ea81efb07f50d6` |
| Committed runtime asset | 960 × 960 | JPEG, quality 84 | 578,402 | `ce776202b72992c05a4e41e03d2e5ddc4f89289dc4599833b802aadab66af6a6` |

Conversion was performed locally with the macOS image utility, with no crop, paint-over, compositing, or post-generation content edit:

```bash
sips -s format jpeg -s formatOptions 84 --resampleHeightWidth 960 960 \
  procedural-folding-kaleidoscope-original.png \
  --out wrapping-printmaster.jpg
```

The original PNG is not required at runtime. Its hash, dimensions, format, byte length, complete prompt, disclosure, and exact conversion are recorded here so the committed derivative can be audited. The runtime checks the committed JPEG byte length and SHA-256 before p5.js creates the image and draws any proof.

## Functional evidence expected at runtime

- One real `p5@2.3.0` instance and a responsive canvas filling the complete live-demo stage.
- Exact local JPEG SHA-256 and byte-length verification before ready.
- A decoded 960 × 960 `p5.Image`, 921,600 pixels, and 3,686,400 RGBA bytes.
- Whole-image pixel checksum, color-bucket count, and luminance range.
- More than 1,000 sampled pixels around the human-selected source point, producing the visible ink-coverage and contrast verdict.
- `2 × folds` clipped sectors with alternating mirrored topology; exactly `folds` sectors are mirrored.
- No autoplay, preview-clock mutation, rehearsal mode, fallback animation, or synthetic input dispatch.
