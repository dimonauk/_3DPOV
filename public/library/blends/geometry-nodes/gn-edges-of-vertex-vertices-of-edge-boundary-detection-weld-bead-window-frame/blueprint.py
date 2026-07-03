"""
GN Edges of Vertex + Vertices of Edge
Open-Mesh Boundary Detection: Weld Bead Perimeter Strip on Sci-Fi Window Frame
Blender 5.1 | Holoflow Studio | Licence: CC0 1.0 Universal

WHY: EdgesOfVertex.Total counts ALL edges touching a vertex (including bare
boundary edges).  CornersOfVertex.Total counts face-corners, which equals the
number of FACES touching a vertex.  For a closed manifold mesh these are equal.
For an open mesh (mesh with boundary), a boundary vertex has one more edge than
face-corner — that bare boundary edge has no second adjacent face.  Therefore
  boundary_excess = EdgesOfVertex.Total − CornersOfVertex.Total
is exactly 0 for interior vertices and ≥ 1 for boundary vertices, without any
position test, UV lookup, or raycast.

VerticesOfEdge returns the two vertex indices for any edge, enabling per-edge
direction vectors computed via FieldAtIndex on Position.  These are stored as
the 'edge_dir' GLB custom attribute for anisotropic material work in Three.js.
"""

import bpy
import bmesh
from math import pi

# ── Named constants ──────────────────────────────────────────────────────────
OUTER_SEGS   = 6       # grid resolution per axis (must be even for clean hole)
OUTER_SIZE   = 2.0     # metres, full outer side length of the frame
INNER_RATIO  = 0.45    # aperture half-size as fraction of outer half-size
BEAD_RADIUS  = 0.028   # metres, cylinder radius for one weld bead
BEAD_SEGS    = 8       # circle segments on each bead cylinder (low for WebXR)
BEAD_COUNT   = 60      # approx total bead instances (ResampleCurve count)
BOUNDARY_TH  = 0.9     # EvaluateOnDomain average: ≥ this → boundary edge
MAT_FRAME    = "mat_frame_panel"
MAT_BEAD     = "mat_bead_weld"
EXPORT_PATH  = "//output/window_frame_weld.glb"
OBJ_NAME     = "window_frame_weld"
NG_NAME      = "BoundaryWeldBead_GN"

# ── Stage 1: Purge scene ──────────────────────────────────────────────────────
for obj in list(bpy.data.objects):
    bpy.data.objects.remove(obj, do_unlink=True)

# ── Stage 2: Build the washer (open grid with hole) via BMesh ────────────────
mesh = bpy.data.meshes.new(OBJ_NAME)
bm   = bmesh.new()

half_out  = OUTER_SIZE * 0.5
half_in   = half_out * INNER_RATIO

bmesh.ops.create_grid(
    bm,
    x_segments=OUTER_SEGS,
    y_segments=OUTER_SEGS,
    size=half_out,
)

# Delete faces whose barycentre falls inside the aperture rectangle.
# WHY barycentre test: cheaper than bmesh.ops.bisect; reliable for rectangular
# apertures aligned to world axes.
to_delete = [
    f for f in bm.faces
    if abs(f.calc_center_median().x) < half_in
    and abs(f.calc_center_median().y) < half_in
]
bmesh.ops.delete(bm, geom=to_delete, context="FACES")

bm.to_mesh(mesh)
bm.free()
mesh.update()

obj = bpy.data.objects.new(OBJ_NAME, mesh)
bpy.context.scene.collection.objects.link(obj)
bpy.context.view_layer.objects.active = obj

# ── Stage 3: Materials ────────────────────────────────────────────────────────
def make_mat(name, colour_rgba):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    mat.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = colour_rgba
    mat.node_tree.nodes["Principled BSDF"].inputs["Roughness"].default_value = 0.55
    return mat

mat_frame = make_mat(MAT_FRAME, (0.08, 0.10, 0.14, 1.0))  # dark gunmetal
mat_bead  = make_mat(MAT_BEAD,  (0.55, 0.42, 0.28, 1.0))  # aged bronze weld

mesh.materials.append(mat_frame)   # index 0
mesh.materials.append(mat_bead)    # index 1

# ── Stage 4: Build the Geometry Nodes tree ────────────────────────────────────
ng = bpy.data.node_groups.new(NG_NAME, "GeometryNodeTree")
nodes  = ng.nodes
links  = ng.links
ng.interface.new_socket("Geometry", in_out="INPUT",  socket_type="NodeSocketGeometry")
ng.interface.new_socket("Geometry", in_out="OUTPUT", socket_type="NodeSocketGeometry")

