# DEC Harmonic 1-Form — Perturbed Torus
**Blender 5.1 · Python · numpy · scipy.sparse**

Computes the de Rham cohomology generator H¹(T²; ℝ) on a triangulated torus
using Discrete Exterior Calculus (DEC) with the cotangent Hodge star.

---

## What this produces

| File | Description |
|------|-------------|
| `hf_dec_torus.glb` | Torus mesh with `harmonic_phase` vertex-colour attribute (circular HSV ramp) |
| `blueprint.py` | Full DEC pipeline: cochain complex → cotan Laplacian → Dirichlet solve → Blender mesh |
| `record.py` | Automated 120-frame orbit render |
| `SCREEN-RECORDING-NOTES.md` | OBS / Game Bar instructions for screen.mp4 |

## Run order

```bash
# 1. Run blueprint to build mesh + export GLB
blender --python blueprint.py

# 2. Optionally save as .blend, then render orbit
blender --background hf_dec_torus.blend --python record.py
```

## Key parameters (top of blueprint.py)

| Constant | Default | Effect |
|----------|---------|--------|
| `R_MAJOR` | 1.60 | Major torus radius |
| `R_MINOR` | 0.50 | Tube radius |
| `N_T` | 64 | Longitude resolution (cut axis) |
| `N_P` | 32 | Latitude resolution |
| `BUMP_FREQ` | 3 | Sinusoidal bump wave number |
| `BUMP_AMP` | 0.18 | Bump amplitude (fraction of R_MINOR) |

## Theory in one paragraph

The cotangent Laplacian L is built from the chain complex
(C₀, C₁, C₂) with exterior derivatives d₀ and d₁. The Hodge star ⋆₁
assigns each edge a weight `w = (cot α + cot β)/2` from the two opposite
angles in adjacent triangles. Cutting the torus along a meridian exposes
a cylinder; imposing u=0 and u=1 on the two boundary circles and solving
`L_II u_I = −L_IB u_B` via conjugate gradient yields the discrete harmonic
representative of the longitude generator [dθ] ∈ H¹(T²; ℝ). The deviation
from `i/N_T` quantifies the metric distortion introduced by the bump field.

## Cross-references

- Tutorial: `/tutorials/blender-tutorial-python-numpy-scipy-dec-hodge-star-harmonic-1form-perturbed-torus-webxr`
- Related: Laplace-Beltrami Eigenmodes tutorial (spectral mesh decomposition)
- Related: Cotangent Laplacian Mesh Fairing tutorial (same weights, different use)
- Related: Hopf Fibration tutorial (topology on S³)

## Outside sources

1. **Pinkall & Polthier** (1993) "Computing Discrete Minimal Surfaces and Their Conjugates"
   *Experimental Mathematics* 2(1):15–36. Academic open access.
   https://projecteuclid.org/journals/experimental-mathematics/volume-2/issue-1/

2. **Keenan Crane, Fernando de Goes, Mathieu Desbrun, Peter Schröder**
   "Digital Geometry Processing with Discrete Exterior Calculus" (SIGGRAPH 2013 course notes)
   CC BY 4.0 · https://www.cs.cmu.edu/~kmcrane/Projects/DDG/paper.pdf
   Related: https://github.com/nmwsharp/geometry-central (MIT licence)
