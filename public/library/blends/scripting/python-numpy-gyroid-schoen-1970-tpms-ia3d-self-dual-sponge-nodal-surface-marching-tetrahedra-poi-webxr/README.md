# Schoen Gyroid — TPMS Ia-3d, Self-Dual Sponge, Genus 3

**Blender 5.1 · Python + NumPy · CC0 · Holoflow Studio**

## What this is

A spherically-clipped Schoen Gyroid poi head for WebXR. The Gyroid is the triply
periodic minimal surface (TPMS) discovered by Alan Schoen in 1970 — unique among
all known TPMS for having no straight lines and no flat symmetry planes. Its two
interpenetrating labyrinths are geometrically identical, related by a half-body-
diagonal translation plus 90° rotation (Ia-3d space group symmetry).

The surface is approximated by the nodal equation:

```
F(x, y, z) = cos x · sin y + cos y · sin z + cos z · sin x = 0
```

Vertex colour (`Gyroid_K`) maps the Gaussian curvature magnitude computed via
the bordered Hessian formula: cobalt at channel junctions (K ≈ 0), amber at
saddle centres (K most negative).

## Files

| File | Description |
|---|---|
| `blueprint.py` | Run in Blender 5.1 Scripting editor to generate mesh + GLB |
| `record.py` | Viewport animation renderer (requires pre-built `.blend`) |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for `screen.mp4` |
| `hf_gyroid_poi.blend` | Saved Blender file (after running blueprint.py) |
| `hf_gyroid_poi.glb` | WebXR-ready GLB (+Y up, Draco-6, WebP textures) |

## Quick Start

```bash
blender --background --python blueprint.py
```

Expect ~30–60 seconds at `N_GRID = 50`. Reduce to `N_GRID = 30` for a 5-second preview.

## Key Parameters

| Constant | Default | Effect |
|---|---|---|
| `N_CELLS` | 2 | Unit cells per axis in the domain |
| `N_GRID` | 50 | Voxel grid samples per axis |
| `POI_R` | 0.082 m | Sphere clip radius |
| `ISO_BASE` | 0.0 | Iso-level (0 = equal volume split) |
| `K_GAMMA` | 0.45 | Perceptual gamma for curvature colour |

## Shape Keys

- **Basis**: `iso = 0` — the balanced nodal-surface gyroid
- **SK_ThickShell**: `iso = +0.28` — positive labyrinth closing in; channels narrow
- **SK_ThinShell**: `iso = −0.28` — negative labyrinth closing (by self-duality, same geometry as ThickShell rotated by 41 screw axis)

## Mathematical Notes

- **Space group**: Ia-3d (No. 230), body-centred cubic with diamond screw axes
- **Genus**: 3 per primitive unit cell (χ = −4, g = 3)
- **Area density**: A/a² ≈ 3.0916 per period a (exact Weierstrass value)
- **Volume split**: both labyrinths ≈ 50 % at iso = 0
- **No straight lines** (unlike Schwarz P and D), **no flat mirrors** (unique property)
- **Self-dual**: symmetry operation in Ia-3d maps (+) labyrinth to (−) labyrinth

## Outside Sources

1. Alan Schoen, *Infinite Periodic Minimal Surfaces Without Self-Intersections*,
   NASA TN D-5541, 1970. **Public Domain.**
   https://ntrs.nasa.gov/citations/19700020472

2. Ken Brakke, *Surface Evolver* v2.70. **MIT Licence.**
   http://facstaff.susqu.edu/brakke/evolver/evolver.html  
   Gyroid example: `evolver/examples/gyroid.fe`
