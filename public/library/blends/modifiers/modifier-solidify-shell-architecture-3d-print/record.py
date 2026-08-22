"""
record.py — Viewport turntable for modifier-solidify-shell-architecture-3d-print
=================================================================================
Run AFTER blueprint.py has built the scene:
  blender wall_corner_solidify.blend --python record.py

Output:
  public/library/videos/modifiers/
    modifier-solidify-shell-architecture-3d-print/viewport.mp4

Animation: 5 s at 24 fps (120 frames).
The camera orbits 90° around the corner pivot — exterior → corner heel →
interior glimpse — so viewers see both the outer concrete face and the inner
miter joint created by Complex Solidify mode.
"""

import os
import math
import bpy
from mathutils import Vector

BLEND_DIR  = os.path.dirname(os.path.abspath(__file__))
VIDEO_DIR  = os.path.normpath(os.path.join(
    BLEND_DIR,
    "..", "..", "..", "..",
    "videos", "modifiers", "modifier-solidify-shell-architecture-3d-print",
))
OUT_PATH   = os.path.join(VIDEO_DIR, "viewport")   # Blender appends frame ext
TOTAL_FRAMES = 120   # 5 s @ 24 fps
FPS          = 24
ORBIT_RADIUS = 7.0   # metres from corner pivot


def setup_render():
    scene = bpy.context.scene
    scene.render.fps            = FPS
    scene.frame_start           = 1
    scene.frame_end             = TOTAL_FRAMES

    scene.render.engine                 = 'BLENDER_EEVEE_NEXT'
    scene.render.image_settings.file_format = 'FFMPEG'
    scene.render.ffmpeg.format              = 'MPEG4'
    scene.render.ffmpeg.codec               = 'H264'
    scene.render.ffmpeg.constant_rate_factor = 'HIGH'
    scene.render.resolution_x  = 1920
    scene.render.resolution_y  = 1080
    scene.render.filepath      = OUT_PATH

    os.makedirs(VIDEO_DIR, exist_ok=True)


def setup_camera_orbit():
    """Orbit pivot sits at the corner vertex (0, 0, 1.4 m — mid-height).

    The camera parents to an Empty and the Empty's Z rotation is animated
    from 45° (exterior three-quarter view) to -45° (interior three-quarter).
    This 90° sweep passes through the corner heel at frame 60, showing the
    miter geometry cleanly.
    """
    scene = bpy.context.scene

    # Reuse existing camera or create one
    if scene.camera:
        cam_obj = scene.camera
    else:
        cam_data = bpy.data.cameras.new("RecordCam")
        cam_data.lens = 28.0
        cam_obj = bpy.data.objects.new("RecordCam", cam_data)
        bpy.context.collection.objects.link(cam_obj)
        scene.camera = cam_obj

    # Orbit pivot at corner, mid-height
    pivot = bpy.data.objects.new("OrbitPivot", None)
    pivot.location = Vector((0.0, 0.0, 1.4))
    bpy.context.collection.objects.link(pivot)

    # Parent camera to pivot
    cam_obj.parent      = pivot
    cam_obj.parent_type = 'OBJECT'
    cam_obj.location    = Vector((ORBIT_RADIUS, 0, 0))
    cam_obj.rotation_euler = (
        math.radians(80),   # tilt down slightly
        0,
        math.radians(90),   # point toward pivot
    )

    # Animate pivot Z rotation: +45° → -45° (exterior to interior sweep)
    start_angle = math.radians(45)
    end_angle   = math.radians(-45)

    pivot.rotation_euler = (0, 0, start_angle)
    pivot.keyframe_insert(data_path="rotation_euler", frame=1)

    pivot.rotation_euler = (0, 0, end_angle)
    pivot.keyframe_insert(data_path="rotation_euler", frame=TOTAL_FRAMES)

    # Linear — constant camera speed around the arc
    if pivot.animation_data and pivot.animation_data.action:
        for fc in pivot.animation_data.action.fcurves:
            for kp in fc.keyframe_points:
                kp.interpolation = 'LINEAR'


def main():
    setup_render()
    setup_camera_orbit()
    bpy.ops.render.render(animation=True)
    print(f"[record] viewport.mp4 written to {VIDEO_DIR}")


if __name__ == "__main__":
    main()
