"""
record.py — OIDN Denoise comparison animation
Renders two segments: frames 1-30 muted (raw noise), frames 31-60 denoised.
Output: public/library/videos/compositing/compositor-oidn-denoise-cycles-passes/viewport.mp4

Run AFTER blueprint.py.  The scene must already be configured.
"""

import bpy
import os
import math

OUT_DIR  = "//../../../../../../public/library/videos/compositing/compositor-oidn-denoise-cycles-passes/"
TOTAL_FRAMES   = 60
MUTED_FRAMES   = 30   # first 30 frames: denoiser muted (raw noise)
# frames 31-60: denoiser active
SPHERE_SPIN    = 180  # total degrees of rotation over the clip

scene   = bpy.context.scene
ct      = scene.node_tree

# Locate the Denoise compositor node created by blueprint.py
denoise_node = next(
    (n for n in ct.nodes if n.bl_idname == "CompositorNodeDenoise"), None
)
if denoise_node is None:
    raise RuntimeError("Run blueprint.py first — no Denoise node found.")

# ── Render settings for animation ─────────────────────────────────────────────
scene.render.resolution_x        = 1920
scene.render.resolution_y        = 1080
scene.frame_start                = 1
scene.frame_end                  = TOTAL_FRAMES
scene.render.image_settings.file_format = "FFMPEG"
scene.render.ffmpeg.format            = "MPEG4"
scene.render.ffmpeg.codec             = "H264"
scene.render.ffmpeg.constant_rate_factor = "HIGH"
scene.render.ffmpeg.ffmpeg_preset     = "GOOD"
scene.render.filepath = os.path.join(OUT_DIR, "viewport.mp4")

# ── Slow the sphere slightly for the clip ─────────────────────────────────────
sphere = bpy.data.objects.get("StoneSphere")
if sphere:
    sphere.animation_data_clear()
    sphere.rotation_euler = (0.0, 0.0, 0.0)
    sphere.keyframe_insert("rotation_euler", frame=1)
    sphere.rotation_euler = (0.0, 0.0, math.radians(SPHERE_SPIN))
    sphere.keyframe_insert("rotation_euler", frame=TOTAL_FRAMES)
    # Set LINEAR interpolation so velocity is constant — no ease-in/out
    if sphere.animation_data and sphere.animation_data.action:
        for fc in sphere.animation_data.action.fcurves:
            for kp in fc.keyframe_points:
                kp.interpolation = "LINEAR"

# ── Frame change handler: toggle denoiser per segment ─────────────────────────
def _toggle_denoise(scene_ref):
    """Mute Denoise node for first MUTED_FRAMES; unmute for the rest."""
    denoise_node.mute = scene_ref.frame_current <= MUTED_FRAMES

bpy.app.handlers.frame_change_pre.clear()
bpy.app.handlers.frame_change_pre.append(_toggle_denoise)

# Create output directory if needed
abs_out = bpy.path.abspath(OUT_DIR)
os.makedirs(abs_out, exist_ok=True)

print(f"Rendering {TOTAL_FRAMES} frames → {abs_out}")
print(f"  Frames  1–{MUTED_FRAMES}: denoiser MUTED   (raw noise)")
print(f"  Frames {MUTED_FRAMES+1}–{TOTAL_FRAMES}: denoiser ACTIVE (OIDN clean)")

bpy.ops.render.render(animation=True)

# ── Cleanup ───────────────────────────────────────────────────────────────────
bpy.app.handlers.frame_change_pre.remove(_toggle_denoise)
denoise_node.mute = False  # restore denoised state after recording

print("record.py complete.")
print(f"Output: {abs_out}viewport.mp4")
