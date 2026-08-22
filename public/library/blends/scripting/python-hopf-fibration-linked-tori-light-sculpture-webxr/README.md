# Hopf Fibration — Linked-Torus Light Sculpture

**Blender 5.1 · Python Scripting · CC0 · Holoflow Studio**

The Hopf fibration maps the 3-sphere S³ onto the 2-sphere S².  Every point on
S² has a complete circle in S³ above it (its *fibre*), and any two distinct
fibres link exactly once.  Stereographic projection then collapses S³ into
ordinary ℝ³, where each fibre becomes a Villarceau circle resting on a nested
torus.  The result is a family of glowing rings that pass through one another
without touching — a light sculpture of pure topology.

---

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Build the full sculpture — run once in the Scripting tab |
| `record.py` | Camera-orbit render → `viewport.mp4` (run after blueprint) |
| `SCREEN-RECORDING-NOTES.md` | OBS/Game Bar guide for `screen.mp4` |

---

## Quick start

1. Open a new Blender 5.1 file.
2. Switch to the **Scripting** workspace.
3. Click **New**, paste `blueprint.py`, press **Run Script**.
4. The scene builds ≈ 72 linked-ring curves coloured by latitude band.
5. Switch shading to **Rendered** (EEVEE Next) to see the Bloom glow.
6. Open `record.py` and press **Run Script** to render the 150-frame orbit.

---

## Key parameters (top of blueprint.py)

| Constant | Default | Effect |
|----------|---------|--------|
| `PHI_COUNT` | 6 | Latitude bands on S² |
| `PSI_COUNT` | 12 | Fibres per band |
| `FIBRE_STEPS` | 96 | Points per circle (smoothness) |
| `BEVEL_DEPTH` | 0.018 | Tube radius |
| `SCALE` | 1.8 | Sculpture radius (world units) |
| `EMISSION_STR` | 10.0 | EEVEE emission brightness |

---

## Maths summary

```
Section:  q₀(p) = ( √((1+p₃)/2),  −p₂/√(2(1+p₃)),  p₁/√(2(1+p₃)),  0 )
Phase:    q(α)  = q₀ · (cos α, sin α, 0, 0)   — right-mult by U(1) element
Stereo:   π(a,b,c,d) = SCALE · (b/(1−a),  c/(1−a),  d/(1−a))
```

---

## Licence

CC0 1.0 Universal — place in the public domain.  
Outside reference: Blender Foundation Python API 5.1 (CC-BY-SA-4.0).  
Outside reference: niles-johnson/Hopf — MIT licence.

---

## Related tutorials

- [Lorenz Attractor: Butterfly Chaos Light-Painting](/tutorials/blender-tutorial-gn-simulation-zone-lorenz-attractor-poi-light-painting)
- [N-Body Gravity: Star Cluster Leapfrog](/tutorials/blender-tutorial-python-nbody-gravity-star-cluster-leapfrog-light-painting)
- [Points to Curves: Poi Trail Ribbons](/tutorials/blender-tutorial-gn-points-to-curves-poi-trail-ribbon-webxr)
