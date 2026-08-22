# Penrose P2 Kite-Dart Aperiodic Tiling — Stage Floor (Blender 5.1)

Penrose's original (1974) aperiodic tiling pair: the **kite** (convex,
angles 72°-72°-72°-144°) and the **dart** (non-convex, angles
36°-72°-36°-216°).  Both tiles have sides in the golden ratio φ ≈ 1.618.
The pattern is aperiodic — it never translates onto itself — yet every finite
patch appears infinitely often, and every disk of radius r contains tile
counts with kite-to-dart ratio converging to φ.

## Why P2 and not P3?

The P3 rhombus tiling (already in the library) converts the same Robinson
triangles by pairing **same-type** halves at their **base** edges.  P2 pairs
**same-type** halves at their **apex-to-base** (long or short depending on
type) edges.  Swapping the pairing rule is the only algorithmic difference —
the deflation is identical.

|           | P3 (rhombus)                       | P2 (kite-dart)               |
|-----------|-----------------------------------|-------------------------------|
| Type-0 pair | at short base BC (1-edge)        | at long side AB (φ-edge)     |
| Type-1 pair | at long base BC (φ-edge)         | at short side AB (1-edge)    |
| Resulting tiles | fat rhombus + thin rhombus | kite + dart                 |

## Tile ratio

By Perron-Frobenius, the kite:dart ratio converges to the largest eigenvalue
of the substitution matrix [[1,1],[1,0]] = φ ≈ 1.618.  The script prints the
actual ratio after pairing; at step 5 it is within 0.1 % of φ.

## Matching rules

The matching rules (arc markings that force aperiodicity) are a property of
the tiles themselves; this blueprint does not render arcs, but the extrusion
heights (55 mm kite, 35 mm dart) serve as a visual reminder that the tiles
are distinct.

## Blender setup

```
Python 3.12  ·  bpy (Blender 5.1)  ·  numpy 1.26
```

Run `blueprint.py` from the Blender Scripting workspace (Alt + P).  The
script cleans the scene, generates the tile mesh, assigns a metallic material,
and exports `penrose_p2_floor.glb` to the blend file's directory.

Run `record.py` afterwards to set camera animation keyframes; render with
`Ctrl-F12` (EEVEE Next, 1920×1080, 300 frames @ 30 fps = 10 s).

## Cross-references

**Studio internal**
- [Penrose P3 Rhombus Robinson Deflation Stage Floor](/tutorials/blender-tutorial-python-numpy-penrose-p3-rhombus-robinson-deflation-aperiodic-stage-floor-webxr) — same deflation, different pairing
- [Ammann-Beenker Octagonal Quasicrystal](/tutorials/blender-tutorial-python-numpy-ammann-beenker-octagonal-quasicrystal-silver-ratio-multigrid-stage-floor-webxr) — 8-fold quasicrystal stage floor
- [Phyllotaxis Golden Angle Fibonacci Sunflower Poi Disc](/tutorials/blender-tutorial-python-numpy-phyllotaxis-golden-angle-fibonacci-poi-disc-webxr) — golden ratio in nature

**External sources**
- Penrose R (1974) *Role of Aesthetics in Pure and Applied Mathematical Research.* Bull. Inst. Math. Appl. **10**: 266–271. Public domain.
- de Bruijn NG (1981) *Algebraic theory of Penrose's nonperiodic tilings.* Kon. Nederl. Akad. Wetensch. Proc. Ser. A **84**: 39–66. Public domain.
  <https://www.math.ucdavis.edu/~gravner/MAT135B/resources/de-Bruijn.pdf>
- NumPy Developers. *NumPy User Guide.* BSD-3-Clause.
  <https://numpy.org/doc/stable/>
