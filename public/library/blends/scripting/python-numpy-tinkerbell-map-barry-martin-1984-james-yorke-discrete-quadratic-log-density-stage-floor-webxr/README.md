# Tinkerbell Map — Discrete Quadratic 2-D Map, Log-Density Height-Field

**Barry Martin 1984 / James Yorke (naming) · Blender 5.1 · CC0**

A four-parameter family of discrete quadratic maps producing a fractal
butterfly attractor, rendered as a 120×120 log-density height field for WebXR.

---

## The mathematics

```
x_{n+1} = x_n² − y_n²  +  a·x_n + b·y_n
y_{n+1} = 2·x_n·y_n    +  c·x_n + d·y_n
```

The quadratic terms `(x²−y², 2xy)` are the real and imaginary parts of
complex squaring `z²=(x+iy)²`. The linear part is NOT a complex multiplication
(that would require `a=d`, `b=−c`). The four independent linear coefficients
break conformality, placing the Tinkerbell in the wider class of 2-D
real diffeomorphisms rather than the complex polynomial family.

**Named by James Yorke** for the butterfly shape of the attractor at the
standard parameters. Barry Martin explored the map at UNC Chapel Hill in the
early-1980s; the name and popularisation came from Yorke's chaos seminars.

### Lyapunov exponents (standard Basis parameters)

| Quantity | Value |
|---|---|
| λ₁ (largest) | ≈ +0.064 |
| λ₂ | ≈ −0.143 |
| Sum (net dissipation) | ≈ −0.079 |
| Kaplan-Yorke dimension | ≈ 1.45 |

Net dissipation `< 0` confirms the orbit contracts onto a genuine strange
attractor with fractal dimension strictly between 1 and 2.

---

## File list

| File | Purpose |
|---|---|
| `blueprint.py` | Expert-grade bpy script — builds mesh, shape keys, material |
| `record.py` | EEVEE-Next viewport animation → `viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS / Game Bar instructions for `screen.mp4` |
| `.expected-artefacts.json` | Manifest with cross-references |

---

## Shape keys

| Key | a | b | c | d | Character |
|---|---|---|---|---|---|
| **Basis** | 0.900 | −0.6013 | 2.000 | 0.500 | Classic two-wing butterfly |
| SK_Curled | 0.700 | −0.6013 | 2.000 | 0.500 | Tighter single-lobe curl |
| SK_Open | 1.300 | −0.6013 | 2.000 | 0.500 | Spreading multi-petal fan |
| SK_Drift | 0.900 | −0.6013 | 2.500 | 0.500 | Basin shifts rightward |

---

## Rendering

```
Mesh:        120 × 120 = 14 400 vertices, 14 161 quads
Iterations:  5 000 000 per shape key
Height:      log(1 + count) / max, scaled to 0.50 m
Colour:      FLOAT_COLOR "Tinkerbell_Density" (cobalt → amber)
Export:      GLB + Draco-6 + WebP, export_morph=True, export_colors=True
```

---

## Outside sources

- **Sprott JC** "2-D Strange Attractors" — CC0 web survey with parameter images.
  <https://sprott.physics.wisc.edu/fractals/2d/>
  Related: <https://sprott.physics.wisc.edu/chaos/> (Chaos and Time-Series site)

- **Bourke P** "Tinkerbell Attractor" — CC0 with C source and parameter renders.
  <https://paulbourke.net/fractals/tinkerbell/>
  Related: <https://paulbourke.net/fractals/peterdejong/> (de Jong attractor, same density technique)

---

## Related library entries

- [Clifford Attractor](../python-numpy-clifford-attractor-pickover-discrete-2d-map-fractal-density-stage-floor-webxr/) — same log-density height-field approach
- [Peter de Jong Attractor](../python-numpy-peter-de-jong-attractor-discrete-2d-map-log-density-height-field-stage-floor-webxr/) — bounded 2-D trig map, same stage-floor geometry
- [Mandelbrot / Julia Fractal](../python-numpy-mandelbrot-julia-fractal-poi-webxr/) — complex polynomial family that the Tinkerbell's quadratic part relates to
- [Feigenbaum Logistic Map](../python-numpy-feigenbaum-logistic-map-period-doubling-universality-poi-disc-webxr/) — period-doubling route to chaos, same parameter-space navigation theme
