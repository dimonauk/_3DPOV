import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function SocketGroupsCrystalBody() {
  return (
    <>
      <p>
        Every Geometry Nodes modifier surfaces its inputs as a flat list by
        default. On a node group with eight or more sockets that list becomes
        unwieldy: &quot;Side Count&quot; sits beside &quot;Roughness&quot; with
        no visual hierarchy. <strong>Socket Groups</strong> — or more precisely,{" "}
        <code>NodeTreeInterfacePanel</code> objects — solve this by folding
        related sockets behind named disclosure triangles in the Properties
        sidebar. The API landed in Blender 4.3 via a full redesign of{" "}
        <code>tree.interface</code> (previously <code>tree.inputs</code> /
        <code>tree.outputs</code>, which are read-only in 5.x). In Blender 5.1
        it is the canonical way to author shareable node-group assets. Industry
        packs such as{" "}
        <a
          href="https://www.blendermarket.com/products/scatter-5"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          Scatter 5
        </a>{" "}
        and KitBash3D GN assets all panel their interfaces; leaving sockets flat
        signals a prototype, not a production tool. Compare with the manual{" "}
        <Link
          href="/tutorials/blender-tutorial-python-addon-custom-panel-property-group"
          className={lk}
        >
          Custom Panel + PropertyGroup add-on pattern
        </Link>
        , which achieves the same UI goal via the Python UI class system rather
        than the node-tree interface — a different authoring surface for the
        same organisational intent.
      </p>

      <p>
        The three-line incantation is:
      </p>
      <pre className="bg-zinc-900 rounded p-4 text-sm overflow-x-auto whitespace-pre">{`iface = tree.interface                     # NodeTreeInterface

panel = iface.new_panel("Shape",           # visible header text
                         default_closed=False)

sock  = iface.new_socket(
    "Side Count",
    socket_type = 'NodeSocketInt',
    in_out      = 'INPUT',
    parent      = panel,           # ← assigns socket to panel
)
sock.default_value = 6
sock.min_value     = 3`}</pre>
      <p>
        The <code>parent=</code> keyword is the only difference from an
        unpanelled socket call. Omit it and the socket sits at root level, above
        all panels. The order sockets appear inside a panel is the order{" "}
        <code>new_socket()</code> calls are made with that panel as{" "}
        <code>parent</code>. Panel order in the UI matches the order{" "}
        <code>new_panel()</code> was called — no separate reordering step. You
        cannot nest panels inside panels in Blender 5.1; the hierarchy is
        exactly two levels: root and panel.
      </p>

      <p>
        The default-closed strategy matters for the authoring experience.{" "}
        <code>default_closed=False</code> on the &quot;Shape&quot; panel means
        the modifier opens in a usable state — the artist can immediately adjust
        side count and proportions without a click. &quot;Style&quot; is closed
        because material tweaks are secondary and opening it every session adds
        noise. Think of it as the difference between a tool&apos;s main grip and
        its auxiliary settings dial. The same logic governs the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-bevel-mesh-edge-angle-chamfer"
          className={lk}
        >
          GN Bevel Mesh modifier UI
        </Link>{" "}
        in production rigs: amount and mode are front-facing, profile and
        clamp-overlap are tucked away. One open panel, one or two closed — that
        ratio keeps the modifier stack readable even when five modifiers are
        stacked.
      </p>

      <p>
        The crystal geometry itself is a clean demonstration of{" "}
        <strong>primitive composition</strong>: a Cylinder node for the
        hexagonal prism body, two Mesh Cone nodes (one with{" "}
        <code>Radius&nbsp;Top=0</code> for the top tip, one with{" "}
        <code>Radius&nbsp;Bottom=0</code> for the lower) positioned via{" "}
        <code>Transform Geometry</code> at Z&nbsp;=&nbsp;±(BodyHeight/2 +
        TipLength/2), then joined and welded with{" "}
        <code>Merge By Distance(0.001&nbsp;m)</code>. The weld step is
        non-optional: without it, coincident vertices at the cone/cylinder
        junction cause T-junction shading artefacts that appear as dark seam
        lines on transmission materials. A final{" "}
        <code>Bevel Mesh</code> chamfers every edge, giving the crystal its
        faceted look — the same node used in the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-bevel-mesh-edge-angle-chamfer"
          className={lk}
        >
          Procedural Hard-Surface Chamfer tutorial
        </Link>
        . Because all four shape parameters are wired to sockets (not
        hard-coded), a single modifier instance can produce anything from a
        3-sided tourmaline rod to a 12-sided star sapphire with 2 mm facet
        chamfers — no node tree editing required.
      </p>

      <p>
        The material reads colour and roughness from named attributes written by
        the GN tree via <code>Store Named Attribute</code> nodes. This is the
        correct pattern for driving shader appearance from GN inputs: store
        values into geometry attributes inside the GN tree, then read them back
        in the shader via <code>ShaderNodeAttribute</code>. The alternative —
        wiring GN outputs to material properties via drivers — is fragile and
        breaks on linked objects. The attribute approach also survives GLB export
        if the named attributes are baked to vertex colours or a texture atlas
        before export, which the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-batch-glb-exporter"
          className={lk}
        >
          Python Batch GLB Exporter
        </Link>{" "}
        pipeline handles with a pre-export{" "}
        <code>bpy.ops.object.bake()</code> step.
      </p>

      <p>
        <strong>Outside reference 1 — Blender Python API: NodeTreeInterface</strong>{" "}
        (
        <a
          href="https://docs.blender.org/api/current/bpy.types.NodeTreeInterface.html"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          docs.blender.org
        </a>
        , CC-BY-SA&nbsp;4.0, Blender Documentation Team). Full reference for{" "}
        <code>new_panel()</code>, <code>new_socket()</code>,
        <code>items_tree</code> iteration, and the{" "}
        <code>NodeTreeInterfacePanel</code> /
        <code>NodeTreeInterfaceSocket</code> types. The same documentation team
        maintains the{" "}
        <a
          href="https://docs.blender.org/api/current/bpy.types.NodeTreeInterfaceItem.html"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          NodeTreeInterfaceItem base class
        </a>{" "}
        covering <code>position</code>, <code>move()</code>, and{" "}
        <code>remove()</code> methods for re-ordering sockets after creation.
      </p>

      <p>
        <strong>Outside reference 2 — Blender 4.3 Release Notes: Node Group Interface</strong>{" "}
        (
        <a
          href="https://wiki.blender.org/wiki/Reference/Release_Notes/4.3/Nodes_and_Physics"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          wiki.blender.org
        </a>
        , CC-BY-SA&nbsp;4.0, Blender Wiki contributors). Describes the panel
        feature from the user side: screenshots of the disclosure triangles in
        the modifier stack, the Manage Sockets panel in the Node Editor N-panel,
        and the drag-to-reorder workflow. Useful for the screen-recording
        segment where you demo the UI without explaining the Python API.
        The original interface-redesign design rationale lives in task #111400
        on{" "}
        <a href="https://projects.blender.org/blender/blender" className={lk} target="_blank" rel="noopener noreferrer">projects.blender.org</a>.
      </p>
    </>
  );
}

