# Field node acceptance reference

This directory contains the original fictional hardware photograph used by
`scroll-stitched-isometric-blueprint` as an as-built acceptance target and as
the real pixel source for the five module material samples.

## Generation disclosure

- Generated: 2026-07-21 (Asia/Shanghai)
- Tool path: built-in ImageGen (`gpt-image-2` service path exposed by Codex)
- Use-case taxonomy: `product-mockup`
- Fictional/AI disclosure: this is an AI-generated, fictional edge-computing
  field node. It is not a photograph of a real product, deployment, company,
  or monitoring station.
- Generated result identifier:
  `019f82f1-5d44-7182-b247-8122b575fbee/exec-eff75fe2-3bdf-4f29-b149-b57f6cee04be.png`
- Original generated PNG: 1536 × 1024 px, RGB, 2,163,519 bytes
- Original PNG SHA-256:
  `5b897fbeec917881dd1b2d7128198dab0acd164da0e1c017648d2f56086cc035`
- Committed derivative: `field-node-acceptance.jpg`
- Committed dimensions: 960 × 640 px, baseline RGB JPEG, 162,992 bytes
- Committed SHA-256:
  `133ab6080f9c43f720c1c681445b55bb3f82994a724e7910c2e38300c649c424`

## Final prompt

```text
Use case: product-mockup
Asset type: completion-reference photograph consumed by an interactive isometric edge-hardware assembly demo
Primary request: an original, fictional compact rugged edge-computing field node shown fully assembled on a dark technical workbench, visibly composed of five believable layers: black shock-isolated base rail, copper-toned power and thermal module, graphite compute chassis, cyan-accented network switch with ports, and a slim dark telemetry cap with two short antenna stubs
Scene/backdrop: restrained industrial commissioning bench inside a remote coastal monitoring station, shallow background detail only
Subject: one coherent vertical edge node, product-sized rather than a room-scale server rack, with each module boundary visually legible and physically plausible
Style/medium: photorealistic editorial industrial product photography, original fictional hardware
Composition/framing: landscape 3:2 frame, three-quarter front view, the complete node centered slightly right with generous dark negative space around its silhouette; all five layers visible even at thumbnail scale
Lighting/mood: cool overcast ambient light plus a narrow warm inspection light, quiet precise commissioning mood
Color palette: graphite black, oxidized copper, muted cyan, tiny amber status lights
Materials/textures: powder-coated aluminum, brushed copper heat sink, rubber isolation feet, braided cable, realistic machining and wear
Constraints: no people; no hands; no brand names; no logos; no readable text; no watermark; no floating or exploded parts; no extra rack; no impossible cable intersections; no glossy sci-fi styling; make the module stacking order and material differences unmistakable
Avoid: concept-art rendering, neon cyberpunk, screen UI overlays, labels, typography, duplicated ports, warped hardware geometry
```

## Derivation and functional use

1. The built-in ImageGen output was inspected at full resolution for the five
   layer boundaries, cable continuity, duplicated geometry, text, logos, and
   watermark artifacts.
2. macOS `sips` resized the generated PNG to exactly 960 × 640 px and encoded
   it as JPEG with format quality 84:

   ```text
   sips -z 640 960 -s format jpeg -s formatOptions 84 <generated.png> --out field-node-acceptance.jpg
   ```

3. The demo fetches the committed JPEG from its own origin, verifies the exact
   byte length and SHA-256, decodes it at 960 × 640, and draws those pixels to a
   96 × 64 offscreen canvas. In source-browser QA the resulting 24,576-byte
   RGBA buffer had SHA-256
   `3e0f15bf70532094c49bfefb20900e05b24b57bd5410de6d45f663719785b51e`.
   The committed JPEG byte SHA is the portable identity check: JPEG decoding
   and Canvas resampling can differ by a few channel values across renderers,
   so runtime admission verifies the full opaque sample size, five disclosed
   material regions, distinct colours, binding, and a 64-character derivative
   digest instead of treating the QA digest as a cross-platform file identity.
4. Five fixed, disclosed image regions are sampled in dependency order: base
   rail, power/thermal module, compute chassis, network switch, and telemetry
   cap. Their actual averaged RGB values color the corresponding CSS3D module,
   checkpoint, and material swatch.
5. The same committed pixels remain visible in the as-built proof card. Human
   assembly progress reveals the color reference from the bottom layer upward;
   the final `5 / 5 · node online` state therefore proves both ordered geometry
   completion and visual agreement with the fictional acceptance target.

The photo is not a decorative background and no prompt-derived colors are
hard-coded as a substitute for reading the submitted file.
