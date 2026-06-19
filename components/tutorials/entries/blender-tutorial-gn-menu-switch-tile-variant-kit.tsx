import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function MenuSwitchTileKitBody() {
  return (
    <>
      <p>
        The <strong>Menu Switch</strong> node (
        <a
          href="https://wiki.blender.org/wiki/Reference/Release_Notes/4.1/Nodes_and_Physics"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          introduced in Blender 4.1
        </a>
        , CC-BY-SA 4.0, Blender Wiki contributors) is the labelled-dropdown
        counterpart to the Index Switch node. Where Index Switch takes an
        integer scrubber — forcing the artist to remember that 0 = Flat, 2 =
        Diamond — Menu Switch exposes a <code>NodeSocketMenu</code> input that
        Blender renders as a named dropdown in the Properties panel. One click,
        one readable label. The practical difference matters most in shared
        files and packaged assets: a non-technical collaborator can pick a tile
        style without opening the node tree. Compare this with the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-socket-groups-parametric-crystal-ui"
          className={lk}
        >
          Socket Groups tutorial
        </Link>
        , which handles the orthogonal problem of organising many float/int
        sockets into collapsible panels — both techniques belong in any
        production-quality GN modifier.
      </p>

      <p>
        The wiring is three steps. First, add enum items to the node — each
        call to <code>enum_definition.enum_items.new(name)</code> appends one
        labelled input socket:
      </p>
      <pre className="bg-zinc-900 rounded p-4 text-sm overflow-x-auto whitespace-pre">{`ms = nodes.new('GeometryNodeMenuSwitch')
ms.data_type = 'GEOMETRY'          # all inputs and the output carry geometry
for name in ["Flat", "Raised", "Diamond", "Grate"]:
    ms.enum_definition.enum_items.new(name)
# Node now has inputs: [0]="Menu", [1]="Flat", [2]="Raised", [3]="Diamond", [4]="Grate"

# Second: expose a NodeSocketMenu on the group interface
iface.new_socket("Tile Variant", in_out='INPUT', socket_type='NodeSocketMenu')

# Third: link
links.new(gi.outputs['Tile Variant'], ms.inputs['Menu'])
links.new(flat_geo,    ms.inputs['Flat'])
links.new(raised_geo,  ms.inputs['Raised'])
links.new(diamond_geo, ms.inputs['Diamond'])
links.new(grate_geo,   ms.inputs['Grate'])`}</pre>

      <p>
        The <code>NodeSocketMenu</code> interface socket stores an integer
        index; the dropdown labels come from the{" "}
        <code>enum_definition</code> on the connected Menu Switch node. This is
        why the socket alone looks unlabelled in the N-panel until the node
        tree is wired — the socket is a selector, the node is the dictionary.
        The <code>data_type</code> property can be{" "}
        <code>GEOMETRY</code>, <code>INT</code>, <code>FLOAT</code>,{" "}
        <code>VECTOR</code>, or any other socket type; the tutorial uses
        GEOMETRY because each variant produces a complete mesh rather than a
        scalar field. The{" "}
        <a
          href="https://docs.blender.org/api/current/bpy.types.NodeEnumDefinition.html"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          NodeEnumDefinition API reference
        </a>{" "}
        (CC-BY-SA 4.0, Blender Documentation Team) covers iteration,
        reordering with <code>move()</code>, and the identifier vs. display
        name distinction.
      </p>

      <p>
        The four variants demonstrate a progression of GN complexity. The{" "}
        <strong>Flat</strong> tile is a plain grid with a single Bevel Mesh on
        all edges — the same node explored in the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-bevel-mesh-edge-angle-chamfer"
          className={lk}
        >
          GN Bevel Mesh Chamfer tutorial
        </Link>
        . <strong>Raised</strong> introduces face selection by index:{" "}
        a <code>FunctionNodeCompare(INT, EQUAL, B=4)</code> node selects face
        index 4 — the centre face of a 3×3 face grid (4×4 vertices) — and{" "}
        <code>ExtrudeMesh(FACES, Offset Z, Individual=False)</code> lifts it
        6 cm as a solid block rather than fanning individual faces outward.{" "}
        <strong>Diamond</strong> rotates the same grid 45° in Z via{" "}
        <code>Transform Geometry</code> — the simplest pattern-change available
        in GN, requiring no extra nodes. <strong>Grate</strong> combines{" "}
        <code>ExtrudeMesh</code> (downward, producing a 4 cm slab),{" "}
        <code>MeshToPoints(VERTICES)</code> on a 3×3 sub-grid to generate nine
        hole centres, <code>InstanceOnPoints</code> with a cylinder prototype,{" "}
        <code>RealizeInstances</code> to collapse them, and{" "}
        <code>MeshBoolean(DIFFERENCE)</code>. The Realize step is mandatory:
        the Boolean node does not accept un-realized instance data in Blender
        5.1 — passing instances directly produces a silent no-op.
      </p>

      <p>
        The variant-per-GLB export loop in <code>blueprint.py</code> shows a
        pattern that pairs naturally with the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-batch-glb-exporter"
          className={lk}
        >
          Python Batch GLB Exporter
        </Link>{" "}
        pipeline: iterate the VARIANT_NAMES list, set{" "}
        <code>mod[var_id]</code> to the integer index, call{" "}
        <code>view_layer.update()</code>, then run{" "}
        <code>export_scene.gltf</code> with Draco level 6 and WebP textures.
        The socket identifier is found by iterating{" "}
        <code>tree.interface.items_tree</code> and matching{" "}
        <code>item.name == &quot;Tile Variant&quot;</code> — the identifier
        string (e.g. <code>&quot;Socket_0&quot;</code>) is
        auto-assigned by Blender and differs from the display name. Four clean
        GLBs result, each the size of a single tile with no modifier overhead.
        The same technique extends naturally to the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-for-each-element-hex-panel"
          className={lk}
        >
          For Each Element
        </Link>{" "}
        pattern: wrap the Menu Switch selection in a For Each zone and you can
        scatter all four variants procedurally within one modifier.
      </p>
    </>
  );
}

