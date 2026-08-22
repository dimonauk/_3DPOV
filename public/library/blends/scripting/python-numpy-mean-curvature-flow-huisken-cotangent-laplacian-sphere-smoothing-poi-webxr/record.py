# SPDX-License-Identifier: CC0-1.0
"""
record.py — viewport animation for the MCF shape-key morph sequence.

Open the .blend saved after blueprint.py then run this script:
  blender hf_mcf_sphere_poi.blend --python record.py

Output frames  →  /tmp/mcf_record/  (PNG, 1920×1080)
Sequence:
  0–49   turntable 360° showing noisy sphere (Basis)
  50–89  SK_Step050 ramps in  — first 50 MCF steps (noise rapidly damped)
  90–119 SK_Step200 ramps in  — 200 steps (high-freq removed, sphere round)
  120–149 SK_Step500 ramps in — 500 steps (nearly perfect sphere)
  150–179 SK_Step800 ramps in — 800 steps (Huisken limit)
"""
import math
import bpy

# ── Parameters ───────────────────────────────────────────────────────────────
OUTPUT_DIR   = "/tmp/mcf_record/"
FRAME_END    = 179
RESOLUTION_X = 1920
RESOLUTION_Y = 1080
OBJ_NAME     = "MCF_Sphere"
CAM_DIST     = 2.8
CAM_Z        = 0.9

scene  = bpy.context.scene
scene.frame_start = 0
scene.frame_end   = FRAME_END

scene.render.filepath              = OUTPUT_DIR
scene.render.image_settings.file_format = "PNG"
scene.render.resolution_x          = RESOLUTION_X
scene.render.resolution_y          = RESOLUTION_Y
scene.render.engine                = "BLENDER_EEVEE_NEXT"

# ── Camera ───────────────────────────────────────────────────────────────────
bpy.ops.object.camera_add(location=(CAM_DIST, -CAM_DIST, CAM_Z))
cam = bpy.context.active_object
cam.name = "RenderCam"

bpy.ops.object.constraint_add(type="TRACK_TO")
cam.constraints["Track To"].target      = bpy.data.objects[OBJ_NAME]
cam.constraints["Track To"].track_axis  = "TRACK_NEGATIVE_Z"
cam.constraints["Track To"].up_axis     = "UP_Y"
scene.camera = cam

# Turntable 360° over frames 0–179
cam.rotation_euler = (0, 0, 0)
cam.keyframe_insert(data_path="rotation_euler", frame=0)
cam.rotation_euler.z = math.tau
cam.keyframe_insert(data_path="rotation_euler", frame=FRAME_END)
for fc in cam.animation_data.action.fcurves:
    for kp in fc.keyframe_points:
        kp.interpolation = "LINEAR"

# ── Shape-key animation ───────────────────────────────────────────────────────
obj    = bpy.data.objects[OBJ_NAME]
blocks = obj.data.shape_keys.key_blocks

# Schedule: (key_name, frame_start_ramp, frame_end_ramp)
RAMPS = [
    ("SK_Step050",  50,  89),
    ("SK_Step200",  90, 119),
    ("SK_Step500", 120, 149),
    ("SK_Step800", 150, 179),
]

# Initialise all non-Basis keys at 0
for name, _, _ in RAMPS:
    blocks[name].value = 0.0
    blocks[name].keyframe_insert(data_path="value", frame=0)

# Each key ramps 0→1 over its window; previous key ramps 1→0 simultaneously
prev = None
for name, f0, f1 in RAMPS:
    blocks[name].value = 0.0
    blocks[name].keyframe_insert(data_path="value", frame=f0)
    blocks[name].value = 1.0
    blocks[name].keyframe_insert(data_path="value", frame=f1)
    if prev is not None:
        blocks[prev].value = 1.0
        blocks[prev].keyframe_insert(data_path="value", frame=f0)
        blocks[prev].value = 0.0
        blocks[prev].keyframe_insert(data_path="value", frame=f1)
    prev = name

# Hold last key at 1 to end
if prev:
    blocks[prev].value = 1.0
    blocks[prev].keyframe_insert(data_path="value", frame=FRAME_END)

# Linear interpolation on all shape-key curves
if obj.data.shape_keys.animation_data and obj.data.shape_keys.animation_data.action:
    for fc in obj.data.shape_keys.animation_data.action.fcurves:
        for kp in fc.keyframe_points:
            kp.interpolation = "LINEAR"

# ── Render ───────────────────────────────────────────────────────────────────
bpy.ops.render.render(animation=True, write_still=True)
print(f"[record] ✓ frames 0–{FRAME_END} → {OUTPUT_DIR}")
