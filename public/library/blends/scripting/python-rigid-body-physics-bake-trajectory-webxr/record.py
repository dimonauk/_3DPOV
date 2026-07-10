"""
record.py — Viewport animation recording for the rigid-body tutorial.
            Blender 5.1  |  Holoflow Studio  |  CC0

Run AFTER blueprint.py — expects the scene already populated.

Output: public/library/videos/scripting/
        python-rigid-body-physics-bake-trajectory-webxr/viewport.mp4

Animation (72 frames @ 24 fps = 3 seconds):
  Frames 1–72: sphere rolls left→right, hits stack, boxes scatter and settle.
  Camera orbits 30° over the duration to show full collision.
"""

import bpy
import math

# ─── Constants ────────────────────────────────────────────────────────────────
FPS          = 24
FRAME_END    = 72
OUT_DIR      = ("//public/library/videos/scripting/"
                "python-rigid-body-physics-bake-trajectory-webxr/")
OUT_FILE     = "viewport"
RES_X        = 1920
RES_Y        = 1080


def setup_render() -> None:
    scene = bpy.context.scene
    scene.frame_start              = 1
    scene.frame_end                = FRAME_END
    scene.render.fps               = FPS
    scene.render.resolution_x      = RES_X
    scene.render.resolution_y      = RES_Y
    scene.render.engine            = "BLENDER_EEVEE_NEXT"
    scene.render.image_settings.file_format = "FFMPEG"
    scene.render.ffmpeg.format     = "MPEG4"
    scene.render.ffmpeg.codec      = "H264"
    scene.render.ffmpeg.constant_rate_factor = "MEDIUM"
    scene.render.filepath          = OUT_DIR + OUT_FILE


def add_camera() -> bpy.types.Object:
    if "RecordCam" in bpy.data.objects:
        return bpy.data.objects["RecordCam"]

    cam_data = bpy.data.cameras.new("RecordCam")
    cam_data.lens = 35
    cam_obj = bpy.data.objects.new("RecordCam", cam_data)
    bpy.context.scene.collection.objects.link(cam_obj)
    bpy.context.scene.camera = cam_obj

    # Start: looking from the sphere's launch side
    # Orbit 30° around Z over the full clip to track the collision
    r    = 7.0
    elev = math.radians(25)
    for frame, az_deg in [(1, -30), (FRAME_END, 0)]:
        az = math.radians(az_deg)
        cam_obj.location = (
            r * math.cos(az) * math.cos(elev),
            r * math.sin(az) * math.cos(elev),
            r * math.sin(elev),
        )
        cam_obj.rotation_euler = (
            math.radians(90) - elev,
            0,
            math.radians(90) + az,
        )
        cam_obj.keyframe_insert("location",       frame=frame)
        cam_obj.keyframe_insert("rotation_euler", frame=frame)

    for fc in cam_obj.animation_data.action.fcurves:
        for kp in fc.keyframe_points:
            kp.interpolation = 'LINEAR'

    return cam_obj


def add_lighting() -> None:
    if "Key" in bpy.data.objects:
        return

    key = bpy.data.lights.new("Key", type='AREA')
    key.energy = 600
    key.size   = 3.0
    ko = bpy.data.objects.new("Key", key)
    bpy.context.scene.collection.objects.link(ko)
    ko.location       = (-3, -3, 5)
    ko.rotation_euler = (math.radians(45), 0, math.radians(-40))

    fill = bpy.data.lights.new("Fill", type='AREA')
    fill.energy = 150
    fill.size   = 4.0
    fo = bpy.data.objects.new("Fill", fill)
    bpy.context.scene.collection.objects.link(fo)
    fo.location = (4, 2, 3)


def main() -> None:
    # Verify blueprint ran
    for name in ("Sphere", "Box_0", "Ground"):
        if name not in bpy.data.objects:
            raise RuntimeError(f"[holoflow] '{name}' not found — run blueprint.py first")

    setup_render()
    add_camera()
    add_lighting()
    bpy.ops.render.render(animation=True)
    print("[holoflow] viewport.mp4 rendered.")


main()