def N(bl_idname, x=0, y=0):
    n = nodes.new(bl_idname)
    n.location = (x, y)
    return n

def L(a, a_s, b, b_s):
    links.new(a.outputs[a_s], b.inputs[b_s])

gin   = N("NodeGroupInput",  -900, 0)
gout  = N("NodeGroupOutput",  900, 0)

# ── 4a: EdgesOfVertex.Total (POINT domain, default InputIndex = vertex index) ─
eov  = N("GeometryNodeEdgesOfVertex",       -700, 200)
# eov.inputs['Vertex Index'] left disconnected → evaluates InputIndex in POINT
# domain, i.e. each vertex queries its own incident edges.
# Output 'Total' (INT): number of edges incident to this vertex.

# ── 4b: CornersOfVertex.Total for the same vertex ────────────────────────────
cov  = N("GeometryNodeCornersOfVertex",     -700, 0)
# Likewise 'Vertex Index' unconnected → vertex context.
# Output 'Total' (INT): number of face-corners = number of faces touching vertex.

# ── 4c: boundary_excess = eov.Total − cov.Total ──────────────────────────────
sub  = N("ShaderNodeMath",               -450, 100)
sub.operation = "SUBTRACT"
L(eov, "Total",  sub, 0)
L(cov, "Total",  sub, 1)
# sub.outputs[0] = boundary_excess: 0=interior, 1=boundary, ≥2=non-manifold

# Store as named attribute in POINT domain so EvaluateOnDomain can read it.
sav  = N("GeometryNodeStoreNamedAttribute", -200, 200)
sav.domain    = "POINT"
sav.data_type = "INT"
sav.inputs["Name"].default_value = "boundary_excess"
L(gin,  "Geometry", sav, "Geometry")
L(sub,  0,          sav, "Value")

# ── 4d: Promote boundary_excess to EDGE domain via EvaluateOnDomain ──────────
# For a true boundary edge, both endpoints are boundary vertices (excess=1).
# Averaging 1+1 then dividing by 2 gives 1.0.  Interior edges average 0.0.
# "Bridge" edges (one boundary endpoint, one interior) average 0.5 — below
# BOUNDARY_TH=0.9 so they are excluded from the weld-bead placement.
na_v = N("GeometryNodeNamedAttribute",      -200, 0)
na_v.data_type = "FLOAT"
na_v.inputs["Name"].default_value = "boundary_excess"

eod  = N("GeometryNodeEvaluateOnDomain",    0, 0)
eod.domain    = "EDGE"
eod.data_type = "FLOAT"
L(na_v, "Attribute", eod, "Value")

cmp  = N("FunctionNodeCompare",              200, 0)
cmp.data_type  = "FLOAT"
cmp.operation  = "GREATER_EQUAL"
cmp.inputs["B"].default_value = BOUNDARY_TH
L(eod, "Value", cmp, "A")
# cmp.outputs['Result'] = True for boundary edges → will be used as MeshToCurve selection

# ── 4e: VerticesOfEdge — compute per-edge direction vector ───────────────────
# VerticesOfEdge evaluates in EDGE domain (InputIndex = edge index).
voe  = N("GeometryNodeVerticesOfEdge",       -700, -280)
# Outputs: 'Vertex Index 1' and 'Vertex Index 2' (both INT).
# No Sort Index socket — edges always have exactly two vertices.

pos  = N("GeometryNodeInputPosition",        -900, -420)

# FieldAtIndex samples Position at a specific vertex index.
fi1  = N("GeometryNodeFieldAtIndex",         -450, -200)
fi1.domain    = "POINT"
fi1.data_type = "FLOAT_VECTOR"
L(voe, "Vertex Index 1", fi1, "Index")
L(pos, "Position",       fi1, "Value")

fi2  = N("GeometryNodeFieldAtIndex",         -450, -400)
fi2.domain    = "POINT"
fi2.data_type = "FLOAT_VECTOR"
L(voe, "Vertex Index 2", fi2, "Index")
L(pos, "Position",       fi2, "Value")

vsub = N("ShaderNodeVectorMath",             -200, -300)
vsub.operation = "SUBTRACT"
L(fi2, "Value", vsub, 0)
L(fi1, "Value", vsub, 1)

vnrm = N("ShaderNodeVectorMath",               0, -300)
vnrm.operation = "NORMALIZE"
L(vsub, "Vector", vnrm, 0)

