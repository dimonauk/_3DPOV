# Python GP3 Stroke Drawing API — Toon Ink Wave for WebXR

**Blender version**: 5.1  
**API surface**: `bpy.types.GreasePencil`, `GreasePencilLayer`, `GreasePencilDrawing`, `GreasePencilStroke`  
**Category**: scripting  
**Licence**: CC0

## What this does

Builds a three-frame animated Grease Pencil 3.0 ink wave entirely from Python —
no drawing tools, no timeline scrubbing. The result is a two-layer toon-shaded
stroke animation (primary ink + highlight) baked to a triangulated mesh GLB
for Three.js / Babylon.js WebXR consumption.

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Run first — creates GP object, materials, layers, frames, GLB |
| `record.py` | Renders `viewport.mp4` (run after blueprint) |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for `screen.mp4` |
| `.expected-artefacts.json` | CI artefact manifest |

## Expected Outputs (after running blueprint.py)

```
gp3_toon_ink/
├── gp3_ink_wave.blend
├── gp3_toon_wave.glb
└── gp3_meta.json
```

## Key Concepts

- **`GreasePencilDrawing.add_strokes([N])`** — batch-allocates attribute array slots
- **`stroke.points.foreach_set("position", flat)`** — C-level array write (no Python loop)
- **`bpy.data.materials.create_gpencil_data(mat)`** — required to activate `.grease_pencil` sub-block
- **`layer.use_lights = False`** — flat cel output, WebXR-ready
- **`GREASE_PENCIL_THICKNESS` / `GREASE_PENCIL_SMOOTH`** — GP3 modifier type strings
- **`bpy.ops.object.convert(target="MESH")`** — bake to mesh for GLB

## Run Instructions

```bash
blender --background --python blueprint.py
# Then (with the .blend open):
blender gp3_toon_ink/gp3_ink_wave.blend --background --python record.py
```

## Outside Sources

- Blender Foundation, *bpy.types.GreasePencil API Reference* (CC-BY-4.0)  
  <https://docs.blender.org/api/5.1/bpy.types.GreasePencil.html>
- Blender Foundation, *Grease Pencil 3.0 Developer Notes* (CC0)  
  <https://developer.blender.org/docs/features/grease_pencil/>
