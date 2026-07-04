"""
record.py — Viewport animation render for CompositorNodeTree tutorial
Blender 5.1  |  CC0  |  Holoflow Studio

Renders a 4-second Workbench animation (frames 1–96) of a faceted gem rotating
under three coloured lights.  Run blueprint.py first to generate the .blend.
The Workbench renderer does not evaluate the Cycles compositor tree — this
viewport capture shows the raw scene for the screen-recording brief.

RUN
    blender oidn_cdl_glare.blend --python record.py
OUTPUT
    public/library/videos/scripting/python-compositor-node-tree-oidn-cdl-glare-pipeline/viewport.mp4
"""

import bpy
import math
import os

VIDEO_OUT  = ("//../../../../public/library/videos/scripting/"
              "python-compositor-node-tree-oidn-cdl-glare-pipeline/viewport.mp4")
GEM_NAME   = "gem_host"
FRAMES     = 96

scene = bpy.context.scene

# ── gem rotation animation ───────────────────────────────────────────────────
gem = bpy.data.objects.get(GEM_NAME)
if gem:
    gem.rotation_euler = (0, 0, 0)
    gem.keyframe_insert(data_path="rotation_euler", index=2, frame=1)
    gem.rotation_euler.z = math.tau
    gem.keyframe_insert(data_path="rotation_euler", index=2, frame=FRAMES)

    # Linear interpolation for smooth constant-speed rotation
    if gem.animation_data and gem.animation_data.action:
        for fc in gem.animation_data.action.fcurves:
            for kp in fc.keyframe_points:
                kp.interpolation = "LINEAR"

# ── camera ───────────────────────────────────────────────────────────────────
if "render_cam" not in bpy.data.objects:
    bpy.ops.object.camera_add(location=(0.0, -4.8, 2.8))
    cam = bpy.context.active_object
    cam.name = "render_cam"
    cam.rotation_euler = (math.radians(62), 0.0, 0.0)
    scene.camera = cam
else:
    scene.camera = bpy.data.objects["render_cam"]

# ── render settings ───────────────────────────────────────────────────────────
scene.render.engine              = "BLENDER_WORKBENCH"
scene.display.shading.light      = "STUDIO"
scene.display.shading.color_type = "MATERIAL"
scene.display.shading.show_shadows  = True
scene.display.shading.show_cavity   = True

scene.render.resolution_x    = 1280
scene.render.resolution_y    = 720
scene.render.fps              = 24
scene.frame_start             = 1
scene.frame_end               = FRAMES

scene.render.image_settings.file_format    = "FFMPEG"
scene.render.ffmpeg.format                 = "MPEG4"
scene.render.ffmpeg.codec                  = "H264"
scene.render.ffmpeg.constant_rate_factor   = "MEDIUM"

os.makedirs(os.path.dirname(bpy.path.abspath(VIDEO_OUT)), exist_ok=True)
scene.render.filepath = VIDEO_OUT

bpy.ops.render.opengl(animation=True)
print("[compositor-pipeline record] viewport.mp4 written.")
