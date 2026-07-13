# Mesh Edge Attribute API: Sharp / Crease / Seam Mark Pipeline
**Blender 5.1 Python  |  Holoflow Studio  |  CC0**

Compute and write sharp-edge marks, SubSurf crease weights, and UV seam
flags onto a low-poly faceted dome using the Mesh Attribute API introduced
in Blender 4.1. All three channels are demonstrated with `foreach_set`
bulk-write for batch-safe, headless-compatible operation.

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Full runnable script — icosphere dome + edge attributes + GLB export |
| `record.py` | Viewport animation renderer (turntable, 150 frames, 30 fps) |
| `SCREEN-RECORDING-NOTES.md` | OBS / Game Bar instructions for `screen.mp4` |
| `faceted_dome.blend` | Generated blend (run `blueprint.py` to produce) |
| `faceted_dome.glb` | GLB with sharp-edge-encoded split normals |

## Run

```bash
blender --background --python blueprint.py
```

## Key API surface

| Edge property | Storage in 5.1 | Write route |
|---------------|----------------|-------------|
| Sharp mark | `me.attributes["sharp_edge"]` (BOOLEAN / EDGE) | `.data.foreach_set("value", array)` |
| Crease weight | `me.attributes["crease_edge"]` (FLOAT / EDGE) | `.data.foreach_set("value", array)` |
| UV seam | `me.edges` (not yet migrated) | `me.edges.foreach_set("use_seam", array)` |

`me.edges.foreach_set("use_edge_sharp", ...)` still works as a compat shim
but bypasses the attribute layer — use the attribute route in new scripts.

## 5.1 migration note

`mesh.use_auto_smooth` was removed in Blender 4.1. The replacement:
1. `polygons.foreach_set("use_smooth", [True × N])` — enable smooth shading
2. Set `sharp_edge` attribute where hard breaks are needed
3. No `Smooth by Angle` modifier required unless angle is dynamic at runtime

## See also
- `../python-mesh-custom-split-normals-smooth-island-faceted-webxr/` — per-loop normals (more flexible, larger GLB)
- `../python-bpy-mesh-uv-layer-atlas-pack-multi-object-webxr/` — UV atlas (seams are the prerequisite for packing)
- Blender 4.1 API migration: https://docs.blender.org/api/5.1/bpy.types.MeshEdge.html
