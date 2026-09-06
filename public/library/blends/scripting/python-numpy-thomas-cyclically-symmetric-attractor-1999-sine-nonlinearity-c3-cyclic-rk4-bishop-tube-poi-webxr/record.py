"""
record.py — Viewport animation render for Thomas Attractor
Outputs: public/library/videos/scripting/<slug>/viewport.mp4
Run from Blender 5.1 scripting panel AFTER running blueprint.py.

TECHNIQUE: animate the shape-key sequence Basis → SK_LowB → SK_NearTorus → Basis
over 90 frames at 30 fps = 3 seconds, then hold for 2 more seconds on Basis.
This shows the topological change as b decreases toward the wider orbit and
then approaches the quasiperiodic regime.
"""

import bpy
import os

# ─── OUTPUT PATH ───────────────────────────────────────────────────────────────
SLUG = (
    "python-numpy-thomas-cyclically-symmetric-attractor-1999"
    "-sine-nonlinearity-c3-cyclic-rk4-bishop-tube-poi-webxr"
)
OUT_DIR = os.path.join(
    bpy.path.abspath("//"),
    "..", "..", "..", "..", "videos", "scripting", SLUG,
)
os.makedirs(OUT_DIR, exist_ok=True)
OUT_PATH = os.path.join(OUT_DIR, "viewport.mp4")

# ─── SCENE SETTINGS ────────────────────────────────────────────────────────────
scene = bpy.context.scene
scene.render.engine        = "BLENDER_WORKBENCH"
scene.render.image_settings.file_format = "FFMPEG"
scene.render.ffmpeg.format = "MPEG4"
scene.render.ffmpeg.codec  = "H264"
scene.render.ffmpeg.constant_rate_factor = "MEDIUM"
scene.render.filepath      = OUT_PATH
scene.render.resolution_x  = 1920
scene.render.resolution_y  = 1080
scene.render.fps           = 30
scene.frame_start          = 1
scene.frame_end            = 150   # 5 seconds total

# Workbench solid shading with MatCap and vertex colours
space = None
for area in bpy.context.screen.areas:
    if area.type == "VIEW_3D":
        space = area.spaces.active
        break
if space:
    space.shading.type = "SOLID"
    space.shading.color_type = "VERTEX"
    space.shading.light = "MATCAP"

# ─── SHAPE KEY ANIMATION ───────────────────────────────────────────────────────
# Keyframe schedule (frame: key_name, value)
#   1  → Basis=1, SK_LowB=0, SK_NearTorus=0
#   30 → Basis=0, SK_LowB=1, SK_NearTorus=0   (b=0.17, wider orbit)
#   60 → Basis=0, SK_LowB=0, SK_NearTorus=1   (b=0.22, near-torus)
#   90 → Basis=1, SK_LowB=0, SK_NearTorus=0   (return to canonical)
#  150 → hold Basis=1

OBJ_NAME = "hf_thomas_poi"
obj = bpy.data.objects.get(OBJ_NAME)
if obj and obj.data.shape_keys:
    kb = obj.data.shape_keys.key_blocks

    def kf(frame, key, val):
        if key in kb:
            kb[key].value = val
            kb[key].keyframe_insert("value", frame=frame)

    schedule = [
        (1,   "Basis", 1.0), (1,   "SK_LowB", 0.0), (1,   "SK_NearTorus", 0.0),
        (30,  "Basis", 0.0), (30,  "SK_LowB", 1.0), (30,  "SK_NearTorus", 0.0),
        (60,  "Basis", 0.0), (60,  "SK_LowB", 0.0), (60,  "SK_NearTorus", 1.0),
        (90,  "Basis", 1.0), (90,  "SK_LowB", 0.0), (90,  "SK_NearTorus", 0.0),
        (150, "Basis", 1.0), (150, "SK_LowB", 0.0), (150, "SK_NearTorus", 0.0),
    ]
    for frame, key, val in schedule:
        kf(frame, key, val)

    # Set all interpolation to BEZIER for smooth morph
    if obj.data.shape_keys.animation_data:
        for fcurve in obj.data.shape_keys.animation_data.action.fcurves:
            for kp in fcurve.keyframe_points:
                kp.interpolation = "BEZIER"

# ─── CAMERA ────────────────────────────────────────────────────────────────────
bpy.ops.object.camera_add(location=(8.0, -8.0, 4.0))
cam = bpy.context.active_object
cam.name = "RecordCam"
# Aim at approximate attractor centroid (~origin for Thomas b=0.208)
cam.rotation_euler = (1.05, 0.0, 0.79)
scene.camera = cam

# Slow camera orbit for cinematic feel
cam.keyframe_insert("rotation_euler", frame=1)
cam.rotation_euler = (1.05, 0.0, 0.79 + 0.35)
cam.keyframe_insert("rotation_euler", frame=150)
if cam.animation_data:
    for fc in cam.animation_data.action.fcurves:
        for kp in fc.keyframe_points:
            kp.interpolation = "LINEAR"

# ─── RENDER ────────────────────────────────────────────────────────────────────
bpy.ops.render.render(animation=True)
print(f"[record.py] Wrote viewport animation → {OUT_PATH}")
