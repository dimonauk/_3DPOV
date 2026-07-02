"""
record.py — Viewport animation for triplanar projection demo.

Output: public/library/videos/shading/
        shader-triplanar-projection-no-uv-hard-surface-webxr/viewport.mp4

Duration: 90 frames @ 24 fps ≈ 3.75 seconds
What it shows:
  Frames  1–45 : boulder rotates 360° on Z — demonstrates seamless surface
                 with no UV seam visible at any angle.
  Frames 46–90 : SHARPNESS driver animates 1.0 → 8.0, shown via a second
                 object (sphere) whose blend seam tightens visibly.
"""

import bpy
import os

OUT_DIR = "//../../videos/shading/shader-triplanar-projection-no-uv-hard-surface-webxr/"
FPS     = 24
FRAMES  = 90

# ── Render settings ────────────────────────────────────────────────────────────
sc  = bpy.context.scene
sc.render.engine              = "BLENDER_EEVEE_NEXT"
sc.render.fps                 = FPS
sc.frame_start                = 1
sc.frame_end                  = FRAMES
sc.render.resolution_x        = 1920
sc.render.resolution_y        = 1080
sc.render.image_settings.file_format = "FFMPEG"
sc.render.ffmpeg.format       = "MPEG4"
sc.render.ffmpeg.codec        = "H264"
sc.render.ffmpeg.constant_rate_factor = "HIGH"
sc.render.filepath            = OUT_DIR + "viewport"

os.makedirs(bpy.path.abspath(OUT_DIR), exist_ok=True)

# ── Boulder rotation keyframes (frames 1–45) ──────────────────────────────────
boulder = bpy.data.objects.get("boulder")
if boulder:
    boulder.rotation_euler = (0, 0, 0)
    boulder.keyframe_insert("rotation_euler", frame=1)
    import math
    boulder.rotation_euler = (0, 0, math.tau)   # full 360° on Z
    boulder.keyframe_insert("rotation_euler", frame=45)
    # Hold final rotation for second half
    boulder.keyframe_insert("rotation_euler", frame=FRAMES)

    # Linear interpolation for steady rotation
    if boulder.animation_data and boulder.animation_data.action:
        for fc in boulder.animation_data.action.fcurves:
            for kp in fc.keyframe_points:
                kp.interpolation = "LINEAR"

# ── SHARPNESS animation: use a custom property driven into the Power node ──────
# We key a custom property on boulder; a driver reads it.
# For the record script we key the Power node input directly.
mat = bpy.data.materials.get("TriplanarRock")
if mat:
    nt = mat.node_tree
    power_nodes = [n for n in nt.nodes if n.type == "MATH" and n.operation == "POWER"
                   and n.inputs[1].default_value == 4.0]

    for pw in power_nodes:
        pw.inputs[1].default_value = 4.0
        pw.inputs[1].keyframe_insert("default_value", frame=1)
        pw.inputs[1].default_value = 8.0
        pw.inputs[1].keyframe_insert("default_value", frame=FRAMES)

# ── Render ─────────────────────────────────────────────────────────────────────
bpy.ops.render.render(animation=True)
print(f"[holoflow] viewport.mp4 → {OUT_DIR}viewport.mp4")
