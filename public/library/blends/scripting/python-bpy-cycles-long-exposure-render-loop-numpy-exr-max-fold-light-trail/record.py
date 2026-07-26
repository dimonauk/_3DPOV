"""
record.py — viewport animation for screen recording
Blender 5.1 · Holoflow Studio · CC0

Produces: public/library/videos/scripting/
          python-bpy-cycles-long-exposure-render-loop-numpy-exr-max-fold-light-trail/
          viewport.mp4

Scene must already be set up (run blueprint.py first).

Animation plan (120 frames at 24fps = 5 s):
  Frames   1– 60 : camera orbits 360° around the double helix
  Frames  61–100 : camera pulls back slightly, helix pulses emission (keyframed strength)
  Frames 101–120 : hold on two-thirds view to show the composite result concept
"""

import bpy
import math
from mathutils import Vector

FPS      = 24
DURATION = 120
CAM_R0   = 5.8   # starting orbit radius
CAM_R1   = 7.2   # pull-back radius
CAM_H    = 1.0

scene = bpy.context.scene
scene.frame_start = 1
scene.frame_end   = DURATION
scene.render.fps  = FPS

cam = scene.camera
if cam is None:
    raise RuntimeError("Run blueprint.py first to build the scene.")

# Remove any existing animation on the camera
if cam.animation_data:
    cam.animation_data_clear()

# ── Phase 1: 360° orbit (frames 1–60) ────────────────────────────────────────
for f in range(1, 61):
    angle = (f - 1) / 60 * 2 * math.pi
    cam.location = Vector((
        CAM_R0 * math.cos(angle),
        CAM_R0 * math.sin(angle),
        CAM_H,
    ))
    scene.frame_set(f)
    cam.keyframe_insert('location')

# ── Phase 2: pull-back + emission pulse (frames 61–100) ──────────────────────
angle_60 = (60 - 1) / 60 * 2 * math.pi   # final angle from phase 1
for f in range(61, 101):
    t = (f - 60) / 40   # 0 → 1
    r = CAM_R0 + (CAM_R1 - CAM_R0) * t
    angle = angle_60   # camera stops orbiting, just pulls back
    cam.location = Vector((
        r * math.cos(angle),
        r * math.sin(angle),
        CAM_H + t * 0.5,   # slight upward drift
    ))
    scene.frame_set(f)
    cam.keyframe_insert('location')

# Pulse emission strength on both strands in phase 2
for strand_name in ('hf_strand_a', 'hf_strand_b'):
    obj = bpy.data.objects.get(strand_name)
    if obj is None:
        continue
    mat = obj.data.materials[0]
    bsdf = mat.node_tree.nodes.get('Principled BSDF')
    if bsdf is None:
        continue
    emit_input = bsdf.inputs['Emission Strength']
    for f in range(61, 101):
        t = (f - 60) / 40
        # Sinusoidal pulse: base 20 → peak 40 → back to 20
        strength = 20.0 + 20.0 * abs(math.sin(t * math.pi))
        emit_input.default_value = strength
        scene.frame_set(f)
        emit_input.keyframe_insert('default_value')

# ── Phase 3: hold on final position (frames 101–120) ─────────────────────────
for f in range(101, 121):
    cam.location = Vector((
        CAM_R1 * math.cos(angle_60),
        CAM_R1 * math.sin(angle_60),
        CAM_H + 0.5,
    ))
    scene.frame_set(f)
    cam.keyframe_insert('location')

# ── Smooth FCurve interpolation ───────────────────────────────────────────────
if cam.animation_data and cam.animation_data.action:
    for fc in cam.animation_data.action.fcurves:
        for kp in fc.keyframe_points:
            kp.interpolation = 'BEZIER'
            kp.handle_left_type = 'AUTO_CLAMPED'
            kp.handle_right_type = 'AUTO_CLAMPED'

# ── Viewport render settings ──────────────────────────────────────────────────
scene.render.resolution_x = 1920
scene.render.resolution_y = 1080
scene.render.resolution_percentage = 100
scene.render.fps = FPS
scene.render.image_settings.file_format = 'FFMPEG'
scene.render.ffmpeg.format = 'MPEG4'
scene.render.ffmpeg.codec = 'H264'
scene.render.ffmpeg.constant_rate_factor = 'MEDIUM'
scene.render.filepath = (
    "//../../../../videos/scripting/"
    "python-bpy-cycles-long-exposure-render-loop-numpy-exr-max-fold-light-trail/"
    "viewport.mp4"
)

# Use EEVEE for fast viewport recording (full Cycles at 4 samp/frame is slow for a demo)
scene.render.engine = 'BLENDER_EEVEE_NEXT'
scene.eevee.taa_render_samples = 16
# Bloom: makes emission glow without full Cycles path tracing
scene.eevee.use_bloom = True
scene.eevee.bloom_threshold = 0.5
scene.eevee.bloom_intensity = 0.8
scene.eevee.bloom_radius = 4.0

scene.frame_set(1)
print(f"record.py: ready to render {DURATION} frames → {scene.render.filepath}")
print("Press Ctrl+F12 to render animation, or use Render → Render Animation.")
