# Feigenbaum Bifurcation Disc

**Topic:** Logistic map period-doubling cascade, Feigenbaum universality  
**Blender version:** 5.1  
**Licence:** CC0  
**Series:** scripting  
**Form factor:** poi disc for WebXR  

## What this is

The **logistic map** `f_r(x) = r · x · (1 − x)` maps the unit interval to itself.
For small `r` the orbit of almost any starting point converges to a fixed point.
As `r` increases the fixed point undergoes a **period-doubling bifurcation** at
`r ≈ 3.0`, then again at `r ≈ 3.449`, and again and again in an accelerating
sequence that accumulates at `r∞ ≈ 3.5699…`, beyond which the orbit is chaotic.

Mitchell Feigenbaum (1978) discovered that the ratio of consecutive bifurcation
gap widths converges to a universal constant:

```
δ = lim_{n→∞} (r_n − r_{n-1}) / (r_{n+1} − r_n) ≈ 4.66920160910…
```

This constant δ and the companion scaling constant α ≈ −2.50291 appear in
**every** unimodal map with a quadratic maximum — logistic, sine, cosine, any
quadratic — regardless of the specific algebraic form.  Feigenbaum proved this
universality via renormalisation-group theory.

## Geometry

- **Radial axis** → logistic map parameter r ∈ [2.8, 4.0]
- **Angular axis** → attractor state x ∈ [0, 1] → θ = 2π · x
- **Height Z(r, x)** → orbit visit density (normalised per-r)

Period-1 orbits leave a single narrow amber spike per ring.  
Period-2 leaves two antipodal spikes.  
Chaos smears the full angular width.  
The **period-3 window** at r ≈ 3.833 (Li-Yorke 1975) shows three spikes
emerging inside the chaotic sea — visible in `SK_Period3Win`.

## Files

| File | Description |
|---|---|
| `blueprint.py` | Full bpy + numpy generation script |
| `record.py` | Viewport animation → `viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for `screen.mp4` |
| `.expected-artefacts.json` | Metadata and cross-reference registry |

## Shape keys

| Key | r window | Shows |
|---|---|---|
| `Basis` | [2.80, 4.00] | Full bifurcation diagram |
| `SK_FirstBifurc` | [2.95, 3.15] | Period-1 → period-2 transition |
| `SK_Cascade` | [3.40, 3.58] | Period-doubling cascade |
| `SK_ChaoticOnset` | [3.55, 3.65] | Chaos onset / intermittency |
| `SK_Period3Win` | [3.82, 3.88] | Period-3 window (r ≈ 3.833) |

## Key references

- Feigenbaum MJ (1978) *Quantitative universality for a class of nonlinear
  transformations.* J. Stat. Phys. **19**(1):25–52.
  [doi:10.1007/BF01020332](https://doi.org/10.1007/BF01020332)
- Li T-Y & Yorke JA (1975) *Period three implies chaos.* Am. Math. Monthly
  **82**(10):985–992.
- Collet P & Eckmann J-P (1980) *Iterated Maps on the Interval as Dynamical
  Systems.* Birkhäuser (MIT Press reissue 2009).

## Studio cross-references

- [Duffing Oscillator: Period-Doubling & Poincaré Section](/tutorials/blender-tutorial-python-numpy-duffing-oscillator-period-doubling-poincare-chaos-poi-webxr)
- [Aizawa Attractor: RK4 Chaos](/tutorials/blender-tutorial-python-numpy-aizawa-attractor-toroidal-chaos-rk4-bishop-tube-poi-webxr)
- [Lorenz Attractor: RK4 Butterfly](/tutorials/blender-tutorial-python-numpy-lorenz-attractor-rk4-strange-butterfly-poi-light-trail-webxr)
- [Coupled Map Lattice: Logistic Spatiotemporal Chaos](/tutorials/blender-tutorial-gn-simulation-zone-coupled-map-lattice-logistic-spatiotemporal-chaos-poi-webxr)
