"""
holoflow_macros/camera_dolly_rig.py
Blender 5.1  |  CC0 1.0  |  Holoflow Studio

Reusable utility: build a Follow Path + Track To camera dolly rig programmatically.
Import and call build_camera_dolly_rig() from any Holoflow script.

Usage:
    from holoflow_macros.camera_dolly_rig import build_camera_dolly_rig

    rig = build_camera_dolly_rig(
        arc_points=[(-4,-3,2), (0,6,2), (4,-3,2)],
        target_loc=(0, 0, 1.5),
        focal_mm=85.0,
        fstop=1.8,
        focus_dist=4.5,
        dolly_frames=(1, 80),
    )
"""

import math
import bpy
import mathutils
from typing import Sequence


def build_camera_dolly_rig(
    arc_points: Sequence[tuple[float, float, float]],
    target_loc: tuple[float, float, float] = (0.0, 0.0, 1.5),
    focal_mm: float = 85.0,
    fstop: float = 1.8,
    focus_dist: float = 4.5,
    dolly_frames: tuple[int, int] = (1, 80),
    path_name: str = "DollyArc",
    cam_name: str = "Cam_Main",
    target_name: str = "LookTarget",
) -> dict:
    """
    Build a Bezier dolly rig in the active collection.

    Parameters
    ----------
    arc_points   : sequence of (x,y,z) — Bezier control point positions.
                   Minimum 2. AUTO handles are applied; reshape in Edit Mode.
    target_loc   : world position of the look-at empty.
    focal_mm     : camera focal length in mm.
    fstop        : aperture — smaller = shallower DOF.
    focus_dist   : initial dof.focus_distance in metres.
    dolly_frames : (start, end) frame range for the dolly motion.
    path_name    : name for the curve object.
    cam_name     : name for the camera object.
    target_name  : name for the look-at empty.

    Returns
    -------
    dict with keys: 'path', 'camera', 'target'
    """
    coll = bpy.context.collection

    # ── Bezier arc path ──────────────────────────────────────────────────────
    cdata = bpy.data.curves.new(path_name, 'CURVE')
    cdata.dimensions    = '3D'
    cdata.use_path      = True
    cdata.path_duration = dolly_frames[1] - dolly_frames[0]

    spline = cdata.splines.new('BEZIER')
    spline.bezier_points.add(len(arc_points) - 1)  # default 1 + N-1 = N

    for bp, co in zip(spline.bezier_points, arc_points):
        bp.co                = mathutils.Vector(co)
        bp.handle_left_type  = 'AUTO'
        bp.handle_right_type = 'AUTO'

    path_obj = bpy.data.objects.new(path_name, cdata)
    coll.objects.link(path_obj)

    # ── Look-at target ───────────────────────────────────────────────────────
    bpy.ops.object.empty_add(type='SPHERE', location=target_loc)
    target_obj              = bpy.context.active_object
    target_obj.name         = target_name
    target_obj.empty_display_size = 0.18

    # ── Camera ───────────────────────────────────────────────────────────────
    cam_data      = bpy.data.cameras.new(cam_name)
    cam_data.lens = focal_mm
    cam_data.dof.use_dof         = True
    cam_data.dof.aperture_fstop  = fstop
    cam_data.dof.focus_distance  = focus_dist

    cam_obj      = bpy.data.objects.new(cam_name, cam_data)
    cam_obj.name = cam_name
    coll.objects.link(cam_obj)
    bpy.context.scene.camera = cam_obj

    # ── Constraints ──────────────────────────────────────────────────────────
    fp = cam_obj.constraints.new('FOLLOW_PATH')
    fp.name              = "Follow Path"
    fp.target            = path_obj
    fp.use_fixed_location = False
    fp.use_curve_follow  = False
    fp.forward_axis      = 'FORWARD_Y'
    fp.up_axis           = 'UP_Z'

    tt = cam_obj.constraints.new('TRACK_TO')
    tt.name       = "Track To"
    tt.target     = target_obj
    tt.track_axis = 'TRACK_NEGATIVE_Z'
    tt.up_axis    = 'UP_Y'

    # ── Keyframe dolly offset ─────────────────────────────────────────────────
    fp.offset_factor = 0.0
    fp.keyframe_insert(data_path='offset_factor', frame=dolly_frames[0])
    fp.offset_factor = 1.0
    fp.keyframe_insert(data_path='offset_factor', frame=dolly_frames[1])

    for fc in cam_obj.animation_data.action.fcurves:
        if 'offset_factor' in fc.data_path:
            for kp in fc.keyframe_points:
                kp.interpolation = 'SINE'
                kp.easing        = 'EASE_IN_OUT'

    return {'path': path_obj, 'camera': cam_obj, 'target': target_obj}


def add_rack_focus(
    cam_obj: bpy.types.Object,
    focus_near: float,
    focus_far: float,
    rack_frames: tuple[int, int],
    hold_frame: int | None = None,
) -> None:
    """
    Add a rack-focus transition on an existing camera object.

    The focus holds at focus_far from the start of rack_frames[0] until
    hold_frame (or rack_frames[0] if hold_frame is None), then transitions
    to focus_near by rack_frames[1].

    Typical use: focus_far = subject distance during dolly; focus_near =
    foreground element distance at end mark.
    """
    cam_data = cam_obj.data
    hold     = hold_frame if hold_frame is not None else rack_frames[0]

    cam_data.dof.focus_distance = focus_far
    cam_data.keyframe_insert(data_path='dof.focus_distance', frame=rack_frames[0])
    cam_data.keyframe_insert(data_path='dof.focus_distance', frame=hold)

    cam_data.dof.focus_distance = focus_near
    cam_data.keyframe_insert(data_path='dof.focus_distance', frame=rack_frames[1])

    if cam_data.animation_data and cam_data.animation_data.action:
        for fc in cam_data.animation_data.action.fcurves:
            if 'dof.focus_distance' in fc.data_path:
                for kp in fc.keyframe_points:
                    kp.interpolation = 'SINE'
                    kp.easing        = 'EASE_IN_OUT'
