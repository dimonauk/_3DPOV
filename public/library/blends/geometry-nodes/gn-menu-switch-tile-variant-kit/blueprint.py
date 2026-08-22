"""
Blender 5.1  —  Geometry Nodes: Menu Switch Tile Variant Kit
Slug : gn-menu-switch-tile-variant-kit
Topic: geometry-nodes
Licence: CC0 — no rights reserved

Technique ─────────────────────────────────────────────────────────────────────
  GeometryNodeMenuSwitch selects between multiple geometry inputs via a
  labelled dropdown.  The node's "Menu" socket connects to a NodeSocketMenu
  group-input socket, which Blender renders as a named dropdown in the GN
  modifier Properties panel — far better UX than the Index Switch + integer
  scrubber equivalent.  Each enum item added to the node creates one input
  socket; the selected item routes that input to the single output.

  Four 1×1 m floor-tile variants built entirely from GN primitives:
    0  Flat    — grid + perimeter Bevel Mesh
    1  Raised  — 4×4-vertex grid, centre face (index 4) extruded 6 cm
    2  Diamond — grid rotated 45°, bevelled
    3  Grate   — grid slab with 3×3 boolean cylinder holes

Outside sources ────────────────────────────────────────────────────────────────
  Blender 4.1 Release Notes — Menu Switch Node
  https://wiki.blender.org/wiki/Reference/Release_Notes/4.1/Nodes_and_Physics
  CC-BY-SA 4.0, Blender Wiki contributors

  Blender Python API — NodeEnumDefinition
  https://docs.blender.org/api/current/bpy.types.NodeEnumDefinition.html
  CC-BY-SA 4.0, Blender Documentation Team
"""

import bpy
import math
import os

# ── Named constants ────────────────────────────────────────────────────────────
TILE_SIZE     = 1.0          # metres, one floor-unit square
SUBDIVISIONS  = 3            # vertex count per axis for Flat / Diamond grids
RAISE_HEIGHT  = 0.06         # metres — raised-panel extrusion height
GRATE_DEPTH   = 0.04         # metres — slab thickness for Grate variant
HOLE_RADIUS   = 0.11         # metres — grate cylinder bore radius
BEVEL_AMT     = 0.04         # metres — perimeter chamfer (Flat + Diamond)
DIAMOND_ROT   = math.radians(45)
VARIANT_NAMES = ["Flat", "Raised", "Diamond", "Grate"]


