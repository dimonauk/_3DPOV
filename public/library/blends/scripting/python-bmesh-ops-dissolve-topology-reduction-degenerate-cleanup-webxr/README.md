# bmesh.ops dissolve family — Topology Reduction Pipeline
## Blender 5.1 · Scripting · CC0

Covers the five `bmesh.ops` dissolve operators in production order:
`dissolve_degenerate` → `dissolve_limit` → `dissolve_faces` → `dissolve_edges` → `dissolve_verts`.

The demo reduces a 6×4 over-dense panel slab (68 faces, typical of a SubD-bake
retopology export) to 6 faces in three calls without repositioning a single vertex.
Each step is annotated with the silent-failure modes most likely to catch a
production scripter off-guard.

### Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Full build + dissolve pipeline + GLB export |
| `record.py` | Viewport orbit animation for `viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for `screen.mp4` |
| `.expected-artefacts.json` | CI manifest |

### Artefacts produced (run blueprint.py in Blender 5.1)

- `hf_panel_tile.glb` — 6-face slab, Draco L6, +Y-up, flat-shaded

### Key operators

```python
bmesh.ops.dissolve_degenerate(bm, dist=1e-4, edges=bm.edges[:])
bmesh.ops.dissolve_limit(bm, angle_limit=0.017, use_dissolve_boundaries=False,
                         verts=bm.verts[:], edges=bm.edges[:], delimit=set())
bmesh.ops.dissolve_edges(bm, edges=edge_list, use_verts=True, use_face_split=False)
bmesh.ops.dissolve_verts(bm, verts=vert_list, use_face_split=False,
                         use_boundary_tear=False)
```

### Why this matters for WebXR

The glTF 2.0 spec triangulates all faces on export. A 68-face slab and a 6-face
slab produce identical GLBs from a renderer's perspective — but the 6-face
version has 62 fewer triangulation decisions, zero risk of contradictory diagonal
choices, and a NORMAL accessor that is unambiguous. For spatial computing assets
that travel through multiple export/import stages (Blender → GLB → Three.js → XR
headset) the cleaner base topology prevents cascading normal artefacts downstream.

### Outside sources

- Blender Foundation — bmesh.ops API Reference 5.1 (CC-BY-SA-4.0)
  <https://docs.blender.org/api/5.1/bmesh.ops.html>
- Khronos Group — glTF-Blender-IO (Apache-2.0)
  <https://github.com/KhronosGroup/glTF-Blender-IO>
