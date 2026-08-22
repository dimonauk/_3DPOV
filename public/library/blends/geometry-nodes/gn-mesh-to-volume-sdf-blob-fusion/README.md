# GN Mesh to Volume → Volume to Mesh: Organic SDF Blob Fusion

**Blender 5.1 — Geometry Nodes**  
**Topic**: geometry-nodes  
**Licence**: CC0  
**Studio tutorial**: `/tutorials/blender-tutorial-gn-mesh-to-volume-sdf-blob-fusion`

---

## What this does

Scatter UV sphere instances over an icosphere surface, realise them into one
combined mesh, voxelise the combined mesh into an OpenVDB signed-distance-field
(SDF) grid via the **Mesh to Volume** node, then extract a new mesh via **Volume
to Mesh** at a tunable threshold. When the threshold is positive the isosurface
inflates outward; neighbouring spheres within `2 × threshold` metres of each
other grow together into a smooth organic blob — no Boolean modifier, no
metaball stiffness curves.

## Files

| File | Purpose |
|---|---|
| `blueprint.py` | Full headless Blender script — builds the scene, GN tree, material, camera, exports GLB |
| `record.py` | Headless animation render — camera orbit + threshold animation → `viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for the screen-capture tutorial video |
| `blob_fusion.blend` | Saved by `blueprint.py` at runtime |
| `blob_fusion.glb` | Draco-compressed GLB, written by `blueprint.py` |

## Usage

```bash
# Build scene + GLB (first time)
blender --background --python public/library/blends/geometry-nodes/gn-mesh-to-volume-sdf-blob-fusion/blueprint.py

# Render viewport animation
blender --background blob_fusion.blend --python public/library/blends/geometry-nodes/gn-mesh-to-volume-sdf-blob-fusion/record.py
```

## Key parameters

| Constant | Default | Effect |
|---|---|---|
| `VOXEL_SIZE` | 0.035 m | Grid resolution — smaller = smoother, slower |
| `EXTERIOR_BAND` | 0.18 m | How far outside the mesh SDF extends |
| `INTERIOR_BAND` | 0.18 m | How far inside the mesh SDF extends |
| `THRESHOLD` | 0.09 m | Isosurface level — controls blob fusion radius |
| `SPHERE_RADIUS` | 0.32 m | Individual sphere instance size |
| `POINT_COUNT` | 28 | Number of scattered spheres |

## Outside sources

- **Blender Manual: Mesh to Volume** — CC BY-SA 4.0, Blender Foundation  
  https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/mesh/operations/mesh_to_volume.html

- **OpenVDB** — Apache-2.0, Academy Software Foundation  
  https://github.com/AcademySoftwareFoundation/openvdb  
  Blender uses OpenVDB as its internal volume storage format; the VDB grid
  produced by Mesh to Volume is a narrow-band SDF grid in this format.
