"""
GN Dual Mesh — Pentagon-Hexagon Hull Armour Panel (Blender 5.1)
================================================================

WHY DUAL MESH:
  The topological dual of a mesh swaps faces and vertices: every face
  of the original becomes a vertex in the dual, and every vertex of the
  original becomes a face.  An icosphere at subdivision level 2 has 80
  triangular faces and 42 vertices.  Its dual therefore has 42 faces —
  exactly 12 pentagons (one per original degree-5 ico vertex) and 30
  hexagons (one per degree-6 midpoint vertex added by subdivision).
  This is the Buckminster Fuller C60 / soccer-ball pattern, produced
  from a single node with no manual UV layout required.

TECHNICAL NOTES — BLENDER 5.1:
  GeometryNodeDualMesh:
    bl_idname   = 'GeometryNodeDualMesh'
    Inputs      :  Mesh (geometry), Keep Boundaries (bool)
    Output      :  Dual Mesh (geometry)
    Keep Boundaries: when True, edges on open boundary loops are kept
                 as-is.  For a closed icosphere (no boundary) this is
                 a no-op, but leave it True for robustness if the
                 source is ever clipped.

  GeometryNodeCornersOfFace:
    bl_idname   = 'GeometryNodeCornersOfFace'
    Input       : Face Index (INT field — evaluated per face)
    Outputs     : Corner Index (INT, per-corner), Total (INT, per-face)
    Use case    : 'Total' gives the vertex / corner count for each face.
                 Pentagon=5, Hexagon=6 after Dual Mesh on an icosphere.

  FunctionNodeCompare (data_type='INT', operation='EQUAL'):
    Compare Total == 5  →  Boolean selection for pentagon faces.
    Feeds directly into Set Material Index so pentagon faces get a
    different emissive material without any manual face selection.

TOPOLOGY PROOF (Euler characteristic):
  V - E + F = 2  (for a closed genus-0 surface).
  Ico subdiv-2: V=42, E=120, F=80  →  42-120+80 = 2 ✓
  Dual:         V=80, E=120, F=42  →  80-120+42 = 2 ✓
  Face-valence sum = 2E: 12×5 + 30×6 = 60+180 = 240 = 2×120 ✓

OUTSIDE SOURCES:
  [1] Blender Foundation, "Dual Mesh — Geometry Nodes Reference"
      docs.blender.org/manual/en/latest/modeling/geometry_nodes/mesh/operations/dual_mesh.html
      Licence: CC BY-SA 4.0  (documentation reference only; no text copied)
      Related: github.com/blender/blender, extensions.blender.org

  [2] polyscope — geometry visualisation library by Nicholas Sharp et al.
      https://github.com/nmwsharp/polyscope  (MIT)
      Dual mesh concept demonstrated in polyscope/examples/intrinsic_triangulations.
      Related projects: nmwsharp/potpourri3d (MIT), nmwsharp/robust-laplacians-py (MIT)

HOLOFLOW TARGETS:
  hull_armour.blend  →  public/library/blends/geometry-nodes/gn-dual-mesh-hexagonal-hull-armour/
  hull_armour.glb    →  public/library/glbs/geometry-nodes/gn-dual-mesh-hexagonal-hull-armour/
  viewport.mp4       →  public/library/videos/geometry-nodes/gn-dual-mesh-hexagonal-hull-armour/
"""

import bpy
import bmesh
import math

# ── PARAMETERS ────────────────────────────────────────────────────────────────
SUBDIV_LEVEL  = 2       # ico subdivisions → 80 tri faces → 42 dual faces
ICO_RADIUS    = 1.0     # world units

PANEL_GAP     = 0.88    # Scale Elements uniform factor (< 1.0 shrinks each face)
PANEL_DEPTH   = 0.06    # extrude offset along face normal (outward = positive)
SMOOTH_ANGLE  = math.radians(30.0)  # dihedral threshold for edge sharpening

HEX_BASE_COL  = (0.18, 0.22, 0.30, 1.0)  # slate-blue metallic
HEX_METALLIC  = 0.92
HEX_ROUGHNESS = 0.28

PENT_BASE_COL    = (0.04, 0.04, 0.08, 1.0)  # near-black underlayer
PENT_EMIT_COL    = (0.20, 0.90, 1.00, 1.0)  # cyan glow
PENT_EMIT_STRENGTH = 1.8

OBJ_NAME   = "hull_armour"
TREE_NAME  = "GN_DualMesh_HullArmour"
MAT_HEX    = "MAT_Hull_Hex"
MAT_PENT   = "MAT_Hull_Pent"

OUTPUT_BLEND = "//hull_armour.blend"
OUTPUT_GLB   = "//../../glbs/geometry-nodes/gn-dual-mesh-hexagonal-hull-armour/hull_armour.glb"

# ── SCENE RESET ───────────────────────────────────────────────────────────────
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.unit_settings.system       = 'METRIC'
scene.unit_settings.scale_length = 1.0
scene.render.engine              = 'BLENDER_EEVEE_NEXT'

