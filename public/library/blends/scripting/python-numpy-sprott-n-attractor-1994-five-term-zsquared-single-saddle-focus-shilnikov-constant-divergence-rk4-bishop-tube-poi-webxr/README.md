# Sprott N Attractor — 1994 Canonical Case N

**Blender 5.1 · Python bpy + numpy · Bishop parallel-transport tube · WebXR poi-head**

A 5-term quadratic ordinary-differential equation (ODE) from Julien Sprott's
landmark 1994 survey of minimal chaotic flows.  Case N is unusual in having
**only one fixed point** — and that single equilibrium satisfies the Shilnikov
condition with a ratio of ~15, one of the highest in the catalogue.

---

## The equations

```
ẋ = −2y
ẏ = x + z²
ż = b + y − 2z

Canonical: b = 1.0
```

### Why these 5 terms produce chaos

| Term | Role |
|------|------|
| `−2y` | y acts as angular momentum; the factor 2 sets the orbital period |
| `x + z²` | positive feedback from both x (linear) and z (quadratic) drives y to grow |
| `b + y − 2z` | the constant b offsets equilibrium; `−2z` damps z back toward z*=b/2 |

The only nonlinearity is `z²` in the ẏ equation.  Without it the system is
linear and damps to the fixed point; with it, trajectories spiral away from
the equilibrium and the global z-curvature folds them back, sustaining
bounded chaotic motion.

---

## Fixed-point and Shilnikov analysis

```
Single fixed point P = (−b²/4, 0, b/2)
Canonical:          P = (−0.25, 0, 0.5)

Jacobian:
  J = [[ 0, −2,  0],
       [ 1,  0,  b],    (2z* = b)
       [ 0,  1, −2]]

Characteristic polynomial (b=1):
  λ³ + 2λ² + λ + 4 = 0

Eigenvalues:
  λ_s  ≈ −2.31          (stable real → 1-D stable manifold W^s)
  λ_c  ≈ +0.155 ± 1.303i (UNSTABLE complex pair → 2-D spiral repels)

Shilnikov ratio: |λ_s| / Re(λ_c) = 2.31 / 0.155 ≈ 14.9 >> 1 ✓
```

Shilnikov's theorem (1965): if a saddle-focus has a homoclinic orbit **and**
|stable eigenvalue| > |real part of unstable eigenvalues|, any neighbourhood
of the orbit contains infinitely many periodic orbits.  With ratio 14.9,
Sprott N's chaos is far from a knife-edge — it is structurally robust.

---

## Lyapunov spectrum

```
∇·F = −2  (constant → ΣLyapunov = −2 by Liouville)

λ₁ ≈ +0.076   (maximum Lyapunov exponent, MLE)
λ₂ =  0       (neutral — along the flow direction)
λ₃ ≈ −2.076   (strong contraction)

D_KY = 2 + λ₁/|λ₃| = 2 + 0.076/2.076 ≈ 2.037
Lyapunov time τ = 1/λ₁ ≈ 13.2 time units
```

The fractal dimension is only just above 2, meaning the attractor is a
very thin ribbon — topologically close to a 2-D surface but with the
characteristic fractal layering of any strange attractor.

---

## Shape keys (parameter survey)

| Key | b | z* | Character |
|-----|---|-----|-----------|
| Basis | 1.0 | 0.5 | canonical single-lobe ribbon |
| SK_LowB | 0.7 | 0.35 | shorter z-range, more compact |
| SK_HighB | 1.5 | 0.75 | elongated in z, wider spiral |
| SK_WideB | 2.0 | 1.0 | char-poly loses λ¹ term, topology shifts |

---

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Blender 5.1 Python script — integrate, build tube mesh, shape keys |
| `record.py` | Viewport render script → `viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS/Game Bar setup for `screen.mp4` |
| `README.md` | This file |
| `.expected-artefacts.json` | CI artefact manifest |

---

## Running

```python
# In Blender 5.1 Scripting workspace:
# 1. Open blueprint.py → Run Script
# 2. Object hf_sprott_n_poi appears in the viewport
# 3. Open record.py → Run Script (renders viewport.mp4)
```

---

## References

- Sprott JC (1994). "Some simple chaotic flows". *Phys Rev E* **50(2)**: R647.
  <https://sprott.physics.wisc.edu/chaos/>  (public domain)
- Gilpin W (2021–2024). *dysts: Dynamical Systems Benchmarks*.
  MIT licence. <https://github.com/williamgilpin/dysts>
- Bishop RL (1975). "There is more than one way to frame a curve".
  *Am Math Monthly* **82(3)**: 246–251.
  <https://www.jstor.org/stable/2311093>  (public domain)
- Shilnikov LP (1965). "A case of the existence of a countable number of
  periodic motions". *Sov Math Dokl* **6**: 163–166.  (public domain)

---

## Licence

CC0 1.0 Universal — no rights reserved.
