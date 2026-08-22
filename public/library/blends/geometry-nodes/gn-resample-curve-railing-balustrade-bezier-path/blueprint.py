"""
Holoflow Studio | Blender 5.1
─────────────────────────────────────────────────────────────────────────────
GN Resample Curve — Parametric Railing & Balustrade Along a Bézier Path

Technique:
  Resample Curve (mode=LENGTH, length=POST_SPACING) ensures baluster posts
  sit at a constant physical interval regardless of how the driving Bézier is
  later reshaped.  Curve to Points then extracts per-sample position, tangent,
  and rotation.  Instance on Points places baluster boxes; Align Euler to
  Vector (axis=Z aligned to curve tangent) faces each post correctly along the
  rail.  A parallel Curve to Mesh branch with a Circle profile builds the
  continuous handrail tube.  Both branches join and Realize Instances before
  the GLB export so the WebXR loader sees plain triangulated geometry.

Output:
  public/library/blends/geometry-nodes/gn-resample-curve-railing-balustrade-bezier-path/
    railing_balustrade.blend
  public/library/glbs/geometry-nodes/gn-resample-curve-railing-balustrade-bezier-path/
    railing_balustrade.glb

Licence: CC0 1.0 — Holoflow Studio
Python: bpy 4.4 (Blender 5.1)
─────────────────────────────────────────────────────────────────────────────
"""

import bpy
import math
from mathutils import Vector

# ─── parameters ──────────────────────────────────────────────────────────────
POST_SPACING  = 0.50     # metres between baluster centres (Resample LENGTH)
RAIL_RADIUS   = 0.025    # handrail tube outer radius (m)
POST_W        = 0.022    # baluster cross-section half-width (m) — square profile
POST_H        = 0.900    # baluster height: floor to underside of handrail (m)
OUTPUT_GLB    = "//output/railing_balustrade.glb"

# ─── scene reset ─────────────────────────────────────────────────────────────
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete()

scene = bpy.context.scene
scene.name = "railing_balustrade"

# ─── path curve ──────────────────────────────────────────────────────────────
# S-curve path ~5 m long — representative of a staircase half-landing.
bpy.ops.curve.primitive_bezier_curve_add(enter_editmode=False, location=(0, 0, 0))
path_obj        = bpy.context.active_object
path_obj.name   = "railing_path"
path_obj.data.name = "railing_path"

spline = path_obj.data.splines[0]
spline.bezier_points.add(1)          # default 2 pts → add 1 → 3 pts total

ctrl = [
    (Vector(( 0.0,  0.0, 0.0)), Vector((-0.6,  0.0, 0.0)), Vector(( 0.6,  0.3, 0.0))),
    (Vector(( 2.5,  1.2, 0.0)), Vector(( 1.9,  1.2, 0.0)), Vector(( 3.1,  1.2, 0.0))),
    (Vector(( 5.0,  0.0, 0.0)), Vector(( 4.4,  0.3, 0.0)), Vector(( 5.6,  0.0, 0.0))),
]
for i, (co, lh, rh) in enumerate(ctrl):
    bp            = spline.bezier_points[i]
    bp.co         = co
    bp.handle_left  = lh
    bp.handle_right = rh
    bp.handle_left_type  = 'FREE'
    bp.handle_right_type = 'FREE'

path_obj.data.resolution_u = 32   # smoother for Curve to Mesh rail tube

# ─── materials ───────────────────────────────────────────────────────────────
def _mat(name: str, r: float, g: float, b: float, metallic: float = 0.0,
         rough: float = 0.4) -> bpy.types.Material:
    mat            = bpy.data.materials.new(name)
    mat.use_nodes  = True
    bsdf           = mat.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value  = (r, g, b, 1.0)
    bsdf.inputs["Metallic"].default_value    = metallic
    bsdf.inputs["Roughness"].default_value   = rough
    return mat

mat_rail = _mat("railing_chrome", 0.80, 0.80, 0.85, metallic=0.95, rough=0.15)
mat_post = _mat("baluster_matte", 0.18, 0.18, 0.20, metallic=0.60, rough=0.35)

# ─── GN modifier ─────────────────────────────────────────────────────────────
mod       = path_obj.modifiers.new("HF_Railing", 'NODES')
ng        = bpy.data.node_groups.new("HF_Railing", 'GeometryNodeTree')
mod.node_group = ng

