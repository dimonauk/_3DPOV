"""
record.py — viewport animation for modifier-displace-voronoi-organic-terrain-webxr
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Animates Displace.strength from 0 → DISPLACE_STR over 120 frames, showing the
Voronoi ridges growing from a smooth sphere to full organic depth.

Output: public/library/videos/modifiers/modifier-displace-voronoi-organic-terrain-webxr/viewport.mp4

Run: blender --background --python record.py
"""

import bpy
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from blueprint import build_coral, DISPLACE_STR, clear_scene

OUTPUT_VIDEO  = (
    "//../../../../videos/modifiers/"
    "modifier-displace-voronoi-organic-terrain-webxr/viewport.mp4"
)
FRAME_START = 1
FRAME_END   = 120
FPS         = 24


def setup_camera(target_obj):
    bpy.ops.object.camera_add(location=(3.5, -3.2, 1.8))
    cam_obj = bpy.context.active_object
    cam_obj.name = "record_cam"
    bpy.context.scene.camera = cam_obj
    # Track-To constraint points camera at the coral prop
    bpy.ops.object.constraint_add(type='TRACK_TO')
    tc = cam_obj.constraints["Track To"]
    tc.target    = target_obj
    tc.track_axis = 'TRACK_NEGATIVE_Z'
    tc.up_axis    = 'UP_Y'


def setup_lighting():
    bpy.ops.object.light_add(type='SUN', location=(4, 2, 6))
    sun = bpy.context.active_object
    sun.data.energy = 4.0
    sun.data.angle  = 0.52   # ~30 ° soft sun disc
    bpy.ops.object.light_add(type='AREA', location=(-3, -3, 2))
    fill = bpy.context.active_object
    fill.data.energy = 15.0
    fill.data.size   = 4.0


def keyframe_displace_strength(obj):
    disp = obj.modifiers.get("Displace")
    if not disp:
        return
    # Frame 1: flat sphere
    disp.strength = 0.0
    disp.keyframe_insert("strength", frame=FRAME_START)
    # Frame 120: full displacement
    disp.strength = DISPLACE_STR
    disp.keyframe_insert("strength", frame=FRAME_END)
    # EXPO interpolation — convex ease-in mimics organic growth
    action = obj.animation_data.action
    for fc in action.fcurves:
        if "strength" in fc.data_path:
            for kp in fc.keyframe_points:
                kp.interpolation = 'EXPO'


def setup_render():
    scene = bpy.context.scene
    scene.frame_start = FRAME_START
    scene.frame_end   = FRAME_END
    scene.render.fps  = FPS

    scene.render.engine = 'BLENDER_EEVEE_NEXT'
    # EEVEE Next (Blender 4.2+); falls back to BLENDER_EEVEE on older builds
    scene.eevee.shadow_cube_size    = '512'
    scene.eevee.use_bloom           = False   # no bloom for clean shape-read

    scene.render.filepath = OUTPUT_VIDEO
    scene.render.image_settings.file_format = 'FFMPEG'
    scene.render.ffmpeg.format              = 'MPEG4'
    scene.render.ffmpeg.codec               = 'H264'
    scene.render.ffmpeg.constant_rate_factor = 'MEDIUM'
    scene.render.resolution_x   = 1920
    scene.render.resolution_y   = 1080
    scene.render.resolution_percentage = 100


if __name__ == '__main__':
    obj, _disp = build_coral()

    # Flat shading so displacement facets read clearly in animation
    bpy.ops.object.select_all(action='DESELECT')
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.shade_flat()

    setup_camera(obj)
    setup_lighting()
    keyframe_displace_strength(obj)
    setup_render()

    # Ensure output directory exists
    out_dir = os.path.join(
        os.path.dirname(os.path.abspath(__file__)),
        "../../../../public/library/videos/modifiers/"
        "modifier-displace-voronoi-organic-terrain-webxr"
    )
    os.makedirs(out_dir, exist_ok=True)

    bpy.ops.render.render(animation=True)
    print("✓ viewport.mp4 rendered — 120 frames @ 24 fps.")
