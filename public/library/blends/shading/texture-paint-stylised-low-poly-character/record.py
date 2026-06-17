#!/usr/bin/env python3
"""
record.py — Viewport animation for gem_totem texture painting tutorial.
Outputs: public/library/videos/shading/texture-paint-stylised-low-poly-character/viewport.mp4

Sequence (90 frames @ 30 fps = 3 s):
  F 1-30   : Top-down orthographic — shows the UV atlas painted on the canvas
             (camera looks straight down at the totem, emission zones glow)
  F30-90   : Camera orbits 360° around the totem at mid-height elevation 30°
             This shows all four material zones: stone base, metal panels,
             warm skin facets, glowing cyan gem crown.

WHY show the UV atlas view: this is the core teaching moment. Viewers
understand that what they painted on the 2D canvas is literally what they
see on the 3D surface. The transition from top-down to orbit makes this
mapping visceral without narration.
"""

import bpy, math
from mathutils import Vector

# ── Re-run blueprint to ensure scene is built ─────────────────────────────────
exec(open("blueprint.py").read())

sc  = bpy.context.scene
totem = bpy.data.objects["gem_totem"]

# ── Camera ────────────────────────────────────────────────────────────────────
cam_data = bpy.data.cameras.new("record_cam")
cam_data.type = 'PERSP'
cam_data.lens = 50.0
cam_obj = bpy.data.objects.new("record_cam", cam_data)
sc.collection.objects.link(cam_obj)
sc.camera = cam_obj

# ── Lighting ─────────────────────────────────────────────────────────────────
# Key light: warm spot from upper-right
key_data = bpy.data.lights.new("key", type='SPOT')
key_data.energy   = 320.0
key_data.color    = (1.0, 0.92, 0.80)
key_data.spot_size = math.radians(50)
key_obj = bpy.data.objects.new("key", key_data)
key_obj.location       = (2.5, -2.0, 3.5)
key_obj.rotation_euler = (math.radians(42), 0, math.radians(45))
sc.collection.objects.link(key_obj)

# Rim light: cool from behind
rim_data = bpy.data.lights.new("rim", type='SPOT')
rim_data.energy = 120.0
rim_data.color  = (0.60, 0.80, 1.0)
rim_obj = bpy.data.objects.new("rim", rim_data)
rim_obj.location       = (-2.0, 2.5, 1.5)
rim_obj.rotation_euler = (math.radians(65), 0, math.radians(-120))
sc.collection.objects.link(rim_obj)

# ── Render Settings ───────────────────────────────────────────────────────────
sc.render.engine          = 'BLENDER_EEVEE_NEXT'
sc.render.resolution_x    = 1920
sc.render.resolution_y    = 1080
sc.render.fps             = 30
sc.frame_start            = 1
sc.frame_end              = 90
sc.render.image_settings.file_format = 'FFMPEG'
sc.render.ffmpeg.format   = 'MPEG4'
sc.render.ffmpeg.codec    = 'H264'
sc.render.ffmpeg.constant_rate_factor = 'MEDIUM'
sc.render.filepath = "//../../videos/shading/texture-paint-stylised-low-poly-character/viewport"

sc.eevee.use_shadows    = True
sc.eevee.use_bloom      = True   # makes the cyan gem glow more visible
sc.eevee.bloom_intensity = 0.08
sc.eevee.use_raytracing = False

# ── Phase 1: F1-30 Top-Down Atlas View ───────────────────────────────────────
# Camera directly above the totem looking down.
# Shows the flat UV-painted surface — makes the texture-paint concept clear.
cam_obj.location = Vector((0.0, 0.0, 4.2))
cam_obj.rotation_euler = (0.0, 0.0, 0.0)   # looking straight down (Blender -Z = lens axis)
# Actually for top-down in Blender: rotation = (0, 0, 0) points lens toward -Z.
cam_obj.keyframe_insert(data_path='location',       frame=1)
cam_obj.keyframe_insert(data_path='rotation_euler', frame=1)

# Hold the top-down view through frame 30
cam_obj.keyframe_insert(data_path='location',       frame=30)
cam_obj.keyframe_insert(data_path='rotation_euler', frame=30)

# ── Phase 2: F30-90 Orbit 360° at Elevation ──────────────────────────────────
# Camera path: circle of radius 4.0 at height 1.6, pointing toward origin.
# Keyframe every 20 frames (6 keys over 60 frames = one full revolution).
ORBIT_RADIUS = 4.0
ORBIT_HEIGHT = 1.6
NUM_KEYS     = 6

for i in range(NUM_KEYS + 1):
    frac  = i / NUM_KEYS
    frame = 30 + int(frac * 60)
    angle = frac * math.tau   # 0 → 2π

    cx = ORBIT_RADIUS * math.cos(angle)
    cy = ORBIT_RADIUS * math.sin(angle)

    cam_obj.location = Vector((cx, cy, ORBIT_HEIGHT))

    # Point camera at totem origin using manual Euler (simpler than Track To constraint)
    # Azimuth + elevation rotation
    az   = math.atan2(-cy, -cx)    # azimuth toward origin
    elev = math.atan2(ORBIT_HEIGHT, ORBIT_RADIUS)
    cam_obj.rotation_euler = (math.pi / 2 - elev, 0.0, az + math.pi / 2)

    cam_obj.keyframe_insert(data_path='location',       frame=frame)
    cam_obj.keyframe_insert(data_path='rotation_euler', frame=frame)

# Smooth out the orbit with bezier interpolation
for fc in cam_obj.animation_data.action.fcurves:
    for kp in fc.keyframe_points:
        kp.interpolation = 'BEZIER'
        kp.easing = 'AUTO'

# ── Render ────────────────────────────────────────────────────────────────────
bpy.ops.render.render(animation=True)
print("[record] viewport.mp4 rendered")
