"""
record.py — Viewport Animation for Penrose P2 Kite-Dart Stage Floor
=====================================================================
Renders a 10-second orbital flyover of the P2 floor using EEVEE Next,
outputting frames to public/library/videos/scripting/
python-numpy-penrose-p2-kite-dart-aperiodic-robinson-deflation-stage-floor-webxr/
viewport.mp4 when run from a local Blender session by Dimona.

Sequence
--------
  F1  – F60  (2 s): camera descends from overhead (looking straight down)
                    to a low 25° elevation angle, revealing tile layout.
  F61 – F240 (6 s): 360° slow orbit at 25° elevation, 2.8 m radius,
                    showing amber kites vs crimson dart pattern.
  F241– F300 (2 s): camera rises back to overhead bird's-eye for outro.

Run inside Blender after blueprint.py has built the mesh:
  bpy.ops.script.exec_preset(filepath="record.py")
"""

import bpy
import math

# ── Scene / render settings ───────────────────────────────────────────────────
scene          = bpy.context.scene
scene.render.engine              = 'BLENDER_EEVEE_NEXT'
scene.render.resolution_x        = 1920
scene.render.resolution_y        = 1080
scene.render.fps                  = 30
scene.render.image_settings.file_format = 'FFMPEG'
scene.render.ffmpeg.format        = 'MPEG4'
scene.render.ffmpeg.codec         = 'H264'
scene.render.ffmpeg.constant_rate_factor = 'MEDIUM'
scene.frame_start = 1
scene.frame_end   = 300

OUTPUT = ("//public/library/videos/scripting/"
          "python-numpy-penrose-p2-kite-dart-aperiodic-robinson-deflation-"
          "stage-floor-webxr/viewport.mp4")
scene.render.filepath = OUTPUT

# EEVEE Next bloom — metallic tiles catch highlights nicely
eevee = scene.eevee
eevee.use_bloom          = True
eevee.bloom_threshold    = 0.75
eevee.bloom_intensity    = 0.45
eevee.bloom_radius       = 5.0
eevee.use_gtao           = True         # ambient occlusion sharpens tile edges

# ── World — dark studio for metallic floor pop ────────────────────────────────
world = bpy.data.worlds.new("P2World")
bpy.context.scene.world = world
world.use_nodes = True
bg = world.node_tree.nodes["Background"]
bg.inputs[0].default_value = (0.02, 0.02, 0.03, 1.0)
bg.inputs[1].default_value = 0.8

# ── Key light (area, warm white, raking angle to reveal extrusion relief) ─────
if "P2_Key" not in bpy.data.lights:
    light_data = bpy.data.lights.new("P2_Key", 'AREA')
else:
    light_data = bpy.data.lights["P2_Key"]
light_data.energy = 600
light_data.color  = (1.0, 0.95, 0.88)
light_data.size   = 1.5

if "P2_Key" not in bpy.data.objects:
    light_obj = bpy.data.objects.new("P2_Key", light_data)
    bpy.context.collection.objects.link(light_obj)
else:
    light_obj = bpy.data.objects["P2_Key"]
light_obj.location = (2.5, -2.0, 3.5)
light_obj.rotation_euler = (math.radians(55), 0, math.radians(35))

# ── Camera ────────────────────────────────────────────────────────────────────
if "P2_Cam" not in bpy.data.cameras:
    cam_data = bpy.data.cameras.new("P2_Cam")
else:
    cam_data = bpy.data.cameras["P2_Cam"]
cam_data.lens       = 50
cam_data.clip_start = 0.1
cam_data.clip_end   = 20.0

if "P2_Cam" not in bpy.data.objects:
    cam_obj = bpy.data.objects.new("P2_Cam", cam_data)
    bpy.context.collection.objects.link(cam_obj)
else:
    cam_obj = bpy.data.objects["P2_Cam"]
scene.camera = cam_obj

# Animated camera path helper
def set_camera_keyframe(frame, elev_deg, azim_deg, radius, target_z=0.0):
    """Place camera on a sphere and point it at the origin."""
    import mathutils
    elev = math.radians(elev_deg)
    azim = math.radians(azim_deg)
    x = radius * math.cos(elev) * math.cos(azim)
    y = radius * math.cos(elev) * math.sin(azim)
    z = radius * math.sin(elev) + target_z
    cam_obj.location = (x, y, z)
    direction = mathutils.Vector((0, 0, target_z)) - mathutils.Vector((x, y, z))
    rot = direction.to_track_quat('-Z', 'Y')
    cam_obj.rotation_mode   = 'QUATERNION'
    cam_obj.rotation_quaternion = rot
    scene.frame_set(frame)
    cam_obj.keyframe_insert(data_path='location', frame=frame)
    cam_obj.keyframe_insert(data_path='rotation_quaternion', frame=frame)

# Sequence keyframes
set_camera_keyframe(frame=1,   elev_deg=88, azim_deg=0,   radius=3.2)  # near-overhead
set_camera_keyframe(frame=60,  elev_deg=25, azim_deg=0,   radius=2.8)  # low angle
set_camera_keyframe(frame=150, elev_deg=25, azim_deg=180, radius=2.8)  # orbit half
set_camera_keyframe(frame=240, elev_deg=25, azim_deg=360, radius=2.8)  # orbit full
set_camera_keyframe(frame=300, elev_deg=88, azim_deg=360, radius=3.2)  # back up

# Smooth interpolation on all camera fcurves
for fc in cam_obj.animation_data.action.fcurves:
    for kp in fc.keyframe_points:
        kp.interpolation = 'BEZIER'

print("record.py: keyframes set — render with Ctrl-F12 or bpy.ops.render.render(animation=True)")
