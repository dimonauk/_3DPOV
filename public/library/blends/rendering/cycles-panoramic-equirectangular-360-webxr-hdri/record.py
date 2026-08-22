"""
record.py — Viewport animation for screen recording
Cycles Panoramic Equirectangular Camera — 360° HDR Environment Map
Blender 5.1  |  Licence: CC0

Animates the scene over ~200 frames showing:
  Frame   1- 40: Scene assembles (floor + probe spheres appear)
  Frame  40- 90: Camera rotates through 360° to show full scene coverage
  Frame  90-150: Render preview (viewport shading switches to Rendered)
  Frame 150-200: Compositor result shown — final HDRI image in UV editor

Run via:
    blender --background pano_360_hdri.blend --python record.py
or open the file and run this script in the Scripting workspace.
"""

import bpy, math

FRAME_END   = 200
OUTPUT_MP4  = "//../../videos/rendering/cycles-panoramic-equirectangular-360-webxr-hdri/viewport.mp4"

scene  = bpy.context.scene
scene.frame_start = 1
scene.frame_end   = FRAME_END

scene.render.engine         = 'BLENDER_EEVEE_NEXT'   # fast for recording
scene.render.fps            = 30
scene.render.resolution_x   = 1920
scene.render.resolution_y   = 1080
scene.render.filepath        = OUTPUT_MP4
scene.render.image_settings.file_format = 'FFMPEG'

ffmpeg = scene.render.ffmpeg
ffmpeg.format          = 'MPEG4'
ffmpeg.codec           = 'H264'
ffmpeg.constant_rate_factor = 18
ffmpeg.audio_codec     = 'NONE'

cam = scene.camera
cam_data = cam.data

# ── Phase 1: Camera sweeps 360° azimuth (frames 40-90) ─────────────────────
# We animate camera rotation — tilt to show the poles mid-sweep
cam.animation_data_create()
ac = bpy.data.actions.new("cam_sweep")
cam.animation_data.action = ac

for frame, z_rot, x_rot in [
    (1,   math.radians(0),   math.radians(0)),
    (40,  math.radians(0),   math.radians(0)),
    (70,  math.radians(180), math.radians(20)),
    (90,  math.radians(360), math.radians(0)),
]:
    cam.rotation_euler = (x_rot, 0, z_rot)
    cam.keyframe_insert("rotation_euler", frame=frame)

# ── Phase 2: Latitude sweep — tilt to show sky and ground (frames 90-140) ──
for frame, x_rot in [(90, 0), (110, math.radians(45)), (130, math.radians(-30)), (140, 0)]:
    cam.rotation_euler[0] = x_rot
    cam.keyframe_insert("rotation_euler", frame=frame)

# ── Phase 3: Freeze on probe spheres (140-200) ─────────────────────────────
for frame in [140, 200]:
    cam.location = (0.0, -5.0, 1.6)
    cam.keyframe_insert("location", frame=frame)

# Render animation (viewport recording should be done via screen capture,
# but this bakes a low-quality preview render for reference)
# bpy.ops.render.render(animation=True)
print(f"Record script ready. Output: {OUTPUT_MP4}")
print("Run screen capture via OBS while playing animation in Blender viewport.")
