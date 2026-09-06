# Sprott S Attractor — 5-Term z²-Nonlinearity, Dual Shilnikov Fixed Points
**Blender 5.1 · Scripting · CC0 · Poi Head + Bishop Tube · WebXR**

## What this is

A Bishop parallel-transport tube tracing the Sprott S strange attractor,
the final 5-term system in Sprott's 1994 catalogue (A–S) to use a
z²-quadratic nonlinearity.  The trajectory is integrated at 90 000 RK4
steps thinned to 3 000 waypoints; a spherical poi head is appended at the
trajectory endpoint.

## Equations

```
ẋ = −x − 4y
ẏ =  x + z²    ← z²-term drives asymmetric scrolling near P+
ż =  c + x     ← c = 1 (canonical); varied per shape key
```

The system has no free parameter at c=1 — it is one of the most 'rigid'
entries in the catalogue.  Replacing `1` with a continuous variable `c`
lets the shape keys explore the surrounding parameter space.

## Fixed points and Shilnikov analysis

At c = 1:  **P± = (−1, ¼, ±1)**

| Quantity | P+ | P− |
|----------|----|----|
| Real eigenvalue | λ_r ≈ −1.60 (stable) | λ_r ≈ +1.20 (unstable) |
| Complex pair | λ_c ≈ +0.30 ± 2.22i (unstable) | λ_c ≈ −1.10 ± 2.33i (stable) |
| Shilnikov ratio | \|λ_r\|/Re(λ_c) ≈ 5.3 **✓** | — |
| Type | Saddle-focus (chaos guaranteed) | Saddle-spiral |

P+ satisfies the Shilnikov condition (|λ_s| > Re(λ_c)):
homoclinic orbits near P+ generate a countably infinite set of
periodic orbits — the signature of Shilnikov chaos.

## Shape keys

| Key | c | Character |
|-----|---|-----------|
| Basis (canonical) | 1.00 | Dual-scroll, P± gap balanced |
| SK_LowC  | 0.70 | Scrolls tighten as P± approach each other |
| SK_HighC | 1.30 | Scrolls elongate; P± push apart |
| SK_WideC | 1.60 | Near bifurcation; topology begins to shift |

## Colour attribute

`SprottS_Speed` (FLOAT_COLOR, per-vertex):
cobalt (#1b6ca8) at slow segments near P± equilibria,
amber (#ffb300) at fast crossings near the origin.

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Full Python/bpy — run in Blender Scripting workspace |
| `record.py` | Orbital render + shape-key morph → `viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for `screen.mp4` |

## Source

Sprott, J.C. (1994). Some simple chaotic flows.
*Physical Review E*, **50**(2), R647–R650.
DOI: [10.1103/PhysRevE.50.R647](https://doi.org/10.1103/PhysRevE.50.R647)

Implementation: CC0 — no rights reserved.
