# Schwarz–Christoffel Conformal Map — Crystal Poi Disc

**Blender 5.1 · Python 3.11 · numpy · scipy (optional)**  
**Category:** scripting / conformal geometry  
**Licence:** CC0

## What is this?

The Schwarz–Christoffel (SC) formula is the *only* known explicit
closed-form conformal map between a canonical domain (the unit disk or
upper half-plane) and a polygon interior.  For a **regular n-gon**, the
formula simplifies beautifully:

```
f(w) = C · w · ₂F₁(1/n, 2/n; 1+1/n; w^n)
```

where ₂F₁ is the Gauss hypergeometric function and  
`C = Γ(1−1/n) / [Γ(1+1/n) · Γ(1−2/n)]`  
is the unique normalisation constant that places the polygon vertex at
unit circumradius.

### Why the formula collapses

The general SC map integrates a product over all prevertices.  For a
regular n-gon every prevertex sits at `w_k = exp(2πik/n)`, and the
polynomial identity

```
∏_{k=0}^{n-1} (1 − w · w̄_k) = 1 − w^n
```

reduces the product to a single power of `(1 − w^n)` — an extraordinary
simplification from n individual terms.

### Conformal distortion field

The Jacobian `J = |f'(w)|² = C²·|1−w^n|^{−4/n}`:

| Location | Distortion |
|---|---|
| `w = 0` (disc centre) | Uniform: J = C² |
| `w → w_k` (prevertex) | Singular: J → ∞ |
| Midpoints on `∂D` | Minimum stretching |

Vertex colours encode `log J`, producing a **stained-glass distortion
map** — deep violet in the flat interior, bright amber at the sharp
corners.

## Files

| File | Purpose |
|---|---|
| `blueprint.py` | Builds the SC crystal poi disc in Blender |
| `record.py` | Animates 240-frame morph sequence for `viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for `screen.mp4` |
| `hf_sc_crystal_disc.blend` | Blender file (after running blueprint) |
| `hf_sc_crystal_disc.glb` | WebXR-ready GLB with Draco compression + morph targets |

## Shape keys

| Key | Polygon | Notes |
|---|---|---|
| `Basis` | n=5 pentagon | Mesh topology base |
| `Poly_03` | n=3 triangle | Sharpest corners, maximum Jacobian singularity |
| `Poly_04` | n=4 square | 90° right-angle crystal symmetry |
| `Poly_06` | n=6 hexagon | Honeycomb / snowflake symmetry |
| `Poly_08` | n=8 octagon | Approaches the circular limit |

## Usage

```bash
# 1. Build
blender --background --python blueprint.py

# 2. Record viewport animation
blender hf_sc_crystal_disc.blend --background --python record.py

# 3. Screen-record manually (see SCREEN-RECORDING-NOTES.md)
```

## Dependencies

- **NumPy** ≥ 1.24 (included in Blender 5.1)
- **SciPy** ≥ 1.11 (optional — for `scipy.special.hyp2f1`).  
  Without SciPy the script uses a 90-term hypergeometric power series
  (accurate to 14 decimal places for `|w| ≤ 0.90`).

## Connections

- Conformal map for aerofoil: [Joukowski Transform](../python-numpy-joukowski-conformal-map-aerofoil-complex-potential-flow-poi-webxr/)
- Möbius disk automorphisms: [Möbius Transformation](../python-numpy-mobius-transformation-riemann-sphere-loxodromic-poi-webxr/)
- Crystal lattice geometry: [Wigner-Seitz / Brillouin Zone](../python-numpy-scipy-wigner-seitz-bcc-fcc-brillouin-zone-3d-voronoi-poi-head-webxr/)

## Sources

1. Driscoll, T.A. & Trefethen, L.N. (2002). *Schwarz–Christoffel Mapping*.
   Cambridge University Press. ISBN 0-521-80726-3. (Mathematical content PD.)
2. DLMF §15 — Hypergeometric Function. NIST. Public Domain (US Government).
   <https://dlmf.nist.gov/15>
3. NumPy community. BSD-3-Clause. <https://numpy.org/doc/stable/>
