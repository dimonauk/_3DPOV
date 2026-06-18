# =============================================================================
# record.py — viewport turntable for EEVEE shadow catcher demo
# Run: blender --background ar_composite.blend --python record.py
#
# What it does: rotates the gem 360° over 120 frames under the three-point
# rig while the shadow catcher traces the moving shadow across the ground
# plane. Renders at half-res (640x360) EEVEE Next, exports a frame sequence,
# then encodes to viewport.mp4 via ffmpeg.
#
# The shadow motion is the content of the recording — watching the crisp
# shadow sweep across the transparent ground, then disappear at play-back
# time when composited over a background image, makes the technique legible.
# =============================================================================

import bpy
import os
import subprocess
import math

FRAMES    = 120      # one full rotation
FPS       = 24
OUT_W     = 640
OUT_H     = 360
OUT_DIR   = "//../../videos/rendering/eevee-shadow-catcher-holdout-ar-composite/frames/"
MP4_OUT   = "//../../videos/rendering/eevee-shadow-catcher-holdout-ar-composite/viewport.mp4"

scn = bpy.context.scene
scn.frame_start = 1
scn.frame_end   = FRAMES
scn.render.fps  = FPS
scn.render.resolution_x  = OUT_W
scn.render.resolution_y  = OUT_H
scn.render.film_transparent = True
scn.render.image_settings.file_format  = "PNG"
scn.render.image_settings.color_mode   = "RGBA"
scn.render.filepath = OUT_DIR + "frame_####"
scn.eevee.taa_render_samples = 32   # lighter samples for the motion record

# ── animate gem rotation ─────────────────────────────────────────────────────
gem = bpy.data.objects.get("hero_crystal")
if gem:
    gem.animation_data_create()
    act = bpy.data.actions.new("gem_spin")
    gem.animation_data.action = act
    fc = act.fcurves.new(data_path="rotation_euler", index=2)  # Z axis
    fc.keyframe_points.add(2)
    fc.keyframe_points[0].co = (1,     0.0)
    fc.keyframe_points[1].co = (FRAMES, math.radians(360))
    for kf in fc.keyframe_points:
        kf.interpolation = "LINEAR"

# ── render sequence ──────────────────────────────────────────────────────────
os.makedirs(bpy.path.abspath(OUT_DIR), exist_ok=True)
bpy.ops.render.render(animation=True)

# ── ffmpeg encode ─────────────────────────────────────────────────────────────
abs_dir = bpy.path.abspath(OUT_DIR)
abs_mp4 = bpy.path.abspath(MP4_OUT)
os.makedirs(os.path.dirname(abs_mp4), exist_ok=True)
cmd = [
    "ffmpeg", "-y",
    "-framerate", str(FPS),
    "-i",  os.path.join(abs_dir, "frame_%04d.png"),
    "-c:v", "libx264",
    "-crf", "20",
    "-pix_fmt", "yuv420p",
    abs_mp4,
]
result = subprocess.run(cmd, capture_output=True)
if result.returncode == 0:
    print(f"Encoded: {abs_mp4}")
else:
    print("ffmpeg not found — PNG frames written to:", abs_dir)
    print("Manually encode with:")
    print(f"  ffmpeg -framerate {FPS} -i frame_%04d.png -c:v libx264 -crf 20 -pix_fmt yuv420p viewport.mp4")
