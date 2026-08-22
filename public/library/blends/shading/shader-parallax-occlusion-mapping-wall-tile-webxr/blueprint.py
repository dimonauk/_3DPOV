"""
Parallax Occlusion Mapping — 4-Step Steep Parallax Brick Shader
===============================================================
Blender 5.1 | CC0 | Holoflow Studio

Technique
---------
POM offsets UV coordinates based on the view direction projected into tangent
space, producing the illusion of surface depth on flat polygons.  Mortar
appears recessed; brick faces appear raised at every viewing angle.

Why tangent space
-----------------
Parallax requires knowing "how far sideways in UV space does the view ray
travel per unit of depth".  That ratio lives in tangent space: the T axis
maps to U, the B (bitangent) axis maps to V, the N axis maps to depth.
Three dot products against the camera Incoming vector decompose it into those
three components.

Limitation: no loops in shader nodes
-------------------------------------
True steep parallax ray-marches through N layers in a loop.  Blender shader
nodes have no iteration primitive, so this unrolls 4 steps at authoring time.
The result has staircase artefacts at very shallow viewing angles (<15°
incidence); add more samples by copy-pasting uv_at_step calls to mitigate.

Export note
-----------
POM is a runtime EEVEE/Cycles technique; glTF 2.0 has no parallax field.
This blueprint bakes the POM colour to a UV image and exports that for WebXR.
For a full loop-based POM in Three.js TSL, see SCREEN-RECORDING-NOTES.md.
"""

import bpy, math, os

# ── parameters ────────────────────────────────────────────────────────────────
SLUG         = "shader-parallax-occlusion-mapping-wall-tile-webxr"
HEIGHT_SCALE = 0.06   # UV displacement depth (0 = flat, 0.12 = very deep)
N_STEPS      = 4      # unrolled step count; double via copy-paste for finer results
BRICK_FREQ   = 8.0    # bricks per unit
MORTAR_W     = 0.03   # mortar width as fraction of brick face
BAKE_RES     = 1024
OUT_DIR      = bpy.path.abspath("//output/")

# ── helpers ───────────────────────────────────────────────────────────────────
def _n(tree, t, **kw):
    n = tree.nodes.new(t)
    for k, v in kw.items():
        setattr(n, k, v)
    return n

def _l(tree, src, dst):
    tree.links.new(src, dst)

def math_node(tree, op, a=None, b=None, val=None):
    m = _n(tree, "ShaderNodeMath", operation=op)
    if a   is not None: _l(tree, a, m.inputs[0])
    if b   is not None: _l(tree, b, m.inputs[1])
    if val is not None: m.inputs[1].default_value = val
    return m

def dot(tree, va, vb):
    d = _n(tree, "ShaderNodeVectorMath", operation='DOT_PRODUCT')
    _l(tree, va, d.inputs[0]); _l(tree, vb, d.inputs[1])
    return d.outputs["Value"]

# ── scene reset ───────────────────────────────────────────────────────────────
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
for m in list(bpy.data.materials):
    bpy.data.materials.remove(m)

# ── wall tile plane ───────────────────────────────────────────────────────────
bpy.ops.mesh.primitive_plane_add(size=2.0)
plane = bpy.context.active_object
plane.name = "wall_tile_pom"
bpy.ops.object.mode_set(mode='EDIT')
bpy.ops.uv.smart_project(angle_limit=66, island_margin=0.0)
bpy.ops.object.mode_set(mode='OBJECT')

# ── material ──────────────────────────────────────────────────────────────────
mat = bpy.data.materials.new("POM_BrickWall")
mat.use_nodes = True
T = mat.node_tree
T.nodes.clear()
plane.data.materials.append(mat)

out   = _n(T, "ShaderNodeOutputMaterial")
pbsdf = _n(T, "ShaderNodeBsdfPrincipled")
_l(T, pbsdf.outputs[0], out.inputs[0])

uv_in = _n(T, "ShaderNodeTexCoord")
geom  = _n(T, "ShaderNodeNewGeometry")
# Tangent node — UV_MAP mode reads the first UV channel on the mesh
tang  = _n(T, "ShaderNodeTangent", direction_type='UV_MAP')

incoming = geom.outputs["Incoming"]  # unit view ray, world space, toward camera
geo_n    = geom.outputs["Normal"]    # interpolated geometry normal, world space

# Bitangent = Cross(N, T).  Assumes +1 UV winding handedness (standard for
# front-face CCW meshes).  If parallax direction is inverted, negate HEIGHT_SCALE.
cross_nb = _n(T, "ShaderNodeVectorMath", operation='CROSS_PRODUCT')
_l(T, geo_n, cross_nb.inputs[0])
_l(T, tang.outputs[0], cross_nb.inputs[1])
bitan = cross_nb.outputs["Vector"]

# ── tangent-space view decomposition ─────────────────────────────────────────
dot_t = dot(T, incoming, tang.outputs[0])  # U component of view
dot_b = dot(T, incoming, bitan)             # V component of view
dot_n = dot(T, incoming, geo_n)             # depth component of view

