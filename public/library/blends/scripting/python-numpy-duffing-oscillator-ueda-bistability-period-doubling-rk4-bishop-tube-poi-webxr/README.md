# Duffing Oscillator — Ueda Chaos, Bistability & Period-Doubling
**Blender 5.1 · Python + numpy · CC0**

## What this is

The Duffing equation ẍ + δẋ + αx + βx³ = γcos(ωt) is the canonical model of a
forced nonlinear oscillator. In its double-well form (α < 0, β > 0) it describes
a ball rolling in a two-well potential V(x) = αx²/2 + βx⁴/4 — two stable equilibria
at x = ±√(−α/β) separated by an unstable saddle at the origin. Georg Duffing
introduced it in 1918 to study hardening springs. Yoshisuke Ueda discovered its
strange attractor in 1961 on an analogue computer; it became one of the first
experimentally observed chaotic attractors when the concept of chaos was formalised
in the 1970s.

This blueprint integrates 90,000 RK4 steps (after a 4,000-step transient burn-in)
and embeds the 2-D phase trajectory (x, ẋ) in 3-D using the sine of the forcing phase
as the z-axis. The result is a Bishop parallel-transport tube that physically encodes
the attractor's laminar fractal structure as visual depth. The cobalt–amber gradient
maps x-position to colour: cobalt = left potential well, amber = right.

## Equations

```
ẍ + δẋ + αx + βx³ = γcos(ωt)

Split to 1st-order:  ẋ = v
                     v̇ = γcos(ωt) − δv − αx − βx³

3-D embedding:  p(t) = (x(t),  ẋ(t),  ZSCALE·sin(ωt))

Double-well potential (Basis):  V(x) = −x²/2 + x⁴/4   (minima at x = ±1)
Lyapunov exponent λ₁ ≈ +0.155 (Holmes params, Farmer et al. 1983)
Correlation dimension D₂ ≈ 1.4 (Grassberger & Procaccia 1983 estimate)
```

## Shape keys

| Key | α | β | δ | γ | ω | Character |
|-----|---|---|---|---|---|-----------|
| Basis | −1 | 1 | 0.3 | 0.50 | 1.2 | Holmes cross-well chaos |
| SK_Ueda | 0 | 1 | 0.05 | 7.5 | 1.0 | Ueda single-well chaos (large attractor) |
| SK_Period2 | −1 | 1 | 0.3 | 0.29 | 1.2 | Period-2 orbit (two loops per forcing cycle) |
| SK_Locked | −1 | 1 | 0.5 | 0.10 | 1.2 | Period-1 sinusoidal lock |

## Period-doubling cascade

For the Holmes parameters (all else fixed, γ varying):
- γ < 0.23: period-1 (single orbit per forcing cycle)
- 0.23 < γ < 0.29: period-2 (SK_Period2 sits here)
- 0.37 < γ < 0.50: period-4, period-8 … Feigenbaum accumulation
- γ ≥ 0.50: cross-well strange attractor (Basis)

The Feigenbaum constant δ_F ≈ 4.669 governs the geometric rate at which each
period-doubling bifurcation halves the parameter interval to the next.

## Usage

```python
# In Blender's Scripting editor:
exec(open("blueprint.py").read())
# Object hf_duffing_poi appears with shape keys and emission material.
# Run record.py to render viewport.mp4.
exec(open("record.py").read())
```

## Cross-references

- [Van der Pol Oscillator](/tutorials/blender-tutorial-python-numpy-van-der-pol-lienard-limit-cycle-relaxation-oscillations-bishop-tube-poi-webxr) — Liénard limit cycles, autonomous oscillations without forcing
- [Kapitza Pendulum](/tutorials/blender-tutorial-python-numpy-kapitza-pendulum-parametric-resonance-mathieu-effective-potential-bishop-tube-poi-webxr) — parametric forcing, Mathieu equation, effective potential
- [Moore–Spiegel Oscillator](/tutorials/blender-tutorial-python-numpy-moore-spiegel-oscillator-1966-stellar-convection-nonlinear-jerk-chaos-rk4-bishop-tube-poi-webxr) — jerk chaos, stellar convection, third-order ODE

## External sources

1. **Duffing G (1918)** *Erzwungene Schwingungen bei veränderlicher Eigenfrequenz.*
   Vieweg, Braunschweig. Public domain.
   URL: https://archive.org/details/duffing1918 (Internet Archive scan, CC0 digitisation)
   Related: scipy/scipy (BSD-3) ODE solvers — https://github.com/scipy/scipy

2. **Ueda Y (1979)** "Randomly transitional phenomena in the system governed by Duffing's equation."
   *Journal of Statistical Physics* 20(2):181–196. DOI: 10.1007/BF01011512
   Equations public domain (mathematical facts).
   Related: numpy/numpy (BSD-3) — https://github.com/numpy/numpy
   Related: scipy/scipy (BSD-3) integrate subpackage — https://github.com/scipy/scipy

## Licence

CC0 — no rights reserved. Equations are mathematical facts in the public domain.
