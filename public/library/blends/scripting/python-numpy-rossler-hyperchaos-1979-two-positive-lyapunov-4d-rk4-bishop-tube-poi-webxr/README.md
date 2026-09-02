# Rössler Hyperchaos (1979)

**Type:** blend + glb · **Topic:** scripting · **Blender:** 5.1  
**Licence:** CC0 (equations public domain; blueprint original work)

## What is this?

The first chaotic system in the literature to exhibit **two positive
Lyapunov exponents simultaneously** — a property Otto Rössler called
"hyperchaos" in his 1979 paper.

Standard strange attractors (Lorenz, the 1976 Rössler, Chen) have a single
positive exponent.  Rössler found that coupling a slow auxiliary variable w
into the ẏ equation of his 1976 system is sufficient to open a *second*
expansion direction.  Nearby trajectories then diverge in two independent
phase-space directions at once, making long-range prediction deteriorate
faster than in ordinary chaos.

**Kaplan–Yorke dimension** D_KY ≈ 3.16 — the attractor's fractal dimension
exceeds integer 3.  This was the first time D_KY > 3 had been demonstrated.

## Equations

```
ẋ = −y − z
ẏ =  x + 0.25·y + w     ← coupling term opens λ₂ > 0
ż =  3 + x·z
ẇ = −0.5·z + 0.05·w
```

**Divergence** (position-dependent): ∇·F = x + 0.30  
**∑λᵢ ≈ −0.86** (Liouville identity checks out numerically)

## Lyapunov spectrum (canonical)

| Exponent | Value     | Meaning                         |
|----------|-----------|---------------------------------|
| λ₁       | ≈ +0.135  | principal expansion direction   |
| λ₂       | ≈ +0.032  | **second expansion** (hyperchaos) |
| λ₃       | ≈  0.000  | marginal (along the flow)       |
| λ₄       | ≈ −1.030  | strong contraction              |

D_KY = 3 + (λ₁+λ₂+λ₃)/|λ₄| ≈ 3.16

## Files

| File | Description |
|------|-------------|
| `blueprint.py` | Blender 5.1 bpy script; run in Scripting workspace |
| `record.py` | Viewport animation render (runs after blueprint.py) |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for screen.mp4 |
| `.expected-artefacts.json` | Expected output file list |

## Shape keys

| Key | d | Character |
|-----|---|-----------|
| Basis | 0.05 | Canonical hyperchaos; two positive LEs |
| SK_WeakHyper | 0.02 | Just above threshold; λ₂ barely positive |
| SK_Regular | 0.00 | d=0 decouples w; single positive LE (ordinary chaos) |
| SK_StrongHyper | 0.15 | Strong hyperchaos; orbit spreads broadly in w |

## How to run

```bash
blender --background --python blueprint.py
# produces rossler_hyperchaos_poi.blend

blender rossler_hyperchaos_poi.blend --background --python record.py
# produces viewport.mp4
```

## Cross-references

- Tutorial page:
  `/tutorials/blender-tutorial-python-numpy-rossler-hyperchaos-1979-two-positive-lyapunov-4d-rk4-bishop-tube-poi-webxr`
- Related: Rössler 1976 single-scroll attractor tutorial
- Related: Chen attractor tutorial (constant divergence contrast)

## Outside sources

1. **Rössler OE (1979)** "An equation for hyperchaos"
   *Physics Letters A* 71(2-3):155-157.
   doi:10.1016/0375-9601(79)90150-6 — equations in public domain.

2. **Sprott JC** — chaos.wisc.edu gallery and *Elegant Chaos* (2010).
   MIT licence on code samples.
   <https://sprott.physics.wisc.edu/chaos/comchaos.htm>
