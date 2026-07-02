# blueprint.py — GN Foreach Element Zone: Per-Face Stone Chisel Ashlar Wall
# Blender 5.1 | CC0 | Holoflow Studio Library
# https://holoflow.co.uk/tutorials/blender-tutorial-gn-foreach-element-zone-stone-chisel-wall
#
# TECHNIQUE — Foreach Geometry Element Zone (introduced Blender 4.3):
#   Standard field-based GN evaluates the same graph for ALL elements
#   simultaneously.  Every face must share the same computation path — you
#   cannot produce a stone that is 0.27 m wide AND one that is 0.29 m wide
#   from the same field evaluation unless the width itself is a field varying
#   per element.  More critically, you cannot emit a different NUMBER of
#   polygons per face from a pure field graph.
#
#   The Foreach Geometry Element Zone breaks that constraint entirely.
#   It iterates one face at a time and collects each iteration's output
#   geometry into a joined mesh.  Each stone block is built individually:
#   its depth recess, XY size, and position jitter are read via Sample Index
#   at the current Element Index — producing a physically distinct Mesh Box
#   per face, not a displaced copy of a shared mesh.
#
# Node flow:
#   [Grid GRID_X×GRID_Y] → [Capture face centres] → [Capture per-face rand]
#   → [Foreach Input (FACE domain)]
#       → Sample Index(face centres, elem_idx) → this_centre
#       → Sample Index(face rand,    elem_idx) → this_rand
#       → depth = this_rand × Depth_Max
#       → stone_xy = STONE_W|H − MORTAR_GAP − jitter
#       → [Mesh Box(stone_xy × stone_z)] → [Set Position(this_centre + Z_off)]
#   → [Foreach Output] → joined ashlar mesh → [Set Material] → GLB
#
# Outside sources:
#   Blender Manual — Foreach Geometry Element Zone
#   https://docs.blender.org/manual/en/4.3/modeling/geometry_nodes/geometry/foreach_geometry_element.html
#   Licence: CC BY-SA 4.0 | Author: Blender Foundation
#
#   Blender 4.3 Release Notes — Geometry Nodes new zones
#   https://www.blender.org/download/releases/4-3/
#   Licence: CC BY-SA 4.0 | Author: Blender Foundation
#
# Outputs:
#   output/ashlar_wall.blend
#   output/ashlar_wall.glb   (Draco 6, WebP textures, Y-up, snake_case root)

import bpy
import math
from pathlib import Path

# ── parameters ────────────────────────────────────────────────────────────────
GRID_X        = 8       # stone count, horizontal
GRID_Y        = 6       # stone course count, vertical
STONE_W       = 0.30    # metres per stone slot width
STONE_H       = 0.18    # metres per stone slot height (wide ashlar ratio 5:3)
MORTAR_GAP    = 0.012   # mortar joint — subtracted from each stone face
BASE_THICK    = 0.04    # minimum stone depth (metres) before variance
DEPTH_DEF     = 0.06    # default max additional depth variance
JITTER_DEF    = 0.010   # default max XY size jitter per stone
GN_NAME       = "HS_AshlarChisel"
MAT_NAME      = "ashlar_stone"
OBJ_NAME      = "ashlar_wall"
OUT_DIR       = "//output"
OUT_BLEND     = "//output/ashlar_wall.blend"
OUT_GLB       = "//output/ashlar_wall.glb"


def reset_scene() -> None:
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.context.scene.name = "ashlar_wall"


def make_material() -> bpy.types.Material:
    mat = bpy.data.materials.new(MAT_NAME)
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()
    bsdf = nt.nodes.new("ShaderNodeBsdfPrincipled")
    bsdf.inputs["Base Color"].default_value = (0.55, 0.50, 0.44, 1.0)
    bsdf.inputs["Roughness"].default_value  = 0.85
    bsdf.inputs["Metallic"].default_value   = 0.0
    bsdf.location = (0, 0)
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    out.location = (250, 0)
    nt.links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])
    return mat


