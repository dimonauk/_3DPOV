"""
GN Points to Curves — Poi Trail & Particle Streak Ribbons for WebXR
====================================================================
Blender 5.1 · Holoflow Studio · CC0

TECHNIQUE
---------
GeometryNodePointsToCurves groups scattered points into curve strands using
a per-point integer attribute called the "curve index".  Points sharing the
same curve index are connected in ascending point-index order to form one
POLY curve.  The output is a Curves geometry — a set of POLY splines, one
per unique curve index.

WHY THIS MATTERS FOR POI / LIGHT PAINTING
  A poi orbit sampled at N angular steps is a set of N 3-D positions.
  Points to Curves turns that ordered set into one smooth ribbon strand.
  Five concurrent orbits → five distinct strands with different curve indices.
  The ribbon geometry (Curve to Mesh with a circular profile) is the direct
  ancestor of what you see in screen recordings of poi spinning.

KEY NODES
---------
GeometryNodePointsToCurves:
  - Input: Points (POINT domain), Curve Group ID (INT attribute per point)
  - Output: Curves (one spline per unique group ID), Points (ungrouped pts)
  - Default Group ID: 0 → all points form a single closed curve.
  - The group ID attribute must be an INT on the POINT domain.

GeometryNodeResampleCurve:
  - Count mode: evenly spaces N points along the arc-length parameter.
  - Evaluated mode: uses the already-computed evaluated points (cheaper but
    only works after the curve has been evaluated by the modifier).
  - Here we use Count=64 so each exported ribbon has identical vertex count.

GeometryNodeCurveToMesh:
  - Profile curve (circle, 8-sided) is swept along the strand tangent.
  - Fill caps: True — closes the tube ends cleanly for GLB.

GOTCHA: POLY vs NURBS after Points to Curves
  Points to Curves always outputs POLY splines (straight segments between
  control points).  For smooth ribbons, chain to a ResampleCurve BEFORE
  SetSplineType('NURBS') — resampling ensures even knot spacing; NURBS
  on non-uniform POLY points produces kinks at the denser sections.

GOTCHA: Group ID must be an INT attribute, not a FLOAT
  Casting a RandomValue(FLOAT) to INT via Math(FLOOR) does NOT reliably give
  integer values for group ID purposes — floating-point rounding can produce
  duplicate group IDs with slightly different float values.  Always use
  RandomValue(INT) or index-based arithmetic.

EXPORT
------
  hf_poi_trails.blend   — full scene with GN modifier
  hf_poi_trails.glb     — Draco-6, +Y up, WebXR-ready, 5 ribbon strands
"""

import bpy
import math
from mathutils import Vector

# ── Parameters ────────────────────────────────────────────────────────────────
N_ORBITS      = 5          # number of distinct poi orbit strands
N_STEPS       = 20         # sample points per orbit period
RIBBON_RADIUS = 0.018      # ribbon cross-section radius (m)
PROFILE_SIDES = 8          # polygon sides on the circular profile

# Poi orbit geometry: each orbit is an ellipse in XY with Z modulation
ORBIT_RADII   = [0.6, 0.9, 1.2, 1.5, 1.8]   # XY radius per orbit (m)
ORBIT_Z_AMP   = [0.1, 0.2, 0.15, 0.25, 0.05] # Z oscillation amplitude
ORBIT_PHASE   = [0.0, 0.4, 0.8, 1.2, 1.6]    # angular phase offset per orbit

RESAMPLE_COUNT = 64        # vertices per ribbon strand after resampling
OUTPUT_BLEND   = "//hf_poi_trails.blend"
OUTPUT_GLB     = "//hf_poi_trails.glb"
OBJ_NAME       = "hf_poi_trails"
GN_TREE_NAME   = "HF_PoiTrailsGN"
DRACO_LEVEL    = 6

# ── 0. Clean slate ────────────────────────────────────────────────────────────
for obj in list(bpy.data.objects):
    bpy.data.objects.remove(obj, do_unlink=True)
for me in list(bpy.data.meshes):
    bpy.data.meshes.remove(me)
for ng in list(bpy.data.node_groups):
    bpy.data.node_groups.remove(ng)

scene = bpy.context.scene
scene.frame_set(1)

# ── 1. Build a point cloud mesh encoding 5 poi orbits ─────────────────────────
# Each orbit is sampled at N_STEPS equally-spaced angular positions.
# The "curve_group" attribute stores which orbit each point belongs to.
#
# Using a plain mesh as the point cloud carrier because bpy.data.meshes
# supports named attributes directly; the GN modifier reads them at evaluation.

total_pts = N_ORBITS * N_STEPS

import bmesh
bm = bmesh.new()

# Add all orbit sample vertices
for orbit_idx in range(N_ORBITS):
    r     = ORBIT_RADII[orbit_idx]
    z_amp = ORBIT_Z_AMP[orbit_idx]
    phase = ORBIT_PHASE[orbit_idx]
    for step in range(N_STEPS):
        t     = step / N_STEPS          # 0..1, one full period
        angle = 2 * math.pi * t + phase
        x     = r * math.cos(angle)
        y     = r * math.sin(angle)
        z     = z_amp * math.sin(2 * angle)   # figure-8 style Z flutter
        bm.verts.new(Vector((x, y, z)))

