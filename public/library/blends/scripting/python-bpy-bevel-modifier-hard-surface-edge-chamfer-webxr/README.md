# BevelModifier — Edge-Weight Chamfer, Profile & Harden Normals
## Hard-Surface Equipment Panel · Blender 5.1 · CC0

**Technique:** `bpy.types.BevelModifier` with `limit_method='WEIGHT'` reads
the `"bevel_weight_edge"` float attribute on the edge domain — a per-edge
float 0.0–1.0 that scales chamfer width proportionally. Edges at weight 0.0
receive no chamfer; weight 1.0 gets the full `mod.width`. In Blender 4.0+ this
attribute replaced the old `BMEdge.bevel_weight` property which was removed.

`harden_normals=True` assigns a Custom Split Normal to each bevel strip face
so it aligns to the adjacent flat-face normal. This eliminates the shading
gradient across the strip and replaces it with a crisp specular seam —
the defining mark of machined metal rather than extruded plastic.

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Build panel, mark bevel weights, apply BevelModifier, export GLB |
| `record.py` | OpenGL viewport animation — outputs `viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for `screen.mp4` |
| `hf_bevel_panel.blend` | Live scene with non-destructive modifier stack |
| `hf_bevel_panel.glb` | Draco-compressed GLB, normals baked in |

## How to Run

```bash
blender --background --python blueprint.py
```

Or open Blender → Text Editor → paste `blueprint.py` → Run Script.

## Bevel Weight API — Blender 4.0+ vs 3.x

```python
# Blender 3.x (deprecated, removed in 4.0):
edge.bevel_weight = 0.75   # BMEdge property — gone

# Blender 4.0+ (correct):
layer = (bm.edges.layers.float.get("bevel_weight_edge")
         or bm.edges.layers.float.new("bevel_weight_edge"))
edge[layer] = 0.75         # float attribute on the mesh
```

The modifier reads the attribute at evaluation time via the depsgraph.
`me.attributes["bevel_weight_edge"]` also works for batch writes via
`foreach_set` on large meshes.

## BevelModifier Parameter Reference

| Property | Type | Notes |
|----------|------|-------|
| `limit_method` | `'NONE'`\|`'ANGLE'`\|`'WEIGHT'`\|`'VGROUP'` | Edge selection strategy |
| `width` | float (m) | World-space chamfer width at bevel_weight = 1.0 |
| `segments` | int | Face loops per side — 2 is optimal for WebXR poly budget |
| `profile_type` | `'SUPERELLIPSE'`\|`'CUSTOM'` | Strip cross-section curve type |
| `profile` | float 0.0–1.0 | 0.5 = arc, > 0.5 = convex, < 0.5 = concave |
| `miter_outer` | `'MITER_SHARP'`\|`'MITER_PATCH'`\|`'MITER_ARC'` | Convex corner strategy |
| `miter_inner` | `'MITER_SHARP'`\|`'MITER_ARC'` | Concave corner strategy |
| `harden_normals` | bool | Crisp specular seam via Custom Split Normals |
| `use_clamp_overlap` | bool | Prevents strip crossing on thin geometry |
| `loop_slide` | bool | Slide loops along adjacent topology |
| `face_strength_mode` | `'NONE'`\|`'NEW'`\|`'AFFECTED'`\|`'ALL'` | Face strength for WeightedNormal |

## Modifier Stack Order

```
BevelModifier        ← generates the chamfer strips
WeightedNormalModifier  ← recalculates normals on the bevel geometry (optional but recommended)
```

Reversing the order makes WeightedNormal see the pre-chamfer mesh — useless.

## GLB Export

`export_normals=True` (default) writes the `harden_normals` custom normals
into the `NORMAL` accessor. Three.js reads them verbatim.
`export_apply=True` evaluates the full modifier stack at export time.

## Licence

All files in this directory are released under **CC0** (public domain).
https://creativecommons.org/publicdomain/zero/1.0/
