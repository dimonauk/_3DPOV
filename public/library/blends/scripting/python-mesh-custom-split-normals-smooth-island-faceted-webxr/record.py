"""
Viewport animation recording script for the custom-split-normals tutorial.
Blender 5.1  |  Holoflow Studio  |  CC0

Run this script AFTER blueprint.py (it expects the scene to be populated).
Output: public/library/videos/scripting/
        python-mesh-custom-split-normals-smooth-island-faceted-webxr/
        viewport.mp4

Animation structure (60 frames @ 24 fps = 2.5 seconds):
  0  – 20  : Rotate 0° → 180°, flat-shaded version (custom normals not set)
  20 – 40  : Rotate 180° → 360°, custom normals applied (smooth islands)
  40 – 60  : Hold final position, camera orbit completes
"""

import bpy
import math
from mathutils import Vector

# ─── Constants ────────────────────────────────────────────────────────────────
FPS           = 24
FRAME_END     = 60
OUT_DIR       = ("//public/library/videos/scripting/"
                 "python-mesh-custom-split-normals-smooth-island-faceted-webxr/")
OUT_FILE      = "viewport"          # Blender appends _0001.png etc.
RESOLUTION_X  = 1920
RESOLUTION_Y  = 1080


def setup_scene() -> None:
    scene = bpy.context.scene
    scene.frame_start = 1
    scene.frame_end   = FRAME_END
    scene.render.fps  = FPS
    scene.render.resolution_x = RESOLUTION_X
    scene.render.resolution_y = RESOLUTION_Y
    scene.render.engine       = "BLENDER_EEVEE_NEXT"
    scene.render.image_settings.file_format = "FFMPEG"
    scene.render.ffmpeg.format   = "MPEG4"
    scene.render.ffmpeg.codec    = "H264"
    scene.render.ffmpeg.constant_rate_factor = "MEDIUM"
    scene.render.filepath = OUT_DIR + OUT_FILE


def add_camera() -> bpy.types.Object:
    cam_data = bpy.data.cameras.new("RecordCam")
    cam_data.lens = 50
    cam_obj  = bpy.data.objects.new("RecordCam", cam_data)
    bpy.context.scene.collection.objects.link(cam_obj)
    bpy.context.scene.camera = cam_obj

    # Orbit position: 4 units away, 20° elevation
    r     = 4.0
    elev  = math.radians(20)
    cam_obj.location = (r * math.cos(elev), -r * math.cos(elev), r * math.sin(elev))
    cam_obj.rotation_euler = (math.radians(70), 0, math.radians(45))
    return cam_obj


def add_lighting() -> None:
    # Key light (area, top-left)
    key = bpy.data.lights.new("Key", type='AREA')
    key.energy = 400
    key.size   = 2.0
    key_obj = bpy.data.objects.new("Key", key)
    bpy.context.scene.collection.objects.link(key_obj)
    key_obj.location = (-3, -2, 4)
    key_obj.rotation_euler = (math.radians(45), 0, math.radians(-30))

    # Rim light (spot, rear)
    rim = bpy.data.lights.new("Rim", type='SPOT')
    rim.energy   = 200
    rim.spot_size = math.radians(40)
    rim_obj = bpy.data.objects.new("Rim", rim)
    bpy.context.scene.collection.objects.link(rim_obj)
    rim_obj.location = (2, 3, 2)
    rim_obj.rotation_euler = (math.radians(-60), 0, math.radians(30))


def keyframe_rotation(obj: bpy.types.Object) -> None:
    """Insert rotation keyframes for a 360° turntable."""
    obj.rotation_euler = (0, 0, 0)
    obj.keyframe_insert("rotation_euler", frame=1)
    obj.rotation_euler = (0, 0, math.radians(360))
    obj.keyframe_insert("rotation_euler", frame=FRAME_END)

    # Set linear interpolation so speed is constant.
    for fc in obj.animation_data.action.fcurves:
        for kp in fc.keyframe_points:
            kp.interpolation = 'LINEAR'


def render_viewport_animation() -> None:
    """Render all frames to the output directory."""
    bpy.ops.render.render(animation=True)
    print(f"[holoflow] frames written to {OUT_DIR}")


def main() -> None:
    scene = bpy.context.scene

    # Expect blueprint.py to have already created the gem object.
    gem = bpy.data.objects.get("normal_gem")
    if gem is None:
        raise RuntimeError("[holoflow] run blueprint.py first — 'normal_gem' not found")

    setup_scene()
    add_camera()
    add_lighting()
    keyframe_rotation(gem)
    render_viewport_animation()


main()
