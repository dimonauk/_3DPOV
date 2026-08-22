# SPDX-License-Identifier: CC0-1.0
"""
record.py — Viewport animation for the Chua Double-Scroll Attractor poi head.
Holoflow Studio · Blender 5.1

Run AFTER blueprint.py has created the scene.  Adds an orbit camera, sets up
a Workbench render (VERTEX colour display), animates shape-key transitions,
and renders to:
  public/library/videos/scripting/
    python-numpy-chua-circuit-double-scroll-shilnikov-chaos-piecewise-linear-bishop-tube-poi-webxr/
      viewport.mp4

Total: 192 frames @ 24 fps ≈ 8 seconds.

Phases
------
  F  1– 48  Basis   double scroll, full 360° orbit (α=9 canonical)
  F 49– 96  SK_Dense morphed in (α=10.5, denser arms), hold + orbit
  F 97–144  SK_Tight morphed in (β=18, tighter loops), hold + orbit
  F145–192  SK_Wide  morphed in (α=11.8, spread arms), return to Basis
"""

import bpy
import os
import math

# ── Output path ──────────────────────────────────────────────────────────────
VIDEO_DIR = os.path.normpath(os.path.join(
    bpy.path.abspath("//"),
    "..", "..", "..", "videos", "scripting",
    "python-numpy-chua-circuit-double-scroll-shilnikov-chaos-"
    "piecewise-linear-bishop-tube-poi-webxr",
))
os.makedirs(VIDEO_DIR, exist_ok=True)

# ── Scene / render settings ───────────────────────────────────────────────────
scn = bpy.context.scene
scn.frame_start = 1
scn.frame_end   = 192
scn.render.fps  = 24

scn.render.engine              = "BLENDER_WORKBENCH"
scn.render.resolution_x        = 1920
scn.render.resolution_y        = 1080
scn.render.filepath            = os.path.join(VIDEO_DIR, "viewport")
scn.render.image_settings.file_format = "FFMPEG"
scn.render.ffmpeg.format       = "MPEG4"
scn.render.ffmpeg.codec        = "H264"
scn.render.ffmpeg.constant_rate_factor = "MEDIUM"

shading = scn.display.shading
shading.light              = "FLAT"
shading.color_type         = "VERTEX"
shading.show_backface_culling = False

# ── Camera: smooth orbit ──────────────────────────────────────────────────────
cam_data = bpy.data.cameras.new("RecCam")
cam_data.lens = 85
cam_obj = bpy.data.objects.new("RecCam", cam_data)
bpy.context.collection.objects.link(cam_obj)
scn.camera = cam_obj

ORBIT_R    = 0.45   # orbit radius (metres)
CAM_ELEV   = 28.0   # elevation angle (degrees)
elev_rad   = math.radians(CAM_ELEV)
ORBIT_TURNS = 1.5   # total rotations over 192 frames

for fr in range(1, 193):
    t = (fr - 1) / 191.0           # 0 → 1 over the full clip
    az = 2.0 * math.pi * ORBIT_TURNS * t
    cx = ORBIT_R * math.cos(az) * math.cos(elev_rad)
    cy = ORBIT_R * math.sin(az) * math.cos(elev_rad)
    cz = ORBIT_R * math.sin(elev_rad)
    cam_obj.location = (cx, cy, cz)
    dx, dy, dz = -cx, -cy, -cz
    yaw   = math.atan2(dy, dx)
    pitch = math.atan2(-dz, math.sqrt(dx**2 + dy**2))
    cam_obj.rotation_euler = (math.pi / 2 + pitch, 0.0, yaw + math.pi / 2)
    cam_obj.keyframe_insert("location",       frame=fr)
    cam_obj.keyframe_insert("rotation_euler", frame=fr)

# ── Light ─────────────────────────────────────────────────────────────────────
sun = bpy.data.lights.new("Sun", type="SUN")
sun.energy = 3.0
sun_obj = bpy.data.objects.new("Sun", sun)
bpy.context.collection.objects.link(sun_obj)
sun_obj.rotation_euler = (math.radians(45), 0.0, math.radians(30))

# ── Shape-key animation ───────────────────────────────────────────────────────
mesh_obj = bpy.data.objects.get("hf_chua_doi")
if mesh_obj and mesh_obj.data.shape_keys:
    kb = mesh_obj.data.shape_keys.key_blocks
    SK_NAMES = ["SK_Dense", "SK_Tight", "SK_Wide"]
    # zero out all non-basis keys at frame 1
    for name in SK_NAMES:
        if name in kb:
            kb[name].value = 0.0
            kb[name].keyframe_insert("value", frame=1)

    # phase definitions: (sk_name, fade_in_start, fade_in_end, hold_end, fade_out_end)
    phases = [
        ("SK_Dense",  48,  68,  96, 116),
        ("SK_Tight",  96, 116, 144, 164),
        ("SK_Wide",  144, 164, 180, 192),
    ]
    for sk_name, fi_s, fi_e, ho_e, fo_e in phases:
        if sk_name not in kb:
            continue
        kb[sk_name].value = 0.0; kb[sk_name].keyframe_insert("value", frame=fi_s)
        kb[sk_name].value = 1.0; kb[sk_name].keyframe_insert("value", frame=fi_e)
        kb[sk_name].value = 1.0; kb[sk_name].keyframe_insert("value", frame=ho_e)
        kb[sk_name].value = 0.0; kb[sk_name].keyframe_insert("value", frame=fo_e)

# ── Render ────────────────────────────────────────────────────────────────────
bpy.ops.render.render(animation=True)
print(f"[record] viewport.mp4 written to {VIDEO_DIR}")
