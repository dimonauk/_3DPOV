# MirrorModifier — Bisect, Merge & Bilateral Symmetry

**Blender 5.1 · Python · Holoflow Studio · CC0**

Builds a faceted sci-fi clasp buckle from a single quarter-piece mesh by
stacking two `bpy.types.MirrorModifier` instances — one across X, one across
Y — each with `use_bisect_axis=True` so the seam boundary is geometrically
clean before the weld.

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Full headless Python script; writes `.blend` + `.glb` |
| `record.py` | Viewport render of the symmetry reveal (6 s, 30 fps) |
| `SCREEN-RECORDING-NOTES.md` | OBS session guide for `screen.mp4` |
| `hf_clasp_buckle.blend` | Output — live modifier stack |
| `hf_clasp_buckle.glb` | Output — applied, Draco-compressed |

## Quick Start

```bash
blender --background --python blueprint.py
```

## Key API Points

```python
# Axis + bisect — use_axis, use_bisect_axis are 3-element bpy_prop_array
mod = obj.modifiers.new("Mirror_X", type='MIRROR')
mod.use_axis[0]         = True   # X mirror
mod.use_bisect_axis[0]  = True   # clip source at X=0 before reflecting
mod.use_mirror_merge    = True
mod.merge_threshold     = 0.0001 # weld seam verts within 0.1 mm

# Off-origin mirror via mirror_object
pivot = bpy.data.objects.new("Pivot", None)
bpy.context.collection.objects.link(pivot)
pivot.location = (0.08, 0.0, 0.0)
mod.mirror_object = pivot
```

## Output Preview

Bilateral buckle: 120 mm × 80 mm × 10 mm, quad-dominant topology,
chamfered hard edges, Draco 6 GLB ≈ 14 kB.

## Licence

CC0 — no rights reserved. Blender Foundation API reference: CC-BY-SA 4.0.
