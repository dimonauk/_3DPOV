# Moore–Spiegel Oscillator — Moore & Spiegel 1966

**Type**: blend + glb · **Topic**: scripting · **Blender**: 5.1 · **Licence**: CC0

A chaotic third-order ODE derived from the fluid mechanics of oscillating convection
cells in stellar interiors.  The amplitude-dependent damping coefficient switches sign
at a critical displacement, injecting energy at small amplitudes and extracting it at
large ones — the same mechanism as Van der Pol but in three dimensions, where the extra
degree of freedom allows chaotic dynamics.

## Equations (jerk form)

```
ẋ = y
ẏ = z
ż = −z − (T − R + R·x²)·y − T·x       T = 6,  R = 20  (canonical)

Nonlinear-damping zero: |x★| = √((R−T)/R) = √0.70 ≈ 0.837
  |x| < x★  →  energy injection (Van der Pol unstable branch)
  |x| > x★  →  nonlinear saturation (Van der Pol stable branch)
```

## Key properties (canonical T=6, R=20)

| Property | Value |
|---|---|
| Fixed points | One: origin (0, 0, 0) |
| Divergence ∇·F | −1 (constant, as in Lorenz) |
| Lyapunov exponents (estimated) | λ₁ ≈ +0.070, λ₂ ≈ 0, λ₃ ≈ −1.070 |
| Kaplan–Yorke dimension | D_KY ≈ 2.065 |
| Origin linearisation | Eigenvalues ≈ +0.47, +2.9, −4.4 (all-real saddle) |
| Chaos mechanism | Amplitude-dependent gain oscillation |
| Physical origin | Stellar convection zone parcel displacement model |

## Shape keys

| Key | Parameters | Regime |
|---|---|---|
| Basis | T=6, R=20 | Canonical strange attractor |
| SK_Periodic | T=5, R=12 | Limit cycle (pre-chaos, weaker drive) |
| SK_Dense | T=6, R=28 | Stronger convective drive, denser attractor |
| SK_HighT | T=9, R=20 | Higher thermal stiffness, altered topology |

## Files

| File | Purpose |
|---|---|
| `blueprint.py` | Expert bpy script — integration, Bishop tube, shape keys, material |
| `record.py` | Viewport render → `videos/scripting/<slug>/viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS/Game Bar instructions for `screen.mp4` |
| `.expected-artefacts.json` | CI artefact manifest with cross-references |

## Outside sources

- **Moore DW & Spiegel EA (1966)** "A Thermally Excited Non-Linear Oscillator" —
  *Astrophysical Journal* 143:871-887. doi:10.1086/148562. Public-domain equations.
- **Sprott JC** "Elegant Chaos" — sprott.physics.wisc.edu/chaos/elec.htm —
  MIT licence on code samples.  Moore-Spiegel appears in Chapter 4.
- **NumPy** — github.com/numpy/numpy — BSD-3-Clause.

## Cross-references

- [Van der Pol Oscillator tutorial](/tutorials/blender-tutorial-python-numpy-van-der-pol-lienard-limit-cycle-relaxation-oscillations-bishop-tube-poi-webxr)
  — amplitude-dependent damping in 2D; Moore-Spiegel is the 3D chaotic extension.
- [Hindmarsh-Rose Bursting Neuron tutorial](/tutorials/blender-tutorial-python-numpy-hindmarsh-rose-bursting-neuron-tonic-chaotic-rk4-bishop-tube-poi-webxr)
  — another three-variable ODE with nonlinear gain-switching behaviour.
- [Rössler Attractor tutorial](/tutorials/blender-tutorial-python-numpy-rossler-attractor-otto-1976-single-scroll-band-horseshoe-shilnikov-rk4-bishop-tube-poi-webxr)
  — Bishop tube technique; constant-divergence attractor for comparison.
