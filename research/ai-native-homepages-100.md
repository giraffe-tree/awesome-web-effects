# 100 AI-native homepage interaction audit

- `checkedAt`: `2026-07-17`
- Accepted official homepages: **100**
- Unique companies: **100**
- Existing catalog baseline: **221 effects**
- Verified, visually distinct effects added: **21**
- Catalog after ingestion: **242 effects**, each with a bilingual description, dependency-free implementation prompt/snippet, and generated GIF preview.

## Research batches

| Batch | Samples | Distinct effects | Detailed report |
| --- | ---: | ---: | --- |
| A | 25 | 5 | [`ai-native-homepages-batch-a.md`](./ai-native-homepages-batch-a.md) |
| B | 25 | 6 | [`ai-native-homepages-batch-b.md`](./ai-native-homepages-batch-b.md) |
| C | 25 | 5 | [`ai-native-homepages-batch-c.md`](./ai-native-homepages-batch-c.md) |
| D | 25 | 5 | [`ai-native-homepages-batch-d.md`](./ai-native-homepages-batch-d.md) |
| **Total** | **100** | **21** | Company names were mechanically checked for cross-batch duplicates. |

The in-app browser-control runtime failed before navigation with `Cannot redefine property: process`, including after a clean reset. Every batch documents the conservative fallback used: official-page web reads plus direct inspection of delivered official HTML/CSS and first-party JavaScript. Runtime-only impressions without an explicit source-backed trigger and response were marked unverified and excluded from the 21 additions.

## The 100 companies

| Batch A | Batch B | Batch C | Batch D |
| --- | --- | --- | --- |
| OpenAI | Cohere | Groq | Photoroom |
| Anthropic | Mistral AI | Cerebras | Leonardo AI |
| Perplexity | Sakana AI | Together AI | Krea |
| Midjourney | Google DeepMind | Fireworks AI | Magnific |
| Runway | Poolside | Replicate | Black Forest Labs |
| ElevenLabs | Writer | Baseten | Recraft |
| Suno | Jasper | Modal | Playground |
| Pika | Copy.ai | fal.ai | Kaiber |
| Luma AI | Typeface | Hugging Face | Udio |
| Synthesia | Hebbia | Scale AI | AIVA |
| HeyGen | Augment Code | Labelbox | SOUNDRAW |
| Character.AI | Lindy | Snorkel AI | D-ID |
| Harvey | Clay | Weights & Biases | Mem |
| Glean | Decagon | Arize AI | Granola |
| Sierra | Factory | LangChain | Scenario |
| Cognition | PolyAI | LlamaIndex | Otter.ai |
| Cursor (Anysphere) | Bland AI | Pinecone | Fireflies.ai |
| Replit | Vapi | Weaviate | Read AI |
| Lovable | Retell AI | Qdrant | Fathom |
| Higgsfield | Hume AI | Chroma | tl;dv |
| Manus | Tavus | Unstructured | Wispr Flow |
| Gamma | Captions | Langfuse | Krisp |
| Kling AI | Descript | Helicone | Speechify |
| Ideogram | OpusClip | Braintrust | Akool |
| Stability AI | InVideo | Galileo | Meshy |

## 21 effects added

| # | Effect | Source |
| ---: | --- | --- |
| 1 | Depth-map ordered blur dissolve | Black Forest Labs |
| 2 | Scroll-linked multilayer starfield drift | Fathom |
| 3 | Infinite curved text-path conveyor | Wispr Flow |
| 4 | Scroll-scrubbed document generation playback | Granola |
| 5 | Type-select-replace prompt loop | Granola |
| 6 | Device-silhouette masked autoplay video | Pika |
| 7 | Self-inverting fixed navigation | Luma AI |
| 8 | Delayed dropdown promo sweep | Glean |
| 9 | Four-corner hover crop marks | Cognition |
| 10 | Duration-aware layered hero film handoff | Kling AI |
| 11 | Blurred autoplay video ambience | Replicate |
| 12 | Hysteretic scroll-threshold header restyle | LlamaIndex |
| 13 | Card metadata-to-CTA role swap | Together AI |
| 14 | Opposed diagonal offset CTA | Unstructured |
| 15 | Staggered multi-chart telemetry boot | Pinecone |
| 16 | Drag-spawned DOM-aware fish flock | Sakana AI |
| 17 | Interaction-history hiring badge | Clay |
| 18 | Traveling-dot headline eraser-writer | PolyAI |
| 19 | Synchronized scenario scene handoff | Vapi |
| 20 | Hover-rehearsed video style rail | Captions |
| 21 | Autonomous agent-cursor constellation | InVideo |

## Deduplication rule

A candidate was added only when its combined interaction contract was absent from the 221-effect baseline:

1. trigger or accumulated state;
2. visible response;
3. timing or sequencing;
4. page layer and relationships between layers.

Common implementations such as ordinary autoplay video, logo marquees, generic hover zoom, simple scroll reveals, standard carousels, routine dropdowns, and plain waveform playback were recorded in the batch reports but not added again.
