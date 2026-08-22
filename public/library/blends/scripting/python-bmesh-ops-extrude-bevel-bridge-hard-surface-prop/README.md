# bmesh.ops: Extrude, Bevel & Bridge — Sci-Fi Hard-Surface Panel Prop

**Blender 5.1 · Python · `bmesh.ops`**

Builds a 2 m × 1.2 m × 0.1 m wall panel using the `bmesh.ops` pre-packaged
mesh operation library. The script demonstrates four foundational operations:
`extrude_face_region`, `inset_individual`, `bevel`, and `bridge_loops` — each
one layer above the raw topology API (`bm.verts.new`, `bm.faces.new`) that the
companion gem tutorial uses.

## Output files

| File | Description |
|---|---|
| `scifi_panel_prop.blend` | Blender scene with materials |
| `scifi_panel_prop.glb` | WebXR-ready GLB (Y-up, Draco 6, WebP) |
| `blueprint.py` | Script that builds the prop |
| `record.py` | Viewport orbit render → `viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS/Game Bar instructions for `screen.mp4` |

## Running the scripts

```
# In Blender 5.1 Text Editor:
# 1. Open blueprint.py → Run Script
# 2. Open record.py   → Run Script
```

Or from the command line:
```bash
blender --background --python blueprint.py
blender scifi_panel_prop.blend --background --python record.py
```

## Prop design

```
 ┌──────────────────────────────────────┐
 │  ╔══════════════════════════════╗    │  ← raised border (INSET_BORDER = 0.12 m)
 │  ║  recessed window panel       ║    │    recessed by INSET_DEPTH = 0.045 m
 │  ╚══════════════════════════════╝    │
 ●──────────────────────────────────────●  ← conduit tubes (CONDUIT_R = 35 mm)
```

Left and right conduit tubes (CONDUIT_SEGS = 12) run vertically along the
panel edges, created with `bmesh.ops.create_circle` × 2 + `bridge_loops`.
Outer silhouette edges are chamfered with `bmesh.ops.bevel` (segments = 2,
creating one specular highlight loop per edge).

## bmesh.ops key functions

| Function | What it does |
|---|---|
| `create_grid` | Flat quad mesh in XY plane |
| `scale` / `rotate` | In-bmesh transforms (no object baking needed) |
| `extrude_face_region` | Copies face + boundary; returns new geom refs |
| `inset_individual` | Insets each face with a raised border + depth push |
| `bevel` | Chamfers edges; `segments=2` = highlight loop pattern |
| `create_circle` | Closed edge ring at a given matrix position |
| `bridge_loops` | Fills quads between two matching edge loops |
| `fill` | Caps an open edge loop with an n-gon face |
| `triangulate` | Converts n-gons to triangles (glTF requirement) |
| `recalc_face_normals` | Flood-fills consistent outward winding |

## See also

- Companion tutorial: bmesh context API (gem construction) — low-level BUILD
- `blender-tutorial-python-depsgraph-evaluated-geometry-gn-instances-batch-export`
- `blender-tutorial-python-mathutils-bvhtree-raycast-surface-scatter-webxr`

## Sources

- Blender Foundation, *bmesh.ops Python API*, CC-BY-SA-4.0
  <https://docs.blender.org/api/5.1/bmesh.ops.html>
- Nathan Jankowski, *blender-scripting*, MIT
  <https://github.com/njankowski/blender-scripting>
