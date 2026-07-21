# Roof regeneration atlas

`roof-regeneration-atlas.jpg` is a fictional top-down green-roof field plot generated for the `cellular-automata-hover-bloom` runnable demo. It is not stock photography and does not depict a real site.

## Generation

- Tool path: OpenAI built-in ImageGen (`gpt-image-2` service path), 2026-07-21.
- Use case: `scientific-educational`.
- Generated source: 1536 × 1024 PNG.
- Committed derivative: 960 × 640 JPEG, quality 88, encoded locally with macOS `sips`.
- Committed file size: 461,364 bytes.
- Exact committed-file SHA-256: `1072ce13e2e5c01aa72879efce186a04c2db8bf1dacfdfbc117132d494620c78`.

Final prompt:

> Create a fictional but visually credible top-down urban green-roof regeneration test plot for an ecological cellular automata lab. The image must provide clear pixel evidence zones: dense healthy moss and sedum in cool teal/green, stressed dry substrate in warm ochre/rust, dark damp channels, and pale concrete maintenance lanes. Arrange these as organic contiguous regions with several clear boundaries and a few small circular inspection markers, so downsampled color values can determine viable seeding cells, moisture/growth rate, and heat-risk. High-end aerial scientific field photography; exact 3:2 landscape; straight top-down orthographic view; diffuse overcast light; deep forest green, jade, muted cyan, clay ochre, rust, charcoal wet channels, warm ivory concrete. No people, readable text, logos, watermark, UI chrome, border, or tiny noisy checkerboard pattern. Regions must remain recognizable at 96 × 64.

## Functional role

The browser fetches this exact same-origin JPEG, verifies its byte SHA-256, decodes it with `Image.decode()`, draws the 960 × 540 center crop into a 96 × 54 offscreen canvas, and reads all 5,184 RGBA pixels through `getImageData()`.

Each 2 × 2 sample block becomes one cell in the 48 × 27 experiment grid. Its measured RGB values determine:

- seed admission / viability;
- local moisture;
- heat stress;
- pale service-lane exclusion;
- the survival and birth thresholds used by each manual generation step.

The JPEG is also decoded by p5.js and drawn underneath the aligned cellular field. Removing or replacing the asset therefore changes both the visible site and the experiment rules; it is not a decorative backdrop.

The exact source-byte digest is a runtime identity gate. The derived browser-decoded pixel digest is still computed and exposed as evidence, but validation only requires a 64-character non-zero digest plus robust color, luminance, and zone-count ranges. JPEG decode and Canvas resampling can vary slightly between browser/rendering platforms, so the derived digest is deliberately not asserted against one machine's value.
