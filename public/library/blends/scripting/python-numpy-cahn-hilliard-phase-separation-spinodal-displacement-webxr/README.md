# Cahn-Hilliard Phase Separation — Spinodal Decomposition (Blender 5.1)

Fourier spectral numpy simulation of the Cahn-Hilliard equation driving an
N×N vertex grid displaced in Z, yielding a 3D bicontinuous coral landscape.

The Cahn-Hilliard equation (∂φ/∂t = ∇²(φ³−φ−γ∇²φ)) models how a binary
mixture spontaneously separates into equal-volume labyrinthine domains when
quenched into the spinodal region.  The semi-implicit Fourier scheme runs
stably at Δt = 1.0 with no CFL restriction.

## Quick start

1. Open Blender 5.1, Scripting workspace.
2. Open `blueprint.py` → **Run Script** (approx. 4–8 s on a modern CPU).
3. Watch the console: `[CH] Done.  φ ∈ [−0.98, +0.97]` confirms convergence.
4. Switch to 3D Viewport → Rendered shading → **Space** to preview orbit.
5. Open `record.py` → **Run Script** to render `viewport.mp4`.
6. For `screen.mp4`: follow `SCREEN-RECORDING-NOTES.md`.

## Parameters

| Constant     | Default | Effect                                                  |
|--------------|---------|---------------------------------------------------------|
| `N`          | 128     | Grid size; 256 gives finer detail, takes ~4× longer    |
| `GAMMA`      | 0.01    | Interface width ≈ 2√γ; reduce → thinner coral walls    |
| `N_STEPS`    | 600     | More steps → larger, coarser domains (coarsening)      |
| `NOISE_AMP`  | 0.05    | Larger → faster initial growth, less random appearance |
| `DISP_SCALE` | 0.07    | Height of the relief in Blender metres                  |
| `EMIT_STR`   | 5.0     | Emission brightness of the amber phase-A material       |

## Outputs

| File                    | Description                                         |
|-------------------------|-----------------------------------------------------|
| `hf_cahn_hilliard.glb`  | 16 k-vert displaced mesh, Draco L6, two-phase vcol |
| `viewport.mp4`          | 240-frame 30 fps EEVEE orbit animation              |
| `screen.mp4`            | OBS screen recording (see SCREEN-RECORDING-NOTES)   |

## Physics background

- φ ≈ +1 = phase A (polymer A, solvent, or spin-up)
- φ ≈ −1 = phase B (polymer B, solute, or spin-down)
- Interface sits where φ = 0 (the CH domain boundary)
- Coarsening rate ∼ t^(1/3) (Lifshitz–Slyozov–Wagner exponent for diffusion)
- Critical wavenumber k_c = 1/√γ ≈ 10; dominant mode k* = k_c/√2 ≈ 7

## Licence

CC0 — all original code.  Cahn-Hilliard equations are mathematical facts.
