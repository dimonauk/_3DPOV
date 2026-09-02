# Kuramoto–Sivashinsky PDE — Spatiotemporal Flame-Front Chaos
**Stage-Floor Height-Field for WebXR · Blender 5.1**

## What this is

The Kuramoto–Sivashinsky (KS) equation,

```
u_t + u·u_x + u_xx + u_xxxx = 0
```

governs sustained spatiotemporal chaos on a one-dimensional periodic domain.
It was derived independently by Kuramoto & Tsuzuki (1976) studying chemical
waves in reaction–diffusion systems, and by Sivashinsky (1977) analysing the
instability of laminar flame fronts.  The same equation describes thin-film
dynamics, plasma drift waves, and falling liquid films on an inclined plane.

This blueprint numerically integrates the KS equation in Fourier space using
4th-order Runge–Kutta, then visualises the solution as a **space-time
height-field stage floor**: one horizontal axis is space x, the other is
time t, and the height is u(x, t).  The result is the iconic "wavy stripe"
space-time diagram — diagonal streaks where flame cells drift, sudden
cell-merging events where wider cells absorb narrower neighbours.

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Blender 5.1 script; run in Text Editor |
| `record.py`    | Renders viewport.mp4 once mesh is built |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for screen.mp4 |

## Outputs (after running blueprint.py)

| Artefact | Location |
|----------|----------|
| `ks_floor.blend` | save manually after running |
| `ks_floor.glb`   | auto-exported alongside .blend |

## Parameters

| Constant | Value | Meaning |
|----------|-------|---------|
| `N` | 128 | Fourier modes |
| `L_BASIS` | 36π ≈ 113 | Canonical domain length |
| `DT` | 0.015 | RK4 timestep (CFL stable) |
| `T_WARMUP` | 100 | Transient discarded |
| `T_REC_B` | 100 | Recording window (Basis) |
| `N_SNAP` | 128 | Time snapshots (128×128 mesh) |

## Shape keys

| Name | Parameters | Visual |
|------|-----------|--------|
| Basis | L=36π, t=100 | Canonical cell turbulence |
| SK_Early | L=36π, t=30 | Cells just forming from noise |
| SK_SmL | L=16π, t=100 | Near-onset quasi-periodic modulation |
| SK_LgL | L=72π, t=100 | Large domain, hierarchical multi-scale |

## Physics notes

**Linear stability**: σ(k) = k² − k⁴.  Growth for 0 < k < 1.
Most unstable: k* = 1/√2, growth rate σ* = 1/4.

**Attractor dimension**: grows linearly with L.  For L=36π, estimated
Lyapunov dimension D_L ≈ L/(2π) · c ≈ 10–12 (Manneville 1985).

**Cell dynamics**: KS turbulence exhibits coarsening — small cells merge
into larger ones — interrupted by cell-splitting events.  The mean cell
spacing stabilises near the most-unstable wavelength λ* = 2π√2 ≈ 8.9.

## Licence

Blueprint: CC0 (studio work).  Equation source: public-domain mathematics.
Kuramoto & Tsuzuki 1976 DOI 10.1143/PTP.55.356 / Sivashinsky 1977
DOI 10.1016/0094-5765(77)90096-0.
