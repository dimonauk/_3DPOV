"""
record.py — Viewport-animation recording for GN Curve Spiral Helical Spring (Blender 5.1)

Run:  blender --background --python record.py
Output: public/library/videos/geometry-nodes/gn-curve-spiral-helical-spring-webxr/viewport.mp4

Animation: spring rotates 360° over 120 frames (5 s at 24 fps); camera holds at a
three-quarter elevated position showing the coil depth and the top-to-bottom taper.
"""

import bpy
import bmesh
import math
import os
import sys

# ── Paths ───────────────────────────────────────────────────────────────────────
_SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
VIDEO_OUT = os.path.normpath(os.path.join(
    _SCRIPT_DIR,
    "..", "..", "..",          # blends/geometry-nodes → library/
    "videos", "geometry-nodes",
    "gn-curve-spiral-helical-spring-webxr",
    "viewport.mp4",
))

FRAME_START = 1
FRAME_END   = 120   # 5 s at 24 fps — one full rotation
FPS         = 24

sys.path.insert(0, _SCRIPT_DIR)
import importlib
import blueprint as bp
importlib.reload(bp)


def _setup_camera() -> bpy.types.Object:
    cam_data = bpy.data.cameras.new("Rec_Cam")
    cam_data.lens = 70.0
    cam_ob = bpy.data.objects.new("Rec_Cam", cam_data)
    bpy.context.collection.objects.link(cam_ob)
    # Elevated three-quarter view: see coil depth, top-to-bottom taper
    cam_ob.location = (5.0, -6.5, 3.5)
    cam_ob.rotation_euler = (math.radians(70), 0.0, math.radians(37))
    bpy.context.scene.camera = cam_ob
    return cam_ob


def _setup_lights() -> None:
    # Key light — warm area above-left
    key_d = bpy.data.lights.new("Rec_Key", type='AREA')
    key_d.energy = 600.0
    key_d.size   = 5.0
    key_ob = bpy.data.objects.new("Rec_Key", key_d)
    bpy.context.collection.objects.link(key_ob)
    key_ob.location = (-3.0, -2.0, 7.0)
    key_ob.rotation_euler = (math.radians(40), math.radians(-20), 0.0)

    # Fill light — cool area to the right
    fill_d = bpy.data.lights.new("Rec_Fill", type='AREA')
    fill_d.energy = 200.0
    fill_d.size   = 8.0
    fill_d.color  = (0.80, 0.90, 1.00)
    fill_ob = bpy.data.objects.new("Rec_Fill", fill_d)
    bpy.context.collection.objects.link(fill_ob)
    fill_ob.location = (6.0, 3.0, 4.0)
    fill_ob.rotation_euler = (math.radians(55), math.radians(30), 0.0)


def _animate_rotation(ob: bpy.types.Object) -> None:
    ob.animation_data_clear()
    ob.rotation_mode = 'XYZ'

    bpy.context.scene.frame_set(FRAME_START)
    ob.rotation_euler.z = 0.0
    ob.keyframe_insert("rotation_euler", index=2)

    bpy.context.scene.frame_set(FRAME_END)
    ob.rotation_euler.z = math.tau   # one full revolution
    ob.keyframe_insert("rotation_euler", index=2)

    # Linear interpolation: constant angular velocity, no ease-in/out
    if ob.animation_data and ob.animation_data.action:
        for fc in ob.animation_data.action.fcurves:
            for kp in fc.keyframe_points:
                kp.interpolation = 'LINEAR'


def _render(output_path: str) -> None:
    scn = bpy.context.scene
    scn.frame_start = FRAME_START
    scn.frame_end   = FRAME_END
    scn.render.fps  = FPS

    scn.render.resolution_x = 1280
    scn.render.resolution_y = 720
    scn.render.image_settings.file_format = 'FFMPEG'
    scn.render.ffmpeg.format               = 'MPEG4'
    scn.render.ffmpeg.codec                = 'H264'
    scn.render.ffmpeg.constant_rate_factor = 'MEDIUM'
    scn.render.engine = 'BLENDER_EEVEE_NEXT'
    scn.render.filepath = output_path

    # EEVEE Next settings for glossy metal surface
    scn.eevee.use_raytracing      = True
    scn.eevee.ray_tracing_options.resolution_scale = '0.5'

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    bpy.ops.render.render(animation=True)


def main() -> None:
    # 1. Build the spring geometry
    bp.main()

    ob = bpy.data.objects.get(bp.OBJ_NAME)
    if ob is None:
        raise RuntimeError(f"Object '{bp.OBJ_NAME}' not found after blueprint.main()")

    # 2. Camera + lighting
    _setup_camera()
    _setup_lights()

    # 3. Animate one full rotation
    _animate_rotation(ob)

    # 4. Render
    _render(VIDEO_OUT)
    print(f"[record] done → {VIDEO_OUT}")


if __name__ == "__main__":
    main()
