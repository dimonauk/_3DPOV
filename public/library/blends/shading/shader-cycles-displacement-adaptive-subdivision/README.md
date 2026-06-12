# Cycles Adaptive Subdivision + True Displacement

**Blender 5.1 · Cycles Experimental · CC-0**  
**Topic**: `shading`  
**Slug**: `shader-cycles-displacement-adaptive-subdivision`

## What this is

A complete demonstration of Cycles' micropolygon displacement pipeline:
a low-poly UV sphere gains real displaced geometry at render time via a
Noise Texture → ColorRamp → Displacement node chain, tessellated by the
Adaptive Subdivision modifier to a camera-relative dicing budget.

The scene also includes a bake-target copy of the sphere for converting the
high-poly displaced surface into a 2 K normal map — the correct way to carry
displaced surface detail into a GLB/WebXR scene where Cycles is unavailable.

## Prerequisites

- Blender 5.1 (Cycles renderer)
- Properties › Render › Feature Set set to **Experimental**

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Builds the full scene and saves `stone_displaced.blend` |
| `record.py` | EEVEE-Next viewport animation (runs after blueprint.py) |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for the Cycles comparison recording |
| `.expected-artefacts.json` | CI manifest of expected output files |

## Running

```bash
# Build the blend file
blender --background --python blueprint.py

# Render the viewport clip
blender stone_displaced.blend --python record.py
```

## Key concepts

- **Experimental feature set**: enables `use_adaptive_subdivision` on the
  Subdivision Surface modifier
- **Dicing rate**: pixels per micropolygon edge at render time (1.0 = dense,
  8.0 = coarse); camera-distance-adaptive by default
- **`mat.cycles.displacement_method`**: `'BUMP'` / `'DISPLACEMENT'` / `'BOTH'`
- **Displacement node `Space = OBJECT`**: keeps displacement height consistent
  regardless of object scale transforms
- **Baking displaced to normal**: `bpy.ops.object.bake(type='NORMAL',
  use_selected_to_active=True, cage_extrusion=0.25)`

## Expected output artefacts

- `stone_displaced.blend` — full scene
- `normal_bake_2k` — 2 K normal map image (saved from Image Editor)
- `public/library/videos/shading/shader-cycles-displacement-adaptive-subdivision/viewport.mp4`

## Cross-references

- [Texture Baking: Normal + AO](/tutorials/blender-tutorial-texture-baking-normal-ao)
- [Cycles — Light Path Node: Glass Without Fireflies](/tutorials/blender-tutorial-cycles-light-path-glass-fireflies)
- [Python 3D Print Prep: Mesh Analysis](/tutorials/blender-tutorial-python-3d-print-mesh-analysis)
