# Wigner-Seitz Cell: BCC / FCC / SC Bravais Lattice 3D Voronoi → Poi Head
**Blender 5.1 | Python + numpy + scipy | CC0 | Holoflow Studio**

Constructs the Wigner-Seitz cells of three Bravais lattices — simple cubic (SC),
body-centred cubic (BCC), and face-centred cubic (FCC) — via 3D Voronoi
tessellation, producing three distinct convex polyhedra as faceted poi heads.

## Quick Start

```bash
blender --python blueprint.py
```

Output: `hf_wigner_seitz.glb` — three poi-scale objects (Draco-6, +Y-up, `holoflow:facet=True`).

## What You Get

| Lattice | WS Cell | Faces | Shape |
|---------|---------|-------|-------|
| SC  | Cube | 6 square {100} | Equal-angle cube; tiles 3-space trivially |
| BCC | Truncated octahedron | 8 hexagon {111} + 6 square {100} | 14-face; the densest monohedral space-filler |
| FCC | Rhombic dodecahedron | 12 rhombus {110} | 12 identical faces; dual of the cuboctahedron |

## Vertex Colour Legend

| Colour | Miller family | Faces |
|--------|--------------|-------|
| 🔵 Ice-blue | {100} | Square faces perpendicular to ±x, ±y, ±z |
| 🟠 Amber   | {111} | Hexagonal faces along body diagonals |
| 🟢 Lime    | {110} | Rhombic faces along face diagonals |

## Algorithm

1. **Primitive vectors** — each lattice defined by its true repeat unit (not the conventional cell).
2. **Lattice generation** — `±3` shells of integer combinations: `p = i·a₁ + j·a₂ + k·a₃`.
3. **`scipy.Voronoi`** — 3D Voronoi tessellation; extract the origin's Voronoi region (index 0).
4. **`scipy.ConvexHull`** — triangulate WS cell vertices; merge co-planar triangles into polygon faces.
5. **Miller classification** — dot-product alignment test against `{100}`, `{111}`, `{110}` direction sets.
6. **bmesh** — per-loop vertex colour, flat shading, emission material; `holoflow:facet = True`.

## Recording

```bash
# After blueprint.py has built the scene:
blender --python record.py
```

Writes `public/library/videos/scripting/.../viewport.mp4` — 180-frame turntable + close-up.

## Physics Context: First Brillouin Zone

The Wigner-Seitz construction in **reciprocal space** gives the first Brillouin zone —
the fundamental domain of crystal momentum k.  The FCC BZ (rhombic dodecahedron in real
space) becomes a **truncated octahedron** in reciprocal space (the BCC reciprocal lattice
is FCC), and vice versa.  High-symmetry points Γ, X, L, W, K etc. are the special k-points
at the zone boundary — the band structure plots you see in textbooks are paths between them.

## Studio Cross-References

- [Spherical Voronoi CVT Poi Head](/tutorials/blender-tutorial-python-scipy-spherical-voronoi-lloyd-cvt-faceted-poi-head-webxr) — Voronoi on S², same algorithm family.
- [Lennard-Jones Crystal Nucleation](/tutorials/blender-tutorial-python-lennard-jones-md-crystal-nucleation-berendsen) — WS cells as natural simulation domains.
- [GN Crystal Geode](/tutorials/blender-tutorial-gn-distribute-points-in-volume-crystal-geode) — Geometry Nodes crystal clustering.
- [DEC Hodge Star Torus](/tutorials/blender-tutorial-python-numpy-scipy-dec-hodge-star-harmonic-1form-perturbed-torus-webxr) — another scipy.spatial application.

## Licence

CC0 — no rights reserved.  Wigner-Seitz construction (1933) is public domain mathematics.
