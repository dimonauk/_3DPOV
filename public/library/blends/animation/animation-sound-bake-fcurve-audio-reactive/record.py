"""
record.py — Viewport animation render for audio-reactive-mesh
=============================================================
Blender 5.1 | Holoflow Studio | CC0

Run AFTER blueprint.py. Configures OpenGL viewport render to output
144 frames (6 seconds at 24 fps) → FFMPEG MP4 at
public/library/videos/animation/animation-sound-bake-fcurve-audio-reactive/viewport.mp4

The wave pulsation is most legible with Material Preview shading and the
emission material active, so we use MATERIAL shade mode rather than RENDERED
to keep the recording fast and focus attention on the geometric wave form.
"""

import bpy
import os

OUTPUT_DIR  = os.path.join(
    bpy.path.abspath("//"),
    "../../../../public/library/videos/animation/animation-sound-bake-fcurve-audio-reactive"
)
OUTPUT_FILE = os.path.join(OUTPUT_DIR, "viewport")

os.makedirs(OUTPUT_DIR, exist_ok=True)

scn = bpy.context.scene
scn.render.resolution_x       = 1920
scn.render.resolution_y       = 1080
scn.render.resolution_percentage = 100
scn.render.fps                = 24
scn.render.image_settings.file_format = 'FFMPEG'
scn.render.ffmpeg.format              = 'MPEG4'
scn.render.ffmpeg.codec               = 'H264'
scn.render.ffmpeg.constant_rate_factor = 'HIGH'
scn.render.filepath           = OUTPUT_FILE

# Ensure Material Preview shading in the 3D viewport used by OpenGL render
for area in bpy.context.screen.areas:
    if area.type == 'VIEW_3D':
        for space in area.spaces:
            if space.type == 'VIEW_3D':
                space.shading.type = 'MATERIAL'
        break

# Position camera for a 45° overhead view of the grid
cam = scn.camera
if cam:
    cam.location      = (0.0, -7.0, 5.0)
    import math
    cam.rotation_euler = (math.radians(55), 0.0, 0.0)

bpy.ops.render.opengl(animation=True, sequencer=False, write_still=False)
print(f"[record.py] Rendered to {OUTPUT_FILE}.mp4")
