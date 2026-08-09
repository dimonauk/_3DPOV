# Reuleaux Tetrahedron — Four-Sphere Intersection, Meissner Constant-Width
## Holoflow Studio · Blender 5.1 · CC0

A parametric poi head built from the intersection of **four spheres**, each of
radius _a_ centred at a vertex of a regular tetrahedron with edge length _a_.
The resulting body—the Reuleaux tetrahedron—has four spherical-triangle faces
meeting along six great-circle arcs. It is the natural 3-D extension of the
Reuleaux triangle, though (unlike its 2-D counterpart) it is **not** a body of
constant width.

Three **shape keys** are included in the GLB morph-target:

| Key | Description |
|-----|-------------|
| **Basis** | Exact Reuleaux tetrahedron — spheres touch at each vertex |
| **Puffed** | Spheres scaled to 1.4× edge length — rounder, deeper grooves |
| **Sphere** | Each vertex projected onto the circumscribed sphere |

## Prerequisites

- Blender 5.1
- Python: `numpy` (shipped with Blender 5.1)

## Running

```bash
# From inside Blender → Scripting workspace:
# Open blueprint.py, then press Run Script.
```

The script creates:
- `hf_reuleaux_tet_poi.blend`  — Blender scene with shape keys + material
- `hf_reuleaux_tet_poi.glb`   — Draco-6 compressed WebXR-ready GLB

## Recording the viewport animation

```bash
# After blueprint.py has run:
blender --background hf_reuleaux_tet_poi.blend --python record.py
```

Output: `public/library/videos/…/viewport.mp4`  (120 frames · 5 s · 24 fps)

For the screen recording, follow `SCREEN-RECORDING-NOTES.md`.

## Key parameters (top of `blueprint.py`)

| Constant | Default | Effect |
|----------|---------|--------|
| `N_GRID` | 24 | Grid resolution per cap; total faces = 4 × N² |
| `R_EXACT` | 1.0 | Sphere radius relative to edge length (Basis) |
| `R_PUFFED` | 1.4 | Sphere radius for Puffed shape key |
| `POI_DIAM` | 0.10 | Normalised poi head diameter (metres) |

## Licence

Code and geometry: **CC0 1.0 Universal**. Derived from the mathematical
description of the Reuleaux tetrahedron (Reuleaux 1875, public domain).
