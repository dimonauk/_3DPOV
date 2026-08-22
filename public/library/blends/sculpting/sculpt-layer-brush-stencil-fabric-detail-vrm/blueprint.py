"""
Blender 5.1 — Sculpt Layer Brush + Stencil Texture:
Repeating Fabric-Weave Micro-Detail on VRM Clothing

Why Layer brush + Stencil, not Draw brush + texture:
  The Draw brush accumulates: every additional stroke over the same surface area
  piles depth higher indefinitely. That is correct for organic clay, but
  catastrophic for a repeating weave pattern where depth consistency matters.
  The Layer brush clamps displacement to `brush.height` — a hard floor. Paint
  over the same pixel ten times and it reaches the floor on stroke one, then
  stops. This means a single pass at any strength or speed produces a
  geometrically consistent weave depth across the entire garment.

  Combined with a Stencil texture, which projects a 2D mask onto the surface
  and drives WHERE within the brush footprint displacement is allowed, you get:
    — repeating fabric pattern of uniform depth
    — clean warp/weft grid without accumulated blobs
    — colour-zone auto-masking via Face Sets keeps detail confined to clothing

This blueprint cannot invoke the sculpt brush interactively (requires a GPU
display context). Instead it produces the mathematically equivalent result:
  a) Cylinder torso proxy → Multires modifier at level 3 (the sculpt canvas)
  b) Clouds texture → Displace modifier on a duplicate (stencil simulation)
  c) Displacement strength = LAYER_HEIGHT (simulates the brush floor clamp)
  d) multires_reshape bakes displaced positions into the original Multires
  e) Normal bake → 1K WebP for GLB
  f) Layer brush + stencil pre-configured in bpy.data.brushes so the
     interactive session is ready the moment Dimona opens the .blend

Source: Blender Manual CC-BY-SA-4.0, Blender Foundation.
  https://docs.blender.org/manual/en/latest/sculpt_paint/sculpting/tools/layer.html
  https://docs.blender.org/manual/en/latest/sculpt_paint/sculpting/tool_settings/texture.html
"""

import bpy
import math

# ─── parameters ──────────────────────────────────────────────────────────────
CLOTH_SEGS_U    = 24      # circumference divisions of the torso cylinder
CLOTH_SEGS_V    = 8       # height divisions
CLOTH_RADIUS    = 0.18    # m — roughly shoulder-width for a VRM torso
CLOTH_HEIGHT    = 0.28    # m — navel to collarbone approximation

MULTIRES_LEVEL  = 3       # each step × 4 faces; level 3 = 64× level 0
LAYER_HEIGHT    = 0.006   # m — Layer brush height floor (floor clamp depth)
NOISE_SCALE     = 0.07    # Clouds noise_scale — smaller → tighter weave repeat
NOISE_DEPTH     = 6       # Clouds octave count — higher → finer thread detail

BAKE_RESOLUTION = 1024
EXPORT_PATH     = "//vrm_fabric_jacket.glb"

# ─── scene reset ─────────────────────────────────────────────────────────────
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
for col in list(bpy.data.collections):
    bpy.data.collections.remove(col)

# ─── torso cylinder ──────────────────────────────────────────────────────────
bpy.ops.mesh.primitive_cylinder_add(
    vertices    = CLOTH_SEGS_U,
    depth       = CLOTH_HEIGHT,
    radius      = CLOTH_RADIUS,
    end_fill_type = 'NOTHING',     # open caps — no degenerate pole triangles
    location    = (0, 0, 0),
)
torso = bpy.context.active_object
torso.name = "VRM_Jacket"

# ─── UV unwrap at level 0 BEFORE adding Multires ─────────────────────────────
# UV seams and Smart UV Project must run at level 0 — UVs propagate through
# subdivision automatically. Running UV unwrap after Multires add gives level-0
# layout, but running after Multires apply gives wrong vertex counts.
bpy.ops.object.mode_set(mode='EDIT')
bpy.ops.mesh.select_all(action='SELECT')
bpy.ops.uv.smart_project(angle_limit=66.0, island_margin=0.02)
bpy.ops.object.mode_set(mode='OBJECT')

# ─── Multiresolution modifier ────────────────────────────────────────────────
# sculpt_levels = 3 means the sculpt canvas is at level 3 (64× level 0).
# levels = 1 for a comfortable viewport preview. render_levels = 3 for bake.
mr = torso.modifiers.new("Multires", type='MULTIRES')
for _ in range(MULTIRES_LEVEL):
    with bpy.context.temp_override(object=torso):
        bpy.ops.object.multires_subdivide(modifier="Multires", mode='CATMULL_CLARK')
mr.levels         = 1
mr.sculpt_levels  = MULTIRES_LEVEL
mr.render_levels  = MULTIRES_LEVEL

# ─── Clouds texture: fabric-weave stencil mask simulation ────────────────────
# A Blender Clouds texture at small noise_scale produces a high-frequency
# pattern that reads as woven textile when displaced at LAYER_HEIGHT depth.
# noise_depth > 4 adds sub-thread micro-detail; SOFT_NOISE avoids hard edges.
fab_tex                 = bpy.data.textures.new("FabricWeave", type='CLOUDS')
fab_tex.noise_scale     = NOISE_SCALE
fab_tex.noise_depth     = NOISE_DEPTH
fab_tex.noise_type      = 'SOFT_NOISE'
fab_tex.cloud_type      = 'GRAYSCALE'

# ─── Layer-brush simulation: duplicate → Displace → multires_reshape ─────────
# Step 1: duplicate torso at Multires level 3 (the source for reshape)
bpy.ops.object.select_all(action='DESELECT')
torso.select_set(True)
bpy.context.view_layer.objects.active = torso
bpy.ops.object.duplicate(linked=False)
dup = bpy.context.active_object
dup.name = "VRM_Jacket_HiRes"

