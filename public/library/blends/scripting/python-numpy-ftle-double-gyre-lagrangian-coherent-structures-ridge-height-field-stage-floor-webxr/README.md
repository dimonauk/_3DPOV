# FTLE / Lagrangian Coherent Structures — Double Gyre
**Stage-Floor Height-Field for WebXR · Blender 5.1**

## What this is

The **Finite-Time Lyapunov Exponent (FTLE)** field is the most widely used
tool for finding **Lagrangian Coherent Structures (LCS)** — the hidden
"skeleton" that organises mixing in unsteady flows.  Ridges in the FTLE
field are material lines that repel (or attract) neighbouring fluid parcels
exponentially fast; they are the natural boundaries that separate domains with
qualitatively different transport histories.

This blueprint uses the canonical **double-gyre** test case (Shadden, Lekien
& Marsden 2005): two counter-rotating gyres in a rectangular domain,
oscillating so that the separating boundary breaks into a chaotic zone.
The FTLE field is computed by integrating 120×60 tracer particles using 4th-order
Runge–Kutta, then measuring the stretching of each infinitesimal material
element via the Cauchy-Green strain tensor.

The result is a **7 200-vertex stage-floor height-field**: peaks mark the LCS
ridges; valleys sit inside the well-mixed gyre bodies.  Four shape keys expose
forward/backward integration and two parameter variants.

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Full Blender 5.1 bpy script; run in Text Editor |
| `record.py`    | Renders `viewport.mp4` after blueprint run |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for `screen.mp4` |

## Outputs

| Artefact | Location |
|----------|----------|
| `ftle_double_gyre_floor.blend` | save manually after running |
| `ftle_double_gyre_floor.glb`   | auto-exported next to .blend |
| `viewport.mp4`  | rendered by record.py |
| `screen.mp4`    | OBS capture of Blender session |

## Parameters

| Constant | Value | Meaning |
|----------|-------|---------|
| `NX` | 120 | Grid columns (x, gyre width) |
| `NY` | 60 | Grid rows (y, gyre height) |
| `A` | 0.10 | Stream-function amplitude |
| `EPS_STD` | 0.10 | Gyre-boundary oscillation (canonical) |
| `EPS_HIGH` | 0.25 | Stronger oscillation (SK_HiEps) |
| `T_FWD` | 10.0 | Forward integration time (repelling LCS) |
| `T_BWD` | −10.0 | Backward integration (attracting LCS) |
| `T_LONG` | 20.0 | Long integration (SK_LongT) |
| `DT` | 0.025 | RK4 timestep |

## Shape keys

| Name | ε | T_int | LCS revealed |
|------|---|-------|--------------|
| Basis | 0.10 | +10 | Repelling LCS — mid-channel amber ridge |
| SK_Bwd | 0.10 | −10 | Attracting LCS — lobe fold boundaries |
| SK_HiEps | 0.25 | +10 | Wider chaotic zone, broader ridge |
| SK_LongT | 0.10 | +20 | Finer filament structure |

## Physics background

**Double gyre stream function**

```
ψ(x,y,t) = A · sin(π·f) · sin(π·y)
f(x,t)   = ε·sin(ωt)·x² + (1 − 2ε·sin(ωt))·x    [domain [0,2]×[0,1]]
```

Velocity:  u = −∂ψ/∂y,  v = +∂ψ/∂x  (no-flux at all walls).

At ε = 0 the heteroclinic orbit along x = 1 is exact.  At ε > 0 the
Poincaré map of this orbit breaks into a homoclinic tangle — the classic
mechanism for chaotic advection (Aref 1984).

**FTLE formula**

```
FTLE(x,y) = log(√λ_max(C)) / (2|T_int|)
```

where C = FᵀF is the Cauchy-Green tensor of the flow map.  Ridges of this
scalar field are LCS: material barriers that neither break nor diffuse over
the integration window.

## Licence

Blueprint: CC0 (studio work).  Mathematical framework: public domain.
Shadden, Lekien & Marsden 2005 DOI 10.1016/j.physd.2005.10.007.
Haller & Yuan 2000 DOI 10.1016/S0167-2789(00)00142-1.
