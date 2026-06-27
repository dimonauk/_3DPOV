# GN Accumulate Field — Weighted Stripe Tube

**Blender 5.1 · Geometry Nodes · CC0 · Holoflow Studio**

Demonstrates `GeometryNodeAccumulateField`: a single-pass prefix-sum node that
computes a running total of any field across a domain (POINT, EDGE, FACE, CORNER).
The three outputs — **Leading** (exclusive), **Trailing** (inclusive), **Total**
(full group sum) — give you arc-length-style parameterisation of a _custom_
per-point weight field, not just geometric distance.

## What this builds

An S-curve Bezier tube where each of 64 resampled points carries a noise-driven
weight (0.4 – 1.6). AccumulateField sums these weights; normalising the
`Leading` output by `Total` yields a UV parameter where high-weight segments own
wide colour stripes and low-weight segments own narrow ones. The tube is exported
as a GLB for WebXR.

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Full bpy scene build: S-curve, GN tree, emission material, GLB export |
| `record.py` | 72-frame orbit render → `viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS setup for Blender screen capture |
| `.expected-artefacts.json` | Artefact manifest with cross-references |

## Quick start

```bash
blender --background --python blueprint.py
# output/weighted_stripe_tube.glb is created beside the .blend
blender weighted_stripe_tube.blend --python record.py
# public/library/videos/…/viewport.mp4 is created
```

## Key parameters (top of blueprint.py)

| Constant | Default | Effect |
|----------|---------|--------|
| `RESAMPLE_COUNT` | 64 | Points on the resampled curve — raise for smoother stripes |
| `WEIGHT_NOISE_SCALE` | 3.5 | Noise cycles across the path — higher = more irregular stripes |
| `WEIGHT_MIN / MAX` | 0.40 / 1.60 | Stripe-width variance ratio |
| `NUM_STRIPES` | 8 | Colour alternations; must be < RESAMPLE_COUNT / 2 |
| `PROFILE_RADIUS` | 0.07 m | Tube girth for WebXR scale |

## Accumulate Field — output semantics

```
index:     0     1     2     3    ...   N-1
weight:  [w0]  [w1]  [w2]  [w3]  ...  [wN-1]

Leading:    0    w0  w0+w1 w0+w1+w2 ...  sum(w0..wN-2)
Trailing:  w0  w0+w1 ...                 sum(w0..wN-1)  ← same as Total on last point
Total:    W    W     W     W        ...  W              (where W = sum of all weights)

Weighted UV (Leading / Total):
  point 0: 0 / W  = 0.0
  point 1: w0 / W
  ...
  point N-1: sum(w0..wN-2) / W
```

## Licence

All Holoflow Studio source code is CC0 (public domain dedication).
