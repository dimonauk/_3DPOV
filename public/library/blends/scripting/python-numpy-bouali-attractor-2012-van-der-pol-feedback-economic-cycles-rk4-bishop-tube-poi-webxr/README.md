# Bouali Attractor — Extended Van der Pol Feedback (2012)

**Blender 5.1 · CC0-1.0 · Holoflow Studio Library**

## What it is

Safieddine Bouali introduced this three-dimensional autonomous system as a
model for boom–bust cycles in macroeconomics, extending the classic Van der
Pol oscillator by adding a slow feedback variable z:

```
ẋ =  α · x · (1 − y)  −  β · z
ẏ = −c  · y · (1 − x²)
ż =  μ  · x
```

Canonical parameters: **α = 3.0, β = 2.2, c = 1.0, μ = 0.01**

The `(x, y)` sub-system is Van der Pol: the nonlinear damping term `−c·y(1−x²)`
amplifies oscillations when `|x| > 1` and damps them when `|x| < 1`. The
variable z, driven entirely by μ·x with μ small, acts as a quasi-static
modulator. Because z feeds back through β into ẋ, it shifts the effective
amplitude of each half-cycle before closing — so the orbit never repeats.

Estimated Lyapunov exponent λ₁ ≈ +0.073, Kaplan–Yorke dimension D_KY ≈ 2.01.

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | bpy + numpy script: integrates the ODE, builds Bishop-frame tube, shape keys, FLOAT_COLOR — run inside Blender's Python console or via `blender --python blueprint.py` |
| `record.py` | Run after blueprint; sets up Eevee Next bloom + 10 s orbit animation and renders `viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS step-by-step for the screen-capture `screen.mp4` |
| `.expected-artefacts.json` | Machine-readable manifest of outputs |

## Running

```bash
blender --background --python blueprint.py
# Save as bouali_attractor.blend, then:
blender bouali_attractor.blend --background --python record.py
```

## Shape keys

| Key | α | β | c | μ | Behaviour |
|-----|---|---|---|---|-----------|
| Basis | 3.0 | 2.2 | 1.0 | 0.01 | Canonical slow-z chaos |
| SK_FastZ | 3.0 | 2.2 | 1.0 | 0.05 | Faster z coupling, wider 3-D spread |
| SK_WeakGrowth | 2.0 | 2.2 | 1.0 | 0.01 | Near-periodic boundary, smaller x |
| SK_StrongCouple | 3.0 | 4.0 | 1.0 | 0.01 | Stronger β feedback, topology shift |

## Colour attribute

`Bouali_Speed` (FLOAT_COLOR, POINT domain):
normalised speed ‖(ẋ, ẏ, ż)‖ — cobalt at slow apices, amber at fast
crossings near the origin.

## Mesh stats

~3 000 waypoints · 10-sided tube · ~30 000 vertices · ~29 970 quad faces

## Licence

CC0-1.0 — no rights reserved. Outside sources credited in blueprint.py.

## Cross-references

- [Van der Pol Limit Cycle](/tutorials/blender-tutorial-python-numpy-van-der-pol-lienard-limit-cycle-relaxation-oscillations-bishop-tube-poi-webxr) — parent oscillator
- [Lorenz Attractor](/tutorials/blender-tutorial-python-numpy-lorenz-attractor-rk4-strange-butterfly-poi-light-trail-webxr)
- [Genesio–Tesi Jerk Chaos](/tutorials/blender-tutorial-python-numpy-genesio-tesi-attractor-1992-jerk-chaos-quadratic-rk4-bishop-tube-poi-webxr)
