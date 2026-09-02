# Finance Attractor — Ma & Chen 2001

**Category:** Scripting · Strange Attractors  
**Blender:** 5.1 · **Licence:** CC0  
**Shape:** Bishop parallel-transport tube, poi head for WebXR

## The system

Proposed by Junhai Ma and Guanrong Chen in 2001 to model a simplified
macroeconomic market, the Finance attractor couples three state variables:

```
ẋ = z + (y − a)·x      x = interest rate
ẏ = 1 − b·y − x²       y = investment demand
ż = −x − c·z           z = price index
```

Parameters:
- **a** — savings rate (canonical 0.9)
- **b** — cost per unit of investment (canonical 0.2)
- **c** — elasticity of demand with respect to price (canonical 1.5)

## Fixed points

With a=0.9, b=0.2, c=1.5:

| Point | Location | Character |
|-------|----------|-----------|
| P₀ | (0, 5, 0) | Unstable saddle (∇·F ≈ +2.4 at this point) |
| P+ | (+0.829, 1.567, −0.553) | Saddle-focus (chaotic attractor forms here) |
| P− | (−0.829, 1.567, +0.553) | Saddle-focus (symmetric twin) |

The orbit alternates between the neighbourhoods of P+ and P−, producing a
figure-of-eight scroll pattern. Unlike Lorenz's two symmetric wings, the
Finance attractor's wings are asymmetrically occupied because the initial
condition breaks the latent Z₂ symmetry via the cubic-free nonlinearity.

## Divergence analysis

```
∇·F = (y − a) − b − c = y − (a + b + c) = y − 2.6
```

This is **position-dependent** — the system is not uniformly dissipative.
Near P± (y ≈ 1.567), the effective divergence ≈ −1.033, confirming
contraction. Near P₀ (y = 5), divergence ≈ +2.4, making P₀ unstable as
an economic steady-state: the model says the high-investment-demand regime
is intrinsically repelling.

## Lyapunov spectrum (canonical a=0.9, b=0.2, c=1.5)

| Exponent | Value | Role |
|----------|-------|------|
| λ₁ | ≈ +0.095 | Chaos — nearby trajectories diverge |
| λ₂ | ≈ 0 | Flow direction (zero by construction) |
| λ₃ | ≈ −1.095 | Contraction onto attractor |
| D_KY | ≈ 2.09 | Kaplan–Yorke dimension |
| Σλᵢ | ≈ −1.00 | = ⟨∇·F⟩ (time-averaged) |

## Shape keys

| Key | Parameters | Economic interpretation |
|-----|-----------|------------------------|
| Basis | a=0.9, b=0.2, c=1.5 | Canonical chaos: moderate savings, cheap investment |
| SK_Thrift | a=0.4, b=0.2, c=1.5 | Low savings: tighter orbit, interest rate range shrinks |
| SK_LowCost | a=0.9, b=0.1, c=1.5 | Very cheap investment: wider demand oscillations |
| SK_Rigid | a=0.9, b=0.2, c=0.8 | Inelastic price: z-axis expands, longer price swings |

## Colour attribute

`Finance_Speed` (FLOAT_COLOR, POINT domain): the instantaneous speed
|ẋ, ẏ, ż| normalised to [0, 1]. Cobalt (slow, near saddle-focus) → Amber
(fast, flying through the inter-scroll corridor). In the WebXR poi view,
the colour indicates where the market dynamics are most sluggish (near the
quasi-equilibrium scrolls) vs. most explosive (during the scroll crossover).

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Pure-bpy mesh generation script |
| `record.py` | Viewport animation → `viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for `screen.mp4` |
| `.expected-artefacts.json` | CI artefact checklist |

## Outside sources (permissive licence)

1. **Ma, J. & Chen, G. (2001).** "Study for the bifurcation topological structure
   and the global complicated character of a kind of non-linear finance system (I)."
   *Applied Mathematics and Mechanics* 22(11):1240–1251.
   Equations: public domain mathematical content.
   Related: [Guanrong Chen's group page](https://www.ee.cityu.edu.hk/~gchen/)

2. **Chen, W.-C. (2008).** "Nonlinear dynamics and chaos in a fractional-order
   financial system." *Chaos, Solitons & Fractals* 36(5):1305–1314.
   DOI: 10.1016/j.chaos.2006.08.005. Equations: public domain.
   Related: [NumPy BSD-3-Clause](https://github.com/numpy/numpy) —
   the scipy.integrate framework used in many finance-attractor reproductions.
