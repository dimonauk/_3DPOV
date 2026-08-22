"""
record.py — Spherical Harmonics: Viewport Animation for screen capture
Blender 5.1 — Holoflow Studio — CC0

Animates three shape key morphs (p_z → d_z² → d_x²-y²), then orbits the
camera 360° around the orbital.  Output goes to:
  public/library/videos/scripting/
    python-numpy-spherical-harmonics-real-sh-shape-keys-atomic-orbital-webxr/
      viewport.mp4

Run blueprint.py first so the blend file and shape keys exist.
"""

import bpy
import math
import os

# ─── Parameters ──────────────────────────────────────────────────────────────
MORPH_FRAMES = 90     # frames spent morphing through three shape key transitions
ORBIT_FRAMES = 90     # frames spent orbiting the camera after morphing
TOTAL        = MORPH_FRAMES + ORBIT_FRAMES
VIDEO_REL    = ("//../../videos/scripting/"
                "python-numpy-spherical-harmonics-real-sh-shape-keys-atomic-orbital-webxr/"
                "viewport.mp4")
RES_X, RES_Y = 1920, 1080
FPS          = 30

sc = bpy.context.scene
ob = sc.objects.get("hf_sh_orbital")
if not ob or not ob.data.shape_keys:
    raise RuntimeError("[hf] Run blueprint.py first — shape keys not found.")

keys = ob.data.shape_keys.key_blocks

# Zero every shape key at frame 1
for kb in keys:
    kb.value = 0.0
    kb.keyframe_insert("value", frame=1)

# ─── Morph sequence ──────────────────────────────────────────────────────────
# Each segment lasts 30 frames: Basis → Y_1^0  →  Y_2^0  →  Y_2^2
# The previous key fades out while the new one fades in simultaneously,
# so at any mid-frame the user sees a hybrid orbital blend.
SEG = MORPH_FRAMES // 3

SEGMENTS = [
    # (key_out,    v_out, frame_out),  (key_in,     v_in, frame_in)
    (("Basis",    0.0, 1),             ("Y_1_+0",   1.0, 1 + SEG)),
    (("Y_1_+0",   1.0, 1 + SEG),      ("Y_2_+0",   1.0, 1 + 2 * SEG)),
    (("Y_2_+0",   1.0, 1 + 2 * SEG),  ("Y_2_+2",   1.0, MORPH_FRAMES)),
    (("Y_1_+0",   0.0, 1 + 2 * SEG),  ("Y_2_+0",   0.0, MORPH_FRAMES)),
]

for (k_fade, v_fade, f_fade), (k_rise, v_rise, f_rise) in SEGMENTS:
    if k_fade in keys:
        keys[k_fade].value = v_fade
        keys[k_fade].keyframe_insert("value", frame=f_fade)
    if k_rise in keys:
        keys[k_rise].value = v_rise
        keys[k_rise].keyframe_insert("value", frame=f_rise)

# ─── Camera orbit ─────────────────────────────────────────────────────────────
cam = sc.camera
if cam is None:
    cam_data = bpy.data.cameras.new("hf_cam")
    cam      = bpy.data.objects.new("hf_cam", cam_data)
    sc.collection.objects.link(cam)
    sc.camera = cam

R_CAM  = 3.6    # orbit radius
Z_CAM  = 1.0    # camera height offset

for fi in range(MORPH_FRAMES + 1, TOTAL + 1):
    t     = (fi - MORPH_FRAMES) / ORBIT_FRAMES          # 0 → 1
    angle = -math.pi / 2 + 2.0 * math.pi * t            # full 360° CCW
    cx = R_CAM * math.cos(angle)
    cy = R_CAM * math.sin(angle)
    cam.location = (cx, cy, Z_CAM)
    # Point at origin: Blender camera looks down -Y in local space; we need
    # the local -Y to point from cam position toward (0, 0, 0).
    dx, dy = -cx, -cy
    yaw   = math.atan2(dx, -dy)
    pitch = math.atan2(math.sqrt(dx*dx + dy*dy), Z_CAM)
    cam.rotation_euler = (pitch, 0.0, yaw)
    cam.keyframe_insert("location",       frame=fi)
    cam.keyframe_insert("rotation_euler", frame=fi)

# ─── Render settings ──────────────────────────────────────────────────────────
sc.frame_start = 1
sc.frame_end   = TOTAL
sc.render.resolution_x = RES_X
sc.render.resolution_y = RES_Y
sc.render.fps          = FPS
sc.render.image_settings.file_format = "FFMPEG"
sc.render.ffmpeg.format              = "MPEG4"
sc.render.ffmpeg.codec               = "H264"
sc.render.ffmpeg.constant_rate_factor = "HIGH"
sc.render.filepath = bpy.path.abspath(VIDEO_REL)

out_dir = os.path.dirname(bpy.path.abspath(VIDEO_REL))
os.makedirs(out_dir, exist_ok=True)

bpy.ops.render.opengl(animation=True)
print(f"[hf] Viewport render → {VIDEO_REL}")
