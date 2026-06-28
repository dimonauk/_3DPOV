"""
GN Capture Attribute — Pre-Twist Position Snapshot
====================================================
Blender 5.1 · CC0 · Holoflow Studio

Technique:
  GeometryNodeCaptureAttribute evaluates its Value input field ONCE, at the
  node's exact position in the GN graph, and stores the result as a concrete
  per-element attribute on the geometry. Downstream nodes that reference the
  output socket always read the frozen snapshot — even after deformation,
  remeshing, or resampling. This is the critical difference from a raw field
  reference: a field re-evaluates lazily at whatever stack position the
  consumer sits, so its value changes after every topology-altering node.

  Demo: a 16-sided cylinder is twisted procedurally inside GN. Without Capture
  Attribute, feeding Position directly to a Voronoi Texture makes cells swim
  whenever the Twist angle changes. Capturing Position BEFORE the twist freezes
  undeformed cylinder coordinates as the Voronoi seed — cells lock to the
  original cylinder grid regardless of how far the column rotates.

  Three canonical use-cases for Capture Attribute:
  1. Stable procedural seeding — position / UV frozen before deformation.
  2. Domain bridging — store a FACE-domain value so VERTEX-domain nodes can
     read it (e.g. flat face normal → per-vertex attribute).
  3. Simulation loopback — write-half of a carry-value pattern in Repeat /
     Simulation zones, where a field must survive to the next iteration.

Blender 5.1 API:
  bl_idname : GeometryNodeCaptureAttribute
  data_type  : FLOAT | INT | FLOAT_VECTOR | FLOAT_COLOR | BOOLEAN |
               FLOAT2 | QUATERNION | MATRIX
  domain     : POINT | EDGE | FACE | CORNER | CURVE | INSTANCE
  inputs[0]  : Geometry (pass-through)
  inputs[1]  : Value    (typed by data_type — wire any matching field)
  outputs[0] : Geometry (pass-through)
  outputs[1] : Attribute (the frozen value, typed by data_type)

Outside sources:
  Blender Manual — Capture Attribute Node
    https://docs.blender.org/manual/en/5.1/modeling/geometry_nodes/
      attribute/capture_attribute.html
    CC-BY-SA 4.0 · Blender Foundation
  njanakiev/blender-scripting
    https://github.com/njanakiev/blender-scripting
    MIT · Nicolas Janakiev  (GN tree construction patterns)
"""

import bpy
import bmesh
import math

# ── Parameters ─────────────────────────────────────────────────────────────
OBJ_NAME        = "CaptureAttr_Column"
NG_NAME         = "GN_CaptureAttr_StableVoronoi"
MA_NAME         = "CAP_VoronoiPanel"
CYLINDER_VERTS  = 16
CYLINDER_DEPTH  = 2.0          # metres
CYLINDER_RADIUS = 0.5          # metres
TWIST_RADIANS   = math.radians(90.0)   # 90° total twist end-to-end
VORONOI_SCALE   = 3.5          # cells per metre
CELL_ATTR_NAME  = "hs_cell_id" # stored as FLOAT_COLOR on FACE domain
GLB_PATH        = "//capture_column.glb"

# ── 1. Scene reset ─────────────────────────────────────────────────────────
def clean_scene():
    for col in (bpy.data.objects, bpy.data.meshes,
                bpy.data.node_groups, bpy.data.materials):
        for item in list(col):
            if item.name.startswith(("CaptureAttr", "GN_CaptureAttr", "CAP_")):
                col.remove(item, do_unlink=True)

# ── 2. Base mesh — 16-sided cylinder with 14 ring cuts ─────────────────────
def make_cylinder():
    bpy.ops.mesh.primitive_cylinder_add(
        vertices=CYLINDER_VERTS,
        depth=CYLINDER_DEPTH,
        radius=CYLINDER_RADIUS,
        end_fill_type="NGON",
        location=(0.0, 0.0, 0.0),
    )
    obj = bpy.context.active_object
    obj.name = OBJ_NAME

    # Add 14 horizontal ring cuts so the twist has enough geometry.
    # Only subdivide vertical (Z-spanning) edges; cap edges stay dense.
    me = obj.data
    bm = bmesh.new()
    bm.from_mesh(me)
    bm.edges.ensure_lookup_table()
    vertical = [e for e in bm.edges
                if abs(e.verts[0].co.z - e.verts[1].co.z) > 0.1]
    bmesh.ops.subdivide_edges(bm, edges=vertical, cuts=14, use_grid_fill=False)
    bm.to_mesh(me)
    bm.free()
    me.update()
    return obj

