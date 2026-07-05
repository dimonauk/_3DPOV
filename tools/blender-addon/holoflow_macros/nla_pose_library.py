"""
Holoflow Studio — Blender 5.1 Macro
holoflow_macros/nla_pose_library.py

Reusable helper for building VRM pose libraries via the NLA API.
Import in any blueprint that needs multi-pose crossfading:

    from holoflow_macros.nla_pose_library import build_pose_library, bake_nla

Licence: CC0
"""

import bpy
import math


def build_pose_library(
    arm_ob: bpy.types.Object,
    poses: list[dict],
    strip_duration: int = 90,
) -> list[bpy.types.NlaStrip]:
    """
    Build a stack of NLA tracks from a list of pose descriptors.

    Each descriptor:
        {
          'name': str,            # action + track name
          'blend_type': str,      # 'REPLACE' | 'COMBINE'
          'influence': float,     # initial strip.influence (0.0–1.0)
          'rotations': [          # one tuple per bone, in armature bone order
              (rx_rad, ry_rad, rz_rad),
              ...
          ],
        }

    Returns list of NlaStrip objects (one per pose) for further influence keying.
    """
    arm_ob.animation_data_create()
    ad = arm_ob.animation_data

    # Clear existing NLA tracks and the action slot.
    for track in list(ad.nla_tracks):
        ad.nla_tracks.remove(track)
    ad.action = None

    bone_names = [b.name for b in arm_ob.pose.bones]
    strips: list[bpy.types.NlaStrip] = []

    for pose_desc in poses:
        name       = pose_desc['name']
        blend_type = pose_desc.get('blend_type', 'REPLACE')
        influence  = pose_desc.get('influence', 1.0)
        rotations  = pose_desc.get('rotations', [])

        # Remove stale action if script is re-run.
        existing = bpy.data.actions.get(name)
        if existing:
            bpy.data.actions.remove(existing)

        action = bpy.data.actions.new(name)
        action.use_fake_user = True

        # Write single-frame CONSTANT keyframes for each bone.
        for bone_idx, bone_name in enumerate(bone_names):
            pbone = arm_ob.pose.bones[bone_name]
            pbone.rotation_mode = 'XYZ'
            rot = rotations[bone_idx] if bone_idx < len(rotations) else (0.0, 0.0, 0.0)
            data_path = f'pose.bones["{bone_name}"].rotation_euler'
            for axis_idx, value in enumerate(rot):
                fc = action.fcurves.new(data_path, index=axis_idx,
                                        action_group=bone_name)
                kp = fc.keyframe_points.insert(1, value)
                kp.interpolation = 'CONSTANT'

        # Push to NLA track.
        track  = ad.nla_tracks.new()
        track.name = name
        strip  = track.strips.new(name, 1, action)

        strip.frame_start        = 1
        strip.frame_end          = strip_duration
        strip.action_frame_start = 1.0
        strip.action_frame_end   = 1.0
        strip.extrapolation      = 'HOLD'
        strip.blend_type         = blend_type
        strip.use_auto_blend     = False
        strip.influence          = influence
        strips.append(strip)

    return strips


def bake_nla(arm_ob: bpy.types.Object,
             frame_start: int = 1,
             frame_end: int = 90) -> bpy.types.Action:
    """
    Flatten NLA stack to a single baked Action on arm_ob.animation_data.action.
    Returns the baked Action.  Requires Pose Mode poll — handles mode switch internally.
    """
    prev_active = bpy.context.view_layer.objects.active
    bpy.context.view_layer.objects.active = arm_ob
    arm_ob.select_set(True)

    bpy.ops.object.mode_set(mode='POSE')
    bpy.ops.pose.select_all(action='SELECT')

    bpy.ops.nla.bake(
        frame_start       = frame_start,
        frame_end         = frame_end,
        only_selected     = True,
        visual_keying     = True,
        clear_constraints = False,
        clear_parents     = False,
        bake_types        = {'POSE'},
    )
    bpy.ops.object.mode_set(mode='OBJECT')

    if prev_active:
        bpy.context.view_layer.objects.active = prev_active

    return arm_ob.animation_data.action
