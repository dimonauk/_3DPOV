"""
GN Sample UV Surface — UV-Addressed Rivet Grid
Slug:    gn-sample-uv-surface-rivet-grid
Blender: 5.1   Licence: CC0

TECHNIQUE
─────────
Sample UV Surface (GeometryNodeSampleUVSurface) inverts the normal UV
workflow.  Usually: 3D vertex → UV map → (u, v).  Here: (u, v) → 3D
position + normal on the mesh surface.

This makes instance placement *topology-independent*: after subdividing the
hull, deforming it with an armature, or stacking another GN modifier, the
rivets remain at the same logical surface positions because they are keyed to
UV coordinates, not vertex indices.

WHEN TO PREFER Sample UV Surface OVER ALTERNATIVES
───────────────────────────────────────────────────
• vs Raycast          – Raycast is a directional query ("what surface is
                        below this 3D point?").  Sample UV Surface is an
                        addressed query ("I want the surface point at UV
                        (0.75, 0.20)").  Use UV addressing when you have
                        authored or computed UV positions upfront.
• vs Sample Nearest   – Sample Nearest picks the closest geometry element in
                        3D space; it drifts if the mesh deforms non-uniformly.
                        UV addressing is stable: the same (u,v) always maps to
                        the same logical surface location.
• Is Valid output     – When a UV sample position falls outside every triangle
                        in the UV atlas (e.g. in a gutter between UV islands)
                        Is Valid returns False.  Gate all downstream
                        geometry-creating nodes on this boolean to avoid
                        rivets floating in dead UV space.

NODE API (Blender 5.1)
──────────────────────
n = nodes.new('GeometryNodeSampleUVSurface')
n.data_type = 'FLOAT_VECTOR'     # FLOAT | FLOAT_VECTOR | FLOAT_COLOR | BOOLEAN | INT | QUATERNION
# inputs by index:
#  [0] Mesh        — the mesh to sample FROM (not modified)
#  [1] Value       — field evaluated on that mesh (e.g. Position, Normal)
#  [2] UV Map      — string name of the UV attribute on the mesh (e.g. 'UVMap')
#  [3] Sample UV   — Vector (u, v, 0) to look up
# outputs:
#  [0] Value       — sampled result at the UV position
#  [1] Is Valid    — False if the UV coord hits no triangle
"""

import bpy
import bmesh

# ─── PARAMETERS ───────────────────────────────────────────────────────────────
HULL_CUTS      = 10      # mesh grid subdivisions per axis
HULL_SIZE      = 2.0     # metres
NOISE_SCALE    = 1.1     # warp spatial frequency
NOISE_STRENGTH = 0.14    # metres, peak warp displacement
RIVET_COLS     = 6       # columns (U direction)
RIVET_ROWS     = 6       # rows    (V direction)
UV_MARGIN      = 0.12    # keep rivets off UV border seams
UV_SPAN        = 1.0 - 2.0 * UV_MARGIN  # 0.76 — grid spans this in UV space
RIVET_H        = 0.024   # cylinder height metres
RIVET_R        = 0.020   # cylinder radius metres
RIVET_SEGS     = 8       # octagonal — cheap for WebXR
HULL_COLOR     = (0.04, 0.08, 0.12, 1.0)   # dark steel blue
RIVET_COLOR    = (0.55, 0.50, 0.42, 1.0)   # warm gunmetal

# ─── SCENE SETUP ──────────────────────────────────────────────────────────────
bpy.ops.wm.read_factory_settings(use_empty=True)

bpy.ops.mesh.primitive_grid_add(
    x_subdivisions=HULL_CUTS,
    y_subdivisions=HULL_CUTS,
    size=HULL_SIZE,
)
hull = bpy.context.active_object
hull.name = "hull_panel"

# Smart UV project — fills the 0-1 UV square with minimal distortion.
# A single contiguous island is important: Sample UV Surface is only
# deterministic when each UV coordinate maps to exactly one triangle.
bpy.ops.object.mode_set(mode='EDIT')
bpy.ops.uv.smart_project(angle_limit=66.0, island_margin=0.01)
bpy.ops.object.mode_set(mode='OBJECT')

# ─── HULL MATERIAL ────────────────────────────────────────────────────────────
hull_mat = bpy.data.materials.new('hull_panel_mat')
hull_mat.use_nodes = True
nt = hull_mat.node_tree
nt.nodes.clear()
n_bsdf    = nt.nodes.new('ShaderNodeBsdfPrincipled')
n_out_mat = nt.nodes.new('ShaderNodeOutputMaterial')
n_bsdf.inputs['Base Color'].default_value = HULL_COLOR
n_bsdf.inputs['Metallic'].default_value   = 0.85
n_bsdf.inputs['Roughness'].default_value  = 0.40
n_bsdf.location    = (-200, 0)
n_out_mat.location = ( 100, 0)
nt.links.new(n_bsdf.outputs['BSDF'], n_out_mat.inputs['Surface'])
hull.data.materials.append(hull_mat)

