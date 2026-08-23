# SPDX-License-Identifier: CC0-1.0
"""
record.py — Bloch Sphere viewport animation
============================================
Renders a 150-frame sequence (5 s at 30 fps) using EEVEE NEXT.

Timeline
--------
  0 – 40   Basis (Rabi great circle) in view — orbit the camera 90° around the Z axis
  40 – 90  SK_Berry fade-in (shape key 0 → 1) — morph from great circle to latitude loop
  90 – 120 SK_DoubleLoop fade-in (SK_Berry 1→0, SK_DoubleLoop 0→1) — two-arc spinor path
  120 – 150 Camera orbits back — both keys at 0, Basis visible again

Output
------
  public/library/videos/scripting/
    python-numpy-bloch-sphere-qubit-rabi-precession-berry-phase-su2-pauli-poi-webxr/
      viewport.mp4   (1920 × 1080, 30 fps, MPEG-4 / H.264)

Run this script from Blender's Text Editor after running blueprint.py, or via:
    blender --background --python record.py
"""

import math
import bpy
from pathlib import Path

# ── Output path ───────────────────────────────────────────────────────────────
SLUG     = "python-numpy-bloch-sphere-qubit-rabi-precession-berry-phase-su2-pauli-poi-webxr"
OUT_DIR  = Path(bpy.data.filepath).parent.parent.parent.parent.parent / \
           "public" / "library" / "videos" / "scripting" / SLUG
OUT_DIR.mkdir(parents=True, exist_ok=True)
OUT_FILE = str(OUT_DIR / "viewport.mp4")

TOTAL_FRAMES = 150
FPS          = 30

# ── Scene / render settings ───────────────────────────────────────────────────
scene = bpy.context.scene
scene.render.engine         = "BLENDER_EEVEE_NEXT"
scene.render.resolution_x   = 1920
scene.render.resolution_y   = 1080
scene.render.fps             = FPS
scene.frame_start            = 1
scene.frame_end              = TOTAL_FRAMES
scene.render.image_settings.file_format = "FFMPEG"
scene.render.ffmpeg.format              = "MPEG4"
scene.render.ffmpeg.codec               = "H264"
scene.render.ffmpeg.constant_rate_factor = "HIGH"
scene.render.filepath = OUT_FILE

# ── Camera setup ──────────────────────────────────────────────────────────────
# Position camera at distance 0.35 m from origin, tilted slightly above equator
cam_data = bpy.data.cameras.new("BlochCam")
cam      = bpy.data.objects.new("BlochCam", cam_data)
bpy.context.scene.collection.objects.link(cam)
cam_data.lens    = 50.0    # 50 mm focal length — moderate perspective
cam.location     = (0.30, -0.30, 0.12)
cam.rotation_euler = (math.radians(78), 0, math.radians(45))
scene.camera     = cam

# ── World / background ────────────────────────────────────────────────────────
world = bpy.data.worlds.new("BlochWorld")
world.use_nodes = True
bg = world.node_tree.nodes.get("Background")
if bg:
    bg.inputs["Color"].default_value  = (0.01, 0.01, 0.03, 1.0)   # very dark blue
    bg.inputs["Strength"].default_value = 1.0
scene.world = world

# ── Object reference ──────────────────────────────────────────────────────────
obj = bpy.data.objects.get("Bloch_Trajectory")
if obj is None:
    raise RuntimeError("Run blueprint.py first to create 'Bloch_Trajectory'")

# ── Camera orbit (frames 0–40 and 120–150) ───────────────────────────────────
def _keyframe_cam_orbit(cam_obj, frame_start, frame_end, start_deg, end_deg):
    """Rotate camera around Z axis on a fixed orbital radius."""
    radius = math.sqrt(cam_obj.location.x**2 + cam_obj.location.y**2)
    z_loc  = cam_obj.location.z
    for fr in range(frame_start, frame_end + 1):
        t     = (fr - frame_start) / max(frame_end - frame_start, 1)
        angle = math.radians(start_deg + t * (end_deg - start_deg))
        cam_obj.location.x = radius * math.cos(angle)
        cam_obj.location.y = radius * math.sin(angle)
        cam_obj.location.z = z_loc
        # Keep camera always pointing at origin
        cam_obj.rotation_euler.z = angle + math.radians(90)
        cam_obj.keyframe_insert("location",       frame=fr)
        cam_obj.keyframe_insert("rotation_euler", frame=fr)

_keyframe_cam_orbit(cam, 1,   40,  135, 225)    # orbit 90° during Basis display
_keyframe_cam_orbit(cam, 120, 150, 225, 315)    # orbit 90° back on return

# ── Shape key animation ───────────────────────────────────────────────────────
keys = obj.data.shape_keys
if keys:
    sk_berry  = keys.key_blocks.get("SK_Berry")
    sk_double = keys.key_blocks.get("SK_DoubleLoop")

    def _kf(sk, val, fr):
        sk.value = val
        sk.keyframe_insert("value", frame=fr)

    # SK_Berry: 0 at frame 40, 1 at frame 70, 1 at frame 90, 0 at frame 115
    if sk_berry:
        _kf(sk_berry, 0.0, 1)
        _kf(sk_berry, 0.0, 40)
        _kf(sk_berry, 1.0, 70)
        _kf(sk_berry, 1.0, 90)
        _kf(sk_berry, 0.0, 115)
        _kf(sk_berry, 0.0, TOTAL_FRAMES)

    # SK_DoubleLoop: 0 at frame 90, 1 at frame 110, 1 at frame 115, 0 at frame 120
    if sk_double:
        _kf(sk_double, 0.0, 1)
        _kf(sk_double, 0.0, 90)
        _kf(sk_double, 1.0, 110)
        _kf(sk_double, 1.0, 115)
        _kf(sk_double, 0.0, 120)
        _kf(sk_double, 0.0, TOTAL_FRAMES)

# ── Render ────────────────────────────────────────────────────────────────────
print(f"[Bloch record] Rendering {TOTAL_FRAMES} frames → {OUT_FILE}")
bpy.ops.render.render(animation=True)
print("[Bloch record] Done.")
