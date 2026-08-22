"""
record.py — Viewport animation: expression dial sweeps neutral → happy → neutral
Output: public/library/videos/rigging/rigging-action-constraint-expression-dial-vrm/viewport.mp4

Run from: Blender 5.1 Scripting workspace AFTER blueprint.py has been run.
The recording keys CTRL_expression Y-rotation across 90 frames (3 s at 30 fps):
  Frame 1  → Y = 0°   (neutral)
  Frame 45 → Y = 45°  (full happy)
  Frame 90 → Y = 0°   (return to neutral)
The Action Constraint and shape-key drivers react in real time — no extra bake needed.
"""

import bpy
import math
import os

# ── Config ───────────────────────────────────────────────────────────────────
ARMATURE_NAME = "rig_face_expr"
CTRL_BONE     = "CTRL_expression"
OUTPUT_DIR    = "//../../../../videos/rigging/rigging-action-constraint-expression-dial-vrm/"
FRAME_START   = 1
FRAME_END     = 90
FPS           = 30
PEAK_ROT      = math.radians(45)


# ── Animate CTRL bone ─────────────────────────────────────────────────────────

def setup_animation():
    arm = bpy.data.objects[ARMATURE_NAME]
    bpy.context.view_layer.objects.active = arm
    bpy.ops.object.mode_set(mode="POSE")

    ctrl = arm.pose.bones[CTRL_BONE]
    ctrl.rotation_mode = "XYZ"

    # Clear previous record sweep action if re-running
    if arm.animation_data and arm.animation_data.action:
        if arm.animation_data.action.name == "record_ctrl_sweep":
            bpy.data.actions.remove(arm.animation_data.action, do_unlink=True)

    arm.animation_data_create()
    sweep = bpy.data.actions.new("record_ctrl_sweep")
    arm.animation_data.action = sweep

    for frame, rot_y in [(FRAME_START, 0.0), (45, PEAK_ROT), (FRAME_END, 0.0)]:
        bpy.context.scene.frame_set(frame)
        ctrl.rotation_euler.y = rot_y
        ctrl.keyframe_insert(data_path="rotation_euler", index=1)

    bpy.ops.object.mode_set(mode="OBJECT")


# ── Render settings ───────────────────────────────────────────────────────────

def setup_render():
    scene = bpy.context.scene
    scene.render.engine              = "BLENDER_WORKBENCH"
    scene.display.shading.light      = "STUDIO"
    scene.display.shading.color_type = "SINGLE"
    scene.display.shading.single_color = (0.6, 0.72, 0.9)

    scene.render.resolution_x   = 1280
    scene.render.resolution_y   = 720
    scene.render.fps             = FPS
    scene.frame_start            = FRAME_START
    scene.frame_end              = FRAME_END

    scene.render.image_settings.file_format     = "FFMPEG"
    scene.render.ffmpeg.format                  = "MPEG4"
    scene.render.ffmpeg.codec                   = "H264"
    scene.render.ffmpeg.constant_rate_factor    = "MEDIUM"
    scene.render.filepath = OUTPUT_DIR + "viewport.mp4"


# ── Run ───────────────────────────────────────────────────────────────────────

def run():
    abs_dir = bpy.path.abspath(OUTPUT_DIR)
    os.makedirs(abs_dir, exist_ok=True)
    setup_animation()
    setup_render()
    bpy.ops.render.render(animation=True, write_still=False)
    print(f"viewport.mp4 written to {abs_dir}")


run()
