"""
Viewport recording script — mathutils.Euler / VRM Rotation Mode Audit
======================================================================
Run blueprint.py first to build vrm_euler_audit.blend, then run this file
to render a 90-frame viewport animation to:
  public/library/videos/scripting/python-mathutils-euler-rotation-order-gimbal-safe-vrm-webxr/viewport.mp4

Frames 1–45  show UpperArm in XYZ Euler: arm raises Y→90° then hits gimbal
             (adding Z twist barely moves the arm — axis collapse visible).
Frames 46–90 show UpperArm in YXZ Euler: same motions clean, no axis collapse.
The Chest bone tilts/twists via quaternion throughout.
"""

import os
import bpy

BLEND_IN  = "//vrm_euler_audit.blend"
VIDEO_OUT = os.path.join(
    bpy.path.abspath("//"),
    "..", "..", "..", "..", "videos", "scripting",
    "python-mathutils-euler-rotation-order-gimbal-safe-vrm-webxr",
    "viewport.mp4",
)

bpy.ops.wm.open_mainfile(filepath=BLEND_IN)

scene = bpy.context.scene
scene.render.engine              = "BLENDER_WORKBENCH"
scene.display.shading.type       = "SOLID"
scene.display.shading.show_xray  = True
scene.display.shading.color_type = "BONE_POSE"

scene.render.image_settings.file_format = "FFMPEG"
scene.render.ffmpeg.format              = "MPEG4"
scene.render.ffmpeg.codec               = "H264"
scene.render.ffmpeg.constant_rate_factor = "MEDIUM"
scene.render.resolution_x = 1280
scene.render.resolution_y = 720
scene.render.fps          = 30
scene.render.filepath     = VIDEO_OUT
scene.frame_start = 1
scene.frame_end   = 90

# Show armature with pose overlays active
for area in bpy.context.screen.areas:
    if area.type == "VIEW_3D":
        for space in area.spaces:
            if space.type == "VIEW_3D":
                space.overlay.show_bones = True
                space.overlay.show_overlays = True

# Frame the skeleton
bpy.ops.object.select_all(action="SELECT")
for area in bpy.context.screen.areas:
    if area.type == "VIEW_3D":
        with bpy.context.temp_override(area=area):
            bpy.ops.view3d.view_selected()

bpy.ops.render.opengl(animation=True)
print(f"Viewport render saved → {VIDEO_OUT}")
