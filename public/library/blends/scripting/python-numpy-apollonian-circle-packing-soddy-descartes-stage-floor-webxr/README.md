# Apollonian Circle Packing — Descartes' Circle Theorem & Soddy Gasket

**Blender 5.1 | Python scripting | CC0 | Holoflow Studio**

## What this is

A fractal stage-floor bas-relief generated from the Apollonian circle packing —
the unique arrangement of circles where every gap between three mutually tangent
circles is filled by a fourth circle tangent to all three, recursively, forever.

The canonical gasket seeds from four mutually tangent circles with integer
curvatures (−1, 2, 2, 3). Remarkably, every subsequent circle also has an
integer curvature — a fact proved rigorously by Sarnak (2007).

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Blender Python — Apollonian engine + mesh builder + GLB export |
| `record.py` | Viewport animation — top-down orbit → tilt reveal, EEVEE Next |
| `SCREEN-RECORDING-NOTES.md` | OBS capture instructions for `screen.mp4` |
| `README.md` | This file |
| `.expected-artefacts.json` | CI manifest |

## Expected outputs

- `hf_apollonian_floor.glb` — Draco-6 WebXR GLB, ~700–1 400 bas-relief cylinders
- `public/library/videos/scripting/.../viewport.mp4` — 150-frame EEVEE render
- `public/library/videos/scripting/.../screen.mp4` — OBS screen recording

## Key mathematics

```
k4 = k1+k2+k3 ± 2√(k1·k2 + k2·k3 + k3·k1)   [Descartes 1643]
```

The BFS recursion uses the mirror formula (no ±):
```
k_new  = 2(k2+k3+k4) - k1
kz_new = 2(kz2+kz3+kz4) - kz1    where kz = k·centre
```

Fractal dimension of the residual set: ≈ 1.3057... (Boyd 1973).

## Parameters

Edit these constants at the top of `blueprint.py`:

| Constant | Default | Effect |
|----------|---------|--------|
| `K_MAX` | 180 | Stop at curvature ≥ K_MAX; higher = finer detail, slower |
| `WORLD_SCALE` | 4.0 m | Radius of the outer enclosing circle in Blender metres |
| `SEG` | 8 | Polygon sides per cylinder — 8 = octagonal faceted look |
| `EXTRUDE_MAX` | 0.12 m | Tallest bas-relief pillar (smallest circles) |
| `EXTRUDE_MIN` | 0.005 m | Shallowest plateau (largest inner circles) |

## Blender version notes

- Tested on Blender 5.1 (Python 3.12). No external packages needed.
- EEVEE Next bloom: `bpy.context.scene.eevee.use_bloom = True` works in 5.1;
  in 4.x this was `use_bloom` under the same path.
- GLB Draco export: `export_draco_mesh_compression_enable=True` — confirmed
  in Blender 4.2+ with the built-in glTF exporter.

## Licence

Blueprint CC0 — use freely. Cite Descartes (1643) and Soddy (1936) when
publishing derivative works that explain the algorithm.

## Cross-references

- Tutorial page: `/tutorials/blender-tutorial-python-numpy-apollonian-circle-packing-soddy-descartes-stage-floor-webxr`
- Related studio entries: Penrose P3 quasicrystal floor, Mandelbrot/Julia fractal, Gyroid isosurface
