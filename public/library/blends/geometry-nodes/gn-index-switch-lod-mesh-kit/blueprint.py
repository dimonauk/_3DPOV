"""
GN Index Switch — Integer-Driven LOD Mesh Kit  (Blender 5.1)
=============================================================
TECHNIQUE
  GeometryNodeIndexSwitch selects one of N geometry inputs by an integer
  index.  Unlike Menu Switch — which renders a labelled dropdown in the
  Properties panel — Index Switch accepts *any* integer: a Custom Property,
  an animation Driver, a Math node output, or a Python export loop variable.
  That makes it the correct node when selection must happen programmatically
  rather than by manual artist click.

  Here we build a three-tier Level-of-Detail (LOD) prop — an ICO sphere at
  three subdivision levels — for WebXR scenes that need a hi/mid/lo set.
  The Python export loop sets the integer socket value before each gltf call,
  producing three separate GLBs from one scene in a single script pass.

WHY THREE SEPARATE TIERS RATHER THAN ONE OBJECT
  Holoflow's WebXR exporter (holoflow_webxr_exporter) tags per-object
  facets via holoflow:facet.  LOD tiers must be distinct scene objects so
  the exporter can assign different facet flags.  The Index Switch keeps
  ONE modifier for artist iteration; a Python post-process bakes each tier.

OUTSIDE SOURCES
  Blender Manual — Index Switch Node
  https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/utilities/misc/index_switch.html
  CC-BY-SA 4.0, Blender Documentation Team

  Blender Developer Blog — Geometry Nodes 2023 Roadmap (Index Switch context)
  https://code.blender.org/2023/02/geometry-nodes-improvements/
  CC-BY-SA 4.0, Blender Foundation

PARAMETERS
"""
LOD_HI_SUBDIVS   = 3    # ~5120 triangles  — close-up, baked lighting
LOD_MID_SUBDIVS  = 1    # ~320 triangles   — mid-range
LOD_LO_SUBDIVS   = 0    # ~80 triangles    — far-field / instanced crowds
OBJECT_NAME      = "lod_selector"
EXPORT_BASE      = "//"  # relative to saved .blend location

import bpy
import bmesh

# ── Scene helpers ─────────────────────────────────────────────────────────────

def purge_scene() -> None:
    """Remove all objects and orphaned mesh datablocks."""
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()
    for m in list(bpy.data.meshes):
        bpy.data.meshes.remove(m)


def make_icosphere(name: str, subdivs: int) -> bpy.types.Object:
    """Build an ICO sphere via bmesh — avoids bpy.ops context dependency."""
    mesh = bpy.data.meshes.new(name)
    obj  = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    bm = bmesh.new()
    bmesh.ops.create_icosphere(bm, subdivisions=subdivs, radius=1.0)
    bm.to_mesh(mesh)
    bm.free()
    return obj


def hide_from_render(obj: bpy.types.Object) -> None:
    """Source objects are GN references only — never appear in output."""
    obj.hide_viewport = True
    obj.hide_render   = True

# ── Geometry Nodes tree ───────────────────────────────────────────────────────

