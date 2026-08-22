# Cycles Path Guiding + Shadow Caustics — Glass Sphere Caustic Render

**Blender 5.1 | CC0 | Holoflow Studio**

## What this is

A glass sphere on a marble pedestal, illuminated by a tight spot light at 45°.
The Cycles path guiding system and per-light shadow caustics combine to render a
physically accurate refractive caustic ellipse on the floor in a manageable sample
count (~1024 spp).

## Key techniques

| Technique | Python API | Min Blender |
|---|---|---|
| Path guiding enable | `scene.cycles.use_guiding = True` | 4.0 |
| Guiding training samples | `scene.cycles.guiding_training_samples = 128` | 4.0 |
| Shadow caustics per-light | `spot.data.cycles.use_caustics = True` | 4.0 |
| Refractive caustics scene-wide | `scene.cycles.caustics_refractive = True` | 3.0 |
| OIDN full-quality denoising | `scene.cycles.denoising_input_passes = 'RGB_ALBEDO_NORMAL'` | 3.5 |

## Files

| File | Description |
|---|---|
| `blueprint.py` | Full scene: sphere, pedestal, floor, glass material, spot light, render settings |
| `record.py` | 120-frame viewport animation: spot light orbits sphere, camera reveal |
| `output/caustic_glass_0001.png` | 1920×1080 16-bit PNG Cycles render |

## Running

```bash
# In Blender 5.1 Scripting workspace
# 1. Open blueprint.py → Run Script  (builds scene + renders ~3-6 min GPU)
# 2. Open record.py → Run Script      (generates viewport.mp4)
```

## Physics note

A glass sphere acts as a thick biconvex lens.  The paraxial focus distance behind
the rear surface is `f = r·n / (2·(n-1))` — for n=1.52, r=0.4 m → f ≈ 1.52 m
behind the exit face.  Because the floor is closer than this focal point, the
caustic on the floor is a *pre-focal spread* — a bright ellipse rather than a
geometric point.  This is the realistic result for a sphere on a pedestal of
typical proportions.

## Licence

CC0 — no attribution required.  Outside sources credited in tutorial entry.
