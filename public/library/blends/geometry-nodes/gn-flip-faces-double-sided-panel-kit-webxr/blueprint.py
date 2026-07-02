# ================================================================
# GN Flip Faces — Double-Sided Thin Panel Kit for WebXR
# Blender 5.1 | holoflow studio | CC0
# ================================================================
#
# WHY FLIP FACES OVER THE doubleSided MATERIAL FLAG
# --------------------------------------------------
# glTF 2.0 gives every material a `doubleSided` boolean.  When
# true, the renderer skips back-face culling for every face using
# that material.  The shadow is correct but the lighting is not:
# the SAME normal is used from both sides, so the lit-from-front
# reading is mirrored rather than inverted on the rear, producing
# flat or darkened shading from the back.  Flip Faces solves this
# by creating a second copy of the geometry with correctly outward-
# facing normals, so the back receives its own shading calculation.
# Cost: 2× triangle count.  Payoff: per-side materials, correct
# directional shading, separate texture if needed (e.g., banner
# art on front, plain canvas on back).
#
# GN TOPOLOGY: two-branch join
# ----------------------------
# Branch A (outer): original mesh, store hs_side=0.0 per face.
# Branch B (inner): Flip Faces → Set Position (offset by inner
#   normal × EPSILON to prevent z-fighting) → store hs_side=1.0.
# Join A + B → Compare hs_side to 0.5 → Set Material Index.
#
# KEY NODE: GeometryNodeFlipFaces
# --------------------------------
# Reverses face winding for selected (or all) polygons.
# No Selection wired → default True → ALL faces flipped.
# Side effect: after flip, GeometryNodeInputNormal reports the
# REVERSED (now-inward) face normal — we use this as the natural
# offset direction for the back-panel epsilon shift.
#
# Z-FIGHTING RATIONALE
# --------------------
# Both panels share vertex positions before SetPosition.  At WebXR
# viewing distances (~0.5-3 m) the GPU's 24-bit depth buffer can
# resolve differences as small as 0.01 mm at 1 m.  EPSILON=0.002 m
# (2 mm) is safely above this threshold for props up to ~10 m away
# while remaining invisible at normal arm's-length view distances.
# ================================================================

# ── CONSTANTS ────────────────────────────────────────────────────
EPSILON        = 0.002       # metres; back-panel inward offset
PANEL_W        = 1.6         # banner width  (m)
PANEL_H        = 2.4         # banner height (m)
SUBDIV_X       = 6           # horizontal subdivisions
SUBDIV_Y       = 10          # vertical subdivisions
COL_FRONT      = (0.75, 0.12, 0.10, 1.0)   # banner red
COL_BACK       = (0.88, 0.84, 0.76, 1.0)   # canvas cream
COL_BACK_ROUGH = 0.85                        # matte canvas
COL_FRONT_ROUGH = 0.60                       # semi-matte ink

import bpy
from pathlib import Path

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.context.scene.unit_settings.system       = 'METRIC'
bpy.context.scene.unit_settings.scale_length = 1.0

# ── 1. PANEL MESH ────────────────────────────────────────────────
bpy.ops.mesh.primitive_grid_add(
    x_subdivisions=SUBDIV_X,
    y_subdivisions=SUBDIV_Y,
    size=1.0,
)
obj      = bpy.context.active_object
obj.name = 'banner_panel'
# Scale to banner dimensions before applying GN.
# Apply scale so GN Position values match world metres.
obj.scale = (PANEL_W, PANEL_H, 1.0)
bpy.ops.object.transform_apply(scale=True)
# Hang vertically: X-axis is width, Z-axis is height.
obj.rotation_euler[0] = 1.5707963   # 90° → grid lies in XZ plane
bpy.ops.object.transform_apply(rotation=True)

# ── 2. BUILD GN TREE ─────────────────────────────────────────────
ng    = bpy.data.node_groups.new('HS_FlipFacesDoubleSided',
                                  'GeometryNodeTree')
