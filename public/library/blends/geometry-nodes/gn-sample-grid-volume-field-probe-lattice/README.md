# GN Sample Grid — Volume Field Probe: Lattice Sensor Constellation

**Blender 5.1 · Geometry Nodes · CC0 · Holoflow Studio**

## What this does

`GeometryNodeSampleGrid` reads a named scalar (or vector) grid from a Volume
geometry at an arbitrary 3-D position and returns the interpolated value.  It is
the inverse of **Volume Cube**: where Volume Cube *writes* a field into a voxel
grid during GN evaluation, Sample Grid *reads* that grid back at query
positions you supply.

This blueprint creates two objects:

| Object | Role |
|--------|------|
| `SG_Volume` | GN modifier outputs a noise-density Volume Cube (fog volume, grid name `"density"`) |
| `SG_Probe`  | GN modifier distributes a regular 3-D sensor lattice, samples `"density"` at each point via Sample Grid, colours + scales surviving sensors by density, and exports as a GLB point constellation |

The visual result is a blue-cyan-white sphere cluster revealing the internal
structure of the noise cloud — densest voxels become large white spheres, sparse
regions are deleted, leaving empty space between the luminous clusters.

## Expert note: coordinate spaces

`SampleGrid.Position` is evaluated in the **volume object's local space**.
The probe object's `Position` node yields positions in the **probe object's local
space**.  Both objects sit at world origin with no scale or rotation, so the
spaces coincide.  If you move either object, multiply the probe position by
`inv(vol_world_matrix) @ probe_world_matrix` before feeding it to Sample Grid.

## Grid name

Volume Cube always names its output grid `"density"`.  Imported VDB files
(e.g. smoke caches from Houdini or Embergen) use names like `"density"`,
`"temperature"`, `"velocity"`, and `"flame"` — adjust `Grid Name` to match.
Run `bpy.data.objects["SG_Volume"].evaluated_get(depsgraph).data.grids.keys()`
in the Blender Python console to list available grids on any volume object.

## Files

| File | Description |
|------|-------------|
| `blueprint.py` | Full bpy scene construction: volume + probe GN trees, material, GLB export |
| `record.py`    | 150-frame EEVEE orbit render → `videos/…/viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for the screen.mp4 tutorial capture |
| `.expected-artefacts.json`  | Artefact manifest with cross-reference links |

## Outside sources

- **Blender Manual — Sample Grid** (CC-BY-SA 4.0, Blender Foundation)
  <https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/volume/sample_grid.html>
- **AcademySoftwareFoundation/openvdb** (Apache-2.0, ASWF / DreamWorks)
  <https://github.com/AcademySoftwareFoundation/openvdb>
  Sibling: `openvdb/nanovdb` (real-time GPU-native VDB)
- **njanakiev/blender-scripting** (MIT, Nicolas Janakiev)
  <https://github.com/njanakiev/blender-scripting>
