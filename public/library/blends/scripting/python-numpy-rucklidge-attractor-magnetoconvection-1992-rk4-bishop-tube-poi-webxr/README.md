# Rucklidge Attractor
**Blender 5.1 · Holoflow Studio**

`public/library/blends/scripting/python-numpy-rucklidge-attractor-magnetoconvection-1992-rk4-bishop-tube-poi-webxr/`

## What this is

A poi-head GLB encoding the phase-space trajectory of the Rucklidge
magnetoconvection model (Rucklidge 1992, J. Fluid Mech. 237:209-229).
This minimal 3-ODE system models oscillatory convection in a conducting
fluid inside a magnetic field — the simplest physical setting where
magnetic flux, fluid velocity, and thermal perturbation interact to
produce chaos.

```
ẋ = −κx + λy − yz     (magnetic/velocity coupling with thermal feedback)
ẏ = x                  (induction — velocity drives flux change)
ż = −z + y²            (thermal — squared stream-function pumps temperature)
```

Canonical parameters: **κ=2.0**, **λ=6.7**

## Three fixed points

| Point | Location | Stability |
|---|---|---|
| O | (0, 0, 0) | Saddle (one unstable direction) |
| P+ | (0, +√λ, λ) ≈ (0, 2.59, 6.7) | Unstable spiral focus |
| P− | (0, −√λ, λ) ≈ (0, −2.59, 6.7) | Unstable spiral focus |

The trajectory loops around P+ and P− in alternating figure-of-eight
excursions, occasionally switching between the two lobes.  This
lobe-switching is the source of sensitive dependence on initial
conditions.

## Constant divergence — exact Lyapunov identity

```
∇·F = −(κ+1)   →   ∑ᵢ λᵢ = −(κ+1) = −3  (for κ=2)
```

Unlike the Nosé-Hoover system, the Rucklidge attractor contracts phase
space at a uniform rate — the same structural property as Lorenz and Chen.
Self-check: λ₃ ≈ −3 − λ₁ − λ₂ ≈ −3.071.

## Kaplan-Yorke dimension

```
D_KY = 2 + λ₁/|λ₃| ≈ 2 + 0.071/3.071 ≈ 2.023
```

This is unusually close to 2 — the Rucklidge attractor is nearly planar
compared to Lorenz (D_KY ≈ 2.06) or Chen (D_KY ≈ 2.17).

## Shape keys

| Key | κ | λ | Regime |
|---|---|---|---|
| Basis | 2.0 | 6.7 | Canonical chaos, two-lobe switching |
| SK_Hopf | 2.0 | 4.5 | Limit cycle just past Hopf (≈λ=3.9) |
| SK_Dense | 1.5 | 6.7 | Lower damping — wider lobes, denser chaos |
| SK_HighDrive | 2.0 | 9.0 | Higher Rayleigh — more chaotic switching |

## Files

| File | Purpose |
|---|---|
| `blueprint.py` | Production Blender script — run in Text Editor |
| `record.py` | Headless viewport animation render (EEVEE Next) |
| `SCREEN-RECORDING-NOTES.md` | OBS capture instructions for screen.mp4 |
| `.expected-artefacts.json` | CI manifest |

## Integration parameters

- **DT** = 0.002 · **BURN_IN** = 15 000 (30 t.u.) · **N_STEPS** = 150 000 · **SKIP** = 50 → **3 000 waypoints**
- **TUBE_SIDES** = 12 · **TUBE_R** = 0.014 m → 3 000 × 12 = **36 000 vertices**
- Vertex colour **Rucklidge_Z** FLOAT_COLOR: z mapped cobalt (trough, near origin) → amber (thermal apex, top of lobe)
- Emission strength 1.6 · metallic 0.48 · roughness 0.24

## Licence

CC0-1.0 — no rights reserved.  
Source equations: Rucklidge AM 1992 J. Fluid Mech. 237:209-229 (mathematical
content is public domain; numerical parameters catalogued in dysts, MIT licence,
github.com/williamgilpin/dysts).
