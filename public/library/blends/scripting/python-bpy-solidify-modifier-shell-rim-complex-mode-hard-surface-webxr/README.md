# SolidifyModifier — Shell, Rim Cap & Two-Material Panel Line
## VRM Pauldron · Blender 5.1 · CC0

**Technique:** `bpy.types.SolidifyModifier` extrudes a surface mesh into a fully
closed 3-D shell. The modifier's `use_rim=True` flag generates quad faces that
close the open boundary edges of the base surface — without it, a curved plate is
an open shell that shows gaps and breaks under back-face culling in WebXR.
`material_offset_rim=1` routes those rim faces to a second material slot, enabling
a contrasting gold-trim band with no extra geometry required.

The base surface is a partial cylindrical arc (a pauldron / shoulder armour plate)
built entirely from `bmesh.verts.new` + `bm.faces.new`. SolidifyModifier in SIMPLE
mode with `use_even_offset=True` produces the inner shell; the offset would collapse
at the tighter inner radius without the even-offset correction.

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Build pauldron surface, apply SolidifyModifier, export GLB |
| `record.py` | Camera-keyframe viewport animation → `viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS walkthrough script for `screen.mp4` |
| `hf_pauldron_shell.blend` | Live scene with non-destructive modifier stack |
| `hf_pauldron_shell.glb` | Draco-compressed GLB, two-material, +Y up |

## How to Run

```bash
blender --background --python blueprint.py
```

Or open Blender → Text Editor → paste / open `blueprint.py` → Run Script.

## SolidifyModifier — API Reference

```python
sol = ob.modifiers.new("Solidify", 'SOLIDIFY')

# Mode
sol.solidify_mode = 'SIMPLE'       # flat/faceted mesh default
sol.solidify_mode = 'NON_MANIFOLD' # UI label: "Complex" — sculpted/SubD

# Geometry
sol.thickness     = 0.0038   # metres
sol.offset        = -1.0     # -1 = inner, 0 = centred, +1 = outer

# Correctness on curved geometry (SIMPLE mode)
sol.use_even_offset = True   # rescales per-vertex push to keep even thickness

# Boundary closure
sol.use_rim      = True   # generate rim quads — ALWAYS enable for WebXR
sol.use_rim_only = False  # True = suppress inner shell (outline-only effect)

# Material assignment
sol.material_offset_rim = 1  # rim faces → material slot 1 (contrasting trim)
sol.material_offset     = 0  # inner shell material offset from outer
```

## SIMPLE vs NON_MANIFOLD (Complex)

| Feature | SIMPLE | NON_MANIFOLD |
|---------|--------|-------------|
| Algorithm | Per-vertex averaged-normal offset | Manifold boundary topology tracing |
| Speed | Fast | Slower |
| Flat-faced mesh | Excellent | Correct but redundant |
| Sculpted / SubD mesh | Can self-intersect | Handles concave valleys |
| `use_even_offset` | ✓ available | Not applicable |
| `nonmanifold_offset_mode` | Not applicable | `'FIXED'` / `'EVEN'` / `'CONSTRAINTS'` |
| `nonmanifold_boundary_mode` | Not applicable | `'NONE'` / `'ROUND'` / `'FLAT'` |

**Rule of thumb:** if the inner shell self-intersects or shows artefacts, switch
to NON_MANIFOLD with `offset_mode='EVEN'`.

## Panel-Line Effect Recipe

```python
# Two materials in slot 0 and 1
me.materials.append(mat_body)   # slot 0 — main surface
me.materials.append(mat_trim)   # slot 1 — rim / panel line

sol.use_rim             = True
sol.material_offset_rim = 1     # rim → slot 1
sol.material_offset     = 0     # inner shell → slot 0 (matches outer)
```

This is the same technique used on VRM accessory rims, mecha panel inserts,
and architectural extrusions — one modifier, zero manual face assignment.

## Even Thickness — Why It Matters

On a cylindrical surface of radius R, the inner shell lies at radius R - t.
Without even offset, the offset is computed along the per-vertex averaged normal
which points radially inward. At the concave side of a curve, adjacent vertex
normals diverge — the simple offset overshoots and can push inner vertices past
the centre of curvature, producing an inverted shell.

`use_even_offset=True` projects each vertex offset onto the local tangent plane
before applying thickness, keeping the shell wall visually uniform across curves.

## Modifier Stack Order

```
SolidifyModifier    ← generates shell + rim quads
WeightedNormal      ← reassigns rim corner normals by face area,
                       eliminating dark shadowing on narrow rim quads
```

Placing WeightedNormal _before_ Solidify means it sees only the base surface —
useless. Place it _after_.

## GLB Export

```python
bpy.ops.export_scene.gltf(
    export_apply   = True,     # evaluates full modifier stack
    export_normals = True,     # preserves WeightedNormal custom split normals
    export_materials = 'EXPORT',
    export_yup     = True,     # Holoflow Studio convention: +Y up
)
```

Both material slots (`hf_shell` and `hf_rim`) export as separate glTF primitives
within the same mesh node — no mesh splitting required.

## Licence

All files in this directory are released under **CC0** (public domain).
https://creativecommons.org/publicdomain/zero/1.0/

## Outside Sources

1. **bpy.types.SolidifyModifier — Blender Python API 5.1**
   https://docs.blender.org/api/5.1/bpy.types.SolidifyModifier.html
   © Blender Foundation — CC BY SA 4.0

2. **Solidify Modifier — Blender Manual**
   https://docs.blender.org/manual/en/latest/modeling/modifiers/generate/solidify.html
   © Blender Documentation Team — CC BY SA 4.0

3. **glTF-Blender-IO — Khronos Group**
   https://github.com/KhronosGroup/glTF-Blender-IO
   © Khronos Group — Apache-2.0
