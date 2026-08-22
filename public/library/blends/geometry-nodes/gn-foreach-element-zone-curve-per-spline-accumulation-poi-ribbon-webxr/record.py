"""
record.py — Viewport animation render for the Foreach Spline Ribbon tutorial.

What this renders:
  Frames 1-90: The 8 helical ribbon strands rotate together around the Z axis
  at 2°/frame, viewed from a slightly elevated side angle.  The dark background
  and emission materials give a light-painting aesthetic — each strand glows in
  its characteristic colour as the bundle rotates.

  Run this AFTER blueprint.py has already built the scene and .blend is saved.
  Output: public/library/videos/geometry-nodes/
          gn-foreach-element-zone-curve-per-spline-accumulation-poi-ribbon-webxr/
          viewport.mp4

Usage:
    blender --background hf_poi_ribbons.blend --python record.py
"""

import math
import bpy

# ── Output ────────────────────────────────────────────────────────────────────

SLUG = (
    "gn-foreach-element-zone-curve-per-spline-accumulation-poi-ribbon-webxr"
)
OUT_MP4 = (
    f"//../../videos/geometry-nodes/{SLUG}/viewport.mp4"
)
FRAME_START  = 1
FRAME_END    = 90
FPS          = 30
ROT_PER_FRAME = 2.0   # degrees — one full orbit every 180 frames, ~3 s at 30fps
RENDER_RES_X = 1280
RENDER_RES_Y = 720

# ── Animation ─────────────────────────────────────────────────────────────────

def setup_animation():
    scene = bpy.context.scene
    scene.frame_start = FRAME_START
    scene.frame_end   = FRAME_END

    curves_obj = bpy.data.objects.get("hf_poi_strands")
    if curves_obj is None:
        raise RuntimeError("Run blueprint.py first — hf_poi_strands not found.")

    # Keyframe Z rotation so the whole bundle spins smoothly
    curves_obj.rotation_euler = (0, 0, 0)
    curves_obj.keyframe_insert("rotation_euler", frame=FRAME_START)
    curves_obj.rotation_euler.z = math.radians(ROT_PER_FRAME * (FRAME_END - FRAME_START))
    curves_obj.keyframe_insert("rotation_euler", frame=FRAME_END)

    # Linear interpolation — no easing, constant angular velocity
    for fcurve in curves_obj.animation_data.action.fcurves:
        for kp in fcurve.keyframe_points:
            kp.interpolation = "LINEAR"


# ── Render settings ───────────────────────────────────────────────────────────

def setup_render():
    scene = bpy.context.scene
    scene.render.engine          = "BLENDER_EEVEE_NEXT"
    scene.render.resolution_x    = RENDER_RES_X
    scene.render.resolution_y    = RENDER_RES_Y
    scene.render.fps             = FPS
    scene.render.image_settings.file_format = "FFMPEG"
    scene.render.ffmpeg.format   = "MPEG4"
    scene.render.ffmpeg.codec    = "H264"
    scene.render.ffmpeg.constant_rate_factor = "HIGH"   # CRF ~18
    scene.render.filepath        = bpy.path.abspath(OUT_MP4)

    # EEVEE Next — bloom gives the emission materials a real glow
    eevee = scene.eevee
    eevee.use_bloom = True
    eevee.bloom_intensity  = 0.15
    eevee.bloom_radius     = 3.0
    eevee.bloom_threshold  = 0.8

    # Minimal sample count — viewport record, not final render
    eevee.taa_render_samples = 16


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    setup_animation()
    setup_render()
    bpy.ops.render.render(animation=True)
    print(f"[record] Viewport animation → {bpy.path.abspath(OUT_MP4)}")


main()