ni    = ng.interface
nodes = ng.nodes
links = ng.links

# ── Interface ──
ni.new_socket('Geometry', in_out='OUTPUT',
               socket_type='NodeSocketGeometry')
ni.new_socket('Geometry', in_out='INPUT',
               socket_type='NodeSocketGeometry')
s_eps = ni.new_socket('Epsilon', in_out='INPUT',
                       socket_type='NodeSocketFloat')
s_eps.default_value = EPSILON
s_eps.min_value     = 0.0
s_eps.max_value     = 0.05
s_eps.subtype       = 'DISTANCE'

g_in  = nodes.new('NodeGroupInput');  g_in.location  = (-1600, 0)
g_out = nodes.new('NodeGroupOutput'); g_out.location  = (1200,  0)

# ── BRANCH A — outer (front) ──────────────────────────────────────
n_sa = nodes.new('GeometryNodeStoreNamedAttribute')
n_sa.domain    = 'FACE'
n_sa.data_type = 'FLOAT'
n_sa.location  = (-1100, 250)
n_sa.inputs['Name'].default_value  = 'hs_side'
n_sa.inputs['Value'].default_value = 0.0           # 0 = outer
links.new(g_in.outputs['Geometry'], n_sa.inputs['Geometry'])

# ── BRANCH B — inner (back): Flip → Offset → Store ───────────────
n_flip = nodes.new('GeometryNodeFlipFaces')
n_flip.location = (-1300, -200)
# No Selection input → all faces flipped → all normals reversed.
links.new(g_in.outputs['Geometry'], n_flip.inputs['Geometry'])

n_sb = nodes.new('GeometryNodeStoreNamedAttribute')
n_sb.domain    = 'FACE'
n_sb.data_type = 'FLOAT'
n_sb.location  = (-1100, -200)
n_sb.inputs['Name'].default_value  = 'hs_side'
n_sb.inputs['Value'].default_value = 1.0           # 1 = inner
links.new(n_flip.outputs['Geometry'], n_sb.inputs['Geometry'])

# Offset the inner panel along the (now-inverted) face normal.
# After Flip Faces, InputNormal gives the INWARD-facing normal.
# Scaling by +EPSILON moves the back panel AWAY from the front
# panel, viewed from the inside — preventing z-fighting from both.
n_nor   = nodes.new('GeometryNodeInputNormal');  n_nor.location  = (-1300, -380)
n_scale = nodes.new('ShaderNodeVectorMath');     n_scale.location = (-1100, -380)
n_scale.operation = 'SCALE'
links.new(n_nor.outputs['Normal'],    n_scale.inputs[0])
links.new(g_in.outputs['Epsilon'],    n_scale.inputs[3])   # Scale socket

n_spos = nodes.new('GeometryNodeSetPosition');  n_spos.location = (-850, -200)
links.new(n_sb.outputs['Geometry'],  n_spos.inputs['Geometry'])
# Leave Position unlinked (defaults to current position).
# Wire the epsilon-scaled inner-normal into Offset.
links.new(n_scale.outputs[0],        n_spos.inputs['Offset'])

# ── JOIN ──────────────────────────────────────────────────────────
n_join = nodes.new('GeometryNodeJoinGeometry')
n_join.location = (-550, 0)
links.new(n_sa.outputs['Geometry'],   n_join.inputs['Geometry'])
links.new(n_spos.outputs['Geometry'], n_join.inputs['Geometry'])

# ── MATERIAL INDEX ASSIGNMENT ─────────────────────────────────────
# Read hs_side (FLOAT) back as a field and compare to 0.5.
# outer = hs_side < 0.5  → material index 0
# inner = NOT outer       → material index 1
n_attr = nodes.new('GeometryNodeNamedAttribute')
n_attr.data_type = 'FLOAT'
n_attr.location  = (-550, -300)
n_attr.inputs['Name'].default_value = 'hs_side'

