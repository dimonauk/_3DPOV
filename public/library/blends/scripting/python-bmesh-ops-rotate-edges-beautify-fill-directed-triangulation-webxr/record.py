"""
Viewport animation recording for rotate_edges + beautify_fill terrain demo.
Outputs: public/library/videos/scripting/
         python-bmesh-ops-rotate-edges-beautify-fill-directed-triangulation-webxr/
         viewport.mp4
Run this script inside Blender 5.1 after running blueprint.py.
Duration: 120 frames @ 24 fps = 5 seconds. Camera orbits overhead.
"""

import bpy, math
from mathutils import Vector

# ── Parameters ────────────────────────────────────────────────────────────────
FPS        = 24
FRAMES     = 120
OUT_PATH   = "//../../../../videos/scripting/python-bmesh-ops-rotate-edges-beautify-fill-directed-triangulation-webxr/viewport"
ORBIT_R    = 3.2
ORBIT_PHI  = math.radians(50)   # elevation above XY plane

# ── Scene setup ───────────────────────────────────────────────────────────────
scn = bpy.context.scene
scn.render.fps = FPS
scn.frame_start = 1
scn.frame_end   = FRAMES
scn.render.resolution_x = 1920
scn.render.resolution_y = 1080
scn.render.image_settings.file_format = 'FFMPEG'
scn.render.ffmpeg.format  = 'MPEG4'
scn.render.ffmpeg.codec   = 'H264'
scn.render.ffmpeg.constant_rate_factor = 'MEDIUM'
scn.render.filepath = OUT_PATH

# ── Camera ────────────────────────────────────────────────────────────────────
cam_data = bpy.data.cameras.new("RecordCam")
cam_data.lens = 28
cam_ob = bpy.data.objects.new("RecordCam", cam_data)
scn.collection.objects.link(cam_ob)
scn.camera = cam_ob

# Orbit key-frames: camera circles overhead 360° over FRAMES frames
for fr in range(1, FRAMES + 1):
    t   = (fr - 1) / (FRAMES - 1)          # 0 → 1
    ang = 2 * math.pi * t                  # 0 → 2π
    x   = ORBIT_R * math.cos(ang) * math.cos(ORBIT_PHI)
    y   = ORBIT_R * math.sin(ang) * math.cos(ORBIT_PHI)
    z   = ORBIT_R * math.sin(ORBIT_PHI)
    cam_ob.location = (x, y, z)

    # Track-To constraint keeps camera aimed at origin
    # (simpler than recomputing Euler each frame)
    if fr == 1:
        con = cam_ob.constraints.new('TRACK_TO')
        con.target = None                  # track world origin via empty
        empty = bpy.data.objects.new("TrackTarget", None)
        scn.collection.objects.link(empty)
        empty.location = (0, 0, 0.05)     # slightly above slab centre
        con.target = empty
        con.track_axis = 'TRACK_NEGATIVE_Z'
        con.up_axis    = 'UP_Y'

    scn.frame_set(fr)
    cam_ob.keyframe_insert(data_path="location", frame=fr)

# ── Key light ─────────────────────────────────────────────────────────────────
sun_data = bpy.data.lights.new("RecordSun", 'SUN')
sun_data.energy = 4.0
sun_ob   = bpy.data.objects.new("RecordSun", sun_data)
scn.collection.objects.link(sun_ob)
sun_ob.location  = (2, -2, 4)
sun_ob.rotation_euler = (math.radians(45), 0, math.radians(30))

# ── Render ────────────────────────────────────────────────────────────────────
bpy.ops.render.render(animation=True)