def build_gn_tree() -> bpy.types.NodeGroup:
    """
    Build the Foreach-Zone ashlar chisel node group.

    Critical insight: CaptureAttribute evaluates Position at FACE domain
    and stores the result as a named attribute BEFORE the zone begins.
    Inside the zone, SampleIndex reads that frozen snapshot at the current
    Element Index.  This is the only reliable pattern for interrogating a
    specific element's field value inside a Foreach zone — you cannot 'filter'
    geometry inside the zone with a boolean mask because only one element
    is active per iteration; you need the pre-captured scalar snapshot.
    """
    ng    = bpy.data.node_groups.new(GN_NAME, "GeometryNodeTree")
    ng.is_modifier = True
    nodes = ng.nodes
    links = ng.links
    iface = ng.interface

    # Group sockets
    iface.new_socket("Geometry",    in_out="OUTPUT", socket_type="NodeSocketGeometry")
    iface.new_socket("Geometry",    in_out="INPUT",  socket_type="NodeSocketGeometry")
    d = iface.new_socket("Depth Max",   in_out="INPUT", socket_type="NodeSocketFloat")
    d.default_value, d.min_value, d.max_value = DEPTH_DEF, 0.0, 0.3
    j = iface.new_socket("Size Jitter", in_out="INPUT", socket_type="NodeSocketFloat")
    j.default_value, j.min_value, j.max_value = JITTER_DEF, 0.0, 0.05
    s = iface.new_socket("Seed",        in_out="INPUT", socket_type="NodeSocketInt")
    s.default_value = 0

    gin  = nodes.new("NodeGroupInput");  gin.location  = (-1400, 0)
    gout = nodes.new("NodeGroupOutput"); gout.location = (1300, 0)

    # ── Grid: GRID_X×GRID_Y quads, one per stone slot ─────────────────────────
    grid = nodes.new("GeometryNodeMeshGrid")
    grid.location = (-1200, 80)
    grid.inputs["Vertices X"].default_value = GRID_X + 1
    grid.inputs["Vertices Y"].default_value = GRID_Y + 1
    grid.inputs["Size X"].default_value     = GRID_X * STONE_W
    grid.inputs["Size Y"].default_value     = GRID_Y * STONE_H

    # ── Capture face centres ───────────────────────────────────────────────────
    # Position evaluated at FACE domain = centroid of each quad.
    # Freezing now lets Sample Index read it inside the zone without triggering
    # a cross-domain field evaluation against the Foreach geometry.
    inp_pos = nodes.new("GeometryNodeInputPosition"); inp_pos.location = (-1200, -120)
    cap_ctr = nodes.new("GeometryNodeCaptureAttribute")
    cap_ctr.location  = (-1000, 80)
    cap_ctr.domain    = "FACE"
    cap_ctr.data_type = "FLOAT_VECTOR"
    links.new(grid.outputs["Mesh"],        cap_ctr.inputs["Geometry"])
    links.new(inp_pos.outputs["Position"], cap_ctr.inputs["Value"])

    # ── Capture per-face random float [0,1] ───────────────────────────────────
    # FunctionNodeRandomValue uses the implicit element index as its ID when
    # domain is FACE, giving a unique value per face.  Seed from group input
    # so the user can regenerate stone patterns without touching the tree.
    cap_rnd = nodes.new("GeometryNodeCaptureAttribute")
    cap_rnd.location  = (-780, 80)
    cap_rnd.domain    = "FACE"
    cap_rnd.data_type = "FLOAT"

    rnd = nodes.new("FunctionNodeRandomValue")
    rnd.location               = (-980, -220)
    rnd.data_type              = "FLOAT"
    rnd.inputs["Min"].default_value = 0.0
    rnd.inputs["Max"].default_value = 1.0
    links.new(gin.outputs["Seed"],    rnd.inputs["Seed"])
    links.new(rnd.outputs["Value"],   cap_rnd.inputs["Value"])
    links.new(cap_ctr.outputs["Geometry"], cap_rnd.inputs["Geometry"])

    # ── Foreach Geometry Element Zone — FACE domain ───────────────────────────
    fe_in  = nodes.new("GeometryNodeForeachGeometryElementInput")
    fe_in.domain   = "FACE"
    fe_in.location = (-540, 80)

    fe_out = nodes.new("GeometryNodeForeachGeometryElementOutput")
    fe_out.location = (1060, 80)

    links.new(cap_rnd.outputs["Geometry"], fe_in.inputs["Geometry"])

    elem_idx = fe_in.outputs["Element Index"]  # INT: current face counter
    zone_geo = fe_in.outputs["Geometry"]       # GEOMETRY: full mesh in zone

    # ── Sample this face's centre position ────────────────────────────────────
    samp_ctr = nodes.new("GeometryNodeSampleIndex")
    samp_ctr.location  = (-300, 220)
    samp_ctr.domain    = "FACE"
    samp_ctr.data_type = "FLOAT_VECTOR"
    links.new(zone_geo, samp_ctr.inputs["Geometry"])
    links.new(cap_ctr.outputs["Attribute"], samp_ctr.inputs["Value"])
    links.new(elem_idx,                     samp_ctr.inputs["Index"])

    # ── Sample this face's random float ───────────────────────────────────────
    samp_rnd = nodes.new("GeometryNodeSampleIndex")
    samp_rnd.location  = (-300, 20)
    samp_rnd.domain    = "FACE"
    samp_rnd.data_type = "FLOAT"
    links.new(zone_geo, samp_rnd.inputs["Geometry"])
    links.new(cap_rnd.outputs["Attribute"], samp_rnd.inputs["Value"])
    links.new(elem_idx,                     samp_rnd.inputs["Index"])

    rnd_f = samp_rnd.outputs["Value"]  # FLOAT [0,1] unique per face
    ctr_v = samp_ctr.outputs["Value"]  # VECTOR face centroid

    # ── depth = rand × Depth_Max ──────────────────────────────────────────────
    m_depth = nodes.new("ShaderNodeMath"); m_depth.operation = "MULTIPLY"
    m_depth.location = (-80, 20)
    links.new(rnd_f,                    m_depth.inputs[0])
    links.new(gin.outputs["Depth Max"], m_depth.inputs[1])

    # ── jitter = rand × Size_Jitter ───────────────────────────────────────────
    m_jit = nodes.new("ShaderNodeMath"); m_jit.operation = "MULTIPLY"
    m_jit.location = (-80, -100)
    links.new(rnd_f,                      m_jit.inputs[0])
    links.new(gin.outputs["Size Jitter"], m_jit.inputs[1])

    # stone_x = STONE_W − MORTAR_GAP − jitter
    sub_x = nodes.new("ShaderNodeMath"); sub_x.operation = "SUBTRACT"
    sub_x.location = (120, -20)
    sub_x.inputs[0].default_value = STONE_W - MORTAR_GAP
    links.new(m_jit.outputs["Value"], sub_x.inputs[1])

    # stone_y = STONE_H − MORTAR_GAP − jitter × 0.5
    m_half = nodes.new("ShaderNodeMath"); m_half.operation = "MULTIPLY"
    m_half.location = (80, -160)
    links.new(m_jit.outputs["Value"], m_half.inputs[0])
    m_half.inputs[1].default_value = 0.5

    sub_y = nodes.new("ShaderNodeMath"); sub_y.operation = "SUBTRACT"
    sub_y.location = (120, -180)
    sub_y.inputs[0].default_value = STONE_H - MORTAR_GAP
    links.new(m_half.outputs["Value"], sub_y.inputs[1])

    # stone_z = BASE_THICK + depth
    add_z = nodes.new("ShaderNodeMath"); add_z.operation = "ADD"
    add_z.location = (120, -300)
    add_z.inputs[0].default_value = BASE_THICK
    links.new(m_depth.outputs["Value"], add_z.inputs[1])

    # Assemble size vector and create Mesh Box
    cxyz_sz = nodes.new("ShaderNodeCombineXYZ"); cxyz_sz.location = (330, -140)
    links.new(sub_x.outputs["Value"], cxyz_sz.inputs["X"])
    links.new(sub_y.outputs["Value"], cxyz_sz.inputs["Y"])
    links.new(add_z.outputs["Value"], cxyz_sz.inputs["Z"])

    box = nodes.new("GeometryNodeMeshCube"); box.location = (540, -80)
    links.new(cxyz_sz.outputs["Vector"], box.inputs["Size"])

    # ── Position stone: centre XY from face, Z = depth/2 (back-flush) ─────────
    m_zoff = nodes.new("ShaderNodeMath"); m_zoff.operation = "MULTIPLY"
    m_zoff.location = (330, -320)
    links.new(m_depth.outputs["Value"], m_zoff.inputs[0])
    m_zoff.inputs[1].default_value = 0.5  # cube centre sits at half its depth

    sep = nodes.new("ShaderNodeSeparateXYZ"); sep.location = (540, 220)
    links.new(ctr_v, sep.inputs["Vector"])

    cxyz_pos = nodes.new("ShaderNodeCombineXYZ"); cxyz_pos.location = (740, 220)
    links.new(sep.outputs["X"],         cxyz_pos.inputs["X"])
    links.new(sep.outputs["Y"],         cxyz_pos.inputs["Y"])
    links.new(m_zoff.outputs["Value"],  cxyz_pos.inputs["Z"])

    set_pos = nodes.new("GeometryNodeSetPosition"); set_pos.location = (760, -80)
    links.new(box.outputs["Mesh"],       set_pos.inputs["Geometry"])
    links.new(cxyz_pos.outputs["Vector"], set_pos.inputs["Position"])

    links.new(set_pos.outputs["Geometry"], fe_out.inputs["Geometry"])

    # ── Material and output ────────────────────────────────────────────────────
    set_mat = nodes.new("GeometryNodeSetMaterial"); set_mat.location = (1100, 80)
    links.new(fe_out.outputs["Geometry"], set_mat.inputs["Geometry"])
    # Material value set in build_scene() after the node group is wired up.

    links.new(set_mat.outputs["Geometry"], gout.inputs["Geometry"])
    return ng


