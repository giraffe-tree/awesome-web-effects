# ETOPO topographic relief globe data

This demo vendors one deterministic, local data asset from the user-owned
`3d-earth` / Orogen project so the preview does not depend on runtime network
requests.

- `etopo-2022-relief-rg.webp` — 4,320 × 2,160 lossless WebP derived from
  NOAA/NCEI ETOPO 2022 60 arc-second surface elevation. Red stores positive
  elevation normalized to 9,000 m, green stores ocean depth normalized to
  11,000 m, and blue stores the land mask. Decode with
  `red * 9000 - green * 11000`. SHA-256:
  `8e912a0cbe595a71e64514b30240bb7475e72172f979533878094989202d357a`.
Dataset citation: NOAA National Centers for Environmental Information. 2022:
ETOPO 2022 Global Relief Model, 60 arc-second surface grid. Not for navigation.

Coastline topology is provided separately by the bundled `world-atlas` 50m
package.
