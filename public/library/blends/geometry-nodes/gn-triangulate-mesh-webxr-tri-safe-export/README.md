# GN Triangulate Mesh — Tri-Safe WebXR GLB Export

**Blender 5.1 | Holoflow Studio | CC0**

Converts a mixed-topology mesh (quads + n-gons) into a pure-triangle mesh
required by glTF 2.0, using the Geometry Nodes `Triangulate Mesh` node with
four configurable `quad_method` strategies. Explores why the export path's own
triangulation is inferior to an explicit Triangulate node, and how to preserve
flat-shaded face normals through the conversion.

## Files

| File | Purpose |
|---|---|
| `blueprint.py` | Builds the demo mesh, GN modifier, flat material, exports GLB |
| `record.py` | 2×2 comparison render of all four quad methods |
| `SCREEN-RECORDING-NOTES.md` | OBS / Game Bar instructions for `screen.mp4` |
| `.expected-artefacts.json` | CI artefact manifest |

## Key Parameters (top of `blueprint.py`)

```python
QUAD_METHOD  = "SHORTEST_DIAGONAL"  # BEAUTY | FIXED | FIXED_ALTERNATE | SHORTEST_DIAGONAL
NGON_METHOD  = "BEAUTY"             # BEAUTY | CLIP
MIN_VERTICES = 4                    # skip existing tris
```

## Why an Explicit Triangulate Node?

The glTF 2.0 exporter triangulates on its own when `export_apply=False`, but
it uses a **fixed** diagonal — equivalent to Blender's `FIXED` method. This
produces the highest worst-case aspect ratio on non-square quads and can cause
visible diagonal shading artefacts under flat shading. An explicit `Triangulate`
node in the GN stack, combined with `export_apply=True`, gives you full control.

## Blender 5.1 Notes

- `GeometryNodeTriangulate` is stable since 3.0; the `Minimum Vertices` socket
  was added in 3.4 and is available in 5.1.
- `ngon_method="CLIP"` is faster but can produce degenerate tris on concave
  n-gons. `BEAUTY` handles concave faces correctly.
- Custom split normals survive triangulation — each triangulated face inherits
  the quad corner's normal. Verify via Object Data → Geometry Data.

## Related Tutorial

`/tutorials/blender-tutorial-gn-triangulate-mesh-webxr-tri-safe-export`
