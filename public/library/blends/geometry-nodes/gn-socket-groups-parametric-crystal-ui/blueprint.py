"""
GN Socket Groups — Parametric Faceted Crystal | Blender 5.1 | CC0
NodeTreeInterface.new_panel() + new_socket(parent=) organises GN inputs into
collapsible sections. tree.inputs is read-only in 5.x; interface is the only
mutation path. Crystal: Cylinder + 2 Cones → JoinGeometry → MergeByDistance
→ BevelMesh.
"""

import bpy
import math

# ── PARAMETERS ────────────────────────────────────────────────────────────────
SLUG          = "faceted_crystal"
COL_NAME      = "Crystal Panel Demo"

SIDE_COUNT    = 6
BODY_HEIGHT   = 1.6    # m — prism shaft height
TIP_LENGTH    = 0.55   # m — extrusion length for each tip
BEVEL_AMOUNT  = 0.04   # m — bevel width on all edges
BEVEL_SEGS    = 2      # bevel loop-cut count
ROUGHNESS     = 0.04
BASE_COLOR    = (0.42, 0.70, 0.88, 1.0)   # ice blue
EMISSION_STR  = 0.0

# ── SCENE SETUP ───────────────────────────────────────────────────────────────

def clear_scene():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    for pool in (bpy.data.meshes, bpy.data.materials,
                 bpy.data.node_groups, bpy.data.collections):
        for item in list(pool):
            if item.users == 0:
                pool.remove(item)


def make_collection(name: str) -> bpy.types.Collection:
    col = bpy.data.collections.new(name)
    bpy.context.scene.collection.children.link(col)
    return col


# ── GEOMETRY NODES TREE ───────────────────────────────────────────────────────

