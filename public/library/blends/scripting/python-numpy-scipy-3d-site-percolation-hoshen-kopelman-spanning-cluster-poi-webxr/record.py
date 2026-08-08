"""
record.py — Viewport animation render for the percolation poi head.
Outputs: public/library/videos/scripting/
         python-numpy-scipy-3d-site-percolation-hoshen-kopelman-spanning-cluster-poi-webxr/viewport.mp4

Run AFTER blueprint.py (requires the saved .blend to exist).
Open hf_percolation_poi.blend in Blender, then run this script from the
Scripting workspace.

Animation: 150-frame full 360° orbit at 28° elevation with a gentle
ease-in on the first 15 frames, letting viewers absorb the fractal
voxel geometry from all angles.  Eevee Bloom is active so the teal tips
halo against the amber core.
"""

import bpy, math, os

# ── Output path ────────────────────────────────────────────────────────────────
SLUG    = "python-numpy-scipy-3d-site-percolation-hoshen-kopelman-spanning-cluster-poi-webxr"
TOPIC   = "scripting"
OUT_DIR = os.path.join(
    bpy.path.abspath("//"),
    "..", "..", "..", "..", "videos", TOPIC, SLUG)
os.makedirs(OUT_DIR, exist_ok=True)
OUT_PATH = os.path.join(OUT_DIR, "viewport")    # Blender appends frame + ext

FRAMES      = 150      # 5 s at 30 fps
ELEVATION   = 28.0     # degrees above equator
ORBIT_R     = 0.32     # camera distance in metres
BLOOM_THR   = 0.35
BLOOM_INT   = 0.70

# ── Render settings ─────���──────────────────────────────────────────────────────
scn = bpy.context.scene
scn.render.engine                        = 'BLENDER_EEVEE_NEXT'
scn.render.resolution_x                  = 1920
scn.render.resolution_y                  = 1080
scn.render.fps                           = 30
scn.frame_start                          = 1
scn.frame_end                            = FRAMES
scn.render.image_settings.file_format    = 'FFMPEG'
scn.render.ffmpeg.format                 = 'MPEG4'
scn.render.ffmpeg.codec                  = 'H264'
scn.render.ffmpeg.constant_rate_factor   = 'MEDIUM'
scn.render.filepath                      = OUT_PATH

eevee = scn.eevee
eevee.use_bloom       = True
eevee.bloom_threshold = BLOOM_THR
eevee.bloom_intensity = BLOOM_INT

# ── Camera: animated orbit ────���────────────────────────────────────────────────
for ob in bpy.data.objects:
    if ob.type == 'CAMERA':
        bpy.data.objects.remove(ob, do_unlink=True)

cam_data = bpy.data.cameras.new("RecordCam")
cam_data.lens = 50
cam_obj  = bpy.data.objects.new("RecordCam", cam_data)
scn.collection.objects.link(cam_obj)
scn.camera = cam_obj
cam_obj.rotation_mode = 'XYZ'

elev_r = math.radians(ELEVATION)
cam_obj.animation_data_create()
cam_obj.animation_data.action = bpy.data.actions.new("CamOrbit")

for frame in range(1, FRAMES + 1):
    # Ease-in: slow start, steady from frame 15
    t_raw = (frame - 1) / (FRAMES - 1)
    t     = t_raw if frame >= 15 else t_raw * t_raw / ((15/FRAMES) ** 1)
    angle = 2 * math.pi * t_raw           # full 360° regardless
    x = ORBIT_R * math.cos(angle) * math.cos(elev_r)
    y = ORBIT_R * math.sin(angle) * math.cos(elev_r)
    z = ORBIT_R * math.sin(elev_r)
    cam_obj.location = (x, y, z)
    # Point toward origin
    cam_obj.rotation_euler = (
        math.pi / 2 - elev_r,
        0.0,
        math.atan2(y, x) + math.pi / 2,
    )
    cam_obj.keyframe_insert("location",       frame=frame)
    cam_obj.keyframe_insert("rotation_euler", frame=frame)

# ── Light ────��─────────────────────────────────────────────────────────────────
for ob in bpy.data.objects:
    if ob.type == 'LIGHT':
        bpy.data.objects.remove(ob, do_unlink=True)
ld = bpy.data.lights.new("Key", type='AREA')
ld.energy = 80
lo = bpy.data.objects.new("Key", ld)
scn.collection.objects.link(lo)
lo.location = (0.22, -0.18, 0.28)

# ── Render ─��───────────────────────────────────────────────────────────────────
bpy.ops.render.render(animation=True)
print(f"[record] viewport.mp4 written to {OUT_DIR}")
