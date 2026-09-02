"""
record.py — Newton–Leipnik Viewport Animation Render
=====================================================
Runs a 10-second (300-frame @ 30fps) render that animates the NL_Speed
colour attribute fading in along both tubes simultaneously, making the
two coexisting strange attractors visually distinct.

Run inside Blender 5.1 after executing blueprint.py:
  bpy.exec_expression(open("record.py").read())
OR via command line:
  blender --background --python blueprint.py --python record.py

Output: public/library/videos/scripting/
        python-numpy-newton-leipnik-attractor-1981-double-strange-
        bistability-rigid-body-feedback-rk4-bishop-tube-poi-webxr/
        viewport.mp4
"""

import bpy
import os

# ── OUTPUT PATH ───────────────────────────────────────────────────────────────
_SLUG = (
    "python-numpy-newton-leipnik-attractor-1981-double-strange-bistability"
    "-rigid-body-feedback-rk4-bishop-tube-poi-webxr"
)
OUTPUT_DIR  = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(
        os.path.abspath(__file__))))),
    "videos", "scripting", _SLUG,
)
OUTPUT_FILE = os.path.join(OUTPUT_DIR, "viewport.mp4")
os.makedirs(OUTPUT_DIR, exist_ok=True)

# ── RENDER SETTINGS ───────────────────────────────────────────────────────────
FRAMES      = 300     # 10 s @ 30 fps
FPS         = 30
RES_X, RES_Y = 1920, 1080

scene = bpy.context.scene
scene.frame_start = 1
scene.frame_end   = FRAMES
scene.render.fps  = FPS
scene.render.resolution_x = RES_X
scene.render.resolution_y = RES_Y
scene.render.image_settings.file_format = 'FFMPEG'
scene.render.ffmpeg.format              = 'MPEG4'
scene.render.ffmpeg.codec               = 'H264'
scene.render.ffmpeg.constant_rate_factor = 'MEDIUM'
scene.render.filepath = OUTPUT_FILE

# ── CAMERA ────────────────────────────────────────────────────────────────────
# Position camera to show both tubes side-by-side
cam_data = bpy.data.cameras.new("RecordCam")
cam_data.lens = 50
cam_obj  = bpy.data.objects.new("RecordCam", cam_data)
bpy.context.collection.objects.link(cam_obj)
cam_obj.location    = (0.0, -4.5, 1.0)
cam_obj.rotation_euler = (1.22, 0.0, 0.0)   # ~70° tilt down
scene.camera        = cam_obj

# ── WORLD BACKGROUND ─────────────────────────────────────────────────────────
world = bpy.data.worlds.new("RecordWorld")
world.use_nodes = True
bg = world.node_tree.nodes.get("Background")
if bg:
    bg.inputs["Color"].default_value  = (0.02, 0.02, 0.04, 1.0)
    bg.inputs["Strength"].default_value = 1.0
scene.world = world

# ── OBJECT MATERIAL — Attribute-driven gradient ───────────────────────────────
obj = bpy.data.objects.get("hf_newton_leipnik_poi")
if obj is None:
    raise RuntimeError("Run blueprint.py first to create hf_newton_leipnik_poi")

mat = bpy.data.materials.new("NL_GradientMat")
mat.use_nodes = True
nt  = mat.node_tree
nt.nodes.clear()

# Attribute node reads NL_Speed per vertex (0–1 upper, 1–2 lower)
attr_nd  = nt.nodes.new("ShaderNodeAttribute")
attr_nd.attribute_name = "NL_Speed"

# Map 0–1 range to Cobalt–Amber (upper attractor)
map_u    = nt.nodes.new("ShaderNodeMapRange")
map_u.inputs["From Min"].default_value = 0.0
map_u.inputs["From Max"].default_value = 1.0
map_u.inputs["To Min"].default_value   = 0.0
map_u.inputs["To Max"].default_value   = 1.0

# Colour ramp: upper = cobalt→amber
cr_upper = nt.nodes.new("ShaderNodeValToRGB")
cr_upper.color_ramp.elements[0].color  = (0.10, 0.28, 0.80, 1.0)  # cobalt
cr_upper.color_ramp.elements[1].color  = (0.95, 0.60, 0.10, 1.0)  # amber

