# Peter de Jong Attractor — Discrete 2-D Map / Log-Density Stage Floor

**Blender 5.1 · Python + numpy · Scripting workspace**

## What Is It?

The Peter de Jong attractor is a two-dimensional iterated map of the plane:

```
x_{n+1} = sin(a · y_n) − cos(b · x_n)
y_{n+1} = sin(c · x_n) − cos(d · y_n)
```

Four independent real parameters `(a, b, c, d)` steer the geometry.  Because
each parameter appears in exactly one trigonometric function, the parameter
space decouples cleanly — a small nudge to `a` changes only the x-update,
leaving the y-update untouched.  This makes the de Jong family distinctly
*navigable* compared with attractors where parameters couple nonlinearly.

The orbit stays bounded in `|x|, |y| ≤ 2` for all parameter choices
(since `|sin − cos| ≤ 2`), and the map is dissipative for most parameters,
so the orbit contracts onto a strange attractor with fractal dimension `D_f < 2`.

## Parameter Zoo — Four Shape Keys

| Key       | a     | b     | c     | d     | Visual character              |
|-----------|-------|-------|-------|-------|-------------------------------|
| Basis     | −2.00 | −2.00 | −1.20 |  2.00 | Paisley / heart lobe          |
| SK_Web    |  1.40 | −2.30 |  2.40 | −2.10 | Crystalline filament web      |
| SK_Star   | −2.50 |  1.50 | −0.70 |  1.80 | Radial sunburst halo          |
| SK_Spiral | −0.80 | −1.30 | −1.80 | −2.60 | Dense compressed spiral       |

## Mesh Spec

| Property         | Value                           |
|------------------|---------------------------------|
| Grid             | 120 × 120 = 14 400 vertices     |
| Quads            | 119 × 119 = 14 161              |
| Orbit steps      | 5 000 000 per shape key         |
| Height transform | `log(1 + count) / max · 0.5 m` |
| Colour attribute | `DeJong_Density` FLOAT_COLOR    |
| Colour palette   | Cobalt (low) → Amber (high)     |

## Files

| File                      | Purpose                                      |
|---------------------------|----------------------------------------------|
| `blueprint.py`            | Full bpy + numpy build script                |
| `record.py`               | EEVEE-Next viewport animation render         |
| `SCREEN-RECORDING-NOTES.md` | OBS session steps for screen.mp4           |
| `.expected-artefacts.json`| CI artefact manifest                         |

## Why Log-Density?

Raw visit counts span three to four orders of magnitude between the dense core
(orbit fixed points and fold lines) and sparse filament tips.  `log(1 + count)`
compresses that range so both regions contribute visible geometry.  The same
transform is used in the Flame fractal algorithm (Scott Draves 2003, CC BY-SA)
and in the Clifford attractor tutorial in this library.

## Related Library Entries

- [Clifford Attractor](../../../../../../tutorials/blender-tutorial-python-numpy-clifford-attractor-pickover-discrete-2d-map-fractal-density-stage-floor-webxr) — companion discrete-map height field (Pickover 1991)
- [Zaslavsky Stochastic Web](../../../../../../tutorials/blender-tutorial-python-numpy-zaslavsky-stochastic-web-kicked-oscillator-qfold-quasicrystal-stage-floor-webxr) — kicked-oscillator discrete map
- [Chirikov Standard Map](../../../../../../tutorials/blender-tutorial-python-numpy-chirikov-standard-map-kam-breakdown-greene-critical-threshold-stage-floor-webxr) — area-preserving map, KAM breakdown

## Outside Sources

1. **Sprott JC** — "Strange Attractors: Creating Patterns in Chaos", M&T Books 1993.
   Parameter tables for two-dimensional maps, including de Jong family.
   Website: https://sprott.physics.wisc.edu/fractals/2d/ — content CC0.
2. **Paul Bourke** — "Peter de Jong Attractors", paulbourke.net/fractals/peterdejong/ (CC0).
   Visual parameter survey with downloadable C source.
3. **de Jong P** — "Strange Attractors", Scientific American Digital 1994.
   Original description of the map, equations now public domain.
