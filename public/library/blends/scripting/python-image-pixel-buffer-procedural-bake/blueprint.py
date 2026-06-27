"""
Python — Image Pixel Buffer: Procedural Voronoi Bake via foreach_set (Blender 5.1)

TECHNIQUE: bpy.types.Image exposes its raw RGBA pixel data through a special
bpy_prop_array called `pixels`. Writing to it naively — image.pixels[i] = v —
triggers a Python-level round-trip for every element: extremely slow for any
image larger than ~32×32. The fast path is foreach_set(buffer), which copies
the entire contiguous buffer in a single C call, bypassing the Python property
getter/setter per element. This blueprint generates a procedural Voronoi cell
pattern entirely in Python, writes it to a 512×512 Image datablock in one bulk
call, packs the result into the .blend file, and wires it into a material node
tree ready for UV-mapped export.

PIXEL LAYOUT GOTCHA: Blender's pixel buffer follows the OpenGL (not PNG)
convention — origin at the BOTTOM-LEFT, rows running upward. Row 0 is the
BOTTOM row of the image. PNG and most image editors place row 0 at the TOP.
When generating procedural content you must mentally flip Y, or your image
will appear vertically mirrored when you open it in an external editor — but
display correctly in Blender's UV editor, which also uses the GL convention.

FOREACH_SET VS DIRECT INDEXING:
  Slow:  for i in range(n): image.pixels[i] = v   # Python call per element
  Fast:  image.pixels.foreach_set(flat_buffer)      # one C memcpy-like call
  Fast:  image.pixels.foreach_get(out_buffer)        # bulk read

The buffer passed to foreach_set must be a flat sequence of floats in RGBA
order, total length = width × height × 4. array.array('f', ...) and
numpy.ndarray of dtype float32 both satisfy the buffer protocol.
"""

import array
import math
import random

import bpy

# ─── PARAMETERS ──────────────────────────────────────────────────────────────
IMG_NAME       = "hs_voronoi_bake"
IMG_WIDTH      = 512
IMG_HEIGHT     = 512
NUM_CELLS      = 28          # Voronoi cell count
VORONOI_SEED   = 7           # reproducible layout
EDGE_BOOST     = 0.55        # cell-edge brightness in final remap
OUTPUT_DIR     = "//output/" # relative to .blend file; // = blend directory
MATERIAL_NAME  = "HS_VoronoiBake"
MESH_NAME      = "voronoi_sphere"

# ─── SCENE SETUP ─────────────────────────────────────────────────────────────
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.name = "PixelBufferDemo"
scene.render.engine = "CYCLES"
scene.cycles.samples = 64
scene.render.image_settings.file_format = "PNG"
scene.render.filepath = OUTPUT_DIR + "voronoi_bake_0001.png"

# World (plain dark background)
world = bpy.data.worlds.new("DemoWorld")
world.use_nodes = True
world.node_tree.nodes["Background"].inputs["Color"].default_value = (0.05, 0.05, 0.07, 1.0)
world.node_tree.nodes["Background"].inputs["Strength"].default_value = 0.4
scene.world = world

# Camera
cam_data = bpy.data.cameras.new("Cam")
cam_data.lens = 50.0
cam_obj  = bpy.data.objects.new("Cam", cam_data)
scene.collection.objects.link(cam_obj)
cam_obj.location  = (0.0, -3.5, 0.8)
cam_obj.rotation_euler = (math.radians(78), 0.0, 0.0)
scene.camera = cam_obj

# Light
light_data = bpy.data.lights.new("Key", type="AREA")
light_data.energy = 400.0
light_data.size   = 1.5
light_obj  = bpy.data.objects.new("Key", light_data)
scene.collection.objects.link(light_obj)
light_obj.location = (2.0, -1.5, 3.5)

# UV sphere to display the texture
bpy.ops.mesh.primitive_uv_sphere_add(segments=64, ring_count=32, radius=1.0)
sphere = bpy.context.active_object
sphere.name = MESH_NAME
bpy.ops.object.shade_smooth()

# ─── IMAGE CREATION ───────────────────────────────────────────────────────────
img = bpy.data.images.get(IMG_NAME)
if img:
    bpy.data.images.remove(img)
img = bpy.data.images.new(IMG_NAME, width=IMG_WIDTH, height=IMG_HEIGHT, alpha=False)
# Non-Color for data textures so Blender doesn't apply gamma correction twice.
# Set to sRGB only when the texture represents colour perceived by a viewer.
img.colorspace_settings.name = "Non-Color"

# ─── VORONOI CELL CENTRES ─────────────────────────────────────────────────────
# Scatter in [0,1)² with tiling guard — wrap distances across the UV seam so
# that the pattern tiles seamlessly when the sphere UVs cross the 0/1 boundary.
rng = random.Random(VORONOI_SEED)
centers = [(rng.uniform(0.0, 1.0), rng.uniform(0.0, 1.0)) for _ in range(NUM_CELLS)]

def voronoi_f1_tiled(u: float, v: float) -> float:
    """Return distance to nearest Voronoi centre with torus-topology wrap."""
    best = float("inf")
    for cx, cy in centers:
        dx = abs(u - cx)
        dy = abs(v - cy)
        # Torus wrap: shortest path in ℝ/ℤ
        if dx > 0.5:
            dx = 1.0 - dx
        if dy > 0.5:
            dy = 1.0 - dy
        d = math.sqrt(dx * dx + dy * dy)
        if d < best:
            best = d
    return best

