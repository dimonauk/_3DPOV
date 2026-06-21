import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function IndexSwitchLodKitBody() {
  return (
    <>
      <p>
        The{" "}
        <a
          href="https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/utilities/misc/index_switch.html"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          Index Switch node
        </a>{" "}
        (CC-BY-SA 4.0, Blender Documentation Team) selects one geometry input
        from N options by an <em>integer</em> — not a labelled dropdown. That
        single word — integer — is what separates it from Menu Switch: the
        selector can come from a Custom Property, an animation Driver, a Math
        node output, another Geometry Nodes tree, or a Python export loop. No
        artist click required.
      </p>
      <p>
        Here we build a three-tier Level-of-Detail prop — hi, mid and lo ICO
        spheres at subdivision levels 3, 1 and 0. A single modifier integer
        socket chooses the active tier. The Python export loop sets{" "}
        <code>mod[lod_id] = n</code> before each GLB call, producing three
        Draco-compressed WebXR assets in one script pass. Read the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-menu-switch-tile-variant-kit"
          className={lk}
        >
          Menu Switch tile kit
        </Link>{" "}
        for the labelled-dropdown counterpart, the{" "}
        <Link
          href="/tutorials/blender-tutorial-modifier-decimate-lod-webxr-planar-collapse"
          className={lk}
        >
          Decimate LOD tutorial
        </Link>{" "}
        for triangle budgets, and the{" "}
        <Link
          href="/tutorials/blender-tutorial-eevee-light-probes-sphere-reflection-irradiance-webxr"
          className={lk}
        >
          EEVEE Light Probes tutorial
        </Link>{" "}
        for the WebXR scene context these LOD assets slot into.
      </p>
      <p>
        The{" "}
        <a
          href="https://code.blender.org/2023/02/geometry-nodes-improvements/"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          Blender Foundation developer blog
        </a>{" "}
        (CC-BY-SA 4.0) covers the Index Switch design rationale: the node
        deliberately exposes a raw integer so that procedural trees — scatter
        systems, simulation zones, repeat loops — can drive variant selection
        without surfacing a UI widget. A Blender Studio asset kit wires Index
        Switch outputs directly to a{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-socket-groups-parametric-crystal-ui"
          className={lk}
        >
          Socket Groups panel
        </Link>{" "}
        so artists see one collapsible modifier section rather than naked
        integers.
      </p>
      <pre className="bg-zinc-900 rounded p-4 text-sm overflow-x-auto whitespace-pre">{`# Index Switch: add a third item to the default 2-item node
idx = nodes.new('GeometryNodeIndexSwitch')
idx.data_type = 'GEOMETRY'
idx.index_switch_items.new()   # now 3 items: Item_0, Item_1, Item_2

# Socket map after new():
#   idx.inputs[0]  = 'Index'  (integer)
#   idx.inputs[1]  = 'Item_0' (hi  — active when Index == 0)
#   idx.inputs[2]  = 'Item_1' (mid — active when Index == 1)
#   idx.inputs[3]  = 'Item_2' (lo  — active when Index == 2)

links.new(grp_in.outputs['LOD Level'],  idx.inputs[0])
links.new(info_hi.outputs['Geometry'],  idx.inputs[1])
links.new(info_mid.outputs['Geometry'], idx.inputs[2])
links.new(info_lo.outputs['Geometry'],  idx.inputs[3])
links.new(idx.outputs[0],               grp_out.inputs['Geometry'])`}</pre>
    </>
  );
}

const base: Entry = {
  slug: "blender-tutorial-gn-index-switch-lod-mesh-kit",
  title:
    "Geometry Nodes — Index Switch: Integer-Driven LOD Mesh Kit for WebXR (Blender 5.1)",
  date: "2026-06-21",
  kind: "tutorial",
  excerpt:
    "Build a three-tier Level-of-Detail prop — hi / mid / lo ICO spheres — using GeometryNodeIndexSwitch driven by an integer socket. Unlike Menu Switch, the integer selector is fully programmable: set it from a Python export loop, animate it on a Driver, or wire it from another GN node. Exports three Draco-compressed GLBs in a single script pass.",
  Body: IndexSwitchLodKitBody,
};

export const entry = buildInstructable(
  {
    time: "one session",
    difficulty: "intermediate",
    prerequisites: [
      "Geometry Nodes fundamentals: group inputs/outputs, linking sockets, modifier stack. The GN Socket Groups tutorial covers NodeTreeInterface.new_socket(); the Menu Switch tutorial covers the selector-node family.",
      "Python bpy basics: bpy.data.node_groups, nodes.new(), links.new(), export_scene.gltf. Blueprint.py in this entry is self-contained.",
      "Blender 5.1. GeometryNodeIndexSwitch exists from Blender 4.0; index_switch_items.new() API is stable in 5.1.",
    ],
    software: [
      {
        name: "Blender",
        version: "5.1",
        url: "https://www.blender.org/download/",
        cost: "open-source",
        platforms: ["windows", "macos", "linux"],
        note:
          "GeometryNodeIndexSwitch requires Blender 4.0+. index_switch_items.new() was introduced alongside the node. No extensions required.",
      },
    ],
    steps: [
      {
        title: "Index Switch vs Menu Switch — integer vs dropdown",
        body:
          "Both nodes select one geometry (or float/int/vector/bool) from N inputs. The selector socket is the only difference:\n\n  Menu Switch  → NodeSocketMenu  — renders a labelled dropdown in the Properties panel.\n  Index Switch → NodeSocketInt   — accepts any integer: 0, 1, 2, …\n\nUse Menu Switch when a human artist must choose the variant — the label removes ambiguity.\nUse Index Switch when a script, Driver, or another node drives the selection — an integer is cheaper, cleaner, and has no UI overhead.\n\nIn Python:\n  ms = nodes.new('GeometryNodeMenuSwitch')   # dropdown\n  ix = nodes.new('GeometryNodeIndexSwitch')  # integer",
      },
      {
        title: "Create source objects — hidden ICO spheres per tier",
        body:
          "Each LOD tier is an explicit mesh object. Object Info nodes reference them from inside the GN tree — cleaner than processing one input geometry three times through Subdivision Surface nodes.\n\n  hi  = make_icosphere('lod_hi_src',  subdivisions=3)  # ~5 120 tris\n  mid = make_icosphere('lod_mid_src', subdivisions=1)  # ~320 tris\n  lo  = make_icosphere('lod_lo_src',  subdivisions=0)  # ~80 tris\n\n  # Hide — they are data sources, not visible scene objects.\n  for src in (hi, mid, lo):\n      src.hide_viewport = True\n      src.hide_render   = True\n\nWHY hidden objects, not SubdivisionSurface nodes inside GN:\n  Object Info lets Blender cache each mesh independently. SubdivisionSurface\n  inside the tree rebuilds on every depsgraph tick when the switch index\n  changes — even the inactive tiers. Separate objects compute once and stay\n  cached. For a 3-tier ki this matters little; for 8-tier prop libraries it\n  is a measurable win.",
      },
      {
        title: "Build the GN tree interface",
        body:
          "  nt    = bpy.data.node_groups.new('GN_LOD_IndexSwitch', 'GeometryNodeTree')\n  nodes = nt.nodes\n  links = nt.links\n\n  # No Geometry INPUT — Object Info nodes pull data directly from scene objects.\n  # Only output is Geometry; only input socket is the integer selector.\n  nt.interface.new_socket('Geometry',  in_out='OUTPUT',\n                          socket_type='NodeSocketGeometry')\n  lod  = nt.interface.new_socket('LOD Level', in_out='INPUT',\n                                  socket_type='NodeSocketInt')\n  lod.default_value = 0\n  lod.min_value     = 0\n  lod.max_value     = 2\n\n  grp_in  = nodes.new('NodeGroupInput');  grp_in.location  = (-700, 0)\n  grp_out = nodes.new('NodeGroupOutput'); grp_out.location = (500, 0)",
      },
      {
        title: "Create Object Info nodes and add the third Index Switch item",
        body:
          "  def obj_info(obj, x, y):\n      n = nodes.new('GeometryNodeObjectInfo')\n      n.location = (x, y)\n      n.transform_space = 'RELATIVE'   # geometry in controller's local space\n      n.inputs['Object'].default_value = obj\n      return n\n\n  info_hi  = obj_info(hi,  -350,  280)\n  info_mid = obj_info(mid, -350,    0)\n  info_lo  = obj_info(lo,  -350, -280)\n\n  idx = nodes.new('GeometryNodeIndexSwitch')\n  idx.location  = (150, 0)\n  idx.data_type = 'GEOMETRY'\n  # Default node spawns with 2 items. Add Item_2 for the third tier.\n  idx.index_switch_items.new()\n\nWHY transform_space='RELATIVE':\n  'ORIGINAL' positions the imported geometry at world origin — ignoring the\n  controller object's location. 'RELATIVE' maps source geometry into the\n  controller's own local space, so moving the controller moves all tiers.\n  This matches standard modifier behaviour.",
      },
      {
        title: "Wire sockets and apply the modifier",
        body:
          "  links.new(grp_in.outputs['LOD Level'],    idx.inputs[0])  # Index\n  links.new(info_hi.outputs['Geometry'],    idx.inputs[1])  # Item_0\n  links.new(info_mid.outputs['Geometry'],   idx.inputs[2])  # Item_1\n  links.new(info_lo.outputs['Geometry'],    idx.inputs[3])  # Item_2\n  links.new(idx.outputs[0],                 grp_out.inputs['Geometry'])\n\n  # Controller — visible object that carries the modifier\n  ctrl = make_icosphere('lod_selector', subdivisions=0)\n  mod  = ctrl.modifiers.new('GN_LOD_Selector', 'NODES')\n  mod.node_group = nt\n  bpy.context.view_layer.update()\n\nWHY inputs[0] not inputs['Index']:\n  In some Blender builds the integer socket's display name is 'Index' but its\n  internal socket identifier varies. Accessing by position index (0) is more\n  robust than by name. Use named access only when the name is a guaranteed\n  API constant (e.g. 'Object' on GeometryNodeObjectInfo).",
      },
      {
        title: "Python export loop — three GLBs, one scene",
        body:
          "  lod_id = next(\n      s.identifier for s in nt.interface.items_tree\n      if getattr(s, 'name', '') == 'LOD Level'\n  )\n\n  for level, label in {0: 'hi', 1: 'mid', 2: 'lo'}.items():\n      mod[lod_id] = level\n      bpy.context.view_layer.update()   # force depsgraph re-evaluation\n      bpy.ops.export_scene.gltf(\n          filepath     = f'/path/to/lod_sphere_{label}.glb',\n          export_format= 'GLB',\n          use_selection= True,\n          export_apply = True,\n          export_yup   = True,\n          export_draco_mesh_compression_enable = True,\n          export_draco_mesh_compression_level  = 6,\n          export_image_format = 'WEBP',\n      )\n\n  mod[lod_id] = 0   # reset to hi for viewport\n\nWHY resolve the identifier rather than hard-code 'Input_2':\n  Blender auto-assigns identifiers ('Input_1', 'Input_2', …) based on socket\n  creation order within the tree. If the tree is rebuilt or sockets are added\n  before 'LOD Level', the integer shifts. Resolving by name at runtime is\n  immune to reordering.",
      },
    ],
    finalResult:
      "A GN_LOD_IndexSwitch node group applied to 'lod_selector'. The modifier Properties panel shows a 'LOD Level' integer scrubber (0–2). Scrubbing swaps hi (5 120 tri) / mid (320 tri) / lo (80 tri) geometry live. Blueprint.py exports lod_sphere_hi.glb, lod_sphere_mid.glb, lod_sphere_lo.glb — each Draco-compressed, Y-up, ready for WebXR.",
    variations: [
      "Wire LOD Level to a Driver reading the distance between the controller object and an active camera: bpy.context.scene.camera. Add a Custom Property 'lod_distance' on the controller; a Driver expression 'int(distance / 5)' maps 0–5m→0, 5–10m→1, 10+m→2. The switch becomes automatic at render time.",
      "Replace Object Info sources with three Collection Info nodes — one collection per tier. This scales to dozens of props sharing the same LOD logic: add a new object to the hi-detail collection and it automatically appears at LOD 0 without touching the node tree.",
      "Change data_type to 'MATERIAL' on the Index Switch and wire three Material sockets instead of Geometry. This produces a single modifier that swaps between day/night/emissive material sets, driven by a time-of-day integer property — same pattern, orthogonal domain.",
    ],
    troubleshooting: [
      {
        symptom: "All three tiers appear simultaneously, not one at a time",
        cause:
          "The Index integer input is not connected to the Group Input — the node defaults to Index=0 permanently regardless of the modifier panel value.",
        fix:
          "Confirm links.new(grp_in.outputs['LOD Level'], idx.inputs[0]) executed without error. Open the GN editor and check that a noodle runs from the Group Input 'LOD Level' socket to the Index Switch 'Index' socket.",
      },
      {
        symptom:
          "Exported GLBs all contain the same geometry regardless of mod[lod_id] value",
        cause:
          "view_layer.update() was not called between setting the modifier value and the export call. GN evaluation is lazy — the depsgraph does not rebuild until forced.",
        fix:
          "Add bpy.context.view_layer.update() immediately after mod[lod_id] = level and before bpy.ops.export_scene.gltf(). Alternatively, call bpy.context.evaluated_depsgraph_get() which also triggers a synchronous re-evaluation.",
      },
      {
        symptom:
          "Object Info geometry appears at world origin instead of on the controller",
        cause:
          "transform_space was set to 'ORIGINAL' (the default) instead of 'RELATIVE'.",
        fix:
          "Set n.transform_space = 'RELATIVE' on each Object Info node. ORIGINAL is correct only when you deliberately want world-space geometry (e.g. a skybox or a fixed landmark at origin).",
      },
      {
        symptom:
          "index_switch_items.new() raises AttributeError in Blender 3.x",
        cause:
          "GeometryNodeIndexSwitch exists from Blender 4.0. The index_switch_items collection property is specific to 4.0+.",
        fix:
          "Upgrade to Blender 4.0 or later. In 3.x there is no Index Switch — use a Math node clamped to integer plus a series of nested Switch (boolean, not geometry) nodes as a workaround.",
      },
    ],
  },
  base,
);