bm.verts.ensure_lookup_table()
me = bpy.data.meshes.new(OBJ_NAME + "_pts")
bm.to_mesh(me)
bm.free()

# Assign curve group IDs via named INT attribute
curve_group_attr = me.attributes.new("curve_group", 'INT', 'POINT')
for orbit_idx in range(N_ORBITS):
    for step in range(N_STEPS):
        vi = orbit_idx * N_STEPS + step
        curve_group_attr.data[vi].value = orbit_idx

# ── 2. Create the object and GN modifier ──────────────────────────────────────
obj = bpy.data.objects.new(OBJ_NAME, me)
scene.collection.objects.link(obj)
bpy.context.view_layer.objects.active = obj

mod = obj.modifiers.new(GN_TREE_NAME, 'NODES')

# ── 3. Build the GN node tree ─────────────────────────────────────────────────
tree  = bpy.data.node_groups.new(GN_TREE_NAME, 'GeometryNodeTree')
iface = tree.interface

iface.new_socket("Geometry", in_out='INPUT',  socket_type='NodeSocketGeometry')
iface.new_socket("Geometry", in_out='OUTPUT', socket_type='NodeSocketGeometry')

nodes = tree.nodes
links = tree.links

def N(bl_idname, x=0, y=0):
    n = nodes.new(bl_idname)
    n.location = (x, y)
    return n

n_in   = N('NodeGroupInput',  -1200, 0)
n_out  = N('NodeGroupOutput',  1600, 0)

# Read the curve_group INT attribute from the incoming point cloud
n_cg   = N('GeometryNodeInputNamedAttribute', -900, -150)
n_cg.data_type = 'INT'
n_cg.inputs['Name'].default_value = 'curve_group'

# ── Points to Curves ──────────────────────────────────────────────────────────
# This is the key node.  It groups points by "Curve Group ID" (the curve_group
# INT attribute) into one POLY spline per unique group value.
# Points whose group ID does not appear in any curve (due to filtering) are
# emitted from the "Points" output — here we discard them.
n_p2c  = N('GeometryNodePointsToCurves', -600, 0)

links.new(n_in.outputs['Geometry'],    n_p2c.inputs['Points'])
links.new(n_cg.outputs['Attribute'],   n_p2c.inputs['Curve Group ID'])

# ── Resample to uniform arc-length spacing ────────────────────────────────────
# POLY curves from Points to Curves have equal segment length only if the
# original points were evenly spaced in world-space.  Our circular orbits ARE
# evenly spaced angularly, but Z modulation makes arc length uneven.
# Resampling at Count=64 gives each ribbon strand the same vertex density.
n_res  = N('GeometryNodeResampleCurve', -300, 0)
n_res.mode = 'COUNT'
n_res.inputs['Count'].default_value = RESAMPLE_COUNT

links.new(n_p2c.outputs['Curves'], n_res.inputs['Curve'])

# ── Mark each curve as cyclic (closed loop) ────────────────────────────────────
# The last point re-connects to the first — correct for a closed poi orbit.
n_cyc  = N('GeometryNodeSetSplineCyclic', 0, 0)
n_cyc.inputs['Cyclic'].default_value = True

links.new(n_res.outputs['Curve'], n_cyc.inputs['Curve'])

# ── Spline parameter for colour gradient along the strand ─────────────────────
n_sp   = N('GeometryNodeSplineParameter',  200, -200)

# ── Store spline parameter as named attribute for material access ──────────────
n_sna  = N('GeometryNodeStoreNamedAttribute', 200, 0)
n_sna.data_type  = 'FLOAT'
n_sna.domain     = 'POINT'
n_sna.inputs['Name'].default_value = 'strand_factor'

links.new(n_cyc.outputs['Curve'],    n_sna.inputs['Geometry'])
links.new(n_sp.outputs['Factor'],    n_sna.inputs['Value'])

# ── Curve to Mesh — sweep a circular profile along each strand ─────────────────
# The profile is an 8-sided polygon (for faceted WebXR style).
# Fill Caps = True closes the tube ends.
n_circ = N('GeometryNodeCurvePrimitiveCircle', 400, -200)
n_circ.mode = 'RADIUS'
n_circ.inputs['Radius'].default_value   = RIBBON_RADIUS
n_circ.inputs['Resolution'].default_value = PROFILE_SIDES

n_c2m  = N('GeometryNodeCurveToMesh', 400, 0)
n_c2m.inputs['Fill Caps'].default_value = True

links.new(n_sna.outputs['Geometry'],   n_c2m.inputs['Curve'])
links.new(n_circ.outputs['Curve'],     n_c2m.inputs['Profile Curve'])

# ── Shade flat (studio convention: faceted) ────────────────────────────────────
n_shd  = N('GeometryNodeSetShadeSmooth', 600, 0)
n_shd.domain = 'FACE'
n_shd.inputs['Shade Smooth'].default_value = False

