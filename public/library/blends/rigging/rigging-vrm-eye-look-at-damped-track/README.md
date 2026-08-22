# VRM Eye Look-At Rig — Damped Track + Limit Rotation

**Blender 5.1 · Rigging · CC0**

## What this teaches

Why Damped Track is preferred over Track To for eye bones: Track To solves in
Euler angles and can gimbal-lock when the target crosses the 90° pole, causing
a sudden 180° flip. Damped Track solves as a quaternion minimum-rotation —
always the shortest path, always continuous. For a real-time WebXR avatar that
a user wears, a constraint that can flip is not acceptable.

The constraint chain on each eye bone:

```
DampedTrack_LookAt   →  orient eye toward LookTarget bone
LimitRot_EyeClamp    →  clamp ±40° yaw, ±30° pitch (Pose space)
```

Right eye additionally uses `CopyRotation(LeftEye, invertZ=True)` before its
own `LimitRot_EyeClamp`, so both eyes converge on the same target without
requiring a second Damped Track computation.

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Full bpy rig build — run in Scripting workspace |
| `record.py` | Keyframes + OpenGL viewport render → `viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for `screen.mp4` |
| `vrm_eye_lookat_rig.blend` | Output of `blueprint.py` (committed separately) |

## Bone hierarchy

```
Root
└── Hips
    └── Spine
        └── Chest
            └── Neck
                └── Head
                    ├── LeftEye   [Damped Track → Limit Rotation]
                    ├── RightEye  [Copy Rotation(LeftEye, Z inv.) → Limit Rotation]
                    └── LookTarget (non-deforming control bone)
```

## Running the blueprint

```bash
blender --background --python blueprint.py
```

Or paste into **Scripting > Text Editor** and press **Run Script**.

## VRM export

Install the VRM Add-on for Blender (MIT licence, saturday06/VRM-Addon-for-Blender).
Set each eye bone in **VRM → Spring Bone / Humanoid** to the correct slot:
- `LeftEye`  → leftEye
- `RightEye` → rightEye

The VRM runtime's LookAt API will then call into these bones via the constraint
chain rather than via shape keys, giving physically plausible blended gaze at
runtime.

## Outside sources

1. **Blender Manual — Damped Track Constraint** (CC-BY-SA 4.0, Blender Foundation)
   https://docs.blender.org/manual/en/5.1/animation/constraints/tracking/damped_track.html

2. **VRM Specification — LookAt** (MIT, VRM Consortium)
   https://github.com/vrm-c/vrm-specification/blob/master/specification/VRMC_vrm-1.0/lookAt.md
