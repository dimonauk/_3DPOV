# Kuramoto–Sivashinsky PDE — Spatiotemporal Chaos Stage Floor

**Blender 5.1 · Python + NumPy · Scripting category · CC0**

---

## What this is

The **Kuramoto–Sivashinsky (KS) equation** is one of the simplest PDEs that
exhibits genuine spatiotemporal chaos on a 1-D periodic domain:

```
u_t = −u_xxxx − u_xx − u·u_x
```

- **−u_xx** (second-derivative term): _destabilising_ at long wavelengths (k < 1).
  This is an anti-diffusion term — it pumps energy _into_ fluctuations.
- **−u_xxxx** (fourth-derivative term): _stabilising_ at short wavelengths (k > 1).
  Hyper-diffusion that prevents the instability becoming unbounded.
- **u·u_x** (nonlinear advection): saturates the instability. Structurally
  identical to the Burgers advection term; energy is shuffled up to where the
  fourth-derivative damps it.

For domain length L > 2π√2 ≈ 8.9 the zero state is linearly unstable. For
L ≳ 20 the attractor is chaotic: positive Lyapunov exponent, sensitive
dependence on initial conditions, yet globally bounded energy spectrum.

---

## Geometry

| Parameter | Value |
|---|---|
| Spatial grid NX | 128 points |
| Time snapshots NT | 64 |
| Total vertices | 8 192 |
| Total quads | 7 938 |
| Colour attribute | `KS_Velocity` FLOAT_COLOR (cobalt = −u, amber = +u) |
| Export | Draco-6, WebP textures, +Y up |

---

## Shape Keys

| Key | L | Character |
|---|---|---|
| **Basis** | 64 | Canonical fully-developed chaos (~8 cells competing) |
| **SK_Onset** | 22 | Near-onset: 2-cell quasi-regular travelling wave |
| **SK_Short** | 32 | Sparse chaos, 3–4 cells |
| **SK_Long** | 96 | Dense turbulence, 12+ cells |

---

## Integration scheme: ETD2RK

Explicit schemes require dt < 2.8 / (π·NX/L)⁴ ≈ 5 × 10⁻⁵ for this grid —
too slow for 1 200 warm-up steps. We use **Exponential Time Differencing
(ETD2RK)**: the stiff linear operator is handled exactly via an integrating
factor e^{L̂·h}; the nonlinear term is stepped by Heun's predictor-corrector.
Aliasing is controlled by the 2/3-rule (modes above NX/3 are zeroed).

---

## Files

| File | Purpose |
|---|---|
| `blueprint.py` | Run in Blender's Scripting workspace — builds mesh, shape keys, exports GLB |
| `record.py` | Run after saving `.blend` — renders `viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS / Game Bar guide for `screen.mp4` |
| `.expected-artefacts.json` | Machine-readable spec |

---

## Outside Sources

1. **Sivashinsky (1977)** — "Nonlinear analysis of hydrodynamic instability in
   laminar flames", *Acta Astronaut* 4(11–12):1177–1206.  Equations in public domain.
2. **Kuramoto & Tsuzuki (1976)** — "Persistent propagation of concentration waves
   in dissipative media", *Prog Theor Phys* 55(2):356–369.  Equations in public domain.
3. **Cox & Matthews (2002)** — "Exponential time differencing for stiff systems",
   *J Comput Phys* 176(2):430–455.  ETD2RK algorithm reference.  PD equations.
4. **NumPy** (BSD-3-Clause) — FFT, rfftfreq, array operations.
   https://numpy.org

---

## Related Studio Content

- [Brusselator PDE — Turing Instability Stage Floor](/tutorials/blender-tutorial-python-numpy-brusselator-prigogine-lefever-1968-turing-instability-hopf-dissipative-stage-floor-webxr)
- [Swift–Hohenberg PDE — Bénard Convection Rolls Stage Floor](/tutorials/blender-tutorial-python-numpy-swift-hohenberg-pde-hexagonal-rolls-benard-convection-stage-floor-webxr)
- [Fermi–Pasta–Ulam–Tsingou Recurrence Stage Floor](/tutorials/blender-tutorial-python-numpy-fermi-pasta-ulam-tsingou-recurrence-anharmonic-chain-alpha-fpu-stage-floor-webxr)
- [Rayleigh–Taylor Instability Stage Floor](/tutorials/blender-tutorial-python-numpy-rayleigh-taylor-instability-2d-boussinesq-vorticity-streamfunction-spectral-height-field-stage-floor-webxr)