# Step 2: materialise the duplicate at sculpt level before applying modifiers
dup.modifiers['Multires'].levels        = MULTIRES_LEVEL
dup.modifiers['Multires'].sculpt_levels = MULTIRES_LEVEL
dup.modifiers['Multires'].render_levels = MULTIRES_LEVEL

with bpy.context.temp_override(object=dup):
    bpy.ops.object.modifier_apply(modifier='Multires')
# dup is now a plain mesh at level-3 vertex count

# Step 3: Displace modifier — simulates layer brush floor clamp
# strength = LAYER_HEIGHT gives displacement equal to brush height parameter.
# texture_coords = 'GLOBAL' mimics the stencil fixed-in-world-space behaviour.
# direction = 'NORMAL' pushes vertices along face normals (same as sculpt).
disp                    = dup.modifiers.new("FabricDisplace", type='DISPLACE')
disp.texture            = fab_tex
disp.strength           = LAYER_HEIGHT
disp.texture_coords     = 'GLOBAL'
disp.direction          = 'NORMAL'
disp.mid_level          = 0.5      # noise centred at 0; half push, half pull

with bpy.context.temp_override(object=dup):
    bpy.ops.object.modifier_apply(modifier='FabricDisplace')

# Step 4: multires_reshape — bake dup vertex positions into torso Multires
# CRITICAL: dup must share topology with torso at sculpt_levels (same vertex
# count). Guaranteed here because dup was derived only via Multires apply +
# Displace (which never changes topology) on the same source mesh.
bpy.ops.object.select_all(action='DESELECT')
dup.select_set(True)
torso.select_set(True)
bpy.context.view_layer.objects.active = torso
with bpy.context.temp_override(
    object              = torso,
    selected_objects    = [dup, torso],
    selected_editable_objects = [dup, torso],
):
    bpy.ops.object.multires_reshape(modifier="Multires")

bpy.data.objects.remove(dup, do_unlink=True)
bpy.context.view_layer.objects.active = torso

# ─── configure Layer brush for interactive session ────────────────────────────
# When Dimona opens the .blend and switches to Sculpt Mode, the Layer brush
# is pre-loaded with the FabricWeave stencil. Stencil controls:
#   RMB drag           — move stencil in viewport
#   Shift + RMB drag   — scale stencil (uniform)
#   Ctrl + RMB drag    — rotate stencil
layer_brush = bpy.data.brushes.get("Layer")
if layer_brush is None:
    layer_brush = bpy.data.brushes.new("Layer", mode='SCULPT')
    layer_brush.sculpt_tool = 'LAYER'

layer_brush.height          = LAYER_HEIGHT   # the floor — most important param
layer_brush.strength        = 0.40           # ramp speed to reach the floor
layer_brush.use_persistent  = False          # False: each stroke resets to base
layer_brush.size            = 100            # px — ~10% of a 1024 UV island

ts                          = layer_brush.texture_slot
ts.texture                  = fab_tex
ts.map_mode                 = 'STENCIL'
ts.use_rake                 = False          # stencil stays fixed in viewport

# ─── bake normal map ──────────────────────────────────────────────────────────
mat = bpy.data.materials.new("Jacket_Mat")
mat.use_nodes = True
torso.data.materials.append(mat)
tree = mat.node_tree
bsdf = tree.nodes.get("Principled BSDF")

bake_img = bpy.data.images.new(
    "jacket_normal", BAKE_RESOLUTION, BAKE_RESOLUTION,
    float_buffer=True, is_data=True,
)
img_nd = tree.nodes.new("ShaderNodeTexImage")
img_nd.image  = bake_img
img_nd.label  = "BAKE_TARGET"
tree.nodes.active = img_nd

bpy.context.scene.render.engine         = 'CYCLES'
bpy.context.scene.cycles.samples        = 16
bk = bpy.context.scene.render.bake
bk.use_multires_baking    = True
bk.use_selected_to_active = False
bk.normal_space           = 'TANGENT'

mr.sculpt_levels = MULTIRES_LEVEL
mr.levels        = 0
bpy.ops.object.bake(type='NORMAL')

nmap_nd             = tree.nodes.new("ShaderNodeNormalMap")
nmap_nd.space       = 'TANGENT'
tree.links.new(img_nd.outputs['Color'], nmap_nd.inputs['Color'])
tree.links.new(nmap_nd.outputs['Normal'], bsdf.inputs['Normal'])
bake_img.pack()
mr.levels = 1

# ─── GLB export ───────────────────────────────────────────────────────────────
# export_apply=True materialises Multires at levels=1 into the GLB mesh.
# export_tangents=True is mandatory — WebXR viewers silently fall back to
# geometric normals when tangent vectors are absent, making the bake invisible.
bpy.ops.object.select_all(action='DESELECT')
torso.select_set(True)
bpy.context.view_layer.objects.active = torso
bpy.ops.export_scene.gltf(
    filepath                                = bpy.path.abspath(EXPORT_PATH),
    use_selection                           = True,
    export_apply                            = True,
    export_tangents                         = True,
    export_image_format                     = 'WEBP',
    export_draco_mesh_compression_enable    = True,
    export_draco_mesh_compression_level     = 6,
    export_yup                              = True,
)

print("Blueprint complete — vrm_fabric_jacket.glb written.")
print(f"Layer brush height floor: {LAYER_HEIGHT*1000:.1f} mm")
print(f"Multires level 3 face count: {len(torso.data.polygons)} (at viewport level 1)")
