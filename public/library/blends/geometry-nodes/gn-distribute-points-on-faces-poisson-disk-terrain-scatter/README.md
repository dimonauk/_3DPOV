# GN Distribute Points on Faces — Poisson-Disk Terrain Scatter
**Blender 5.1 · Geometry Nodes · CC0**

Scatter two faceted rock variants across a procedural terrain using the
**Poisson-Disk** distribution mode, a slope filter, per-point random rotation
and scale, with a single-mesh GLB output suitable for WebXR environments.

---

## What this produces

| Artefact | Path |
|---|---|
| Blend file | `public/library/blends/geometry-nodes/gn-distribute-points-on-faces-poisson-disk-terrain-scatter/` |
| GLB (Draco L6) | `public/library/glbs/geometry-nodes/gn-distribute-points-on-faces-poisson-disk-terrain-scatter/terrain_scatter.glb` |
| Viewport render | `public/library/videos/…/viewport.mp4` |
| Screen recording | `public/library/videos/…/screen.mp4` |

---

## Run order

```sh
blender -b --python blueprint.py   # creates scene, applies modifier, exports GLB
blender -b terrain_scatter.blend --python record.py   # renders viewport.mp4
```

## Why Poisson Disk, not Random?

**Random** mode draws each point independently — two points can be arbitrarily
close, which produces visible clumping (low-frequency gaps beside clusters).

**Poisson Disk** enforces `Distance Min` between every pair of points using
Bridson's dart-throwing algorithm.  The result matches biological scatter
patterns — boulder fields, forest floors, coral heads — because natural
processes similarly enforce an exclusion radius around each specimen.

At equal density budgets, Poisson Disk achieves the same perceived coverage
with roughly 30 % fewer instances, which matters for WebXR polygon budgets.

## Slope filter

The `Selection` socket accepts a Boolean evaluated per face.  Here:
`Normal.z > 0.25` passes only faces within ~76 ° of horizontal.
Steeper cliff faces receive no rocks, which is physically correct and avoids
z-fighting on near-vertical geometry.

## Key parameters (modify at the top of blueprint.py)

| Constant | Default | Effect |
|---|---|---|
| `POISSON_MIN_D` | 0.45 m | Minimum rock separation |
| `DENSITY_MAX` | 8.0 | Peak rocks per m² |
| `SLOPE_MIN` | 0.25 | Cliff cutoff (Normal.z) |
| `SCATTER_SEED` | 42 | Reproducible distribution |
| `SCALE_MIN / MAX` | 0.5 / 2.2 | Rock size range |

## Studio context

- Terrain + scatter exported as a single GLB → drop into `/atelier` WebXR scenes.
- Draco Level 6 compression keeps the file under 2 MB for the default density.
- For denser scatter (>20 points/m²) apply a Decimate modifier to the GLB before
  WebXR load — see the Decimate LOD tutorial for the workflow.

## Licence

All blueprint code: **CC0 1.0 Universal**.
