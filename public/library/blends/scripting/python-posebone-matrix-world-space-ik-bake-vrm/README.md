# Python PoseBone Matrix Chain — World-Space IK Bake for VRM

**Blender 5.1 | bpy + mathutils | CC0**

Demonstrates the complete matrix hierarchy for pose bones:
`matrix_basis` → `matrix_channel` → `pose_bone.matrix` (armature-space) → world-space — and why
`bpy.context.view_layer.update()` must be called after every bone write before reading child bones.

A 3-bone FK arm (Shoulder → UpperArm → Forearm) solves a figure-8 IK target analytically
(law of cosines + law of sines) and bakes 48 keyframes to an NLA action for GLB export.

## Outputs

| File | Description |
|------|-------------|
| `blueprint.py` | Full annotated script — run in Blender Scripting workspace |
| `record.py` | Headless viewport render → `videos/…/viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for the screen-capture video |
| `pose_arm_baked.glb` | Exported after running blueprint.py (Blender writes it) |
| `viewport.mp4` | 48-frame OpenGL render of figure-8 arm swing (generated) |
| `screen.mp4` | OBS screen capture of full Blender session (generated) |

## Key Concepts

- `pose_bone.matrix` — armature-local 4×4; the result after constraints; writable (Blender back-computes `matrix_basis`)
- `pose_bone.matrix_basis` — local delta from rest in parent-bone space; the raw driver input
- `bone.matrix_local` — rest-pose armature-space matrix; read-only in Pose Mode
- World transform: `arm_obj.matrix_world @ pose_bone.matrix`
- `Matrix4x4.decompose()` → `(location, quaternion, scale)` — the safe decomposition that handles non-uniform scale

## Running

```bash
# Open Blender 5.1, Scripting workspace, paste blueprint.py, run ▶
# Or headless:
blender --background --python blueprint.py
```

## Licence
Scripts: CC0. Blender API reference: CC-BY-4.0 (Blender Foundation).
VRM specification: MIT (vrm-c/vrm-specification).