# Store edge_dir per edge; useful in Three.js as anisotropic tangent attribute.
sae  = N("GeometryNodeStoreNamedAttribute",  200, -200)
sae.domain    = "EDGE"
sae.data_type = "FLOAT_VECTOR"
sae.inputs["Name"].default_value = "edge_dir"
L(sav,  "Geometry", sae, "Geometry")
L(vnrm, "Vector",   sae, "Value")

# ── 4f: Extract boundary curves via MeshToCurve ──────────────────────────────
mtc = N("GeometryNodeMeshToCurve",           400, 200)
L(sae,  "Geometry", mtc, "Mesh")
L(cmp,  "Result",   mtc, "Selection")
# WHY domain=EDGE for the selection: MeshToCurve 'Selection' is an EDGE mask —
# it converts only the edges where Selection is True.

rsc  = N("GeometryNodeResampleCurve",        600, 200)
rsc.mode = "COUNT"
rsc.inputs["Count"].default_value = BEAD_COUNT
L(mtc, "Curve", rsc, "Curve")

# ── 4g: Build a bead cylinder mesh ───────────────────────────────────────────
cyl  = N("GeometryNodeMeshCylinder",         200, 400)
cyl.fill_type  = "NONE"       # open ends — cheaper for WebXR
cyl.inputs["Radius"].default_value    = BEAD_RADIUS
cyl.inputs["Depth"].default_value     = BEAD_RADIUS * 1.5
cyl.inputs["Vertices"].default_value  = BEAD_SEGS

sm   = N("GeometryNodeSetMaterial",          400, 400)
sm.inputs["Material"].default_value = mat_bead
L(cyl, "Mesh", sm, "Geometry")

# ── 4h: Instance bead on resampled curve points ──────────────────────────────
iop = N("GeometryNodeInstanceOnPoints",       800, 200)
L(rsc,  "Curve",    iop, "Points")
L(sm,   "Geometry", iop, "Instance")
# WHY no rotation on InstanceOnPoints: ResampleCurve sets the curve normal;
# the bead cylinder aligns its local Z to the curve tangent automatically
# when 'Pick Random' = False and no explicit rotation override is given.

ri  = N("GeometryNodeRealizeInstances",      1000, 200)
L(iop, "Instances", ri, "Geometry")

# ── 4i: Set frame material + join ────────────────────────────────────────────
smf = N("GeometryNodeSetMaterial",            400, -50)
smf.inputs["Material"].default_value = mat_frame
L(sae, "Geometry", smf, "Geometry")

jg  = N("GeometryNodeJoinGeometry",           700, -50)
L(smf, "Geometry", jg, "Geometry")
L(ri,  "Geometry", jg, "Geometry")

L(jg, "Geometry", gout, "Geometry")

# ── Assign modifier to object ─────────────────────────────────────────────────
mod = obj.modifiers.new("BoundaryWeld", "NODES")
mod.node_group = ng

# ── Stage 5: Camera + world for a quick viewport preview ─────────────────────
bpy.ops.object.camera_add(location=(0, -4.5, 2.8))
cam = bpy.context.active_object
cam.data.lens = 55
cam.rotation_euler = (1.05, 0.0, 0.0)
bpy.context.scene.camera = cam

bpy.context.scene.world = bpy.data.worlds.new("World")
bpy.context.scene.world.use_nodes = True
bg = bpy.context.scene.world.node_tree.nodes["Background"]
bg.inputs["Color"].default_value    = (0.03, 0.03, 0.06, 1.0)
bg.inputs["Strength"].default_value = 0.6

bpy.ops.object.light_add(type="AREA", location=(2.0, -1.5, 3.5))
key = bpy.context.active_object
key.data.energy = 600
key.data.size   = 1.8

# ── Stage 6: Export GLB ──────────────────────────────────────────────────────
import os
out_path = bpy.path.abspath(EXPORT_PATH)
os.makedirs(os.path.dirname(out_path), exist_ok=True)

bpy.ops.object.select_all(action="DESELECT")
obj.select_set(True)
bpy.context.view_layer.objects.active = obj

bpy.ops.export_scene.gltf(
    filepath=out_path,
    use_selection=True,
    export_format="GLB",
    export_apply=True,
    export_attributes=True,     # includes boundary_excess + edge_dir
    export_draco_mesh_compression_enable=True,
    export_draco_mesh_compression_level=6,
    export_yup=True,
    export_texcoords=False,
    export_normals=True,
)

print(f"[holoflow] window_frame_weld.glb → {out_path}")
print("[holoflow] custom attributes: boundary_excess (POINT,INT), edge_dir (EDGE,FLOAT_VECTOR)")