# Clamp dot_n away from zero to prevent division singularity at grazing angles
clamp_n = math_node(T, 'MAXIMUM', dot_n, val=0.001)

# Full-depth UV offset: (view_U / view_depth, view_V / view_depth) * HEIGHT_SCALE
ofs_x = math_node(T, 'MULTIPLY',
            math_node(T, 'DIVIDE', dot_t, clamp_n.outputs[0]).outputs[0],
            val=HEIGHT_SCALE)
ofs_y = math_node(T, 'MULTIPLY',
            math_node(T, 'DIVIDE', dot_b, clamp_n.outputs[0]).outputs[0],
            val=HEIGHT_SCALE)

# ── per-step UV sample ────────────────────────────────────────────────────────
def uv_at_step(frac):
    """Shift base UV by frac*(ofs_x, ofs_y); return (height_fac, colour)."""
    # Scale offsets by step fraction
    mx = math_node(T, 'MULTIPLY', ofs_x.outputs[0], val=frac)
    my = math_node(T, 'MULTIPLY', ofs_y.outputs[0], val=frac)
    sep = _n(T, "ShaderNodeSeparateXYZ")
    _l(T, uv_in.outputs["UV"], sep.inputs[0])
    ax = math_node(T, 'ADD', sep.outputs[0], mx.outputs[0])
    ay = math_node(T, 'ADD', sep.outputs[1], my.outputs[0])
    comb = _n(T, "ShaderNodeCombineXYZ")
    _l(T, ax.outputs[0], comb.inputs[0])
    _l(T, ay.outputs[0], comb.inputs[1])
    # Brick Texture: Fac=1 on brick face (raised), Fac=0 in mortar (recessed)
    bk = _n(T, "ShaderNodeTexBrick")
    bk.inputs['Scale'].default_value        = BRICK_FREQ
    bk.inputs['Mortar Size'].default_value  = MORTAR_W
    bk.inputs['Color1'].default_value       = (0.72, 0.42, 0.28, 1.0)
    bk.inputs['Color2'].default_value       = (0.65, 0.35, 0.22, 1.0)
    bk.inputs['Mortar'].default_value       = (0.44, 0.41, 0.38, 1.0)
    _l(T, comb.outputs[0], bk.inputs['Vector'])
    return bk.outputs['Fac'], bk.outputs['Color']

# 5 samples: fractions 0.0, 0.25, 0.50, 0.75, 1.00
h0, c0 = uv_at_step(0.00)
h1, c1 = uv_at_step(0.25)
h2, c2 = uv_at_step(0.50)
h3, c3 = uv_at_step(0.75)
h4, c4 = uv_at_step(1.00)

# ── steep parallax cascade ────────────────────────────────────────────────────
# Select the last step i where height(UV_i) >= depth_layer_i.
# That is just before the view ray enters the surface.
# depth_layers: 0→1/N, 1→2/N, 2→3/N, 3→0.99 (near-1 catches brick top faces).

def gt_mix(val_sock, threshold, col_keep, col_override):
    gt = math_node(T, 'GREATER_THAN', val_sock, val=threshold).outputs[0]
    m  = _n(T, "ShaderNodeMixRGB"); m.blend_type = 'MIX'
    _l(T, gt, m.inputs[0]); _l(T, col_keep, m.inputs[1]); _l(T, col_override, m.inputs[2])
    return m.outputs[0]

sel = c0
sel = gt_mix(h1, 1.0 / N_STEPS, sel, c1)   # depth layer 0.25
sel = gt_mix(h2, 2.0 / N_STEPS, sel, c2)   # depth layer 0.50
sel = gt_mix(h3, 3.0 / N_STEPS, sel, c3)   # depth layer 0.75
sel = gt_mix(h4, 0.99,          sel, c4)   # depth layer ≈1.0

_l(T, sel, pbsdf.inputs["Base Color"])
pbsdf.inputs["Roughness"].default_value = 0.75

# ── bake POM colour to UV image ───────────────────────────────────────────────
os.makedirs(OUT_DIR, exist_ok=True)
bpy.context.scene.render.engine  = 'CYCLES'
bpy.context.scene.cycles.samples = 16

img = bpy.data.images.new("pom_colour_baked", BAKE_RES, BAKE_RES, alpha=False)
bk_node        = _n(T, "ShaderNodeTexImage"); bk_node.image = img
T.nodes.active = bk_node

bpy.context.view_layer.objects.active = plane
plane.select_set(True)
bpy.ops.object.bake(type='DIFFUSE', pass_filter={'COLOR'}, use_clear=True)
img.filepath_raw = os.path.join(OUT_DIR, "pom_colour_baked.png")
img.file_format  = 'PNG'
img.save()

# ── GLB export ────────────────────────────────────────────────────────────────
bpy.ops.export_scene.gltf(
    filepath       = os.path.join(OUT_DIR, "wall_tile_pom.glb"),
    export_format  = 'GLB',
    export_draco_mesh_compression_enable = True,
    export_draco_mesh_compression_level  = 6,
    export_image_format = 'WEBP',
    export_apply   = True,
    export_yup     = True,
)
print("[holoflow] wall_tile_pom complete — GLB + baked colour written to output/")
