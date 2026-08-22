# Goldberg Polyhedra GP(1,1) — C₆₀ Hexagonal Cage Poi Head (Blender 5.1)

> **T = m² + mn + n²; for m=1, n=1: T = 3 → 12 pentagons, 20 hexagons.**

A Goldberg polyhedron GP(m,n) is the **dual of a geodesic sphere**: take a
frequency-*m* class-I (or class-II) triangulated icosahedron, compute each
triangular face's circumcentre, project to the sphere, connect adjacent
circumcentres — and you get a tiling of pentagons and hexagons.  Only the 12
pentagons are topologically mandated (Euler's formula fixes them); every
higher-T member adds 10 more hexagons per increment.

GP(1,1) specifically is the **truncated icosahedron** — the standard
football/soccer ball panel pattern, and the carbon atom arrangement of
**C₆₀ Buckminsterfullerene** (Nobel Chemistry 1996).

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Blender 5.1 script — builds GP(1,1) mesh, materials, shape keys, exports GLB |
| `record.py` | Renders `viewport.mp4` animation (turntable + shape-key transitions) |
| `SCREEN-RECORDING-NOTES.md` | OBS / Game Bar shot list for the tutorial video |
| `.expected-artefacts.json` | CI manifest — expected outputs |

## Key mathematics

| Symbol | Value | Meaning |
|--------|-------|---------|
| φ | (1+√5)/2 ≈ 1.618 | Golden ratio — icosahedron edge proportions |
| T | m²+mn+n² = 3 | Triangulation number for GP(1,1) |
| V | 60 | Vertices = 2 × 30 edges × t = 60 trisection points |
| E | 90 | Edges (each of 12 pentagons gives 5, each of 20 hexagons gives 6; E = (12×5+20×6)/2 = 90) |
| F | 32 | Faces = 12 pentagons + 20 hexagons |
| χ | 2 | Euler characteristic V−E+F = 60−90+32 = 2 ✓ (sphere) |

## Running the blueprint

```bash
# Inside Blender 5.1 scripting workspace:
# 1. Open blueprint.py
# 2. Run Script (Alt+P)
# 3. Check system console for:  ✓ hf_goldberg_gp11_poi.glb written
```

Requires `scipy` in Blender's bundled Python
(`pip install scipy` into Blender's Python or via the Blender Extensions Platform).

## Output artefacts

- `hf_goldberg_gp11_poi.blend` — the saved Blender file
- `hf_goldberg_gp11_poi.glb` — Draco-compressed WebXR GLB
- `viewport.mp4` — rendered animation (via `record.py`)
- `screen.mp4` — OBS screen recording (manual step per `SCREEN-RECORDING-NOTES.md`)

## External references

1. **Goldberg M** (1937) *A class of multi-symmetric polyhedra.*
   Tôhoku Mathematical Journal **43**: 104–108. Public Domain.
2. **Antiprism** (Rossiter A) — polyhedron manipulation toolkit, MIT Licence.
   <https://github.com/antiprism/antiprism>
   Sibling: <https://github.com/antiprism/antiprism_python>
