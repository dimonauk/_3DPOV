# GN Simulation Zone — DLA Crystal Dendrite Growth
**Blender 5.1 · Geometry Nodes · CC0**

Diffusion-Limited Aggregation (DLA) is the algorithm behind electrochemical deposition,
snowflake arms, and lightning bolt paths. A single seed point at the origin accumulates
random-walking particles that stick on first contact, building a self-similar fractal
dendrite whose branching geometry is controlled by the ratio STEP_SIZE / AGG_RADIUS.

## What this entry contains

| File | Purpose |
|---|---|
| `blueprint.py` | Full bpy script: builds the GN Simulation Zone tree, crystal material, host mesh, saves `.blend`, exports `.glb` at frame 120 |
| `record.py` | Viewport animation: orbiting camera, EEVEE bloom, renders PNG sequence to `videos/…` |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for the screen-capture tutorial video |
| `.expected-artefacts.json` | Manifest of expected output files |

## Running blueprint.py

Open Blender 5.1. In the Scripting workspace, open `blueprint.py` and run it.
The script creates:
- `dla_crystal.blend` — the full scene with GN Simulation Zone modifier
- `dla_crystal_frame120.glb` — crystal snapshot for WebXR

After running, press **Space** in the 3D Viewport to play. The crystal grows from a
single point, adding ≈ 10–15 new points per frame. By frame 120, you should see
≈ 400–500 aggregated points forming a dendritic fractal.

**If the crystal does not grow:** delete the GN modifier cache by clicking the **X**
on the baked simulation in the modifier panel, then play from frame 1. Never scrub
backwards — the zone reads cached data only.

## Running record.py

Run after blueprint.py (with the `.blend` open). The script bakes the sim forward
through frames 1–150, then renders a 1920×1080 PNG sequence to:
```
public/library/videos/geometry-nodes/gn-simulation-zone-dla-crystal-dendrite/
```
Mux to `viewport.mp4` with FFmpeg:
```
ffmpeg -r 30 -i viewport_%04d.png -c:v libx264 -pix_fmt yuv420p viewport.mp4
```

## Key parameters

| Constant | Default | Effect |
|---|---|---|
| `AGG_RADIUS` | 0.35 m | Sticking distance. Increase → denser packing; decrease → sparser, longer branches |
| `STEP_SIZE` | 0.30 m | Walk step per frame. Must be < AGG_RADIUS × 2 to avoid tunnelling |
| `SPAWN_RADIUS` | 3.50 m | Walkers spawn here. Too small → crystals grow outward only (no interior fill) |
| `CULL_RADIUS` | 7.00 m | Walker graveyard boundary. Controls max spread of the cluster |
| `WALKERS_PER_FRAME` | 12 | Growth rate. Higher → faster but heavier sim evaluation |

## WebXR export notes

The GLB carries `agg_frame` (INT) and `agg_norm` (FLOAT) as custom per-point accessors.
In Three.js, read them via `geometry.attributes.agg_norm` for procedural colouring.
The GLB contains realised icosphere instances — ensure `export_apply=True` was set
(checked in the blueprint `_export_glb()` call).

## Licence

All files in this directory: CC0 / public domain.
