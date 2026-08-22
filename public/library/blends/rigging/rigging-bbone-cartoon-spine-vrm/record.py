"""
record.py — B-Bones Cartoon Spine Viewport Recording (Blender 5.1)
===================================================================
Animates a 120-frame sequence through four spine poses (neutral, 'C' forward,
'S' curve, lateral sway) then renders a viewport OpenGL movie to:
  public/library/videos/rigging/rigging-bbone-cartoon-spine-vrm/viewport.mp4

Run AFTER blueprint.py has built the spine_rig object.
"""

import bpy
import math
import os

# ── output ────────────────────────────────────────────────────────────────────
OUT_DIR  = "//../../public/library/videos/rigging/rigging-bbone-cartoon-spine-vrm"
OUT_FILE = OUT_DIR + "/viewport"
FRAMES   = 120
FPS      = 24

# ── scene render settings ─────────────────────────────────────────────────────
scene = bpy.context.scene
scene.frame_start           = 1
scene.frame_end             = FRAMES
scene.render.fps            = FPS
scene.render.resolution_x   = 1920
scene.render.resolution_y   = 1080
scene.render.image_settings.file_format          = "FFMPEG"
scene.render.ffmpeg.format                        = "MPEG4"
scene.render.ffmpeg.codec                         = "H264"
scene.render.ffmpeg.constant_rate_factor          = "MEDIUM"
scene.render.filepath       = OUT_FILE

# Solid shading so the toon colour renders without a full Cycles/EEVEE pass
for area in bpy.context.screen.areas:
    if area.type == "VIEW_3D":
        for space in area.spaces:
            if space.type == "VIEW_3D":
                space.shading.type       = "SOLID"
                space.shading.color_type = "MATERIAL"
                break

# ── locate rig ────────────────────────────────────────────────────────────────
arm_obj = bpy.data.objects.get("spine_rig")
if arm_obj is None:
    raise RuntimeError("spine_rig not found — run blueprint.py first")

bpy.context.view_layer.objects.active = arm_obj
bpy.ops.object.mode_set(mode="POSE")
pose = arm_obj.pose

SPINE = [f"spine_{i+1:02d}" for i in range(6)]

def set_rot_xz(name: str, rx: float, rz: float, frame: int) -> None:
    pb = pose.bones[name]
    pb.rotation_mode     = "XYZ"
    pb.rotation_euler[0] = rx
    pb.rotation_euler[2] = rz
    pb.keyframe_insert("rotation_euler", index=0, frame=frame)
    pb.keyframe_insert("rotation_euler", index=2, frame=frame)

def set_handle(name: str, ry: float, frame: int) -> None:
    pb = pose.bones.get(name)
    if pb is None:
        return
    pb.rotation_mode     = "XYZ"
    pb.rotation_euler[1] = ry
    pb.keyframe_insert("rotation_euler", index=1, frame=frame)

def neutral(frame: int) -> None:
    for n in SPINE:
        set_rot_xz(n, 0.0, 0.0, frame)
    set_handle("bbone_handle_root", 0.0, frame)

# ── pose keyframes ────────────────────────────────────────────────────────────

# Frame 1 — neutral (straight spine, all at rest)
scene.frame_set(1)
neutral(1)

# Frame 30 — 'C' forward lean: all spine bones rotate ~12° forward on X
scene.frame_set(30)
lean = math.radians(12.0)
for n in SPINE:
    set_rot_xz(n, lean, 0.0, 30)
set_handle("bbone_handle_root", math.radians(8.0), 30)

# Frame 60 — 'S' curve: lower bones forward, upper bones backward
scene.frame_set(60)
s_curve = [
    math.radians( 15),  # spine_01 — hips thrust forward
    math.radians( 14),  # spine_02
    math.radians(  6),  # spine_03 — inflection zone
    math.radians( -6),  # spine_04 — reversing
    math.radians(-13),  # spine_05
    math.radians(-13),  # spine_06 — chest pulled back
]
for n, rx in zip(SPINE, s_curve):
    set_rot_xz(n, rx, 0.0, 60)
set_handle("bbone_handle_root", math.radians(12.0), 60)

# Frame 90 — lateral sway: sinusoidal Z rotation along the chain
scene.frame_set(90)
for i, n in enumerate(SPINE):
    sway = math.radians(9.0) * math.sin(i * 0.65)
    set_rot_xz(n, 0.0, sway, 90)
set_handle("bbone_handle_root", 0.0, 90)

# Frame 120 — return to neutral
scene.frame_set(120)
neutral(120)

bpy.ops.object.mode_set(mode="OBJECT")

# ── create output directory and render ───────────────────────────────────────
os.makedirs(bpy.path.abspath(OUT_DIR), exist_ok=True)
bpy.ops.render.opengl(animation=True, sequencer=False)

print(f"Viewport recording saved to: {bpy.path.abspath(OUT_FILE)}.mp4")
