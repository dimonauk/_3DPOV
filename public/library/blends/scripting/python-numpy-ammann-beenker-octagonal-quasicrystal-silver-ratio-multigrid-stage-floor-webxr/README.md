# Ammann-Beenker Octagonal Quasicrystal — Stage Floor

**Blender 5.1 · Python / NumPy · CC0**

A stage-floor mesh tiled with the Ammann-Beenker quasicrystal: an aperiodic
covering of the plane using exactly two tile shapes — a unit square and a
45°/135° rhombus — arranged in 8-fold (D₄) local symmetry.  Unlike a
periodic floor, no translation brings the pattern back to itself.

## What is this?

The Ammann-Beenker tiling was discovered independently by Robert Ammann (~1978)
and F.P.M. Beenker (1982).  It is the direct 8-fold analogue of the Penrose P3
tiling (5-fold, golden ratio φ).  The key algebraic fact: the **silver ratio**
λ = 1 + √2 ≈ 2.414 is the inflation factor — apply it to every length in the
tiling and you get a rescaled copy of the same tiling.

### Tile frequencies at equilibrium

The proportion of squares to rhombi is 1 : (1+√2), i.e. squares make up
≈ 29.3% of the tile count (in area, squares dominate).  The script prints the
measured sq/rh ratio after generation; it converges to 1/(1+√2) ≈ 0.414 as
the disc grows.

### Algorithm: de Bruijn multigrid dual

Instead of deflation (as for Penrose), we use de Bruijn's **multigrid-dual**
method:

1. Define four families of parallel lines at angles 0°, 45°, 90°, 135°.
2. Each intersection of families j and k maps to one tile.
3. The tile's base vertex P uses the de Bruijn index formula.
4. 90° family pairs → square; 45° family pairs → rhombus.

This gives a clean O(N²·K²) algorithm with zero deflation recursion.

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Main script: generates tiles, builds Blender mesh, exports GLB |
| `record.py`    | Viewport animation recorder (run after blueprint.py) |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for screen.mp4 |
| `ammann_beenker_floor.blend` | Saved Blender scene (after running blueprint.py) |
| `ammann_beenker_floor.glb`  | WebXR-ready export |

## Running

1. Open Blender 5.1.  File → New → General.
2. Open `blueprint.py` in the Text Editor panel.
3. Run Script (Alt+P).  Takes ~5 s; prints tile counts and sq/rh ratio.
4. Open `record.py`, run it to produce `viewport.mp4`.
5. Follow `SCREEN-RECORDING-NOTES.md` for the screen capture.

## External references

- Beenker FPM (1982). *Algebraic theory of non-periodic tilings by two simple
  building blocks: a square and a rhombus.*  TU Eindhoven EUT-Report 82-WSK-04.
  <https://research.tue.nl/en/publications/algebraic-theory-of-non-periodic-tilings-of-the-plane-by-two-sim>

- de Bruijn NG (1981). *Algebraic theory of Penrose's non-periodic tilings.*
  Indag. Math. 43: 39–66.
  <https://www.win.tue.nl/~aeb/combinatorics/penrose/debruijn.pdf>

## Licence

CC0 1.0 Universal — no rights reserved.
