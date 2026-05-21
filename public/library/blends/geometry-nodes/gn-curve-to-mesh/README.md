# GN Curve to Mesh — Procedural Cables, Pipes & Architectural Trim

**Topic**: geometry-nodes  
**Blender version**: 5.1  
**Technique**: Bezier curve spine → Resample Curve → Curve to Mesh (profile circle, fill caps)

---

## What this entry covers

Convert a Bezier curve object into a capped cylindrical mesh using Geometry
Nodes. Radius, ring vertex count, and spine resolution are all exposed as
typed modifier inputs — adjustable from the panel or from Python.

This is the correct production approach for cables, conduit, plumbing, handrails,
and architectural trim in WebXR scenes. The result is a quad-grid cylinder with
outward-facing cap normals, ready for Draco GLB export.

---

## Files

| File | Role |
|---|---|
| `blueprint.py` | Builds bezier spine + GN tree + exports `output/cable_pipe.glb` |
| `record.py` | Animates Radius: thin → thick → thin; orbits camera; renders `viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for the `screen.mp4` session recording |
| `.expected-artefacts.json` | Expected build outputs checklist |
| `output/cable_pipe.glb` | Generated GLB (git-ignored binary) |
| `cable_pipe.blend` | Saved .blend (git-ignored binary) |

---

## Running

```bash
# Blueprint (produces output/cable_pipe.glb + cable_pipe.blend)
blender --background --python blueprint.py

# Recording (open cable_pipe.blend first, then run)
blender cable_pipe.blend --python record.py
```

---

## Node graph

```
Group Input (Geometry · Radius · Ring Verts · Resample Count)
  │
  ├─ Geometry ──► Resample Curve (COUNT=32) ──► Curve to Mesh ──► Set Shade Smooth ──► Group Output
  │                                                    │
  └─ Radius, Ring Verts ──► Curve Circle (RADIUS) ────┘
                            (profile cross-section)
```

---

## Key Blender 5.1 notes

- `tree.interface.new_socket()` is the 4.0+ API. `tree.inputs.new()` was removed.
- `GeometryNodeCurveToMesh` input index 2 is `Fill Caps` (Boolean).
- `GeometryNodeResampleCurve` requires `mode = 'COUNT'` before linking the Count socket.
- `export_apply=True` in the GLB export call converts the GN-evaluated mesh to
  real geometry. Without it the exporter sees the raw Bezier curve and exports
  a line or empty mesh.
- `mod["Input_1"]` = Radius; `mod["Input_2"]` = Ring Verts; `mod["Input_3"]` = Resample Count.

---

## Cross-references

- Tutorial: [GN Instance on Points — Poisson scatter](/tutorials/blender-tutorial-gn-instance-on-points)
- Tutorial: [Geometry Nodes low-poly terrain](/tutorials/blender-tutorial-geometry-nodes-low-poly-terrain)
- Tutorial: [Blender to site asset pipeline](/tutorials/blender-to-site-asset-pipeline)

---

## Outside sources

- Blender Manual — Curve to Mesh Node  
  <https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/curve/operations/curve_to_mesh.html>  
  Licence: CC-BY-SA 4.0 · Author: Blender Foundation contributors

- KhronosGroup/glTF-Blender-IO (Apache-2.0)  
  <https://github.com/KhronosGroup/glTF-Blender-IO>  
  `export_apply=True` behaviour documented in the exporter's mesh_gltf module.

- Three.js — TubeGeometry source (MIT · mrdoob and contributors)  
  <https://github.com/mrdoob/three.js/blob/dev/src/geometries/TubeGeometry.js>  
  Reference for how the same spine + profile concept is implemented at runtime
  if you want to generate the cable procedurally in JS rather than baking it.
