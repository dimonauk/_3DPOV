# Mantaflow FLIP Liquid: Dam Break over a Step Obstacle

**Blender 5.1 · Physics · CC0 · Holoflow Studio**

A 75 cm × full-depth rectangular water column collapses under gravity, strikes an
18 cm × 28 cm step obstacle, and produces a primary bore, upward splash, and
overflow cascade.  The FLIP solver uses a staggered MAC grid at 64 divisions
(≈ 3.1 cm voxels); mesh display converts the particle cloud to a smooth isosurface
at particle radius 2.0.  Water material: Principled BSDF, IOR 1.333, Transmission 0.92.

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Builds scene, writes `dam_break.blend`; Bake All required before rendering |
| `record.py` | Orbiting Cycles render → `viewport.mp4` (run after bake) |
| `SCREEN-RECORDING-NOTES.md` | OBS / Game Bar capture instructions |
| `.expected-artefacts.json` | CI artefact manifest |

## Running

```bash
# Step 1: build scene geometry + fluid settings
blender --background --python blueprint.py

# Step 2: open in Blender UI and bake (Mantaflow requires interactive bake)
blender dam_break.blend
# → select dam_domain → Properties → Physics → Fluid → Bake All

# Step 3: render viewport MP4
blender --background dam_break.blend --python record.py
```

## Key Parameters

| Parameter | Value | Effect |
|-----------|-------|--------|
| `RESOLUTION` | 64 | MAC grid voxels along longest axis — 128 = ×8 memory, ×4 time |
| `PARTICLE_R` | 2.0 | Isosurface radius in voxels — lower reveals individual particle lumps |
| `WATER_X` | 0.75 m | Initial water column width — determines collapse inertia |
| `STEP_H` | 0.28 m | Step height — controls peak splash crown elevation |
| `EXPORT_FRAME` | 40 | ~1.67 s — peak bore splash, most dramatic silhouette |

## Tutorial

[/tutorials/blender-tutorial-physics-mantaflow-liquid-dam-break](/tutorials/blender-tutorial-physics-mantaflow-liquid-dam-break)

## Outside Sources

- [Blender Manual — Fluid Domain](https://docs.blender.org/manual/en/latest/physics/fluid/type/domain/index.html) — CC-BY-SA 4.0 · Blender Foundation
- [blender-scripting](https://github.com/njanakiev/blender-scripting) — MIT · Nicolas Janakiev
- [glTF-Blender-IO](https://github.com/KhronosGroup/glTF-Blender-IO) — Apache-2.0 · Khronos Group
