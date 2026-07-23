# GN Simulation Zone — Belousov-Zhabotinsky Oregonator: Spiral Waves

**Blender 5.1 · CC0 · Geometry Nodes · Simulation Zone**

Implements the two-variable simplified Oregonator — the canonical mathematical
model of the Belousov-Zhabotinsky (BZ) chemical oscillator — entirely inside a
Blender 5.1 Geometry Nodes Simulation Zone. Three broken-circle spiral seeds
nucleate rotating spiral wave pairs within ~30 frames. By frame 80 the 64×64
vertex grid is carpeted with mature counter-rotating spirals visible as an
animated height landscape and hot-map emission material.

## What is the BZ reaction?

Boris Belousov (1951) and Anatol Zhabotinsky (1964) independently observed a
sulphuric-acid–bromate–cerium oscillator that cycles visibly between oxidised
(yellow) and reduced (colourless) states. The spatial variant — on a thin layer
of reagent — spontaneously self-organises into rotating spiral waves. Unlike
Turing patterns (which require only spatial diffusion), BZ waves are driven by
the reaction's own oscillatory kinetics; the spirals never decay.

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Creates the 64×64 grid, seeds u/v attributes, builds the GN node tree with Simulation Zone, applies emission material |
| `record.py`    | EEVEE Next render, frames 0–180, 1920×1080 30 fps → `viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for `screen.mp4` |

## Quick start

1. Open Blender 5.1, Scripting workspace.
2. Paste `blueprint.py` → Run.
3. Switch to 3D Viewport → EEVEE Next → press Space.
4. Spiral waves should appear within 30 frames.

## Parameters (top of blueprint.py)

| Constant | Default | Effect |
|----------|---------|--------|
| `N`      | 64      | Grid subdivisions (N×N verts). 80 gives finer waves but is slower. |
| `EPS`    | 0.04    | Activator timescale. Smaller → sharper fronts, stiffer numerics. |
| `F`      | 1.4     | Stoichiometric factor. 0.5–2.0 gives spirals; >2 → stationary. |
| `Q`      | 0.002   | Quench parameter. Controls the narrow excitation threshold. |
| `D`      | 0.25    | Grid-normalised diffusion. Increase → wider wave fronts. |
| `DT`     | 0.01    | Forward-Euler step. Must satisfy dt ≤ min(ε, 1/(4D·4)). |

## Artefacts produced

- `hf_bz_oscillator.blend` — the live simulation (run blueprint.py to generate)
- `public/library/videos/…/viewport.mp4` — rendered by record.py
- `public/library/videos/…/screen.mp4` — captured by OBS per SCREEN-RECORDING-NOTES.md
