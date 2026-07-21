# Radial calendar time zoom — generated functional asset

This directory is exclusive to `radial-calendar-time-zoom`.

## Disclosure and role

`studio-occupancy-atlas.jpg` is an AI-generated, wholly fictional architectural/operations visualization. It does not depict a real studio, people, organization, occupancy measurement, or live availability. The browser visibly displays this local file, samples its actual pixels into a 96×64 canvas, and derives the twelve radial booking-slot states from the sampled sector colors and luminance. It is therefore a functional input to the demo, not decorative background art.

Generation used the built-in OpenAI ImageGen tool on 2026-07-21 (Asia/Shanghai).

## Complete prompt

```text
Use case: productivity-visual
Asset type: functional local image input for an interactive radial venue-booking calendar demo
Primary request: Create a polished, fictional top-down occupancy map of a circular multi-purpose studio called no real brand. It should look like a credible architectural/operations visualization derived from an overhead camera: a central pale circular floor, twelve clearly separated wedge-shaped perimeter bays arranged like a clock, with visibly different occupancy densities and light levels. Some bays are open and bright sage/ivory, some limited in warm amber, and a few blocked in deep coral/charcoal. People may appear only as tiny abstract overhead silhouettes, never as recognizable individuals. The image will be pixel-sampled around the ring to compute availability, so the twelve sectors need strong, distinct, clean color/luminance signals at their middle radii.
Scene/backdrop: dark navy operations-map surround with subtle fine grid; the circular site fills most of the frame with generous edge clearance.
Subject: one readable circular venue plan with twelve radial bays and a calm empty center.
Style/medium: premium editorial architectural visualization, realistic material texture blended with restrained data-visualization clarity; not a UI screenshot.
Composition/framing: exact top-down, centered circle, landscape 3:2, no perspective tilt, no cropping of the circle.
Lighting/mood: calm late-afternoon operations desk, controlled contrast, precise and trustworthy.
Color palette: deep navy background; ivory and sage available sectors; amber limited sectors; coral and charcoal blocked sectors.
Materials/textures: terrazzo floor, pale oak dividers, subtle glass partitions; retain clean sector boundaries.
Constraints: no readable text, no numbers, no letters, no logos, no watermark, no UI chrome, no calendar labels, no real company or real location, no photorealistic faces. The twelve wedge sectors must remain visually distinguishable after downscaling to 960 pixels wide.
Avoid: decorative gradients that blur sector classification, indistinct sector boundaries, isometric view, perspective view, extra circles, brand marks, illegible pseudo-text.
```

## Files and conversion record

| Stage | Dimensions | Format | Size | SHA-256 |
| --- | ---: | --- | ---: | --- |
| Built-in ImageGen source | 1536×1024 | PNG | 2,759,365 bytes | `320528a71e5bde5a2c953175062c3ffc8871e1cd23c1b0d9147b43972e00ea49` |
| Committed derivative `studio-occupancy-atlas.jpg` | 960×640 | JPEG | 176,900 bytes | `da602594965cf7c28078fabb04edc20bfad72e243ac62778a868f143c5cd5989` |

The source PNG was generated at the ImageGen default project-independent location, copied to a local staging file, and converted without cropping using macOS `sips`:

```bash
sips -s format jpeg -s formatOptions 82 -z 640 960 radial-calendar-source.png --out studio-occupancy-atlas.jpg
```

The source PNG is not required at runtime. The committed JPEG is the sole visual and pixel-sampling input; its exact SHA-256 is asserted in the browser before the demo becomes ready.
