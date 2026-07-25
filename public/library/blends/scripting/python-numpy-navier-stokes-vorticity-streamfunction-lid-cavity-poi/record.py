"""
record.py — render viewport.mp4 for the NS lid-cavity poi tutorial.
Run immediately after blueprint.py in the same Blender session.

Output: public/library/videos/scripting/
        python-numpy-navier-stokes-vorticity-streamfunction-lid-cavity-poi/
        viewport.mp4
120 frames · 30 fps · 4-second clip · 1920×1080
Camera orbits 360° around the ribbon mesh to show bevel depth.
"""

import bpy
import math
import mathutils

OUTPUT = (
    "//../../../../videos/scripting/"
    "python-numpy-navier-stokes-vorticity-streamfunction-lid-cavity-poi/"
    "viewport.mp4"
)
FRAME_START = 1
FRAME_END   = 120
FPS         = 30

sc = bpy.context.scene
sc.frame_start = FRAME_START
sc.frame_end   = FRAME_END
sc.render.fps  = FPS

# FFMPEG / H.264 settings
sc.render.image_settings.file_format = 'FFMPEG'
sc.render.ffmpeg.format              = 'MPEG4'
sc.render.ffmpeg.codec               = 'H264'
sc.render.ffmpeg.constant_rate_factor = 'MEDIUM'
sc.render.filepath = OUTPUT
sc.render.resolution_x = 1920
sc.render.resolution_y = 1080

# Switch to perspective camera and orbit
cam = sc.objects.get("cam")
if cam:
    cam.data.type = 'PERSP'
    cam.data.lens = 50.0
    for f in range(FRAME_START, FRAME_END + 1):
        t     = (f - FRAME_START) / max(FRAME_END - FRAME_START, 1)
        angle = 2 * math.pi * t          # full 360° orbit
        r     = 1.7
        cam.location = mathutils.Vector((
            r * math.sin(angle),
            -r * math.cos(angle),
            0.75,
        ))
        cam.rotation_euler = mathutils.Euler(
            (math.radians(65), 0.0, angle), 'XYZ'
        )
        cam.keyframe_insert("location",       frame=f)
        cam.keyframe_insert("rotation_euler", frame=f)

bpy.ops.render.render(animation=True, write_still=False)
print(f"viewport.mp4 → {OUTPUT}")
