# Kleinian Limit Set — Schottky Group & Fractal Dust Sculpture

**Blender 5.1 · Python / numpy · CC0**

A 4-circle symmetric Schottky group produces a fractal limit set in ℂ that,
when lifted to S² via inverse stereographic projection, forms a self-similar
cloud sculpture suitable for WebXR and as inspiration for poi light-painting
patterns.

## Files

| File | Purpose |
|---|---|
| `blueprint.py` | Generates scene, mesh, materials, exports GLB |
| `record.py` | 12-second camera orbit animation for viewport.mp4 |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for screen.mp4 |
| `hf_kleinian.blend` | Saved blend (produced by blueprint.py) |
| `hf_kleinian.glb` | WebXR-ready GLB (Draco 6, +Y up) |

## Quick start

1. Open Blender 5.1 → Scripting workspace
2. Load `blueprint.py` and press **Run Script**
3. Inspect scene; switch to Rendered shading to see EEVEE bloom
4. Run `record.py` for the viewport animation

## Algorithm

A **Schottky group** G = ⟨a, b⟩ ⊂ PSL(2,ℂ) is constructed from four disjoint
circles {C_a, C_A, C_b, C_B} in ℂ:

- generator `a` maps ext(C_a) homeomorphically onto int(C_A)
- generator `b` maps ext(C_b) homeomorphically onto int(C_B)
- inverses `a⁻¹`, `b⁻¹` are the reverse maps

**Generator matrices** (normalised so det = 1):

```
D = 1.55, R = 1.00 → K = (D²-R²)/R = 1.4025

a   = [[D/R,    K   ], [1/R,  D/R]]  = [[1.55, 1.4025], [1.0, 1.55]]
a⁻¹ = [[D/R,   -K   ], [-1/R, D/R]]
b   = [[D/R,   iK   ], [-i/R, D/R]]  (90°-rotation conjugate of a)
b⁻¹ = [[D/R,  -iK   ], [ i/R, D/R]]
```

**Disjointness check** (necessary for a classical Schottky group):
- Real-axis pair: |2D| = 3.1 > 2R = 2.0 ✓
- Diagonal pair: D√2 ≈ 2.19 > 2R = 2.0 ✓

**Limit set** computed by DFS over words of length `DEPTH = 8`:
- No adjacent cancellation (skip `a⁻¹` immediately after `a`, etc.)
- Terminal count: 4 · 3^(DEPTH−1) = 8 748 points
- Near-∞ artefacts filtered: |w| < 80

**Visualisation**: each limit point on S² is represented as a tiny
equilateral triangle (side 14 mm) lying in the local tangent plane,
coloured with a violet emission material (EEVEE bloom radius 4.0).

## Parameters to explore

| Variable | Effect |
|---|---|
| `D` closer to `R√2` ≈ 1.414 | Richer, denser fractal (more limit-set accumulation) |
| `D` much larger than `R√2` | Sparser, more separated clusters |
| `DEPTH` 9 → 26 244 pts | Finer resolution; takes ~3 s in Python |
| `DEPTH` 10 → 78 732 pts | Very fine; takes ~10 s; GLB grows to ~3 MB |
| `SEED` changed | Same limit set (it is orbit-independent) |

## Licence
CC0 — no rights reserved. Attribution appreciated but not required.
Outside sources credited in `blueprint.py` header.
