# GN Distribute Points on Faces — Procedural Ground Cover Scatter

**Blender 5.1 · Geometry Nodes · CC0**

Builds a procedural ground-cover scatter field using two core GN nodes:
`Distribute Points on Faces` (Poisson-disk mode) for spatially-even point
placement, and `Instance on Points` (Pick Instance = True) for multi-asset
scatter from a Collection.  Density is vertex-group driven so weight-painting
in the viewport directly controls where cover is thick or sparse.

## What you get

| File | Description |
|------|-------------|
| `ground_cover_scatter.blend` | Scene with GN tree, grass blade + pebble instances, vertex-group mask |
| `ground_cover_scatter.glb`   | Draco-compressed GLB, Realize Instances baked, WebXR-ready |
| `blueprint.py`              | Reproducible build script (bpy + bmesh) |
| `record.py`                 | Viewport animation → `viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for `screen.mp4` |

## Running the blueprint

```bash
blender --background --python blueprint.py
# → writes ground_cover_scatter.blend + .glb in this directory
```

Then open the `.blend` in Blender 5.1 and run `record.py` from the Scripting
workspace to generate `viewport.mp4`.

## Key parameters (top of `blueprint.py`)

| Constant | Default | Effect |
|----------|---------|--------|
| `GROUND_SIZE` | 4.0 m | World-space plane size |
| `GROUND_SUBDIV` | 4 | Subdivision level (controls density resolution) |
| `POISSON_DIST_MIN` | 0.08 m | Minimum spacing between scatter points |
| `SCATTER_DENSITY` | 12.0 pts/m² | Points per square metre at weight = 1.0 |
| `SCALE_MIN` / `SCALE_MAX` | 0.55 / 1.25 | Random scale range for instances |

## Node graph overview

```
[Group Input: Geometry]
        │
        ├──► [Named Attribute "scatter_weight"] ──► Density field
        │                                              │
        └──► [Distribute Points on Faces] ◄───────────┘
               Poisson Disk · Distance Min 0.08m
               │
               ├── Points ──► [Instance on Points]
               │               │  Pick Instance: True
               └── Normal ──► [Align Euler to Vector] ──► Rotation
                               + [Random Yaw] ──► Rotation
               [Collection Info: ScatterPieces] ──► Instance
               [Random Value (INT)] ──► Instance Index
                                      │
                              [Scale Instances]
                               [Random Value (FLOAT)]
                                      │
                              [Realize Instances]
                                      │
                              [Join Geometry] ◄── original ground
                                      │
                              [Group Output]
```

## Technique notes

**Why Poisson Disk over Random?**  Random placement is a homogeneous Poisson
process — successive points can land arbitrarily close together.  In practice
this creates micro-clusters that look planted.  Poisson-disk enforces a minimum
separation (`distance_min`) using Mitchell's best-candidate algorithm, giving
the relaxed spacing of real vegetation.

**Why a Collection for instances?**  `Collection Info` with `Separate Children
= True` exposes each child object as a separate entry in the instance list.
`Pick Instance = True` on `Instance on Points` then independently selects one
entry per point using the integer field.  This is O(1) per point regardless of
collection size — far cheaper than chaining multiple Instance nodes.

**Vertex group as density field:**  Vertex groups store float weights [0, 1]
per vertex.  `Named Attribute` reads these as a float field, which
`Distribute Points on Faces` samples via barycentric interpolation across each
face.  The effective density per face is the weighted average of its corner
weights multiplied by `Density Max`.

**Realize Instances before GLB export:**  GLB writers expect a flat vertex
buffer.  Without realisation, some exporters write `EXT_mesh_gpu_instancing`
instead of standard mesh data — which Three.js / WebXR runtimes may not
support.  `Realize Instances` collapses the instance list into geometry before
`export_apply=True` bakes the modifier.

## Licence

Blueprint, record script, and all authored assets: **CC0 1.0 Universal**.
