"""
record.py — Viewport animation render for python-image-pixel-buffer-procedural-bake

Renders a 90-frame sequence (3 s @ 30 fps) to viewport.mp4.
The UV Mapping node's X offset is animated 0→1, causing the Voronoi pattern
to scroll across the sphere surface — visually demonstrates that the baked
texture is a proper repeating tile (the torus-wrap logic in blueprint.py
ensures there are no seams at the UV boundaries).

Run from Blender's Script editor or via:
  blender --background --python record.py
"""

import math
import array
import random
import bpy

# ─── INLINE SCENE BUILD ───────────────────────────────────────────────────────
# (Duplicate of blueprint.py core — kept self-contained so record.py runs
# without depending on blueprint.py being previously executed.)

IMG_NAME     = "hs_voronoi_bake_rec"
IMG_W, IMG_H = 256, 256   # smaller for faster record render
NUM_CELLS    = 28
SEED         = 7
EDGE_BOOST   = 0.55

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.render.engine = "BLENDER_EEVEE_NEXT"
scene.render.fps    = 30
scene.frame_start   = 1
scene.frame_end     = 90
scene.render.resolution_x = 1280
scene.render.resolution_y = 720
scene.render.image_settings.file_format = "FFMPEG"
scene.render.ffmpeg.format               = "MPEG4"
scene.render.ffmpeg.codec                = "H264"
scene.render.ffmpeg.constant_rate_factor = "MEDIUM"
scene.render.filepath = "//../../videos/scripting/python-image-pixel-buffer-procedural-bake/viewport"

world = bpy.data.worlds.new("W")
world.use_nodes = True
world.node_tree.nodes["Background"].inputs["Color"].default_value = (0.04, 0.04, 0.06, 1.0)
world.node_tree.nodes["Background"].inputs["Strength"].default_value = 0.3
scene.world = world

cam_data = bpy.data.cameras.new("Cam")
cam_obj  = bpy.data.objects.new("Cam", cam_data)
scene.collection.objects.link(cam_obj)
cam_obj.location       = (0.0, -3.2, 0.5)
cam_obj.rotation_euler = (math.radians(80), 0.0, 0.0)
scene.camera = cam_obj

light_data = bpy.data.lights.new("Key", type="AREA")
light_data.energy = 500.0
light_data.size   = 2.0
light_obj  = bpy.data.objects.new("Key", light_data)
scene.collection.objects.link(light_obj)
light_obj.location = (2.0, -1.0, 4.0)

# Pixel buffer generation
rng = random.Random(SEED)
centers = [(rng.uniform(0, 1), rng.uniform(0, 1)) for _ in range(NUM_CELLS)]

def voro(u, v):
    best = float("inf")
    for cx, cy in centers:
        dx, dy = abs(u - cx), abs(v - cy)
        if dx > 0.5: dx = 1.0 - dx
        if dy > 0.5: dy = 1.0 - dy
        d = math.sqrt(dx*dx + dy*dy)
        if d < best: best = d
    return best

MAX_D = max(voro(u, v) for u in (0, .25, .5, .75) for v in (0, .25, .5, .75)) * 1.05
buf   = array.array("f", [0.0]) * (IMG_W * IMG_H * 4)
for y in range(IMG_H):
    vv = y / (IMG_H - 1)
    for x in range(IMG_W):
        uu = x / (IMG_W - 1)
        t  = min(voro(uu, vv) / MAX_D, 1.0)
        b  = 1.0 - pow(t, EDGE_BOOST)
        i  = (y * IMG_W + x) * 4
        buf[i], buf[i+1], buf[i+2], buf[i+3] = b, b, b, 1.0

img = bpy.data.images.new(IMG_NAME, width=IMG_W, height=IMG_H, alpha=False)
img.colorspace_settings.name = "Non-Color"
img.pixels.foreach_set(buf)
img.update()

# Sphere + material
bpy.ops.mesh.primitive_uv_sphere_add(segments=48, ring_count=24, radius=1.0)
sphere = bpy.context.active_object
bpy.ops.object.shade_smooth()

mat  = bpy.data.materials.new("RecMat")
mat.use_nodes = True
tree = mat.node_tree
tree.nodes.clear()

out  = tree.nodes.new("ShaderNodeOutputMaterial"); out.location  = (500, 0)
bsdf = tree.nodes.new("ShaderNodeBsdfPrincipled");  bsdf.location = (200, 0)
bsdf.inputs["Roughness"].default_value = 0.3
tex  = tree.nodes.new("ShaderNodeTexImage");         tex.location  = (-150, 80)
tex.image = img
mapping = tree.nodes.new("ShaderNodeMapping");       mapping.name = "UVMapping"; mapping.location = (-400, 80)
coord   = tree.nodes.new("ShaderNodeTexCoord");      coord.location = (-650, 80)

tree.links.new(coord.outputs["UV"],       mapping.inputs["Vector"])
tree.links.new(mapping.outputs["Vector"], tex.inputs["Vector"])
tree.links.new(tex.outputs["Color"],      bsdf.inputs["Base Color"])
tree.links.new(bsdf.outputs["BSDF"],      out.inputs["Surface"])
sphere.data.materials.append(mat)

# ─── ANIMATE UV OFFSET (scroll texture across sphere) ─────────────────────────
mapping_node = tree.nodes["UVMapping"]
scene.frame_set(1)
mapping_node.inputs["Location"].default_value = (0.0, 0.0, 0.0)
mapping_node.inputs["Location"].keyframe_insert("default_value", frame=1)
scene.frame_set(90)
mapping_node.inputs["Location"].default_value = (1.0, 0.0, 0.0)
mapping_node.inputs["Location"].keyframe_insert("default_value", frame=90)

# Make the sphere also rotate gently
sphere.rotation_euler = (0, 0, 0)
sphere.keyframe_insert("rotation_euler", frame=1)
sphere.rotation_euler = (0, 0, math.radians(30))
sphere.keyframe_insert("rotation_euler", frame=90)
for fc in sphere.animation_data.action.fcurves:
    for kp in fc.keyframe_points:
        kp.interpolation = "LINEAR"

# ─── RENDER ───────────────────────────────────────────────────────────────────
bpy.ops.render.render(animation=True)
print("[HS] record.py complete — viewport.mp4 written.")
