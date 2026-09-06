# Rabinovich–Fabrikant Equations (1979) — Plasma Wave-Modulation Chaos

**Topic**: Strange attractor · Plasma physics · Wave modulation instability  
**Blender**: 5.1  
**Licence**: CC0  
**Date**: 2026-09-06

## What this is

The Rabinovich–Fabrikant (RF) equations were derived in 1979 to model the
stochastic self-modulation of nonlinear waves in a non-equilibrium medium —
concretely, the amplitude dynamics of electromagnetic waves in a plasma where
two polarisation modes exchange energy via parametric coupling.

The resulting strange attractor is one of the most structurally rich in the
three-variable family: multi-scroll topology, co-existing chaotic attractors
at the same parameter values (bistability of chaos), and a divergence that is
constant despite strongly position-dependent nonlinearities.

```
ẋ =  y·(z − 1 + x²) + γ·x
ẏ =  x·(3z + 1 − x²) + γ·y
ż = −2z·(α + xy)

∇·F = 2γ − 2α  (constant — rare for this class of nonlinearity)
```

Canonical parameters: **α = 0.14, γ = 0.10** → ∇·F = −0.08 (weakly dissipative)

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Full Blender 5.1 bpy script — integrates RF, builds Bishop tube poi, exports GLB |
| `record.py` | Renders 240-frame viewport animation to `public/library/videos/…/viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS/Game Bar instructions for `screen.mp4` |
| `.expected-artefacts.json` | CI manifest of expected output files |

## Running

```bash
# In Blender 5.1 Scripting workspace:
# 1. Open blueprint.py
# 2. Run Script (Alt+P)
# Outputs: hf_rf_poi.blend + hf_rf_poi.glb

# For viewport video:
blender --background hf_rf_poi.blend --python record.py
```

## Outputs

- `hf_rf_poi.blend` — Blender scene with poi mesh and four shape keys
- `hf_rf_poi.glb` — Draco-6 compressed GLB for WebXR
- `public/library/videos/…/viewport.mp4` — 240-frame render (not committed)

## Mathematics

| Property | Value |
|----------|-------|
| Lyapunov λ₁ | ≈ +0.063 |
| Lyapunov λ₂ | ≈ 0 |
| Lyapunov λ₃ | ≈ −0.143 |
| Kaplan-Yorke dim D_KY | ≈ 2.44 |
| Divergence ∇·F | −0.08 (constant) |
| Lyapunov time τ | ≈ 15.9 |

## Shape keys

| Key | α | γ | Topology |
|-----|---|---|----------|
| Basis | 0.14 | 0.10 | Canonical multi-scroll |
| SK_WeakDiss | 0.10 | 0.10 | Weaker dissipation → larger orbit |
| SK_StrongDiss | 0.20 | 0.10 | Stronger dissipation → compressed |
| SK_HighG | 0.14 | 0.15 | Higher growth → extra lobe |

## Related

- [Tutorial page](/tutorials/blender-tutorial-python-numpy-rabinovich-fabrikant-equations-1979-plasma-wave-modulation-chaos-rk4-bishop-tube-poi-webxr)
- Rabinovich MI, Fabrikant AL (1979) JETP 50:311 — original paper, equations public domain
- [williamgilpin/dysts](https://github.com/williamgilpin/dysts) — MIT licence, RF catalogued
