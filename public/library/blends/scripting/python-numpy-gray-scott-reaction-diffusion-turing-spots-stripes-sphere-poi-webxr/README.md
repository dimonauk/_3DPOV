# Gray-Scott Reaction-Diffusion / Turing Patterns
### Python + NumPy — Blender 5.1 Scripting Tutorial

**Slug**: `python-numpy-gray-scott-reaction-diffusion-turing-spots-stripes-sphere-poi-webxr`  
**Category**: scripting · poi-disc · reaction-diffusion  
**Blender**: 5.1 · **Licence**: CC0

---

## What this makes

A flat poi disc (80 × 80 quad grid, PHYS_SIZE ±0.20 m, 6 241 quad faces) whose
height and vertex colour are driven by the inhibitor concentration V from the
**Gray-Scott two-variable reaction-diffusion model**. Where V accumulates, the
disc rises and glows cobalt; the background substrate U stays amber.

Alan Turing showed in 1952 that asymmetric diffusion alone can break a uniform
chemical state into periodic spatial patterns. Gray and Scott (1984) distilled
this into two coupled PDEs, and Pearson (1993) mapped at least twelve distinct
pattern classes across (F, k) space — spots, stripes, labyrinths, solitons,
and travelling waves — using the same pair of equations.

---

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Full bpy script — mesh, integrator, shape keys, GLB export |
| `record.py` | 150-frame EEVEE Next animation (spot → stripe → labyrinth) |
| `SCREEN-RECORDING-NOTES.md` | OBS capture guide for `screen.mp4` |
| `.expected-artefacts.json` | CI artefact manifest |

---

## Shape keys

| Key | F | k | Pearson class | Visual |
|-----|---|---|--------------|--------|
| Basis | 0.055 | 0.062 | α (spots) | Leopard / cheetah spots |
| SK_Stripes | 0.060 | 0.045 | γ (stripes) | Zebra / angelfish stripes |
| SK_Labyrinth | 0.062 | 0.061 | ε (labyrinthine) | Winding maze channels |
| SK_Solitons | 0.025 | 0.060 | μ-ish (solitons) | Isolated bright blobs |

---

## Gray-Scott equations

```
dU/dt = D_u · ∇²U  −  U·V²  +  F·(1 − U)
dV/dt = D_v · ∇²V  +  U·V²  −  (F+k)·V
```

- **U** (substrate, fed at rate F): diffuses quickly (D_u = 0.16).
- **V** (activator/inhibitor, autocatalytic via U·V²): diffuses slowly (D_v = 0.08).
- **Turing instability**: D_u / D_v = 2 means the inhibitor spreads only half
  as fast as the substrate; a spatially uniform steady-state becomes linearly
  unstable at wavelength Λ ≈ 2π√(D_u / F).

---

## Implementation notes

- **Laplacian**: five-point periodic stencil via `np.roll` — no SciPy dependency.
- **Initial condition**: random V-seed in a 20 × 20 central patch; U = 1 − V
  there and 1 elsewhere. Same RNG seed across all four runs so only (F, k) varies.
- **Integration**: explicit Euler, DT = 1.0, 3 000 steps, values clamped to [0, 1].
- **Vertex colour**: `FLOAT_COLOR POINT` attribute `RD_Concentration`, drives both
  Base Color and Emission via ShaderNodeAttribute in Principled BSDF.
- **Shape keys**: `foreach_set("co", coords)` bulk-writes float32 coords to each
  shape key block — Blender 5.1 internal representation.

---

## Outside sources

1. **Alan M. Turing** (1952). "The Chemical Basis of Morphogenesis."  
   *Proc. R. Soc. Lond. B* **237**(641), pp. 37–72. **Public Domain.**  
   https://doi.org/10.1098/rstb.1952.0012  
   *Related*: J. E. Pearson (1993). "Complex Patterns in a Simple System."  
   *Science* **261**(5118), pp. 189–192. Equations PD.  
   https://doi.org/10.1126/science.261.5118.189

2. **NumPy Developers** (2024). *NumPy 2.x Documentation.* **BSD-3-Clause.**  
   https://numpy.org/doc/stable/ · GitHub: https://github.com/numpy/numpy  
   *Related*: SciPy Community. *SciPy Documentation.* BSD-3-Clause.  
   https://scipy.org/ · `scipy.ndimage.laplace` as alternative Laplacian.

---

## Studio cross-references

- `/tutorials/blender-tutorial-python-numpy-mean-curvature-flow-huisken-cotangent-laplacian-sphere-smoothing-poi-webxr`
  — cotangent-Laplacian on mesh; same diffusion operator, different application
- `/tutorials/blender-tutorial-python-numpy-sinai-billiard-lorentz-gas-dispersing-lyapunov-poincare-stage-floor-webxr`
  — density height-field technique (scalar field → z-displacement → colour)
- `/tutorials/blender-tutorial-python-numpy-miura-ori-rigid-origami-kawasaki-flat-fold-auxetic-poi-disc-webxr`
  — `foreach_set("co")` shape-key bulk-write pattern
