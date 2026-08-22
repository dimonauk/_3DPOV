# Python bpy.types.Collection — Batch GLB Export for WebXR

**Blender 5.1** | CC0 | Holoflow Studio | 2026-07-10

---

## What This Is

A complete Python blueprint for managing Blender's Collection data model,
setting per-ViewLayer visibility overrides, and batch-exporting each named
collection to a separate GLB file — ready for per-chunk streaming in a WebXR
scene.

---

## The Data-vs-Wrapper Split

The most common source of confusion with Blender's Collection API:

| API object | What it is | Where it lives |
|---|---|---|
| `bpy.types.Collection` | The *data block* — name, colour tag, child objects/collections | `bpy.data.collections["name"]` |
| `bpy.types.LayerCollection` | A per-ViewLayer *wrapper* that carries visibility flags | `scene.view_layers[0].layer_collection` tree |

**Setting `collection.hide_render = True` on the data block has no effect.**  
Render visibility is controlled exclusively by `layer_collection.hide_render`
(and `.exclude`, `.holdout`, `.indirect_only`) on the LayerCollection.

---

## Files

| File | Purpose |
|---|---|
| `blueprint.py` | Full pipeline: create hierarchy, add geometry, set visibility, batch-export |
| `record.py` | Segment-based viewport render with mid-sequence visibility toggling |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for the screen-recording |

---

## Expected Output

Run `blueprint.py` from the Blender Script Editor (opened alongside any .blend):

```
batch_glb/
├── hf_env.glb          # Ground plane
├── hf_props.glb        # Three icosphere props
└── hf_lights.glb       # Three area lights
collection_manifest.json
```

---

## Cross-References

- [ViewLayer Multi-Pass Collection Masking](/tutorials/blender-tutorial-python-viewlayer-multi-pass-collection-mask-eevee-webxr)
- [Depsgraph Batch GLB Export](/tutorials/blender-tutorial-python-depsgraph-evaluated-geometry-gn-instances-batch-export)
- [Modifier Stack Pre-Export Apply](/tutorials/blender-tutorial-python-modifier-stack-pre-export-apply)

---

## Outside Sources

- Blender Foundation `bpy.types.Collection` API — CC-BY-SA-4.0  
  <https://docs.blender.org/api/5.1/bpy.types.Collection.html>
- Blender Foundation `bpy.types.LayerCollection` API — CC-BY-SA-4.0  
  <https://docs.blender.org/api/5.1/bpy.types.LayerCollection.html>
