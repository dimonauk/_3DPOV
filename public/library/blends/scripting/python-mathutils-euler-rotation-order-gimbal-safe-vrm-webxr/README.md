# mathutils.Euler — Rotation Order, Gimbal Detection & VRM Rig Mode Audit (Blender 5.1)

**Slug**: `python-mathutils-euler-rotation-order-gimbal-safe-vrm-webxr`
**Topic**: `scripting`
**Blender version**: 5.1
**Licence**: CC0

## What this teaches

`mathutils.Euler(angles, order)` stores three radian angles and a three-letter
axis-application sequence.  That sequence determines *which* angle configuration
collapses into gimbal lock — a condition where two rotation axes become coplanar
and one degree of freedom is lost.  Choosing the wrong Euler order for a given
bone causes axis-flip artefacts and, more critically, silent export failures
where animated bones freeze at rest pose in Three.js or Babylon.js because the
GLTF exporter finds an empty FCurve channel.

The `blueprint.py` script:

- Builds a minimal VRM-style armature (Hips→Spine→Chest→Neck→Head, UpperArm→LowerArm→Hand).
- Assigns anatomically optimal rotation modes: QUATERNION for multi-axis spine/head, YXZ for arms, XYZ for forearms.
- Demonstrates gimbal lock on UpperArm in XYZ Euler (Y=90° arm raise → Z twist becomes coplanar with X).
- Confirms the YXZ safe path (Y is the outer axis, not the middle danger axis).
- Logs a bone-by-bone gimbal severity table.
- Exports a GLB with correctly populated quaternion channels for WebXR.

## Key API surface

| Symbol | Notes |
|--------|-------|
| `mathutils.Euler(angles, order)` | Construction — `order` is 3-char string e.g. `'YXZ'` |
| `Euler.to_quaternion()` | Lossless conversion to `mathutils.Quaternion` |
| `Euler.to_matrix()` | Produces `mathutils.Matrix` (3×3) |
| `Quaternion.to_euler(order)` | Reverse conversion; specify target order |
| `PoseBone.rotation_mode` | Set to `'QUATERNION'`, `'AXIS_ANGLE'`, or any Euler order string |
| `PoseBone.rotation_euler` | `mathutils.Euler` — only active when `rotation_mode` is an Euler string |
| `PoseBone.rotation_quaternion` | `mathutils.Quaternion` — only active when `rotation_mode == 'QUATERNION'` |

## Middle-axis rule (quick reference)

| Euler order | Middle (danger) axis | Gimbal when |
|-------------|---------------------|-------------|
| XYZ | Y | Y ≈ ±90° |
| XZY | Z | Z ≈ ±90° |
| YXZ | X | X ≈ ±90° |
| YZX | Z | Z ≈ ±90° |
| ZXY | X | X ≈ ±90° |
| ZYX | Y | Y ≈ ±90° |

## Running the scripts

```bash
blender --background --python blueprint.py
# After that produces vrm_euler_audit.blend:
blender vrm_euler_audit.blend --python record.py
```

## Artefacts produced

| File | Description |
|------|-------------|
| `vrm_euler_audit.blend` | Annotated VRM skeleton with mixed rotation modes and keyframes |
| `vrm_euler_audit.glb` | GLB with quaternion animation tracks, Draco L6, ready for WebXR |
| `viewport.mp4` | 90-frame render showing XYZ gimbal (frames 1–45) vs YXZ clean (frames 46–90) |
| `screen.mp4` | OBS screen recording — see `SCREEN-RECORDING-NOTES.md` |

## External sources

- Blender Foundation — `mathutils.Euler` API reference, CC BY 4.0
  <https://docs.blender.org/api/current/mathutils.html#mathutils.Euler>
- Wikipedia — "Euler angles" (CC BY-SA 4.0)
  <https://en.wikipedia.org/wiki/Euler_angles>
  Sister articles: Gimbal lock, Rotation matrix, Quaternion, Tait–Bryan angles
