# GN Repeat Zone — Iterative L-System Crystal Antenna

**Topic:** Geometry Nodes · Repeat Zone  
**Blender version:** 5.1 (Repeat Zone introduced in 4.0)  
**Licence:** CC0  
**Category:** geometry-nodes  
**Slug:** `gn-repeat-zone-crystal-antenna-webxr`

## What this builds

A 3-way symmetric fractal crystal antenna built entirely inside a Geometry
Nodes Repeat Zone.  Each iteration expands a tip-point cloud into three child
branches (tube segments swept from `CurveLine + CurveToMesh`), accumulates
all generated geometry, and hands the child tips to the next iteration.  At 5
iterations the structure holds 363 hex-tube segments (~5 k vertices) — well
within WebXR draw budget.

Exports as `crystal_antenna.glb` (Draco 6, +Y up, metallic blue material).

## Key concepts

- **Repeat Zone** — runs its body N times per depsgraph evaluation (not per
  frame, unlike the Simulation Zone).  The `Iterations` input is a live
  modifier parameter; scrubbing it rebuilds the whole tree without playback.
- **Items** — user-defined sockets that thread values between iterations.
  Here: `Accum` (geometry accumulator), `Tips` (branch-endpoint point cloud),
  `Scale` (tapering float).
- **CurveLine + CurveToMesh** — encodes both branch direction and length in
  local geometry so `InstanceOnPoints` requires no rotation argument.
- **SHRINK_RATIO** — multiplied into `Scale` each iteration; gives the
  characteristic taper of natural branching structures.

## Files

| File | Purpose |
|---|---|
| `blueprint.py` | Full Python / GN build script; run headlessly in Blender |
| `record.py` | Viewport animation: iterations 1→5, camera orbit 180° |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for `screen.mp4` |
| `.expected-artefacts.json` | Artefact manifest and cross-references |

## Running

```bash
blender --background --python blueprint.py
# then record:
blender --background crystal_antenna.blend --python record.py
```

## Expected output stats

| Metric | Value |
|---|---|
| Tube segments | 363 (sum 3+9+27+81+243) |
| Approximate vertex count | ~5 100 (14 verts/tube after weld) |
| GLB file size | ~80–120 KB (Draco 6) |
| Tip count at depth 5 | 243 (3⁵) |

## Tuning

- **ITERATIONS = 6** → 1 092 segments, ~15 k verts — still acceptable for WebXR
- **ITERATIONS = 7** → 3 279 segments — avoid unless targeting desktop only
- **BRANCH_ANGLE_DEG = 25** → tighter, more columnar crystal
- **BRANCH_ANGLE_DEG = 55** → wide, coral-like canopy
- **SHRINK_RATIO = 0.75** → slower taper, more even branch thickness