# ─── GN MODIFIER + NODE TREE ──────────────────────────────────────────────────
gn_mod = hull.modifiers.new('RivetGrid', 'NODES')
tree   = bpy.data.node_groups.new('rivet_grid', 'GeometryNodeTree')
gn_mod.node_group = tree

iface = tree.interface
iface.new_socket('Geometry', in_out='INPUT',  socket_type='NodeSocketGeometry')
iface.new_socket('Geometry', in_out='OUTPUT', socket_type='NodeSocketGeometry')

nodes = tree.nodes
links = tree.links


def N(btype, x=0, y=0):
    n = nodes.new(btype)
    n.location = (x, y)
    return n


# ── I/O ───────────────────────────────────────────────────────────────────────
n_in  = N('NodeGroupInput',  -1200,  0)
n_out = N('NodeGroupOutput',  1200,  0)

# ── HULL WARP (noise displacement) ────────────────────────────────────────────
# Displace the hull BEFORE passing it to Sample UV Surface, so the node
# reads from the *warped* mesh.  Rivets will snap to the warped positions.
n_pos0   = N('GeometryNodeInputPosition',  -1000,  200)
n_noise  = N('ShaderNodeTexNoise',          -800,  200)
n_noise.inputs['Scale'].default_value  = NOISE_SCALE
n_noise.inputs['Detail'].default_value = 3.0
n_noise.inputs['Roughness'].default_value = 0.55

n_remap  = N('ShaderNodeMapRange',         -560,  200)
n_remap.inputs['From Min'].default_value = 0.0
n_remap.inputs['From Max'].default_value = 1.0
n_remap.inputs['To Min'].default_value   = -NOISE_STRENGTH
n_remap.inputs['To Max'].default_value   =  NOISE_STRENGTH

n_xyz0   = N('ShaderNodeCombineXYZ',       -380,  200)
n_setpos = N('GeometryNodeSetPosition',    -180,  0)
# Warp only Z so UV-to-surface mapping stays intuitive (U=X, V=Y in object space)
links.new(n_pos0.outputs['Position'],  n_noise.inputs['Vector'])
links.new(n_noise.outputs['Fac'],      n_remap.inputs['Value'])
links.new(n_remap.outputs['Result'],   n_xyz0.inputs['Z'])
links.new(n_in.outputs['Geometry'],    n_setpos.inputs['Geometry'])
links.new(n_xyz0.outputs['Vector'],    n_setpos.inputs['Offset'])
warped_geo = n_setpos.outputs['Geometry']   # warped hull — feed to Sample UV Surface

# ── UV SAMPLE GRID ────────────────────────────────────────────────────────────
# MeshGrid with size UV_SPAN × UV_SPAN in metres.
# Because UV_SPAN = 1 - 2*UV_MARGIN, vertex X ∈ [-UV_SPAN/2, +UV_SPAN/2].
# Mapping: u = pos.x + 0.5 → [UV_MARGIN, 1-UV_MARGIN].  No division needed.
n_grid   = N('GeometryNodeMeshGrid',    -800, -300)
n_grid.inputs['Size X'].default_value = UV_SPAN
n_grid.inputs['Size Y'].default_value = UV_SPAN
n_grid.inputs['Vertices X'].default_value = RIVET_COLS
n_grid.inputs['Vertices Y'].default_value = RIVET_ROWS

n_m2pts  = N('GeometryNodeMeshToPoints', -600, -300)
n_m2pts.inputs['Radius'].default_value = 0.01
links.new(n_grid.outputs['Mesh'], n_m2pts.inputs['Mesh'])

# Compute UV vector from point position
n_pos1   = N('GeometryNodeInputPosition', -800, -450)
n_sep1   = N('ShaderNodeSeparateXYZ',     -600, -450)
links.new(n_pos1.outputs['Position'], n_sep1.inputs['Vector'])

n_addU   = N('ShaderNodeMath', -380, -400); n_addU.operation = 'ADD'
n_addU.inputs[1].default_value = 0.5
n_addV   = N('ShaderNodeMath', -380, -520); n_addV.operation = 'ADD'
n_addV.inputs[1].default_value = 0.5
links.new(n_sep1.outputs['X'], n_addU.inputs[0])
links.new(n_sep1.outputs['Y'], n_addV.inputs[0])

n_uvvec  = N('ShaderNodeCombineXYZ', -160, -460)
links.new(n_addU.outputs['Value'], n_uvvec.inputs['X'])
links.new(n_addV.outputs['Value'], n_uvvec.inputs['Y'])

# ── SAMPLE UV SURFACE — POSITION ──────────────────────────────────────────────
n_pos_field  = N('GeometryNodeInputPosition',      100, -200)
n_suv_pos    = N('GeometryNodeSampleUVSurface',    300, -200)
n_suv_pos.data_type = 'FLOAT_VECTOR'
n_suv_pos.inputs[2].default_value = 'UVMap'   # UV Map name — must match hull UV layer
links.new(warped_geo,                  n_suv_pos.inputs[0])   # Mesh
links.new(n_pos_field.outputs[0],      n_suv_pos.inputs[1])   # Value = Position
links.new(n_uvvec.outputs['Vector'],   n_suv_pos.inputs[3])   # Sample UV