# Map 1–2 range to white→crimson (lower attractor)
map_l    = nt.nodes.new("ShaderNodeMapRange")
map_l.inputs["From Min"].default_value = 1.0
map_l.inputs["From Max"].default_value = 2.0
map_l.inputs["To Min"].default_value   = 0.0
map_l.inputs["To Max"].default_value   = 1.0

cr_lower = nt.nodes.new("ShaderNodeValToRGB")
cr_lower.color_ramp.elements[0].color  = (0.9, 0.9, 0.9, 1.0)   # white
cr_lower.color_ramp.elements[1].color  = (0.80, 0.05, 0.10, 1.0) # crimson

# Mix: upper attr < 1 → upper colour; attr ≥ 1 → lower colour
mix_nd   = nt.nodes.new("ShaderNodeMixRGB")
mix_nd.blend_type = 'MIX'
# Use a step at 1.0 to select attractor branch
step_nd  = nt.nodes.new("ShaderNodeMath")
step_nd.operation = 'GREATER_THAN'
step_nd.inputs[1].default_value = 1.0

emission = nt.nodes.new("ShaderNodeEmission")
emission.inputs["Strength"].default_value = 2.5

output   = nt.nodes.new("ShaderNodeOutputMaterial")

# Wire up
nt.links.new(attr_nd.outputs["Fac"],      map_u.inputs["Value"])
nt.links.new(map_u.outputs["Result"],     cr_upper.inputs["Fac"])
nt.links.new(attr_nd.outputs["Fac"],      map_l.inputs["Value"])
nt.links.new(map_l.outputs["Result"],     cr_lower.inputs["Fac"])
nt.links.new(attr_nd.outputs["Fac"],      step_nd.inputs[0])
nt.links.new(step_nd.outputs["Value"],    mix_nd.inputs["Fac"])
nt.links.new(cr_upper.outputs["Color"],   mix_nd.inputs["Color1"])
nt.links.new(cr_lower.outputs["Color"],   mix_nd.inputs["Color2"])
nt.links.new(mix_nd.outputs["Color"],     emission.inputs["Color"])
nt.links.new(emission.outputs["Emission"], output.inputs["Surface"])

if not obj.data.materials:
    obj.data.materials.append(mat)
else:
    obj.data.materials[0] = mat

# ── SHAPE KEY ANIMATION — sweep SK_LowA → Basis → SK_HighA ──────────────────
if obj.data.shape_keys:
    keys = obj.data.shape_keys.key_blocks
    for k in keys:
        k.value = 0.0

    # frame 1-60: Basis (canonical)
    keys["Basis"].value = 1.0
    keys["Basis"].keyframe_insert("value", frame=1)
    keys["Basis"].keyframe_insert("value", frame=60)

    # frame 60-120: morph to SK_LowA (a=0.3, larger orbits)
    keys["Basis"].value = 0.0
    keys["Basis"].keyframe_insert("value", frame=120)
    keys["SK_LowA"].value = 1.0
    keys["SK_LowA"].keyframe_insert("value", frame=120)
    keys["SK_LowA"].keyframe_insert("value", frame=60)

    # frame 120-180: back to Basis
    keys["SK_LowA"].value = 0.0
    keys["SK_LowA"].keyframe_insert("value", frame=180)
    keys["Basis"].value = 1.0
    keys["Basis"].keyframe_insert("value", frame=180)

    # frame 180-240: morph to SK_HighA (a=0.55, tighter)
    keys["Basis"].value = 0.0
    keys["Basis"].keyframe_insert("value", frame=240)
    keys["SK_HighA"].value = 1.0
    keys["SK_HighA"].keyframe_insert("value", frame=240)
    keys["SK_HighA"].keyframe_insert("value", frame=180)

    # frame 240-300: return to Basis
    keys["SK_HighA"].value = 0.0
    keys["SK_HighA"].keyframe_insert("value", frame=300)
    keys["Basis"].value = 1.0
    keys["Basis"].keyframe_insert("value", frame=300)

# ── RENDER ────────────────────────────────────────────────────────────────────
print(f"[NL record] Rendering {FRAMES} frames → {OUTPUT_FILE}")
bpy.ops.render.render(animation=True)
print("[NL record] Done.")
