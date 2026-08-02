# Quaternion Julia Set: 4D ℍ Orbit Dynamics, z-Hyperplane Section Sweep & Height-Field Shape Keys

**Blender 5.1 · Python numpy · WebXR GLB**

## What this builds

A `192 × 96` height-field mesh whose Z coordinate encodes the smooth-iteration
value of the quaternion Julia set for c = −0.2 + 0.6i.  Five shape keys sweep
the j-axis slice parameter t ∈ {0, 0.30, 0.55, 0.75, 0.92}, animating the
cross-sectional structure from the classic connected 2D Julia set (t=0) through
progressive fragmentation to near-empty dust (t=0.92).

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Builds mesh, shape keys, vertex colours, exports GLB |
| `record.py` | Renders `viewport.mp4` via EEVEE Next animation |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for `screen.mp4` |
| `hf_qjulia.blend` | Saved scene (after running blueprint.py) |
| `hf_qjulia.glb` | Draco-compressed GLB with morph targets and COLOR_0 |

## Quick start

1. Open a new `.blend`, save it inside this directory (required for `bpy.path.abspath("//")` to resolve).
2. Scripting workspace → Open → `blueprint.py` → Run Script.
3. Expect ~20–40 s on a modern CPU (192×96×24 iterations × 5 slices).
4. `hf_qjulia.glb` appears in the same directory.

## Parameters to vary

| Constant | Effect |
|----------|--------|
| `C` | Change the fixed quaternion parameter; try `(-0.7, 0.27, 0.0, 0.0)` for a spiral |
| `Z_SLICES` | More or fewer shape keys; add `0.10, 0.20, …` for a finer sweep |
| `RES_X, RES_Y` | Higher resolution → longer compute; 256×128 takes ~2 min |
| `MAX_ITER` | More iterations → sharper boundary, slower |
| `HEIGHT_SCALE` | Vertical exaggeration of the height field |

## Mathematics

The quaternion z = a + bi + cj + dk satisfies:

```
z² = (a²−b²−c²−d²) + 2ab·i + 2ac·j + 2ad·k
```

Restricting to d=0 and c_k=0 in the fixed parameter c gives an **invariant
subspace**: the k-component of z²+c is 2ad=0, so no starting point on the
Π_t hyperplane ever leaves it.  The cross-section is an exact 3D slice, not a
projection.

Smooth colouring: μ = n + 1 − log₂(log₂|z_n|) removes integer banding.

## Licence

CC0 — public domain dedication.
