"""
record.py — viewport-animation render for holographic_panel
Outputs: public/library/videos/shading/shader-holographic-panel-emission-fresnel/viewport.mp4

Run AFTER blueprint.py (blend file must already exist):
  blender holographic_panel.blend --python record.py

The clip shows 6.25 s (150 frames at 24 fps):
  • Scan lines scroll upward continuously (frame-driven UV animation)
  • Camera slowly arcs rightward (15° of orbit) to reveal the Fresnel edge
    glow brightening at the panel's silhouette rim
  • Bloom halo breathes around the brighter scan-line crossings

WHY EEVEE-NEXT NOT CYCLES
  Transparency with alpha blending and Bloom are both EEVEE-specific
  real-time features.  Cycles does not support surface_render_method =
  'FORWARD' or real-time Bloom — the panel would render solid in Cycles.
  EEVEE-Next delivers identical visual quality for this shader and renders
  each frame in ~0.1–0.2 s on modern hardware.
"""

import bpy
import math
import os

# ── Output path ────────────────────────────────────────────────────────────────
_HERE      = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT  = os.path.abspath(os.path.join(_HERE, "../../../../.."))
OUTPUT_DIR = os.path.join(
    REPO_ROOT, "public", "library", "videos",
    "shading", "shader-holographic-panel-emission-fresnel",
)
OUTPUT_MP4 = os.path.join(OUTPUT_DIR, "viewport.mp4")
os.makedirs(OUTPUT_DIR, exist_ok=True)

TOTAL_FRAMES = 150

# ── Render settings ────────────────────────────────────────────────────────────
scene = bpy.context.scene
scene.render.engine                        = 'BLENDER_EEVEE_NEXT'
scene.render.resolution_x                  = 1920
scene.render.resolution_y                  = 1080
scene.render.fps                           = 24
scene.frame_start                          = 1
scene.frame_end                            = TOTAL_FRAMES
scene.render.image_settings.file_format    = 'FFMPEG'
scene.render.ffmpeg.format                 = 'MPEG4'
scene.render.ffmpeg.codec                  = 'H264'
scene.render.ffmpeg.constant_rate_factor   = 'MEDIUM'
scene.render.ffmpeg.ffmpeg_preset          = 'GOOD'
scene.render.filepath                      = OUTPUT_MP4

scene.eevee.use_bloom       = True
scene.eevee.bloom_threshold = 0.8
scene.eevee.bloom_intensity = 0.35
scene.eevee.bloom_radius    = 5.0

# ── Camera orbit keyframes ─────────────────────────────────────────────────────
cam = bpy.data.objects.get("render_cam")
if cam is None:
    bpy.ops.object.camera_add(
        location=(1.4, -2.8, 0.9),
        rotation=(math.radians(72), 0, math.radians(28)),
    )
    cam = bpy.context.active_object
    cam.name = "render_cam"
scene.camera = cam

# Animate: slow arc from 28° to 43° Z rotation to sweep the Fresnel glow
cam.rotation_euler = (math.radians(72), 0, math.radians(28))
cam.keyframe_insert(data_path="rotation_euler", frame=1)

cam.rotation_euler = (math.radians(72), 0, math.radians(43))
cam.keyframe_insert(data_path="rotation_euler", frame=TOTAL_FRAMES)

# Ease in/out
for fcurve in cam.animation_data.action.fcurves:
    for kfp in fcurve.keyframe_points:
        kfp.interpolation = 'BEZIER'
        kfp.easing = 'EASE_IN_OUT'

# ── Render ─────────────────────────────────────────────────────────────────────
print(f"record.py: rendering frames 1–{TOTAL_FRAMES} → {OUTPUT_MP4}")
bpy.ops.render.render(animation=True, write_still=False)
print("record.py: done.")
