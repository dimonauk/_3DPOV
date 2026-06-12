# Compositor — Glare + Film Grain + Tone Map: Cinematic Post-Processing

**Blender 5.1 · CC0 · Topic: compositing**

Wires a four-stage cinematic post chain in Blender's Compositor: Glare
(Fog Glow bloom) → Tone Map (PhotoReceptor adaptive exposure) → Film Grain
(display-referred monochrome noise) → Lens Distortion (barrel + chromatic
aberration) → Vignette (ellipse mask multiply).  Each stage is placed in the
correct colour space — the ordering is physics, not preference.

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Builds scene (chrome sphere + faceted gem) and full compositor tree |
| `record.py` | 90-frame OpenGL orbit for `viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS/Game Bar instructions for `screen.mp4` |

## Output artefacts

- `compositor_cinematic_grade.blend` — produced by `blueprint.py`
- `public/library/videos/compositing/compositor-glare-filmgrain-tonemapping/viewport.mp4`
- `public/library/videos/compositing/compositor-glare-filmgrain-tonemapping/screen.mp4`

## Key parameters

| Constant | Default | Effect |
|----------|---------|--------|
| `GLARE_THRESHOLD` | `0.80` | Scene-linear HDR cut-off for bloom |
| `GLARE_SIZE` | `8` | Bloom radius (power-of-two, max 9) |
| `GRAIN_STRENGTH` | `0.035` | Grain blend ≈ ISO 800 35mm film |
| `LENS_DISTORT` | `-0.03` | Barrel distortion |
| `VIG_DEPTH` | `0.70` | Corner darkening (0=none, 1=black) |

## Related tutorial

[/tutorials/blender-tutorial-compositor-glare-filmgrain-tonemapping](/tutorials/blender-tutorial-compositor-glare-filmgrain-tonemapping)

## Outside sources

- Troy Sobotka, *filmic-blender*, MIT — https://github.com/sobotka/filmic-blender
- Blender Foundation, *Compositor Manual*, CC-BY-SA 4.0 — https://docs.blender.org/manual/en/latest/compositing/
- Academy Software Foundation, *OpenColorIO*, Apache-2.0 — https://github.com/AcademySoftwareFoundation/OpenColorIO
