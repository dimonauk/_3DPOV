"""
record.py — Viewport animation render for the GN Scatter tutorial
Run AFTER blueprint.py.  Outputs viewport.mp4 for the library video slot.
Duration: ~5 s at 30 fps (150 frames).  Camera orbits the scatter plane.
"""

import bpy
import math

OUT_DIR   = "//../../videos/scripting/python-geometry-nodetree-build-scatter-modifier-api/"
FRAMES    = 150       # 5 seconds at 30 fps
FPS       = 30
CAM_R     = 12.0      # orbit radius
CAM_H     = 5.0       # camera height above origin
CAM_TILT  = math.radians(-22)


def setup_render() -> None:
    scene = bpy.context.scene
    scene.render.fps          = FPS
    scene.frame_start         = 1
    scene.frame_end           = FRAMES
    scene.render.filepath     = OUT_DIR + "viewport"
    scene.render.image_settings.file_format = "FFMPEG"
    scene.render.ffmpeg.format           = "MPEG4"
    scene.render.ffmpeg.codec            = "H264"
    scene.render.ffmpeg.constant_rate_factor = "HIGH"
    scene.render.resolution_x = 1920
    scene.render.resolution_y = 1080
    scene.render.resolution_percentage = 100


def setup_camera() -> bpy.types.Object:
    cam_data = bpy.data.cameras.new("RecordCam")
    cam_data.lens = 35
    cam_obj = bpy.data.objects.new("RecordCam", cam_data)
    bpy.context.scene.collection.objects.link(cam_obj)
    bpy.context.scene.camera = cam_obj
    return cam_obj


def animate_orbit(cam: bpy.types.Object) -> None:
    """
    Keyframe the camera on a full 360° orbit so the viewer can appreciate
    the scatter density and per-instance scale variation from all angles.
    """
    scene = bpy.context.scene
    for frame in range(1, FRAMES + 1):
        t     = (frame - 1) / (FRAMES - 1)          # 0 → 1
        angle = 2 * math.pi * t                      # full revolution

        cam.location = (
            CAM_R * math.cos(angle),
            CAM_R * math.sin(angle),
            CAM_H,
        )
        # Point camera at origin
        dx = -cam.location.x
        dy = -cam.location.y
        yaw   = math.atan2(dy, dx)
        cam.rotation_euler = (
            math.pi / 2 + CAM_TILT,
            0.0,
            yaw + math.pi / 2,
        )
        cam.keyframe_insert("location",       frame=frame)
        cam.keyframe_insert("rotation_euler", frame=frame)

    # Linear interpolation — no easing on a continuous orbit
    for fc in cam.animation_data.action.fcurves:
        for kp in fc.keyframe_points:
            kp.interpolation = "LINEAR"


def add_light() -> None:
    bpy.ops.object.light_add(type="SUN", location=(4, -4, 10))
    sun = bpy.context.active_object
    sun.data.energy = 3.0
    sun.rotation_euler = (math.radians(45), 0, math.radians(45))


def main() -> None:
    setup_render()
    cam = setup_camera()
    animate_orbit(cam)
    add_light()

    # OpenGL viewport render — no need for Cycles/EEVEE full bake
    bpy.ops.render.opengl(animation=True, sequencer=False)
    print("[HF Record] Viewport animation saved →", OUT_DIR)


if __name__ == "__main__":
    main()
