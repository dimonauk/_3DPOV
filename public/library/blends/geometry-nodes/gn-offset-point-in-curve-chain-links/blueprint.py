"""
Blender 5.1 · CC0
GN — Offset Point in Curve: Articulated Chain Links

Builds a parametric chain loop on a Bezier circle path.  Each torus link
is oriented by asking "where is the NEXT point on this curve?" via the
Offset Point in Curve node — GN's exact neighbour-index look-ahead primitive.
Adjacent links are rotated 90° around the chain direction so rings are
mutually perpendicular, producing the classic flat/rolo chain silhouette.

WHY Offset Point in Curve instead of the Tangent from CurveToPoints?
On a coarsely sampled poly path the Tangent at point i is the derivative
of the INCOMING edge (i-1 → i), not the OUTGOING edge (i → i+1).  Offset
Point in Curve returns the index of point i+1, which — combined with
Evaluate at Index — yields the exact centre-to-centre direction for each link.

Run in the Blender Scripting workspace or headless:
  blender --background --python blueprint.py

Output: chain_links.blend (save manually after running), chain_links.glb
"""

# ── parameters ───────────────────────────────────────────────────────────────
LINK_COUNT  = 40        # total links in the loop (even = symmetric interlacing)
MAJOR_R     = 0.080     # torus outer radius — half the outer ring diameter (m)
MINOR_R     = 0.018     # torus tube radius — wire gauge (m)
NECKLACE_R  = 0.600     # input Bezier circle radius (m)
EXPORT_PATH = "//chain_links.glb"

import bpy
import math

# ── 1. clean scene ────────────────────────────────────────────────────────────
bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.delete()
for col in [bpy.data.meshes, bpy.data.curves, bpy.data.node_groups, bpy.data.materials]:
    for blk in list(col):
        col.remove(blk)

# ── 2. input curve ────────────────────────────────────────────────────────────
# Users replace this with any curve object — the GN tree is path-agnostic.
bpy.ops.curve.primitive_bezier_circle_add(radius=NECKLACE_R)
curve_obj = bpy.context.active_object
curve_obj.name = "chain_path"

# ── 3. gold Principled BSDF material ─────────────────────────────────────────
mat = bpy.data.materials.new("chain_gold")
mat.use_nodes = True
bsdf = mat.node_tree.nodes["Principled BSDF"]
bsdf.inputs["Base Color"].default_value = (0.82, 0.65, 0.18, 1.0)
bsdf.inputs["Metallic"].default_value   = 1.0
bsdf.inputs["Roughness"].default_value  = 0.15

# ── 4. geometry node tree ─────────────────────────────────────────────────────
ng = bpy.data.node_groups.new("HS_ChainLinks", "GeometryNodeTree")

# Interface (Blender 5.x NodeTreeInterface — replaces old ng.inputs/ng.outputs)
ng.interface.new_socket("Geometry",      in_out="OUTPUT", socket_type="NodeSocketGeometry")
ng.interface.new_socket("Geometry",      in_out="INPUT",  socket_type="NodeSocketGeometry")
s_count = ng.interface.new_socket("Link Count",   in_out="INPUT", socket_type="NodeSocketInt")
s_count.default_value = LINK_COUNT
s_major = ng.interface.new_socket("Major Radius", in_out="INPUT", socket_type="NodeSocketFloat")
s_major.default_value = MAJOR_R
s_minor = ng.interface.new_socket("Minor Radius", in_out="INPUT", socket_type="NodeSocketFloat")
s_minor.default_value = MINOR_R

N = ng.nodes
L = ng.links


def node(typ, x, y):
    nd = N.new(typ)
    nd.location = (x, y)
    return nd


# ── nodes ─────────────────────────────────────────────────────────────────────
gi     = node("NodeGroupInput",                 -1600,    0)
go     = node("NodeGroupOutput",                 1600,    0)

# Resample to exactly LINK_COUNT poly-points so arc-length is uniform
resamp = node("GeometryNodeResampleCurve",      -1300,  100)
resamp.mode = "COUNT"

# CurveToPoints converts the resampled curve into the Points domain
# that InstanceOnPoints can consume
c2p    = node("GeometryNodeCurveToPoints",      -1000,  100)
c2p.mode = "COUNT"

# Index evaluates to 0..LINK_COUNT-1 inside the InstanceOnPoints rotation
# field context, mirroring the point domain index from CurveToPoints
idx    = node("GeometryNodeInputIndex",          -700,  320)

# ── star node: Offset Point in Curve ─────────────────────────────────────────
# Returns the index of point (currentIndex + Offset) on the same spline.
# Clamp=False (default) wraps for closed curves → last link → first link,
# completing the loop with a correct direction rather than a zero vector.
opc    = node("GeometryNodeOffsetPointInCurve", -480,  320)
opc.inputs["Offset"].default_value = 1
# Do not set Clamp — leave at False so closed Bezier circle wraps

# Evaluate at Index: read the Position field at the neighbour's index.
# This is GN's "array subscript" for field data — equivalent to
# Python's `positions[next_index]` but evaluated lazily per element.
ev     = node("GeometryNodeEvaluateAtIndex",    -200,  320)
ev.domain    = "POINT"
ev.data_type = "FLOAT_VECTOR"