def build_gn_tree() -> bpy.types.NodeTree:
    """
    Build a Geometry Nodes group that exposes three collapsible input panels.

    WHY PANELS MATTER:
      A bare GN modifier with 8+ sockets mixes shape and material controls
      in one undifferentiated list.  Panels express hierarchy: "Shape" open,
      "Style" collapsed.  Scatter5 / KitBash3D GN assets always panel their
      interfaces.  Zero render-time cost.

    PANEL API (Blender 4.3+ / 5.x):
      tree.interface            → NodeTreeInterface instance
      .new_panel(name, ...)     → NodeTreeInterfacePanel
      .new_socket(..., parent=) → NodeTreeInterfaceSocket inside that panel
      Sockets without parent=   → root level (always visible, no panel)
    """
    tree  = bpy.data.node_groups.new("CrystalPanelDemo", 'GeometryNodeTree')
    iface = tree.interface          # NodeTreeInterface

    # ── 1. Declare panels (order = visual order in Properties sidebar) ────────
    p_shape = iface.new_panel("Shape",  default_closed=False)
    p_style = iface.new_panel("Style",  default_closed=True)

    # ── 2. Add sockets to panels via parent= ──────────────────────────────────
    # Shape panel
    s_sides          = iface.new_socket("Side Count",   socket_type='NodeSocketInt',   in_out='INPUT', parent=p_shape)
    s_sides.default_value = SIDE_COUNT
    s_sides.min_value     = 3
    s_sides.max_value     = 32

    s_body           = iface.new_socket("Body Height",  socket_type='NodeSocketFloat', in_out='INPUT', parent=p_shape)
    s_body.default_value  = BODY_HEIGHT
    s_body.min_value      = 0.1

    s_tip            = iface.new_socket("Tip Length",   socket_type='NodeSocketFloat', in_out='INPUT', parent=p_shape)
    s_tip.default_value   = TIP_LENGTH
    s_tip.min_value       = 0.01
    s_tip.max_value       = 2.0

    s_bevel          = iface.new_socket("Bevel Amount", socket_type='NodeSocketFloat', in_out='INPUT', parent=p_shape)
    s_bevel.default_value = BEVEL_AMOUNT
    s_bevel.min_value     = 0.0
    s_bevel.max_value     = 0.15

    # Style panel (default_closed keeps the UI tidy on first open)
    s_color          = iface.new_socket("Base Color",   socket_type='NodeSocketColor', in_out='INPUT', parent=p_style)
    s_color.default_value  = BASE_COLOR

    s_rough          = iface.new_socket("Roughness",    socket_type='NodeSocketFloat', in_out='INPUT', parent=p_style)
    s_rough.default_value  = ROUGHNESS
    s_rough.min_value      = 0.0
    s_rough.max_value      = 1.0

    s_emit           = iface.new_socket("Emission",     socket_type='NodeSocketFloat', in_out='INPUT', parent=p_style)
    s_emit.default_value   = EMISSION_STR
    s_emit.min_value       = 0.0
    s_emit.max_value       = 5.0

    # Root-level output (no panel)
    iface.new_socket("Geometry", socket_type='NodeSocketGeometry', in_out='OUTPUT')

    # ── 3. Build node graph ───────────────────────────────────────────────────
    nodes = tree.nodes
    links = tree.links

    def n(tp, x, y, **kw):
        nd = nodes.new(tp)
        nd.location = (x, y)
        for k, v in kw.items():
            setattr(nd, k, v)
        return nd

    gi = n('NodeGroupInput',  -1400,   0)
    go = n('NodeGroupOutput',  1400,   0)

    # ── Cylinder body ─────────────────────────────────────────────────────────
    cyl = n('GeometryNodeMeshCylinder', -1100, 100)
    cyl.fill_type = 'NGON'
    links.new(gi.outputs['Side Count'],  cyl.inputs['Vertices'])
    links.new(gi.outputs['Body Height'], cyl.inputs['Depth'])
    # Radius hard-wired at 1.0 (default) — shape is normalised; scale via object

    # ── Compute tip Z offsets: (BodyHeight/2 + TipLength/2) ──────────────────
    div_bh = n('ShaderNodeMath', -1280, -180); div_bh.operation = 'DIVIDE'
    div_bh.inputs[1].default_value = 2.0
    links.new(gi.outputs['Body Height'], div_bh.inputs[0])

    div_tl = n('ShaderNodeMath', -1280, -300); div_tl.operation = 'DIVIDE'
    div_tl.inputs[1].default_value = 2.0
    links.new(gi.outputs['Tip Length'], div_tl.inputs[0])

    top_z = n('ShaderNodeMath', -1100, -230); top_z.operation = 'ADD'
    links.new(div_bh.outputs[0], top_z.inputs[0])
    links.new(div_tl.outputs[0], top_z.inputs[1])

    neg_z = n('ShaderNodeMath', -1100, -340); neg_z.operation = 'MULTIPLY'
    neg_z.inputs[1].default_value = -1.0
    links.new(top_z.outputs[0], neg_z.inputs[0])

    # ── Top cone (Radius Top = 0 → pointed apex at +Z) ───────────────────────
    cone_top = n('GeometryNodeMeshCone', -900, 280)
    cone_top.fill_type = 'NGON'
    links.new(gi.outputs['Side Count'],  cone_top.inputs['Vertices'])
    links.new(gi.outputs['Tip Length'],  cone_top.inputs['Depth'])
    cone_top.inputs['Radius Top'].default_value    = 0.0
    cone_top.inputs['Radius Bottom'].default_value = 1.0

    txfm_top = n('GeometryNodeTransform', -680, 280)
    links.new(cone_top.outputs['Mesh'], txfm_top.inputs['Geometry'])
    cxyz_top = n('ShaderNodeCombineXYZ', -870, 160)
    cxyz_top.inputs['X'].default_value = 0.0
    cxyz_top.inputs['Y'].default_value = 0.0
    links.new(top_z.outputs[0], cxyz_top.inputs['Z'])
    links.new(cxyz_top.outputs['Vector'], txfm_top.inputs['Translation'])

    # ── Bottom cone (flipped: Radius Bottom = 0 → apex at -Z) ───────────────
    cone_bot = n('GeometryNodeMeshCone', -900, -100)
    cone_bot.fill_type = 'NGON'
    links.new(gi.outputs['Side Count'],  cone_bot.inputs['Vertices'])
    links.new(gi.outputs['Tip Length'],  cone_bot.inputs['Depth'])
    cone_bot.inputs['Radius Top'].default_value    = 1.0
    cone_bot.inputs['Radius Bottom'].default_value = 0.0

    txfm_bot = n('GeometryNodeTransform', -680, -100)
    links.new(cone_bot.outputs['Mesh'], txfm_bot.inputs['Geometry'])
    cxyz_bot = n('ShaderNodeCombineXYZ', -870, -220)
    cxyz_bot.inputs['X'].default_value = 0.0
    cxyz_bot.inputs['Y'].default_value = 0.0
    links.new(neg_z.outputs[0], cxyz_bot.inputs['Z'])
    links.new(cxyz_bot.outputs['Vector'], txfm_bot.inputs['Translation'])

    # ── Join all three mesh primitives ────────────────────────────────────────
    join = n('GeometryNodeJoinGeometry', -450, 100)
    links.new(cyl.outputs['Mesh'],            join.inputs['Geometry'])
    links.new(txfm_top.outputs['Geometry'],   join.inputs['Geometry'])
    links.new(txfm_bot.outputs['Geometry'],   join.inputs['Geometry'])

    # ── Merge by Distance: weld coincident verts at cone/cylinder junctions ──
    # WHY: the three primitives share edge positions but not vertex ownership.
    # Rendering without welding produces T-junction shading artefacts (light
    # leaking through seams on metallic/transmission materials).
    mbd = n('GeometryNodeMergeByDistance', -250, 100)
    links.new(join.outputs['Geometry'], mbd.inputs['Geometry'])
    mbd.inputs['Distance'].default_value = 0.001

    # ── Bevel Mesh: chamfer every edge for the faceted gem look ──────────────
    bevel = n('GeometryNodeBevelMesh', -50, 100)
    bevel.mode = 'EDGES'
    links.new(mbd.outputs['Geometry'],      bevel.inputs['Mesh'])
    links.new(gi.outputs['Bevel Amount'],   bevel.inputs['Amount'])
    bevel.inputs['Segments'].default_value = BEVEL_SEGS

    # ── Shade Smooth (Set Shade Smooth in 5.1) ────────────────────────────────
    shade = n('GeometryNodeSetShadeSmooth', 160, 100)
    shade.domain = 'FACE'
    links.new(bevel.outputs['Mesh'], shade.inputs['Geometry'])
    shade.inputs['Shade Smooth'].default_value = True

    # ── Store colour + roughness as named attributes for material use ─────────
    attr_col = n('GeometryNodeStoreNamedAttribute', 380, 160)
    attr_col.domain     = 'POINT'
    attr_col.data_type  = 'FLOAT_COLOR'
    attr_col.inputs['Name'].default_value = "crystal_color"
    links.new(shade.outputs['Geometry'],  attr_col.inputs['Geometry'])
    links.new(gi.outputs['Base Color'],   attr_col.inputs['Value'])

    attr_rgh = n('GeometryNodeStoreNamedAttribute', 600, 160)
    attr_rgh.domain     = 'POINT'
    attr_rgh.data_type  = 'FLOAT'
    attr_rgh.inputs['Name'].default_value = "crystal_roughness"
    links.new(attr_col.outputs['Geometry'], attr_rgh.inputs['Geometry'])
    links.new(gi.outputs['Roughness'],      attr_rgh.inputs['Value'])

    links.new(attr_rgh.outputs['Geometry'], go.inputs['Geometry'])

    return tree


