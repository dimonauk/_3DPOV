"""
record.py — Viewport animation for batch bake tutorial
Outputs: public/library/videos/scripting/python-cycles-batch-bake-normal-ao-emission-webxr/viewport.mp4

Run via:  blender --background --python record.py

Creates a 90-frame animation that demonstrates:
  F 1–20   : hi-poly sphere + lo-poly icosphere in split view (camera orbits)
  F 21–50  : normal map preview applied to lo-poly (blue-purple palette)
  F 51–70  : AO map preview (greyscale cavity shading)
  F 71–90  : emission map preview (white-hot rim light bake)
"""

import bpy
import os
import math

# ── output path ──────────────────────────────────────────────────────────────
OUT_DIR = os.path.join(
    os.path.dirname(os.path.abspath(__file__)),
    "..", "..", "..", "videos",
    "scripting",
    "python-cycles-batch-bake-normal-ao-emission-webxr",
)
os.makedirs(OUT_DIR, exist_ok=True)
OUTPUT_PATH = os.path.join(OUT_DIR, "viewport.mp4")

# ── scene setup ──────────────────────────────────────────────────────────────
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.render.engine = "BLENDER_EEVEE_NEXT"
scene.render.fps = 30
scene.frame_start = 1
scene.frame_end = 90
scene.render.resolution_x = 1280
scene.render.resolution_y = 720
scene.render.image_settings.file_format = "FFMPEG"
scene.render.ffmpeg.format = "MPEG4"
scene.render.ffmpeg.codec = "H264"
scene.render.ffmpeg.constant_rate_factor = "MEDIUM"
scene.render.filepath = OUTPUT_PATH

# World — dark studio backdrop
world = bpy.data.worlds.new("BakeWorld")
scene.world = world
world.use_nodes = True
bg = world.node_tree.nodes["Background"]
bg.inputs["Color"].default_value = (0.04, 0.04, 0.06, 1.0)
bg.inputs["Strength"].default_value = 1.0

# ── hi-poly: UV sphere (dense) ───────────────────────────────────────────────
bpy.ops.mesh.primitive_uv_sphere_add(
    segments=64, ring_count=32, radius=1.0, location=(-1.4, 0, 0)
)
hi_obj = bpy.context.active_object
hi_obj.name = "hi_demo_sphere"

mat_hi = bpy.data.materials.new("mat_hi")
mat_hi.use_nodes = True
pb = mat_hi.node_tree.nodes["Principled BSDF"]
pb.inputs["Base Color"].default_value = (0.8, 0.3, 0.15, 1.0)
pb.inputs["Roughness"].default_value = 0.3
hi_obj.data.materials.append(mat_hi)

# Add some displaced surface detail via a displacement modifier so hi-poly
# is visually distinct from the smooth lo-poly
disp_tex = bpy.data.textures.new("hi_detail", type="CLOUDS")
disp_tex.noise_scale = 0.5
mod = hi_obj.modifiers.new("HiDetail", type="DISPLACE")
mod.texture = disp_tex
mod.strength = 0.08

# ── lo-poly: icosphere (coarse) ──────────────────────────────────────────────
bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2, radius=1.0, location=(1.4, 0, 0))
lo_obj = bpy.context.active_object
lo_obj.name = "lo_demo_sphere"

# Three materials representing the three bake passes
def _preview_mat(name: str, colour: tuple) -> bpy.types.Material:
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    pb = mat.node_tree.nodes["Principled BSDF"]
    pb.inputs["Base Color"].default_value = (*colour, 1.0)
    pb.inputs["Roughness"].default_value = 0.5
    return mat

mat_nm = _preview_mat("mat_lo_normal_preview", (0.4, 0.5, 1.0))   # blue-purple: normal map colour
mat_ao = _preview_mat("mat_lo_ao_preview",     (0.6, 0.6, 0.6))   # grey: AO
mat_em = _preview_mat("mat_lo_emit_preview",   (1.0, 0.9, 0.6))   # warm: emission

lo_obj.data.materials.clear()
lo_obj.data.materials.append(mat_nm)

# ── lights ───────────────────────────────────────────────────────────────────
bpy.ops.object.light_add(type="AREA", location=(3, -2, 4))
key = bpy.context.active_object
key.data.energy = 500
key.data.size = 2.0
key.data.color = (1.0, 0.95, 0.85)

bpy.ops.object.light_add(type="POINT", location=(-3, 2, 2))
fill = bpy.context.active_object
fill.data.energy = 100
fill.data.color = (0.5, 0.6, 1.0)

# ── camera ───────────────────────────────────────────────────────────────────
bpy.ops.object.camera_add(location=(0, -6, 1.5))
cam = bpy.context.active_object
cam.data.lens = 50
scene.camera = cam
cam.rotation_euler = (math.radians(80), 0, 0)

# Orbit animation — camera rotates around Z over 90 frames
for fr in range(1, 91):
    angle = math.radians(fr * 2.0)   # 180° over 90 frames
    cam.location.x = 6.0 * math.sin(angle)
    cam.location.y = -6.0 * math.cos(angle)
    cam.keyframe_insert("location", frame=fr)
    # Always point at origin
    direction = (-cam.location.x, -cam.location.y, -cam.location.z)
    cam.rotation_euler.z = math.atan2(direction[0], -direction[1])
    cam.keyframe_insert("rotation_euler", frame=fr)

# ── material swap keyframes (simulate the bake pass transitions) ──────────────
# F1-20:  normal map preview
# F21-50: AO preview
# F51-90: emission preview
# We do this by hiding/showing duplicates of lo_obj at each phase

lo_obj.data.materials[0] = mat_nm
lo_obj.keyframe_insert("material_slots[0].material", frame=1)   # type: ignore

lo_obj.data.materials[0] = mat_ao
lo_obj.keyframe_insert("material_slots[0].material", frame=21)  # type: ignore

lo_obj.data.materials[0] = mat_em
lo_obj.keyframe_insert("material_slots[0].material", frame=51)  # type: ignore

# ── label text: technique annotation ─────────────────────────────────────────
bpy.ops.object.text_add(location=(-2.5, 0, -1.6))
txt = bpy.context.active_object
txt.data.body = "Batch Bake: Normal | AO | Emit"
txt.data.size = 0.18
txt.rotation_euler = (math.radians(90), 0, 0)
mat_txt = bpy.data.materials.new("mat_txt")
mat_txt.use_nodes = True
emit_node = mat_txt.node_tree.nodes.new("ShaderNodeEmission")
emit_node.inputs["Color"].default_value = (0.9, 0.9, 1.0, 1.0)
emit_node.inputs["Strength"].default_value = 2.0
mat_out = mat_txt.node_tree.nodes["Material Output"]
mat_txt.node_tree.links.new(emit_node.outputs["Emission"], mat_out.inputs["Surface"])
mat_txt.node_tree.nodes.remove(mat_txt.node_tree.nodes["Principled BSDF"])
txt.data.materials.append(mat_txt)

# ── render ────────────────────────────────────────────────────────────────────
bpy.ops.render.render(animation=True, write_still=False)
print(f"[record.py] written → {OUTPUT_PATH}")
