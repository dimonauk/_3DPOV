# Mackey–Glass Delay Differential Equation — Blender 5.1 Blueprint

**Topic**: Physiological control systems / delay-induced chaos  
**Source**: Mackey MC & Glass L (1977) *Science* 197(4300):287–289 — PD equations, >90 yr  
**Licence**: CC0 (equations in public domain; code original to this blueprint)  
**Blender version**: 5.1  
**WebXR output**: Poi head (Bishop parallel-transport tube, 4 shape keys)

---

## The equation

```
dx/dt = β · x(t−τ) / (1 + x(t−τ)ⁿ) − γ · x(t)

β  = 0.2   production rate
γ  = 0.1   degradation rate  
n  = 10    Hill exponent (sharper saturation → stronger chaos)
τ  = 17    delay (canonical chaotic value, Mackey & Glass 1977)
```

`x` is normalised blood cell concentration.  The delay `τ` represents the
lag between a bone-marrow production signal and the appearance of cells in
circulation.  For `τ < 4.5` the system settles to a fixed point.
For `4.5 < τ < 13.3` it limit-cycles.  For `τ ≥ 17` it is chaotic.

---

## Why delay ⟹ infinite dimensions

An ODE `ẋ = F(x(t))` is finite-dimensional: the state is one number.
A DDE requires knowing `x` over the whole interval `[t−τ, t]` — a function.
This lifts the phase space to infinite dimensions, and the attractor has a
Kaplan–Yorke dimension that *grows linearly with τ*:

| τ  | D_KY  | Regime            |
|----|-------|-------------------|
|  8 | ≈ 1.0 | near limit-cycle  |
| 17 | ≈ 2.1 | mild chaos        |
| 23 | ≈ 2.7 | moderate chaos    |
| 30 | ≈ 3.4 | high-dimensional  |

---

## 3-D visualisation via Takens delay embedding

Since we integrate a scalar `x(t)`, we use Takens' embedding theorem to
reconstruct a 3-D portrait of the attractor:

```
P(t) = ( x(t),  x(t − T_E),  x(t − 2·T_E) )   with T_E = 4.0
```

Takens (1981) proved that, for generic `T_E`, this map is a diffeomorphism
from the true attractor to a subset of ℝ³ — topology is preserved.

---

## Shape keys

| Key            | τ    | Character                          |
|----------------|------|------------------------------------|
| Basis          | 17.0 | canonical chaos (D_KY ≈ 2.1)      |
| SK_HighTau     | 23.0 | richer orbit (D_KY ≈ 2.7)         |
| SK_VeryHiTau   | 30.0 | high-dimensional (D_KY ≈ 3.4)     |
| SK_Periodic    |  8.0 | near limit-cycle, torus collapse   |

---

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Blender 5.1 script — integrate, embed, build mesh, export |
| `record.py` | Viewport animation for `viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for `screen.mp4` |
| `mackey_glass_poi.blend` | Generated .blend (run blueprint.py first) |
| `mackey_glass_poi.glb` | Generated GLB (Draco-6, WebP, morph targets) |

---

## External sources

1. **Mackey MC & Glass L (1977)** — *Oscillation and Chaos in Physiological
   Control Systems* — Science 197(4300):287–289 — DOI 10.1126/science.267326
   Equations in public domain. Related: Glass L & Mackey MC (1988)
   *From Clocks to Chaos* Princeton UP (companion monograph, ISBN 0-691-08449-2).

2. **Takens F (1981)** — *Detecting Strange Attractors in Turbulence* —
   Lecture Notes in Mathematics 898:366–381 — DOI 10.1007/BFb0091924
   Proved the embedding theorem used for 3-D reconstruction.
   Academic equations freely cited; related: Sauer T, Yorke JA & Casdagli M
   (1991) *Embedology* J Stat Phys 65:579–616 (generalisation, BSD-like open
   academic access).

3. **NumPy** — BSD-3-Clause — https://numpy.org — github.com/numpy/numpy
   History ring-buffer integration ecosystem.

---

## Tutorial cross-references

- `/tutorials/blender-tutorial-python-numpy-lorenz-96-atmospheric-ring-rk4-bishop-tube-poi-webxr`
- `/tutorials/blender-tutorial-python-numpy-hindmarsh-rose-bursting-neuron-tonic-chaotic-rk4-bishop-tube-poi-webxr`
- `/tutorials/blender-tutorial-python-numpy-kuramoto-sivashinsky-pde-spatiotemporal-chaos-flame-front-height-field-stage-floor-webxr`
