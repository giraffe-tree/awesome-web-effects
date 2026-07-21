# Pointer-woven ribbon loom material source

`loom-material-calibration.jpg` is a fictional AI-generated textile calibration master used as functional input for demo #113. It is not a photograph of a real commercial fabric and contains no brand or identifying marks.

## Identity

- Project asset: `loom-material-calibration.jpg`
- Dimensions: 960 × 640
- Bytes: 469,833
- SHA-256: `4086ae488153382f68c8697c4de0f53625ea10d39cf8b8df9a06cf8e25843159`
- Original generated PNG: `/Users/giraffetree/.codex/generated_images/019f8410-0c38-7452-955f-71b72a06a23f/exec-bcc08ac6-ccdf-4b82-9a80-19083c5c40cf.png`
- Original dimensions: 1536 × 1024
- Original bytes: 4,054,723
- Original SHA-256: `ff3a4bb4d6ed16af74d471d9ec8c40f62d814248ae17874622936ac820586afe`

## Generation prompt

> Use case: product-mockup
>
> Asset type: functional source raster for an interactive p5.js woven-ribbon loom calibration demo
>
> Primary request: Create a highly polished overhead macro photograph of one fictional textile calibration swatch laid flat on a dark warm-charcoal worktable. The swatch fills nearly the entire 3:2 landscape frame and contains four continuous woven material zones from left to right: dense indigo diagonal twill, looser warm ochre plain weave, muted coral satin with broad highlights, and cool sea-green crossweave. Let the threads visibly interlace across zone boundaries so it reads as one physical loom proof, not four separate cards. Include a subtle centered shuttle-shaped gap or pale opening in the weave, with no object placed on top.
>
> Style/medium: realistic editorial textile photography, tactile cotton/silk fibers, visible warp and weft microstructure, restrained contemporary material lab aesthetic
>
> Composition/framing: exact overhead flat lay, edge-to-edge cloth with only a narrow dark perimeter, strong full-frame coverage, large readable texture bands, no empty background, useful when downsampled to 96×54 and 320×180
>
> Lighting/mood: soft raking studio light that reveals thread relief without deep crushed shadows, calm precise craft inspection
>
> Color palette: deep indigo, warm ochre, muted coral, sea-green, bone fiber highlights, dark charcoal perimeter
>
> Constraints: no people, hands, tools, labels, letters, numbers, rulers, logos, brands, watermark, signature, UI, frames, cards, collage seams, loose yarn tangles, buttons, needles, or text; the fabric itself must provide clearly different directional edge density, saturation, luminance, and weave frequency in each zone so real sampled pixels can drive warp count, weft count, twill angle, tension, friction, and palette
>
> Avoid: abstract digital gradient, CGI neon, flat vector pattern, decorative background without measurable thread structure, pseudo-text, repeated impossible knots

## Conversion

```sh
sips -z 640 960 -s format jpeg -s formatOptions 88 exec-bcc08ac6-ccdf-4b82-9a80-19083c5c40cf.png --out loom-material-calibration.jpg
```

## Functional role

The browser verifies the JPEG byte length, decoded dimensions, and exact SHA-256. It then crops the textile field to a 96 × 54 evidence canvas and measures real luminance variation, saturation, horizontal/vertical edge energy, and regional palettes. Those measurements derive four materially distinct warp counts, weft counts, angles, tension/friction values, and `OPEN` / `BALANCED` / `TIGHT` outputs. The live p5 renderer consumes those values directly.

Exact identity assertions protect the source asset. Derived-pixel assertions deliberately use meaningful ranges and cross-region diversity instead of a brittle exact decoded-pixel hash, because browser JPEG decoders may differ slightly.
