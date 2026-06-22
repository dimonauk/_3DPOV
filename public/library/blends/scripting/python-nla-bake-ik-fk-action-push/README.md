# Python — NLA Bake: IK-Constrained Pose to Clean FK Keyframes
**Blender 5.1 | CC0 | Holoflow Studio**

## What This Is

`bpy.ops.nla.bake()` walks every frame in a specified range, queries the
Blender dependency graph for the evaluated (constraint-resolved) pose of each
selected bone, and writes explicit rotation/location F-curves. The result is a
new Action that reproduces the original constraint-driven motion without
requiring any constraints at runtime.

This is the mandatory last step for any IK-animated rig going to glTF / VRM.
The GLB format carries keyframe channels, not constraint definitions.

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Complete script: build arm, add IK, animate target, bake, push to NLA, export GLB |
| `record.py` | Viewport recording script → `viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for `screen.mp4` |
| `ik_arm_baked.blend` | Generated .blend (run blueprint.py to produce) |
| `ik_arm_baked.glb` | Generated GLB with baked FK animation as NLA strip |

## Usage

1. Open Blender 5.1 with a new empty scene.
2. Open the Scripting workspace, paste or load `blueprint.py`.
3. Press **Run Script** (▶).
4. Inspect the NLA Editor — the `arm_ik_baked_fk` strip should appear on `ik_arm`.
5. The GLB is written to the same directory as the .blend.

## Key Parameters to Tweak

- `BAKE_START` / `BAKE_END` — adjust to your animation range.
- `IK_CHAIN` — set to match the chain_count on your IK constraint.
- `clear_constraints=True` — change to False if you want to keep the IK
  constraint for further interactive editing after baking.
- `only_selected=True` — select specific bones in Pose Mode before baking to
  restrict which bones get new keyframes.

## Licence

CC0 — no rights reserved. Use freely.

## External References

- Blender Manual — NLA Editor: https://docs.blender.org/manual/en/latest/editors/nla/
- KhronosGroup glTF-Blender-IO (Apache-2.0): https://github.com/KhronosGroup/glTF-Blender-IO
- pixiv/three-vrm (MIT): https://github.com/pixiv/three-vrm
