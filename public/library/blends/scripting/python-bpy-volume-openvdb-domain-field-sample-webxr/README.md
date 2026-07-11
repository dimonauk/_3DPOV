# Python pyopenvdb + bpy.types.Volume — VDB Density Field & WebXR Particle Cloud

**Blender 5.1 · CC0 · Holoflow Studio**

## What this does

1. Generates two overlapping Gaussian density blobs with `pyopenvdb.FloatGrid`.
2. Writes to `/tmp/holoflow_density.vdb`; loads it as a `bpy.types.Volume` object.
3. Configures EEVEE Next Principled Volume material (density attribute binding).
4. Re-reads the VDB; samples active voxels above threshold on a stride grid.
5. Instances low-poly icospheres at each sample (scale + colour ∝ density).
6. Joins and exports `density_cloud.glb` (Draco-6, WebP) + `vdb_meta.json`.

## Run

```python
# Blender 5.1 Scripting workspace — Text Editor:
exec(open("blueprint.py").read())
```

## Artefacts

| File | Description |
|------|-------------|
| `density_cloud.glb` | WebXR point cloud (Draco-6, WebP), ~1 800 icosphere instances joined |
| `vdb_meta.json` | voxel_size, point_count, density_range, TSL/GLSL colour decode snippet |
| `blueprint.py` | Full five-step pipeline |
| `record.py` | 90-frame orbit render → viewport.mp4 (run after blueprint.py) |

## Outside references

- [OpenVDB — Academy Software Foundation (Apache-2.0)](https://www.openvdb.org/)
  Sibling: [pyopenvdb](https://github.com/AcademySoftwareFoundation/openvdb/tree/master/openvdb/openvdb/python),
  [NanoVDB](https://github.com/AcademySoftwareFoundation/openvdb)
- [Blender Manual — Volumes (CC-BY-SA 4.0)](https://docs.blender.org/manual/en/latest/modeling/volumes/)
  Sibling: [projects.blender.org/blender/blender](https://projects.blender.org/blender/blender)
