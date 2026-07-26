# Geodesic Sphere — Icosahedron Frequency Subdivision

**Blender 5.1 | Python + bmesh.ops | CC0 | Holoflow Studio 2026-07-26**

## What this is

A pure-Python blueprint that constructs a **Class I geodesic sphere** from first
principles using the `bmesh.ops` API:

1. Seed a regular icosahedron (12 vertices, 20 triangular faces)
2. Subdivide every edge `FREQUENCY` times with `bmesh.ops.subdivide_edges()`
3. Project every vertex back to the sphere with `v.co = v.co.normalized() * RADIUS`
4. Optional per-face extrude accent via `bmesh.ops.extrude_discrete_faces()`
5. Apply a navy-to-gold PBR gradient material
6. Export as a Draco-compressed GLB for WebXR

## Why this construction

The icosahedron has more faces than any other Platonic solid (F = 20) and the
smallest solid-angle defect per vertex.  This minimises the worst-case area
distortion when projecting the subdivided faces to the sphere surface.

At frequency n:

| Metric | Formula | n=4 |
|--------|---------|-----|
| Faces  | 20·n²   | 320 |
| Edges  | 30·n²   | 480 |
| Vertices | 10·n²+2 | 162 |
| Euler χ | = 2 | 2 |

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Run in Blender Scripting workspace — builds and exports the sphere |
| `record.py` | Sets up the 300-frame spin animation for viewport recording |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for screen.mp4 |
| `hf_geodesic.blend` | Saved .blend (run blueprint.py to generate) |
| `hf_geodesic.glb` | Exported GLB (Draco L6, WebP textures) |

## Parameters to explore

```python
FREQUENCY      = 4      # 1=icosahedron, 2=80 faces, 3=180 faces, 4=320 faces
RADIUS         = 0.15   # metres (poi head); try 0.30 for helmet scale
EXTRUDE_DEPTH  = 0.006  # 0 for smooth shell, 0.012 for pronounced facets
SMOOTH_SHADING = True   # False for flat-shaded Platonic look
```

## Cross-references

- [GN Dual Mesh — Geodesic Voronoi Sphere](/tutorials/blender-tutorial-gn-dual-mesh-voronoi-sphere) — same topology via Geometry Nodes
- [Python + bmesh — Procedural Dodecahedron](/tutorials/blender-tutorial-python-bpy-bmesh-dodecahedron) — sibling Platonic-solid approach
- [Surface RD via Mesh Laplacian](/tutorials/blender-tutorial-python-numpy-surface-rd-mesh-laplacian-turing-vrm-webxr) — Turing patterns on an icosphere substrate
