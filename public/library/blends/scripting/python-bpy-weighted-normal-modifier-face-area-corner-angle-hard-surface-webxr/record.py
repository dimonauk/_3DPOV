"""
record.py — Viewport animation for WeightedNormalModifier tutorial.
Output: public/library/videos/scripting/
          python-bpy-weighted-normal-modifier-face-area-corner-angle-hard-surface-webxr/
          viewport.mp4

What it shows:
  Frame   0– 40  All three variant props in frame. Camera slowly orbits.
  Frame  40– 80  Camera pushes in on the main (FACE_AREA) prop, orbiting
                 the chamfered corner to reveal the clean bevel shading.
  Frame  80–120  Camera pulls back; label empties with custom properties
                 visible in viewport show mode names.

Run after blueprint.py (the blend file must be open or passed via -b).
Requires Blender 5.1 invoked with an active window context for OpenGL render.
"""

import bpy
import math
import os

FRAMES     = 120
FPS        = 24
OUTPUT_DIR = "//../../videos/scripting/" \
             "python-bpy-weighted-normal-modifier-face-area-corner-angle-hard-surface-webxr/"

# ---------------------------------------------------------------------------
# Rebuild scene if absent
# ---------------------------------------------------------------------------
if "hf_wn_face_area" not in bpy.data.objects:
    script = bpy.path.abspath("//blueprint.py")
    exec(open(script).read())

# ---------------------------------------------------------------------------
# Camera keyframes
# ---------------------------------------------------------------------------
scene = bpy.context.scene
scene.frame_start = 0
scene.frame_end   = FRAMES - 1
scene.render.fps  = FPS

cam = bpy.data.objects.get("Cam") or scene.camera
if cam is None:
    cam_data = bpy.data.cameras.new("Cam")
    cam      = bpy.data.objects.new("Cam", cam_data)
    bpy.context.collection.objects.link(cam)
    scene.camera = cam

KEYFRAMES = [
    # (frame, location,                 rot_x_deg,  rot_z_deg)
    (0,       (0.0,  -7.0, 3.5),       50,          0   ),
    (40,      (0.0,  -7.0, 3.5),       50,          0   ),
    (70,      (1.2,  -3.2, 1.8),       42,         -18  ),
    (90,      (1.8,  -2.8, 2.2),       48,          20  ),
    (119,     (0.0,  -7.0, 3.5),       50,          0   ),
]
for fr, loc, rx, rz in KEYFRAMES:
    scene.frame_set(fr)
    cam.location        = loc
    cam.rotation_euler  = (math.radians(rx), 0.0, math.radians(rz))
    cam.keyframe_insert('location',       frame=fr)
    cam.keyframe_insert('rotation_euler', frame=fr)

# Ease camera curves
for fc in cam.animation_data.action.fcurves:
    for kp in fc.keyframe_points:
        kp.interpolation = 'BEZIER'
        kp.handle_left_type  = 'AUTO_CLAMPED'
        kp.handle_right_type = 'AUTO_CLAMPED'

# ---------------------------------------------------------------------------
# Render settings — OpenGL viewport capture
# ---------------------------------------------------------------------------
scene.render.resolution_x    = 1920
scene.render.resolution_y    = 1080
scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = 'FFMPEG'
scene.render.ffmpeg.format   = 'MPEG4'
scene.render.ffmpeg.codec    = 'H264'
scene.render.ffmpeg.constant_rate_factor = 'MEDIUM'
scene.render.filepath        = OUTPUT_DIR + "viewport"

# Use EEVEE for fast viewport-quality render
scene.render.engine = 'BLENDER_EEVEE_NEXT'

# ---------------------------------------------------------------------------
# Render
# ---------------------------------------------------------------------------
os.makedirs(bpy.path.abspath(OUTPUT_DIR), exist_ok=True)
bpy.ops.render.opengl(animation=True, sequencer=False)

print("[holoflow] Viewport render complete →", OUTPUT_DIR + "viewport.mp4")
