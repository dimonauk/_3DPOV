# FitzHugh-Nagumo Excitable Medium — Spiral Reentry & Poi Fire Rings

**Blender 5.1 · CC0 · Holoflow Studio**

A 64×64 grid of coupled FitzHugh-Nagumo (FHN) oscillators, implemented
entirely in Geometry Nodes. A cross-field stimulation protocol (two
time-gated stimulus zones built into the GN tree) initiates a rotating
spiral wave over 280 frames — the poi fire-ring made from nerve mathematics.

## What you get

| File | Description |
|------|-------------|
| `hf_fitzhugh_nagumo.blend` | Scene with GN modifier, camera, EEVEE material |
| `blueprint.py` | Builds the scene from scratch — run once with Alt+P |
| `record.py` | Renders `viewport.mp4` with an orbiting camera |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for the tutorial screen recording |

## Quick start

1. Open Blender 5.1 → Scripting workspace.
2. Paste `blueprint.py` into the text editor, press **Alt+P**.
3. Switch to Layout → press **Space** to play. Target waves by frame 20;
   spiral reentry visible after frame 70.

## Parameters to explore

| Parameter | Default | Effect |
|-----------|---------|--------|
| `I_EXT` | 0.5 | 0.0 = excitable (single spike); 0.5 = oscillatory (continuous waves) |
| `EPSILON` | 0.08 | Lower → slower recovery → longer refractory period → wider wavefronts |
| `D` | 0.5 | Higher → faster wave speed, broader wavefronts |
| `N` | 64 | 48 runs faster; 80 gives finer spiral structure |

## Phase-plane anatomy

The FHN phase plane has two nullclines:
- **u-nullcline**: `v = u − u³/3 + I_ext` (cubic S-curve, N-shaped)
- **v-nullcline**: `v = (u + α)/β` (straight line)

With `I_ext = 0.5` these intersect at an *unstable* fixed point on the
middle branch → the system has a global limit cycle (spontaneous oscillation).
With `I_ext = 0.0` the intersection falls on the left stable branch → excitable
medium: needs a threshold kick to fire, then returns to rest.

## Tutorial

`/tutorials/blender-tutorial-gn-simulation-zone-fitzhugh-nagumo-excitable-medium-spiral-reentry-poi`
