# GN Dual Mesh — Geodesic Voronoi Sphere

**Blender 5.1 | CC0 | Holoflow Studio**

Converts a subdivided icosphere into a geodesic dome mesh using the Geometry
Nodes `Dual Mesh` node, then re-projects vertex positions onto the true sphere
surface so every hexagonal and pentagonal face is geometrically flat.

## Files

| File | Purpose |
|---|---|
| `blueprint.py` | Headless build script — run with `blender --background --python blueprint.py` |
| `record.py` | Camera-orbit animation render — run after blueprint.py |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for the tutorial screen.mp4 |
| `dual_mesh_voronoi_sphere.blend` | Generated .blend (run blueprint.py to create) |

## Outputs

- `dual_mesh_voronoi_sphere.blend` — saved to this directory
- `dual_mesh_voronoi_sphere.glb` — in `public/library/glbs/geometry-nodes/gn-dual-mesh-voronoi-sphere/`
- `viewport.mp4` — in `public/library/videos/geometry-nodes/gn-dual-mesh-voronoi-sphere/`

## Key technique

```
IcoSphere (subdivisions=1)
  → GN: Subdivide Mesh (Level 2)  → 320 triangles
  → GN: Triangulate               → defensive: all-tri guarantee
  → GN: Dual Mesh                 → 162 dual vertices (150 hexagons + 12 pentagons)
  → GN: Set Position              ← Position → Normalize → Scale(1.0)
  → Shade Flat
```

The position re-projection step is the key insight: `VectorMath(NORMALIZE)` turns
each triangle-centroid position into a unit direction, then `VectorMath(SCALE, 1.0)`
scales it to the sphere radius. Without this, the sphere surface bows inward at
every hex face.

## Topology at each subdivide level

| SUBDIV_LEVEL | Source triangles | Dual vertices | Hexagons | Pentagons |
|---|---|---|---|---|
| 0 | 20 | 12 | 0 | 12 |
| 1 | 80 | 42 | 30 | 12 |
| 2 | 320 | 162 | 150 | 12 |
| 3 | 1280 | 642 | 630 | 12 |

Pentagons are always 12 regardless of subdivide level — a consequence of the
Euler characteristic of the sphere (V − E + F = 2).

## Tutorial

`/tutorials/blender-tutorial-gn-dual-mesh-voronoi-sphere`

## Licence

CC0 — all generated assets and scripts are public domain.
