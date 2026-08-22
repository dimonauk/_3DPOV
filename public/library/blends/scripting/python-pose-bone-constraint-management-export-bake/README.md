# Python PoseBone Constraints — Mute-on-Export & NLA Bake Pipeline

**Blender 5.1 | Scripting | CC0**

## What this covers

Bone constraints (IK, Damped Track, Copy Location, etc.) are runtime rig
helpers. GLB and VRM exporters strip them silently; if you export a constrained
armature without baking the constraint effect, the resulting file will pose at
the wrong transforms.

This entry demonstrates two export-safe strategies via the Python bpy API:

| Strategy | Destructive? | Use when |
|----------|-------------|----------|
| **A — NLA Bake** | Yes (removes constraints after bake) | Final delivery, animation range needed |
| **B — Mute → Apply → Export → Restore** | No | Still-pose export, rig must survive |

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Full end-to-end script (both strategies) |
| `record.py` | Viewport animation render for 60-frame tracking demo |
| `output/constraint_rig_baked.glb` | GLB produced by Strategy B |
| `SCREEN-RECORDING-NOTES.md` | OBS capture instructions |

## Running the blueprint

1. Open Blender 5.1, Scripting workspace.
2. Open `blueprint.py`, click **Run Script**.
3. The rig builds with two bones and one animated Empty.
4. Strategy B executes: GLB appears in `output/`.
5. To run Strategy A, uncomment the bake block at the bottom of `main()`.

## Key API surface

```python
# Add a constraint in Pose mode
pb = arm_obj.pose.bones["Child"]
con = pb.constraints.new(type='DAMPED_TRACK')

# Snapshot and mute all constraints
states = [c.mute for c in all_constraints(arm_obj)]
for c in all_constraints(arm_obj): c.mute = True

# Apply visual transforms (needs VIEW_3D context)
with bpy.context.temp_override(area=view3d_area, region=region):
    bpy.ops.pose.visual_transform_apply()

# NLA bake (destructive)
bpy.ops.nla.bake(frame_start=1, frame_end=60,
    visual_keying=True, clear_constraints=True, bake_types={'POSE'})
```

## Cross-references

- `/tutorials/blender-tutorial-rigging-vrm-eye-look-at-damped-track`
- `/tutorials/blender-tutorial-python-context-temp-override-mesh-repair-pipeline`
- `/tutorials/blender-tutorial-python-nla-bake-ik-fk-action-push`
- `/tutorials/blender-tutorial-rigging-fk-ik-switch-custom-property-driver`

## External sources

- Robert Guetzkow — *blender-python-examples* — MIT
  <https://github.com/robertguetzkow/blender-python-examples>
- Blender Foundation — Python API: `bpy.types.PoseBone`
  <https://docs.blender.org/api/current/bpy.types.PoseBone.html>
