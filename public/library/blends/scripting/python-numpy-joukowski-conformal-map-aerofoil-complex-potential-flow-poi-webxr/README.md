# Joukowski Conformal Aerofoil — Complex Potential Flow

**Blender 5.1 · Python + numpy · CC0**

Demonstrates the Joukowski (Жуковский) conformal transform and
inviscid potential-flow theory — foundational tools for
aerodynamics and classical complex analysis.

## What it makes

| Artefact | Description |
|---|---|
| `hf_joukowski_aerofoil.glb` | 3-D wing + streamline tubes, Draco-6 WebP, WebXR-ready |
| `viewport.mp4` | 5-second dolly + orbit animation (output of `record.py`) |
| `screen.mp4` | OBS screen recording of a live tutorial session |

## Files

| File | Purpose |
|---|---|
| `blueprint.py` | Full production script: transform, wing mesh, streamlines, GLB export |
| `record.py` | Camera animation script; writes `viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for screen-capture tutorial |
| `.expected-artefacts.json` | CI manifest of expected output files |

## Quick start

1. Open Blender 5.1.
2. Scripting workspace → paste `blueprint.py` → Run Script.
3. GLB written to `//hf_joukowski_aerofoil.glb`.

## Physics summary

The Joukowski transform `w = z + a²/z` is conformal everywhere except
at `z = ±a`. A circle centred at `(cx, cy)` passing through `z = a`
maps to an aerofoil with a cusp at `w = 2a` — the trailing edge.
The circulation satisfying the Kutta condition is:

```
Γ = 4π U R sin(α + β)
β = ∠(z_c → a)       (angle from circle centre to forward Joukowski point)
```

Lift per unit span follows from the Kutta-Joukowski theorem:

```
L = ρ U Γ
```

## Licence

CC0 1.0 Universal — Holoflow Studio.
