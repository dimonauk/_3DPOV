"""
record.py — Viewport animation for the Oloid poi head
Blender 5.1 · headless render · Holoflow Studio

Renders a 5-second, 30-fps turntable (150 frames) in EEVEE Next.
Output: public/library/videos/scripting/
          python-scipy-oloid-convex-hull-schatz-1929-poi-head-webxr/viewport.mp4

Run after blueprint.py has produced oloid_poi.blend:
  blender --background oloid_poi.blend --python record.py
"""

import bpy, math, os

# ── Constants ─────────────────────────────────────────────────────────────────
FPS        = 30
DURATION_S = 5
FRAMES     = FPS * DURATION_S           # 150 frames
TURN_DEG   = 360.0                      # full turntable

_HERE      = os.path.dirname(os.path.abspath(__file__))
OUT_DIR    = os.path.normpath(os.path.join(
    _HERE, "..", "..", "..", "..", "videos",
    "scripting", "python-scipy-oloid-convex-hull-schatz-1929-poi-head-webxr"
))
OUT_FILE   = os.path.join(OUT_DIR, "viewport.mp4")
os.makedirs(OUT_DIR, exist_ok=True)

# ── Scene ─────────────────────────────────────────────────────────────────────
scene = bpy.context.scene
scene.render.engine          = "BLENDER_EEVEE_NEXT"
scene.render.fps             = FPS
scene.frame_start            = 1
scene.frame_end              = FRAMES
scene.render.resolution_x    = 1280
scene.render.resolution_y    = 720
scene.render.image_settings.file_format = "FFMPEG"
scene.render.ffmpeg.format   = "MPEG4"
scene.render.ffmpeg.codec    = "H264"
scene.render.ffmpeg.constant_rate_factor = "HIGH"
scene.render.filepath        = OUT_FILE

# EEVEE settings
scene.eevee.use_bloom = True
scene.eevee.bloom_intensity = 0.08

# ── Camera ────────────────────────────────────────────────────────────────────
cam_data = bpy.data.cameras.new("RecordCam")
cam_data.lens = 50.0
cam = bpy.data.objects.new("RecordCam", cam_data)
scene.collection.objects.link(cam)
scene.camera = cam

# Position camera to see the oloid well
cam.location = (0.22, -0.30, 0.10)
cam.rotation_euler = (math.radians(80), 0.0, math.radians(36))

# ── Light ─────────────────────────────────────────────────────────────────────
sun_data = bpy.data.lights.new("Sun", type='SUN')
sun_data.energy = 3.5
sun = bpy.data.objects.new("Sun", sun_data)
scene.collection.objects.link(sun)
sun.rotation_euler = (math.radians(55), math.radians(15), math.radians(30))

# ── Turntable empty (parent of oloid) ────────────────────────────────────────
empty = bpy.data.objects.new("Turntable", None)
scene.collection.objects.link(empty)

# Reparent the oloid object to the empty
oloid = bpy.data.objects.get("oloid_poi")
if oloid:
    oloid.parent = empty

# Keyframe the empty rotation
empty.rotation_euler = (0, 0, 0)
empty.keyframe_insert("rotation_euler", frame=1)
empty.rotation_euler = (0, 0, math.radians(TURN_DEG))
empty.keyframe_insert("rotation_euler", frame=FRAMES)

# Linear interpolation for steady rotation
for fc in empty.animation_data.action.fcurves:
    for kp in fc.keyframe_points:
        kp.interpolation = 'LINEAR'

# ── Render ────────────────────────────────────────────────────────────────────
bpy.ops.render.render(animation=True)
print("✓ viewport.mp4 →", OUT_FILE)
