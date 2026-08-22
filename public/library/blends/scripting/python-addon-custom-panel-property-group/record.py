"""record.py — Viewport animation: Quick Facet operator before/after.

Produces:
  public/library/videos/scripting/python-addon-custom-panel-property-group/viewport.mp4

Scene:
  Two icospheres side by side:
    Left  (raw)      — default smooth shading, no bevel.
    Right (faceted)  — flat shading + HF_Bevel at 0.02 m, 1 segment.
  A single area light overhead.  Camera orbits once in 90 frames.

Running:
  blender --background --python record.py
"""

import math
import bpy
import sys
import os

# ── Output path ──────────────────────────────────────────────────────────────
SLUG      = "python-addon-custom-panel-property-group"
OUT_DIR   = os.path.join(
    os.path.dirname(os.path.abspath(__file__)),
    "..", "..", "..", "videos", "scripting", SLUG,
)
OUT_PATH  = os.path.join(OUT_DIR, "viewport.mp4")
os.makedirs(OUT_DIR, exist_ok=True)

# ── Scene reset ──────────────────────────────────────────────────────────────
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.render.engine               = "BLENDER_EEVEE_NEXT"
scene.render.resolution_x         = 1920
scene.render.resolution_y         = 1080
scene.render.fps                  = 30
scene.frame_start                 = 1
scene.frame_end                   = 90
scene.render.filepath             = OUT_PATH
scene.render.image_settings.file_format = "FFMPEG"
scene.render.ffmpeg.format        = "MPEG4"
scene.render.ffmpeg.codec         = "H264"
scene.render.ffmpeg.constant_rate_factor = "HIGH"

# ── World ────────────────────────────────────────────────────────────────────
world = bpy.data.worlds.new("World")
scene.world = world
world.use_nodes = True
bg = world.node_tree.nodes["Background"]
bg.inputs["Color"].default_value  = (0.04, 0.04, 0.06, 1.0)
bg.inputs["Strength"].default_value = 0.3

# ── Materials ────────────────────────────────────────────────────────────────
def make_mat(name, base_color, roughness=0.4):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = (*base_color, 1.0)
    bsdf.inputs["Roughness"].default_value  = roughness
    return mat

mat_raw     = make_mat("Raw",     (0.6, 0.35, 0.15), roughness=0.6)
mat_faceted = make_mat("Faceted", (0.18, 0.55, 0.75), roughness=0.25)

# ── Meshes ───────────────────────────────────────────────────────────────────
def add_ico(name, location, subdivisions=3):
    bpy.ops.mesh.primitive_ico_sphere_add(
        subdivisions=subdivisions,
        radius=0.9,
        location=location,
    )
    ob = bpy.context.active_object
    ob.name = name
    return ob

ob_raw     = add_ico("Raw_Ico",     location=(-1.5, 0, 0))
ob_faceted = add_ico("Faceted_Ico", location=( 1.5, 0, 0))

ob_raw.data.materials.append(mat_raw)
ob_faceted.data.materials.append(mat_faceted)

# Apply flat shading + bevel to the right sphere (mimics operator result)
bpy.context.view_layer.objects.active = ob_faceted
bpy.ops.object.shade_flat()

bevel = ob_faceted.modifiers.new("HF_Bevel", "BEVEL")
bevel.width            = 0.02
bevel.segments         = 1
bevel.limit_method     = "ANGLE"
bevel.angle_limit      = 0.523599
bevel.miter_outer      = "MITER_ARC"
bevel.use_clamp_overlap = True

# ── Labels (text objects) ────────────────────────────────────────────────────
def add_label(text, location):
    bpy.ops.object.text_add(location=location)
    ob = bpy.context.active_object
    ob.data.body = text
    ob.data.size = 0.18
    ob.data.align_x = "CENTER"
    ob.rotation_euler.x = math.radians(90)
    mat = bpy.data.materials.new(text + "_mat")
    mat.use_nodes = True
    emit = mat.node_tree.nodes.new("ShaderNodeEmission")
    emit.inputs["Color"].default_value = (0.9, 0.9, 0.9, 1.0)
    emit.inputs["Strength"].default_value = 1.5
    mat.node_tree.nodes["Material Output"].inputs["Surface"].default_value = None
    mat.node_tree.links.new(
        emit.outputs["Emission"],
        mat.node_tree.nodes["Material Output"].inputs["Surface"],
    )
    ob.data.materials.append(mat)
    return ob

add_label("Raw", location=(-1.5, -1.3, -0.9))
add_label("Quick Facet", location=(1.5, -1.3, -0.9))

# ── Lighting ─────────────────────────────────────────────────────────────────
bpy.ops.object.light_add(type="AREA", location=(0, -3, 4))
key = bpy.context.active_object
key.data.energy = 600
key.data.size   = 3.0
key.rotation_euler = (math.radians(55), 0, 0)

bpy.ops.object.light_add(type="POINT", location=(3, 2, 2))
fill = bpy.context.active_object
fill.data.energy = 150
fill.data.color  = (0.6, 0.8, 1.0)

# ── Camera orbit ─────────────────────────────────────────────────────────────
bpy.ops.object.camera_add(location=(0, -5.5, 1.8))
cam = bpy.context.active_object
scene.camera = cam
cam.data.lens = 60

# One full orbit (360°) over 90 frames
for f in range(1, 91):
    angle = math.radians((f - 1) * 4.0)          # 4° per frame → 360° total
    cam.location.x = math.sin(angle) * 5.5
    cam.location.y = -math.cos(angle) * 5.5
    cam.location.z = 1.8
    # Point camera at scene centre
    dx = -cam.location.x
    dy = -cam.location.y
    dz = -cam.location.z
    cam.rotation_euler = (
        math.atan2(math.sqrt(dx**2 + dy**2), -dz) - math.pi,
        0.0,
        math.atan2(dx, dy),
    )
    cam.keyframe_insert("location",       frame=f)
    cam.keyframe_insert("rotation_euler", frame=f)

# ── Render ───────────────────────────────────────────────────────────────────
bpy.ops.render.render(animation=True)
print(f"[record.py] Wrote viewport.mp4 → {OUT_PATH}")