# Precompute approximate maximum distance for normalisation.
# The theoretical maximum F1 distance for N random points on a unit torus is
# roughly 1/(2*sqrt(N)). We sample a few corners to get an empirical max.
MAX_DIST = max(
    voronoi_f1_tiled(u, v)
    for u in (0.0, 0.25, 0.5, 0.75)
    for v in (0.0, 0.25, 0.5, 0.75)
) * 1.05  # 5% headroom so the full [0,1] range is used

# ─── PIXEL BUFFER GENERATION ─────────────────────────────────────────────────
# The flat buffer is RGBA, row-major, BOTTOM-LEFT origin.
# Element index for pixel (x, y):  i = (y * IMG_WIDTH + x) * 4
# array.array('f') uses 32-bit IEEE 754 floats — same as Blender's pixel format.
n_floats = IMG_WIDTH * IMG_HEIGHT * 4
buf = array.array("f", [0.0]) * n_floats   # pre-allocate; multiply replicates

for y in range(IMG_HEIGHT):
    v_coord = y / (IMG_HEIGHT - 1)
    for x in range(IMG_WIDTH):
        u_coord = x / (IMG_WIDTH - 1)

        dist = voronoi_f1_tiled(u_coord, v_coord)
        t = min(dist / MAX_DIST, 1.0)

        # Remap: emphasise cell edges (where t is small → near a cell boundary)
        # by inverting and applying a power curve.
        # t=0 → on a cell edge; t=1 → cell interior far from edges.
        # We want edges bright (white) and interiors dark for a cel outline look.
        bright = 1.0 - pow(t, EDGE_BOOST)

        base = (y * IMG_WIDTH + x) * 4
        buf[base    ] = bright   # R
        buf[base + 1] = bright   # G
        buf[base + 2] = bright   # B
        buf[base + 3] = 1.0      # A (fully opaque)

# ─── BULK PIXEL WRITE ─────────────────────────────────────────────────────────
# This single call is equivalent to the loop above but runs in C — ~100× faster
# for large images. The buffer must be flat and match the total element count.
img.pixels.foreach_set(buf)
img.update()        # signal that pixel data changed (needed before render/view)
img.pack()          # embed into .blend so the file is self-contained

# NUMPY FAST PATH (alternative — uncomment to use):
# import numpy as np
# arr = np.empty((IMG_HEIGHT, IMG_WIDTH, 4), dtype=np.float32)
# for y in range(IMG_HEIGHT):
#     for x in range(IMG_WIDTH):
#         t = min(voronoi_f1_tiled(x/(IMG_WIDTH-1), y/(IMG_HEIGHT-1))/MAX_DIST, 1.0)
#         arr[y, x] = [1-t**EDGE_BOOST]*3 + [1.0]
# img.pixels.foreach_set(arr.ravel())
# img.update()

# ─── MATERIAL NODE TREE ───────────────────────────────────────────────────────
mat = bpy.data.materials.get(MATERIAL_NAME) or bpy.data.materials.new(MATERIAL_NAME)
mat.use_nodes = True
tree = mat.node_tree
tree.nodes.clear()

out_node  = tree.nodes.new("ShaderNodeOutputMaterial")
out_node.location = (600, 0)

bsdf = tree.nodes.new("ShaderNodeBsdfPrincipled")
bsdf.location = (250, 0)
bsdf.inputs["Roughness"].default_value   = 0.35
bsdf.inputs["Specular IOR Level"].default_value = 0.6

tex_node = tree.nodes.new("ShaderNodeTexImage")
tex_node.location = (-200, 80)
tex_node.image    = img
tex_node.interpolation = "Linear"

# Mapping node: animatable — record.py drives its offset to spin the pattern
mapping = tree.nodes.new("ShaderNodeMapping")
mapping.name     = "UVMapping"
mapping.location = (-500, 80)

coord = tree.nodes.new("ShaderNodeTexCoord")
coord.location   = (-750, 80)

# Emission overlay so the pattern reads clearly in Eevee viewport too
emit = tree.nodes.new("ShaderNodeEmission")
emit.location    = (250, -200)
emit.inputs["Strength"].default_value = 0.15

mix = tree.nodes.new("ShaderNodeMixShader")
mix.location = (480, -80)
mix.inputs["Fac"].default_value = 0.2

tree.links.new(coord.outputs["UV"],          mapping.inputs["Vector"])
tree.links.new(mapping.outputs["Vector"],    tex_node.inputs["Vector"])
tree.links.new(tex_node.outputs["Color"],    bsdf.inputs["Base Color"])
tree.links.new(tex_node.outputs["Color"],    emit.inputs["Color"])
tree.links.new(bsdf.outputs["BSDF"],         mix.inputs[1])
tree.links.new(emit.outputs["Emission"],     mix.inputs[2])
tree.links.new(mix.outputs["Shader"],        out_node.inputs["Surface"])

sphere.data.materials.append(mat)

print("[HS] blueprint.py complete — Image packed, material applied.")
print(f"[HS] Image: {img.size[0]}×{img.size[1]}, {len(img.pixels)} floats")
