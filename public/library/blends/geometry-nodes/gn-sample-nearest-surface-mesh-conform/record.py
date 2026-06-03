"""
record.py — viewport animation for SNS Mesh-Conform Tile Armour tutorial
Blender 5.1 · CC0 · Holoflow Studio

Renders a 5-second (150-frame @ 30fps) EEVEE animation showing the tile
armour's Tile Scale expanding from 0.30 → 0.84, revealing the inter-tile
gap structure as the armour tightens.  The camera orbits 60° for depth.

Run AFTER blueprint.py has built and saved tile_armour.blend.
Output: public/library/videos/geometry-nodes/gn-sample-nearest-surface-mesh-conform/viewport.mp4
"""

import bpy
import math

# ── Resolve objects ───────────────────────────────────────────────────────────
armour = bpy.data.objects.get("TileArmour")
if armour is None:
    raise RuntimeError("Run blueprint.py first — 'TileArmour' object not found.")

mod = armour.modifiers.get("ArmourConform")
if mod is None:
    raise RuntimeError("ArmourConform modifier not found — blueprint.py incomplete.")

# ── Timeline ──────────────────────────────────────────────────────────────────
scene = bpy.context.scene
scene.frame_start = 1
scene.frame_end   = 150
scene.render.fps  = 30

# ── Keyframe Tile Scale: open gap → close gap → hold ────────────────────────
# Frame   1: very small tiles (large gap) — grid structure visible
# Frame  90: tiles at full design scale — armour reads as solid surface
# Frame 150: hold at full scale for clean freeze-frame end

def key_input(frame, key, value):
    mod[key] = value
    mod.keyframe_insert(data_path=f'["{key}"]', frame=frame)

key_input(1,   "Input_3", 0.28)
key_input(90,  "Input_3", 0.84)
key_input(150, "Input_3", 0.84)

for fcurve in armour.animation_data.action.fcurves:
    for kp in fcurve.keyframe_points:
        kp.interpolation = 'BEZIER'
        kp.easing        = 'EASE_IN_OUT'

# ── Orbiting camera ───────────────────────────────────────────────────────────
# Add an empty at origin as the orbit pivot, parent the camera to it.
bpy.ops.object.empty_add(type='PLAIN_AXES', location=(0, 0, 0))
pivot = bpy.context.active_object
pivot.name = "CamPivot"

bpy.ops.object.camera_add(location=(0, -7.0, 2.8))
cam = bpy.context.active_object
cam.name = "record_cam"
cam.rotation_euler = (1.15, 0, 0)
cam.data.lens      = 50.0
scene.camera       = cam

cam.parent = pivot

# 60° orbit over 150 frames: smooth arc, no jarring ends
pivot.rotation_euler = (0, 0, 0)
pivot.keyframe_insert(data_path="rotation_euler", frame=1)
pivot.rotation_euler = (0, 0, math.radians(60))
pivot.keyframe_insert(data_path="rotation_euler", frame=150)

for fcurve in pivot.animation_data.action.fcurves:
    for kp in fcurve.keyframe_points:
        kp.interpolation = 'BEZIER'
        kp.easing        = 'EASE_IN_OUT'

# ── Lighting ──────────────────────────────────────────────────────────────────
bpy.ops.object.light_add(type='SUN', location=(4, -3, 7))
sun = bpy.context.active_object
sun.name = "KeyLight"
sun.data.energy = 4.5
sun.rotation_euler = (0.6, 0, 0.8)

bpy.ops.object.light_add(type='AREA', location=(-3, 4, 2))
fill = bpy.context.active_object
fill.name = "FillLight"
fill.data.energy = 90
fill.data.size   = 6.0

# ── EEVEE Next render settings ────────────────────────────────────────────────
scene.render.engine                     = 'BLENDER_EEVEE_NEXT'
scene.eevee.taa_render_samples          = 16
scene.render.resolution_x               = 1920
scene.render.resolution_y               = 1080
scene.render.resolution_percentage      = 100
scene.render.image_settings.file_format = 'FFMPEG'
scene.render.ffmpeg.format              = 'MPEG4'
scene.render.ffmpeg.codec               = 'H264'
scene.render.ffmpeg.constant_rate_factor = 'HIGH'
scene.render.filepath = (
    "//../../videos/geometry-nodes/"
    "gn-sample-nearest-surface-mesh-conform/viewport"
)

# ── World background ──────────────────────────────────────────────────────────
scene.world.use_nodes = True
bg = scene.world.node_tree.nodes["Background"]
bg.inputs[0].default_value = (0.04, 0.04, 0.05, 1)

# ── Render ────────────────────────────────────────────────────────────────────
bpy.ops.render.render(animation=True, write_still=False)
print("viewport.mp4 written to videos/geometry-nodes/gn-sample-nearest-surface-mesh-conform/")
