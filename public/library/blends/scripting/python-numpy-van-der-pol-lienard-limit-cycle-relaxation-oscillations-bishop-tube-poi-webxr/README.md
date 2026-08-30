# Van der Pol Oscillator — Poi Head (Blender 5.1)

A 3-D Bishop-tube helix tracing the Van der Pol limit cycle through the
(x, y, t) phase–time space, coloured by velocity y (cobalt = backward, amber = forward).

## The System

```
ẋ =  y
ẏ =  μ(1 − x²)y − x          Liénard state-space form

Phase-space divergence: ∇·v = μ(1 − x²)
  |x| < 1 → contracting (draws trajectories inward)
  |x| > 1 → expanding  (pushes trajectories inward from outside)
  ⟹  Liénard's theorem: exactly ONE stable limit cycle for every μ > 0
```

## Regimes

| μ | Regime | Period (approx) | Notes |
|---|---|---|---|
| 0.2 | Poincaré–Lindstedt | 6.30 | Nearly circular; amplitude ≈ 2 + O(μ²) |
| 1.0 | Moderate | 6.67 | Slightly egg-shaped; Basis shape key |
| 3.0 | Relaxation onset | 8.86 | Fast/slow split visible; sawtooth winding |
| 5.0 | Strong relaxation | 11.6 | Extreme spike-and-crawl; T ≈ 1.614 μ |

## Parameters

| Constant | Value | Meaning |
|---|---|---|
| `DT` | 0.010 | RK4 step size |
| `BURN_IN` | 2 000 | Steps discarded (settles onto limit cycle) |
| `N_STEPS` | 3 000 | Steps collected → 3 000 waypoints |
| `ZSCALE` | 0.065 | z = t · ZSCALE; z_max ≈ 1.95 ≈ x-amplitude |
| `TUBE_R` | 0.008 m | Cross-section radius |
| `TUBE_SIDES` | 10 | Decagonal cross-section |

## Shape Keys

| Key | μ | Notes |
|---|---|---|
| `Basis` | 1.0 | Standard limit cycle; ~4.5 loops over 30 t.u. |
| `SK_Gentle` | 0.2 | Poincaré regime; nearly circular winding |
| `SK_Relax` | 3.0 | Relaxation oscillations; ~3.4 loops |
| `SK_Strong` | 5.0 | Strong relaxation; ~2.6 loops, extreme sawtooth |

## Vertex Colour

**VdP_Y** (FLOAT_COLOR, POINT domain): maps y (velocity) →
cobalt (0.02, 0.10, 0.55) when y < 0 / amber (0.95, 0.60, 0.00) when y > 0.

## Quick Start

1. Open Blender 5.1 → Scripting workspace → open `blueprint.py` → **Run Script**.
2. Console confirms: `[VanDerPol] 30000 verts  29990 faces`.
3. Switch to 3-D Viewport → Material Preview (Z key).
4. Optionally run `record.py` for the animated viewport render.
5. Run holoflow GLB export: Draco-6, WebP, morph=True, colors=True.

## Sources

- van der Pol B (1920) "A theory of the amplitude of free and forced triode vibrations."
  *Radio Review* **1**:701–710, 754–762. Equations public domain.
- van der Pol B & van der Mark J (1927) "Frequency demultiplication."
  *Nature* **120**:363–364. doi:10.1038/120363a0. Public domain.
- Liénard A (1928) "Étude des oscillations entretenues." *Rev. Gén. Élec.* **23**:901–946.
  Theorem public domain.
