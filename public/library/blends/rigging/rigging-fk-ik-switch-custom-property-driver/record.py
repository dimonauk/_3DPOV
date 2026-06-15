"""
record.py — Viewport animation render for FK/IK switch tutorial
===============================================================
Run AFTER blueprint.py. Renders a 90-frame OpenGL viewport animation showing:
  frames  1–30 : FK mode — bones posed via free rotation
  frames 31–49 : crossfade region (fk_ik blending 0→1)
  frames 50–80 : IK mode — IK target drives the chain
  frames 81–90 : snap back to FK

Output: public/library/videos/rigging/rigging-fk-ik-switch-custom-property-driver/viewport.mp4
"""

import bpy
import os
import math

SLUG       = "rigging-fk-ik-switch-custom-property-driver"
OUT_DIR    = f"//../../../../public/library/videos/rigging/{SLUG}"
ARM_NAME   = "fk_ik_arm"
PROP_NAME  = "fk_ik"
FRAME_END  = 90

scene    = bpy.context.scene
arm_obj  = bpy.data.objects.get(ARM_NAME)
if arm_obj is None:
    raise RuntimeError("Run blueprint.py first — fk_ik_arm not found in scene.")

arm_data = arm_obj.data

# ── ensure output directory exists ───────────────────────────────────────────
abs_dir = bpy.path.abspath(OUT_DIR)
os.makedirs(abs_dir, exist_ok=True)

# ── camera: side-on view, orthographic, slightly above elbow height ───────────
bpy.ops.object.camera_add(location=(0.0, -2.5, 0.60))
cam_obj = bpy.context.active_object
cam_obj.name = "RecordCam"
cam_obj.rotation_euler = (math.radians(90), 0, 0)
cam          = cam_obj.data
cam.type     = "ORTHO"
cam.ortho_scale = 1.8    # fits the 1.2m arm chain in frame

scene.camera = cam_obj

# ── render settings ───────────────────────────────────────────────────────────
scene.render.resolution_x    = 1280
scene.render.resolution_y    = 720
scene.render.resolution_percentage = 100
scene.frame_start = 1
scene.frame_end   = FRAME_END
scene.render.fps  = 30

scene.render.image_settings.file_format = "FFMPEG"
scene.render.ffmpeg.format          = "MPEG4"
scene.render.ffmpeg.codec           = "H264"
scene.render.ffmpeg.constant_rate_factor = "MEDIUM"
scene.render.filepath = os.path.join(abs_dir, "viewport.mp4")

# ── pose the FK phase: gently rotate forearm ─────────────────────────────────
# FK mode (frame 1–30): rotate the forearm around its local X
bpy.context.view_layer.objects.active = arm_obj
bpy.ops.object.mode_set(mode="POSE")
forearm_pb = arm_obj.pose.bones["forearm"]

for fr in range(1, 31):
    scene.frame_set(fr)
    t   = (fr - 1) / 29          # 0 → 1
    ang = math.radians(-60 * t)  # 0 → –60° (elbow bends)
    forearm_pb.rotation_mode     = "XYZ"
    forearm_pb.rotation_euler[0] = ang
    forearm_pb.keyframe_insert(data_path="rotation_euler", index=0, frame=fr)

# Keep the FK bend frozen while the switch animates (31–50)
for fr in range(31, 51):
    scene.frame_set(fr)
    forearm_pb.rotation_euler[0] = math.radians(-60)
    forearm_pb.keyframe_insert(data_path="rotation_euler", index=0, frame=fr)

# IK phase (50–80): ik_target moves upward, arm follows
ik_target_pb = arm_obj.pose.bones["ik_target"]
for fr in range(50, 81):
    scene.frame_set(fr)
    t = (fr - 50) / 30           # 0 → 1
    ik_target_pb.location = (0.0, 0.0, 0.30 * t)   # target drifts upward
    ik_target_pb.keyframe_insert(data_path="location", frame=fr)

bpy.ops.object.mode_set(mode="OBJECT")

# ── ensure fk_ik property keyframes are present ──────────────────────────────
# These were baked in blueprint.py but re-assert here for safety
arm_data[PROP_NAME] = 0.0; arm_data.keyframe_insert(data_path=f'["{PROP_NAME}"]', frame=1)
arm_data[PROP_NAME] = 0.0; arm_data.keyframe_insert(data_path=f'["{PROP_NAME}"]', frame=30)
arm_data[PROP_NAME] = 1.0; arm_data.keyframe_insert(data_path=f'["{PROP_NAME}"]', frame=50)
arm_data[PROP_NAME] = 1.0; arm_data.keyframe_insert(data_path=f'["{PROP_NAME}"]', frame=80)
arm_data[PROP_NAME] = 0.0; arm_data.keyframe_insert(data_path=f'["{PROP_NAME}"]', frame=90)

scene.frame_set(1)

# ── overlay settings ──────────────────────────────────────────────────────────
for area in bpy.context.screen.areas:
    if area.type == "VIEW_3D":
        spc = area.spaces.active
        spc.overlay.show_overlays   = True
        spc.overlay.show_bones      = True
        spc.shading.type            = "SOLID"
        spc.shading.show_xray       = True
        spc.shading.xray_alpha      = 0.4
        break

# ── render ────────────────────────────────────────────────────────────────────
bpy.ops.render.opengl(animation=True)
print(f"[record] Rendered to {scene.render.filepath}")
