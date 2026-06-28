# GN Dual Mesh — Pentagon-Hexagon Hull Armour Panel

**Blender 5.1 · Geometry Nodes · WebXR / GLB export**

---

## What this produces

A closed sphere covered with 30 hexagonal and 12 pentagonal raised panels —
the Buckminster Fuller C60 / football-stitch geometry — generated from a
single `Dual Mesh` node applied to a subdivided icosphere. Pentagon faces
carry an emissive cyan material; hexagon faces are metallic slate-blue.
The stack is non-destructive until the `apply` call in `blueprint.py`.

Output files:

| File | Location |
|---|---|
| `hull_armour.blend` | `public/library/blends/geometry-nodes/gn-dual-mesh-hexagonal-hull-armour/` |
| `hull_armour.glb` | `public/library/glbs/geometry-nodes/gn-dual-mesh-hexagonal-hull-armour/` |
| `viewport.mp4` | `public/library/videos/geometry-nodes/gn-dual-mesh-hexagonal-hull-armour/` |
| `screen.mp4` | `public/library/videos/geometry-nodes/gn-dual-mesh-hexagonal-hull-armour/` |

---

## How to run

```bash
blender --background --python blueprint.py
# then (for the animated recording):
blender --background hull_armour.blend --python record.py
```

---

## Topology proof

Icosphere subdivision 2: **V = 42, E = 120, F = 80**. Euler: 42 − 120 + 80 = 2 ✓

Its dual: **V = 80, E = 120, F = 42**. Face valence sum: 12 × 5 + 30 × 6 = 240 = 2 × 120 ✓

The 12 degree-5 icosphere vertices become the 12 pentagon faces.
The 30 degree-6 midpoint vertices become the 30 hexagon faces.

---

## Key Blender 5.1 nodes

- **GeometryNodeDualMesh** — swaps face ↔ vertex topology
- **GeometryNodeCornersOfFace** → `Total` output — per-face corner count
- **FunctionNodeCompare** (INT, EQUAL, B=5) — selects pentagon faces
- **GeometryNodeScaleElements** (FACE, UNIFORM) — panel gap
- **GeometryNodeExtrudeMesh** (FACES, Individual) — panel depth
- **GeometryNodeSmoothByAngle** — sharp inter-panel edges

---

## Attribution

- Blender Foundation, "Dual Mesh — Geometry Nodes Reference",
  https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/mesh/operations/dual_mesh.html,
  CC BY-SA 4.0 (documentation reference; no text reproduced)

- Nicholas Sharp et al., **polyscope** (MIT),
  https://github.com/nmwsharp/polyscope —
  dual-mesh examples in `examples/intrinsic_triangulations`.
  Related: nmwsharp/potpourri3d, nmwsharp/robust-laplacians-py (both MIT)
