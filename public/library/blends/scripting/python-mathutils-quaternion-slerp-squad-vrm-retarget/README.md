# mathutils.Quaternion — SLERP, Squad & Log-Space Blending for VRM Retarget

**Blender 5.1 | Holoflow Studio | CC0**

Demonstrates three levels of quaternion arithmetic in Blender's Python API:

| Technique | Use case |
|---|---|
| `q1.slerp(q2, t)` | Smooth single-arc interpolation, constant angular velocity |
| Squad | C1 piecewise curve through multiple pose waypoints |
| Log-space weighted average | Blend N VRM blendshape poses with correct geometric mean |

## Files

| File | Purpose |
|---|---|
| `blueprint.py` | Full production script — run in Blender 5.1 text editor |
| `record.py` | Viewport animation render → `viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for `screen.mp4` |
| `.expected-artefacts.json` | CI manifest of expected outputs |

## Expected outputs (in `bpy.app.tempdir/quat_retarget/`)

- `quat_retarget.blend` — scene with animated spine armature
- `quat_retarget_arm.glb` — exported GLB with quaternion animation channels
- `quat_retarget_manifest.json` — per-frame WXYZ values for all four bones
- `viewport.mp4` — automated viewport render
- `screen.mp4` — OBS screen recording (manual)

## Key gotchas

- `Quaternion @ Quaternion` (matmul) computes the quaternion product in Blender 5.1. The older `*` operator is still supported but deprecated.
- `slerp()` automatically negates the second quaternion when `q1.dot(q2) < 0` to ensure the shortest arc — you do not need to handle the double-cover manually.
- `q.inverted()` is O(1) for unit quaternions (conjugate only, no division).
- Log-space averaging breaks down when quaternions are more than ~180° apart; normalise your source poses to the same hemisphere first.

## Outside references

- Blender Foundation — [mathutils.Quaternion API](https://docs.blender.org/api/5.1/mathutils.html#mathutils.Quaternion) (CC-BY-SA 4.0)
- Shoemake, K. (1985). "Animating Rotation with Quaternion Curves." *SIGGRAPH '85*, pp. 245–254. (Public domain reference)
- Three.js Quaternion source: <https://github.com/mrdoob/three.js/blob/dev/src/math/Quaternion.js> (MIT)
