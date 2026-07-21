# Coastal emergency relay survey asset

`coastal-emergency-relay-survey.jpg` is an original fictional source image generated for the `signed-distance-neon-metaballs` preview. It does not depict a real emergency site, organization, operation, or survey.

## Generation

- Tool: built-in OpenAI ImageGen
- Use-case taxonomy: `photorealistic-natural`
- Generated source: PNG, 1536×1024, 2,839,955 bytes
- Generated source SHA-256: `54e184f678fe42ec7c3a36d39a31f8bbc3875bf5d1880f8e33710762bb3eba91`
- Committed derivative: JPEG, 960×640, 256,210 bytes
- Committed derivative SHA-256: `72e39808792fd76a19c3f7afeee7e874f30cd15a62fe60e2a8637832d81df07a`
- Derivative process: macOS `sips`, resized from 1536×1024 to 960×640 and encoded as JPEG at quality 88; no compositing or post-capture replacement

## Final prompt

```text
Use case: photorealistic-natural
Asset type: full-stage interactive demo evidence source image
Primary request: a top-down aerial nighttime survey photograph of a coastal emergency-response field station used to plan portable radio relay coverage
Scene/backdrop: compact coastal compound with dark water edge, concrete service paths, several low utilitarian buildings, temporary tents, supply yards, and three clearly separated clusters of practical work lights
Subject: real deployable field infrastructure viewed from directly overhead; one cluster should feel cyan-cool, one warm amber, and one muted magenta-red through plausible emergency and utility lighting, with additional dim neutral details across the site
Style/medium: photorealistic drone survey photograph, natural imperfect texture, operational not cinematic concept art
Composition/framing: landscape 3:2, directly overhead, entire site fills the frame with useful detail all the way to the edges; three separated light clusters distributed across left, upper-right, and lower-right zones; no empty letterbox or framing border
Lighting/mood: deep navy night, restrained practical illumination, readable roads and roofs, enough local contrast and edge detail for pixel sampling
Color palette: dark navy, slate, concrete gray, restrained cyan, amber, and muted magenta-red practical lights
Materials/textures: weathered concrete, canvas tents, corrugated roofs, wet asphalt, rocky shore
Constraints: no text, no labels, no logos, no map pins, no UI overlays, no borders, no watermark; avoid fantasy neon, lens flares, bloom that erases detail, people as focal subjects, vehicles dominating the frame
```

## Functional use in the demo

The browser fetches this exact committed JPEG from the same origin, checks its exact byte length and SHA-256, and decodes it independently through both the browser and p5. The central 960×540 crop is downsampled to 160×90 RGBA pixels. Real luminance, edge strength, and cyan/amber/red chroma evidence inside three spatially separated survey zones determine each relay's initial centroid, field radius, and gain. Those derived values feed the live inverse-square signed-distance-like scalar field, threshold contour, pair connectivity, coverage percentage, and mesh-readiness decision. Dragging or keyboard-moving a relay recomputes that field; gain controls alter its effective radius. The image is therefore mechanism input, not a decorative backdrop.
