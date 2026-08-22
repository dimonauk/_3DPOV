"""
holoflow_macros/armature_spline_ik_tentacle.py
Reusable Spline IK rig factory for Holoflow Studio.

Usage:
    from holoflow_macros.armature_spline_ik_tentacle import build_spline_ik_rig
    arm_obj, curve_obj = build_spline_ik_rig(
        name="tail",
        bone_count=8,
        bone_length=0.15,
        collection=bpy.context.collection,
    )
"""

import bpy
from mathutils import Vector


def build_spline_ik_rig(
    name: str,
    bone_count: int = 10,
    bone_length: float = 0.12,
    ctrl_dist: float = 0.50,
    xz_scale_mode: str = "VOLUME_PRESERVE",
    y_scale_mode: str = "FIT_CURVE",
    collection: bpy.types.Collection | None = None,
) -> tuple[bpy.types.Object, bpy.types.Object]:
    """
    Build a Spline IK armature chain and its Bezier curve target.

    Parameters
    ----------
    name          : prefix for all created data blocks
    bone_count    : number of bones in the chain
    bone_length   : length per bone segment in metres
    ctrl_dist     : Bezier handle lateral offset for the default S-curve
    xz_scale_mode : 'NONE' | 'VOLUME_PRESERVE' | 'BONE_ORIGINAL' | 'INVERSE_PRESERVE'
    y_scale_mode  : 'NONE' | 'FIT_CURVE' | 'BONE_ORIGINAL'
    collection    : target collection (defaults to active scene collection)

    Returns
    -------
    (armature_object, curve_object)
    """
    col = collection or bpy.context.collection
    total = bone_count * bone_length
    half  = total * 0.5

    # ── Curve ────────────────────────────────────────────────────────────────
    cu = bpy.data.curves.new(f"{name}_curve", 'CURVE')
    cu.dimensions = '3D'
    cu.twist_mode = 'MINIMUM'

    sp = cu.splines.new('BEZIER')
    sp.bezier_points.add(2)
    pts = sp.bezier_points

    pts[0].co = Vector((0, 0, 0))
    pts[0].handle_left  = Vector((-ctrl_dist, 0, 0))
    pts[0].handle_right = Vector(( ctrl_dist, 0, 0))
    pts[0].handle_left_type  = 'FREE'
    pts[0].handle_right_type = 'FREE'

    pts[1].co = Vector((0.25, half, 0))
    pts[1].handle_left  = Vector((-ctrl_dist * 0.7, half - 0.15, 0))
    pts[1].handle_right = Vector(( ctrl_dist * 0.7, half + 0.15, 0))
    pts[1].handle_left_type  = 'FREE'
    pts[1].handle_right_type = 'FREE'

    pts[2].co = Vector((0, total, 0))
    pts[2].handle_left  = Vector((-ctrl_dist, total, 0))
    pts[2].handle_right = Vector(( ctrl_dist, total, 0))
    pts[2].handle_left_type  = 'FREE'
    pts[2].handle_right_type = 'FREE'

    curve_obj = bpy.data.objects.new(f"{name}_curve", cu)
    curve_obj.hide_render = True
    col.objects.link(curve_obj)

    # ── Armature ─────────────────────────────────────────────────────────────
    arm = bpy.data.armatures.new(f"{name}_armature")
    arm_obj = bpy.data.objects.new(f"{name}_armature", arm)
    col.objects.link(arm_obj)

    bpy.context.view_layer.objects.active = arm_obj
    arm_obj.select_set(True)
    bpy.ops.object.mode_set(mode='EDIT')

    prev = None
    for i in range(bone_count):
        b = arm.edit_bones.new(f"Bone.{i:03d}" if i else "Bone")
        b.head = Vector((0, i * bone_length, 0))
        b.tail = Vector((0, (i + 1) * bone_length, 0))
        if prev:
            b.parent      = prev
            b.use_connect = True
        prev = b

    bpy.ops.object.mode_set(mode='POSE')

    tip_name  = f"Bone.{bone_count - 1:03d}"
    tip_pbone = arm_obj.pose.bones[tip_name]
    con = tip_pbone.constraints.new('SPLINE_IK')
    con.target           = curve_obj
    con.chain_count      = bone_count
    con.use_curve_radius = False
    con.xz_scale_mode    = xz_scale_mode
    con.y_scale_mode     = y_scale_mode

    bpy.ops.object.mode_set(mode='OBJECT')

    return arm_obj, curve_obj