# ── SAMPLE UV SURFACE — NORMAL ─────────────────────────────────────────────────
n_nor_field  = N('GeometryNodeInputNormal',        100, -400)
n_suv_nor    = N('GeometryNodeSampleUVSurface',    300, -400)
n_suv_nor.data_type = 'FLOAT_VECTOR'
n_suv_nor.inputs[2].default_value = 'UVMap'
links.new(warped_geo,                  n_suv_nor.inputs[0])
links.new(n_nor_field.outputs[0],      n_suv_nor.inputs[1])   # Value = Normal
links.new(n_uvvec.outputs['Vector'],   n_suv_nor.inputs[3])

# ── RIVET GEOMETRY ────────────────────────────────────────────────────────────
n_cyl = N('GeometryNodeMeshCylinder', 500, -500)
n_cyl.inputs['Vertices'].default_value    = RIVET_SEGS
n_cyl.inputs['Radius'].default_value     = RIVET_R
n_cyl.inputs['Depth'].default_value      = RIVET_H

# Rivet material
rivet_mat = bpy.data.materials.new('rivet_mat')
rivet_mat.use_nodes = True
rnt = rivet_mat.node_tree
rnt.nodes.clear()
rb = rnt.nodes.new('ShaderNodeBsdfPrincipled')
ro = rnt.nodes.new('ShaderNodeOutputMaterial')
rb.inputs['Base Color'].default_value = RIVET_COLOR
rb.inputs['Metallic'].default_value   = 1.0
rb.inputs['Roughness'].default_value  = 0.28
rnt.links.new(rb.outputs['BSDF'], ro.inputs['Surface'])

n_setmat = N('GeometryNodeSetMaterial', 680, -500)
n_setmat.inputs['Material'].default_value = rivet_mat
links.new(n_cyl.outputs['Mesh'], n_setmat.inputs['Geometry'])

# ── POSITION + ORIENT POINTS ──────────────────────────────────────────────────
# Set each sample-grid point to the 3D surface position returned by Sample UV Surface
n_setpos2 = N('GeometryNodeSetPosition', 500, -280)
links.new(n_m2pts.outputs['Points'],        n_setpos2.inputs['Geometry'])
links.new(n_suv_pos.outputs['Value'],       n_setpos2.inputs['Position'])

# Delete invalid points (Is Valid = False means the UV coord has no triangle)
n_inv    = N('FunctionNodeBooleanMath',  500, -150); n_inv.operation = 'NOT'
n_delpts = N('GeometryNodeDeleteGeometry', 680, -280)
n_delpts.domain = 'POINT'
links.new(n_suv_pos.outputs['Is Valid'], n_inv.inputs[0])
links.new(n_setpos2.outputs['Geometry'], n_delpts.inputs['Geometry'])
links.new(n_inv.outputs['Boolean'],      n_delpts.inputs['Selection'])

# Align rivet Z-axis to surface normal
n_align  = N('FunctionNodeAlignEulerToVector', 680, -150)
n_align.axis       = 'Z'
n_align.pivot_axis = 'AUTO'
links.new(n_suv_nor.outputs['Value'], n_align.inputs['Vector'])

# Instance rivets on valid surface points
n_inst   = N('GeometryNodeInstanceOnPoints', 860, -300)
links.new(n_delpts.outputs['Geometry'],     n_inst.inputs['Points'])
links.new(n_setmat.outputs['Geometry'],     n_inst.inputs['Instance'])
links.new(n_align.outputs['Rotation'],      n_inst.inputs['Rotation'])

n_real   = N('GeometryNodeRealizeInstances', 1000, -300)
links.new(n_inst.outputs['Instances'], n_real.inputs['Geometry'])

# ── JOIN AND OUTPUT ────────────────────────────────────────────────────────────
n_join = N('GeometryNodeJoinGeometry', 1080, 0)
links.new(warped_geo,                n_join.inputs['Geometry'])
links.new(n_real.outputs['Geometry'], n_join.inputs['Geometry'])
links.new(n_join.outputs['Geometry'], n_out.inputs['Geometry'])

# ─── VERIFY ───────────────────────────────────────────────────────────────────
bpy.context.view_layer.update()
print(f"Modifiers: {[m.name for m in hull.modifiers]}")
print(f"Node tree nodes: {len(nodes)}")
expected_rivets = RIVET_COLS * RIVET_ROWS
print(f"Expected rivet instances: {expected_rivets} ({RIVET_COLS}×{RIVET_ROWS})")

# ─── EXPORT GLB ───────────────────────────────────────────────────────────────
import os
OUT = os.path.join(
    bpy.path.abspath("//"),
    "rivet_hull.glb",
)
bpy.ops.export_scene.gltf(
    filepath=OUT,
    export_format='GLB',
    export_apply=True,            # bake GN so rivets are real geometry in GLB
    export_image_format='WEBP',
    export_draco_mesh_compression_enable=True,
    export_draco_mesh_compression_level=6,
    use_selection=False,
)
print(f"Exported: {OUT}")
