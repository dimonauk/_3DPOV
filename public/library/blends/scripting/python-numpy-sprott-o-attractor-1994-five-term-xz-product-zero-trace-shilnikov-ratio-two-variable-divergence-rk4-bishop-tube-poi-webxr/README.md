# Sprott O Attractor — 1994 Canonical Case O

**System:** ẋ = y · ẏ = x − z · ż = x + xz + by  
**Canonical parameter:** b = 2.7  
**Blender version:** 5.1  
**Licence:** CC0 (equations are public-domain mathematics)

## What makes Sprott O remarkable

Among the nineteen canonical Sprott (1994) attractors, Case O possesses a
structural invariant found in none of the others: its Jacobian at the origin
has **zero trace**, which forces the Shilnikov ratio at that equilibrium to
be exactly 2 for every value of the parameter b.  The canonical Lorenz
attractor has a Shilnikov ratio that varies with r; every other Sprott case
with a non-constant ratio shifts when its parameter changes.  Sprott O's
ratio is locked.

### Fixed-point anatomy

| Equilibrium | Type | Eigenvalues (b=2.7) | Notes |
|-------------|------|---------------------|-------|
| O = (0, 0, 0) | Shilnikov saddle-focus | −0.510, +0.255±1.378i | Ratio = 2 exactly, for all b |
| P = (−1, 0, −1) | Saddle-spiral | +0.430, −0.715±1.348i | Unstable real + stable spiral |

### Variable divergence

∇·F = x (position-dependent).  ⟨x⟩ ≈ −0.47 on the attractor → net
dissipation −0.47 per unit time.  This is the same structural class as
Sprott D (∇·F = x) and Sprott K (∇·F = y − const), rare within the 1994
catalogue.

### Lyapunov spectrum

| Exponent | Value |
|----------|-------|
| λ₁ (max) | ≈ +0.086 |
| λ₂ (neutral) | 0 |
| λ₃ | ≈ −0.556 |
| D_KY | ≈ 2.155 |
| Lyapunov time τ | ≈ 11.6 tu |

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Full bpy + numpy pipeline: ODE → Bishop tube → shape keys → GLB-ready |
| `record.py` | Viewport animation (150 frames, 30 fps, camera orbit + shape-key morph) |
| `SCREEN-RECORDING-NOTES.md` | OBS / Game Bar instructions for capturing the screen recording |
| `.expected-artefacts.json` | Expected output file manifest |

## Running the blueprint

```python
# In Blender 5.1 → Scripting workspace:
exec(open("/path/to/blueprint.py").read())
# Console will print: [SprottO] Done.  Vertices=24000, Faces=23992, ShapeKeys=[...]
```

## Shape keys

| Key | b value | Character |
|-----|---------|-----------|
| Basis | 2.7 | Canonical — asymmetric scroll |
| SK_LowB | 2.0 | Broader orbit, weaker z-feedback |
| SK_HighB | 3.5 | Tighter orbit, stronger z-coupling |
| SK_NearP | 1.7 | Lower b shifts orbit toward P neighbourhood |

## Cross-references

- **Tutorial:** `/tutorials/blender-tutorial-python-numpy-sprott-o-attractor-1994-five-term-xz-product-zero-trace-shilnikov-ratio-two-variable-divergence-rk4-bishop-tube-poi-webxr`
- **Sprott K** (also variable divergence, xz product): `/tutorials/blender-tutorial-python-numpy-sprott-k-attractor-1994-single-xy-product-shilnikov-saddle-focus-variable-divergence-rk4-bishop-tube-poi-webxr`
- **Sprott D** (variable divergence, non-hyperbolic origin): `/tutorials/blender-tutorial-python-numpy-sprott-d-attractor-1994-five-term-two-quadratic-xz-y2-nonhyperbolic-origin-rk4-bishop-tube-poi-webxr`
- **Sprott N** (highest Shilnikov ratio in catalogue, ratio ≈ 14.9): `/tutorials/blender-tutorial-python-numpy-sprott-n-attractor-1994-five-term-zsquared-single-saddle-focus-shilnikov-constant-divergence-rk4-bishop-tube-poi-webxr`

## Outside sources

1. **Sprott JC (1994)** "Some simple chaotic flows." *Phys Rev E* **50(2)**: R647–R650.  
   DOI: 10.1103/PhysRevE.50.R647. Public-domain mathematics.  
   Atlas: https://sprott.physics.wisc.edu/chaos/

2. **Gilpin W (2021–2024)** `dysts` — Dynamical Systems Benchmarks.  
   MIT licence. https://github.com/williamgilpin/dysts  
   131 systems with Lyapunov spectra and Kaplan–Yorke dimensions.

3. **Bishop RL (1975)** "There is more than one way to frame a curve."  
   *Am Math Monthly* **82(3)**: 246–251. DOI: 10.2307/2311093.  
   Public domain. Parallel-transport frame theorem used in `blueprint.py`.
