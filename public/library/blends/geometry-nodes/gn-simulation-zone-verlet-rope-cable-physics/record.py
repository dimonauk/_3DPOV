"""
record.py — Viewport animation render for Verlet Rope tutorial
Blender 5.1  |  CC0  |  Holoflow Studio

Renders a 5-second Workbench animation (frames 1–120) of the rope swinging
from its initial angled position through oscillation to near-rest.  Requires
blueprint.py to have been run first (verlet_rope.blend must exist and be open).

RUN (after blueprint.py)
    blender verlet_rope.blend --python record.py
OUTPUT
    public/library/videos/geometry-nodes/gn-simulation-zone-verlet-rope-cable-physics/viewport.mp4
"""

import bpy, os

VIDEO_OUT  = "//../../../../public/library/videos/geometry-nodes/" \
             "gn-simulation-zone-verlet-rope-cable-physics/viewport.mp4"
HOST_NAME  = "rope_cable_host"
SIM_FRAMES = 96

CAMERA_LOC = (2.8, -2.8, 0.8)
CAMERA_ROT = (1.22, 0.0, 0.79)    # radians (70°, 0°, 45°)

scene = bpy.context.scene

# Camera -----------------------------------------------------------------------
bpy.ops.object.camera_add(location=CAMERA_LOC)
cam = bpy.context.active_object
cam.name = "record_cam"
cam.rotation_euler = CAMERA_ROT
cam.data.lens = 50.0
scene.camera = cam

# Render settings — Workbench for speed; Studio lighting for cable sheen ------
scene.render.engine         = 'BLENDER_WORKBENCH'
scene.display.shading.light = 'STUDIO'
scene.display.shading.color_type = 'MATERIAL'
scene.display.shading.show_shadows = True

scene.render.resolution_x   = 1280
scene.render.resolution_y   = 720
scene.render.fps             = 24
scene.frame_start            = 1
scene.frame_end              = SIM_FRAMES

scene.render.image_settings.file_format = 'FFMPEG'
scene.render.ffmpeg.format              = 'MPEG4'
scene.render.ffmpeg.codec               = 'H264'
scene.render.ffmpeg.constant_rate_factor = 'MEDIUM'

os.makedirs(os.path.dirname(bpy.path.abspath(VIDEO_OUT)), exist_ok=True)
scene.render.filepath = VIDEO_OUT

bpy.ops.render.opengl(animation=True)
print("[verlet-rope record] viewport.mp4 written.")
