# GN Rotation Nodes — Axis-Angle FK Robot Arm

**Blender 5.1 · CC0 · Holoflow Studio**

A three-joint forward-kinematics robot arm built entirely in Geometry Nodes using the rotation math function nodes introduced in Blender 4.2.

## What this demonstrates

| Node | Role |
|---|---|
| `FunctionNodeAxisAngleToRotation` | Converts axis vector + angle (radians) to a `Rotation` socket value |
| `FunctionNodeRotateRotation` (LOCAL) | Composes parent × child rotations — the FK rule |
| `FunctionNodeRotateVector` | Rotates a position offset into world space using a `Rotation` value |
| `GeometryNodeTransformGeometry` | Applies the composed rotation to each arm segment |

## Why not Euler?

Pre-4.2 GN used `CombineXYZ → TransformGeometry.Rotation` (treating the Vector as Euler angles). Composing two Euler rotations requires converting to matrix or quaternion, adding, and converting back — error-prone and gimbal-locked at ±90° pitch. The `Rotation` socket type carries quaternion semantics; composition is always unambiguous.

## FK chain logic

```
R_yaw   = AxisAngle(Z, yaw)               # base pan
R_yp    = RotateRotation(R_yaw, R_pitch, LOCAL)   # shoulder fold
R_full  = RotateRotation(R_yp,  R_roll,  LOCAL)   # wrist roll
```

`LOCAL` space means each child rotation is applied in its parent's frame (right-multiply quaternion). Swapping to `GLOBAL` would break the chain — the shoulder would bend in world Y regardless of the base yaw.

## Position computation

Each arm segment's world-space centre is computed with `FunctionNodeRotateVector`:

```
elbow_world = RotateVector((0, 0, LOWER_ARM_L), R_yp) + shoulder_world
wrist_world = RotateVector((0, 0, UPPER_ARM_L), R_full) + elbow_world
```

This is pure linear algebra expressed in the node graph — no Python runtime maths, no baked positions.

## Outputs

| File | Description |
|---|---|
| `output/fk_robot_arm.blend` | Blender source — GN modifier with Yaw / Pitch / Roll sockets |
| `output/fk_robot_arm.glb` | WebXR-ready GLB (Draco 6, Y-up, snake_case root) |

## Recording

Run `record.py` (requires `fk_robot_arm.blend`):

```bash
blender --background output/fk_robot_arm.blend --python record.py
```

See `SCREEN-RECORDING-NOTES.md` for screen-capture guidance.

## Licence

All files CC0. Blueprint derived from Blender's CC BY-SA 4.0 reference implementation — node graph independently authored.