def build_scene() -> None:
    reset_scene()
    mat = make_material()
    ng  = build_gn_tree()

    bpy.ops.mesh.primitive_plane_add()
    obj = bpy.context.active_object
    obj.name = OBJ_NAME

    mod = obj.modifiers.new(GN_NAME, "NODES")
    mod.node_group = ng

    # Assign material into the Set Material node inside the group
    ng.nodes["Set Material"].inputs["Material"].default_value = mat

    # Rotate 90° around X so the wall stands vertical (+Y forward, +Z up)
    obj.rotation_euler[0] = math.radians(-90)
    bpy.ops.object.transform_apply(rotation=True)


def export_files() -> None:
    Path(bpy.path.abspath(OUT_DIR)).mkdir(parents=True, exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=bpy.path.abspath(OUT_BLEND))
    bpy.ops.export_scene.gltf(
        filepath             = bpy.path.abspath(OUT_GLB),
        export_format        = "GLB",
        export_apply         = True,
        export_yup           = True,
        export_draco_mesh_compression_enable = True,
        export_draco_mesh_compression_level  = 6,
        export_image_format  = "WEBP",
        export_materials     = "EXPORT",
    )
    print(f"[HS] Exported {OUT_GLB}")


if __name__ == "__main__":
    build_scene()
    export_files()
    print("[HS] ashlar_wall build complete.")
