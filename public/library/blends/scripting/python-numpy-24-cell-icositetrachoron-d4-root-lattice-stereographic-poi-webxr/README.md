# 24-Cell {3,4,3} — D₄ Root System & Stereographic Poi Head

**Blender 5.1 · Python numpy · CC0**

## What this is

A production blueprint for the 24-cell (icositetrachoron), the unique
**self-dual** regular 4-polytope. Its 24 vertices are all permutations of
(±1, ±1, 0, 0) in ℝ⁴ — the root vectors of the **D₄ root system**. Self-duality
is a consequence of D₄'s exceptional triality symmetry: the Dynkin diagram has
an outer automorphism group of order 6 (S₃), meaning the 24-cell maps to itself
under a permutation of its vertex types.

Stereographic projection from the north pole of S³ renders the 96 edges as
straight lines in ℝ³, revealing three concentric shells:

| Shell | Vertices | Colour | ℝ³ geometry |
|---|---|---|---|
| Northern (w = +1/√2) | 6 | Icy blue | Octahedron (outer) |
| Equatorial (w = 0) | 12 | Amber | Cuboctahedron (mid) |
| Southern (w = −1/√2) | 6 | Lime | Octahedron (inner, small) |

The edge tubes carry three-tier emission colouring: blue for north↔north and
north↔equatorial, amber for equatorial↔equatorial, green for south↔south and
south↔equatorial.

## Files

| File | Purpose |
|---|---|
| `blueprint.py` | Generates the geometry and exports `hf_24cell_poi.glb` |
| `record.py` | Renders a 5 s / 150-frame orbit to `viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for `screen.mp4` |
| `.expected-artefacts.json` | Manifest for CI/asset checks |

## Running

```bash
# Stand-alone (headless)
blender --background --python blueprint.py

# With GUI
# Open Blender 5.1 → Scripting workspace → Open blueprint.py → Run Script
```

## Key mathematical facts

- **Self-duality**: In 4D, the regular polytope dual to the 24-cell is another 24-cell.
  No other regular polytope in any dimension ≥ 4 (except in dimension 1) has a
  self-dual regular form beyond the simplex family {3,...,3}.
- **D₄ roots**: The 24 vertices are the D₄ short roots at scale 1/√2 on S³.
  D₄ is the only root system with an outer automorphism of order > 2 (it is S₃,
  the symmetric group on 3 letters), which is the algebraic origin of the
  24-cell's self-duality.
- **Vertex degree**: Each vertex has exactly 8 neighbours (edge-degree 8).
  Compare: icosahedron 5, cuboctahedron 4, 600-cell 12.
- **Cell structure**: 24 octahedral cells, each sharing a face with 8 neighbours.
- **Projection geometry**: The stereographic image of the northern shell is
  an outer octahedron; the equatorial shell is a cuboctahedron; the southern
  shell is a smaller inner octahedron. Together they form a nested
  three-shell poi head with three-colour emission glow.

## Licence

CC0 — no rights reserved. Mathematical content is public domain.
Outside references:

- Coxeter, H.S.M. (1973) *Regular Polytopes*, 3rd ed., Dover Publications.
  Algorithm: public domain.
- Salazar, G. & Torrence, B.F. (2018) "The 24-cell is self-dual."
  *Mathematics Magazine* 91(5):378–382.
  https://doi.org/10.1080/0025570X.2018.1528875