const base: Entry = {
  slug: "blender-tutorial-gn-socket-groups-parametric-crystal-ui",
  title:
    "Geometry Nodes — Socket Groups: Organising Node Inputs into Collapsible Panels with a Parametric Faceted Crystal (Blender 5.1)",
  date: "2026-06-19",
  kind: "tutorial",
  excerpt:
    "Learn NodeTreeInterface.new_panel() — the Blender 4.3+/5.x API for organising GN modifier inputs into named, collapsible disclosure panels. Build a bi-pyramid crystal (Cylinder + two Mesh Cones, welded and bevelled) whose eight parameters are grouped into a 'Shape' panel (open by default) and a 'Style' panel (collapsed). Includes attribute-driven Principled BSDF material and a tip-growth viewport animation.",
  Body: SocketGroupsCrystalBody,
};

export const entry = buildInstructable(
  {
    time: "one session",
    difficulty: "intermediate",
    prerequisites: [
      "Basic Geometry Nodes fluency: group inputs, linking sockets, modifier stack. The GN Bevel Mesh tutorial covers the bevel node used here.",
      "Python bpy API basics: bpy.data.node_groups, bpy.data.objects, bpy.data.materials. The Python Add-on tutorial covers the bpy patterns.",
      "Blender 5.1 installed. No extra extensions needed — Geometry Nodes, Mesh Cone, and Bevel Mesh nodes are all built-in.",
    ],
    software: [
      {
        name: "Blender",
        version: "5.1",
        url: "https://www.blender.org/download/",
        cost: "open-source",
        platforms: ["windows", "macos", "linux"],
        note:
          "tree.interface.new_panel() requires Blender 4.3+. In earlier versions the socket panel concept does not exist; use the flat tree.inputs approach instead. The Bevel Mesh GN node requires Blender 3.4+. GeometryNodeMeshCone with Radius Top/Bottom requires 3.2+.",
      },
    ],
    steps: [
      {
        title: "Understand NodeTreeInterface and why it replaced tree.inputs",
        body:
          "In Blender 4.2 and earlier:\n  tree.inputs.new('NodeSocketFloat', 'Body Height')  # deprecated\n\nIn Blender 4.3+ / 5.x:\n  iface = tree.interface\n  sock  = iface.new_socket('Body Height',\n              socket_type='NodeSocketFloat', in_out='INPUT')\n\nWHY the change:\n  The old tree.inputs/tree.outputs stored only sockets, with no way to\n  represent panels or hierarchical groupings.  The NodeTreeInterface type\n  stores ITEMS (both panels and sockets), enabling panels to contain sockets\n  as children.  Every socket is now a NodeTreeInterfaceSocket; every panel is\n  a NodeTreeInterfacePanel.  Both inherit NodeTreeInterfaceItem, which exposes\n  .position, .move(), and .remove().\n\nEnumerating the current interface:\n  for item in tree.interface.items_tree:\n      print(item.item_type, item.name)\n  # item_type is 'SOCKET' or 'PANEL'\n\nThis is how record.py finds the 'Tip Length' socket identifier to keyframe it.",
      },
      {
        title: "Create the node group and declare panels before sockets",
        body:
          "  tree  = bpy.data.node_groups.new('CrystalPanelDemo', 'GeometryNodeTree')\n  iface = tree.interface\n\n  # Panels MUST be declared before the sockets you want inside them.\n  # Panel order = visual order in the Properties sidebar.\n  p_shape = iface.new_panel('Shape', default_closed=False)\n  p_style = iface.new_panel('Style', default_closed=True)\n\nThe panel object returned is a NodeTreeInterfacePanel.  You pass it as the\nparent= kwarg when creating sockets.  If you forget to pass parent=, the\nsocket goes to the root level (above all panels) — visible always, not\ncollapsible.  Root-level sockets are appropriate for the single Geometry\noutput: there's only one, it's always needed, a panel would add a click.\n\nChoosing default_closed:\n  False  → panel is open on first use; good for primary controls\n  True   → panel is collapsed; good for secondary or advanced controls\n  The default state is saved per-object, so once an artist opens 'Style'\n  it stays open for that object's modifier stack.",
      },
      {
        title: "Add Shape panel sockets with min/max constraints",
        body:
          "  s_sides = iface.new_socket('Side Count',\n              socket_type='NodeSocketInt', in_out='INPUT', parent=p_shape)\n  s_sides.default_value = 6\n  s_sides.min_value     = 3    # fewer than 3 = degenerate mesh\n  s_sides.max_value     = 32   # beyond 32 the bevel segs become invisible\n\n  s_body  = iface.new_socket('Body Height',\n              socket_type='NodeSocketFloat', in_out='INPUT', parent=p_shape)\n  s_body.default_value = 1.6\n  s_body.min_value     = 0.1\n\n  s_tip   = iface.new_socket('Tip Length',\n              socket_type='NodeSocketFloat', in_out='INPUT', parent=p_shape)\n  s_tip.default_value = 0.55\n  s_tip.min_value     = 0.01\n  s_tip.max_value     = 2.0\n\n  s_bevel = iface.new_socket('Bevel Amount',\n              socket_type='NodeSocketFloat', in_out='INPUT', parent=p_shape)\n  s_bevel.default_value = 0.04\n  s_bevel.max_value     = 0.15  # beyond ~BodyHeight/10 bevel loops overlap\n\nmin_value / max_value clamp the scrubber widget in the UI.  They do NOT\nclamp values driven by other nodes or F-curves — if you animate Tip Length\nbeyond max_value the GN tree will still receive the out-of-range value.\nFor hard clamps inside the tree, add a Math(CLAMP) node after the Group\nInput socket.",
      },
      {
        title: "Add Style panel sockets — colour, roughness, emission",
        body:
          "  s_color = iface.new_socket('Base Color',\n              socket_type='NodeSocketColor', in_out='INPUT', parent=p_style)\n  s_color.default_value = (0.42, 0.70, 0.88, 1.0)   # ice blue\n\n  s_rough = iface.new_socket('Roughness',\n              socket_type='NodeSocketFloat', in_out='INPUT', parent=p_style)\n  s_rough.default_value = 0.04\n  s_rough.min_value     = 0.0\n  s_rough.max_value     = 1.0\n\n  s_emit  = iface.new_socket('Emission',\n              socket_type='NodeSocketFloat', in_out='INPUT', parent=p_style)\n  s_emit.default_value = 0.0\n  s_emit.max_value     = 5.0\n\n  # Root-level output\n  iface.new_socket('Geometry',\n      socket_type='NodeSocketGeometry', in_out='OUTPUT')\n\nWHY store colour in GN rather than in the material directly:\n  Driving bsdf.inputs['Base Color'].default_value from GN is not possible —\n  GN and shaders are separate evaluation domains.  The bridge is named\n  attributes: GN writes 'crystal_color' via StoreNamedAttribute, and the\n  material reads it back via ShaderNodeAttribute.  This means you CAN vary\n  colour per-instance if you later instance the crystal with GN scatter.",
      },
      {
        title: "Build the crystal geometry: Cylinder + two Cone tips",
        body:
          "  cyl = nodes.new('GeometryNodeMeshCylinder')\n  cyl.fill_type = 'NGON'\n  links.new(gi.outputs['Side Count'],  cyl.inputs['Vertices'])\n  links.new(gi.outputs['Body Height'], cyl.inputs['Depth'])\n\n  # Compute tip Z offset: BodyHeight/2 + TipLength/2\n  div_bh = math_node('DIVIDE', 2.0, body_input)\n  div_tl = math_node('DIVIDE', 2.0, tip_input)\n  top_z  = math_node('ADD', div_bh, div_tl)\n  bot_z  = math_node('MULTIPLY', top_z, -1.0)\n\n  # Top cone: RadiusTop=0 (pointed), RadiusBottom=1.0 (matches cylinder)\n  cone_top = nodes.new('GeometryNodeMeshCone')\n  cone_top.fill_type = 'NGON'\n  cone_top.inputs['Radius Top'].default_value    = 0.0\n  cone_top.inputs['Radius Bottom'].default_value = 1.0\n  links.new(gi.outputs['Side Count'], cone_top.inputs['Vertices'])\n  links.new(gi.outputs['Tip Length'], cone_top.inputs['Depth'])\n  # TransformGeometry moves it to (0, 0, top_z)\n\n  # Bottom cone: RadiusBottom=0 (pointed downward), RadiusTop=1.0\n  cone_bot = nodes.new('GeometryNodeMeshCone')\n  cone_bot.inputs['Radius Top'].default_value    = 1.0\n  cone_bot.inputs['Radius Bottom'].default_value = 0.0\n  # TransformGeometry moves it to (0, 0, bot_z)\n\nThe Mesh Cone node centres its geometry at the origin spanning -Depth/2 to\n+Depth/2 in Z.  Moving the top cone by (BodyHeight/2 + TipLength/2) aligns\nits base (at -Depth/2 from its centre) exactly with the cylinder top cap.\nSame symmetry for the bottom cone.",
      },
      {
        title: "Join → Merge by Distance → Bevel Mesh",
        body:
          "  join = nodes.new('GeometryNodeJoinGeometry')\n  links.new(cyl.outputs['Mesh'],          join.inputs['Geometry'])\n  links.new(txfm_top.outputs['Geometry'], join.inputs['Geometry'])\n  links.new(txfm_bot.outputs['Geometry'], join.inputs['Geometry'])\n\n  # Weld coincident vertices at cone/cylinder boundary rings\n  mbd = nodes.new('GeometryNodeMergeByDistance')\n  links.new(join.outputs['Geometry'], mbd.inputs['Geometry'])\n  mbd.inputs['Distance'].default_value = 0.001   # 1 mm tolerance\n\n  bevel = nodes.new('GeometryNodeBevelMesh')\n  bevel.mode = 'EDGES'\n  links.new(mbd.outputs['Geometry'],    bevel.inputs['Mesh'])\n  links.new(gi.outputs['Bevel Amount'], bevel.inputs['Amount'])\n  bevel.inputs['Segments'].default_value = 2\n\nWHY Merge by Distance is mandatory:\n  JoinGeometry stacks meshes into one geometry datablock but does NOT merge\n  shared-position vertices.  The cylinder top-cap ring and cone bottom ring\n  sit at identical XYZ positions but are separate vertices.  Rendering that\n  seam on a smooth-shaded glass material exposes light leaking through the\n  T-junction.  MergeByDistance(0.001) welds them into single vertices that\n  Blender's normal interpolation can work with cleanly.\n\n  Caveat: the distance must be smaller than your smallest feature.  At\n  BevelAmount=0.04 and distance=0.001, no unintended merges occur.\n  If you reduce BevelAmount below 0.001, lower the merge distance first.",
      },
      {
        title: "Apply the modifier and inspect the panels",
        body:
          "  mesh = bpy.data.meshes.new('faceted_crystal')\n  obj  = bpy.data.objects.new('faceted_crystal', mesh)\n  bpy.context.scene.collection.objects.link(obj)\n\n  mod            = obj.modifiers.new('CrystalPanelDemo', 'NODES')\n  mod.node_group = tree\n\nIn Blender:\n  1. Select faceted_crystal → Properties → Modifier (wrench) tab.\n  2. 'Shape' panel is open; scrub Side Count (3→12), Tip Length (0.05→1.2).\n  3. Click 'Style' disclosure triangle to expand; adjust Base Color.\n  4. All parameter changes rebuild the crystal geometry live.\n\nTo inspect the interface from Python:\n  mod = obj.modifiers['CrystalPanelDemo']\n  for item in mod.node_group.interface.items_tree:\n      if item.item_type == 'SOCKET' and item.in_out == 'INPUT':\n          print(item.identifier, '=', mod[item.identifier])\n\nitem.identifier is the key for reading/writing modifier input values:\n  mod['Socket_2'] = 8      # set Side Count to 8\n  mod.keyframe_insert(data_path='[\"Socket_2\"]', frame=1)",
      },
    ],
    finalResult:
      "A node group 'CrystalPanelDemo' with two collapsible input panels (Shape: open; Style: collapsed). A bi-pyramid crystal object driven by the modifier: 6-sided, 1.6 m body, 0.55 m tips, 0.04 m bevel. Ice-blue Principled BSDF with 85 % transmission via named-attribute material bridge. A 120-frame viewport animation in record.py showing the tips growing from stub to full length over frames 1–60 with a 240° camera orbit.",
    variations: [
      "Add a third panel 'Export' with a Boolean socket 'Apply for GLB' — check this flag in the record script and conditionally run bpy.ops.object.modifier_apply() before export. Panel-gated export keeps the blend file clean without separate export objects.",
      "Drive Side Count from a scatter GN tree: parent tree writes 'crystal_sides' via StoreNamedAttribute on instance points; crystal GN group reads it back with NamedAttribute node instead of a fixed Group Input socket — per-instance variety with zero extra modifiers.",
      "Iterate interface.items_tree to auto-generate an HTML parameter form: one <input type='range'> per Float socket grouped by its parent panel name. The panel hierarchy maps directly to HTML fieldset groupings.",
    ],
    troubleshooting: [
      {
        symptom: "AttributeError: 'NodeTree' object has no attribute 'interface'",
        cause:
          "You are running on Blender 4.2 or earlier where tree.interface does not exist yet.",
        fix:
          "Upgrade to Blender 4.3 or later. In the interim, use tree.inputs.new(socket_type, name) — panels are not available but the node group still functions without them. The socket identifier will differ: in 4.2- sockets are accessed via tree.inputs[name], in 4.3+ via tree.interface.items_tree iteration.",
      },
      {
        symptom: "Socket appears at the root level instead of inside its panel",
        cause:
          "new_socket() was called without parent= keyword, or the panel object was not the return value of new_panel() (e.g., it was looked up by name incorrectly after creation).",
        fix:
          "Always capture the return value of new_panel() into a local variable and pass it directly: panel = iface.new_panel('Shape'); sock = iface.new_socket(..., parent=panel). Do not look up panels by name after the fact — the .items_tree lookup by name is case-sensitive and returns None if the panel does not exist yet.",
      },
      {
        symptom: "Dark seam lines appear along the cone/cylinder junctions at render time",
        cause:
          "Merge by Distance was omitted or its distance was too large/small. Coincident vertices are still separate, causing shading normals to disagree at the boundary ring.",
        fix:
          "Ensure the Merge by Distance node is present with distance=0.001. In the node editor, inspect the node count before and after: add a 'Statistic' node (Geometry > Mesh Info) to print vertex count to the Info header — it should drop by 2 × SideCount after the weld. If still wrong, temporarily increase distance to 0.005 to force a merge and visually confirm the seam disappears, then revert to 0.001.",
      },
      {
        symptom: "Keyframing mod[tip_id] fails with KeyError",
        cause: "Socket identifier (e.g. 'Socket_3') is auto-assigned and does not match the socket name.",
        fix:
          "Find it with: [sock.identifier for sock in mod.node_group.interface.items_tree if getattr(sock,'name','')=='Tip Length']. Use that string for mod[identifier] and keyframe_insert data_path.",
      },
    ],
  },
  base,
);
