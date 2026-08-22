# bmesh.ops.smooth_vert + smooth_laplacian_vert — Zone-Selective Vertex Smoothing

**Blender 5.1 · Scripting · VRM / WebXR**

Demonstrates the two pure-bmesh vertex smoothing operations and when to
choose each: `smooth_vert` (uniform Laplacian, iterative centroid relaxation)
versus `smooth_laplacian_vert` (cotangent-weighted Laplacian, volume-aware).

## Studio prop

`hf_smooth_pauldron.glb` — Sci-Fi VRM shoulder pauldron with three distinct
smoothing zones built entirely in Python, no interactive Edit Mode.

## What the blueprint builds

| Zone | Z range | Operation | Effect |
|------|---------|-----------|--------|
| Hard collar | Z ≤ 0.16 m | none | Sharp faceted ring |
| Blend zone | 0.16 – 0.35 m | `smooth_vert` × 5, factor=0.5 | Relax wave-bumped surface |
| Dome cap | Z > 0.35 m | `smooth_laplacian_vert` × 3 | Volume-preserving organic curve |

## Key technique

```python
# Uniform Laplacian — each vertex moves toward centroid of neighbours
for _ in range(SV_ITERATIONS):
    bmesh.ops.smooth_vert(
        bm,
        verts=blend_verts,
        factor=0.5,
        mirror_clip_x=False, mirror_clip_y=False, mirror_clip_z=False,
        clip_dist=1e-5,
        use_axis_x=True, use_axis_y=True, use_axis_z=True,
    )

# Cotangent Laplacian — weights by opposite triangle angles + volume correction
for _ in range(SLV_ITERATIONS):
    bmesh.ops.smooth_laplacian_vert(
        bm,
        verts=dome_verts,
        lambda_factor=0.5,
        lambda_border=0.2,
        use_x=True, use_y=True, use_z=True,
        preserve_volume=True,
    )
```

Both operations mutate the BMesh in-place and return `None`.
Call `bm.normal_update()` after each group of passes to keep normals consistent.

## Running the blueprint

```bash
blender --background --python blueprint.py
# Writes: hf_smooth_pauldron.blend + hf_smooth_pauldron.glb
```

## Recording the screen capture

See `SCREEN-RECORDING-NOTES.md` for OBS setup.

## Artefacts

| File | Notes |
|------|-------|
| `hf_smooth_pauldron.blend` | Source file |
| `hf_smooth_pauldron.glb` | Draco L6 · WebP · +Y-up |
| `blueprint.py` | Production script |
| `record.py` | Viewport render script |
| `viewport.mp4` | 8 s 360° turntable (run record.py) |
| `screen.mp4` | OBS screen capture |

## Outside sources

- Blender Foundation — [bmesh.ops API Reference](https://docs.blender.org/api/5.1/bmesh.ops.html) — CC-BY-SA-4.0
- Khronos Group — [glTF-Blender-IO](https://github.com/KhronosGroup/glTF-Blender-IO) — Apache-2.0
