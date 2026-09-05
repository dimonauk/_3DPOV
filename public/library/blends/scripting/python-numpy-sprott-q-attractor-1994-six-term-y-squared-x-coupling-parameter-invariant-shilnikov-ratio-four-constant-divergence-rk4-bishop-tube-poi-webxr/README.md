# Sprott Q Attractor — 6-Term Y², Parameter-Invariant Shilnikov Ratio 4.0
**Blender 5.1 · Scripting · CC0 · Poi Head + Bishop Tube · WebXR**

## What this is

A Bishop parallel-transport tube tracing the Sprott Q strange attractor —
a 6-term system from Sprott's 1994 catalogue with a property unique in the
collection: the Shilnikov ratio at the origin is exactly 4.0 for all values
of the coupling parameter `a`.  The trajectory is integrated at 90 000 RK4
steps thinned to 3 000 waypoints; a spherical poi head is appended at the
trajectory endpoint.

## Equations

```
ẋ = −z
ẏ =  x − y          ← linear lag coupling
ż =  ax + y² + 0.5z ← y²-nonlinearity; a = 3.1 canonical
```

`ż` has three sources: an `a`-weighted x-channel, a quadratic y² term, and
a mild z-feedback (0.5).  The divergence ∇·F = −1 + 0.5 = −0.5 is constant
and independent of `a`.

## Fixed points and the invariant Shilnikov certificate

```
O  = (0, 0, 0)      exists for all a
P* = (−a, −a, 0)    shifts linearly with a
```

The characteristic polynomial at O factors exactly as:

```
(λ + 1)(λ² − 0.5λ + a) = 0
```

This gives:
- **λ_r = −1 exactly** (not numerical — algebraic)
- **Re(λ_c) = 0.25 exactly** (for all a > 0.0625)
- **Shilnikov ratio = |λ_r|/Re(λ_c) = 4.0 exactly** (for all a)

At a = 3.1: Im(λ_c) = √(3.0375) ≈ 1.743, so λ_c = 0.25 ± 1.743i.

| Quantity | Value (a=3.1) |
|----------|---------------|
| Real eigenvalue at O | −1.000 (exact) |
| Complex pair at O | 0.25 ± 1.743i |
| Shilnikov ratio | **4.0 exact** |
| Real eigenvalue at P* | ≈ +0.83 |
| Complex pair at P* | ≈ −0.665 ± 1.813i |
| Shilnikov ratio at P* | 0.80 (NOT met) |

Chaos is certified at **O** alone, across the entire parameter family.

## Shape keys

| Key | a | Character |
|-----|---|-----------|
| Basis (canonical) | 3.10 | Sprott's published system |
| SK_LowA  | 2.00 | Wider loops; Im(λ_c) decreases to 1.408 |
| SK_HighA | 4.50 | Tighter, more energetic; Im(λ_c) ≈ 2.113 |
| SK_NearTorus | 1.00 | Near onset of chaos; near quasi-periodic |

## Colour attribute

`SprottQ_Speed` (FLOAT_COLOR, per-vertex):
cobalt (#1b6ca8) at slow spiral segments near P*,
amber (#ffb300) at fast orbit segments near the origin.

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

Parameter table: [sprott.physics.wisc.edu/chaos/sprott.htm](https://sprott.physics.wisc.edu/chaos/sprott.htm)

Implementation: CC0 — no rights reserved.
