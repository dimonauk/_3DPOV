# GN Simulation Zone — Boid Flocking: Cohesion + Separation + Alignment

**Blender 5.1 · CC0 · Holoflow Studio**

Craig Reynolds' three steering rules (Separation, Alignment, Cohesion)
implemented entirely within a Geometry Nodes Simulation Zone.  Per-boid
velocity lives as a `FLOAT_VECTOR` named attribute on a Points cloud so the
single implicit Geometry state item carries both position and momentum across
frames without any extra scalar state items.

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Headless Blender script — builds scene, GN tree, saves `.blend` + `.glb` |
| `record.py` | Renders 120-frame EEVEE animation → `viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for `screen.mp4` |
| `.expected-artefacts.json` | CI manifest |
| `boid_flock.blend` | Generated `.blend` (run blueprint.py to produce) |
| `../../glbs/geometry-nodes/gn-simulation-zone-boid-flock/boid_flock.glb` | GLB snapshot at frame 60 |

## Running

```bash
blender --background --python blueprint.py
```

For the viewport recording:
```bash
blender boid_flock.blend --background --python record.py
```

## Key nodes

| Node | Role |
|------|------|
| `GeometryNodeSimulationInput/Output` | Temporal feedback loop; carries geometry+vel across frames |
| `GeometryNodeIndexOfNearest` | Finds nearest other boid index for Separation + Alignment |
| `GeometryNodeSampleIndex` | Reads position / velocity of nearest neighbour at that index |
| `GeometryNodeAttributeStatistic` | Computes global centroid (Mean of Position) for Cohesion |
| `GeometryNodeStoreNamedAttribute` | Writes updated velocity back to geometry each frame |
| `GeometryNodeSetPosition` | Euler-integrates position from velocity |
| `FunctionNodeAlignEulerToVector` | Orients cone instance to face travel direction |

## Tuning

| Parameter | Default | Effect |
|-----------|---------|--------|
| `SEP_WEIGHT` | `0.06` | Higher → tighter personal space, more erratic |
| `ALIGN_WEIGHT` | `0.08` | Higher → more synchronized swimming behaviour |
| `COH_WEIGHT` | `0.005` | Higher → flock collapses to a point faster |
| `MAX_SPEED` | `0.12` | m/frame; increase to taste but watch tunnel artefacts |
| `BOID_COUNT` | `64` | ≥ 32 for the nearest-neighbour approximation to hold |

## Tutorial

`/tutorials/blender-tutorial-gn-simulation-zone-boid-flock`

## Licence

All original code: **CC0 1.0 Universal**.  
Algorithm description from Craig Reynolds (SIGGRAPH 1987, ACM) — no code reproduced.  
Blender Manual excerpts: CC-BY-SA 4.0, Blender Documentation Team.
