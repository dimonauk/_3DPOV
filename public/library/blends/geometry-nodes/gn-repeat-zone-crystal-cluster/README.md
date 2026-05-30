# GN Repeat Zone — Crystal Cluster

**Blender 5.1 | CC0 | Holoflow Studio**
**Library path:** `public/library/blends/geometry-nodes/gn-repeat-zone-crystal-cluster/`

## What this is

A Geometry Nodes Repeat Zone that runs once per crystal (default 12 iterations).
Each iteration places one faceted cone shard at its Fermat-spiral position, accumulates
it into the body-channel geometry, and passes the pile to the next iteration.

The result: a twelve-shard crystal cluster arranged in a sunflower-seed pattern —
the densest, most uniform packing achievable with a single angular parameter.

## Files

| File | Role |
|---|---|
| `blueprint.py` | Headless build script — creates .blend + .glb |
| `record.py` | Viewport animation render (Crystal Count 1→12 over 60 frames) |
| `SCREEN-RECORDING-NOTES.md` | OBS shot list for screen.mp4 |
| `crystal_cluster.blend` | Live .blend with GN modifier sliders |
| `crystal_cluster.glb` | Draco-compressed GLB for WebXR delivery |

## Run

```bash
# Build blend + GLB
blender --background --python blueprint.py

# Render viewport.mp4 (requires crystal_cluster.blend from step above)
blender --background crystal_cluster.blend --python record.py
```

## GN modifier sliders

| Slider | Default | Effect |
|---|---|---|
| Crystal Count | 12 | Iterations — adds/removes shards in Fermat-spiral order |
| Spiral Radius | 0.8 m | Maximum XY extent of the cluster |
| Base Scale | 0.18 m | Radius of the centre (largest) shard |
| Tip Scale | 0.06 m | Radius of the outermost (smallest) shard |
| Cone Vertices | 8 | Cross-section polygon count per shard |
| Base Height | 2.5 × | Height multiplier; actual depth = Base Height × scale |

## Key technique notes

- **Repeat Zone body channel** — single `Geometry` channel accumulates shards
  iteration by iteration. Nothing else is carried between iterations; position and
  scale are computed fresh each time from the loop index.
- **Fermat spiral** — `radius = √t × R`, `angle = i × 2.39996 rad`. The golden
  angle (~137.5°) is the most irrational angle: no integer number of steps ever
  returns to the start direction, so every shard occupies a unique angular slot.
- **Flat shading** — `SetShadeSmooth = False` on all faces. Hard face normals
  give each cone facet a distinct luminance response, which reads as individual
  crystal planes under directional light.
- **GLB export** — `export_apply=True` is mandatory. Without it the exporter
  reads the empty base mesh before GN evaluation.

## Licence

CC0 — place in the public domain. No attribution required.

## Tutorial

`/tutorials/blender-tutorial-gn-repeat-zone-crystal-cluster`
