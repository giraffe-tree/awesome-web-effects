# Cotton proof stock

`cotton-proof-stock.jpg` is an original fictional letterpress make-ready sheet generated with the built-in OpenAI ImageGen tool on 2026-07-21 for `kinetic-rain-letterpress`.

It is a functional algorithm input, not a decorative background. The demo fetches the exact same-origin JPEG, verifies its byte length and SHA-256, decodes it in the browser, samples a 96 × 54 center crop, and derives one cotton-paper profile plus three ink profiles. Those pixels determine the p5 canvas substrate, selectable ink colors, paper absorbency, target pressure, visible impression gain, and PASS/HOLD proof conclusion.

## Final asset

- File: `cotton-proof-stock.jpg`
- Dimensions: 960 × 640
- Format: JPEG, quality 88
- Bytes: 274,593
- SHA-256: `f560758adc555f66ffd903f9cc16d4e89aa447760b14faedfd83d5737cdc1863`
- Runtime crop: source `(0, 50, 960, 540)` → sampled `96 × 54`
- Origin: built-in ImageGen, then locally resized and encoded with `sips`; no compositing or paint-over

## Generation prompt

```text
Use case: photorealistic-natural
Asset type: functional same-origin paper-and-ink pixel source for an interactive digital letterpress demo, 3:2 landscape
Primary request: create a fictional top-down studio scan of one large warm ivory cotton-rag letterpress proof sheet resting on a dark charcoal steel press bed. Keep the broad central two-thirds of the paper blank and usable for a digitally rendered headline. Along the far left paper edge place three small irregular solid proof swatches with authentic ink texture: very dark midnight navy, muted rust red, and soft graphite black. Add several subtle blind-deboss circular and rectangular test impressions near the lower-right edge, without symbols or text. Paper fibers, slight deckle, pressure grain, and tiny natural ink density variation must remain visible after downsampling.
Style/medium: highly realistic archival printmaking studio photography / flatbed proof scan, tactile and restrained
Composition/framing: strict overhead view, wide 3:2 frame, the single paper sheet fills most of the image, dark press bed forms a narrow perimeter, blank center is dominant, swatches and blind impressions are separated and easy to sample
Lighting/mood: soft raking daylight revealing paper tooth and deboss depth, neutral professional proofing mood
Color palette: warm ivory paper, charcoal steel, midnight navy, muted oxide rust, graphite
Constraints: fictional studio asset; no hands, people, tools covering the sheet, logos, brands, letters, words, numbers, pseudo-text, watermark, UI, labels, or registration marks resembling text; physically plausible paper and ink; useful genuine pixel variation in paper, each ink swatch, and embossed regions
Avoid: poster design, readable typography, random decorative collage, dramatic vignette, excessive stains, torn paper, strong perspective, glossy paper, plastic texture
```

## Visual and safety review

- No visible logo, watermark, readable typography, numbers, or pseudo-labels.
- The proof sheet and studio are explicitly fictional.
- Central negative space, three distinct ink swatches, paper tooth, deckle, and blind impressions remain legible after downsampling.
- The project does not depend on the generation service at runtime.
