"""
record.py — viewport animation for extrude_face_region control deck
═══════════════════════════════════════════════════════════════════
Renders public/library/videos/scripting/
  python-bmesh-ops-extrude-face-region-panel-push-control-deck-webxr/
  viewport.mp4

Technique animated: camera orbits 120° around the finished deck, showing the
panel-push geometry from multiple angles.  Duration: 8 seconds at 24 fps.

Run from Blender's Script Editor after blueprint.py has been executed, so
the hf_control_deck object already exists in the scene.
"""

import math
import os

import bpy
from mathutils import Vector

# ── OUTPUT PATH ──────────────────────────────────────────────────────────────
VIDEO_DIR = os.path.join(
    os.path.dirname(__file__),
    "..", "..", "..", "..", "videos",
    "scripting",
    "python-bmesh-ops-extrude-face-region-panel-push-control-deck-webxr",
)
os.makedirs(VIDEO_DIR, exist_ok=True)
OUTPUT_PATH = os.path.join(VIDEO_DIR, "viewport.mp4")

# ── RENDER SETTINGS ──────────────────────────────────────────────────────────
FPS        = 24
DURATION_S = 8
N_FRAMES   = FPS * DURATION_S    # 192

ORBIT_START_DEG = -30    # start angle (deg, around Z)
ORBIT_END_DEG   = 90     # end angle — 120° arc
CAM_RADIUS      = 1.10   # metres from deck centre
CAM_Z           = 0.45   # camera elevation [m]
CAM_TILT        = 0.40   # radians — look-down angle toward the deck

scene = bpy.context.scene
scene.render.fps = FPS
scene.frame_start = 1
scene.frame_end   = N_FRAMES

scene.render.engine         = 'BLENDER_WORKBENCH'
scene.render.image_settings.file_format = 'FFMPEG'
scene.render.ffmpeg.format  = 'MPEG4'
scene.render.ffmpeg.codec   = 'H264'
scene.render.ffmpeg.constant_rate_factor = 'MEDIUM'
scene.render.resolution_x   = 1920
scene.render.resolution_y   = 1080
scene.render.filepath        = OUTPUT_PATH

# ── WORKBENCH LOOK ───────────────────────────────────────────────────────────
scene.display.shading.light      = 'MATCAP'
scene.display.shading.show_cavity = True
scene.display.shading.cavity_type = 'BOTH'
scene.display.shading.cavity_ridge_factor  = 1.0
scene.display.shading.cavity_valley_factor = 0.7

# ── CAMERA ───────────────────────────────────────────────────────────────────
cam_data = bpy.data.cameras.new("record_cam")
cam_ob   = bpy.data.objects.new("record_cam", cam_data)
scene.collection.objects.link(cam_ob)
scene.camera = cam_ob

cam_data.lens = 50  # 50mm — minimal perspective distortion for product shots

# Keyframe camera position along the orbit arc.
# At each frame: position = (cos θ, sin θ, CAM_Z) * CAM_RADIUS;
# rotation = look-at deck centre with CAM_TILT lean.
for frame in range(1, N_FRAMES + 1):
    t       = (frame - 1) / (N_FRAMES - 1)          # 0 → 1
    deg     = ORBIT_START_DEG + t * (ORBIT_END_DEG - ORBIT_START_DEG)
    rad     = math.radians(deg)
    cam_x   = math.cos(rad) * CAM_RADIUS
    cam_y   = math.sin(rad) * CAM_RADIUS
    cam_ob.location = (cam_x, cam_y, CAM_Z)

    # Point camera toward origin, then tilt down.
    # Euler XYZ: Z-rot rotates around orbit; X-rot tilts forward.
    cam_ob.rotation_mode = 'XYZ'
    cam_ob.rotation_euler[0] = math.pi * 0.5 - CAM_TILT  # ~80° from horizontal
    cam_ob.rotation_euler[1] = 0.0
    cam_ob.rotation_euler[2] = rad + math.pi             # face toward origin

    scene.frame_set(frame)
    cam_ob.keyframe_insert("location")
    cam_ob.keyframe_insert("rotation_euler")

# ── THREE-POINT LIGHTING ─────────────────────────────────────────────────────
def add_light(name, loc, energy, kind='AREA'):
    ld = bpy.data.lights.new(name, kind)
    ld.energy = energy
    lo = bpy.data.objects.new(name, ld)
    scene.collection.objects.link(lo)
    lo.location = loc
    # Aim lights at deck centre
    dir_v = Vector((0, 0, 0)) - Vector(loc)
    lo.rotation_euler = dir_v.to_track_quat('-Z', 'Y').to_euler()
    return lo

add_light("key",   ( 1.5,  -1.0, 1.8), energy=30)
add_light("fill",  (-1.0,   0.5, 1.2), energy=12)
add_light("rim",   ( 0.0,   1.5, 2.0), energy=18)

# ── RENDER ───────────────────────────────────────────────────────────────────
bpy.ops.render.render(animation=True)
print(f"[record] viewport animation → {OUTPUT_PATH}")