n_cmp = nodes.new('FunctionNodeCompare')
n_cmp.data_type = 'FLOAT'
n_cmp.operation = 'LESS_THAN'
n_cmp.location  = (-300, -300)
n_cmp.inputs['B'].default_value = 0.5
links.new(n_attr.outputs['Attribute'], n_cmp.inputs['A'])

n_not = nodes.new('FunctionNodeBooleanMath')
n_not.operation = 'NOT'
n_not.location  = (-100, -400)
links.new(n_cmp.outputs['Result'], n_not.inputs[0])

n_mi0 = nodes.new('GeometryNodeSetMaterialIndex')
n_mi0.location = (-100, 0)
n_mi0.inputs['Material Index'].default_value = 0
links.new(n_join.outputs['Geometry'],  n_mi0.inputs['Geometry'])
links.new(n_cmp.outputs['Result'],     n_mi0.inputs['Selection'])

n_mi1 = nodes.new('GeometryNodeSetMaterialIndex')
n_mi1.location = (200, 0)
n_mi1.inputs['Material Index'].default_value = 1
links.new(n_mi0.outputs['Geometry'],   n_mi1.inputs['Geometry'])
links.new(n_not.outputs['Boolean'],    n_mi1.inputs['Selection'])

links.new(n_mi1.outputs['Geometry'],   g_out.inputs['Geometry'])

# ── 3. ATTACH MODIFIER ───────────────────────────────────────────
mod            = obj.modifiers.new('HS_FlipFaces', 'NODES')
mod.node_group = ng
# Expose the epsilon socket in the modifier UI.
# In Blender 5.1 the socket is addressed by its identifier in the
# interface; set via the modifier's [] operator.
try:
    mod['Input_2'] = EPSILON    # Epsilon socket identifier
except (KeyError, TypeError):
    pass                        # identifier may differ; default is fine

# ── 4. MATERIALS ─────────────────────────────────────────────────
def make_mat(name, base_col, roughness):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nt  = mat.node_tree
    nt.nodes.clear()
    bsdf = nt.nodes.new('ShaderNodeBsdfPrincipled')
    bsdf.inputs['Base Color'].default_value  = base_col
    bsdf.inputs['Roughness'].default_value   = roughness
    out  = nt.nodes.new('ShaderNodeOutputMaterial')
    nt.links.new(bsdf.outputs['BSDF'], out.inputs['Surface'])
    # Back-face culling ON: each side is a separate correctly-wound
    # mesh, so culling is correct and we do NOT need doubleSided.
    mat.use_backface_culling = True
    return mat

mat_front = make_mat('banner_front', COL_FRONT, COL_FRONT_ROUGH)
mat_back  = make_mat('banner_back',  COL_BACK,  COL_BACK_ROUGH)
obj.data.materials.append(mat_front)   # slot 0 → SetMaterialIndex 0
obj.data.materials.append(mat_back)    # slot 1 → SetMaterialIndex 1

# ── 5. APPLY AND EXPORT ──────────────────────────────────────────
bpy.ops.object.modifier_apply(modifier=mod.name)

HERE    = Path(bpy.data.filepath).parent if bpy.data.filepath else Path('.')
GLB_OUT = HERE / 'banner_panel.glb'
bpy.ops.export_scene.gltf(
    filepath                             = str(GLB_OUT),
    export_format                        = 'GLB',
    export_apply                         = True,
    export_draco_mesh_compression_enable = True,
    export_draco_mesh_compression_level  = 6,
    export_image_format                  = 'WEBP',
)
print(f'Exported: {GLB_OUT}')
# Triangle count check: should be exactly 2 × input face count
# (each source quad split to 2 tris, duplicated for inner side).
mesh = obj.data
n_tris = sum(len(p.vertices) - 2 for p in mesh.polygons)
print(f'Triangles (expect ≈ {SUBDIV_X * SUBDIV_Y * 2 * 2}): {n_tris}')
