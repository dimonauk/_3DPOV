"""
NLA Action Clips — Viewport Render
public/library/blends/rigging/nla-action-clips-vrm/record.py

Renders a 100-frame (≈4.2 s at 24 fps) demo reel where each of the five
expressions fires sequentially: blink_L, blink_R, happy, angry, aa.

The NLA strips are repositioned from their parallel export layout (all at
frame 1) to a sequential layout (frames 1-20, 21-40, 41-60, 61-80, 81-100)
so the viewer can watch each expression in isolation.  This ONLY affects the
render — blueprint.py has already saved the correct parallel GLB.

Run from Blender with the blend already loaded:
    blender face_nla_vrm.blend --python record.py

Or fully headless (blueprint.py will run first):
    blender --background --python record.py
"""

import bpy
import shutil
import subprocess
from pathlib import Path

HERE = Path(__file__).parent

# Re-run the blueprint if we're launching headless without a loaded scene
if not bpy.data.objects.get("face_nla_vrm"):
    exec(open(HERE / "blueprint.py").read())

obj        = bpy.data.objects["face_nla_vrm"]
shape_keys = obj.data.shape_keys

# ── Output directories ─────────────────────────────────────────────────────────
VIDEO_DIR  = HERE.parents[3] / "videos" / "rigging" / "nla-action-clips-vrm"
FRAMES_DIR = VIDEO_DIR / "frames"
VIDEO_DIR.mkdir(parents=True, exist_ok=True)
FRAMES_DIR.mkdir(exist_ok=True)

# ── Timing ─────────────────────────────────────────────────────────────────────
CLIP_FRAMES = 20
N_CLIPS     = 5
TOTAL       = CLIP_FRAMES * N_CLIPS   # 100 frames

# ── Reposition NLA strips to sequential layout for the demo render ─────────────
# NLA strips from blueprint.py all sit at frame 1 (parallel for export).
# Here we space them end-to-end so each expression occupies its own window.
if shape_keys and shape_keys.animation_data:
    for i, track in enumerate(shape_keys.animation_data.nla_tracks):
        for strip in track.strips:
            strip.frame_start       = float(1 + i * CLIP_FRAMES)
            strip.frame_end         = float((i + 1) * CLIP_FRAMES)
            strip.action_frame_start = 0.0
            strip.action_frame_end   = float(CLIP_FRAMES)

# ── Scene / render settings ────────────────────────────────────────────────────
scene = bpy.context.scene
scene.render.engine                      = "BLENDER_EEVEE_NEXT"
scene.render.resolution_x                = 1920
scene.render.resolution_y                = 1080
scene.render.resolution_percentage       = 100
scene.render.image_settings.file_format  = "PNG"
scene.render.fps                         = 24
scene.frame_start, scene.frame_end       = 1, TOTAL

# ── Camera ─────────────────────────────────────────────────────────────────────
cam_data               = bpy.data.cameras.new("record_cam")
cam_data.lens          = 80   # 80mm portrait crop tightens to face proportions
cam_obj                = bpy.data.objects.new("record_cam", cam_data)
cam_obj.location       = (0.0, -2.2, 0.2)
cam_obj.rotation_euler = (1.48, 0.0, 0.0)   # ~85° pitch toward face centre
bpy.context.collection.objects.link(cam_obj)
scene.camera = cam_obj

# ── Frame-by-frame render ──────────────────────────────────────────────────────
for frame in range(1, TOTAL + 1):
    scene.frame_set(frame)
    outfile              = FRAMES_DIR / f"frame_{frame:04d}.png"
    scene.render.filepath = str(outfile)
    bpy.ops.render.render(write_still=True)
    if frame % 20 == 0:
        print(f"[record] {frame}/{TOTAL} frames done")

print(f"[record] frames written to {FRAMES_DIR}")

# ── Assemble viewport.mp4 via ffmpeg (optional — Blender ships without it) ────
if shutil.which("ffmpeg"):
    subprocess.run([
        "ffmpeg", "-y",
        "-r", str(scene.render.fps),
        "-i", str(FRAMES_DIR / "frame_%04d.png"),
        "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "18",
        str(VIDEO_DIR / "viewport.mp4"),
    ], check=True)
    print(f"[record] viewport.mp4 → {VIDEO_DIR / 'viewport.mp4'}")
else:
    print("[record] ffmpeg not on PATH — assemble frames manually:")
    print(f"  ffmpeg -r 24 -i {FRAMES_DIR}/frame_%04d.png -c:v libx264 viewport.mp4")
