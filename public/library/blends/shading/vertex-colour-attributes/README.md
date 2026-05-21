# Vertex Colour Attributes — Blender 5.1

Per-face directional palette painted onto an icosphere using the
`mesh.color_attributes` API. No UV map. No image texture. Exports a
`COLOR_0` accessor to GLB, readable by Three.js `vertexColors` and any
WebXR scene that accepts glTF 2.0.

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Builds `.blend` + `.glb` headlessly via `--background` |
| `record.py` | Renders a 5-second turntable to `videos/…/viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS shot list for the `screen.mp4` walkthrough |
| `.expected-artefacts.json` | CI manifest + cross-reference registry |

## Quick start

```bash
blender --background --python blueprint.py
# → vertex_colour_demo.blend
# → vertex_colour_demo.glb

blender --background --python record.py
# → public/library/videos/shading/vertex-colour-attributes/viewport.mp4
```

## Key API calls

```python
# Create attribute
attr = mesh.color_attributes.new(name="Col", type="BYTE_COLOR", domain="CORNER")

# Paint per-face (CORNER domain, one entry per loop index)
for poly in mesh.polygons:
    for loop_idx in poly.loop_indices:
        attr.data[loop_idx].color = (R, G, B, A)

# Set as active + render attribute so EEVEE and glTF exporter agree
idx = mesh.color_attributes.find("Col")
mesh.color_attributes.active_color_index = idx
mesh.color_attributes.render_color_index  = idx

# Export — export_colors=True is required
bpy.ops.export_scene.gltf(filepath="out.glb", export_colors=True, ...)
```

## Blender 5.1 notes

- `mesh.vertex_colors` (2.79 legacy) still exists but is deprecated.
  Use `mesh.color_attributes` in all new scripts.
- `CORNER` domain → independent colour per face-corner → hard palette
  boundaries. `POINT` domain → averaged at shared vertices → colour gradients.
- The `ShaderNodeVertexColor` node references the attribute by `layer_name`.
  Must match the string passed to `color_attributes.new(name=…)` exactly.

## Licence

CC0. Scripts are original work. Technique references Blender Manual (CC BY-SA)
and KhronosGroup/glTF-Blender-IO (Apache-2.0).
