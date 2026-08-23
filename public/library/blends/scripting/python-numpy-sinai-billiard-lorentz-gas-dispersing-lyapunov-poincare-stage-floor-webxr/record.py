# record.py — Sinai Billiard Stage Floor: viewport animation render
# Run this script inside Blender 5.1 AFTER blueprint.py has built
# sinai_floor.glb and you have loaded it into a new .blend file.
# Outputs: public/library/videos/scripting/
#   python-numpy-sinai-billiard-lorentz-gas-dispersing-lyapunov-poincare-stage-floor-webxr/
#   viewport.mp4
# ================================================================
import math, bpy
from mathutils import Vector, Euler

# ─── OUTPUT PATH ──────────────────────────────────────────────
VID_DIR   = "//../../../../videos/scripting/"
VID_DIR  += "python-numpy-sinai-billiard-lorentz-gas-dispersing-lyapunov-poincare-stage-floor-webxr/"
VID_FILE  = VID_DIR + "viewport"     # Blender appends _0001.png or .mp4

# ─── CONSTANTS ────────────────────────────────────────────────
FRAMES      = 120          # 4 seconds at 30 fps
CAM_DIST    = 7.0          # distance from origin in metres
CAM_ELEV    = 38.0         # elevation angle in degrees
LENS        = 72.0         # focal length mm (moderate wide for floor overview)
ORBIT_TURNS = 0.75         # fraction of full orbit (270°)
SUN_ENERGY  = 5.0

# ─── SCENE SETUP ──────────────────────────────────────────────
sc  = bpy.context.scene
sc.frame_start = 1
sc.frame_end   = FRAMES
sc.render.fps  = 30

# Remove default cube/camera/light if present
for obj in list(bpy.data.objects):
    if obj.type in {'CAMERA', 'LIGHT', 'MESH'} and obj.name in {
        'Cube', 'Camera', 'Light'
    }:
        bpy.data.objects.remove(obj, do_unlink=True)

# ─── CAMERA RIG ───────────────────────────────────────────────
# Empty at origin; camera parented to it, orbits by rotating empty
rig = bpy.data.objects.new("CamRig", None)
bpy.context.collection.objects.link(rig)

cam_data = bpy.data.cameras.new("Cam")
cam_data.lens = LENS
cam_obj  = bpy.data.objects.new("Cam", cam_data)
bpy.context.collection.objects.link(cam_obj)
cam_obj.parent = rig

elev_rad   = math.radians(CAM_ELEV)
cam_obj.location = Vector((0.0, -CAM_DIST * math.cos(elev_rad),
                             CAM_DIST * math.sin(elev_rad)))
cam_obj.rotation_euler = Euler((math.pi * 0.5 - elev_rad, 0.0, 0.0), 'XYZ')
sc.camera = cam_obj

# Keyframe rig Z-rotation: 0 → ORBIT_TURNS * 360°
rig.rotation_euler = (0.0, 0.0, 0.0)
rig.keyframe_insert("rotation_euler", frame=1)
rig.rotation_euler = (0.0, 0.0, math.radians(ORBIT_TURNS * 360.0))
rig.keyframe_insert("rotation_euler", frame=FRAMES)

for fc in rig.animation_data.action.fcurves:
    for kp in fc.keyframe_points:
        kp.interpolation = 'LINEAR'

# ─── 3-POINT LIGHTING ─────────────────────────────────────────
def add_sun(name, direction, energy, angle_deg=15.0):
    ld   = bpy.data.lights.new(name, 'SUN')
    ld.energy = energy
    ld.angle  = math.radians(angle_deg)
    lo   = bpy.data.objects.new(name, ld)
    bpy.context.collection.objects.link(lo)
    # Point light in 'direction' by rotating default downward sun
    lo.rotation_euler = Euler(
        (math.atan2(direction[1], direction[2]),
         -math.atan2(direction[0], math.sqrt(direction[1]**2+direction[2]**2)),
         0.0), 'XYZ')
    return lo

add_sun("KeyLight",  ( 0.5, -0.8,  1.0), SUN_ENERGY,       angle_deg=12.0)
add_sun("FillLight", (-1.0,  0.3,  0.6), SUN_ENERGY * 0.4, angle_deg=30.0)
add_sun("RimLight",  ( 0.2,  1.0,  0.4), SUN_ENERGY * 0.6, angle_deg=20.0)

# ─── RENDER SETTINGS (Eevee Next) ─────────────────────────────
sc.render.engine              = 'BLENDER_EEVEE_NEXT'
sc.render.resolution_x        = 1920
sc.render.resolution_y        = 1080
sc.render.resolution_percentage = 100
sc.render.filepath            = VID_FILE
sc.render.image_settings.file_format  = 'FFMPEG'
sc.render.ffmpeg.format               = 'MPEG4'
sc.render.ffmpeg.codec                = 'H264'
sc.render.ffmpeg.constant_rate_factor = 'MEDIUM'

# Bloom for the glowing vertex-colour ridges
eevee = sc.eevee
if hasattr(eevee, 'use_bloom'):
    eevee.use_bloom = True
    eevee.bloom_threshold = 0.40
    eevee.bloom_intensity = 0.30

# ─── RENDER ───────────────────────────────────────────────────
import os
os.makedirs(bpy.path.abspath(VID_DIR), exist_ok=True)
bpy.ops.render.render(animation=True)
print("[Sinai record] Done →", bpy.path.abspath(VID_FILE))
