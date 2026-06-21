# Modifier — Solidify: Simple vs Complex Mode
## Wall Thickness for Architecture, 3D Print, and WebXR
**Blender 5.1 · CC0-1.0 · Holoflow Studio**

---

## What this teaches

The Solidify modifier converts a zero-thickness mesh (a flat plane or open
shell) into a manifold solid with outer, inner, and rim faces.

**Simple mode** is fast but produces self-intersecting inner corners wherever
two faces meet at a concave dihedral angle — the standard failure mode at
room-corner walls, box frames, and any object with re-entrant geometry.

**Complex mode** (Python: `solidify_mode = 'NON_MANIFOLD'`) applies a
halfedge-miter algorithm that inserts a diagonal strip at each concave vertex
instead of extending offset faces until they cross. The result is manifold,
watertight, and passes 3D print wall-thickness checks.

---

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Builds the L-shaped corner wall and applies Solidify (Complex) |
| `record.py` | 5 s turntable viewport render — exterior → corner → interior |
| `SCREEN-RECORDING-NOTES.md` | OBS capture instructions |
| `wall_corner_solidify.blend` | Save manually after running `blueprint.py` |

**Generated outputs** (run `blueprint.py` then save .blend):
- `../../../../glbs/modifiers/modifier-solidify-shell-architecture-3d-print/wall_corner_solidify.glb`
- `../../../../videos/modifiers/modifier-solidify-shell-architecture-3d-print/viewport.mp4`

---

## Quick start

```bash
# Build scene + export GLB
blender --background --python blueprint.py

# Open .blend and run turntable record
blender wall_corner_solidify.blend --python record.py
```

---

## Key parameters

| Parameter | API name | Value used | Why |
|-----------|----------|-----------|-----|
| Mode | `solidify_mode` | `NON_MANIFOLD` | Complex — miter-correct corners |
| Thickness | `thickness` | `0.20` m | 200 mm masonry wall |
| Offset | `offset` | `-1.0` | Inner face grows toward room |
| Thickness mode | `nonmanifold_thickness_mode` | `FIXED` | Constant along face normal |
| Boundary | `nonmanifold_boundary_mode` | `FLAT` | Flat rim at open edges |
| Rim fill | `rim_fill_mode` | `CLOSED` | Watertight — required for 3D print |
| Shell mat | `material_offset` | `0` | Keeps EXTERIOR material on shell |
| Rim mat | `material_offset_rim` | `1` | Assigns RIM material to edge faces |

---

## External sources

1. **Blender Manual — Solidify Modifier**
   Licence: CC-BY-SA-4.0 · Author: Blender Documentation Team
   https://docs.blender.org/manual/en/5.1/modeling/modifiers/generate/solidify.html
   Related: https://projects.blender.org/blender/blender

2. **Blender 2.82 Release Notes — Solidify Complex Mode**
   Licence: CC-BY-SA-4.0 · Author: Blender Foundation / blender.org wiki contributors
   https://wiki.blender.org/wiki/Reference/Release_Notes/2.82/Modeling
   Related: https://projects.blender.org/blender/blender
