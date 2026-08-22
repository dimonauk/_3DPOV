# Scherk's Doubly Periodic Minimal Surface — Stage Floor

**Category:** scripting · **Engine:** Blender 5.1  
**Licence:** CC0 (blueprint) / PD (source maths)

---

## What this is

Scherk's first surface, discovered in 1835 by Heinrich Ferdinand Scherk as the
answer to a Berlin Academy prize problem.  It is the **unique complete embedded
doubly-periodic minimal surface** other than the plane: every point satisfies
H = 0 (zero mean curvature) and the surface tiles the plane with period 2π in
both the x and y directions.

The defining equation on the fundamental checkerboard domain:

```
z = ln(cos y / cos x)        (x, y) ∈ (−π/2, π/2) × (−π/2, π/2)
```

or equivalently: **e^z cos y = cos x**.

The blueprint tiles nine such domains in a 3 × 3 checkerboard, alternating the
z-sign on adjacent tiles so that each pair of neighbours shares a "flat end" (an
infinite vertical wall where |z| → ∞ — the analogue of a catenoidal end for
the doubly-periodic case).

---

## Gaussian curvature — analytic formula

For z = f(u, v) = ln(cos v / cos u):

| Quantity | Expression |
|---|---|
| W² | 1 + tan²u + tan²v |
| K  | −sec²u · sec²v / W⁴ |
| K(0, 0) | −1 (maximum curvature at tile centre) |
| K → 0 | as (u, v) → (±π/2, ·) or (·, ±π/2) — flat at the walls |

The vertex colour maps |K| → cobalt (most curved) / amber (flattest).

---

## Files

| File | Purpose |
|---|---|
| `blueprint.py` | Full Blender 5.1 script — run in Scripting workspace |
| `record.py` | Viewport animation renderer (run after blueprint.py) |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for `screen.mp4` |
| `.expected-artefacts.json` | Manifest of produced artefacts |

---

## Shape keys

| Key | Amplitude | Description |
|---|---|---|
| Basis | 0 | Flat plane |
| SK_Tenth | 0.10 | Barely perceptible ripple |
| SK_Half | 0.50 | Clear undulation |
| SK_Full | 1.00 | True Scherk surface |
| SK_Steep | 1.50 | Exaggerated; strong visual impact |

---

## Cross-references

**Internal:**
- [Enneper Surface](/tutorials/blender-tutorial-python-numpy-enneper-surface-weierstrass-representation-minimal-gauss-curvature-saddle-poi-webxr) — Weierstrass–Enneper representation
- [Schwarz P/D/Gyroid TPMS](/tutorials/blender-tutorial-python-numpy-schwarz-p-d-gyroid-tpms-marching-tets-poi-webxr) — triply-periodic minimal surfaces
- [Penrose P2 Stage Floor](/tutorials/blender-tutorial-python-numpy-penrose-p2-kite-dart-aperiodic-robinson-deflation-stage-floor-webxr) — stage floor format
- [Discrete Gaussian Curvature](/tutorials/blender-tutorial-python-numpy-gauss-bonnet-angle-defect-discrete-curvature-torus-poi-webxr) — numerical counterpart

**External:**
- Scherk H F (1835) *J. reine angew. Math.* 13:185–208, Public Domain  
  <https://gdz.sub.uni-goettingen.de/id/PPN243919689_0013>
- NumPy 1.26 User Guide, BSD-3-Clause  
  <https://numpy.org/doc/1.26/>