# ── MATERIALS ─────────────────────────────────────────────────────────────────
def _hex_material():
    """Metallic slate-blue for the 30 hexagonal panel faces."""
    mat = bpy.data.materials.new(MAT_HEX)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes['Principled BSDF']
    bsdf.inputs['Base Color'].default_value = HEX_BASE_COL
    bsdf.inputs['Metallic'].default_value   = HEX_METALLIC
    bsdf.inputs['Roughness'].default_value  = HEX_ROUGHNESS
    return mat

def _pent_material():
    """Emissive cyan overlay for the 12 pentagonal accent faces."""
    mat = bpy.data.materials.new(MAT_PENT)
    mat.use_nodes = True
    nt    = mat.node_tree
    nodes = nt.nodes
    links = nt.links
    nodes.clear()

    out  = nodes.new('ShaderNodeOutputMaterial');  out.location  = (500,  0)
    add  = nodes.new('ShaderNodeAddShader');        add.location  = (300,  0)
    bsdf = nodes.new('ShaderNodeBsdfPrincipled');   bsdf.location = (  0, 80)
    emit = nodes.new('ShaderNodeEmission');         emit.location = (  0,-80)

    bsdf.inputs['Base Color'].default_value = PENT_BASE_COL
    bsdf.inputs['Metallic'].default_value   = 0.30
    bsdf.inputs['Roughness'].default_value  = 0.55
    emit.inputs['Color'].default_value      = PENT_EMIT_COL
    emit.inputs['Strength'].default_value   = PENT_EMIT_STRENGTH

    links.new(bsdf.outputs['BSDF'],     add.inputs[0])
    links.new(emit.outputs['Emission'], add.inputs[1])
    links.new(add.outputs['Shader'],    out.inputs['Surface'])
    return mat

mat_hex  = _hex_material()
mat_pent = _pent_material()

# ── BASE MESH — ICOSPHERE ─────────────────────────────────────────────────────
# subdivisions=2 → 80 tris, 42 vertices.
# The GN modifier then computes the dual in real time, so the stored mesh
# is always the triangulated icosphere; only the evaluated result is the
# hex/pent tiling.  This keeps the .blend small and non-destructive.
bpy.ops.mesh.primitive_ico_sphere_add(
    subdivisions=SUBDIV_LEVEL,
    radius=ICO_RADIUS,
    location=(0.0, 0.0, 0.0),
)
obj      = bpy.context.active_object
obj.name = OBJ_NAME
obj.data.name = OBJ_NAME

# Material slots: 0 = hex (default), 1 = pentagon glow
obj.data.materials.append(mat_hex)
obj.data.materials.append(mat_pent)

# ── GEOMETRY NODES MODIFIER ───────────────────────────────────────────────────
mod      = obj.modifiers.new(TREE_NAME, type='NODES')
nt       = bpy.data.node_groups.new(TREE_NAME, type='GeometryNodeTree')
mod.node_group = nt

# Interface sockets (Blender 4.0+ API)
nt.interface.new_socket('Geometry', in_out='INPUT',  socket_type='NodeSocketGeometry')
nt.interface.new_socket('Geometry', in_out='OUTPUT', socket_type='NodeSocketGeometry')

nodes = nt.nodes
links = nt.links

def N(bl_idname, x, y):
    n = nodes.new(bl_idname)
    n.location = (x, y)
    return n

# I/O
grp_in  = N('NodeGroupInput',  -1000, 0)
grp_out = N('NodeGroupOutput',  1100, 0)

# 1. DUAL MESH
# Each of the 42 icosphere vertices becomes a face in the dual.
# 12 degree-5 ico vertices → 12 pentagonal faces.
# 30 degree-6 midpoint vertices → 30 hexagonal faces.
dual = N('GeometryNodeDualMesh', -800, 0)
dual.inputs['Keep Boundaries'].default_value = True

# 2. SET MATERIAL INDEX (pentagons → slot 1)
# Must run on the dual mesh BEFORE Scale Elements, so the shrunken and
# extruded geometry inherits the correct material from its parent face.
idx_face   = N('GeometryNodeInputIndex',      -620, -220)
corners_of = N('GeometryNodeCornersOfFace',   -430, -220)
# corners_of.inputs['Face Index'] ← idx_face.outputs['Index']
# corners_of.outputs['Total'] = corner count per face (5 for pent, 6 for hex)

compare = N('FunctionNodeCompare', -220, -220)
compare.data_type = 'INT'
compare.operation = 'EQUAL'
compare.inputs['B'].default_value = 5   # 5-corner face = pentagon

set_mat = N('GeometryNodeSetMaterialIndex', -600, 0)
set_mat.inputs['Material Index'].default_value = 1   # pentagon → slot 1

# 3. SCALE ELEMENTS — shrink each face towards its centre
# PANEL_GAP = 0.88 → 12 % gap between panels; 1.0 = touching; 0.0 = collapsed
scale_el = N('GeometryNodeScaleElements', -380, 0)
scale_el.domain     = 'FACE'
scale_el.scale_mode = 'UNIFORM'

