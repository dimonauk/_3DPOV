# GN Distribute Points on Curves — Ivy Leaf Scatter
# Blender 5.1 | CC0 | Holoflow Studio
#
# Technique: stochastic density-based point distribution along a Bézier vine.
# Unlike Curve to Points (equal-interval), Distribute Points on Curves places
# points randomly at a given density with an optional Poisson-disk minimum
# distance, giving the organic irregularity of real ivy attachment nodes.
# The vine stem is a second branch: Curve to Mesh with a tiny circle profile.
#
# Outputs: output/ivy_leaf_scatter.glb  (~25–35 leaf quads on ~2 m of vine)

import bpy, os, math
from mathutils import Vector

# ── Parameters ────────────────────────────────────────────────────────────────
LEAF_W        = 0.18   # leaf quad width (m) — maximum size at vine base
LEAF_H        = 0.12   # leaf quad height (m)
LEAF_DENSITY  = 5.0    # points per metre of vine
LEAF_MIN_DIST = 0.13   # Poisson-disk guard (m): no two leaves closer than this
LEAF_SEED     = 42     # distribution seed
STEM_RADIUS   = 0.007  # vine tube radius (m)
STEM_RES_CIRC = 8      # circle segments for stem tube
VINE_RES_U    = 48     # Bézier evaluation resolution (higher = better arc-length)

# ── Material helpers ──────────────────────────────────────────────────────────
def make_emit(name, rgb):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()
    emit = nt.nodes.new('ShaderNodeEmission')
    emit.inputs['Color'].default_value   = (*rgb, 1.0)
    emit.inputs['Strength'].default_value = 1.0
    out = nt.nodes.new('ShaderNodeOutputMaterial')
    nt.links.new(emit.outputs['Emission'], out.inputs['Surface'])
    return mat

mat_stem = make_emit('ivy_stem', (0.04, 0.18, 0.03))
mat_leaf = make_emit('ivy_leaf', (0.10, 0.52, 0.09))

# ── Build climbing S-curve Bézier path (~2.4 m long) ─────────────────────────
bpy.ops.curve.primitive_bezier_curve_add(enter_editmode=False, location=(0, 0, 0))
vine = bpy.context.active_object
vine.name = 'ivy_vine_path'
vine.data.resolution_u = VINE_RES_U

spline = vine.data.splines[0]
spline.bezier_points.add(2)   # 2 default → 4 total

# Control points: base-ground → mid-arch → high-right, three-dimensional S
ctrl = [
    (Vector((0.00, 0.00, 0.00)), Vector((-0.30,  0.00, 0.00)), Vector(( 0.35,  0.15, 0.40))),
    (Vector((0.80, 0.25, 0.65)), Vector(( 0.40,  0.25, 0.55)), Vector(( 1.20,  0.25, 0.75))),
    (Vector((1.65, 0.00, 1.25)), Vector(( 1.20,  0.00, 1.15)), Vector(( 2.10,  0.00, 1.35))),
    (Vector((2.45, 0.15, 1.85)), Vector(( 2.05,  0.15, 1.75)), Vector(( 2.85,  0.15, 1.95))),
]
for i, (co, lh, rh) in enumerate(ctrl):
    bp = spline.bezier_points[i]
    bp.co = co
    bp.handle_left = lh
    bp.handle_right = rh
    bp.handle_left_type  = 'FREE'
    bp.handle_right_type = 'FREE'

# ── GN modifier ───────────────────────────────────────────────────────────────
mod = vine.modifiers.new('HF_IvyScatter', 'NODES')
ng  = bpy.data.node_groups.new('HF_IvyScatter', 'GeometryNodeTree')
mod.node_group = ng

n = ng.nodes
lk = ng.links
iface = ng.interface

# Exposed sockets — allow artist to tweak without opening the GN tree
iface.new_socket('Geometry',     in_out='INPUT',  socket_type='NodeSocketGeometry')
s_ld = iface.new_socket('Leaf Density',  in_out='INPUT',  socket_type='NodeSocketFloat')
s_md = iface.new_socket('Min Distance',  in_out='INPUT',  socket_type='NodeSocketFloat')
s_sd = iface.new_socket('Seed',          in_out='INPUT',  socket_type='NodeSocketInt')
s_lw = iface.new_socket('Leaf Width',    in_out='INPUT',  socket_type='NodeSocketFloat')
s_lh = iface.new_socket('Leaf Height',   in_out='INPUT',  socket_type='NodeSocketFloat')
iface.new_socket('Geometry',     in_out='OUTPUT', socket_type='NodeSocketGeometry')

