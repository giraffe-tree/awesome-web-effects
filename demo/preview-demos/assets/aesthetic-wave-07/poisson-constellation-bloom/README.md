# Harbor risk survey source

- File: `harbor-risk-survey.jpg`
- Generated: 2026-07-21 with the built-in ImageGen tool, then locally resized and encoded as a 960×640 JPEG.
- Purpose: functional evidence plate for `poisson-constellation-bloom`; this is a fictional coastal industrial site and not documentary imagery of a real location.

## Runtime use

The demo fetches the committed JPEG from the preview origin, verifies its exact byte length and SHA-256 digest, decodes it in the browser and through `p5.Image`, crops it to a 16:9 field, and samples a 80×45 pixel grid. Pixel hue, luminance and local contrast classify deterministic Poisson-disk nodes as runoff, water, utility or ground evidence. Those same measurements set node risk and edge weight, so the graph, risk finding and selected relationship cluster cannot be reproduced by removing or replacing the image.

## Generation brief

Create a fictional, photorealistic near-top-down aerial survey of a compact coastal industrial harbor. Use separable deep teal water, graphite infrastructure, pale concrete/ground, and a clear rust-orange runoff plume crossing toward a utility corridor. Keep the frame edge-to-edge and free of people, text, labels, logos, map overlays and watermarks. The regional colors must remain legible when downsampled for browser pixel analysis.

The selected built-in output was saved into the project and converted from its generated PNG to the committed JPEG. It is a project-specific generated source asset, not a stock or official photograph.
