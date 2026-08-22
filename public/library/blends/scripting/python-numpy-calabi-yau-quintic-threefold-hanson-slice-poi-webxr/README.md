# Calabi-Yau Quintic Threefold — 2D Cross-Section Poi Head
**Blender 5.1 · Python 3.11 · NumPy 1.26 · CC0-1.0**

---

## What this is

The **Fermat quintic curve** z₁⁵ + z₂⁵ = 1 in ℂ² is the lowest-dimensional member
of the **Calabi-Yau** family — compact Kähler manifolds with a vanishing first Chern
class, whose existence Eugenio Calabi conjectured in 1954 and Shing-Tung Yau proved
in 1977 by solving the complex Monge-Ampère equation.

The curve is a **five-sheeted branched cover of ℂP¹** (Riemann sphere), branching at
the five 5th roots of unity where z₂ = 0.  This blueprint selects each sheet by
rotating the argument of w = 1 − z₁⁵ by 2πn/5 before extracting the 5th root,
giving five analytically continued branches n = 0 … 4.

The surface is **projected to ℝ³** via (Re z₁, Im z₁, Re z₂), producing a five-armed
star-like surface that works as a faceted poi head for WebXR.

---

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Generates the Blender scene and exports GLB |
| `record.py` | Renders a 120-frame orbit animation to `viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS/Game Bar instructions for `screen.mp4` |
| `.expected-artefacts.json` | Build manifest + cross-references |

---

## How to run

1. Open **Blender 5.1**.
2. Switch to the **Scripting** workspace.
3. Open `blueprint.py` in the text editor.
4. Click **Run Script**.  The five-petal mesh appears in approximately 3–8 seconds
   (depending on grid resolution).
5. The GLB is exported to the same directory as the `.blend` file.

To generate the viewport animation, run `record.py` in the same session
(after `blueprint.py` has already run).

---

## Parameters to tune

| Constant | Default | Effect |
|----------|---------|--------|
| `U_STEPS` | 100 | Radial resolution per sheet |
| `V_STEPS` | 100 | Angular resolution per sheet |
| `R_MAX` | 0.97 | Max radial reach — decrease to widen the central gap |
| `EXPORT_SCALE` | 0.05 | Poi-head diameter in metres |

---

## Mathematical depth

- **Genus**: By the Riemann-Hurwitz formula, a degree-5 cover of S² branching at 5
  points with full ramification gives χ = 5·(2) − 5·4 = −10, so genus g = 6.
- **Moduli**: The Calabi-Yau condition (c₁ = 0) means the holomorphic volume form
  Ω = dz₁ ∧ dz₂ / (5z₂⁴) is globally well-defined on each sheet.
- **Mirror symmetry**: The quintic is mirror-dual to a quotient of itself by a ℤ₅³
  action — the mirror pair explored by Candelas, de la Ossa, Green & Parkes (1991)
  that launched string-theory mirror symmetry.

---

## Cross-references

- [Hopf Fibration](/tutorials/blender-tutorial-python-numpy-hopf-fibration-s3-s2-fiber-bundle-linked-circles-poi-webxr) — principal bundle geometry in ℂ²
- [Kummer Quartic](/tutorials/blender-tutorial-python-numpy-kummer-quartic-16-nodes-tetrahedral-k3-poi-head-webxr) — K3 algebraic surface (related to CY twofolds)
- [Möbius Transformations](/tutorials/blender-tutorial-python-numpy-mobius-transformation-riemann-sphere-loxodromic-poi-webxr) — Riemann sphere and complex projective geometry
