# Python bpy.types.BooleanModifier + bpy.types.WeldModifier
## Compound-body Prop Construction, Junction Weld & GLB Export for WebXR

**Blender version**: 5.1  
**Licence**: CC0  
**Topic**: scripted modifier pipeline  
**Tutorial**: `/tutorials/blender-tutorial-python-bpy-boolean-weld-modifier-union-clean-mesh-glb-webxr`

---

### What this does

`blueprint.py` constructs a low-poly stone pedestal entirely from Python:

1. **make_plate** — rectangular slab via `bmesh.ops.create_cube` + vert scaling.
2. **make_column** — hexagonal prism (`COLUMN_SEGMENTS=6`) seated on the plate.
3. **BooleanModifier UNION** (`solver='EXACT'`) merges column into plate.
4. **WeldModifier** (`mode='CONNECTED'`, `merge_threshold=0.0001`) collapses
   the near-duplicate seam vertices the boolean leaves at the junction.
5. Both modifiers applied in stack order (Boolean first, Weld second).
6. Cutter object removed from scene before GLB export.
7. Flat shading and Principled BSDF material applied.
8. Exported as Draco-compressed WebP-textured GLB for WebXR delivery.

---

### Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Main build script — run in Blender's Text Editor |
| `record.py` | Viewport turntable render → `viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS setup for `screen.mp4` |
| `hf_boolean_weld_prop.blend` | Saved .blend (run blueprint.py then Save As) |
| `hf_boolean_weld_prop.glb` | WebXR-ready GLB |

---

### Key parameters

```python
PLATE_X, PLATE_Y, PLATE_Z = 0.90, 0.60, 0.10  # plate half-extents (m)
COLUMN_RADIUS              = 0.22              # hexagonal column radius
COLUMN_HEIGHT              = 0.70              # column height above plate
COLUMN_SEGMENTS            = 6                 # increase for rounder column
WELD_THRESHOLD             = 0.0001            # merge distance (m)
```

---

### Common issues

**Boolean produces no geometry**: confirm `cutter_obj.hide_viewport = False`
before apply.

**EXACT solver non-manifold failure**: set `mod.use_hole_tolerant = True`.

**Weld merges unintended vertices**: switch `mod.mode` to `'CONNECTED'`.

**Cutter appears in GLB**: call `remove_cutter()` before `export_glb()`.
