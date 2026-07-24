"""
record.py — Viewport animation render for the Hopf Fibration sculpture.
Run AFTER blueprint.py in the same Blender 5.1 session.

Outputs: public/library/videos/scripting/
         python-hopf-fibration-linked-tori-light-sculpture-webxr/viewport.mp4

The camera slowly orbits the sculpture over 150 frames so the viewer can
see the fibres pass through one another from every angle.
"""

import math
import bpy

OUTPUT_DIR  = "//../../../../public/library/videos/scripting/python-hopf-fibration-linked-tori-light-sculpture-webxr/"
TOTAL_FRAMES = 150
ORBIT_RADIUS = 6.5
ORBIT_HEIGHT = 1.6
FPS          = 30


def _orbit_camera(frame, total, radius, height):
    """Return camera location for a full 360° orbit over `total` frames."""
    angle = 2.0 * math.pi * frame / total
    return (radius * math.sin(angle), -radius * math.cos(angle), height)


def setup_camera_anim():
    cam_obj = bpy.context.scene.objects.get("HopfCam")
    if cam_obj is None:
        print("[record] HopfCam not found — run blueprint.py first.")
        return

    cam_obj.animation_data_clear()
    scene = bpy.context.scene
    scene.frame_start = 1
    scene.frame_end   = TOTAL_FRAMES

    for f in range(1, TOTAL_FRAMES + 1):
        scene.frame_set(f)
        loc = _orbit_camera(f - 1, TOTAL_FRAMES, ORBIT_RADIUS, ORBIT_HEIGHT)
        cam_obj.location = loc
        # Always look at origin
        dx, dy = -loc[0], -loc[1]
        cam_obj.rotation_euler = (
            math.atan2(math.sqrt(dx*dx + dy*dy), -loc[2]) + math.pi,
            0.0,
            math.atan2(dx, dy),
        )
        cam_obj.keyframe_insert("location",       frame=f)
        cam_obj.keyframe_insert("rotation_euler", frame=f)


def render_mp4():
    scene = bpy.context.scene
    scene.render.image_settings.file_format = "FFMPEG"
    scene.render.ffmpeg.format              = "MPEG4"
    scene.render.ffmpeg.codec               = "H264"
    scene.render.ffmpeg.constant_rate_factor = "MEDIUM"
    scene.render.fps                        = FPS
    scene.render.filepath                   = OUTPUT_DIR + "viewport"
    scene.render.resolution_x              = 1920
    scene.render.resolution_y              = 1080
    scene.render.resolution_percentage     = 100
    bpy.ops.render.render(animation=True)
    print(f"[record] Rendered to {OUTPUT_DIR}viewport.mp4")


setup_camera_anim()
render_mp4()
