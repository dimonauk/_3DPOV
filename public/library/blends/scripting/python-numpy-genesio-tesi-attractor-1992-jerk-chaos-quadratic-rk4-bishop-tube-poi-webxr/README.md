# Genesio–Tesi Jerk Attractor (1992)

**System**: `ẋ=y  ẏ=z  ż=−c₁x−c₂y−c₃z+x²`  
**Origin**: Control theory — analysing when nonlinear feedback systems become chaotic.  
**Studio slug**: `python-numpy-genesio-tesi-attractor-1992-jerk-chaos-quadratic-rk4-bishop-tube-poi-webxr`  
**Blender**: 5.1 · **Licence**: CC0 (blueprint code) · **Source equations**: PD (mathematical facts)

---

## What this is

Roberto Genesio and Alberto Tesi at the Università di Firenze were not chaos
theorists — they were control engineers.  In 1992 they were trying to understand
when a simple nonlinear feedback control system breaks down and becomes chaotic.
The system they studied was:

```
x‴ + c₃x″ + c₂ẋ + c₁x = x²
```

Which in state form is:

```
ẋ = y
ẏ = z
ż = −c₁x − c₂y − c₃z + x²
```

With `c₁=1.0, c₂=1.3, c₃=0.44` this produces a genuine strange attractor —
a Kaplan–Yorke dimension ≈ 2.142, a positive Lyapunov exponent λ₁ ≈ +0.073,
and a single-lobe topology wrapping around the saddle-focus equilibrium at
P₁ = (1, 0, 0).

The key insight: the **only nonlinearity is x²**.  Every other term is linear.
The sole source of dissipation is −c₃z in the third equation, giving constant
divergence ∇·F = −c₃ = −0.44 everywhere.

---

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Blender 5.1 script — RK4 integration + Bishop tube + 4 shape keys |
| `record.py` | Renders a 5-second viewport animation to `videos/.../viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for the hands-on screen recording |
| `.expected-artefacts.json` | Manifest of expected output files |

---

## Quick start

1. Open Blender 5.1.
2. Scripting workspace → paste `blueprint.py` → **Run Script**.
3. Switch to 3D Viewport.  Object `hf_genesio_tesi_poi` is ready.
4. To render the recording: paste `record.py` → Run Script.  
   Output: `public/library/videos/scripting/.../viewport.mp4`.

---

## Parameters

| Parameter | Value | Meaning |
|-----------|-------|---------|
| `C1_BASIS` | 1.0 | position coefficient in ż |
| `C2_BASIS` | 1.3 | velocity coefficient in ż (velocity damping) |
| `C3_BASIS` | 0.44 | acceleration coefficient (sole source of divergence) |
| `DT` | 0.01 | RK4 time-step |
| `BURN_IN` | 3000 | transient steps discarded |
| `N_STEPS` | 90 000 | integration steps recorded |
| `THIN` | 30 | thinning factor → 3 000 waypoints |

---

## Shape keys

| Key | Parameters | Effect |
|-----|-----------|--------|
| Basis | c₃=0.44 | Canonical chaos, D_KY≈2.142 |
| SK_DenseWrap | c₃=0.30 | Weaker dissipation → denser, larger orbit |
| SK_BorderChs | c₃=0.55 | Near chaos boundary → smaller, near-periodic orbit |
| SK_ShiftedEQ | c₁=0.70, c₂=1.2 | P₁ at x=0.70 — topology shifts |

---

## Outside sources

1. **Genesio, R. & Tesi, A. (1992).**  "Harmonic balance methods for the analysis
   of chaotic dynamics in nonlinear systems." *Automatica* 28(3):531–548.
   DOI: [10.1016/0005-1098(92)90177-H](https://doi.org/10.1016/0005-1098(92)90177-H)
   — Equations are mathematical facts in the public domain.

2. **Sprott, J.C. (2010).** *Elegant Chaos: Algebraically Simple Chaotic Flows.*
   World Scientific. Free companion C source at
   [sprott.physics.wisc.edu/chaos/](https://sprott.physics.wisc.edu/chaos/)
   — no stated licence restriction on the companion programs.

---

## Related studio tutorials

- [Rössler Attractor](/tutorials/blender-tutorial-python-numpy-rossler-attractor-otto-1976-single-scroll-band-horseshoe-shilnikov-rk4-bishop-tube-poi-webxr) — also single-scroll, jerk-adjacent
- [Sprott B Attractor](/tutorials/blender-tutorial-python-numpy-sprott-b-attractor-linz-two-quadratic-minimal-chaos-rk4-bishop-tube-poi-webxr) — minimal-term chaos search, same era
- [Moore–Spiegel Oscillator](/tutorials/blender-tutorial-python-numpy-moore-spiegel-oscillator-1966-stellar-convection-nonlinear-jerk-chaos-rk4-bishop-tube-poi-webxr) — another jerk-type 3rd-order system