# ── 3. GN tree ─────────────────────────────────────────────────────────────
def build_gn_tree():
    ng = bpy.data.node_groups.new(NG_NAME, "GeometryNodeTree")

    # ── Interface (Blender 4.0+ API) ──────────────────────────────────────
    ng.interface.new_socket("Geometry", in_out="INPUT",
                            socket_type="NodeSocketGeometry")
    ng.interface.new_socket("Geometry", in_out="OUTPUT",
                            socket_type="NodeSocketGeometry")
    s_twist = ng.interface.new_socket("Twist", in_out="INPUT",
                                      socket_type="NodeSocketFloat")
    s_twist.default_value = TWIST_RADIANS
    s_twist.subtype       = "ANGLE"
    s_scale = ng.interface.new_socket("Voronoi Scale", in_out="INPUT",
                                      socket_type="NodeSocketFloat")
    s_scale.default_value = VORONOI_SCALE

    ns = ng.nodes

    # ── Nodes ─────────────────────────────────────────────────────────────
    n_in  = ns.new("NodeGroupInput");  n_in.location  = (-900,  0)
    n_out = ns.new("NodeGroupOutput"); n_out.location = ( 1350,  0)

    # Position field (lazy — value changes after deformation if used directly)
    n_pos = ns.new("GeometryNodeInputPosition"); n_pos.location = (-900, -220)

    # KEY NODE — Capture the pre-twist position as a frozen FLOAT_VECTOR
    # attribute on every vertex. All downstream nodes that use n_cap.outputs[1]
    # see the undeformed cylinder coordinates even after SetPosition runs.
    n_cap = ns.new("GeometryNodeCaptureAttribute")
    n_cap.data_type = "FLOAT_VECTOR"   # stores XYZ per vertex
    n_cap.domain    = "POINT"          # one value per vertex
    n_cap.location  = (-600,  0)
    # inputs[0]=Geometry, inputs[1]=Value (Vector field)
    # outputs[0]=Geometry, outputs[1]=Attribute (frozen Vector)

    # Extract Z from the captured (undeformed) position for the twist angle.
    # Using captured Z rather than live Z ensures the angle calculation is
    # also evaluated at the pre-deform position — no feedback loop.
    n_sep = ns.new("ShaderNodeSeparateXYZ"); n_sep.location = (-320, -220)

    # angle = captured_Z * (Twist / CYLINDER_DEPTH)
    # At Z = +depth/2 → angle = +Twist/2   (top of column)
    # At Z = −depth/2 → angle = −Twist/2   (bottom)
    n_rate = ns.new("ShaderNodeMath")
    n_rate.operation = "MULTIPLY"
    n_rate.location  = (-80, -220)
    n_rate.inputs[1].default_value = 1.0 / CYLINDER_DEPTH   # radians per metre

    n_angle = ns.new("ShaderNodeMath")
    n_angle.operation = "MULTIPLY"
    n_angle.location  = (140, -220)
    # inputs[1] wired from Twist group socket

    # Rotate the captured position around the world Z axis by the per-vertex
    # angle. VectorRotate AXIS_ANGLE preserves Z (rotation is purely in XY).
    n_rot = ns.new("ShaderNodeVectorRotate")
    n_rot.rotation_type = "AXIS_ANGLE"
    n_rot.location = (360, 0)
    n_rot.inputs["Axis"].default_value   = (0.0, 0.0, 1.0)
    n_rot.inputs["Center"].default_value = (0.0, 0.0, 0.0)

    # Write the rotated position as the absolute vertex position.
    # Using the Position socket (not Offset) replaces the current position
    # rather than adding a delta — avoids double-application artefacts.
    n_setpos = ns.new("GeometryNodeSetPosition")
    n_setpos.location = (620,  0)

    # Voronoi Texture seeded with CAPTURED (pre-twist) position.
    # Because n_cap.outputs[1] is a frozen snapshot, changing Twist angle
    # never moves the cell boundaries — they stay locked to the original
    # cylinder coordinates.
    n_vor = ns.new("ShaderNodeTexVoronoi")
    n_vor.voronoi_dimensions = "3D"
    n_vor.distance           = "EUCLIDEAN"
    n_vor.feature            = "F1"
    n_vor.location = (360, -350)

    # Store the Voronoi cell colour as a named FACE attribute.
    # FLOAT_COLOR with FACE domain averages the per-vertex values across each
    # face's vertices — for a clean Voronoi this gives one colour per cell face.
    n_store = ns.new("GeometryNodeStoreNamedAttribute")
    n_store.data_type = "FLOAT_COLOR"
    n_store.domain    = "FACE"
    n_store.location  = (880,  0)
    n_store.inputs["Name"].default_value = CELL_ATTR_NAME

    n_mat = ns.new("GeometryNodeSetMaterial")
    n_mat.location = (1110,  0)

    # ── Links ─────────────────────────────────────────────────────────────
    lk = ng.links.new

    # Group input → CaptureAttribute
    lk(n_in.outputs["Geometry"],  n_cap.inputs[0])
    lk(n_pos.outputs["Position"], n_cap.inputs[1])  # field → value socket

    # Captured position → SeparateXYZ → twist angle chain
    lk(n_cap.outputs[1],            n_sep.inputs["Vector"])
    lk(n_sep.outputs["Z"],          n_rate.inputs[0])
    lk(n_rate.outputs["Value"],     n_angle.inputs[0])
    lk(n_in.outputs["Twist"],       n_angle.inputs[1])

    # Captured position + angle → VectorRotate → SetPosition
    lk(n_cap.outputs[1],            n_rot.inputs["Vector"])
    lk(n_angle.outputs["Value"],    n_rot.inputs["Angle"])
    lk(n_cap.outputs[0],            n_setpos.inputs["Geometry"])
    lk(n_rot.outputs["Vector"],     n_setpos.inputs["Position"])

    # Captured position → Voronoi → StoreNamedAttribute
    lk(n_cap.outputs[1],            n_vor.inputs["Vector"])
    lk(n_in.outputs["Voronoi Scale"], n_vor.inputs["Scale"])
    lk(n_setpos.outputs["Geometry"], n_store.inputs["Geometry"])
    lk(n_vor.outputs["Color"],       n_store.inputs["Value"])

    # → SetMaterial → output
    lk(n_store.outputs["Geometry"], n_mat.inputs["Geometry"])
    lk(n_mat.outputs["Geometry"],   n_out.inputs["Geometry"])

    return ng

