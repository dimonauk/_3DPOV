"""
record.py — Viewport render for Arnold Tongue tutorial
======================================================
Blender 5.1 | CC0

Pre-condition: run blueprint.py first so "hf_arnold_tongue" exists in the scene.
Output: public/library/videos/scripting/
        python-numpy-arnold-tongue-circle-map-mode-locking-poi-disc-webxr/viewport.mp4

The animation orbits the camera once around the displaced mesh, starting
top-down (showing the full (Ω, K) parameter plane and its coloured tongues)
then tilting to a low oblique angle that reveals the raised plateau relief.
A second half-orbit returns to top-down so the clip loops cleanly.
"""

import bpy
import math

# ── Timing ───────────────────────────────────────────────────────────────────
FPS        = 30
DURATION_S = 12
FRAMES     = FPS * DURATION_S

scene = bpy.context.scene
scene.frame_start = 1
scene.frame_end   = FRAMES
scene.render.fps  = FPS

# ── Camera ───────────────────────────────────────────────────────────────────
cam_data      = bpy.data.cameras.new("rec_cam")
cam_data.type = 'PERSP'
cam_data.lens = 48.0
cam_obj       = bpy.data.objects.new("rec_cam", cam_data)
bpy.context.collection.objects.link(cam_obj)
scene.camera = cam_obj

# Orbit: azimuth completes one full circle; elevation dips from 80° to 18°
# and returns, so both the top-down colour map and the side relief are seen.
for f in range(1, FRAMES + 1):
    t       = (f - 1) / (FRAMES - 1)            # 0 → 1
    azimuth = 2.0 * math.pi * t                 # full orbit
    elev_deg = 80.0 - 62.0 * math.sin(math.pi * t)  # 80° → 18° → 80°
    elev    = math.radians(elev_deg)
    radius  = 3.2 + 0.6 * (1.0 - math.sin(math.pi * t))

    x = radius * math.cos(azimuth) * math.cos(elev)
    y = radius * math.sin(azimuth) * math.cos(elev)
    z = radius * math.sin(elev)

    # Point camera at the mesh centroid (roughly world origin)
    cam_obj.location = (x, y, z)
    # Rotation: tilt up to look at origin
    cam_obj.rotation_euler = (
        math.pi / 2.0 - elev,
        0.0,
        azimuth + math.pi / 2.0,
    )
    cam_obj.keyframe_insert("location",       frame=f)
    cam_obj.keyframe_insert("rotation_euler", frame=f)

# ── Lighting ─────────────────────────────────────────────────────────────────
sun           = bpy.data.lights.new("rec_sun", 'SUN')
sun.energy    = 4.0
sun.angle     = math.radians(8)
sun_obj       = bpy.data.objects.new("rec_sun", sun)
sun_obj.rotation_euler = (math.radians(50), 0.0, math.radians(25))
bpy.context.collection.objects.link(sun_obj)

fill          = bpy.data.lights.new("rec_fill", 'AREA')
fill.energy   = 250
fill.size     = 2.0
fill_obj      = bpy.data.objects.new("rec_fill", fill)
fill_obj.location = (-2.0, -2.0, 3.0)
bpy.context.collection.objects.link(fill_obj)

# Back rim to catch the plateau edges
rim           = bpy.data.lights.new("rec_rim", 'SPOT')
rim.energy    = 120
rim.spot_size = math.radians(60)
rim_obj       = bpy.data.objects.new("rec_rim", rim)
rim_obj.location        = (0.0, 2.5, 1.8)
rim_obj.rotation_euler  = (math.radians(-35), 0.0, 0.0)
bpy.context.collection.objects.link(rim_obj)

# ── Render settings ───────────────────────────────────────────────────────────
scene.render.engine                      = 'BLENDER_EEVEE_NEXT'
scene.render.resolution_x                = 1920
scene.render.resolution_y                = 1080
scene.render.image_settings.file_format  = 'FFMPEG'
scene.render.ffmpeg.format               = 'MPEG4'
scene.render.ffmpeg.codec                = 'H264'
scene.render.ffmpeg.constant_rate_factor = 'MEDIUM'
scene.render.filepath = (
    "//../../videos/scripting/"
    "python-numpy-arnold-tongue-circle-map-mode-locking-poi-disc-webxr/viewport"
)

bpy.ops.render.render(animation=True, write_still=False)
print("[record] Viewport render complete.")
