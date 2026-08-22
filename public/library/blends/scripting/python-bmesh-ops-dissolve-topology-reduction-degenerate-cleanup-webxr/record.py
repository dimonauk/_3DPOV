"""
Viewport animation recording — dissolve topology reduction demo.
Output: public/library/videos/scripting/
        python-bmesh-ops-dissolve-topology-reduction-degenerate-cleanup-webxr/
        viewport.mp4
Run inside Blender 5.1 AFTER blueprint.py. Duration: 120 frames @ 24 fps = 5 s.
Camera circles the reduced panel tile at a low angle to reveal the flat normals.
"""

import bpy, math
from mathutils import Vector

FPS       = 24
FRAMES    = 120
OUT_PATH  = (
    "//../../../../videos/scripting/"
    "python-bmesh-ops-dissolve-topology-reduction-degenerate-cleanup-webxr/"
    "viewport"
)
ORBIT_R   = 2.8
ORBIT_PHI = math.radians(30)   # low elevation to show the slab depth

scn = bpy.context.scene
scn.render.fps            = FPS
scn.frame_start           = 1
scn.frame_end             = FRAMES
scn.render.resolution_x   = 1920
scn.render.resolution_y   = 1080
scn.render.image_settings.file_format = 'FFMPEG'
scn.render.ffmpeg.format  = 'MPEG4'
scn.render.ffmpeg.codec   = 'H264'
scn.render.ffmpeg.constant_rate_factor = 'MEDIUM'
scn.render.filepath       = OUT_PATH

cam_data = bpy.data.cameras.new("RecordCam")
cam_data.lens = 35
cam_ob   = bpy.data.objects.new("RecordCam", cam_data)
scn.collection.objects.link(cam_ob)
scn.camera = cam_ob

# Track-To target at panel centre
empty = bpy.data.objects.new("TrackTarget", None)
scn.collection.objects.link(empty)
empty.location = (0.0, 0.0, -DEPTH if False else -0.04)   # mid-slab depth

con            = cam_ob.constraints.new('TRACK_TO')
con.target     = empty
con.track_axis = 'TRACK_NEGATIVE_Z'
con.up_axis    = 'UP_Y'

for fr in range(1, FRAMES + 1):
    t   = (fr - 1) / (FRAMES - 1)
    ang = 2 * math.pi * t
    x   = ORBIT_R * math.cos(ang) * math.cos(ORBIT_PHI)
    y   = ORBIT_R * math.sin(ang) * math.cos(ORBIT_PHI)
    z   = ORBIT_R * math.sin(ORBIT_PHI)
    cam_ob.location = (x, y, z)
    scn.frame_set(fr)
    cam_ob.keyframe_insert(data_path="location", frame=fr)

sun_data          = bpy.data.lights.new("RecordSun", 'SUN')
sun_data.energy   = 5.0
sun_ob            = bpy.data.objects.new("RecordSun", sun_data)
scn.collection.objects.link(sun_ob)
sun_ob.location        = (3.0, -2.0, 4.0)
sun_ob.rotation_euler  = (math.radians(40), 0.0, math.radians(25))

bpy.ops.render.render(animation=True)
