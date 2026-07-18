"""
record.py — Viewport animation for SolidifyModifier tutorial.
Output: public/library/videos/scripting/
          python-bpy-solidify-modifier-shell-rim-complex-mode-hard-surface-webxr/
          viewport.mp4

What it shows:
  Frame   0– 30  Establishing wide shot — full pauldron in MATERIAL preview.
                 Camera orbits slowly right to reveal the outer blue-steel face.
  Frame  30– 65  Camera pushes to the left arc rim, showing the gold trim cap.
  Frame  65–100  Camera pulls to show the inner shell surface and the closed
                 boundary where Solidify prevents the open-edge gap.
  Frame 100–130  Camera returns to ¾ front angle — final hero shot.

Run AFTER blueprint.py has produced hf_pauldron_shell.blend.
"""

import bpy
import math
import os

FRAMES     = 130
FPS        = 24
OUTPUT_DIR = (
    "//../../videos/scripting/"
    "python-bpy-solidify-modifier-shell-rim-complex-mode-hard-surface-webxr/"
)

# ---------------------------------------------------------------------------
# Rebuild if scene empty
# ---------------------------------------------------------------------------
if "hf_pauldron" not in bpy.data.objects:
    script_path = bpy.path.abspath("//blueprint.py")
    exec(open(script_path).read())

# ---------------------------------------------------------------------------
# Ensure output directory exists
# ---------------------------------------------------------------------------
abs_out = bpy.path.abspath(OUTPUT_DIR)
os.makedirs(abs_out, exist_ok=True)

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
    cam.data.lens = 90
    scene.camera = cam

KEYS = [
    # (frame, location,              euler_xyz_deg)
    (0,       ( 0.18, -0.26,  0.06), (82,  0,  32)),
    (30,      ( 0.18, -0.26,  0.06), (82,  0,  32)),
    (55,      (-0.16, -0.22,  0.06), (82,  0, -28)),
    (70,      (-0.16, -0.22,  0.06), (82,  0, -28)),
    (95,      ( 0.00,  0.28,  0.04), (82,  0, 178)),
    (115,     ( 0.16, -0.24,  0.08), (80,  0,  28)),
    (130,     ( 0.16, -0.24,  0.08), (80,  0,  28)),
]

for fr, loc, rot in KEYS:
    scene.frame_set(fr)
    cam.location = loc
    cam.rotation_euler = tuple(math.radians(d) for d in rot)
    cam.keyframe_insert("location")
    cam.keyframe_insert("rotation_euler")

# Smooth interpolation
for fc in cam.animation_data.action.fcurves:
    for kp in fc.keyframe_points:
        kp.interpolation = 'BEZIER'

# ---------------------------------------------------------------------------
# Render settings
# ---------------------------------------------------------------------------
scene.render.engine              = 'BLENDER_EEVEE_NEXT'
scene.render.resolution_x        = 1920
scene.render.resolution_y        = 1080
scene.render.image_settings.file_format = 'FFMPEG'
scene.render.ffmpeg.format       = 'MPEG4'
scene.render.ffmpeg.codec        = 'H264'
scene.render.ffmpeg.constant_rate_factor = 'HIGH'
scene.render.filepath            = OUTPUT_DIR + "viewport"

bpy.ops.render.render(animation=True)
print(f"✓ viewport.mp4 → {abs_out}")
