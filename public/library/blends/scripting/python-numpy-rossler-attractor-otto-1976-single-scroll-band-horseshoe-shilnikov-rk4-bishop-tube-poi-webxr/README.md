# Rössler Attractor — Otto Rössler 1976

**Type**: blend + glb · **Topic**: scripting · **Blender**: 5.1 · **Licence**: CC0

A single-scroll strange attractor designed by Otto Rössler in 1976 to be the
simplest possible chaotic flow.  One quadratic nonlinearity (z·x in ż) suffices
for Shilnikov-type chaos through a continuous-time horseshoe mechanism.

## Equations

```
ẋ = −y − z
ẏ =  x + a·y           a = 0.2
ż =  b + z·(x − c)     b = 0.2,  c = 5.7  (canonical)
```

## Key properties (canonical parameters)

| Property | Value |
|---|---|
| Lyapunov exponents | λ₁ ≈ +0.071, λ₂ ≈ 0, λ₃ ≈ −5.40 |
| Kaplan–Yorke dimension | D_KY ≈ 2.013 |
| Phase-space divergence | ∇·F = a − c + z (position-dependent, unlike Lorenz/Chen) |
| Topology | Single-scroll band |

## Shape keys

| Key | Parameters | Regime |
|---|---|---|
| Basis | a=0.2, c=5.7 | Canonical chaos |
| SK_Periodic | a=0.2, c=4.0 | Stable limit cycle (pre-bifurcation) |
| SK_Period2 | a=0.2, c=5.0 | Period-2 orbit (first period-doubling) |
| SK_Dense | a=0.3, c=5.7 | Denser spiral, wider band |

## Files

| File | Purpose |
|---|---|
| `blueprint.py` | Expert bpy script — builds mesh, Bishop tube, shape keys |
| `record.py` | Viewport render → `videos/scripting/<slug>/viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS/Game Bar instructions for `screen.mp4` |
| `.expected-artefacts.json` | CI artefact manifest |

## Outside sources

- **Rössler OE (1976)** "An Equation for Continuous Chaos" — *Physics Letters A*
  57(5):397-398. doi:10.1016/0375-9601(76)90101-8.  Public-domain equations.
- **Sprott JC** "Elegant Chaos" algebraically-simple chaotic flows reference —
  sprott.physics.wisc.edu/chaos/elec.htm — MIT licence on code samples.
- **NumPy** BSD-3-Clause — github.com/numpy/numpy

## Cross-references

- [Lorenz Attractor tutorial](/tutorials/blender-tutorial-python-numpy-lorenz-attractor-rk4-strange-butterfly-poi-light-trail-webxr)
- [Chen Attractor tutorial](/tutorials/blender-tutorial-python-numpy-chen-attractor-guanrong-chen-ueta-1999-lorenz-dual-butterfly-rk4-bishop-tube-poi-webxr)
- [Aizawa Attractor tutorial](/tutorials/blender-tutorial-python-numpy-aizawa-attractor-toroidal-chaos-rk4-bishop-tube-poi-webxr)
- [Chua Circuit tutorial](/tutorials/blender-tutorial-python-numpy-chua-circuit-double-scroll-shilnikov-chaos-piecewise-linear-bishop-tube-poi-webxr)
