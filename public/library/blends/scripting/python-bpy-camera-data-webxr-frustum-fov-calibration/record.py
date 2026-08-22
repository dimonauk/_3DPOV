"""
record.py — Viewport-animation recorder for the Camera Intrinsics tutorial
Blender 5.1 | CC0

Renders a 3-second (72-frame) sequence of the orbit_cam circling the subject
icosphere, then stitches the frames into viewport.mp4 via FFmpeg.

Run after blueprint.py has been executed in the same .blend session.
"""

import bpy, os

OUTPUT_DIR = bpy.path.abspath("//viewport_frames/")
OUTPUT_MP4 = bpy.path.abspath("//viewport.mp4")

FRAME_START = 1
FRAME_END   = 72
FPS         = 24

# ── Render settings ──────────────────────────────────────────────────────────
scene = bpy.context.scene
scene.render.engine         = 'BLENDER_EEVEE_NEXT'
scene.render.resolution_x   = 1280
scene.render.resolution_y   = 720
scene.render.fps            = FPS
scene.render.image_settings.file_format = 'JPEG'
scene.render.image_settings.quality     = 92

# Use the orbit_cam created by blueprint.py
cam_obj = bpy.data.objects.get("orbit_cam")
if cam_obj is None:
    raise RuntimeError("Run blueprint.py first — orbit_cam not found in scene.")
scene.camera = cam_obj

# EEVEE: keep samples low for a quick preview render
if hasattr(scene, 'eevee'):
    scene.eevee.taa_render_samples = 32

os.makedirs(OUTPUT_DIR, exist_ok=True)

# ── Frame render loop ─────────────────────────────────────────────────────────
for frame in range(FRAME_START, FRAME_END + 1):
    scene.frame_set(frame)
    scene.render.filepath = os.path.join(OUTPUT_DIR, f"frame_{frame:04d}")
    bpy.ops.render.render(write_still=True)
    print(f"[record] frame {frame}/{FRAME_END}")

# ── FFmpeg stitch ─────────────────────────────────────────────────────────────
ffmpeg_cmd = (
    f'ffmpeg -y -framerate {FPS} '
    f'-i "{os.path.join(OUTPUT_DIR, "frame_%04d.jpg")}" '
    f'-c:v libx264 -pix_fmt yuv420p -crf 20 '
    f'"{OUTPUT_MP4}"'
)
print(f"[record] stitching → {OUTPUT_MP4}")
os.system(ffmpeg_cmd)
print("[record] Done.  viewport.mp4 ready.")