s_ld.default_value = LEAF_DENSITY
s_md.default_value = LEAF_MIN_DIST
s_sd.default_value = LEAF_SEED
s_lw.default_value = LEAF_W
s_lh.default_value = LEAF_H

gin  = n.new('NodeGroupInput')
gout = n.new('NodeGroupOutput')

# ── Branch A: vine stem via Curve to Mesh ─────────────────────────────────────
circ = n.new('GeometryNodeCurvePrimitiveCircle')
circ.mode = 'RADIUS'
circ.inputs['Resolution'].default_value = STEM_RES_CIRC
circ.inputs['Radius'].default_value     = STEM_RADIUS

c2m = n.new('GeometryNodeCurveToMesh')
c2m.inputs['Fill Caps'].default_value = True
lk.new(gin.outputs['Geometry'], c2m.inputs['Curve'])
lk.new(circ.outputs['Curve'],   c2m.inputs['Profile Curve'])

mat_stem_node = n.new('GeometryNodeSetMaterial')
lk.new(c2m.outputs['Mesh'], mat_stem_node.inputs['Geometry'])
mat_stem_node.inputs['Material'].default_value = mat_stem

# ── Branch B: leaves via Distribute Points on Curves ─────────────────────────
# GeometryNodeDistributePointsOnCurves (Blender 4.2+):
#   Density:      float — points per unit of curve length
#   Distance Min: float — Poisson-disk exclusion radius (0 = unconstrained)
#   Seed:         int   — stochastic seed
# Outputs: Points, Normal (curve-frame normal), Tangent, Parameter (0→1)
dist = n.new('GeometryNodeDistributePointsOnCurves')
lk.new(gin.outputs['Geometry'],    dist.inputs['Curves'])
lk.new(gin.outputs['Leaf Density'], dist.inputs['Density'])
lk.new(gin.outputs['Min Distance'], dist.inputs['Distance Min'])
lk.new(gin.outputs['Seed'],         dist.inputs['Seed'])

# ── Leaf quad geometry ────────────────────────────────────────────────────────
# MeshGrid (2×2 verts) gives a single quad; Width/Height drive leaf size.
# WHY MeshGrid not Plane primitive: MeshGrid exposes Width/Height as float
# inputs, making it trivially linkable to the Group Input sockets.
leaf_geo = n.new('GeometryNodeMeshGrid')
leaf_geo.inputs['Vertices X'].default_value = 2
leaf_geo.inputs['Vertices Y'].default_value = 2
lk.new(gin.outputs['Leaf Width'],  leaf_geo.inputs['Size X'])
lk.new(gin.outputs['Leaf Height'], leaf_geo.inputs['Size Y'])

mat_leaf_node = n.new('GeometryNodeSetMaterial')
lk.new(leaf_geo.outputs['Mesh'], mat_leaf_node.inputs['Geometry'])
mat_leaf_node.inputs['Material'].default_value = mat_leaf

# ── Parameter → leaf scale taper: large at base, small at tip ────────────────
remap = n.new('ShaderNodeMapRange')
remap.data_type = 'FLOAT'
remap.inputs['From Min'].default_value = 0.0
remap.inputs['From Max'].default_value = 1.0
remap.inputs['To Min'].default_value   = 1.2   # base leaves: 20% bigger
remap.inputs['To Max'].default_value   = 0.45  # tip leaves: 55% smaller
lk.new(dist.outputs['Parameter'], remap.inputs['Value'])

# Uniform XY scale from remap; Z stays 1 (leaf is flat)
cxyz_sc = n.new('ShaderNodeCombineXYZ')
lk.new(remap.outputs['Result'], cxyz_sc.inputs['X'])
lk.new(remap.outputs['Result'], cxyz_sc.inputs['Y'])
cxyz_sc.inputs['Z'].default_value = 1.0

