# KdV Soliton — Korteweg–de Vries τ-Function, Hirota Bilinear Method & Animated Stage-Floor

**Blender version:** 5.1  
**Licence:** CC0  
**Topic category:** scripting / nonlinear waves  

## What this does

`blueprint.py` generates a 192×64 height-field stage-floor mesh and two NURBS poi
light-trail curves from the exact 2-soliton solution of the Korteweg–de Vries equation:

```
u_t + 6u u_x + u_xxx = 0
```

The solution is computed analytically via Hirota's τ-function method — no numerical
PDE integration, no finite-difference noise. Shape keys at five time snapshots
(t = −5, −2, 0, +2, +5) let you scrub through the full interaction: two solitons
approach, pass through each other, and emerge with their speeds and amplitudes intact
but their positions shifted — the signature of exact integrability.

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Main Blender script — mesh, shape keys, materials, GLB export |
| `record.py` | EEVEE Next OpenGL animation render → `viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS/Game Bar guide for `screen.mp4` |
| `.expected-artefacts.json` | CI artefact manifest |

## Parameters (top of `blueprint.py`)

| Constant | Default | Meaning |
|----------|---------|---------|
| `KAPPA_1` | 1.20 | Wavenumber of fast soliton (amp = κ²/2 = 0.72, speed = κ² = 1.44) |
| `KAPPA_2` | 0.65 | Wavenumber of slow soliton (amp = 0.211, speed = 0.423) |
| `HEIGHT_SCALE` | 0.28 m | Vertical scale of height field |
| `TIMES` | [−5,−2,0,+2,+5] | Time snapshots for shape keys |

## Running

1. Open Blender 5.1.
2. **Scripting** workspace → open `blueprint.py`.
3. Click **Run Script** (or press `Alt+P`).
4. The mesh, trail curves, and `.glb` export appear immediately.
5. To render the viewport animation, open `record.py` and run it.

## KdV mathematics at a glance

```
1-soliton:  u(x,t) = (κ²/2) sech²(κ(x − κ²t) / 2)

2-soliton τ-function:
  τ = 1 + e^η₁ + e^η₂ + A₁₂ e^(η₁+η₂)
  ηᵢ = κᵢ x − κᵢ³ t
  A₁₂ = ((κ₁−κ₂)/(κ₁+κ₂))²

Phase shifts after collision:
  Δx₁ = +(2/κ₁) ln((κ₁+κ₂)/(κ₁−κ₂))   [fast advances]
  Δx₂ = −(2/κ₂) ln((κ₁+κ₂)/(κ₁−κ₂))   [slow retreats]
```

With default parameters: Δx₁ ≈ +2.02 m, Δx₂ ≈ −3.73 m.

## Studio tutorial

[/tutorials/blender-tutorial-python-numpy-kdv-soliton-hirota-tau-phase-shift-height-field-webxr](/tutorials/blender-tutorial-python-numpy-kdv-soliton-hirota-tau-phase-shift-height-field-webxr)
