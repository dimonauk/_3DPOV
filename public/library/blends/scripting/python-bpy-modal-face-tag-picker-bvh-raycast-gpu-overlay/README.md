# Modal Face-Tag Picker — BVH Raycast & GPU Overlay

**Blender 5.1 | Python bpy | CC0 | Holoflow Studio 2026-07-26**

## What this is

A single-file Blender Python operator that turns the mouse into a face-tagging brush.
Press **F**, then LMB-drag across any mesh in Object Mode; every face the ray hits
receives a `holoflow_facet=1` integer attribute.  Ctrl+LMB erases.  RMB/Esc exits.

The tool directly powers the studio's WebXR export workflow: the
`holoflow_webxr_exporter` add-on reads `holoflow_facet` at export time to select
which faces should receive the faceted treatment.

## Key techniques

| Layer | What it does |
|-------|--------------|
| `mathutils.bvhtree.BVHTree` | O(log n) ray-triangle intersection |
| `bpy_extras.view3d_utils` | 2D mouse → 3D world-space ray unprojection |
| `bm.faces.layers.int` | Per-face integer attribute (persists in GLB) |
| `SpaceView3D.draw_handler_add` POST_PIXEL | Real-time amber face overlay |
| `wm.keyconfigs.addon.keymaps` | F-key binding without bl_info add-on manifest |

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Run once from Scripting workspace — registers the operator |
| `record.py` | Sets up the 150-frame demo scene and renders viewport.mp4 |
| `SCREEN-RECORDING-NOTES.md` | OBS capture instructions |

## Parameters to tune

```python
ATTRIBUTE_NAME = "holoflow_facet"  # change to any name your exporter expects
TAG_VALUE      = 1                 # or use an enum-like int for multi-tag
CLEAR_VALUE    = 0
TAGGED_COLOUR  = (1.0, 0.40, 0.08)  # amber; match your team's overlay palette
MARKER_PX      = 8                  # screen-space quad half-size in pixels
KEYMAP_KEY     = 'F'                # change if F conflicts with another tool
```

## Limitations

The BVH is built from the **base mesh** (before modifiers).  Apply any
topology-changing modifiers before running the picker, or the face indices in the
BVH will not match the bmesh used for attribute writing.

## Cross-references

- [Python Modal Operator — Vertex Colour Painter](/tutorials/blender-tutorial-python-modal-operator-vertex-colour-painter)
- [Python GPU Viewport Draw Overlay](/tutorials/blender-tutorial-python-gpu-viewport-draw-overlay)
- [Python Add-on — Custom Panel & PropertyGroup](/tutorials/blender-tutorial-python-addon-custom-panel-property-group)
