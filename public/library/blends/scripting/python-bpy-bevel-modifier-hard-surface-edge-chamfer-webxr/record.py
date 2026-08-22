"""
record.py — Viewport animation for BevelModifier tutorial.
Output: public/library/videos/scripting/
          python-bpy-bevel-modifier-hard-surface-edge-chamfer-webxr/
          viewport.mp4

What it shows:
  Frame   0– 35  Wide establishing shot of the panel in MatCap shading.
                 Camera orbits slowly to reveal the bevelled outer rim.
  Frame  35– 75  Camera pushes in on a corner where three bevel strips
                 meet via MITER_PATCH — shows the patch fill polygon.
  Frame  75–115  Camera swings to the inset border and raised platform;
                 shows the narrow inner-bevel strips.
  Frame 115–144  Camera returns to full-panel establishing shot.

Run after blueprint.py produces hf_bevel_panel.blend.
"""

import bpy
import math
import os

FRAMES     = 144
FPS        = 24
OUTPUT_DIR = (
    "//../../videos/scripting/"
    "python-bpy-bevel-modifier-hard-surface-edge-chamfer-webxr/"
)

# ---------------------------------------------------------------------------
# Rebuild if scene is empty
# ---------------------------------------------------------------------------
if "hf_bevel_panel" not in bpy.data.objects:
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
    bpy.ops.object.camera_add()
    cam = bpy.context.object
    cam.name = "Cam"
    cam.data.lens = 85.0
    scene.camera = cam

KEYFRAMES = [
    # (frame, location,               rx_deg, rz_deg)
    (0,       (0.00, -0.44, 0.20),   56,      0),
    (35,      (0.00, -0.44, 0.20),   56,      0),
    (60,      (0.12, -0.20, 0.14),   44,    -16),
    (80,      (0.14, -0.18, 0.14),   40,    -24),
    (100,     (-0.02, -0.28, 0.18),  50,     12),
    (125,     (-0.06, -0.32, 0.22),  58,     10),
    (144,     (0.00, -0.44, 0.20),   56,      0),
]

for fr, loc, rx, rz in KEYFRAMES:
    scene.frame_set(fr)
    cam.location       = loc
    cam.rotation_euler = (math.radians(rx), 0.0, math.radians(rz))
    cam.keyframe_insert('location',       frame=fr)
    cam.keyframe_insert('rotation_euler', frame=fr)

for fc in cam.animation_data.action.fcurves:
    for kp in fc.keyframe_points:
        kp.interpolation     = 'BEZIER'
        kp.handle_left_type  = 'AUTO_CLAMPED'
        kp.handle_right_type = 'AUTO_CLAMPED'

# ---------------------------------------------------------------------------
# Render settings
# ---------------------------------------------------------------------------
scene.render.resolution_x = 1920
scene.render.resolution_y = 1080
scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = 'FFMPEG'
scene.render.ffmpeg.format   = 'MPEG4'
scene.render.ffmpeg.codec    = 'H264'
scene.render.ffmpeg.constant_rate_factor = 'MEDIUM'
scene.render.filepath        = OUTPUT_DIR + "viewport"
scene.render.engine          = 'BLENDER_EEVEE_NEXT'

# ---------------------------------------------------------------------------
# Render
# ---------------------------------------------------------------------------
os.makedirs(bpy.path.abspath(OUTPUT_DIR), exist_ok=True)
bpy.ops.render.opengl(animation=True, sequencer=False)
print("[holoflow] Viewport render →", OUTPUT_DIR + "viewport.mp4")
