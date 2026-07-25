"""
BVH Motion Capture → VRM Bone Remap → NLA Bake
Retarget a CMU-format dancer/poi-performer BVH onto a VRM-ready Blender armature.

Technique overview
──────────────────
1. Import the BVH with global_scale=0.01 (cm → m) + rotate_mode='QUATERNION'
   to avoid gimbal lock in shoulder/wrist channels.
2. Build a LOCAL/LOCAL COPY_ROTATION constraint on every VRM bone that has a
   matched BVH counterpart.  LOCAL→LOCAL replicates the RELATIVE rotation each
   bone makes against its own parent — the only space that gives frame-stable
   retargeting without caring about skeleton scale or offset.
3. Bake with visual_keying=True so the depsgraph resolves the entire constraint
   stack before sampling.  clear_constraints=True removes the retarget rig in
   the same pass — no second cleanup step needed.
4. Push the baked action to an NLA strip, remove the source BVH armature, and
   export a VRM-ready GLB with +Y-up applied.

Why not matrix-copy instead of COPY_ROTATION?
  matrix_world copy requires matching rest-pose orientation.  CMU T-pose and a
  VRM A-pose differ by ~45° at the shoulders.  LOCAL/LOCAL is rest-pose-agnostic:
  if the BVH bone rotates 30° from its rest, the VRM bone rotates 30° from ITS
  rest, preserving relative motion without any manual offset calculation.
  Exception: hips root — use COPY_LOCATION + COPY_ROTATION in WORLD space to
  carry absolute trajectory.

Rest-pose delta (when you DO need it)
  If source and target have the same rest orientation (both T-pose or both
  A-pose), LOCAL/LOCAL is exact.  If they differ, compute the offset once:
      delta = src_pbone.bone.matrix_local.inverted() @ tgt_pbone.bone.matrix_local
  Decompose to euler and set constraint.euler_rotation = delta.to_euler().
  This is a one-time constant, not per-frame work.
"""

import bpy
import math
import pathlib

# ── Parameters ──────────────────────────────────────────────────────────────
BVH_PATH      = pathlib.Path("/path/to/performer_dance.bvh")
VRM_OBJ_NAME  = "Armature"          # your VRM armature object name in scene
OUTPUT_DIR    = pathlib.Path(bpy.path.abspath("//"))
OUTPUT_GLB    = OUTPUT_DIR / "hf_retarget_dancer.glb"
FRAME_START   = 1
FRAME_END     = 240                 # override; BVH importer sets scene length
GLOBAL_SCALE  = 0.01               # CMU BVH is in cm; convert to metres
APPLY_HIPS_LOCATION = True         # carry root translation to VRM hips

# CMU mocap bone names → VRM humanoid bone names used by VRM-for-Blender addon.
# Keys are the names Blender's BVH importer assigns after reading CMU files.
# Values are the bone names that VRM-for-Blender creates on the target armature.
CMU_TO_VRM: dict[str, str] = {
    "Hips":           "hips",
    "LowerBack":      "spine",
    "Spine":          "spine",
    "Spine1":         "chest",
    "Neck":           "neck",
    "Neck1":          "neck",
    "Head":           "head",
    "LeftShoulder":   "leftShoulder",
    "LeftArm":        "leftUpperArm",
    "LeftForeArm":    "leftLowerArm",
    "LeftHand":       "leftHand",
    "RightShoulder":  "rightShoulder",
    "RightArm":       "rightUpperArm",
    "RightForeArm":   "rightLowerArm",
    "RightHand":      "rightHand",
    "LeftUpLeg":      "leftUpperLeg",
    "LeftLeg":        "leftLowerLeg",
    "LeftFoot":       "leftFoot",
    "LeftToeBase":    "leftToes",
    "RightUpLeg":     "rightUpperLeg",
    "RightLeg":       "rightLowerLeg",
    "RightFoot":      "rightFoot",
    "RightToeBase":   "rightToes",
}


def import_bvh(filepath: pathlib.Path) -> bpy.types.Object:
    """Import BVH and return the new armature object."""
    bpy.ops.object.select_all(action='DESELECT')
    bpy.ops.import_anim.bvh(
        filepath        = str(filepath),
        target          = 'ARMATURE',
        global_scale    = GLOBAL_SCALE,
        frame_start     = FRAME_START,
        use_fps_scale   = False,    # keep BVH native fps; retime in NLA strip
        use_cyclic      = False,
        rotate_mode     = 'QUATERNION',
        # Blender 5.x: forward/up are set per-scene; BVH is always Z-up in its
        # own coordinate system.  The importer applies a 90° X rotation to
        # convert BVH-Z-up to Blender-Z-up, which is correct for CMU data.
    )
    # The importer selects only the new armature.
    new_objs = [o for o in bpy.context.selected_objects if o.type == 'ARMATURE']
    if not new_objs:
        raise RuntimeError("BVH import produced no armature object.")
    return new_objs[0]


