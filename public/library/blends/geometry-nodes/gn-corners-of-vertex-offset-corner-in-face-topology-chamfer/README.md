# GN Corners of Vertex + Offset Corner in Face — Three-Zone Panel Trim

**Blender 5.1 · Geometry Nodes · CC0**

Classifies mesh faces into three zones (centre / edge-trim / corner-trim) using
only mesh topology: `Corners of Vertex` counts how many faces share each vertex,
and the per-face average of those counts unambiguously identifies border faces
without any UV or world-position test.

`Offset Corner in Face` (delta=+1) walks each face's corner ring to compute a
directed edge tangent, stored as the `edge_tangent` custom attribute and readable
in Three.js / GLSL.

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Full bpy script — creates grid, builds GN tree, exports GLB |
| `record.py` | Viewport render (150 frames, 30 fps) — runs after blueprint.py |
| `SCREEN-RECORDING-NOTES.md` | OBS shot list for human screen.mp4 recording |
| `output/topology_trim_panel.glb` | Created by blueprint.py at runtime |

## Nodes demonstrated

- `GeometryNodeCornersOfVertex` — vertex valence as POINT-domain INT field
- `GeometryNodeOffsetCornerInFace` — directed corner-ring traversal
- `GeometryNodeVertexOfCorner` — corner index → vertex index
- `GeometryNodeFieldAtIndex` — sample POINT-domain field at specific index
- `GeometryNodeStoreNamedAttribute` — materialise computed attributes
- `GeometryNodeNamedAttribute` — read stored attributes back as fields
- `GeometryNodeEvaluateOnDomain` — POINT/CORNER → FACE domain averaging

## GLB custom attributes

The exported GLB carries two custom accessors:
- `vtx_valence` (INT, per-vertex) — vertex valence 2/3/4
- `edge_tangent` (VEC3, per-face) — average directed edge tangent

Access in Three.js:
```js
mesh.geometry.attributes['_vtx_valence']   // glTF custom attr = underscore prefix
mesh.geometry.attributes['_edge_tangent']
```

## Tutorial page

`/tutorials/blender-tutorial-gn-corners-of-vertex-offset-corner-in-face-topology-chamfer`
