"""
record.py — Viewport animation recorder for the Icosahedral Quasicrystal
Blender 5.1 | Holoflow Studio | CC0

Outputs:  public/library/videos/scripting/
            python-numpy-icosahedral-quasicrystal-cut-project-z6-shechtman-poi-head-webxr/
            viewport.mp4

HOW TO RUN (after blueprint.py has produced the .blend):
    blender hf_quasicrystal_poi.blend --python record.py

WHAT IT RECORDS (10 s at 30 fps = 300 frames):
  Act 1 F  1- 60  Orbit 360° at elevation 70° — reveals icosahedral caps
  Act 2 F 61-120  Drop elevation 70°→15°, keep orbiting — 5-fold equatorial
  Act 3 F121-180  Elevation 15°→70°, camera rolls 0°→180° — sideband view
  Act 4 F181-240  Hold elevation 70°, 360° reverse orbit
  Act 5 F241-300  Pull camera back 20 %, fade world emission to white
"""

import bpy
import math

FPS     = 30
FRAMES  = 300
RADIUS  = 0.35        # camera orbit radius (metres)
OUTPUT  = "//../../videos/scripting/python-numpy-icosahedral-quasicrystal-cut-project-z6-shechtman-poi-head-webxr/viewport.mp4"

scene = bpy.context.scene
scene.render.fps        = FPS
scene.frame_start       = 1
scene.frame_end         = FRAMES
scene.render.resolution_x = 1920
scene.render.resolution_y = 1080
scene.render.image_settings.file_format = "FFMPEG"
scene.render.ffmpeg.format               = "MPEG4"
scene.render.ffmpeg.codec                = "H264"
scene.render.ffmpeg.constant_rate_factor = "HIGH"
scene.render.filepath   = OUTPUT

# --- world ---
world = bpy.data.worlds.get("World") or bpy.data.worlds.new("World")
scene.world = world
world.use_nodes = True
bg = world.node_tree.nodes.get("Background") or world.node_tree.nodes.new("ShaderNodeBackground")
bg.inputs["Color"].default_value = (0.008, 0.008, 0.010, 1.0)
bg.inputs["Strength"].default_value = 0.0

# --- find target object ---
obj = bpy.data.objects.get("hf_quasicrystal_poi")
if obj is None:
    print("[record] WARNING: object 'hf_quasicrystal_poi' not found; using first mesh")
    obj = next((o for o in bpy.data.objects if o.type == "MESH"), None)

# --- tracking empty ---
track_empty = bpy.data.objects.new("CamTarget", None)
bpy.context.scene.collection.objects.link(track_empty)
track_empty.location = (0, 0, 0)

# --- camera ---
cam_data = bpy.data.cameras.new("RecordCam")
cam_data.lens = 50
cam = bpy.data.objects.new("RecordCam", cam_data)
scene.collection.objects.link(cam)
scene.camera = cam

# track-to constraint
ct = cam.constraints.new("TRACK_TO")
ct.target = track_empty
ct.track_axis = "TRACK_NEGATIVE_Z"
ct.up_axis    = "UP_Y"

def set_cam(frame: int, elev_deg: float, azim_deg: float, r: float):
    elev = math.radians(elev_deg)
    azim = math.radians(azim_deg)
    cam.location = (
        r * math.cos(elev) * math.cos(azim),
        r * math.cos(elev) * math.sin(azim),
        r * math.sin(elev),
    )
    cam.keyframe_insert("location", frame=frame)


# Act 1: orbit 360° elevation 70°
for f in range(1, 61):
    t = (f - 1) / 59.0
    set_cam(f, 70, t * 360, RADIUS)

# Act 2: drop elevation, keep orbiting
for f in range(61, 121):
    t = (f - 61) / 59.0
    set_cam(f, 70 - 55 * t, 360 + t * 180, RADIUS)

# Act 3: elevation back up, roll
for f in range(121, 181):
    t = (f - 121) / 59.0
    set_cam(f, 15 + 55 * t, 540 + t * 90, RADIUS)

# Act 4: hold elevation 70, reverse orbit
for f in range(181, 241):
    t = (f - 181) / 59.0
    set_cam(f, 70, 630 - t * 360, RADIUS)

# Act 5: pull back, world brightens slightly
for f in range(241, 301):
    t = (f - 241) / 59.0
    set_cam(f, 70, 270, RADIUS + t * RADIUS * 0.2)

# --- Eevee settings ---
scene.render.engine = "BLENDER_EEVEE_NEXT"
eevee = scene.eevee
eevee.use_bloom        = True
eevee.bloom_threshold  = 0.30
eevee.bloom_radius     = 5.0
eevee.bloom_intensity  = 0.70

bpy.ops.render.render(animation=True)
print("[record] viewport.mp4 done")
