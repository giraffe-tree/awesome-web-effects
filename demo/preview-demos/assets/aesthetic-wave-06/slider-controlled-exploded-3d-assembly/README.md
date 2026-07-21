# Slider-controlled exploded 3D assembly — local material asset

This directory is exclusive to `slider-controlled-exploded-3d-assembly`.

## `basalt-composite-calibration.jpg`

- Purpose: a real bitmap material input for the p5 WebGL `power-shell` and `service-latch` geometry of the fictional FBL-06 portable field beacon. The runtime fetches the checked-in file from the same origin, decodes it, verifies its SHA-256, samples 128×128 pixels, copies those pixels into a `p5.Image`, and applies that image as the texture of the named 3D parts. The material swatch in the inspection card is secondary evidence; this file is not used as a page background.
- Generation method: OpenAI built-in ImageGen tool (`image_gen` default built-in mode), generated 2026-07-21 Asia/Shanghai.
- Built-in tool result: success; generated result file `exec-3d83aa36-5efe-4c36-b59f-b74b46d240cf.png`.
- Original tool output: PNG, 1254×1254, SHA-256 `90878d081dc90ed8bfa48f5a560bd3cf6024a76046bbb983868d91e796772402`.
- Checked-in derivative: JPEG, 640×640, 178411 bytes, converted locally with macOS `sips` at JPEG quality 88.
- Checked-in SHA-256: `f1ef3b959a2f2e0d73ff718db8a4da5ffc560adb185751f3e9c241df9b992e5a`.
- Source/rights note: original AI-generated fictional material made for this repository; it does not depict or document a real manufacturer, product, certification, brand, or measured engineering specimen. No third-party image source was used.
- Visual inspection: uniform edge-to-edge graphite basalt-fiber weave; restrained copper/mineral flecks; no words, digits, logo, trademark, watermark, product silhouette, or obvious structural artifact.

## Full generation prompt

```text
Use case: product-mockup
Asset type: seamless material calibration texture for a browser-rendered 3D product assembly demo
Primary request: create an original square orthographic material texture of matte graphite-black basalt-fiber reinforced polymer used on a fictional rugged portable field beacon shell
Scene/backdrop: the material surface fills the entire frame edge to edge
Style/medium: highly realistic macro product-material photography, physically plausible, restrained premium industrial design
Composition/framing: perfectly flat straight-on orthographic view, uniform scale, seamless/tileable edges, no perspective and no object silhouette
Lighting/mood: neutral diffuse calibration lighting with very low shadow, no vignette, no directional glare
Color palette: charcoal graphite, near-black, sparse warm copper and cool mineral micro-flecks
Materials/textures: fine diagonal basalt-fiber weave, subtle molded polymer grain, tiny realistic manufacturing variation, moderately low contrast so UI geometry remains legible
Constraints: one continuous material only; must tile convincingly; no product, no seams, no screws, no labels, no text, no digits, no logos, no trademarks, no watermark, no border
Avoid: carbon-fiber checkerboard cliché, glossy automotive finish, dramatic lighting, fabric folds, scratches that resemble letters, obvious repeating motif
```

## Runtime evidence contract

The demo's `__PREVIEW_RUNTIME_ASSERT__` rejects the preview unless all of the following remain true:

- the requested and response URLs are same-origin;
- exactly one explicit `fetch()` succeeds and the decoded asset is 640×640;
- Web Crypto reports the checked-in SHA-256 above;
- 16,384 sampled pixels produce a non-zero checksum, at least five restrained dark-material luminance buckets, and meaningful chroma variation;
- the sampled pixels are copied into a 128×128 `p5.Image` with the same checksum;
- p5 WebGL applies that texture to the semantic `power-shell` and `service-latch` parts.
