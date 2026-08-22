"""
record.py — Viewport animation recording for python-armature-edit-bones-vrm-spine-chain
Blender 5.1 | CC0 | Holoflow Studio

Run AFTER blueprint.py. Produces an OpenGL viewport render at:
  public/library/videos/scripting/python-armature-edit-bones-vrm-spine-chain/viewport.mp4

Technique: keyframe the armature into two poses (rest + arched spine),
play back 48 frames showing the spine deforming the body proxy, then
opengl-render to MP4. This demonstrates that the programmatically
created rig actually deforms geometry correctly.

Run as:
  blender vrm_spine_skeleton.blend --python record.py
Or headless:
  blender --background vrm_spine_skeleton.blend --python record.py
"""

import bpy
import math
from pathlib import Path

# ── Output path ───────────────────────────────────────────────────────────────
OUT_DIR  = Path(bpy.path.abspath("//../../../../videos/scripting/"
                                  "python-armature-edit-bones-vrm-spine-chain/"))
OUT_DIR.mkdir(parents=True, exist_ok=True)
OUT_PATH = str(OUT_DIR / "viewport")     # Blender appends frame number + ext

# ── Scene / render settings ───────────────────────────────────────────────────
scene = bpy.context.scene
scene.frame_start = 1
scene.frame_end   = 48
scene.render.fps  = 24

scene.render.image_settings.file_format = "FFMPEG"
scene.render.ffmpeg.format              = "MPEG4"
scene.render.ffmpeg.codec               = "H264"
scene.render.ffmpeg.constant_rate_factor = "MEDIUM"
scene.render.resolution_x  = 1280
scene.render.resolution_y  = 720
scene.render.filepath       = OUT_PATH

# ── Camera ────────────────────────────────────────────────────────────────────
cam_data        = bpy.data.cameras.new("RecordCam")
cam_data.lens   = 85
cam_obj         = bpy.data.objects.new("RecordCam", cam_data)
bpy.context.collection.objects.link(cam_obj)
cam_obj.location = (0.0, -2.8, 1.35)
cam_obj.rotation_euler = (math.radians(90), 0, 0)
scene.camera = cam_obj

# ── Keyframe two poses: rest (frame 1) + arched (frame 24) ───────────────────
arm_obj = bpy.data.objects.get("vrm_spine")
if arm_obj and arm_obj.type == "ARMATURE":
    bpy.context.view_layer.objects.active = arm_obj
    bpy.ops.object.mode_set(mode="POSE")

    def keyframe_pose(frame: int, chest_x: float, head_x: float) -> None:
        """Rotate chest and head around local X to create a spine arch."""
        scene.frame_set(frame)
        pb_chest = arm_obj.pose.bones.get("chest")
        pb_head  = arm_obj.pose.bones.get("head")
        if pb_chest:
            pb_chest.rotation_mode   = "XYZ"
            pb_chest.rotation_euler.x = math.radians(chest_x)
            pb_chest.keyframe_insert("rotation_euler", index=0, frame=frame)
        if pb_head:
            pb_head.rotation_mode   = "XYZ"
            pb_head.rotation_euler.x = math.radians(head_x)
            pb_head.keyframe_insert("rotation_euler", index=0, frame=frame)

    keyframe_pose(frame=1,  chest_x=0,    head_x=0)      # rest T-pose
    keyframe_pose(frame=24, chest_x=20,   head_x=-25)    # forward-lean bow
    keyframe_pose(frame=48, chest_x=0,    head_x=0)      # return to rest

    # Smooth the F-curves for organic motion
    for fc in arm_obj.animation_data.action.fcurves:
        for kp in fc.keyframe_points:
            kp.interpolation = "BEZIER"
            kp.handle_left_type  = "AUTO_CLAMPED"
            kp.handle_right_type = "AUTO_CLAMPED"

    bpy.ops.object.mode_set(mode="OBJECT")

# ── Viewport shading: Solid + Matcap for clear bone/mesh display ──────────────
for area in bpy.context.screen.areas:
    if area.type == "VIEW_3D":
        space = area.spaces.active
        space.shading.type           = "SOLID"
        space.shading.color_type     = "SINGLE"
        space.shading.single_color   = (0.6, 0.8, 1.0)
        space.overlay.show_overlays  = True
        space.overlay.show_bones     = True
        break

# ── OpenGL render animation ───────────────────────────────────────────────────
bpy.ops.render.opengl(animation=True, sequencer=False)
print(f"[holoflow] Viewport render → {OUT_PATH}")
