# Hypotrochoid & Epitrochoid — Rolling-Circle Roulette Poi Ring

**Blender 5.1 · Python / numpy · CC0**

A *roulette curve* is the path traced by a point fixed to a circle rolling
without slipping on another circle.  Roll inside the fixed circle → **hypotrochoid**.
Roll outside → **epitrochoid**.  Both families collapse to single equations
and produce a zoo of named curves — astroid, deltoid, cardioid, nephroid — depending
on the ratio R:r and the pen-arm length d.

This blueprint samples six named variants, wraps each in a Bishop-frame tube mesh,
and stores them as shape keys on a single Blender object.  The result exports as a
studio-ready GLB poi ring.

---

## Closed-curve condition

Given fixed-circle radius R and rolling-circle radius r, the curve closes after
exactly **q revolutions** of the rolling circle, where q = r / gcd(R, r).
When R/r is irrational the curve never closes — we choose rational R:r pairs
throughout so the tube mesh joins cleanly.

## Variants in this blueprint

| Label | R | r | d | Type | Period | Character |
|-------|---|---|---|------|--------|-----------|
| Spirograph_5_3 | 5 | 3 | 4.0 | hypo | 6π | 5 outer loops, d > r |
| Rose_7_2 | 7 | 2 | 2.5 | hypo | 4π | 7 inner loops |
| Astroid | 4 | 1 | 1.0 | hypo | 2π | 4-cusped star (d = r) |
| Deltoid | 3 | 1 | 1.0 | hypo | 2π | 3-cusped Steiner curve |
| Cardioid | 2 | 1 | 1.0 | epi | 2π | heart-shaped, 1 cusp |
| Nephroid | 3 | 1 | 1.0 | epi | 2π | kidney-shaped, 2 cusps |

## Bishop frame

The tube is built with a **parallel-transport (Bishop) frame** rather than the
classical Frenet-Serret apparatus.  At every inflection point of a roulette curve
the Frenet principal normal flips discontinuously; the Bishop frame propagates
smoothly through those points and requires only a single end-correction twist
to close the tube without a gap.

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Main Blender 5.1 script — builds the mesh |
| `record.py` | Renders 8 s shape-key animation to `viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS capture instructions |
| `.expected-artefacts.json` | CI artefact manifest |

## Export

```
File → Export → glTF 2.0
  ☑ Selected Objects
  Draco compression: 6
  Image format: WebP
  ☑ +Y Up
  ☑ Include shape keys
```

## Related studio entries

- [FFT Epicycles Fourier Phasor Chain](/tutorials/blender-tutorial-python-numpy-fft-epicycles-fourier-phasor-chain-poi-webxr) — frequency-domain dual of roulette curves
- [Torus Knot p-q Winding Tube](/tutorials/blender-tutorial-python-mathutils-torus-knot-pq-winding-parallel-transport-tube-webxr) — same Bishop-frame tube technique
- [Spring Pendulum Lissajous](/tutorials/blender-tutorial-gn-simulation-zone-spring-pendulum-poi-lissajous-light-painting) — parametric coupled-oscillator curves
- [Delaunay CMC Roulette of Conic](/tutorials/blender-tutorial-python-numpy-delaunay-cmc-surfaces-unduloid-nodoid-roulette-revolution-poi-webxr) — roulette of an ellipse on a line

## Outside sources

- **matplotlib Gallery — "Animated Spirograph"** · BSD-3-Clause · Matplotlib Contributors
  <https://matplotlib.org/stable/gallery/animation/animated_spiral.html>
  Related: <https://github.com/matplotlib/matplotlib>

- **Wikipedia "Hypotrochoid"** · CC BY-SA 4.0 · Wikipedia Contributors
  <https://en.wikipedia.org/wiki/Hypotrochoid>
  Related: <https://en.wikipedia.org/wiki/Spirograph>
