# Haar DWT Multi-Scale Poi Curvature Decomposition

**Blender 5.1 · Python + numpy · CC0**

Decomposes the discrete curvature signal of a spiralling poi path into
multi-scale frequency bands via the Haar Discrete Wavelet Transform.
Each of the four resulting bands (one approximation + three detail levels)
is rendered as a laterally offset BEZIER ribbon whose bevel radius pulses
with the band's coefficient magnitude.

## What this demonstrates

- Haar DWT from first principles using numpy — no external packages
- Discrete curvature via Menger's formula on a 3D polyline
- Linear up-sampling of wavelet coefficients to curve control-point arrays
- Per-control-point `.radius` on a BEZIER spline for variable bevel depth
- Emission material per band with distinct hue

## Files

| File | Purpose |
|---|---|
| `blueprint.py` | Full scene builder — run in Blender Scripting workspace |
| `record.py` | 270° camera orbit → `viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS setup for `screen.mp4` |
| `.expected-artefacts.json` | CI manifest |

## Usage

1. Open Blender 5.1, new General file.
2. Switch to **Scripting** workspace.
3. Click **New**, paste `blueprint.py`, press **Alt+P**.
4. Four ribbons appear: white (a3), cerulean (d3), jade (d2), rose (d1).
5. Toggle **Z → Rendered** in Eevee Next for emission glow.
6. Run `record.py` in a second tab to render `viewport.mp4`.

## Parameters

| Constant | Default | Effect |
|---|---|---|
| `N` | 512 | Path sample count (must be divisible by 2^J) |
| `J` | 3 | DWT depth — more levels = finer decomposition |
| `TURNS` | 4.5 | Spiral turns |
| `PERTURB_AMP` | 0.35 | Amplitude of sinusoidal curvature variation |
| `LATERAL_GAP` | 0.55 | Spacing between bands |
| `BEVEL_SCALE` | 0.12 | Maximum ribbon half-thickness |

## Licence

CC0 — no rights reserved. See [holoflow.co.uk/about](https://holoflow.co.uk/about).
