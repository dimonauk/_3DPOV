# GN Set Position + Noise Texture — Animated Blob Planet

**Blender 5.1 | CC0 | Geometry Nodes**

A procedural animated blob planet built from a UV sphere displaced along vertex normals by two stacked 4D Noise Texture nodes. The W axis of each noise layer advances with scene frame, producing a slow breathing animation that never alters UV coordinates or mesh topology.

## What it teaches

- **Set Position — Offset vs Position**: Offset adds to existing vertex positions (preserves sphere shape); Position replaces them absolutely. Always use Offset for surface displacement.
- **4D Noise Texture and the W axis**: advancing W slides through a 4-dimensional noise field — temporally smooth, spatially uncorrelated from XYZ sampling.
- **Dual-scale frequency layering**: macro layer (Scale 1.5) creates continental-mass variation; micro layer (Scale 9.0) adds surface-ripple detail. Uncorrelated W seeds prevent synchronised pulsing.
- **Freeze-before-deform discipline**: StoreNamedAttribute `elevation_fac` freezes the combined displacement scalar BEFORE SetPosition deforms the mesh. The material reads the stored value so colour stays locked to topology.
- **Scene-frame driver**: a SCRIPTED driver on the W_Anim group socket evaluates `frame * (1/24)`, advancing W at 1 unit per second.

## Files

| File | Description |
|---|---|
| `blueprint.py` | Full headless build script — mesh, GN tree, material, camera, GLB export |
| `record.py` | Viewport animation renderer — 90-frame breathing animation |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for `screen.mp4` |
| `.expected-artefacts.json` | Artefact manifest with cross-references |

## Running

```bash
# Build the .blend and GLB
blender --background --python public/library/blends/geometry-nodes/gn-set-position-noise-displacement/blueprint.py

# Render the viewport animation
blender --background blob_planet.blend --python public/library/blends/geometry-nodes/gn-set-position-noise-displacement/record.py
```

## Outside sources

- Blender Manual — Set Position node: https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/geometry/write/set_position.html (CC-BY-SA 4.0, Blender Documentation Team)
- njanakiev/blender-scripting: https://github.com/njanakiev/blender-scripting (MIT, Nicolas Janakiev)
- KhronosGroup/glTF-Blender-IO: https://github.com/KhronosGroup/glTF-Blender-IO (Apache-2.0, Khronos Group)

## Tutorial

[/tutorials/blender-tutorial-gn-set-position-noise-displacement](/tutorials/blender-tutorial-gn-set-position-noise-displacement)
