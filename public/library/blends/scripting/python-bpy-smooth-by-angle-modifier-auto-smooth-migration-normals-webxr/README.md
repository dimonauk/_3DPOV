# SMOOTH_BY_ANGLE Modifier — Auto-Smooth Migration & Normal Stacking (Blender 5.1)

**Topic:** `bpy.types.SmoothByAngleModifier` — the 4.2+/5.1 replacement for
the removed `mesh.use_auto_smooth` flag.  
**Category:** Scripting  
**Blender version:** 5.1  
**Licence:** CC0  
**Tutorial:** `/tutorials/blender-tutorial-python-bpy-smooth-by-angle-modifier-auto-smooth-migration-normals-webxr`

---

## What this is

`mesh.use_auto_smooth` was silently removed in Blender 4.2.  Scripts that still
write it in Blender 5.1 compile without error but do nothing — leaving meshes
either fully flat or fully smooth depending on their per-face smooth mark state.
The replacement is the **SMOOTH_BY_ANGLE** modifier, which sits in the modifier
stack and is evaluated by the depsgraph at render and GLB export time.

This library entry covers:
- Creating the modifier and setting the `angle` (always in **radians** in Python).
- The `keep_sharp_edges` flag and how it interacts with the `sharp_edge` boolean
  attribute on edges.
- Stack position law: SBA must sit **after** geometry-changing modifiers and
  **before** Subdivision Surface.
- A migration helper that scans legacy `.blend` files and upgrades them in-place.
- GLB export: `export_normals=True` writes the SBA-computed normals into the
  `NORMAL` accessor; `export_apply=True` is required so the depsgraph evaluates
  the modifier.

---

## Files

| File | Purpose |
|---|---|
| `blueprint.py` | Production-grade bpy script — build prop, mark sharp groove, add SBA, export GLB |
| `record.py` | Viewport animation recorder for `viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for `screen.mp4` |
| `.expected-artefacts.json` | CI artefact manifest |

---

## Quick start

```bash
blender --background --python blueprint.py
# → writes hf_smooth_demo.glb to the blend file directory
```

Or paste `blueprint.py` into the Blender Scripting workspace and press **Alt+P**.

---

## Key parameters

```python
SMOOTH_ANGLE_DEG = 30.0   # degrees — adjust per project
                           # typical values:
                           #   20° — hard-surface, lots of visible facets
                           #   30° — balanced (default Blender import target)
                           #   60° — organic / character meshes
```

---

## Common failure modes

| Symptom | Cause | Fix |
|---|---|---|
| Fully flat shading despite modifier | Modifier above SubD in stack | Move SBA below SubD |
| `AttributeError: 'SMOOTH_BY_ANGLE'` | Blender < 4.2 | Upgrade Blender; use `mesh.use_auto_smooth` on older builds |
| Smooth angle ignored | `keep_sharp_edges=True` + all edges marked sharp | Set `keep_sharp_edges=False` or clear `sharp_edge` attribute |
| Wrong normals in GLB | `export_apply=False` | Set `export_apply=True` in gltf exporter |