# ── MATERIAL ──────────────────────────────────────────────────────────────────

def make_crystal_material() -> bpy.types.Material:
    """
    Principled BSDF reading crystal_color + crystal_roughness named attributes
    written by the GN tree.  Transmission gives the glass-like interior.
    """
    mat          = bpy.data.materials.new("crystal_skin")
    mat.use_nodes = True
    nt           = mat.node_tree
    nt.nodes.clear()

    out  = nt.nodes.new('ShaderNodeOutputMaterial')
    bsdf = nt.nodes.new('ShaderNodeBsdfPrincipled')
    out.location  = (400, 0)
    bsdf.location = (0, 0)
    nt.links.new(bsdf.outputs['BSDF'], out.inputs['Surface'])

    # Named attribute lookups
    attr_col = nt.nodes.new('ShaderNodeAttribute')
    attr_col.attribute_name = "crystal_color"
    attr_col.attribute_type = 'GEOMETRY'
    attr_col.location       = (-400, 80)
    nt.links.new(attr_col.outputs['Color'], bsdf.inputs['Base Color'])

    attr_rgh = nt.nodes.new('ShaderNodeAttribute')
    attr_rgh.attribute_name = "crystal_roughness"
    attr_rgh.attribute_type = 'GEOMETRY'
    attr_rgh.location       = (-400, -60)
    nt.links.new(attr_rgh.outputs['Fac'], bsdf.inputs['Roughness'])

    # Glass-like defaults
    bsdf.inputs['Transmission Weight'].default_value = 0.85
    bsdf.inputs['IOR'].default_value                 = 1.45

    return mat


# ── ASSEMBLE SCENE ────────────────────────────────────────────────────────────

def build_scene():
    clear_scene()
    col  = make_collection(COL_NAME)
    tree = build_gn_tree()
    mat  = make_crystal_material()

    # Mesh container — GN writes into it at runtime; starts empty
    mesh = bpy.data.meshes.new(SLUG)
    obj  = bpy.data.objects.new(SLUG, mesh)
    col.objects.link(obj)

    # Attach GN modifier
    mod       = obj.modifiers.new("CrystalPanelDemo", 'NODES')
    mod.node_group = tree

    # Material slot
    obj.data.materials.append(mat)

    # Camera + 3-point light rig
    bpy.ops.object.camera_add(location=(0, -5.0, 1.2))
    cam        = bpy.context.active_object
    cam.rotation_euler = (math.radians(80), 0, 0)
    bpy.context.scene.camera = cam
    col.objects.link(cam)
    bpy.context.scene.collection.objects.unlink(cam)

    bpy.ops.object.light_add(type='AREA', location=(3, -2, 4))
    key         = bpy.context.active_object
    key.data.energy = 800
    col.objects.link(key)
    bpy.context.scene.collection.objects.unlink(key)

    return obj


if __name__ == "__main__":
    obj = build_scene()
    print(f"[crystal-ui] '{obj.name}' ready — Properties > Modifier: 'Shape' panel (open), 'Style' panel (closed)")
