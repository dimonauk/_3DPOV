# Swallowtail Catastrophe — A₄ Discriminant Surface Disc Poi

**Blender version:** 5.1  
**Technique:** Python bpy scripting + numpy parametric surface  
**Licence:** CC0  
**Slug:** `python-numpy-swallowtail-catastrophe-a4-germ-thom-discriminant-surface-poi-webxr`

## What this is

The **swallowtail catastrophe** is the third elementary catastrophe in René Thom's
1972 classification, denoted A₄.  Its potential function is:

```
V(x; a, b, c) = x⁵ + ax³ + bx² + cx
```

The **discriminant surface** S₄ ⊂ ℝ³(a, b, c) is the set of (a, b, c) values where
V has a degenerate critical point — where a fold of critical values collapses into a
cusp, or a cusp folds further into the swallowtail tip.  The surface takes its name
from its silhouette: two wings spreading from a cusp throat, with a self-intersecting
tail beneath.

## Key mathematics

The surface is parametrised in closed form by (x, a) ∈ ℝ²:

```
b(x, a) = −10x³ − 3ax
c(x, a) =  15x⁴ + 3ax²
```

derived from the simultaneous conditions V′ = V″ = 0.

The complement of S₄ in ℝ³ has two path components:
- **Inside** (between the wings): V′ has **four** distinct real critical points.
- **Outside**: V′ has **two** distinct real critical points.

Crossing S₄ causes a pair of critical points to collide and annihilate — a
saddle-node bifurcation.  Traversing the cusp edge corresponds to three critical
points colliding at once.

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Builds the swallowtail mesh, three shape keys, vertex colour, emission material and exports GLB. |
| `record.py` | 120-frame orbit + shape-key morph animation → `viewport.mp4`. |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for the screen capture. |
| `.expected-artefacts.json` | Lists all expected output files. |

## Running

Open `blueprint.py` in Blender 5.1's Text Editor and press **Run Script**.  No
external dependencies beyond numpy (bundled in Blender 5.1).

## Output geometry

- **Vertices:** 88 × 66 = 5,808
- **Quads:** 87 × 65 = 5,655
- **Diameter:** 18 cm (disc poi format)
- **Shape keys:** Basis · Swallowtail_Tight · Swallowtail_Flat
- **Vertex attribute:** `SCat` (FLOAT_COLOR POINT) — gold at cusp, violet at wings

## Attribution

Mathematical content derived from:
- V.I. Arnold, *Catastrophe Theory* (3rd ed., Springer, 1992) — mathematical framework
- René Thom, *Structural Stability and Morphogenesis* (1972, W.A. Benjamin) — classification theorem
- Poston & Stewart, *Catastrophe Theory and Its Applications* (1978, Pitman) — geometric intuition

Code: CC0.  Mathematical formulas are uncopyrightable facts.
