# Aizawa Attractor — Toroidal Strange Attractor

**Blender 5.1 | Python + numpy | CC0**

Implements the Aizawa strange attractor (Aizawa & Ichi 1984) as a bevelled
POLY tube winding around a toroidal void, with RK4 integration, two
shape-key deformation targets, and WebXR-ready GLB export.

## What it builds

A single POLY bevel-curve object (`Aizawa_Attractor`) tracing 60,000 steps
of the Aizawa ODE with canonical parameters α=0.95, β=0.7, γ=0.6, δ=3.5,
ε=0.25, ζ=0.1:

- **Basis** — canonical chaotic form; λ₁ ≈ +0.073, D_KY ≈ 2.15
- **SK_e0** — ε=0.00: pure z³ attractor, smoother ring with larger central void
- **SK_e50** — ε=0.50: denser winding, tighter toroidal tangle

The tube bevel is 16-sided (`bevel_resolution=3`) with `use_fill_caps=True`.

Export: `hf_aizawa_poi.glb` with Draco-6 compression, shape keys included.

## The toroidal void

Unlike Lorenz (two-lobe butterfly) or Rössler (single-scroll), the Aizawa
attractor has a *hole through its centre* — the trajectory winds continuously
around a doughnut-shaped void without ever passing through it.

This topology arises because the (x,y) subsystem is a 2D oscillator whose
radius grows when z > β and contracts when z < β. The z motion oscillates
quasi-periodically. The result is a trajectory that traces closed-but-not-quite
rings around the z-axis — chaos comes from the incommensurability of the
fast (x,y) rotation rate (≈ δ = 3.5 rad / time unit) with the slow z period.

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Full build — run in Blender Scripting workspace |
| `record.py` | Viewport animation render → `viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS setup for `screen.mp4` |
| `hf_aizawa_poi.glb` | Generated GLB (Draco-6, shape keys) |

## How to run

1. Open Blender 5.1 → **Scripting** workspace → New file.
2. Open `blueprint.py`, click **Run Script** (approx. 20–30 s on modern hardware).
3. Orbit the viewport to inspect the toroidal void — front view shows it clearly.
4. Open `record.py`, click **Run Script** to render the 10-second viewport animation.

## Licence

CC0 — no rights reserved.  
Algorithm: Aizawa & Ichi (1984); equations are mathematical content in the
public domain. Implementation CC0.
