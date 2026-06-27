# GN Volume to Mesh — Marching-Cubes Blob Reconstruction

**Topic**: Geometry Nodes → Volume to Mesh  
**Blender**: 5.1 | **Licence**: CC0

Demonstrates the full Mesh → Points → Volume → Mesh reconstruction pipeline in a
single Geometry Nodes modifier stack. Scattered points on a UV sphere are displaced
by a 3D noise texture, then converted to a fog volume (`Points to Volume`), then
reconstructed into a smooth manifold mesh via Marching Cubes (`Volume to Mesh`).

## Key concepts

| Node | Role |
|------|------|
| `Distribute Points on Faces` | Scatter source points on sphere surface |
| `Set Position` (noise offset) | Organically displace scattered points |
| `Points to Volume` | Place Gaussian density spheres; sum into voxel grid |
| `Volume to Mesh` | Marching Cubes: extract iso-surface at given threshold |
| `Set Shade Smooth` | Smooth-shade the reconstructed triangle mesh |

## Parameters

| Constant | Default | Effect |
|----------|---------|--------|
| `POINT_RADIUS` | 0.42 u | Blob radius per point; controls merging distance |
| `VOXEL_AMOUNT` | 72 | Grid resolution; higher = more detail, more memory |
| `ISO_THRESHOLD` | 0.45 | Iso-surface level; lower bridges farther-apart points |
| `ADAPTIVITY` | 0.06 | Post-extraction decimation; 0=full, 1=max-flat-collapse |

## Files

- `blueprint.py` — Full scene builder: GN tree + material + camera
- `record.py` — 120-frame rotating viewport render → `viewport.mp4`
- `SCREEN-RECORDING-NOTES.md` — OBS screen capture instructions
- `.expected-artefacts.json` — Artefact manifest with cross-references

## Tutorial

`/tutorials/blender-tutorial-gn-volume-to-mesh-point-cloud-blob-reconstruction`
