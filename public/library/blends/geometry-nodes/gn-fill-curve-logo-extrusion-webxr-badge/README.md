# GN Fill Curve + Set Spline Type — Hexagonal WebXR Badge

**Blender 5.1 · CC0 · Holoflow Studio**

Demonstrates the `Fill Curve` → `Extrude Mesh` pipeline for converting 2-D closed
splines into solid badge geometry, with `Set Spline Type` as the critical
pre-conversion node.

## What this builds

A faceted hexagonal medallion with:
- Gold emission front face (mat index 1, visible in WebXR)
- Metallic dark-gold side walls (mat index 0, 6 flat-shaded quads)
- Depth: 0.20 m (20 cm at real-world scale, ~2 cm at typical WebXR badge size with
  a 0.1 scene-unit-to-metre factor)
- `holoflow:facet` attribute stored for Holoflow WebXR exporter pipeline

## Quick start

```bash
blender --background --python blueprint.py
```

The GLB exports to `output/hex_badge.glb` (relative to the blend file location).

## Key teaching points

| Node | Role |
|------|------|
| `Set Spline Type (POLY)` | Converts 6-point bezier → 6-point polygon **before** fill |
| `Fill Curve (TRIANGLES)` | Triangulated face mesh from the closed spline boundary |
| `Extrude Mesh (FACES)` | Adds depth; exposes `Top` and `Side` bool fields |
| `Boolean Math (NOT + AND)` | Selects the original front face for gold emission material |
| `Smooth by Angle (30°)` | Hard-shades the 60° corners between side walls |

## Artefacts

| File | Produced by |
|------|-------------|
| `output/hex_badge.glb` | `blueprint.py` |
| `public/library/videos/…/viewport.mp4` | `record.py` |
| `public/library/videos/…/screen.mp4` | OBS screen recording |

## Experiment

Change `SPLINE_MODE` in `blueprint.py` to `'BEZIER'` and re-run. The badge becomes
a near-circle (72 outline vertices at resolution 12) instead of a hexagon — this is
the visual proof that `Set Spline Type` is doing meaningful work.

Change `FILL_MODE` to `'NGONS'` to see the single n-gon face instead of the
triangulated version. Useful when chaining into further GN operations (e.g.
`Subdivide Mesh` on an ngon produces better distribution than on triangles), but
the GLB exporter must triangulate it at export time.

## Outside sources

- **Blender Manual — Fill Curve Node** (CC-BY-SA 4.0, Blender Documentation Team)
  https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/curve/operations/fill_curve.html
- **Blender Manual — Set Spline Type Node** (CC-BY-SA 4.0, Blender Documentation Team)
  https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/curve/write/set_spline_type.html
- **KhronosGroup/glTF-Blender-IO** (Apache-2.0, Khronos Group)
  https://github.com/KhronosGroup/glTF-Blender-IO