def build_tile_kit():
    """Build the TileVariantKit GN node group.  Returns the node tree."""
    name = "TileVariantKit"
    if name in bpy.data.node_groups:
        bpy.data.node_groups.remove(bpy.data.node_groups[name])

    tree  = bpy.data.node_groups.new(name, "GeometryNodeTree")
    nodes = tree.nodes
    links = tree.links
    iface = tree.interface

    # ── Group interface sockets ────────────────────────────────────────────────
    # NodeSocketMenu shows as a named dropdown in the modifier stack.
    # The dropdown labels come from enum_definition.enum_items on the Menu
    # Switch node (populated below); this socket merely routes the selection.
    iface.new_socket("Tile Variant", in_out="INPUT",
                     socket_type="NodeSocketMenu")

    sock_sz = iface.new_socket("Tile Size", in_out="INPUT",
                                socket_type="NodeSocketFloat")
    sock_sz.default_value = TILE_SIZE
    sock_sz.min_value     = 0.1
    sock_sz.max_value     = 4.0

    sock_bv = iface.new_socket("Bevel", in_out="INPUT",
                                socket_type="NodeSocketFloat")
    sock_bv.default_value = BEVEL_AMT
    sock_bv.min_value     = 0.0
    sock_bv.max_value     = 0.12

    iface.new_socket("Geometry", in_out="OUTPUT",
                     socket_type="NodeSocketGeometry")

    gi        = nodes.new("NodeGroupInput");  gi.location  = (-1000, 0)
    go        = nodes.new("NodeGroupOutput"); go.location  = (500,   0)
    sz        = gi.outputs["Tile Size"]
    bv        = gi.outputs["Bevel"]

    # ── Variant 0: Flat ────────────────────────────────────────────────────────
    # Reference tile — plain subdivided grid, perimeter chamfer only.
    g0 = nodes.new("GeometryNodeMeshGrid");  g0.location = (-780, 350)
    g0.inputs["Vertices X"].default_value = SUBDIVISIONS
    g0.inputs["Vertices Y"].default_value = SUBDIVISIONS
    links.new(sz, g0.inputs["Size X"])
    links.new(sz, g0.inputs["Size Y"])

    b0 = nodes.new("GeometryNodeBevelMesh"); b0.location = (-560, 350)
    b0.mode = "EDGES"
    b0.inputs["Segments"].default_value = 1
    links.new(g0.outputs["Mesh"], b0.inputs["Mesh"])
    links.new(bv,                 b0.inputs["Amount"])

    # ── Variant 1: Raised ──────────────────────────────────────────────────────
    # 4×4-vertex grid → 3×3 face grid (9 faces).  FunctionNodeCompare selects
    # the centre face (index 4 in row-major ordering) for extrusion upward.
    # WHY index 4: faces are indexed bottom-left → right, row by row:
    #   6 7 8
    #   3 4 5   ← index 4 is the centre of this 3×3 layout
    #   0 1 2
    g1 = nodes.new("GeometryNodeMeshGrid");  g1.location = (-780, 140)
    g1.inputs["Vertices X"].default_value = 4
    g1.inputs["Vertices Y"].default_value = 4
    links.new(sz, g1.inputs["Size X"])
    links.new(sz, g1.inputs["Size Y"])

    idx = nodes.new("GeometryNodeInputIndex"); idx.location = (-780, 10)

    cmp = nodes.new("FunctionNodeCompare");    cmp.location = (-620, 10)
    cmp.data_type = "INT"
    cmp.operation = "EQUAL"
    cmp.inputs[3].default_value = 4           # B = centre face index
    links.new(idx.outputs["Index"], cmp.inputs[2])

    ex1 = nodes.new("GeometryNodeExtrudeMesh"); ex1.location = (-450, 140)
    ex1.mode = "FACES"
    ex1.inputs["Offset"].default_value       = (0, 0, 1)
    ex1.inputs["Offset Scale"].default_value = RAISE_HEIGHT
    ex1.inputs["Individual"].default_value   = False   # solid block, not per-face
    links.new(g1.outputs["Mesh"],    ex1.inputs["Mesh"])
    links.new(cmp.outputs["Result"], ex1.inputs["Selection"])

    b1 = nodes.new("GeometryNodeBevelMesh"); b1.location = (-240, 140)
    b1.mode = "EDGES"
    b1.inputs["Segments"].default_value = 1
    links.new(ex1.outputs["Mesh"], b1.inputs["Mesh"])
    links.new(bv,                  b1.inputs["Amount"])

    # ── Variant 2: Diamond ─────────────────────────────────────────────────────
    # Same grid as Flat, rotated 45°.  The rotation turns rectangular quads
    # into on-point diamond facets.  The tile footprint stays 1×1 m because
    # the 45° diagonal of the grid diagonals equals the original grid width.
    g2 = nodes.new("GeometryNodeMeshGrid");  g2.location = (-780, -80)
    g2.inputs["Vertices X"].default_value = SUBDIVISIONS
    g2.inputs["Vertices Y"].default_value = SUBDIVISIONS
    links.new(sz, g2.inputs["Size X"])
    links.new(sz, g2.inputs["Size Y"])

    tx2 = nodes.new("GeometryNodeTransform"); tx2.location = (-580, -80)
    tx2.inputs["Rotation"].default_value = (0, 0, DIAMOND_ROT)
    links.new(g2.outputs["Mesh"], tx2.inputs["Geometry"])

    b2 = nodes.new("GeometryNodeBevelMesh"); b2.location = (-380, -80)
    b2.mode = "EDGES"
    b2.inputs["Segments"].default_value = 1
    links.new(tx2.outputs["Geometry"], b2.inputs["Mesh"])
    links.new(bv,                      b2.inputs["Amount"])

    # ── Variant 3: Grate ───────────────────────────────────────────────────────
    # Slab extruded downward GRATE_DEPTH.  Nine cylindrical columns instanced
    # on a 3×3 vertex grid are Realized and subtracted via Boolean DIFFERENCE.
    # Instance→Realize→Boolean is the standard GN approach; Boolean does not
    # accept un-realized instances directly.
    g3 = nodes.new("GeometryNodeMeshGrid");  g3.location = (-780, -290)
    g3.inputs["Vertices X"].default_value = 4
    g3.inputs["Vertices Y"].default_value = 4
    links.new(sz, g3.inputs["Size X"])
    links.new(sz, g3.inputs["Size Y"])

    ex3 = nodes.new("GeometryNodeExtrudeMesh"); ex3.location = (-580, -290)
    ex3.mode = "FACES"
    ex3.inputs["Offset"].default_value       = (0, 0, -1)
    ex3.inputs["Offset Scale"].default_value = GRATE_DEPTH
    links.new(g3.outputs["Mesh"], ex3.inputs["Mesh"])

    hg = nodes.new("GeometryNodeMeshGrid");  hg.location = (-780, -470)
    hg.inputs["Vertices X"].default_value = 3     # 3×3 = 9 hole centres
    hg.inputs["Vertices Y"].default_value = 3
    hg.inputs["Size X"].default_value     = TILE_SIZE * 0.6
    hg.inputs["Size Y"].default_value     = TILE_SIZE * 0.6

    m2p = nodes.new("GeometryNodeMeshToPoints"); m2p.location = (-600, -470)
    m2p.mode = "VERTICES"
    links.new(hg.outputs["Mesh"], m2p.inputs["Mesh"])

    cyl = nodes.new("GeometryNodeMeshCylinder"); cyl.location = (-780, -620)
    cyl.inputs["Vertices"].default_value = 8
    cyl.inputs["Radius"].default_value   = HOLE_RADIUS
    cyl.inputs["Depth"].default_value    = GRATE_DEPTH * 3   # punch through

    iop = nodes.new("GeometryNodeInstanceOnPoints"); iop.location = (-400, -530)
    links.new(m2p.outputs["Points"],  iop.inputs["Points"])
    links.new(cyl.outputs["Mesh"],    iop.inputs["Instance"])

    rl = nodes.new("GeometryNodeRealizeInstances"); rl.location = (-200, -530)
    links.new(iop.outputs["Instances"], rl.inputs["Geometry"])

    bl = nodes.new("GeometryNodeMeshBoolean"); bl.location = (0, -390)
    bl.operation = "DIFFERENCE"
    links.new(ex3.outputs["Mesh"],    bl.inputs["Mesh 1"])
    links.new(rl.outputs["Geometry"], bl.inputs["Mesh 2"])

    # ── Menu Switch ────────────────────────────────────────────────────────────
    # enum_definition.enum_items.new(name) appends one labelled input socket.
    # Socket order: inputs[0]="Menu", inputs[1]="Flat", ..., inputs[4]="Grate".
    # The dropdown in the modifier Properties panel shows these labels.
    ms = nodes.new("GeometryNodeMenuSwitch"); ms.location = (260, 0)
    ms.data_type = "GEOMETRY"
    for v in VARIANT_NAMES:
        ms.enum_definition.enum_items.new(v)

    links.new(gi.outputs["Tile Variant"], ms.inputs["Menu"])
    links.new(b0.outputs["Mesh"],         ms.inputs["Flat"])
    links.new(b1.outputs["Mesh"],         ms.inputs["Raised"])
    links.new(b2.outputs["Mesh"],         ms.inputs["Diamond"])
    links.new(bl.outputs["Mesh"],         ms.inputs["Grate"])

    links.new(ms.outputs["Output"], go.inputs["Geometry"])

    return tree


