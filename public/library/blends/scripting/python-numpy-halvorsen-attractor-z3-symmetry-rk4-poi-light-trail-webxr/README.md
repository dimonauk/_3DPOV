# Halvorsen Attractor — Z₃-Symmetric Strange Attractor

**Blender 5.1 | Python + numpy | CC0**

Implements the Halvorsen strange attractor (Halvorsen ~1978; Sprott 2010
"Elegant Chaos") as three interleaved bevel-NURBS light-trail tubes with
C₃ orbit decomposition, RK4 integration, and WebXR-ready GLB export.

## What it builds

Three bevel-NURBS POLY curves (arms A/B/C) coloured R/G/B, each tracing
one symmetry-related arm of the Halvorsen butterfly:

- **Basis** — α = 1.89, canonical chaotic form (positive Lyapunov exponent λ₁ ≈ +0.22)
- **alpha_1.4** shape key — period-8 window; cleaner arcs, tighter loops
- **alpha_1.6** shape key — quasi-periodic transition regime

Export: `hf_halvorsen.glb` with Draco-6 compression, shape keys included.

## Z₃ symmetry explained

The cyclic permutation σ: (x,y,z) → (y,z,x) is an exact symmetry of the
vector field. The three initial seeds in `blueprint.py` are exact σ-images
of each other, so the three arms are mathematically identical up to the
120° permutation — they are one orbit viewed through three lenses.

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Full build — run in Blender Scripting workspace |
| `record.py`    | Viewport animation render → `viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS setup for `screen.mp4` |
| `hf_halvorsen.glb` | Generated GLB (Draco-6, shape keys) |

## How to run

1. Open Blender 5.1 → **Scripting** workspace → New file.
2. Open `blueprint.py`, click **Run Script** (~3 s on modern hardware).
3. Inspect the attractor in the viewport — toggle the alpha_1.4 shape key
   value (Properties → Object Data → Shape Keys) to see the bifurcation.
4. Open `record.py`, click **Run Script** to render the viewport animation.

## Licence

CC0 — no rights reserved.  
Algorithm: Halvorsen (~1978); Sprott (2010) "Elegant Chaos", Cambridge UP.