nodes = ng.nodes
links = ng.links
iface = ng.interface

# ── sockets ──────────────────────────────────────────────────────────────────
sk_in  = iface.new_socket("Geometry",     in_out='INPUT',  socket_type='NodeSocketGeometry')
sk_sp  = iface.new_socket("Post Spacing", in_out='INPUT',  socket_type='NodeSocketFloat')
sk_rr  = iface.new_socket("Rail Radius",  in_out='INPUT',  socket_type='NodeSocketFloat')
sk_ph  = iface.new_socket("Post Height",  in_out='INPUT',  socket_type='NodeSocketFloat')
sk_out = iface.new_socket("Geometry",     in_out='OUTPUT', socket_type='NodeSocketGeometry')

sk_sp.default_value = POST_SPACING
sk_rr.default_value = RAIL_RADIUS
sk_ph.default_value = POST_H

gin  = nodes.new('NodeGroupInput')
gout = nodes.new('NodeGroupOutput')

# ── resample curve (LENGTH mode) ──────────────────────────────────────────────
# WHY LENGTH not COUNT: reshaping the Bézier later keeps spacing fixed at
# POST_SPACING metres.  COUNT would compress/expand the gaps proportionally
# and produce uneven balusters after any edit.
resamp = nodes.new('GeometryNodeResampleCurve')
resamp.mode = 'LENGTH'                              # evenly-spaced by distance
links.new(gin.outputs['Geometry'],           resamp.inputs['Curve'])
links.new(gin.outputs['Post Spacing'],       resamp.inputs['Length'])

# ── curve to points ──────────────────────────────────────────────────────────
# EVALUATED mode here because the curve is already uniformly resampled;
# using EVALUATED on the already-resampled curve gives one point per segment
# vertex, which is exactly what we want.
c2p = nodes.new('GeometryNodeCurveToPoints')
c2p.mode = 'EVALUATED'
links.new(resamp.outputs['Curve'], c2p.inputs['Curve'])
# c2p outputs: Points (Geometry), Tangent (VECTOR), Normal (VECTOR), Rotation (ROTATION)

# ── baluster instance geometry ────────────────────────────────────────────────
# Thin vertical box: width POST_W × depth POST_W × height POST_H.
# The box is centred at origin; we translate it up by POST_H/2 so its base
# sits on the curve path and its top meets the handrail.
box = nodes.new('GeometryNodeMeshCube')
box.inputs['Size'].default_value = (POST_W * 2, POST_W * 2, 1.0)  # XY fixed; Z driven

# Scale Z to POST_H via group input
scale_z = nodes.new('GeometryNodeScaleElements')
scale_z.domain = 'POINT'
links.new(box.outputs['Mesh'],     scale_z.inputs['Geometry'])

# Combine scale: X=1, Y=1, Z=POST_H  (CombineXYZ then uniform-scale the object)
# Simpler: use Transform Geometry with Scale.
tform_post = nodes.new('GeometryNodeTransform')
links.new(box.outputs['Mesh'],           tform_post.inputs['Geometry'])
links.new(gin.outputs['Post Height'],    tform_post.inputs['Scale'])

# WHY Scale via Transform vs Scale Elements:
#   Transform Geometry applies a non-uniform scale in world space as a
#   transform matrix.  Here all axes need different scale: X,Y=POST_W/0.5
#   and Z=POST_H.  We scale the box (which is 1×1×1 by default) via
#   CombineXYZ to get (POST_W*2, POST_W*2, POST_H) size.
box.inputs['Size'].default_value = (POST_W * 2, POST_W * 2, POST_H)

# Offset upward so base sits at y=0 (on the path) not centred at y=0.
tform_lift = nodes.new('GeometryNodeTransform')
links.new(box.outputs['Mesh'],    tform_lift.inputs['Geometry'])
# Translation Z = POST_H / 2
add_half = nodes.new('ShaderNodeMath'); add_half.operation = 'MULTIPLY'
add_half.inputs[1].default_value = 0.5
links.new(gin.outputs['Post Height'], add_half.inputs[0])
cxyz_lift = nodes.new('ShaderNodeCombineXYZ')
links.new(add_half.outputs['Value'], cxyz_lift.inputs['Z'])
links.new(cxyz_lift.outputs['Vector'], tform_lift.inputs['Translation'])