val_gap = N('ShaderNodeValue', -560, -130)
val_gap.outputs[0].default_value = PANEL_GAP

# 4. EXTRUDE MESH — lift each face along its own normal
# Individual=True means each face extrudes independently (not as a group).
# Offset Scale drives the extrusion depth along the face normal.
# A positive value on an outward-facing normal raises the panel outward.
extrude = N('GeometryNodeExtrudeMesh', -140, 0)
extrude.mode = 'FACES'
extrude.inputs['Individual'].default_value   = True
extrude.inputs['Offset Scale'].default_value = PANEL_DEPTH

# 5. SMOOTH BY ANGLE — sharp edges between panels; smooth within panel faces
# Dihedral between two adjacent panels on dual-ico ≈ 138 °, so supplement
# (the "opening" angle) ≈ 42 ° > 30 ° threshold → sharp inter-panel edge.
# Dihedral within a flat hexagonal face ≈ 0 ° < 30 ° → stays smooth.
smooth_ang = N('GeometryNodeSmoothByAngle', 80, 0)
smooth_ang.inputs['Angle'].default_value    = SMOOTH_ANGLE
smooth_ang.inputs['Ignore Sharpness'].default_value = False

# 6. STORE NAMED ATTRIBUTE — Holoflow WebXR exporter reads 'holoflow:facet'
store_attr = N('GeometryNodeStoreNamedAttribute', 300, 0)
store_attr.domain    = 'FACE'
store_attr.data_type = 'FLOAT'
store_attr.inputs['Name'].default_value  = 'holoflow:facet'
store_attr.inputs['Value'].default_value = 1.0

val_one = N('ShaderNodeValue', 120, -200)
val_one.outputs[0].default_value = 1.0

# ── WIRE ─────────────────────────────────────────────────────────────────────
links.new(grp_in.outputs['Geometry'],      dual.inputs['Mesh'])

# Pentagon detection: Index → CornersOfFace → Total → Compare(=5) → Selection
links.new(idx_face.outputs['Index'],       corners_of.inputs['Face Index'])
links.new(corners_of.outputs['Total'],     compare.inputs['A'])
links.new(compare.outputs['Result'],       set_mat.inputs['Selection'])

# Main geometry chain
links.new(dual.outputs['Dual Mesh'],       set_mat.inputs['Geometry'])
links.new(set_mat.outputs['Geometry'],     scale_el.inputs['Geometry'])
links.new(val_gap.outputs[0],              scale_el.inputs['Scale'])
links.new(scale_el.outputs['Geometry'],    extrude.inputs['Mesh'])
links.new(extrude.outputs['Mesh'],         smooth_ang.inputs['Mesh'])
links.new(smooth_ang.outputs['Mesh'],      store_attr.inputs['Geometry'])
links.new(val_one.outputs[0],             store_attr.inputs['Value'])
links.new(store_attr.outputs['Geometry'],  grp_out.inputs['Geometry'])

# ── APPLY MODIFIER & TRANSFORMS ───────────────────────────────────────────────
bpy.ops.object.modifier_apply(modifier=TREE_NAME)
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)

# ── LIGHTING ──────────────────────────────────────────────────────────────────
bpy.ops.object.light_add(type='SUN', location=(4, -4, 8))
sun = bpy.context.active_object
sun.data.energy = 3.0
sun.data.angle  = math.radians(5.0)

bpy.ops.object.light_add(type='AREA', location=(-3, 3, 2))
fill = bpy.context.active_object
fill.data.energy = 80.0
fill.data.size   = 4.0

# ── CAMERA ────────────────────────────────────────────────────────────────────
bpy.ops.object.camera_add(location=(0.0, -3.5, 0.8))
cam = bpy.context.active_object
cam.rotation_euler = (math.radians(78), 0.0, 0.0)
scene.camera = cam

# ── SAVE & EXPORT ─────────────────────────────────────────────────────────────
bpy.ops.wm.save_as_mainfile(filepath=bpy.path.abspath(OUTPUT_BLEND))

bpy.data.objects[OBJ_NAME].select_set(True)
bpy.context.view_layer.objects.active = bpy.data.objects[OBJ_NAME]

bpy.ops.export_scene.gltf(
    filepath        = bpy.path.abspath(OUTPUT_GLB),
    export_format   = 'GLB',
    export_draco_mesh_compression_enable  = True,
    export_draco_mesh_compression_level   = 6,
    export_image_format = 'WEBP',
    export_texcoords    = True,
    export_normals      = True,
    export_materials    = 'EXPORT',
    export_apply        = False,
)

print(f"✓  hull_armour.blend + hull_armour.glb written.")
print(f"   Dual mesh: {SUBDIV_LEVEL}-level icosphere → 12 pentagons + 30 hexagons")
print(f"   Panel gap: {PANEL_GAP:.2f}  Extrude depth: {PANEL_DEPTH:.3f} m")
