"""
record.py — viewport animation for Index-of-Nearest Neural Web tutorial
Blender 5.1  ·  CC0 2026  ·  Holoflow Studio

Renders a 5-second (150 frame @ 30 fps) EEVEE viewport animation showing
the synaptic activation wave sweeping pole-to-antipole across the neural
web — wave_radius 0 → 2.5 → 0 while the camera slowly orbits.

Run AFTER blueprint.py has built the scene.

Output: public/library/videos/geometry-nodes/gn-index-of-nearest-neural-web/viewport.mp4
"""

import bpy, math

# ── Resolve scene objects ─────────────────────────────────────────────────────
obj = bpy.data.objects.get("neural_web")
if obj is None:
    raise RuntimeError("Run blueprint.py first — 'neural_web' object not found.")
mod = obj.modifiers.get("NeuralWeb_GN")
if mod is None:
    raise RuntimeError("NeuralWeb_GN modifier not found.")

# ── Timeline ──────────────────────────────────────────────────────────────────
scene = bpy.context.scene
scene.frame_start = 1
scene.frame_end   = 150
scene.render.fps  = 30

def key_socket(frame, key, value):
    mod[key] = value
    mod.keyframe_insert(data_path=f'["{key}"]', frame=frame)

# Wave radius: 0 → 2.5 (all active) → hold → 0 (reset for loop)
key_socket(1,   "Input_2", 0.0)
key_socket(80,  "Input_2", 2.5)
key_socket(120, "Input_2", 2.5)
key_socket(150, "Input_2", 0.0)

for fc in obj.animation_data.action.fcurves:
    for kp in fc.keyframe_points:
        kp.interpolation = 'BEZIER'
        kp.easing        = 'AUTO'

# ── Camera: slow 90-degree orbit ─────────────────────────────────────────────
bpy.ops.object.camera_add(location=(0, -3.2, 1.5))
cam = bpy.context.active_object
cam.name = "record_cam"
cam.rotation_euler = (1.1, 0.0, 0.0)
cam.data.type  = 'PERSP'
cam.data.lens  = 55.0
scene.camera   = cam

# Keyframe a slow 90-degree Z rotation (orbit around the sphere)
cam.rotation_euler = (1.1, 0.0, 0.0)
cam.keyframe_insert("rotation_euler", frame=1)
cam.rotation_euler = (1.1, 0.0, math.radians(90))
cam.keyframe_insert("rotation_euler", frame=150)
for fc in cam.animation_data.action.fcurves:
    for kp in fc.keyframe_points:
        kp.interpolation = 'LINEAR'

# ── Lighting ──────────────────────────────────────────────────────────────────
bpy.ops.object.light_add(type='SUN', location=(3, -3, 5))
sun = bpy.context.active_object
sun.data.energy = 2.5
sun.rotation_euler = (0.55, 0.0, 0.8)

bpy.ops.object.light_add(type='AREA', location=(-3, 2, 3))
fill = bpy.context.active_object
fill.data.energy = 50
fill.data.size   = 5.0

# ── World: deep space background ─────────────────────────────────────────────
scene.world.use_nodes = True
bg = scene.world.node_tree.nodes.get("Background")
if bg:
    bg.inputs["Color"].default_value    = (0.005, 0.005, 0.012, 1.0)
    bg.inputs["Strength"].default_value = 1.0

# ── EEVEE Next render settings ────────────────────────────────────────────────
scene.render.engine                      = 'BLENDER_EEVEE_NEXT'
scene.eevee.taa_render_samples           = 16
scene.eevee.use_bloom                    = True
scene.eevee.bloom_intensity              = 0.08
scene.render.resolution_x               = 1920
scene.render.resolution_y               = 1080
scene.render.resolution_percentage      = 100
scene.render.image_settings.file_format = 'FFMPEG'
scene.render.ffmpeg.format              = 'MPEG4'
scene.render.ffmpeg.codec               = 'H264'
scene.render.ffmpeg.constant_rate_factor = 'HIGH'
scene.render.filepath = (
    "//../../videos/geometry-nodes/gn-index-of-nearest-neural-web/viewport"
)

# ── Render ────────────────────────────────────────────────────────────────────
bpy.ops.render.render(animation=True)
print("viewport.mp4 rendered.")
