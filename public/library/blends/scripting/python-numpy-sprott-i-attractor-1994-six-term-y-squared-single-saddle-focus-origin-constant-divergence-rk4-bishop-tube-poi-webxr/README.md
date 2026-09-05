# Sprott I Attractor — 1994 Canonical Case I

**Topic:** scripting · attractor · chaos · Bishop tube · poi-head · WebXR  
**Blender version:** 5.1  
**Licence:** CC0 (equations are public-domain mathematics)

## System

$$\dot{x} = -ay \qquad \dot{y} = x + z \qquad \dot{z} = x + y^2 - z$$

Canonical coupling coefficient **a = 0.20**.  Six terms; sole nonlinearity y².

## Why This System Is Interesting

Sprott I is the quiet achiever of the 1994 catalogue.  Its maximum Lyapunov
exponent (λ₁ ≈ +0.059) is near the weakest in the set — almost as tepid as
Sprott J (λ₁ ≈ +0.017) — yet its Shilnikov ratio at the origin is one of the
largest:

| System | Shilnikov ratio |
|--------|----------------|
| Sprott N | ≈ 14.9 |
| Sprott I (canonical, a=0.20) | **≈ 16.7** |
| Sprott I (a=0.10) | **≈ 24** |

A high Shilnikov ratio guarantees dense homoclinic chaos even when the
positive Lyapunov exponent is small; the attractor's fractal fine-structure
is rich despite the orbit's languid pace.

Uniquely among 6-term single-quadratic Sprott systems, **Sprott I has exactly
one fixed point** (the origin) for all positive a — no second equilibrium
appears at any parameter value.  Compare with Sprott K (second equilibrium
P at all a) and Sprott O (P = (−1, 0, −1) always present).

## Fixed-Point Analysis

**Divergence:** ∇·F = 0 + 0 + (−1) = **−1** (constant, a-independent).  
Liouville → ∑λᵢ = −1 on attractor.

**Unique fixed point:** O = (0, 0, 0).

**Jacobian at O:**
```
J = [[ 0, -a,  0],
     [ 1,  0,  1],
     [ 1,  0, -1]]
```

**Characteristic polynomial:** λ³ + λ² + aλ + 2a = 0 (all a).  
Factored: **λ²(λ+1) + a(λ+2) = 0**.

Routh–Hurwitz: p₁·p₂ − p₃ = a − 2a = −a < 0 for all a > 0.  
→ Origin is **structurally unstable** — no parameter tuning needed.

| a | λ_r (real) | Re(λ_c) | Im(λ_c) | Shilnikov ratio |
|---|-----------|---------|---------|----------------|
| 0.10 | ≈ −1.09 | ≈ +0.045 | ≈ 0.425 | ≈ 24 |
| 0.20 | ≈ −1.136 | ≈ +0.068 | ≈ 0.589 | ≈ 16.7 |
| 0.35 | ≈ −1.20 | ≈ +0.100 | ≈ 0.757 | ≈ 12.0 |
| 0.50 | ≈ −1.25 | ≈ +0.125 | ≈ 0.900 | ≈ 10.0 |

## Shape Keys

| Key | a | Character |
|-----|---|-----------|
| Basis | 0.20 | Canonical — moderate loop, clear near-origin hairpin |
| SK_LowA | 0.10 | Wider orbit, weaker y-drive, Shilnikov ratio ≈ 24 |
| SK_HighA | 0.35 | Tighter spirals, stronger dissipation |
| SK_NearBif | 0.50 | Approaching topological transition, orbit visibly contracts |

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Expert bpy script — RK4 integration, Bishop tube, shape keys |
| `record.py` | Viewport animation render (run after blueprint) |
| `SCREEN-RECORDING-NOTES.md` | OBS / Game Bar instructions |
| `.expected-artefacts.json` | CI artefact manifest |

## Outside Sources

1. **Sprott JC (1994)** "Some simple chaotic flows."  *Physical Review E* 50(2):R647–R650.  
   DOI [10.1103/PhysRevE.50.R647](https://doi.org/10.1103/PhysRevE.50.R647).  
   Equations: public-domain mathematics.  
   Atlas: <https://sprott.physics.wisc.edu/chaos/>  
   Related repos: [williamgilpin/dysts](https://github.com/williamgilpin/dysts) (MIT)

2. **Bishop RL (1975)** "There is more than one way to frame a curve."  
   *American Mathematical Monthly* 82(3):246–251.  
   DOI [10.2307/2311093](https://doi.org/10.2307/2311093).  
   Public-domain parallel-transport theory.  
   Related: [mrdoob/three.js TubeGeometry](https://github.com/mrdoob/three.js) (MIT)
