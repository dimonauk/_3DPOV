# DisplaceModifier + bpy.data.textures — Procedural Height-Field Terrain

**Blender 5.1 · CC0 · Holoflow Studio**

## What this is

A production blueprint for building a height-field terrain tile with Blender's
`DisplaceModifier` driven by a `bpy.data.textures` Clouds data block.  The
modifier evaluates at depsgraph time; `new_from_object()` bakes it to a clean
static mesh ready for GLB export to WebXR.

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Full build + bake + GLB export |
| `record.py` | Viewport turntable animation (run after blueprint) |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for screen.mp4 |
| `.expected-artefacts.json` | CI artefact manifest |

## Generated outputs

- `hf_displace_terrain.blend` — scene with all modifiers applied
- `hf_displace_terrain.glb` — Draco-compressed GLB, +Y up, WebXR-ready

## Modifier stack order

```
[Base Plane]
    ↓
SubSurf (Catmull-Clark, level 5)   ← must precede Displace
    ↓
Smooth by Angle (25°)              ← smooths subdivided cage pre-displacement
    ↓
DisplaceModifier (Clouds, Z, 0.6)  ← evaluates texture per vertex
```

## Key parameters

| Parameter | Default | Effect |
|-----------|---------|--------|
| `NOISE_SCALE` | 0.8 | Tile size of noise features |
| `NOISE_DEPTH` | 6 | Number of fractal octaves |
| `DISPLACE_STR` | 0.6 m | Peak height above base |
| `DISPLACE_MID` | 0.0 | Zero-crossing (0.0 = all hills, no pits) |
| `SUBSURF_LEVEL` | 5 | Vertex density (1089 verts on a 4 m plane) |

## Tutorial

`/tutorials/blender-tutorial-python-bpy-displace-modifier-texture-height-terrain-glb-webxr`

## Licence

CC0 — no rights reserved.  Use freely.
