# Data Transfer Modifier — Custom Split Normals: High-Poly → Low-Poly

**Blender version:** 5.1  
**Topic:** Modifiers  
**Slug:** `modifier-data-transfer-smooth-normals`  
**Licence:** CC0

---

## What this demonstrates

The Data Transfer modifier can copy the smooth normals from an arbitrarily
complex source mesh onto a low-polygon destination, without a UV map, without
a texture atlas, and without touching the destination's geometry.

The destination here is an 8-sided bicone gem (16 triangles total).  
The source is a smooth UV sphere (512 faces).  

After transfer the gem shades as if it were carved from a perfect sphere —
smooth, radially continuous — while its polygon count and silhouette edges remain
unchanged.  The GLB export carries explicit per-corner normals, so no texture
sample is needed in the WebXR viewer.

---

## When to use this technique

| Situation | Prefer |
|-----------|--------|
| Low-poly mesh, good silhouette, no UV | **Data Transfer normals** (this tutorial) |
| Low-poly mesh, needs texture anyway | Normal-map bake (see `texture-baking-normal-ao`) |
| High-poly source has extreme detail (pores, screws) | Normal-map bake (texture stores more data) |
| Instanced mesh (same GLB, many copies) | **Data Transfer normals** (no per-instance texture) |
| Animated mesh (deforming at runtime) | Neither — runtime deformation changes normals |

---

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Blender 5.1 Python script — builds scene, configures modifier, exports |
| `record.py` | Viewport animation render — before/after normal transfer over 90 frames |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for the screen recording walkthrough |
| `.expected-artefacts.json` | CI manifest of expected output files |

**Outputs when run:**
- `data_transfer_gem.blend` — non-destructive scene with modifier intact
- `data_transfer_gem.glb` — exported gem with baked normals, Draco compressed

---

## Running blueprint.py

```
blender --background --python blueprint.py
```

Expected output:

```
✓  data_transfer_gem.blend + data_transfer_gem.glb written
```

---

## Key API surface (Blender 5.1)

```python
mod = obj.modifiers.new("DataTransfer", "DATA_TRANSFER")
mod.object             = source_obj
mod.use_loop_data      = True
mod.data_types_loops   = {'CUSTOM_NORMAL'}
mod.loop_mapping       = 'POLYINTERP_LNORPROJ'
mod.mix_mode           = 'REPLACE'
mod.mix_factor         = 1.0
mod.use_max_distance   = False
```

`loop_mapping` options (ordered by quality / cost):

| Value | Behaviour |
|-------|-----------|
| `NEAREST_POLYNOR` | Snap to nearest source polygon — faceted result |
| `POLYINTERP_NEAREST` | Interpolate within nearest polygon — smoother |
| `POLYINTERP_LNORPROJ` | Project along existing loop normal, interpolate — smoothest |

---

## Outside sources

1. **Blender Manual — Data Transfer Modifier**  
   CC-BY-SA 4.0 © Blender Foundation  
   https://docs.blender.org/manual/en/latest/modeling/modifiers/modify/data_transfer.html  
   Related: https://projects.blender.org

2. **Blender Python API — DataTransferModifier**  
   CC-BY-SA 4.0 © Blender Documentation Team  
   https://docs.blender.org/api/5.1/bpy.types.DataTransferModifier.html  
   Related: https://developer.blender.org
