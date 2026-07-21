# GNM Head Explorer

An offline-first browser demo of Google’s open-source GNM Head v3 parametric
model. It includes two complementary pages:

- `principles.html` explains the model equation step by step with the real mesh,
  including a pose-corrective and linear-blend-skinning example.
- `index.html` is a hands-on lab for mixing deterministic identity and semantic
  expression samples in the model’s linear parameter space.

## Run

From the repository root:

```bash
python3 -m http.server 4173 --directory demo/gnm-head-explorer
```

Then open <http://localhost:4173/principles.html> for the explainer or
<http://localhost:4173/> for the parameter lab. The demo has no runtime
dependencies and makes no network requests.

## Rebuild the compact model asset

The generated browser asset is committed so the demo works immediately. To
reproduce it from the official GNM files:

```bash
python3 -m venv /tmp/gnm-head-explorer-venv
/tmp/gnm-head-explorer-venv/bin/pip install -r demo/gnm-head-explorer/tools/requirements.txt
/tmp/gnm-head-explorer-venv/bin/python demo/gnm-head-explorer/tools/generate_asset.py
```

The extractor verifies pinned SHA-256 checksums before writing the asset.

## What this proves

- The rendered mesh is the real 17,821-vertex GNM Head v3 topology.
- Identity and expression changes are linear combinations of actual GNM basis
  data, sampled deterministically with Google’s released semantic decoders.
- The principles page uses GNM’s actual joint locations, pose correctives,
  skinning weights, and four-joint hierarchy for its pose step.
- Skin, eyes, teeth, gums, and tongue retain their original component labels.

This is a focused browser subset, not the complete GNM inference package. It
does not include image fitting, the complete 253/383 coefficient controls,
texture synthesis, or interactive controls for every joint. See
[`THIRD_PARTY_NOTICES.md`](./THIRD_PARTY_NOTICES.md) for provenance.
