"""
record.py — Automated viewport render for lattice deformer tutorial
Output: public/library/videos/scripting/python-bpy-lattice-cage-deform-morph-bake-webxr/viewport.mp4

Run headlessly:
  blender --background --python record.py

Or from the Scripting workspace after blueprint.py has already run (skip the
exec line below and comment out the factory-reset inside blueprint.py first).

Duration: 48 frames at 24 fps = 2 s loop; intended for a 6 s looping clip
when the video player is set to 3× repeat.  The camera orbits 360° around
the deformed mesh so both the top-face wave and the side-pinch taper are
clearly visible in a single clip.
"""

import bpy
import math
from mathutils import Vector

OUTPUT_DIR = "//../../../../videos/scripting/python-bpy-lattice-cage-deform-morph-bake-webxr/"
FPS        = 24
FRAMES     = 48    # one full orbit
ORBIT_R    = 2.3
ORBIT_Z    = 0.75

# Rebuild the scene from blueprint so record.py is self-contained
exec(open(bpy.path.abspath("//blueprint.py")).read())

sc = bpy.context.scene
sc.render.engine           = 'BLENDER_EEVEE_NEXT'
sc.render.film_transparent = False
sc.render.resolution_x     = 1280
sc.render.resolution_y     = 720
sc.render.fps              = FPS
sc.frame_start             = 1
sc.frame_end               = FRAMES
sc.render.filepath         = OUTPUT_DIR
sc.render.image_settings.file_format = 'FFMPEG'
sc.render.ffmpeg.format    = 'MPEG4'
sc.render.ffmpeg.codec     = 'H264'
sc.render.ffmpeg.constant_rate_factor = 'MEDIUM'

# Camera — orbit keyframes
cam_data = bpy.data.cameras.new("RecordCam")
cam_ob   = bpy.data.objects.new("RecordCam", cam_data)
sc.collection.objects.link(cam_ob)
sc.camera    = cam_ob
cam_data.lens = 50.0

target = Vector((0.0, 0.0, 0.25))

for frame in range(1, FRAMES + 2):
    deg = (frame - 1) / FRAMES * 360.0
    rad = math.radians(deg)
    cam_ob.location = Vector((
        ORBIT_R * math.sin(rad),
       -ORBIT_R * math.cos(rad),
        ORBIT_Z,
    ))
    direction   = target - cam_ob.location
    rot_quat    = direction.to_track_quat('-Z', 'Y')
    cam_ob.rotation_euler = rot_quat.to_euler()
    cam_ob.keyframe_insert("location",       frame=frame)
    cam_ob.keyframe_insert("rotation_euler", frame=frame)

for fc in cam_ob.animation_data.action.fcurves:
    for kp in fc.keyframe_points:
        kp.interpolation = 'LINEAR'

# Three-point lighting
def add_area(name, energy, loc):
    ld  = bpy.data.lights.new(name, 'AREA')
    lob = bpy.data.objects.new(name, ld)
    sc.collection.objects.link(lob)
    lob.location = Vector(loc)
    ld.energy    = energy
    ld.size      = 1.2
    # Point light at mesh centre
    d = target - lob.location
    lob.rotation_euler = d.to_track_quat('-Z', 'Y').to_euler()

add_area("Key",  900, ( 1.8, -1.8,  2.2))
add_area("Fill", 250, (-1.8,  0.5,  1.0))
add_area("Rim",  450, ( 0.0,  2.2,  1.6))

bpy.ops.render.render(animation=True)
print("[holoflow] record.py complete")