# Set baluster material.
set_mat_post = nodes.new('GeometryNodeSetMaterial')
links.new(tform_lift.outputs['Geometry'],   set_mat_post.inputs['Geometry'])
set_mat_post.inputs['Material'].default_value = mat_post

# ── instance balusters on path points ────────────────────────────────────────
inst = nodes.new('GeometryNodeInstanceOnPoints')
links.new(c2p.outputs['Points'],        inst.inputs['Points'])
links.new(set_mat_post.outputs['Geometry'], inst.inputs['Instance'])

# Align Z-axis of each instance to the curve tangent so posts face along rail.
# Axis='Z' because the baluster box's long axis is Z; the tangent vector is
# the curve direction at each sample point.
align = nodes.new('FunctionNodeAlignEulerToVector')
align.axis        = 'Z'
align.pivot_axis  = 'AUTO'
links.new(c2p.outputs['Tangent'],  align.inputs['Vector'])
links.new(align.outputs['Rotation'], inst.inputs['Rotation'])

# ── realize instances ─────────────────────────────────────────────────────────
# GLB export (apply_modifiers=True) bakes GN output, but instanced geometry
# inside a GN tree must be realized before it reaches the modifier output or
# the exporter only sees the empty point cloud.  Realize here while we still
# have access to the GN tree.
real_post = nodes.new('GeometryNodeRealizeInstances')
links.new(inst.outputs['Instances'], real_post.inputs['Geometry'])

# ── handrail tube ─────────────────────────────────────────────────────────────
# Curve to Mesh using a Circle profile = cylindrical tube along the path.
# Offset the curve Z by POST_H so the rail sits on top of the balusters.
tform_rail_curve = nodes.new('GeometryNodeTransform')
links.new(gin.outputs['Geometry'], tform_rail_curve.inputs['Geometry'])
cxyz_rail_z = nodes.new('ShaderNodeCombineXYZ')
links.new(gin.outputs['Post Height'], cxyz_rail_z.inputs['Z'])
links.new(cxyz_rail_z.outputs['Vector'], tform_rail_curve.inputs['Translation'])

rail_circle = nodes.new('GeometryNodeCurvePrimitiveCircle')
rail_circle.mode = 'RADIUS'
links.new(gin.outputs['Rail Radius'], rail_circle.inputs['Radius'])

c2m = nodes.new('GeometryNodeCurveToMesh')
c2m.inputs['Fill Caps'].default_value = True
links.new(tform_rail_curve.outputs['Geometry'], c2m.inputs['Curve'])
links.new(rail_circle.outputs['Curve'],         c2m.inputs['Profile Curve'])

set_mat_rail = nodes.new('GeometryNodeSetMaterial')
links.new(c2m.outputs['Mesh'],     set_mat_rail.inputs['Geometry'])
set_mat_rail.inputs['Material'].default_value = mat_rail

# ── join and output ───────────────────────────────────────────────────────────
join = nodes.new('GeometryNodeJoinGeometry')
links.new(real_post.outputs['Geometry'],   join.inputs['Geometry'])
links.new(set_mat_rail.outputs['Geometry'], join.inputs['Geometry'])
links.new(join.outputs['Geometry'], gout.inputs['Geometry'])

# ─── lighting ────────────────────────────────────────────────────────────────
bpy.ops.object.light_add(type='SUN', location=(3, -4, 8))
sun                  = bpy.context.active_object
sun.data.energy      = 4.0
sun.data.angle       = math.radians(3)

# ─── GLB export ──────────────────────────────────────────────────────────────
# export_apply=True bakes the GN modifier stack.  Y-up and Draco 6 follow
# Holoflow studio conventions (tools/blender-addon/holoflow_webxr_exporter).
bpy.ops.export_scene.gltf(
    filepath=OUTPUT_GLB,
    export_format='GLB',
    export_apply=True,
    export_yup=True,
    export_draco_mesh_compression_enable=True,
    export_draco_mesh_compression_level=6,
    export_image_format='WEBP',
    export_materials='EXPORT',
)
print(f"[HF] railing exported → {OUTPUT_GLB}")
