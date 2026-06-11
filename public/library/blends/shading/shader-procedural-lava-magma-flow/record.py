"""
record.py — viewport-animation render for lava_magma_flow
Outputs: public/library/videos/shading/shader-procedural-lava-magma-flow/viewport.mp4

Run AFTER blueprint.py has been executed (blend file must already exist):
  blender lava_magma_flow.blend --python record.py

The clip shows 5 seconds (120 frames at 24 fps) of the lava surface
slowly scrolling upward, demonstrating the animated crack emission and
the displacement-driven plate topology.

WHY EEVEE NOT CYCLES FOR RECORDING
  Cycles at production quality would take minutes per frame for a 1920×1080
  render with displacement and volumetric-quality emission.  EEVEE Next
  delivers near-identical visual quality for this material because:
    - Emission is a real-time forward-shaded effect in EEVEE
    - Bloom is a native EEVEE post-process (no compositing required)
    - Displacement uses GPU-side tessellation in EEVEE Next
  The record render is intended as a tutorial preview, not a production still.
"""

import bpy
import os

# ── Output path ───────────────────────────────────────────────────────────────
REPO_ROOT   = os.path.abspath(os.path.join(os.path.dirname(__file__),
                                            "../../../../.."))
OUTPUT_DIR  = os.path.join(REPO_ROOT,
    "public", "library", "videos",
    "shading", "shader-procedural-lava-magma-flow")
OUTPUT_FILE = os.path.join(OUTPUT_DIR, "viewport.mp4")
os.makedirs(OUTPUT_DIR, exist_ok=True)

# ── Render settings ───────────────────────────────────────────────────────────
scene = bpy.context.scene
scene.render.engine          = 'BLENDER_EEVEE_NEXT'
scene.render.resolution_x    = 1920
scene.render.resolution_y    = 1080
scene.render.fps             = 24
scene.frame_start            = 1
scene.frame_end              = 120

scene.render.image_settings.file_format    = 'FFMPEG'
scene.render.ffmpeg.format                 = 'MPEG4'
scene.render.ffmpeg.codec                  = 'H264'
scene.render.ffmpeg.constant_rate_factor   = 'MEDIUM'
scene.render.ffmpeg.ffmpeg_preset          = 'GOOD'
scene.render.filepath                      = OUTPUT_FILE

# Bloom on for crack glow halation
scene.eevee.use_bloom       = True
scene.eevee.bloom_threshold = 1.0
scene.eevee.bloom_intensity = 0.25
scene.eevee.bloom_radius    = 4.0

# ── Camera guard ──────────────────────────────────────────────────────────────
cam = bpy.data.objects.get("render_cam")
if cam is None:
    bpy.ops.object.camera_add(location=(0, -2.0, 3.0))
    cam = bpy.context.active_object
    cam.name = "render_cam"
    import math
    cam.rotation_euler = (math.radians(55), 0, 0)

scene.camera = cam

print(f"record.py: rendering frames 1–120 → {OUTPUT_FILE}")
bpy.ops.render.render(animation=True, write_still=False)
print("record.py: done.")