links.new(n_c2m.outputs['Mesh'], n_shd.inputs['Geometry'])
links.new(n_shd.outputs['Geometry'], n_out.inputs['Geometry'])

mod.node_group = tree

# ── 4. Material: emission gradient along the strand ───────────────────────────
# Reads "strand_factor" (0..1 along each spline) through ShaderNodeAttribute,
# maps through a 5-stop gradient (violet → cyan → green → yellow → magenta)
# and drives both Emission Color and a KHR_materials_emissive_strength value.

mat   = bpy.data.materials.new("HF_PoiTrail_Mat")
mat.use_nodes = True
mnodes = mat.node_tree.nodes
mlinks = mat.node_tree.links
mnodes.clear()

out_n  = mnodes.new('ShaderNodeOutputMaterial')
bsdf   = mnodes.new('ShaderNodeBsdfPrincipled')
attr_n = mnodes.new('ShaderNodeAttribute')
ramp_n = mnodes.new('ShaderNodeValToRGB')

attr_n.attribute_name = 'strand_factor'
attr_n.attribute_type = 'GEOMETRY'

# Poi-trail colour ramp: cool violet → hot cyan → lime → warm amber → magenta
ramp_n.color_ramp.interpolation = 'LINEAR'
stops = ramp_n.color_ramp.elements
stops[0].position  = 0.0;  stops[0].color  = (0.55, 0.0, 1.0,  1.0)  # violet
stops[1].position  = 1.0;  stops[1].color  = (1.0,  0.0, 0.55, 1.0)  # magenta
# Add intermediate stops
s1 = ramp_n.color_ramp.elements.new(0.25); s1.color = (0.0,  0.8, 1.0, 1.0)  # cyan
s2 = ramp_n.color_ramp.elements.new(0.50); s2.color = (0.1,  1.0, 0.0, 1.0)  # lime
s3 = ramp_n.color_ramp.elements.new(0.75); s3.color = (1.0,  0.7, 0.0, 1.0)  # amber

# Base colour dark (the non-emissive areas absorb light)
bsdf.inputs['Base Color'].default_value = (0.02, 0.02, 0.02, 1.0)
bsdf.inputs['Roughness'].default_value  = 0.9
bsdf.inputs['Metallic'].default_value   = 0.0

# Emission drives KHR_materials_emissive_strength in GLB (strength > 1 exports ext)
emit_strength = mnodes.new('ShaderNodeValue')
emit_strength.outputs[0].default_value = 4.0   # HDR bloom level in WebXR

# Multiply ramp colour by strength for emission
mul_n = mnodes.new('ShaderNodeMixRGB')
mul_n.blend_type = 'MULTIPLY'
mul_n.inputs['Fac'].default_value = 1.0

mlinks.new(ramp_n.outputs['Color'],       mul_n.inputs['Color1'])
mlinks.new(emit_strength.outputs['Value'], mul_n.inputs['Color2'])
mlinks.new(mul_n.outputs['Color'],        bsdf.inputs['Emission Color'])
mlinks.new(attr_n.outputs['Color'],       ramp_n.inputs['Fac'])
mlinks.new(bsdf.outputs['BSDF'],          out_n.inputs['Surface'])

out_n.location    = (600, 0)
bsdf.location     = (300, 0)
ramp_n.location   = (0,   0)
attr_n.location   = (-300, 0)
mul_n.location    = (0,   -200)
emit_strength.location = (-200, -300)

obj.data.materials.append(mat)

# ── 5. Evaluate, bake to static mesh, export ──────────────────────────────────
bpy.context.view_layer.update()
depsgraph  = bpy.context.evaluated_depsgraph_get()
obj_eval   = obj.evaluated_get(depsgraph)
baked_mesh = bpy.data.meshes.new_from_object(obj_eval, depsgraph=depsgraph)
baked_mesh.name = OBJ_NAME + "_baked"

baked_obj            = bpy.data.objects.new(OBJ_NAME + "_export", baked_mesh)
scene.collection.objects.link(baked_obj)
baked_obj.data.materials.append(mat)

# Save blend with live GN modifier for further editing
bpy.ops.wm.save_as_mainfile(filepath=bpy.path.abspath(OUTPUT_BLEND))

# Export only the baked ribbon object
for o in bpy.data.objects:
    o.select_set(False)
baked_obj.select_set(True)
bpy.context.view_layer.objects.active = baked_obj

bpy.ops.export_scene.gltf(
    filepath                             = bpy.path.abspath(OUTPUT_GLB),
    use_selection                        = True,
    export_format                        = 'GLB',
    export_apply                         = True,
    export_normals                       = True,
    export_yup                           = True,
    export_attributes                    = True,   # exports strand_factor accessor
    export_draco_mesh_compression_enable = True,
    export_draco_mesh_compression_level  = DRACO_LEVEL,
    export_image_format                  = 'WEBP',
    export_colors                        = True,
    export_materials                     = 'EXPORT',
)

print(f"[HF] Poi trail ribbons → {OUTPUT_GLB}")
print(f"[HF] Ribbon vertices: {len(baked_mesh.vertices)}")
