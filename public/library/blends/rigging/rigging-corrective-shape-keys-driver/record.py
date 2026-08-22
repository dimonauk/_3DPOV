"""
record.py — Viewport animation recorder for corrective shape keys demo
Blender 5.1 | CC0

Renders a 90-frame animation to public/library/videos/rigging/
rigging-corrective-shape-keys-driver/viewport.mp4

What it shows (frames 1-90):
  0-30  : elbow at rest (0°) — arm straight, corrective key value = 0
  31-60 : elbow bending from 0° → -90° — corrective key fades in
  61-90 : elbow held at 90° — corrective key fully engaged

The recording purposefully animates the corrective value alongside the pose
so a viewer can observe the key enabling exactly as the bend deepens.
"""

import bpy
import math
import os
import sys

# ── Run blueprint first if scene is empty ────────────────────────────────────

if "arm_mesh" not in bpy.data.objects:
    script_dir = os.path.dirname(os.path.abspath(__file__))
    sys.path.insert(0, script_dir)
    import blueprint
    blueprint.main()
    del blueprint

# ── Output path ───────────────────────────────────────────────────────────────

OUTPUT_PATH = os.path.join(
    os.path.dirname(os.path.abspath(__file__)),
    "..", "..", "..", "videos",
    "rigging", "rigging-corrective-shape-keys-driver", "viewport.mp4"
)
os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)

# ── Scene / render settings ───────────────────────────────────────────────────

scene = bpy.context.scene
scene.render.engine        = 'BLENDER_EEVEE_NEXT'
scene.render.filepath      = OUTPUT_PATH
scene.render.image_settings.file_format = 'FFMPEG'
scene.render.ffmpeg.format = 'MPEG4'
scene.render.ffmpeg.codec  = 'H264'
scene.render.ffmpeg.constant_rate_factor = 'MEDIUM'
scene.render.resolution_x  = 1280
scene.render.resolution_y  = 720
scene.render.fps           = 30
scene.frame_start          = 1
scene.frame_end            = 90

# Shade smooth for a clear deformation read
arm_obj = bpy.data.objects.get("arm_mesh")
if arm_obj:
    arm_obj.data.polygons.foreach_set("use_smooth", [True] * len(arm_obj.data.polygons))
    arm_obj.data.update()

# ── Keyframe forearm rotation ─────────────────────────────────────────────────

rig_obj = bpy.data.objects.get("arm_rig")
if rig_obj:
    bpy.context.view_layer.objects.active = rig_obj
    bpy.ops.object.mode_set(mode='POSE')
    pbone = rig_obj.pose.bones["forearm"]
    pbone.rotation_mode = 'XYZ'

    # Frame 1: rest pose
    scene.frame_set(1)
    pbone.rotation_euler.x = 0.0
    pbone.keyframe_insert("rotation_euler", index=0)

    # Frame 30: still straight
    scene.frame_set(30)
    pbone.rotation_euler.x = 0.0
    pbone.keyframe_insert("rotation_euler", index=0)

    # Frame 60: 90° flex
    scene.frame_set(60)
    pbone.rotation_euler.x = math.radians(-90.0)
    pbone.keyframe_insert("rotation_euler", index=0)

    # Frame 90: hold at 90°
    scene.frame_set(90)
    pbone.rotation_euler.x = math.radians(-90.0)
    pbone.keyframe_insert("rotation_euler", index=0)

    # Ease in/out on all keyframes
    for fc in rig_obj.animation_data.action.fcurves:
        for kp in fc.keyframe_points:
            kp.interpolation = 'BEZIER'
            kp.easing        = 'AUTO'

    bpy.ops.object.mode_set(mode='OBJECT')

# ── Render ────────────────────────────────────────────────────────────────────

bpy.ops.render.render(animation=True)
print(f"[record] Wrote: {OUTPUT_PATH}")
