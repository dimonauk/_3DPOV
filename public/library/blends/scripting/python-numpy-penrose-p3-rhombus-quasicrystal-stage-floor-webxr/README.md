# Penrose P3 Rhombus Tiling — Stage Floor GLB

**Blender 5.1 · Python numpy · CC0**

Generates a Penrose P3 rhombus tiling entirely from Python using Robinson-triangle
substitution (deflation), then builds a 3D mesh of extruded rhombus tiles and
exports a WebXR-ready GLB suitable for use as a stage floor in an XR performance
environment.

## Artefacts

| File | Description |
|------|-------------|
| `blueprint.py` | Full generation script — run in Blender 5.1 Text Editor |
| `record.py` | Camera orbit animation for viewport.mp4 |
| `hf_penrose_floor.blend` | Generated .blend (run blueprint.py to produce) |
| `hf_penrose_floor.glb` | WebXR export, Draco-compressed |
| `SCREEN-RECORDING-NOTES.md` | OBS/Game Bar instructions for screen.mp4 |

## Quick start

```bash
blender --background --python blueprint.py
```

Generates `hf_penrose_floor.blend` and `hf_penrose_floor.glb` in the same directory.
Adjust `DEFLATIONS` (default 4) for more tiles.  Each extra level multiplies tile
count by approximately 2.6 and generation time by the same factor.

## Parameters

| Constant | Default | Effect |
|----------|---------|--------|
| `DEFLATIONS` | `4` | Substitution depth; 4 ≈ 400 rhombi, 5 ≈ 1 000 |
| `SCALE` | `2.0 m` | Initial sun radius; tile edge ≈ SCALE / PHI^N |
| `TILE_THICK` | `0.012 m` | Extrusion height (12 mm) |
| `FAT_COLOUR` | warm gold | RGBA for 72° fat rhombus material |
| `THIN_COLOUR` | cool slate | RGBA for 36° thin rhombus material |

## Mathematics in brief

The Penrose P3 tiling uses two rhombus shapes — fat (acute angle 72°) and thin
(acute angle 36°).  Both are "golden rhombi": their diagonal ratio is the golden
ratio φ = (1 + √5) / 2 ≈ 1.618.

**Substitution / deflation**: every fat rhombus splits into one fat + two thin
rhombi; every thin rhombus splits into one fat + one thin.  The number of each
type grows as consecutive Fibonacci numbers, and their ratio converges to φ.

**Global symmetry**: the tiling has no translational symmetry (it is aperiodic) but
has 5-fold rotational quasi-symmetry — the 10-fold "sun" seed at the centre and
the nested shells of tiles all reflect the icosahedral point group.

## Outside sources

- **fogleman/Penrose** — MIT licence — Michael Fogleman
  <https://github.com/fogleman/Penrose>
- **numpy** — BSD-3-Clause — NumPy Developers
  <https://numpy.org/>

## Studio connections

- Tutorial: `/tutorials/blender-tutorial-python-numpy-penrose-p3-rhombus-quasicrystal-stage-floor-webxr`
- Codex: `/codex/webxr-environment` (stage floor usage)
- Related: `public/library/blends/scripting/python-mathutils-geometry-delaunay-2d-cdt-convex-hull-stage-floor-webxr/`
