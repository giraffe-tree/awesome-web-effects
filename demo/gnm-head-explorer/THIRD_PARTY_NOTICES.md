# Third-party notices

This demo contains a compact, deterministic extraction of **GNM Head v3**
model data and semantic samples from Google’s `google/GNM` repository.

- Upstream: <https://github.com/google/GNM>
- Copyright: 2026 Google LLC
- License: Apache License 2.0
- Upstream license: <https://github.com/google/GNM/blob/main/LICENSE>

The checked-in browser asset contains the GNM template geometry, topology,
component labels, three deterministic identity samples, four deterministic
expression samples, and one deterministic pose example derived from the
official joint positions, pose-corrective regressor, skinning weights, and
kinematic hierarchy. It does not contain Google’s full 50.8 MB model, decoder
weights, training data, or training pipeline. `tools/generate_asset.py` records
and verifies the SHA-256 digest of every upstream source file used to rebuild
the compact asset.

This is an independent educational demo and is not an official Google demo.
