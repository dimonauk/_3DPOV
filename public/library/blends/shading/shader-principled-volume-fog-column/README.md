# Shader — Principled Volume: Procedural Fog Column
**Blender 5.1 | Holoflow Studio | CC0-1.0 | Created 2026-06-11**

A tall cube mesh acts as the volume domain for a non-uniform atmospheric fog
column.  A Noise Texture drives the Density input of Blender 5.1's Principled
Volume shader.  A narrow Spot Light from above creates volumetric god-ray beams
through Henyey-Greenstein forward scatter (Anisotropy = 0.50).

## Files

| File | Purpose |
|---|---|
| `blueprint.py` | Full bpy scene: domain, material, lighting, EEVEE Next config |
| `record.py` | Camera orbit animation → `viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS shot list and settings for `screen.mp4` |
| `.expected-artefacts.json` | Artefact manifest with cross-references |

## Quick start

1. Open Blender 5.1 → Scripting workspace.
2. Open `blueprint.py`, run it.
3. Press F12 — the fog column should render with a visible god-ray beam.
4. Optional: run `record.py` in the same session to produce the orbit video.

## Parameters (top of blueprint.py)

| Constant | Default | Effect |
|---|---|---|
| `VOLUME_DENSITY` | 0.15 | Scattering coeff σ_s — raise for denser fog |
| `VOLUME_ANISOTROPY` | 0.50 | HG g — 0 = isotropic, 0.5 = strong forward scatter |
| `NOISE_SCALE` | 1.8 | Spatial frequency of density clumps |
| `NOISE_DETAIL` | 6.0 | Octave count — higher gives finer wisps |
| `RAMP_LOW_CUT` | 0.30 | Noise value below which density is forced to 0 |
| `LIGHT_ENERGY` | 1200 W | Spot energy — needs to be high enough to show through fog |

## Physics notes

- **Density** = σ_s (scattering coefficient).  Not an opacity slider.  At
  σ_s = 0.15, the mean free path is ~6.7 m, so fog is translucent at close
  range and opaque at ~10 m depth.
- **Anisotropy** = Henyey-Greenstein g parameter.  g = 0 → uniform scatter in
  all directions.  g = 0.5 → 50% more light scatters forward than backward →
  god-ray beams toward the camera when the light is behind the fog.
- **Absorption Color** controls which wavelengths are absorbed vs scattered.
  Full white = no absorption (pure fog).  Tint toward amber to absorb blue
  light (warm dust).

## GLB export

glTF 2.0 has no volume domain extension.  The domain cube is tagged:
```
holoflow:volume_proxy = True
holoflow:volume_density = 0.15
holoflow:volume_anisotropy = 0.50
```
A downstream Three.js scene can detect this property and substitute a
`ShaderMaterial` (e.g. a ray-marched fog SDF or a particle sprite haze).

## Licence

Scripts and blueprints: CC0-1.0.
Technique informed by Blender Manual (CC-BY-SA-4.0, Blender Foundation).
