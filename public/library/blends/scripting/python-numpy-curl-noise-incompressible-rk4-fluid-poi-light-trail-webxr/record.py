"""
record.py — Viewport animation for curl-noise poi trail tutorial.

Runs blueprint.py first to build the scene, then sweeps a camera through
240 frames (8 s at 30 fps) orbiting the trail cluster.  Output:
  public/library/videos/scripting/
    python-numpy-curl-noise-incompressible-rk4-fluid-poi-light-trail-webxr/
      viewport.mp4

Run from Blender's Python console or headless:
  blender --background --python record.py
"""

import os
import sys
import math
import bpy

# ── 1. run blueprint to build the scene ───────────────────────────────────────
_here    = os.path.dirname(os.path.abspath(__file__))
_bp_path = os.path.join(_here, "blueprint.py")
exec(open(_bp_path).read())      # noqa: S102  intentional within-Blender exec

# ── 2. camera setup ───────────────────────────────────────────────────────────
FRAMES     = 240
FPS        = 30
CAM_DIST   = 4.5      # metres from origin
OUTPUT_DIR = os.path.normpath(os.path.join(
    _here,
    "../../../../public/library/videos/scripting/"
    "python-numpy-curl-noise-incompressible-rk4-fluid-poi-light-trail-webxr"
))

if "Camera" in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects["Camera"], do_unlink=True)

cam_data = bpy.data.cameras.new("RecordCam")
cam_data.lens = 35
cam_obj  = bpy.data.objects.new("RecordCam", cam_data)
bpy.context.collection.objects.link(cam_obj)
bpy.context.scene.camera = cam_obj

# ── 3. light ──────────────────────────────────────────────────────────────────
if "Light" in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects["Light"], do_unlink=True)

light_data = bpy.data.lights.new("Key", 'POINT')
light_data.energy = 800
light_obj  = bpy.data.objects.new("Key", light_data)
light_obj.location = (3.0, -2.0, 4.0)
bpy.context.collection.objects.link(light_obj)

# ── 4. keyframe camera orbit ──────────────────────────────────────────────────
# Phase 1: slow orbit 0–90°   (frames 1–80)   — establish the swirl volume
# Phase 2: altitude rise       (frames 81–160) — reveal depth of trail layers
# Phase 3: close spiral zoom  (frames 161–240) — single trail detail

scene = bpy.context.scene
scene.frame_start = 1
scene.frame_end   = FRAMES
scene.render.fps  = FPS

def _place_cam(frame: int, theta: float, phi: float, dist: float):
    x = dist * math.cos(phi) * math.cos(theta)
    y = dist * math.cos(phi) * math.sin(theta)
    z = dist * math.sin(phi)
    cam_obj.location = (x, y, z)
    # point at origin
    dx, dy, dz = -x, -y, -z
    length = math.sqrt(dx*dx + dy*dy + dz*dz)
    cam_obj.rotation_euler = (
        math.atan2(math.sqrt(dx*dx + dy*dy), dz),
        0.0,
        math.atan2(dy, dx) + math.pi/2,
    )
    cam_obj.keyframe_insert("location",       frame=frame)
    cam_obj.keyframe_insert("rotation_euler", frame=frame)

import mathutils
def _look_at_cam(frame: int, pos, target=(0,0,0)):
    cam_obj.location = pos
    direction = mathutils.Vector(target) - mathutils.Vector(pos)
    rot_quat  = direction.to_track_quat('-Z', 'Y')
    cam_obj.rotation_euler = rot_quat.to_euler()
    cam_obj.keyframe_insert("location",       frame=frame)
    cam_obj.keyframe_insert("rotation_euler", frame=frame)

# phase 1: equatorial orbit 0→90°, distance 4.5
for i in range(80):
    t = i / 79.0
    _look_at_cam(i + 1,
                 (CAM_DIST * math.cos(math.pi/2 * t),
                  CAM_DIST * math.sin(math.pi/2 * t),
                  1.0))

# phase 2: rise from z=1 to z=3, orbit continues 90→180°
for i in range(80):
    t = i / 79.0
    theta = math.pi/2 + math.pi/2 * t
    z = 1.0 + 2.0 * t
    r = math.sqrt(CAM_DIST**2 - z**2) if CAM_DIST**2 > z**2 else 1.0
    _look_at_cam(80 + i + 1,
                 (r * math.cos(theta),
                  r * math.sin(theta),
                  z))

# phase 3: close spiral zoom 180→270°, dist 4.5→2.5
for i in range(80):
    t = i / 79.0
    theta = math.pi + math.pi/2 * t
    dist  = CAM_DIST - 2.0 * t
    z     = 3.0 - 1.5 * t
    r     = math.sqrt(max(dist**2 - z**2, 0.1))
    _look_at_cam(160 + i + 1,
                 (r * math.cos(theta),
                  r * math.sin(theta),
                  z))

# ── 5. render settings ────────────────────────────────────────────────────────
scene.render.engine                 = 'BLENDER_EEVEE_NEXT'
scene.render.resolution_x           = 1920
scene.render.resolution_y           = 1080
scene.render.resolution_percentage  = 100
scene.render.image_settings.file_format = 'FFMPEG'
scene.render.ffmpeg.format          = 'MPEG4'
scene.render.ffmpeg.codec           = 'H264'
scene.render.ffmpeg.constant_rate_factor = 'MEDIUM'
scene.render.filepath               = os.path.join(OUTPUT_DIR, "viewport.mp4")

os.makedirs(OUTPUT_DIR, exist_ok=True)
bpy.ops.render.render(animation=True)
print(f"[record] ✓ {scene.render.filepath}")
