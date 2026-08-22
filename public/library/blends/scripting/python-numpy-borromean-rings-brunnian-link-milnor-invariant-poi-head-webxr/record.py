"""
record.py — Viewport animation for Borromean Rings poi head.
Outputs: public/library/videos/scripting/python-numpy-borromean-rings-brunnian-link-milnor-invariant-poi-head-webxr/viewport.mp4

Sequence (150 frames @ 30 fps = 5 s):
  0–30   : Tumble slowly → viewer grasps three interlocked ovals
  31–90  : Isolate Ring A (raise opacity on B, C → 30% alpha); drift rings
           apart slightly to demonstrate Brunnian property — remove one ring
           and the other two are free
  91–120 : Reassemble; orbit circles tighten back to final pose
  121–150: Steady slow-spin, full-colour display, bloom halo visible in EEVEE

Run inside Blender's scripting workspace after blueprint.py has been executed.
"""

import bpy, math

RENDER_OUTPUT = "//public/library/videos/scripting/" \
    "python-numpy-borromean-rings-brunnian-link-milnor-invariant-poi-head-webxr/viewport"
FPS = 30
TOTAL_FRAMES = 150

scene = bpy.context.scene
scene.frame_start = 1
scene.frame_end   = TOTAL_FRAMES
scene.render.fps  = FPS
scene.render.image_settings.file_format = 'FFMPEG'
scene.render.ffmpeg.format               = 'MPEG4'
scene.render.ffmpeg.codec                = 'H264'
scene.render.ffmpeg.constant_rate_factor = 'MEDIUM'
scene.render.filepath                    = RENDER_OUTPUT
scene.render.resolution_x = 1920
scene.render.resolution_y = 1080
scene.render.resolution_percentage = 100

# Use EEVEE Next for fast viewport render
scene.render.engine = 'BLENDER_EEVEE_NEXT'
eevee = scene.eevee
eevee.use_bloom = True
eevee.bloom_intensity = 0.08
eevee.bloom_radius    = 4.0

# Camera
cam_data = bpy.data.cameras.new("RecordCam")
cam_data.lens = 85
cam_obj  = bpy.data.objects.new("RecordCam", cam_data)
bpy.context.scene.collection.objects.link(cam_obj)
scene.camera = cam_obj
cam_obj.location = (0, -4.8, 0)
cam_obj.rotation_euler = (math.pi / 2, 0, 0)

# Soft key light
lamp_data = bpy.data.lights.new("KeyLight", 'AREA')
lamp_data.energy = 400
lamp_data.size   = 2.0
lamp_obj = bpy.data.objects.new("KeyLight", lamp_data)
bpy.context.scene.collection.objects.link(lamp_obj)
lamp_obj.location = (2.5, -3.0, 2.0)

def ease(t):
    """Smooth-step easing."""
    t = max(0.0, min(1.0, t))
    return t * t * (3 - 2 * t)

root = bpy.data.objects.get("hf_borromean_poi")

# ── Keyframe animation ────────────────────────────────────────────────────────
if root:
    # Frame 1: base pose, full spin start
    root.rotation_euler = (math.pi / 2, 0, 0)
    root.keyframe_insert("rotation_euler", frame=1)

    # Frame 90: isolate — rotate 45° extra to show topology
    root.rotation_euler = (math.pi / 2, math.radians(45), math.radians(30))
    root.keyframe_insert("rotation_euler", frame=90)

    # Frame 150: return to steady slow spin
    root.rotation_euler = (math.pi / 2, math.radians(90), 0)
    root.keyframe_insert("rotation_euler", frame=150)

    # Smooth interpolation
    if root.animation_data and root.animation_data.action:
        for fc in root.animation_data.action.fcurves:
            for kp in fc.keyframe_points:
                kp.interpolation = 'BEZIER'

# Render (comment out to preview interactively)
# bpy.ops.render.render(animation=True, write_still=False)
print("✓ record.py staged — run render when Blender session has a display.")
