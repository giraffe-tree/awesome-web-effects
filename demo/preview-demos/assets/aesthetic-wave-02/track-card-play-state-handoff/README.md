# Track-card Play-state Handoff — Cover Set

## Asset summary

- Generated: 2026-07-21
- Generator: built-in `image_gen`
- Series: one coherent fictional ambient-music trilogy
- Output processing: each generated square PNG was resized to an 800 × 800 baseline RGB JPEG with ffmpeg (`-q:v 3`) and metadata removed
- Intended use: functional cover identity for the three selectable track cards; the cover, play control, material emphasis, and progress state should hand off together

| Track concept | File | SHA-256 |
| --- | --- | --- |
| Soft Current | `soft-current-cover.jpg` | `421e5856679c19f7b4921011a0d7c8098244975a761e9b1eb4cc14699465cbcf` |
| Night Glass | `night-glass-cover.jpg` | `3951a892002ec31b26d18028a77e44642ecb19b64e8377608b380c4ddf4ab342` |
| Slow Flare | `slow-flare-cover.jpg` | `d027a67491f9d2a55a2a2c65143cfeb617a03fa55b8ef2d197097f43074d8378` |

## Fictional-content declaration

All three artworks are AI-generated and entirely fictional. They do not depict real releases, artists, record labels, campaigns, clients, buildings, installations, or documented locations. They contain no embedded text, typography, logos, label marks, signage, people, or watermark.

## Final prompts

### Soft Current

```text
Use case: ads-marketing
Asset type: square cover artwork for track 1 of a cohesive fictional ambient-music trilogy, used as a recognisable identity image inside an interactive play-state handoff card
Primary request: an art-directed photographic album cover for the fictional track concept “Soft Current”, showing one long piece of translucent coral fabric drifting in a calm mineral-blue tidal pool between pale sculptural rocks
Scene/backdrop: quiet coastal tide pool viewed from slightly above, natural water refraction, a few submerged stones, no horizon and no people
Subject: one continuous coral textile ribbon carried by a gentle current, clearly readable at small card size
Style/medium: restrained editorial art photography, tactile real-world materials, subtle 35mm grain, premium independent ambient record artwork
Composition/framing: square composition; bold diagonal flow from lower-left to upper-right; one clear central visual gesture; safe crop around all edges; strong silhouette at thumbnail scale
Lighting/mood: soft overcast coastal light, meditative and fluid
Color palette: mineral blue, muted coral, chalk stone, restrained silver highlights
Materials/textures: translucent wet fabric, rippled seawater, porous limestone
Constraints: part of a coherent three-cover series; image only; no text, letters, numbers, typography, logos, label marks, border, mockup, vinyl record, people, animals, boats, watermark, or UI
Avoid: generic gradient, flat vector art, surreal anatomy, glossy stock-photo advertising, neon colors, busy details
```

### Night Glass

```text
Use case: ads-marketing
Asset type: square cover artwork for track 2 of a cohesive fictional ambient-music trilogy, used as a recognisable identity image inside an interactive play-state handoff card
Primary request: an art-directed photographic album cover for the fictional track concept “Night Glass”, showing one small transparent glass pavilion standing in a shallow black reflecting pool at blue hour
Scene/backdrop: quiet minimal courtyard after rain, dark concrete walls, open night sky, no city skyline and no people
Subject: one luminous glass pavilion with a simple geometric silhouette and a single soft cyan interior glow, clearly readable at small card size
Style/medium: restrained editorial architecture photography, tactile real-world materials, subtle 35mm grain, premium independent ambient record artwork matching a mineral-water-and-sculpture trilogy
Composition/framing: square composition; pavilion centered slightly low with one strong reflection; large calm negative space; safe crop around all edges; immediate silhouette at thumbnail scale
Lighting/mood: deep blue hour, hushed, transparent, cool and contemplative
Color palette: ink blue, smoky cyan, charcoal concrete, restrained silver highlights
Materials/textures: rain-dark concrete, clear structural glass, still water, light mist
Constraints: part of the same coherent three-cover series as a coral fabric tidal-pool cover and a warm solar sculpture cover; image only; no text, letters, numbers, typography, logos, signage, label marks, border, mockup, vinyl record, people, animals, vehicles, watermark, or UI
Avoid: neon cyberpunk, generic gradient, flat vector art, glossy real-estate advertising, crowded skyline, over-bright lighting, busy details
```

### Slow Flare

```text
Use case: ads-marketing
Asset type: square cover artwork for track 3 of a cohesive fictional ambient-music trilogy, used as a recognisable identity image inside an interactive play-state handoff card
Primary request: an art-directed photographic album cover for the fictional track concept “Slow Flare”, showing one brushed-brass circular light sculpture standing in a dry pale-grass field as the last low sun glows through its open center
Scene/backdrop: sparse coastal meadow at late golden hour, soft distant haze, no buildings and no people
Subject: one thin monumental brass ring on a discreet dark base, with the sun framed inside it and a restrained flare, clearly readable at small card size
Style/medium: restrained editorial land-art photography, tactile real-world materials, subtle 35mm grain, premium independent ambient record artwork matching a mineral-water-and-sculpture trilogy
Composition/framing: square composition; ring slightly above center; simple horizon in lower third; one unmistakable circular silhouette; safe crop around all edges; strong shape at thumbnail scale
Lighting/mood: low warm light, slow, spacious, contemplative rather than dramatic
Color palette: muted straw gold, aged brass, dusty peach sky, charcoal base
Materials/textures: brushed oxidized brass, dry fine grass, atmospheric haze
Constraints: part of the same coherent three-cover series as a coral fabric tidal-pool cover and a blue-hour glass pavilion cover; image only; no text, letters, numbers, typography, logos, signage, label marks, border, mockup, vinyl record, people, animals, vehicles, watermark, or UI
Avoid: generic gradient, flat vector art, explosive lens flare, fantasy portal, neon colors, glossy product advertising, busy clouds, clutter
```

## Visual mechanism role

The three covers provide unmistakable identity for mutually exclusive tracks: a coral diagonal current, a cyan glass pavilion, and a brass solar ring. Their subjects stay legible in the current small card footprint, so a future implementation can visibly hand cover treatment, progress, control, and material emphasis from the outgoing track to the selected one. They are mechanism inputs, not decorative page backgrounds.
