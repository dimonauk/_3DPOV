# Python: Batch GLB Scene Exporter

**Topic**: scripting  
**Blender version**: 5.1  
**Licence**: CC0  
**Technique**: `bpy.data.collections` iteration → `view_layer.active_layer_collection` →
`bpy.ops.export_scene.gltf(use_active_collection=True, export_apply=True, ...)`

---

## What this does

Every top-level collection whose name starts with `HF_EXPORT_` is exported as a
separate Draco-compressed GLB.  A JSON manifest listing slug, object count, polygon
count, and file size is written to the same output directory.

This is the production pipeline script for shipping multi-asset Blender scenes to
the Holoflow WebXR site.  It replaces manual per-object export with a single
**Run Script** action.

---

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Builds the demo scene, then runs the batch exporter |
| `record.py` | Viewport animation — 90-frame orbit with reveal keyframes |
| `SCREEN-RECORDING-NOTES.md` | OBS capture instructions |
| `.expected-artefacts.json` | CI manifest: expected outputs and cross-references |

Expected outputs after running blueprint.py:

```
public/library/blends/scripting/python-batch-glb-exporter/
  batch_pipeline.blend
public/library/glbs/scripting/python-batch-glb-exporter/
  arch_column.glb
  gem_cluster.glb
  cable_bundle.glb
  manifest.json
public/library/videos/scripting/python-batch-glb-exporter/
  viewport.mp4   (after record.py)
  screen.mp4     (after OBS screen capture)
```

---

## Key technique notes

**Why `use_active_collection` rather than `use_selection`**  
Selection state is global and bleeds across operators.  Setting
`view_layer.active_layer_collection` is stateless from the perspective of other
tools — the exporter scopes itself to the LayerCollection tree without touching
the selection buffer.

**Why `export_apply=True`**  
Bakes the full dependency graph (modifiers, transforms, shape keys at rest) before
building the mesh for export.  Equivalent to `bpy.ops.object.convert(target='MESH')`
but without mutating the source data in the .blend.

**LayerCollection vs Collection**  
`bpy.data.collections` returns `Collection` objects.
`view_layer.active_layer_collection` takes a `LayerCollection` — a separate type
that represents the same collection **within a particular view layer's hierarchy**.
Use `find_layer_collection()` (recursive traversal from `view_layer.layer_collection`)
to map one to the other.

**Draco quantisation bits**  
- Position: 14 bits — near-lossless for objects up to 10 m across.
- Normals: 10 bits — imperceptible error on smooth meshes.
- UVs: 12 bits — preserves texel alignment on 1024 px maps.
Lower values = smaller file, more geometric error.

---

## Outside sources

- **Blender Manual — glTF 2.0 Exporter** — CC-BY-SA 4.0 — Blender Foundation  
  <https://docs.blender.org/manual/en/latest/addons/import_export/scene_gltf2.html>
- **glTF-Blender-IO** — Apache-2.0 — Khronos Group  
  <https://github.com/KhronosGroup/glTF-Blender-IO>  
  Related: glTF-Sample-Assets (MIT), glTF-Validator (Apache-2.0)
