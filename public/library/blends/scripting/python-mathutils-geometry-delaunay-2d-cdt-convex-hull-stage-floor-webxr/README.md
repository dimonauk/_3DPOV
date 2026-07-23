# Python mathutils.geometry — Delaunay 2D CDT + Convex Hull
## Poi Stage Floor: Phyllotaxis Dancer Positions → Faceted Mosaic for WebXR
**Blender 5.1 · Scripting · CC0 · Holoflow Studio**

---

## What this does

Uses `mathutils.geometry.delaunay_2d_cdt()` and `mathutils.geometry.convex_hull_2d()`
to build a faceted stage-floor mesh from a phyllotaxis (golden-angle spiral) scatter
of dancer positions.  The Delaunay triangulation produces near-isotropic triangle
shapes — no pathological slivers — because the golden angle prevents clustering on
any single radial spoke.  Each triangle is tinted by its circumradius (the Delaunay
quality metric): compact triangles are dark slate, spread triangles warm purple.  A
separate boundary ring marks the convex hull of the performance envelope.

---

## Files

| File | Purpose |
|---|---|
| `blueprint.py` | CDT + convex hull → bmesh → GLB export |
| `record.py` | Orbiting camera viewport render → viewport.mp4 |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for screen.mp4 |
| `hf_stage_floor.blend` | Saved after running blueprint.py |
| `hf_stage_floor.glb` | Exported floor + ring (Draco-6, WebP) |

---

## API summary

```python
from mathutils.geometry import delaunay_2d_cdt, convex_hull_2d

# Delaunay 2D CDT
verts_out, edges_out, faces_out = delaunay_2d_cdt(
    vert_coords,   # list of (x, y) tuples
    edges,         # constraint edge pairs [(i, j), ...]
    faces,         # constraint face groups [[i, j, k], ...]
    output_type,   # 0=all inside hull · 3=inside constraints
    epsilon,       # vertex-merge distance tolerance
    need_ids=False # True → also return (orig_verts, orig_edges, orig_faces)
)

# Convex Hull 2D
hull_indices = convex_hull_2d(points_2d)
# Returns CCW-ordered list of indices into points_2d
```

### output_type values

| Value | Meaning |
|---|---|
| 0 | CDT_FULL — all Delaunay triangles inside convex hull |
| 1 | CDT_CONSTRAINTS — triangles satisfying constraint faces only |
| 2 | CDT_INSIDE_CONVEX_HULL — triangles strictly inside hull (no boundary) |
| 3 | CDT_INSIDE — triangles inside constraint polygon |
| 4 | CDT_CONSTRAINTS_VALID_BMESH — constraint-valid for bmesh import |

---

## Parameters

| Name | Default | Meaning |
|---|---|---|
| N_DANCERS | 28 | number of phyllotaxis points |
| STAGE_RADIUS | 4.0 m | radius of the performance disk |
| CDT_EPSILON | 1e-5 | merge distance for near-coincident verts |
| OUTPUT_TYPE | 0 | CDT output mode |
| RING_THICK | 0.06 m | boundary ring tube half-height |

---

## How to run

```sh
blender --background --python blueprint.py
```

---

## Cross-references

- `/tutorials/blender-tutorial-python-mathutils-geometry-kdtree-bvhtree-spatial` — spatial indexing siblings in mathutils.geometry
- `/tutorials/blender-tutorial-python-bpy-mesh-from-pydata-enneper-minimal-surface-faceted-webxr` — mesh from Python vertex data
- `/tutorials/spinning-fire-poi-safely` — poi choreography context
- CGAL 2D Triangulations (CC BY 4.0) — https://doc.cgal.org/latest/Triangulation_2/index.html
- Blender Python API — mathutils.geometry (CC-BY-SA-4.0) — https://docs.blender.org/api/current/mathutils.geometry.html