const base: Entry = {
  slug: "blender-tutorial-gn-menu-switch-tile-variant-kit",
  title:
    "Geometry Nodes — Menu Switch: Procedural Tile Variant Kit with Four Selectable Floor Styles (Blender 5.1)",
  date: "2026-06-19",
  kind: "tutorial",
  excerpt:
    "Build a 1×1 m modular floor tile with four selectable geometry variants — Flat, Raised, Diamond, Grate — driven by a labelled dropdown in the GN modifier UI. Covers GeometryNodeMenuSwitch, NodeSocketMenu group-input socket, enum_definition.enum_items Python API, FunctionNodeCompare face selection, Boolean DIFFERENCE with Realized instances, and per-variant GLB export.",
  Body: MenuSwitchTileKitBody,
};

export const entry = buildInstructable(
  {
    time: "one session",
    difficulty: "intermediate",
    prerequisites: [
      "Geometry Nodes fluency: group inputs, linking sockets, modifier stack. The GN Socket Groups tutorial covers NodeTreeInterface; the GN Bevel Mesh tutorial covers the bevel node used here.",
      "Python bpy basics: bpy.data.node_groups, nodes.new(), links.new(). The Python Add-on tutorial covers the bpy authoring patterns.",
      "Blender 5.1 installed. No extensions needed — MenuSwitch, BevelMesh, ExtrudeMesh, MeshBoolean are all built-in. Menu Switch requires Blender 4.1 minimum.",
    ],
    software: [
      {
        name: "Blender",
        version: "5.1",
        url: "https://www.blender.org/download/",
        cost: "open-source",
        platforms: ["windows", "macos", "linux"],
        note:
          "GeometryNodeMenuSwitch requires Blender 4.1+. In earlier versions use GeometryNodeIndexSwitch (integer index, no labels). NodeSocketMenu requires 4.1+. FunctionNodeCompare with data_type='INT' requires 3.4+.",
      },
    ],
    steps: [
      {
        title: "Menu Switch vs Index Switch — when to use each",
        body:
          "Both nodes select one value from N inputs. The difference is the selector socket:\n\n  Index Switch  → NodeSocketInt (integer scrubber: 0, 1, 2, 3)\n  Menu Switch   → NodeSocketMenu (labelled dropdown: Flat, Raised, …)\n\nUse Index Switch when the selector is driven by another node (a Math node\noutputting an integer, a Random Value, an Accumulate Field index). Its integer\ninput is a live numeric field — easy to wire.\n\nUse Menu Switch when the selector is the END USER's choice — exposed in the\nmodifier Properties panel for a collaborator or client. The dropdown labels\neliminate ambiguity; 'Grate' is unambiguous where '3' is not.\n\nBoth are available in the Add → Utilities menu in the GN editor.\nBoth support the same data_type options: GEOMETRY, FLOAT, INT, VECTOR, BOOLEAN.\n\nIn Python:\n  ms_menu  = nodes.new('GeometryNodeMenuSwitch')\n  ms_index = nodes.new('GeometryNodeIndexSwitch')\nThe socket type difference appears automatically on the node.",
      },
      {
        title: "Create the node group and NodeSocketMenu interface socket",
        body:
          "  tree  = bpy.data.node_groups.new('TileVariantKit', 'GeometryNodeTree')\n  iface = tree.interface\n\n  # NodeSocketMenu exposes a dropdown in the modifier Properties panel.\n  # The labels come from the Menu Switch node's enum_definition (wired below).\n  # Until wired, the dropdown shows no items — this is expected behaviour.\n  iface.new_socket('Tile Variant', in_out='INPUT',\n                   socket_type='NodeSocketMenu')\n\n  # Supporting sockets\n  sock_sz = iface.new_socket('Tile Size', in_out='INPUT',\n                              socket_type='NodeSocketFloat')\n  sock_sz.default_value = 1.0\n  sock_sz.min_value     = 0.1\n\n  sock_bv = iface.new_socket('Bevel', in_out='INPUT',\n                              socket_type='NodeSocketFloat')\n  sock_bv.default_value = 0.04\n  sock_bv.max_value     = 0.12\n\n  iface.new_socket('Geometry', in_out='OUTPUT',\n                   socket_type='NodeSocketGeometry')\n\nWHY the socket is declared before the Menu Switch node is created:\n  Python executes top-to-bottom; the socket just needs to exist before\n  you call links.new() on it.  The enum items are added to the NODE's\n  enum_definition, not to the socket — so socket creation order is\n  independent of enum population order.",
      },
      {
        title: "Create the Menu Switch node and populate enum items",
        body:
          "  ms = nodes.new('GeometryNodeMenuSwitch')\n  ms.data_type = 'GEOMETRY'\n\n  VARIANT_NAMES = ['Flat', 'Raised', 'Diamond', 'Grate']\n  for name in VARIANT_NAMES:\n      ms.enum_definition.enum_items.new(name)\n\n  # After the loop, ms.inputs layout is:\n  #   ms.inputs[0]  = 'Menu'    — NodeSocketMenu selector\n  #   ms.inputs[1]  = 'Flat'\n  #   ms.inputs[2]  = 'Raised'\n  #   ms.inputs[3]  = 'Diamond'\n  #   ms.inputs[4]  = 'Grate'\n  # Access by name is preferred over index (indices shift if items are removed).\n\n  links.new(gi.outputs['Tile Variant'], ms.inputs['Menu'])\n\n  # Wire variant geometries after building each branch (Steps 4–5 below):\n  # links.new(flat_mesh,    ms.inputs['Flat'])\n  # links.new(raised_mesh,  ms.inputs['Raised'])\n  # links.new(diamond_mesh, ms.inputs['Diamond'])\n  # links.new(grate_mesh,   ms.inputs['Grate'])\n\nTo read / write the selection from Python on a live modifier:\n  var_id = next(\n      s.identifier for s in tree.interface.items_tree\n      if getattr(s, 'name', '') == 'Tile Variant'\n  )\n  mod[var_id] = 2   # selects Diamond",
      },
      {
        title: "Build Flat and Diamond variants",
        body:
          "Flat: plain grid + perimeter bevel.\n\n  g0 = nodes.new('GeometryNodeMeshGrid')\n  g0.inputs['Vertices X'].default_value = 3\n  g0.inputs['Vertices Y'].default_value = 3\n  links.new(sz, g0.inputs['Size X'])\n  links.new(sz, g0.inputs['Size Y'])\n\n  b0 = nodes.new('GeometryNodeBevelMesh')\n  b0.mode = 'EDGES'\n  b0.inputs['Segments'].default_value = 1\n  links.new(g0.outputs['Mesh'], b0.inputs['Mesh'])\n  links.new(bv,                 b0.inputs['Amount'])\n\nDiamond: same grid, 45° rotation around Z.\n\n  g2 = nodes.new('GeometryNodeMeshGrid')   # same params as g0\n  tx2 = nodes.new('GeometryNodeTransform')\n  tx2.inputs['Rotation'].default_value = (0, 0, math.radians(45))\n  links.new(g2.outputs['Mesh'], tx2.inputs['Geometry'])\n  b2 = nodes.new('GeometryNodeBevelMesh')   # same bevel\n  links.new(tx2.outputs['Geometry'], b2.inputs['Mesh'])\n\nWHY rotation works without scale compensation:\n  A 1×1 m square grid rotated 45° has its corners at (±0.707, 0) and\n  (0, ±0.707) — a smaller bounding box, but the VISUAL appearance of\n  on-point diamonds tiling correctly only needs the face diagonals to be\n  consistent, not the outer footprint.  If tiling these in a scatter grid\n  use a step size of TILE_SIZE × sqrt(2) to avoid gaps.",
      },
      {
        title: "Build Raised variant — face selection by index",
        body:
          "A 4×4-vertex grid produces a 3×3 face grid (9 faces, indexed 0–8).\nThe centre face is index 4 in row-major bottom-left order:\n  6 7 8\n  3 4 5   ← index 4\n  0 1 2\n\nFunctionNodeCompare(INT, EQUAL) produces True only at face 4:\n  idx = nodes.new('GeometryNodeInputIndex')   # per-face domain\n  cmp = nodes.new('FunctionNodeCompare')\n  cmp.data_type = 'INT'\n  cmp.operation = 'EQUAL'\n  cmp.inputs[3].default_value = 4             # B socket (integer constant)\n  links.new(idx.outputs['Index'], cmp.inputs[2])  # A socket = current index\n\n  ex1 = nodes.new('GeometryNodeExtrudeMesh')\n  ex1.mode = 'FACES'\n  ex1.inputs['Offset'].default_value       = (0, 0, 1)   # unit Z vector\n  ex1.inputs['Offset Scale'].default_value = 0.06        # 6 cm\n  ex1.inputs['Individual'].default_value   = False       # solid block extrude\n  links.new(g1.outputs['Mesh'],    ex1.inputs['Mesh'])\n  links.new(cmp.outputs['Result'], ex1.inputs['Selection'])\n\nWHY Individual=False:\n  Individual=True fans each selected face outward independently, producing\n  a star-burst of separate raised panels.  Individual=False moves all\n  selected faces as a single solid block — the one behaviour that creates\n  a clean raised square with four straight side walls.  This matches the\n  intent of a sunken/raised floor tile, not a sculptural spike.",
      },
      {
        title: "Build Grate variant — Instance → Realize → Boolean",
        body:
          "  # Base slab: grid extruded downward\n  g3 = nodes.new('GeometryNodeMeshGrid')\n  ex3 = nodes.new('GeometryNodeExtrudeMesh')\n  ex3.mode = 'FACES'\n  ex3.inputs['Offset'].default_value       = (0, 0, -1)\n  ex3.inputs['Offset Scale'].default_value = 0.04\n  links.new(g3.outputs['Mesh'], ex3.inputs['Mesh'])\n\n  # Hole centres: 3×3 vertex grid within 60% of the tile area\n  hg = nodes.new('GeometryNodeMeshGrid')\n  hg.inputs['Vertices X'].default_value = 3\n  hg.inputs['Vertices Y'].default_value = 3\n  hg.inputs['Size X'].default_value     = TILE_SIZE * 0.6\n  hg.inputs['Size Y'].default_value     = TILE_SIZE * 0.6\n\n  m2p = nodes.new('GeometryNodeMeshToPoints')\n  m2p.mode = 'VERTICES'\n  links.new(hg.outputs['Mesh'], m2p.inputs['Mesh'])\n\n  # Cylinder prototype: 3× the slab depth so it punches fully through\n  cyl = nodes.new('GeometryNodeMeshCylinder')\n  cyl.inputs['Vertices'].default_value = 8\n  cyl.inputs['Radius'].default_value   = 0.11\n  cyl.inputs['Depth'].default_value    = 0.04 * 3\n\n  iop = nodes.new('GeometryNodeInstanceOnPoints')\n  links.new(m2p.outputs['Points'],  iop.inputs['Points'])\n  links.new(cyl.outputs['Mesh'],    iop.inputs['Instance'])\n\n  # MANDATORY: MeshBoolean does not accept GeometryInstances — only real mesh\n  rl = nodes.new('GeometryNodeRealizeInstances')\n  links.new(iop.outputs['Instances'], rl.inputs['Geometry'])\n\n  bl = nodes.new('GeometryNodeMeshBoolean')\n  bl.operation = 'DIFFERENCE'\n  links.new(ex3.outputs['Mesh'],    bl.inputs['Mesh 1'])\n  links.new(rl.outputs['Geometry'], bl.inputs['Mesh 2'])",
      },
      {
        title: "Export one GLB per variant",
        body:
          "  var_id = next(\n      s.identifier for s in tree.interface.items_tree\n      if getattr(s, 'name', '') == 'Tile Variant'\n  )\n  NAMES = ['Flat', 'Raised', 'Diamond', 'Grate']\n  for i, name in enumerate(NAMES):\n      mod[var_id] = i\n      bpy.context.view_layer.update()   # force GN evaluation\n      bpy.ops.export_scene.gltf(\n          filepath     = f'/path/to/output/tile_{name.lower()}.glb',\n          export_format= 'GLB',\n          use_selection= True,\n          export_yup   = True,\n          export_apply = True,\n          export_draco_mesh_compression_enable = True,\n          export_draco_mesh_compression_level  = 6,\n          export_image_format = 'WEBP',\n      )\n  mod[var_id] = 0   # reset to Flat\n\nWHY view_layer.update() before each export:\n  GN evaluation is lazy — Blender only rebuilds the GN mesh when the\n  depsgraph is evaluated (render, redraw, or explicit update call).\n  Setting mod[var_id] without updating leaves the previous geometry in\n  the depsgraph; the exported GLB would contain the wrong variant.\n  view_layer.update() forces a synchronous depsgraph re-evaluation.",
      },
    ],
    finalResult:
      "A TileVariantKit GN node group whose modifier Properties panel shows a 'Tile Variant' dropdown with four labelled options. Selecting Flat / Raised / Diamond / Grate swaps the 1×1 m floor tile geometry live. The blueprint.py also exports tile_flat.glb, tile_raised.glb, tile_diamond.glb, tile_grate.glb — each Draco-compressed, Y-up, ready for WebXR. A 160-frame viewport animation in record.py shows the camera orbiting 90° per variant.",
    variations: [
      "Add a fifth variant 'Hexagonal' using a Mesh Circle (Fill Type=TRIFAN, Vertices=6) + Extrude to create a hex paving stone. Add a 5th enum item; wire the hex geometry to ms.inputs['Hexagonal']. The dropdown automatically expands to show the new option.",
      "Drive Tile Variant from a NamedAttribute ('tile_type') stored per-instance in a scatter GN tree. The scatter tree writes integer 0–3 to 'tile_type' on each instance point; the tile group reads it via Attribute socket. Combine with a For Each zone to realize each variant type separately — this produces mixed-variant floors from one modifier.",
      "Use Menu Switch with data_type='MATERIAL' to swap materials (not just geometry) based on a dropdown. This requires creating multiple Material sockets and wiring them through a Material Menu Switch — identical pattern, different data_type. Pair with the Socket Groups pattern to nest both a geometry variant panel and a material variant panel in one modifier.",
    ],
    troubleshooting: [
      {
        symptom: "'GeometryNodeMenuSwitch' has no attribute 'enum_definition'",
        cause:
          "Running on Blender 4.0 or earlier where Menu Switch did not exist.",
        fix:
          "Upgrade to Blender 4.1 or later. As a compatibility fallback, replace Menu Switch with GeometryNodeIndexSwitch (which requires an integer selector, not a menu socket). The node graph structure is identical; swap NodeSocketMenu for NodeSocketInt on the group interface.",
      },
      {
        symptom:
          "The 'Tile Variant' dropdown in the modifier shows no items / appears as a number field",
        cause:
          "The NodeSocketMenu interface socket is not connected to a Menu Switch node's 'Menu' input in the active modifier's node tree. Until the connection is live, Blender cannot read the enum_definition from the downstream node.",
        fix:
          "Verify the link exists: in the GN editor, confirm a noodle runs from the Group Input 'Tile Variant' socket to the Menu Switch 'Menu' input. If the link is missing, reconnect it. If the modifier uses a different tree instance (e.g. after duplicating the object), confirm mod.node_group is the tree containing the Menu Switch.",
      },
      {
        symptom: "Grate Boolean produces no holes (slab looks solid)",
        cause:
          "RealizeInstances was omitted before the Boolean node. MeshBoolean silently ignores un-realized instance data.",
        fix:
          "Insert a RealizeInstances node between InstanceOnPoints and MeshBoolean's Mesh 2 input. Confirm by adding a Join Geometry node to preview the cylinder instances before the boolean — they should appear as 9 cylinders at the hole centres.",
      },
      {
        symptom: "Raised extrude produces star-burst spikes, not a flat raised panel",
        cause: "ExtrudeMesh Individual was set to True instead of False.",
        fix:
          "Set ex1.inputs['Individual'].default_value = False. With Individual=True, each selected face extrudes as its own separate element (good for spike arrays); with False, all selected faces move as one solid unit (the correct behaviour for a raised panel).",
      },
    ],
  },
  base,
);
