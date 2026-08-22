# GN Edges of Vertex + Vertices of Edge
## Open-Mesh Boundary Detection: Weld Bead Perimeter Strip on Sci-Fi Window Frame
**Blender 5.1 | Holoflow Studio | CC0 1.0 Universal**

---

### What this build demonstrates

Two topology navigation nodes from the **Mesh Topology** category that have no
tutorial coverage elsewhere in the library:

| Node | Blender identifier | Domain | Key output |
|---|---|---|---|
| **Edges of Vertex** | `GeometryNodeEdgesOfVertex` | POINT | `Total` = incident edge count |
| **Vertices of Edge** | `GeometryNodeVerticesOfEdge` | EDGE | `Vertex Index 1`, `Vertex Index 2` |

The boundary detection formula:
```
boundary_excess = EdgesOfVertex.Total − CornersOfVertex.Total
```
equals **0** for interior vertices (every edge is shared by two faces) and **≥ 1**
for boundary vertices (at least one edge borders an open hole with no second
face).  No UV, no position test, no raycast — pure connectivity arithmetic.

---

### Outputs

| File | Description |
|---|---|
| `blueprint.py` | Full bpy build script — open mesh → GN tree → GLB |
| `record.py` | Viewport animation render (run after blueprint.py) |
| `SCREEN-RECORDING-NOTES.md` | OBS shot sequence for the tutorial video |
| `output/window_frame_weld.glb` | GLB with `boundary_excess` (POINT, INT) and `edge_dir` (EDGE, FLOAT_VECTOR) attributes |

---

### Run order

```bash
blender --background --python blueprint.py
blender --background --python record.py
```

Or open Blender 5.1, paste `blueprint.py` into the Scripting editor, and run.

---

### Cross-references

- **Corners of Vertex + Offset Corner in Face** — sibling topology walk
  tutorial using face-corner domain instead of edge domain
- **Vertex Valence Heat Map** — diagnostic visualisation of
  `CornersOfVertex.Total` as a colour gradient (prerequisite reading)
- **Mesh to Curve + Curve to Mesh Pipe Network** — the `MeshToCurve`
  technique used here to extract boundary loops as curves

---

### External sources (permissive licence only)

- **BrendanParmer/NodeToPython** MIT — https://github.com/BrendanParmer/NodeToPython
  Used to cross-check GN node type identifiers against live Blender 5.1 registry.
- **njanakiev/blender-scripting** MIT — https://github.com/njanakiev/blender-scripting
  Reference bpy node-group construction and socket identifier patterns.