def build_lod_tree(hi: bpy.types.Object,
                   mid: bpy.types.Object,
                   lo: bpy.types.Object) -> bpy.types.NodeTree:
    """
    Build GN_LOD_IndexSwitch node group.

    Interface:
      Input  → LOD Level (Int 0-2)   — no Geometry input; source via Object Info
      Output → Geometry

    Node layout (left to right):
      Group Input → [Object Info × 3] → Index Switch → Group Output

    WHY Object Info instead of group Geometry input:
      Pulling three distinct meshes from one Geometry input socket would
      require Duplicate Geometry or Realize Instances bookkeeping.
      Object Info.Geometry directly references each LOD source object,
      keeping the node graph flat and legible — one node per tier.
    """
    nt    = bpy.data.node_groups.new("GN_LOD_IndexSwitch", 'GeometryNodeTree')
    nodes = nt.nodes
    links = nt.links

    # Interface ---------------------------------------------------------------
    # No Geometry INPUT — we source via Object Info nodes internally.
    nt.interface.new_socket('Geometry', in_out='OUTPUT',
                            socket_type='NodeSocketGeometry')
    lod_sock = nt.interface.new_socket('LOD Level', in_out='INPUT',
                                        socket_type='NodeSocketInt')
    lod_sock.default_value = 0
    lod_sock.min_value     = 0
    lod_sock.max_value     = 2

    # Group I/O nodes ---------------------------------------------------------
    grp_in  = nodes.new('NodeGroupInput');  grp_in.location  = (-700, 0)
    grp_out = nodes.new('NodeGroupOutput'); grp_out.location = (500, 0)

    # Object Info nodes — one per LOD source ----------------------------------
    def obj_info(obj: bpy.types.Object, x: int, y: int):
        n = nodes.new('GeometryNodeObjectInfo')
        n.location = (x, y)
        # RELATIVE: outputs geometry in the controller object's local space.
        # ORIGINAL would put it at world origin — wrong for modifiers.
        n.transform_space = 'RELATIVE'
        n.inputs['Object'].default_value = obj
        return n

    info_hi  = obj_info(hi,  -350,  280)
    info_mid = obj_info(mid, -350,    0)
    info_lo  = obj_info(lo,  -350, -280)

    # Index Switch node -------------------------------------------------------
    idx = nodes.new('GeometryNodeIndexSwitch')
    idx.location  = (150, 0)
    idx.data_type = 'GEOMETRY'
    # Default state: 2 items (Item_0, Item_1). Add Item_2 for 3-tier LOD.
    # index_switch_items.new() appends one extra input socket each call.
    idx.index_switch_items.new()

    # Socket index map after adding third item:
    #   idx.inputs[0]  = 'Index'  (integer selector)
    #   idx.inputs[1]  = 'Item_0' (hi — selected when Index == 0)
    #   idx.inputs[2]  = 'Item_1' (mid — selected when Index == 1)
    #   idx.inputs[3]  = 'Item_2' (lo  — selected when Index == 2)

    links.new(grp_in.outputs['LOD Level'],    idx.inputs[0])
    links.new(info_hi.outputs['Geometry'],    idx.inputs[1])
    links.new(info_mid.outputs['Geometry'],   idx.inputs[2])
    links.new(info_lo.outputs['Geometry'],    idx.inputs[3])
    links.new(idx.outputs[0],                 grp_out.inputs['Geometry'])

    return nt

# ── GLB export loop ───────────────────────────────────────────────────────────

def export_lod_glbs(ctrl: bpy.types.Object,
                    mod: bpy.types.NodesModifier,
                    nt: bpy.types.NodeTree) -> None:
    """
    Set LOD Level modifier input to 0, 1, 2 in turn and export a GLB for each.

    WHY view_layer.update() before each export:
      GN evaluation is lazy — setting mod[identifier] schedules a dirty mark
      but does NOT immediately rebuild the mesh in the depsgraph.  Without the
      explicit update the exporter reads whichever geometry was cached last.
    """
    # Resolve the socket identifier — more robust than hard-coding 'Input_2'.
    lod_id = next(
        s.identifier for s in nt.interface.items_tree
        if getattr(s, 'name', '') == 'LOD Level'
    )

    tiers = {0: "hi", 1: "mid", 2: "lo"}
    bpy.context.view_layer.objects.active = ctrl
    ctrl.select_set(True)

    for level, label in tiers.items():
        mod[lod_id] = level
        bpy.context.view_layer.update()
        path = bpy.path.abspath(f"{EXPORT_BASE}lod_sphere_{label}.glb")
        bpy.ops.export_scene.gltf(
            filepath    = path,
            export_format='GLB',
            use_selection=True,
            export_apply=True,
            export_yup  =True,
            export_draco_mesh_compression_enable=True,
            export_draco_mesh_compression_level =6,
            export_image_format='WEBP',
        )
        tri_count = len(ctrl.evaluated_get(
            bpy.context.evaluated_depsgraph_get()
        ).data.polygons) * 1  # polygons after triangulation
        print(f"  LOD {level} ({label}): {path}  — ~{tri_count} faces")

    # Reset to hi so the viewport shows full-detail after the script exits.
    mod[lod_id] = 0
    bpy.context.view_layer.update()

# ── Entry point ───────────────────────────────────────────────────────────────

def main() -> None:
    purge_scene()

    # Source objects — hidden from render, referenced via Object Info
    hi  = make_icosphere("lod_hi_src",  LOD_HI_SUBDIVS)
    mid = make_icosphere("lod_mid_src", LOD_MID_SUBDIVS)
    lo  = make_icosphere("lod_lo_src",  LOD_LO_SUBDIVS)
    for src in (hi, mid, lo):
        hide_from_render(src)

    # Controller object — the only visible mesh; receives the GN modifier
    ctrl      = make_icosphere(OBJECT_NAME, subdivs=0)
    ctrl.hide_viewport = False
    ctrl.hide_render   = False

    nt  = build_lod_tree(hi, mid, lo)
    mod = ctrl.modifiers.new("GN_LOD_Selector", 'NODES')
    mod.node_group = nt

    bpy.context.view_layer.update()

    print("=== GN Index Switch — LOD Mesh Kit ===")
    export_lod_glbs(ctrl, mod, nt)
    print("Done.")

main()