def apply_retarget_constraints(src: bpy.types.Object,
                               tgt: bpy.types.Object) -> list[str]:
    """
    Add COPY_ROTATION (LOCAL/LOCAL) on every VRM bone that maps to a BVH bone.
    Returns list of VRM bone names that received a constraint.
    """
    bpy.context.view_layer.objects.active = tgt
    bpy.ops.object.mode_set(mode='POSE')

    bound: list[str] = []

    for bvh_name, vrm_name in CMU_TO_VRM.items():
        if bvh_name not in src.pose.bones:
            continue
        if vrm_name not in tgt.pose.bones:
            continue

        vrm_pbone = tgt.pose.bones[vrm_name]

        # Remove any stale constraint from a previous run.
        for c in list(vrm_pbone.constraints):
            if c.name.startswith("HF_RETARGET"):
                vrm_pbone.constraints.remove(c)

        # Root hips: carry world-space translation + rotation.
        if vrm_name == "hips" and APPLY_HIPS_LOCATION:
            loc_c = vrm_pbone.constraints.new('COPY_LOCATION')
            loc_c.name     = "HF_RETARGET_loc"
            loc_c.target   = src
            loc_c.subtarget = bvh_name
            loc_c.space    = 'WORLD'
            loc_c.target_space = 'WORLD'

        rot_c = vrm_pbone.constraints.new('COPY_ROTATION')
        rot_c.name         = "HF_RETARGET_rot"
        rot_c.target       = src
        rot_c.subtarget    = bvh_name
        rot_c.space        = 'LOCAL'
        rot_c.target_space = 'LOCAL'
        rot_c.mix_mode     = 'REPLACE'

        bound.append(vrm_name)

    bpy.ops.object.mode_set(mode='OBJECT')
    return bound


def bake_to_nla(tgt: bpy.types.Object,
                action_name: str,
                frame_end: int) -> bpy.types.Action:
    """
    Bake all constraint-driven pose bones onto a new Action, clear constraints,
    and push the action to a new NLA strip.

    visual_keying=True is mandatory here: it asks the depsgraph to fully evaluate
    the constraint stack at each frame before sampling, rather than reading the
    raw FCurves on the target armature (which are flat because the motion lives
    on the source BVH armature).

    clear_constraints=True removes constraints during the same pass so you
    do not need a second cleanup loop.
    """
    bpy.context.view_layer.objects.active = tgt
    tgt.select_set(True)

    bpy.ops.nla.bake(
        frame_start       = FRAME_START,
        frame_end         = frame_end,
        only_selected     = False,      # all bones on active object
        visual_keying     = True,
        clear_constraints = True,
        bake_types        = {'POSE'},
    )

    baked_action = tgt.animation_data.action
    baked_action.name = action_name

    # Linearise all FCurves — BVH motion is already continuous, Bézier easing
    # on top of sampled quaternion channels causes subtle arc artifacts.
    for fc in baked_action.fcurves:
        for kp in fc.keyframe_points:
            kp.interpolation = 'LINEAR'

    # Push to NLA so the direct action slot is free for layering.
    tgt.animation_data.action = None
    track = tgt.animation_data.nla_tracks.new()
    track.name = "hf_retarget"
    strip = track.strips.new(action_name, FRAME_START, baked_action)
    strip.blend_type = 'REPLACE'

    print(f"[HF] Baked {len(baked_action.fcurves)} FCurves → NLA strip '{action_name}'")
    return baked_action


def export_glb(tgt: bpy.types.Object, output_path: pathlib.Path) -> None:
    bpy.ops.object.select_all(action='DESELECT')
    tgt.select_set(True)
    bpy.ops.export_scene.gltf(
        filepath                     = str(output_path),
        use_selection                = True,
        export_format                = 'GLB',
        export_yup                   = True,
        export_apply                 = True,
        export_animations            = True,
        export_nla_strips            = True,
        export_nla_strips_merged_animation_name = "dance_retarget",
        export_draco_mesh_compression_enable    = True,
        export_draco_mesh_compression_level     = 6,
        export_image_format          = 'WEBP',
    )
    print(f"[HF] Exported → {output_path}")


def main() -> None:
    if not BVH_PATH.exists():
        print(f"[HF] BVH file not found: {BVH_PATH}")
        print("     Drop a CMU-format .bvh file at that path and re-run.")
        return

    vrm_obj = bpy.data.objects.get(VRM_OBJ_NAME)
    if vrm_obj is None or vrm_obj.type != 'ARMATURE':
        raise RuntimeError(f"No armature '{VRM_OBJ_NAME}' found in scene.")

    # 1. Import source motion
    src_obj = import_bvh(BVH_PATH)
    frame_end = int(bpy.context.scene.frame_end)

    # 2. Apply retarget constraints
    bound = apply_retarget_constraints(src_obj, vrm_obj)
    print(f"[HF] Constrained {len(bound)} VRM bones to BVH source.")

    # 3. Bake and push to NLA
    bake_to_nla(vrm_obj, "hf_dance_retarget", frame_end)

    # 4. Remove source BVH armature (no longer needed)
    bpy.data.objects.remove(src_obj, do_unlink=True)

    # 5. Export
    export_glb(vrm_obj, OUTPUT_GLB)


if __name__ == "__main__":
    main()
