"""
record.py — viewport animation for GN Scale Instances Spine Growth tutorial
Blender 5.1 · CC0 2026 · Holoflow Studio

Renders a 3-second (80 frame @ 30 fps) EEVEE animation showing the spine-growth
reveal: Grow_Factor 0 → 1 while the camera orbits 60 degrees. All 642 spines
grow simultaneously, creating a porcupine-bristle burst.

Run AFTER blueprint.py has built the scene and saved spine_growth.blend.

Output: public/library/videos/geometry-nodes/gn-scale-instances-spine-growth/viewport.mp4
"""

import bpy
import math

# ── Resolve scene objects ─────────────────────────────────────────────────────
obj = bpy.data.objects.get("spine_growth")
if obj is None:
    raise RuntimeError("Run blueprint.py first — 'spine_growth' object not found.")
mod = obj.modifiers.get("SpineGrowth_GN")
if mod is None:
    raise RuntimeError("SpineGrowth_GN modifier not found on spine_growth object.")

# ── Timeline ──────────────────────────────────────────────────────────────────
scene = bpy.context.scene
scene.frame_start = 1
scene.frame_end   = 80
scene.render.fps  = 30

def key_socket(frame, key, value):
    mod[key] = value
    mod.keyframe_insert(data_path=f'["{key}"]', frame=frame)

# Grow_Factor: 0.0 (flat) → 1.0 (fully extended).
# "Input_2" is the socket identifier assigned to Grow Factor (third interface
# item after the two Geometry sockets, both of which get _1 suffixes).
key_socket(1,  "Input_2", 0.0)
key_socket(55, "Input_2", 1.0)  # ease-in burst, then hold
key_socket(80, "Input_2", 1.0)

for fc in obj.animation_data.action.fcurves:
    for kp in fc.keyframe_points:
        kp.interpolation = "BEZIER"
        kp.easing        = "EASE_IN"   # natural bristle-growth acceleration

# ── Camera: slow 60-degree orbit ─────────────────────────────────────────────
bpy.ops.object.camera_add(location=(0, -3.5, 1.2))
cam = bpy.context.active_object
cam.name           = "record_cam"
cam.rotation_euler = (math.radians(72), 0.0, 0.0)
cam.data.type      = "PERSP"
cam.data.lens      = 50.0
scene.camera       = cam

cam.keyframe_insert("rotation_euler", frame=1)
cam.rotation_euler = (math.radians(72), 0.0, math.radians(60))
cam.keyframe_insert("rotation_euler", frame=80)
for fc in cam.animation_data.action.fcurves:
    for kp in fc.keyframe_points:
        kp.interpolation = "LINEAR"

# ── Lighting ──────────────────────────────────────────────────────────────────
bpy.ops.object.light_add(type="SUN", location=(3, -3, 5))
sun = bpy.context.active_object
sun.data.energy    = 3.0
sun.rotation_euler = (0.55, 0.0, 0.8)

bpy.ops.object.light_add(type="AREA", location=(-3, 2, 3))
fill = bpy.context.active_object
fill.data.energy = 60
fill.data.size   = 5.0

# ── World ─────────────────────────────────────────────────────────────────────
scene.world.use_nodes = True
bg = scene.world.node_tree.nodes.get("Background")
if bg:
    bg.inputs["Color"].default_value    = (0.04, 0.04, 0.06, 1.0)
    bg.inputs["Strength"].default_value = 0.6

# ── EEVEE Next render settings ────────────────────────────────────────────────
scene.render.engine                      = "BLENDER_EEVEE_NEXT"
scene.eevee.taa_render_samples           = 16
scene.render.resolution_x               = 1920
scene.render.resolution_y               = 1080
scene.render.resolution_percentage      = 100
scene.render.image_settings.file_format = "FFMPEG"
scene.render.ffmpeg.format              = "MPEG4"
scene.render.ffmpeg.codec               = "H264"
scene.render.ffmpeg.constant_rate_factor = "HIGH"
scene.render.filepath = (
    "//../../videos/geometry-nodes/gn-scale-instances-spine-growth/viewport"
)

# ── Render ────────────────────────────────────────────────────────────────────
bpy.ops.render.render(animation=True)
print("viewport.mp4 rendered — public/library/videos/geometry-nodes/"
      "gn-scale-instances-spine-growth/viewport.mp4")