# ── 4. Material — reads FACE attribute for flat cell colour ────────────────
def make_material():
    mat = bpy.data.materials.new(MA_NAME)
    mat.use_nodes = True
    t = mat.node_tree
    for n in list(t.nodes): t.nodes.remove(n)

    # ShaderNodeAttribute reads the FACE-domain FLOAT_COLOR named attribute.
    # attribute_type='GEOMETRY' reads from mesh data (not UV or tangent).
    n_attr = t.nodes.new("ShaderNodeAttribute")
    n_attr.attribute_name = CELL_ATTR_NAME
    n_attr.attribute_type = "GEOMETRY"
    n_attr.location = (-450, 0)

    # CONSTANT interpolation gives hard cell borders — no blending at edges.
    n_cr = t.nodes.new("ShaderNodeValToRGB")
    n_cr.location = (-220, 0)
    n_cr.color_ramp.interpolation = "CONSTANT"
    n_cr.color_ramp.elements[0].color = (0.04, 0.06, 0.12, 1.0)
    n_cr.color_ramp.elements[1].color = (0.15, 0.20, 0.32, 1.0)

    n_pbr = t.nodes.new("ShaderNodeBsdfPrincipled")
    n_pbr.location = (50, 0)
    n_pbr.inputs["Metallic"].default_value  = 0.9
    n_pbr.inputs["Roughness"].default_value = 0.3

    n_out = t.nodes.new("ShaderNodeOutputMaterial")
    n_out.location = (350, 0)

    t.links.new(n_attr.outputs["Color"], n_cr.inputs["Fac"])
    t.links.new(n_cr.outputs["Color"],   n_pbr.inputs["Base Color"])
    t.links.new(n_pbr.outputs["BSDF"],   n_out.inputs["Surface"])
    return mat

# ── 5. GLB export ──────────────────────────────────────────────────────────
def export_glb(filepath=GLB_PATH):
    bpy.ops.export_scene.gltf(
        filepath=bpy.path.abspath(filepath),
        export_format="GLB",
        export_apply=True,                        # bakes GN modifier
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_image_format="WEBP",
        export_colors=True,    # preserves FLOAT_COLOR attributes
        export_attributes=True,                   # exports hs_cell_id
    )
    print(f"[blueprint] Exported {filepath}")

# ── main ───────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    clean_scene()
    obj = make_cylinder()
    ng  = build_gn_tree()
    mod = obj.modifiers.new(NG_NAME, "NODES")
    mod.node_group = ng

    mat = make_material()
    obj.data.materials.append(mat)
    for node in ng.nodes:
        if node.type == "SET_MATERIAL":
            node.inputs["Material"].default_value = mat

    export_glb()
    print("[blueprint] Done — capture_column.glb ready for WebXR.")