# Current position (per-element field; resolves in the active point domain)
pos    = node("GeometryNodeInputPosition",      -200,  480)

# Direction: next_pos − cur_pos = exact outgoing link vector
vsub   = node("ShaderNodeVectorMath",             80,  320)
vsub.operation = "SUBTRACT"

# Align each torus so hole-axis Z points along the chain direction
align  = node("FunctionNodeAlignEulerToVector",  320,  320)
align.axis       = "Z"
align.pivot_axis = "AUTO"

# Interlace: (index MODULO 2) × π/2 → 0° for even links, 90° for odd
mod2   = node("ShaderNodeMath",                 -700,  -80)
mod2.operation = "MODULO"
mod2.inputs[1].default_value = 2.0

angle  = node("ShaderNodeMath",                 -500,  -80)
angle.operation = "MULTIPLY"
angle.inputs[1].default_value = math.pi / 2.0

# Rotate around the CHAIN DIRECTION axis (not a fixed global axis) so the
# 90° tilt stays correct even as the chain curves around the path
rot    = node("FunctionNodeRotateEuler",          560,  200)
rot.type  = "AXIS_ANGLE"
rot.space = "LOCAL"

# Torus mesh primitive — each link is a solid torus ring
torus  = node("GeometryNodeMeshTorus",            320,  -200)
torus.mode = "MAJOR_MINOR"

# Place one torus instance per curve point
inst   = node("GeometryNodeInstanceOnPoints",    840,   100)

# Collapse instances to real mesh before SetMaterial so material
# indices survive GLB export (instances without Realize have no mesh data)
real   = node("GeometryNodeRealizeInstances",   1080,   100)

setmat = node("GeometryNodeSetMaterial",        1300,   100)
setmat.inputs["Material"].default_value = mat

# ── wiring ─────────────────────────────────────────────────────────────────────
# Curve through the pipeline
L.new(gi.outputs["Geometry"],             resamp.inputs["Curve"])
L.new(gi.outputs["Link Count"],           resamp.inputs["Count"])
L.new(gi.outputs["Link Count"],           c2p.inputs["Count"])
L.new(resamp.outputs["Curve"],            c2p.inputs["Curve"])

# Offset Point in Curve: resampled curve geometry + current point index
L.new(resamp.outputs["Curve"],            opc.inputs["Curve"])
L.new(idx.outputs["Index"],               opc.inputs["Point Index"])
# Offset = 1 already set as default above

# Evaluate next point's position at the returned neighbour index
L.new(resamp.outputs["Curve"],            ev.inputs["Geometry"])
L.new(opc.outputs["Point Index"],         ev.inputs["Index"])
L.new(pos.outputs["Position"],            ev.inputs["Value"])

# Chain direction vector
L.new(ev.outputs["Value"],                vsub.inputs[0])  # next position
L.new(pos.outputs["Position"],            vsub.inputs[1])  # current position

# Per-link base orientation
L.new(vsub.outputs["Vector"],             align.inputs["Vector"])

# Interlace rotation around the chain direction axis
L.new(idx.outputs["Index"],               mod2.inputs[0])
L.new(mod2.outputs["Value"],              angle.inputs[0])
L.new(align.outputs["Rotation"],          rot.inputs["Rotation"])
L.new(vsub.outputs["Vector"],             rot.inputs["Axis"])  # chain dir = rotation axis
L.new(angle.outputs["Value"],             rot.inputs["Angle"])

# Torus size from group parameters
L.new(gi.outputs["Major Radius"],         torus.inputs["Major Radius"])
L.new(gi.outputs["Minor Radius"],         torus.inputs["Minor Radius"])

# Instance placement
L.new(c2p.outputs["Points"],              inst.inputs["Points"])
L.new(torus.outputs["Mesh"],              inst.inputs["Instance"])
L.new(rot.outputs["Rotation"],            inst.inputs["Rotation"])

# Output geometry chain
L.new(inst.outputs["Instances"],          real.inputs["Geometry"])
L.new(real.outputs["Geometry"],           setmat.inputs["Geometry"])
L.new(setmat.outputs["Geometry"],         go.inputs["Geometry"])

# ── 5. attach GN modifier ─────────────────────────────────────────────────────
mod = curve_obj.modifiers.new("ChainLinks", "NODES")
mod.node_group = ng
# The Geometry input auto-connects to the object's own curve data when
# the modifier is on a curve object — no manual assignment needed.

# ── 6. export GLB ─────────────────────────────────────────────────────────────
bpy.ops.object.select_all(action="DESELECT")
curve_obj.select_set(True)
bpy.context.view_layer.objects.active = curve_obj

bpy.ops.export_scene.gltf(
    filepath=bpy.path.abspath(EXPORT_PATH),
    export_format="GLB",
    export_draco_mesh_compression_enable=True,
    export_draco_mesh_compression_level=6,
    use_selection=True,
    export_apply=True,      # applies GN modifier → bakes chain to mesh
    export_materials="EXPORT",
)
print(f"✓ {EXPORT_PATH} written")
