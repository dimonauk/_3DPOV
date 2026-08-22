# bmesh.ops.split_edges — Sharp-Edge Split, Angle-Threshold Hard Normals & UV Seam Co-location

**Blender 5.1 · Holoflow Studio · CC0**

Disconnects mesh topology at hard edges so each face group owns its vertices
exclusively — enabling automatic UV seam placement, physics-accurate cloth
boundaries, and export-safe flat shading without the custom-normal workaround.

## What this demonstrates

| Concept | Details |
|---------|---------|
| `bmesh.ops.split_edges` | Duplicates edge endpoint verts so adjacent faces no longer share them |
| Angle-threshold selection | `calc_face_angle(None)` with walrus-operator guard collects hard edges |
| Non-manifold detection | `len(e.link_faces) == 1` identifies split edges post-call |
| UV seam co-location | Non-manifold edges marked as seams → unwrapper separates islands automatically |
| `use_verts` T-junction | Split only at one endpoint — faces diverge at one end, stay joined at the other |
| `sharp_edge` attribute | `e.smooth = False` writes the attribute the glTF exporter reads for per-loop normals |
| Contrast with SmoothByAngle | Non-destructive vs destructive trade-offs |

## Artefact

`hf_crystal_column.glb` — a flat-top hexagonal prism shaft (deep teal) with a
pyramidal crown (pale gold). All face-to-face transitions are split. Each face
is an independent UV island. Draco-compressed, Y-up.

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Headless build + GLB export |
| `record.py` | Cycles viewport render — 5 s turntable @ 30 fps |
| `SCREEN-RECORDING-NOTES.md` | OBS window-capture instructions for screen.mp4 |

## Running

```bash
# GLB export only
blender --background --python blueprint.py

# Viewport render → viewport.mp4
blender --background --python record.py
```

## Cross-references

- [inset_faces (panel grooves pre-step)](/tutorials/blender-tutorial-python-bmesh-ops-inset-faces-panel-lines-recess-hard-surface-webxr)
- [SmoothByAngle modifier (non-destructive alternative)](/tutorials/blender-tutorial-python-bpy-smooth-by-angle-modifier-auto-smooth-migration-normals-webxr)
- [Edge sharp / crease / seam attributes](/tutorials/blender-tutorial-python-bpy-mesh-edge-sharp-crease-seam-attribute-webxr)
- [UV layer atlas packing](/tutorials/blender-tutorial-python-bpy-mesh-uv-layer-atlas-pack-multi-object-webxr)
