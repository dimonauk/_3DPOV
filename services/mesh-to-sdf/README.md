# services/mesh-to-sdf — Mesh → 3D SDF binary

Small Python utility. Loads a mesh (GLB/OBJ/STL), voxelises it, runs
the SciPy Euclidean distance transform in both directions, signs the
result, and writes a single Float32 binary the browser uploads as a
`THREE.Data3DTexture`. The bridge between any volumetric representation
and a fragment shader that wants to ray-march through it.

## Why this exists

The studio's waveguide / SDF-ray-march shaders need a signed distance
field as input. The codex entry at `/codex/signed-distance-fields`
explains the math; this is the CPU-Python tool that produces the
`.sdf.bin` files those shaders sample.

## What's here

- `build_sdf.py` — single-file CLI. Type-hinted, stdlib + trimesh +
  SciPy + numpy.

## Output format

```
[4 bytes] magic 'SDF1'
[4 bytes] uint32  resolution_x
[4 bytes] uint32  resolution_y
[4 bytes] uint32  resolution_z
[12 bytes] float32 bounds_min[3]   (mm)
[12 bytes] float32 bounds_max[3]   (mm)
[rest]     float32 sdf[res_z][res_y][res_x] in C order, signed mm
```

Inside = negative, outside = positive.

## Bench-local dev

```pwsh
cd services/mesh-to-sdf
pip install numpy trimesh scipy
python build_sdf.py --input my.glb --output my.sdf.bin --resolution 128 --pad-mm 5
```

## Vercel-side surface

No Vercel-side capability talks to this yet (the SDF shaders that
consume the output are client-side; the .bin files are pre-built
once per sculpture). A future capability could wrap this as a
Vercel Function for visitor-uploaded meshes if the workload stays
CPU-only and under 300s — 128³ at most for a wearable-scale piece.
