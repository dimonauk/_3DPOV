"""
record.py — Mandelbox Poi Head viewport animation
==================================================
Run this script AFTER blueprint.py has built the mandelbox_poi object.
Outputs: public/library/videos/scripting/<slug>/viewport.mp4

Animation (10 s at 24 fps = 240 frames):
  0-60   Basis (scale=-1.5) steady, camera orbits 0→120°
  61-120 Morph SK_Scale2 (scale=-2.0): spines lengthen, cam 120→200°
  121-180 Hold SK_Scale2: camera 200→260°, full-orbit reveals dendritic detail
  181-240 Morph back to Basis: cam 260→360°

Camera: 85 mm telephoto, elevation 28°, distance 0.8 m (poi at origin)
Renderer: Workbench VERTEX colour, background black
"""

import bpy, math

SLUG = "python-numpy-mandelbox-box-fold-ball-fold-lowe-2010-fractal-de-poi-head-webxr"
OUT  = f"//public/library/videos/scripting/{SLUG}/viewport.mp4"
FPS  = 24
FRAMES = 240  # 10 s

scn = bpy.context.scene
scn.frame_start = 1;  scn.frame_end = FRAMES
scn.render.fps   = FPS
scn.render.filepath      = OUT
scn.render.image_settings.file_format = 'FFMPEG'
scn.render.ffmpeg.format = 'MPEG4'
scn.render.ffmpeg.codec  = 'H264'
scn.render.ffmpeg.constant_rate_factor = 'MEDIUM'
scn.render.resolution_x = 1920;  scn.render.resolution_y = 1080
scn.render.resolution_percentage = 100

# Workbench engine with vertex colour
scn.render.engine = 'BLENDER_WORKBENCH'
scn.display.shading.light      = 'MATCAP'
scn.display.shading.color_type = 'VERTEX'
scn.world.color = (0, 0, 0)

ob = bpy.data.objects.get('mandelbox_poi')
if ob is None:
    raise RuntimeError("mandelbox_poi not found — run blueprint.py first")

# Camera rig
if 'RecordCam' not in bpy.data.objects:
    bpy.ops.object.camera_add()
cam_ob = bpy.context.active_object
cam_ob.name = 'RecordCam'
cam_ob.data.lens = 85
scn.camera = cam_ob

def set_camera(frame: int, deg: float) -> None:
    """Position camera on orbit at given azimuth (degrees), elevation 28°."""
    el = math.radians(28)
    az = math.radians(deg)
    dist = 0.8
    cam_ob.location = (
        dist * math.cos(el) * math.cos(az),
        dist * math.cos(el) * math.sin(az),
        dist * math.sin(el),
    )
    # Look at origin
    dx = -cam_ob.location[0]; dy = -cam_ob.location[1]; dz = -cam_ob.location[2]
    cam_ob.rotation_euler = (
        math.atan2(math.sqrt(dx**2 + dy**2), -dz) + math.pi,
        0,
        math.atan2(dy, dx) + math.pi / 2,
    )
    cam_ob.keyframe_insert(data_path='location', frame=frame)
    cam_ob.keyframe_insert(data_path='rotation_euler', frame=frame)

# Camera orbit keyframes
set_camera(1,   0)
set_camera(60,  120)
set_camera(120, 200)
set_camera(180, 260)
set_camera(240, 360)

# Shape key animation
keys = ob.data.shape_keys.key_blocks
for sk in keys:
    sk.value = 0.0
keys['Basis'].value = 1.0

def sk_key(frame: int, val_basis: float, val_sk2: float) -> None:
    keys['Basis'].value = val_basis;  keys['Basis'].keyframe_insert('value', frame=frame)
    keys['SK_Scale2'].value = val_sk2;  keys['SK_Scale2'].keyframe_insert('value', frame=frame)

# Frames 1-60: pure Basis
sk_key(1,   1.0, 0.0)
sk_key(60,  1.0, 0.0)
# Frames 61-120: morph to SK_Scale2
sk_key(61,  1.0, 0.0)
sk_key(120, 0.0, 1.0)
# Frames 121-180: hold SK_Scale2
sk_key(121, 0.0, 1.0)
sk_key(180, 0.0, 1.0)
# Frames 181-240: morph back to Basis
sk_key(181, 0.0, 1.0)
sk_key(240, 1.0, 0.0)

bpy.ops.render.render(animation=True)
print(f"[record] → {OUT}")
