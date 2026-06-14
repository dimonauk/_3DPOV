"""
record.py — Viewport animation: AgX colour stress test
Blender 5.1  |  CC0  |  Holoflow Studio

Renders a 5-second comparison strip cycling through display transforms:
  0:00–0:00  AgX  (default)
  0:01–0:02  AgX - Punchy
  0:02–0:03  Filmic
  0:03–0:04  Standard (linear sRGB clamped)
  0:04–0:05  back to AgX

Run AFTER blueprint.py has built and saved the .blend.
Output: public/library/videos/color-management/color-management-agx-ocio-pipeline/viewport.mp4
"""

import bpy
import os
import math

OUTPUT_MP4  = "//../../../../public/library/videos/color-management/color-management-agx-ocio-pipeline/viewport.mp4"
FPS         = 30
DURATION_S  = 5          # total seconds

# Each segment: (start_frame, end_frame, view_transform, look, label)
SEGMENTS = [
    (1,   30,  'AgX',      'AgX - Medium High Contrast', 'AgX Default'),
    (31,  60,  'AgX',      'AgX - Punchy',               'AgX Punchy'),
    (61,  90,  'Filmic',   'None',                       'Filmic'),
    (91,  120, 'Standard', 'None',                       'Standard (linear)'),
    (121, 150, 'AgX',      'AgX - Medium High Contrast', 'AgX Default'),
]

scene = bpy.context.scene
scene.frame_start = 1
scene.frame_end   = DURATION_S * FPS

scene.render.fps        = FPS
scene.render.resolution_x = 1920
scene.render.resolution_y = 1080

# Use FFMPEG output for .mp4
scene.render.image_settings.file_format = 'FFMPEG'
scene.render.ffmpeg.format              = 'MPEG4'
scene.render.ffmpeg.codec               = 'H264'
scene.render.ffmpeg.constant_rate_factor = 'HIGH'   # good quality CRF 18
scene.render.filepath = bpy.path.abspath(OUTPUT_MP4)

os.makedirs(os.path.dirname(bpy.path.abspath(OUTPUT_MP4)), exist_ok=True)

# ── Insert keyframes for view_transform ────────────────────────────────────────
# Blender cannot keyframe view_settings.view_transform directly via F-Curves
# (it is a string, not a float).  Instead, use a post-frame handler that
# switches the setting based on frame number.

def _switch_transform(scene, depsgraph=None) -> None:
    frame = scene.frame_current
    vs    = scene.view_settings
    for start, end, vt, look, _label in SEGMENTS:
        if start <= frame <= end:
            vs.view_transform = vt
            # 'None' is the correct look string for Filmic / Standard
            # (no additional look grade).
            vs.look           = look
            break

bpy.app.handlers.frame_change_post.clear()
bpy.app.handlers.frame_change_post.append(_switch_transform)

# Also insert a camera dolly: slow arc from -Y to slight +X to add motion
cam = scene.camera
if cam:
    start_loc = (-0.8, -5.5, 2.2)
    end_loc   = ( 1.8, -5.0, 2.2)
    cam.location = start_loc
    cam.keyframe_insert("location", frame=1)
    cam.location = end_loc
    cam.keyframe_insert("location", frame=scene.frame_end)
    # Smooth easing on the camera arc
    for fc in cam.animation_data.action.fcurves:
        for kp in fc.keyframe_points:
            kp.interpolation = 'BEZIER'
            kp.easing        = 'EASE_IN_OUT'

# ── Render ─────────────────────────────────────────────────────────────────────
# bpy.ops.render.render(animation=True) requires the file to be already saved.
# Use write_still=False so Blender writes the video container, not stills.
bpy.ops.render.render(animation=True, write_still=False)

print(f"[holoflow] viewport.mp4 → {bpy.path.abspath(OUTPUT_MP4)}")