def build_scene():
    """Reset scene, build the GN group, attach it to an object, export GLBs."""
    bpy.ops.wm.read_homefile(use_empty=True)
    tree = build_tile_kit()

    mesh = bpy.data.meshes.new("tile_variant_kit")
    obj  = bpy.data.objects.new("tile_variant_kit", mesh)
    bpy.context.scene.collection.objects.link(obj)
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)

    mod            = obj.modifiers.new("TileVariantKit", "NODES")
    mod.node_group = tree

    # Locate the "Tile Variant" socket identifier for keyframing / setting
    var_id = next(
        s.identifier for s in tree.interface.items_tree
        if getattr(s, "name", "") == "Tile Variant"
    )

    out_dir = os.path.join(
        bpy.path.abspath("//"),
        "blends", "geometry-nodes", "gn-menu-switch-tile-variant-kit",
    )
    os.makedirs(out_dir, exist_ok=True)

    for i, v_name in enumerate(VARIANT_NAMES):
        mod[var_id] = i
        bpy.context.view_layer.update()
        bpy.ops.export_scene.gltf(
            filepath=os.path.join(out_dir, f"tile_{v_name.lower()}.glb"),
            export_format="GLB",
            use_selection=True,
            export_yup=True,
            export_apply=True,
            export_draco_mesh_compression_enable=True,
            export_draco_mesh_compression_level=6,
            export_image_format="WEBP",
        )

    mod[var_id] = 0   # reset to Flat for default scene state
    return obj, mod


if __name__ == "__main__":
    obj, mod = build_scene()
    print("tile_variant_kit ready.  mod['Tile Variant'] = 0..3 to switch.")