# ── Leaf rotation: Normal-align + random tangent-axis spin ────────────────────
# Step 1: align leaf's +Z face-normal to curve Normal so leaf faces outward.
align = n.new('FunctionNodeAlignEulerToVector')
align.axis       = 'Z'
align.pivot_axis = 'X'
lk.new(dist.outputs['Normal'], align.inputs['Vector'])

# Step 2: random angle ±60° for organic spin around the vine tangent.
rand_a = n.new('FunctionNodeRandomValue')
rand_a.data_type = 'FLOAT'
rand_a.inputs['Min'].default_value   = -math.pi / 3.0
rand_a.inputs['Max'].default_value   =  math.pi / 3.0
# WHY seed from gin rather than constant: ensures distribution matches
# the leaf-position seed so both update together on seed change.
lk.new(gin.outputs['Seed'], rand_a.inputs['Seed'])

# Step 3: rotate aligned euler by random angle around Tangent axis.
# FunctionNodeRotateEuler type='AXIS_ANGLE' space='LOCAL': applies
# angle/axis rotation in the local frame of the incoming Rotation.
rot_e = n.new('FunctionNodeRotateEuler')
rot_e.type  = 'AXIS_ANGLE'
rot_e.space = 'LOCAL'
lk.new(align.outputs['Rotation'], rot_e.inputs['Rotation'])
lk.new(rand_a.outputs['Value'],   rot_e.inputs['Angle'])
lk.new(dist.outputs['Tangent'],   rot_e.inputs['Axis'])

# ── Instance on Points ────────────────────────────────────────────────────────
inst = n.new('GeometryNodeInstanceOnPoints')
lk.new(dist.outputs['Points'],             inst.inputs['Points'])
lk.new(mat_leaf_node.outputs['Geometry'],  inst.inputs['Instance'])
lk.new(rot_e.outputs['Rotation'],          inst.inputs['Rotation'])
lk.new(cxyz_sc.outputs['Vector'],          inst.inputs['Scale'])

# Realize before Join — GLB exporter needs plain triangles, not instance data.
real = n.new('GeometryNodeRealizeInstances')
lk.new(inst.outputs['Instances'], real.inputs['Geometry'])

# ── Join stem + leaves → output ───────────────────────────────────────────────
join = n.new('GeometryNodeJoinGeometry')
lk.new(mat_stem_node.outputs['Geometry'], join.inputs['Geometry'])
lk.new(real.outputs['Geometry'],          join.inputs['Geometry'])
lk.new(join.outputs['Geometry'], gout.inputs['Geometry'])

# ── Wire modifier property values ─────────────────────────────────────────────
for item in ng.interface.items_tree:
    if item.name == 'Leaf Density':
        mod[item.identifier] = LEAF_DENSITY
    elif item.name == 'Min Distance':
        mod[item.identifier] = LEAF_MIN_DIST
    elif item.name == 'Seed':
        mod[item.identifier] = LEAF_SEED
    elif item.name == 'Leaf Width':
        mod[item.identifier] = LEAF_W
    elif item.name == 'Leaf Height':
        mod[item.identifier] = LEAF_H

# ── GLB export ────────────────────────────────────────────────────────────────
out_dir = bpy.path.abspath('//output/')
os.makedirs(out_dir, exist_ok=True)

bpy.ops.export_scene.gltf(
    filepath=os.path.join(out_dir, 'ivy_leaf_scatter.glb'),
    export_format='GLB',
    export_apply=True,       # bakes GN modifier to mesh before packing
    export_yup=True,         # studio convention: +Y up
    export_draco_mesh_compression_enable=True,
    export_draco_mesh_compression_level=6,
    export_image_format='WEBP',
    export_materials='EXPORT',
)
print('✓  ivy_leaf_scatter.glb exported')
# Expected stats (LEAF_DENSITY=5, ~2.4m vine ≈ 12 leaves):
#   Stem verts:  ~80  (8 circle segs × ~10 curve steps)
#   Leaf verts:  ~48  (12 × 4 verts each)
#   Total:       ~128 verts, file ≈ 8–12 KB GLB (Draco 6)
