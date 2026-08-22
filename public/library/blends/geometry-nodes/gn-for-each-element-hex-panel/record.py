"""
record.py — viewport animation for hex-panel For Each tutorial
Blender 5.1 · CC0 · Holoflow Studio

Renders a 5-second (150-frame @ 30fps) OpenGL viewport animation showing
the hex panel cells rising from flat to full extrusion, then settling.
Run AFTER blueprint.py has built the scene.

Output: public/library/videos/geometry-nodes/gn-for-each-element-hex-panel/viewport.mp4
"""

import bpy

# ── Resolve target object ─────────────────────────────────────────────────────
obj = bpy.data.objects.get("hex_panel")
if obj is None:
    raise RuntimeError("Run blueprint.py first — 'hex_panel' object not found.")

mod = obj.modifiers.get("HexPanel_GN")
if mod is None:
    raise RuntimeError("HexPanel_GN modifier not found — blueprint.py incomplete.")

# ── Keyframe Extrude Max: 0 → EXTRUDE_MAX → 0 ────────────────────────────────
# Frame  1: all cells flat (Extrude Max = 0.0)
# Frame 75: cells at full height (Extrude Max = 0.28)
# Frame150: cells return to flat for clean loop

scene = bpy.context.scene
scene.frame_start = 1
scene.frame_end   = 150
scene.render.fps  = 30

def key_socket(frame, socket_key, value):
    mod[socket_key] = value
    mod.keyframe_insert(data_path=f'["{socket_key}"]', frame=frame)

key_socket(1,   "Input_1", 0.00)
key_socket(75,  "Input_1", 0.28)
key_socket(150, "Input_1", 0.00)

# Use BEZIER easing on all keyframes for organic rise/fall
for fcurve in obj.animation_data.action.fcurves:
    for kp in fcurve.keyframe_points:
        kp.interpolation = 'BEZIER'
        kp.easing        = 'AUTO'

# ── Camera: isometric-ish top-front view ─────────────────────────────────────
bpy.ops.object.camera_add(location=(0, -5.5, 4.5))
cam = bpy.context.active_object
cam.name = "record_cam"
cam.rotation_euler = (0.88, 0, 0)   # ~50° tilt
cam.data.type = 'PERSP'
cam.data.lens = 50.0
scene.camera = cam

# ── Lighting: single sun + fill ───────────────────────────────────────────────
bpy.ops.object.light_add(type='SUN', location=(2, -2, 5))
sun = bpy.context.active_object
sun.data.energy = 3.5
sun.rotation_euler = (0.6, 0, 0.8)

bpy.ops.object.light_add(type='AREA', location=(-3, 2, 3))
fill = bpy.context.active_object
fill.data.energy = 60
fill.data.size   = 4.0

# ── EEVEE Next render settings ────────────────────────────────────────────────
scene.render.engine                  = 'BLENDER_EEVEE_NEXT'
scene.eevee.taa_render_samples       = 16
scene.render.resolution_x            = 1920
scene.render.resolution_y            = 1080
scene.render.resolution_percentage   = 100
scene.render.image_settings.file_format = 'FFMPEG'
scene.render.ffmpeg.format           = 'MPEG4'
scene.render.ffmpeg.codec            = 'H264'
scene.render.ffmpeg.constant_rate_factor = 'HIGH'
scene.render.filepath = "//../../videos/geometry-nodes/gn-for-each-element-hex-panel/viewport"

# ── World background: dark studio grey ───────────────────────────────────────
scene.world.use_nodes = True
scene.world.node_tree.nodes["Background"].inputs[0].default_value = (0.05, 0.05, 0.06, 1)

# ── Render ────────────────────────────────────────────────────────────────────
bpy.ops.render.render(animation=True, write_still=False)
print("viewport.mp4 written.")
