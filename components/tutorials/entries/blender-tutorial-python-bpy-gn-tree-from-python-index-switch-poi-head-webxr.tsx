import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        Every Geometry Nodes modifier is a <strong>node group</strong> stored in{" "}
        <code>bpy.data.node_groups</code> — the same data-block you see in the
        Geometry Node Editor. You can build that group entirely in Python:
        create nodes with <code>ng.nodes.new(type=&apos;...&apos;)</code>, wire
        their sockets with <code>ng.links.new()</code>, and attach the group to
        an object with <code>ob.modifiers.new(type=&apos;NODES&apos;)</code>.
        The result is reproducible, diff-able, and pipeline-composable in a way
        that clicking through node menus never is.
      </p>
      <p>
        This tutorial builds a three-variant poi-head modifier from scratch: a
        UV sphere, a drum cylinder, and a spike cone — all inside one node group
        selected by a single integer input called <code>Variant</code>. The
        switching node is <strong>Index Switch</strong> (
        <code>GeometryNodeIndexSwitch</code>), introduced in Blender 4.1. Set
        the modifier property to 0, 1, or 2 and the evaluated geometry swaps
        live, with no duplicate objects and no shape keys. Compare this approach
        with the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-socket-panels-interface-collapsible-modifier-ui"
          className={lk}
        >
          GN Socket Panels tutorial
        </Link>{" "}
        (building the modifier&rsquo;s user-facing UI from Python) and the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-matrix-nodes-fk-chain-articulated-poi-staff"
          className={lk}
        >
          FK chain matrix tutorial
        </Link>{" "}
        (chaining transforms inside a GN group).
      </p>

      <h2>The interface API change (Blender 4.0)</h2>
      <p>
        The most common pitfall when scripting GN trees from old tutorials is
        the interface API. In Blender&nbsp;3.6 and earlier you wrote:
      </p>
      <pre>{`ng.inputs.new('NodeSocketInt',      'Variant')   # removed in 4.0
ng.outputs.new('NodeSocketGeometry','Geometry')  # removed in 4.0`}</pre>
      <p>
        Both attributes are gone in Blender 4.0. The replacement is the unified{" "}
        <code>ng.interface</code> object:
      </p>
      <pre>{`itf = ng.interface
itf.new_socket(name='Variant',  in_out='INPUT',  socket_type='NodeSocketInt')
itf.new_socket(name='Geometry', in_out='OUTPUT', socket_type='NodeSocketGeometry')`}</pre>
      <p>
        The <code>socket_type</code> string is the name of a{" "}
        <code>bpy.types.NodeSocket</code> subclass.{" "}
        <code>NodeSocketInt</code>, <code>NodeSocketGeometry</code>,{" "}
        <code>NodeSocketFloat</code>, <code>NodeSocketVector</code>,{" "}
        <code>NodeSocketBool</code> are the common ones. The order you call{" "}
        <code>new_socket</code> controls the order sockets appear on the Group
        Input / Output nodes.
      </p>

      <h2>Index Switch — data_type before items</h2>
      <p>
        <code>GeometryNodeIndexSwitch</code> can switch any socket type:
        Geometry, Float, Int, Vector, Colour, etc. The type is set via{" "}
        <code>node.data_type</code>. Here is the critical ordering rule:{" "}
        <strong>
          set <code>data_type</code> before adding items or linking sockets.
        </strong>{" "}
        Changing <code>data_type</code> after items exist resets all item
        sockets (they become the new type with default values, severing any
        links you already created).
      </p>
      <pre>{`sw = ng.nodes.new('GeometryNodeIndexSwitch')
sw.data_type = 'GEOMETRY'   # <-- set first

# Default node has 2 items (sockets '0' and '1'). Add a third:
sw.index_switch_items.new()

# Socket layout after the above:
#   inputs[0]  = 'Index'   (Int)
#   inputs[1]  = item 0    (Geometry, named '0')
#   inputs[2]  = item 1    (Geometry, named '1')
#   inputs[3]  = item 2    (Geometry, named '2')
#   outputs[0] = 'Output'  (Geometry)`}</pre>
      <p>
        Use integer indexing into <code>inputs</code> rather than name strings
        for item sockets — the names are just <code>&apos;0&apos;</code>,{" "}
        <code>&apos;1&apos;</code>, <code>&apos;2&apos;</code> which is awkward
        in Python. Integer indices are stable as long as you don&rsquo;t remove
        items.
      </p>

      <h2>Linking sockets</h2>
      <p>
        <code>ng.links.new(from_socket, to_socket)</code> is the only link
        creation method. It accepts any <code>bpy.types.NodeSocket</code>{" "}
        object. Index into a node&rsquo;s <code>inputs</code> or{" "}
        <code>outputs</code> by integer position or by socket name:
      </p>
      <pre>{`lk = ng.links.new

# Group Input output[0] is the first user-defined socket (Variant)
lk(gi.outputs[0],          sw.inputs[0])   # Variant  → Index

# GeometryNodeMeshUVSphere: outputs[0] = 'Mesh' (the full mesh geometry)
lk(sphere.outputs['Mesh'], sw.inputs[1])   # sphere   → item 0
lk(drum.outputs['Mesh'],   sw.inputs[2])   # drum     → item 1
lk(spike.outputs['Mesh'],  sw.inputs[3])   # spike    → item 2

lk(sw.outputs[0],          go.inputs[0])   # Output   → Geometry`}</pre>
      <p>
        Linking a socket that is already linked replaces the existing link (same
        behaviour as dragging a noodle in the UI). There is no{" "}
        <code>links.remove()</code> — use the list directly:{" "}
        <code>ng.links.remove(link_obj)</code>.
      </p>

      <h2>Modifier property access</h2>
      <p>
        After attaching the node group, each input socket on the group becomes a
        modifier property. The property key is the socket&rsquo;s auto-generated{" "}
        <em>identifier</em> (e.g.{" "}
        <code>&apos;Socket_2&apos;</code>), not its human name. Identifiers are
        stable within a session but change if you delete and recreate the
        socket. Always look them up at runtime:
      </p>
      <pre>{`mod = ob.modifiers.new(name='PoiHeadGN', type='NODES')
mod.node_group = ng

# Find the identifier for 'Variant'
variant_id = None
for item in ng.interface.items_tree:
    if getattr(item, 'name', None) == 'Variant' and item.item_type == 'SOCKET':
        variant_id = item.identifier   # e.g. 'Socket_2'
        break

if variant_id:
    mod[variant_id] = 0   # select sphere`}</pre>
      <p>
        This same pattern works for setting any GN modifier input from Python —
        Floats, Vectors, Booleans, Object references. For Object inputs the
        value is a <code>bpy.types.Object</code> reference, not a string name.
      </p>

      <h2>Animating the variant</h2>
      <p>
        Integer modifier inputs keyframe with{" "}
        <code>
          mod.keyframe_insert(data_path=&apos;[&quot;{variant_id}&quot;]&apos;,
          frame=f)
        </code>
        . Because <code>Variant</code> is an integer that selects a discrete
        shape, the interpolation should be{" "}
        <strong>CONSTANT</strong>, not BEZIER or LINEAR — otherwise Blender
        tries to interpolate between 0 and 1 and the Index Switch sees fractional
        values (which it clamps, but the intermediate frames flicker):
      </p>
      <pre>{`for kp in action.fcurves[0].keyframe_points:
    kp.interpolation = 'CONSTANT'`}</pre>
      <p>
        See{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bpy-action-nla-fcurve-keyframe-poi-performance-webxr"
          className={lk}
        >
          Python bpy — Action & NLA: Programmatic FCurve & Keyframe Insertion
        </Link>{" "}
        for the full NLA workflow that this variant animation slots into.
      </p>

      <h2>Exporting GLB with a baked variant</h2>
      <p>
        GLB export bakes the modifier stack at the currently evaluated state.
        Set the variant before calling{" "}
        <code>bpy.ops.export_scene.gltf(..., export_apply=True)</code> to
        control which shape lands in the file. To export all three variants as
        separate files, loop over the three values and vary the output path.
        The studio convention is{" "}
        <code>export_yup=True</code>, Draco level&nbsp;6, WebP textures. See the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bpy-bvh-import-vrm-bone-remap-nla-bake-retarget"
          className={lk}
        >
          BVH → VRM retarget tutorial
        </Link>{" "}
        for how the same GLB conventions apply to rigged characters.
      </p>
      <pre>{`for variant_val, suffix in [(0,'sphere'), (1,'drum'), (2,'spike')]:
    mod[variant_id] = variant_val
    bpy.context.view_layer.update()
    bpy.ops.export_scene.gltf(
        filepath=f'//hf_poi_head_{suffix}.glb',
        use_selection=True,
        export_apply=True,
        export_yup=True,
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_image_format='WEBP',
    )`}</pre>

      <h2>Cross-references</h2>
      <p>
        The reusable macro at{" "}
        <code>tools/blender-addon/holoflow_macros/gn_tree_from_python.py</code>{" "}
        wraps <code>build_gn_group()</code> for import in other scripts. For
        building the modifier&rsquo;s collapsible panel UI from Python, see the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-socket-panels-interface-collapsible-modifier-ui"
          className={lk}
        >
          GN Socket Panels tutorial
        </Link>
        . For a complete Holoflow asset-library workflow that marks these GLBs
        for the Browser, see the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-asset-library-mark-catalogue"
          className={lk}
        >
          Python Asset Library tutorial
        </Link>
        .
      </p>
    </>
  );
}

const data = {
  title:
    "Python bpy — Geometry Node Tree from Python: bpy.data.node_groups, Socket Linking & Index Switch for a Multi-Variant Poi Head WebXR GLB (Blender 5.1)",
  lede:
    "Build an entire Geometry Nodes modifier tree from Python using bpy.data.node_groups.new(), the Blender 4.0+ ng.interface.new_socket() API, and the 4.1+ GeometryNodeIndexSwitch node. A single integer Variant input selects among a UV sphere, drum cylinder, and spike cone — all inside one node group, no duplicate objects, no shape keys. Includes modifier property access via ng.interface.items_tree, CONSTANT-interpolation keyframe animation of the variant, and batch GLB export for WebXR.",
  date: "2026-07-26",
  blenderVersion: "5.1",
  libraryPath:
    "public/library/blends/scripting/python-bpy-gn-tree-from-python-index-switch-poi-head-webxr",
  difficulty: "expert" as const,
  time: "one session",
  prerequisites: [
    "Comfortable with Blender Python scripting (bpy.ops, bpy.data, bmesh basics)",
    "Understand what a Geometry Node group is: Group Input, Group Output, data flow",
    "Have used the Geometry Node Editor at least once in the UI",
    "Blender 5.1 (requires 4.1+ for GeometryNodeIndexSwitch, 4.0+ for ng.interface)",
  ],
  steps: [
    {
      title: "Open the Scripting workspace",
      body: "Click the Scripting tab at the top of the Blender window. In the Text Editor panel, click New (or Open) and paste blueprint.py. Confirm the Blender version via bpy.app.version — it must be (5, 1, x) or at least (4, 1, x).",
    },
    {
      title: "Run blueprint.py",
      body: "Click ▶ Run Script. The script creates the HF_PoiHead_v1 node group, adds an HF_PoiHead mesh object, attaches a PoiHeadGN modifier pointing at the group, sets Variant=0 (sphere), and exports hf_poi_head.glb. Watch the Info bar at the top for the [HF] confirmation line.",
    },
    {
      title: "Inspect the node group",
      body: "Split a panel and switch its type to Geometry Node Editor. With HF_PoiHead selected, the HF_PoiHead_v1 group displays. You should see: GroupInput → IndexSwitch ← UVSphere / Cylinder / Cone, IndexSwitch → GroupOutput. Zoom into the Index Switch node to confirm three item input sockets (0, 1, 2).",
    },
    {
      title: "Switch variants live",
      body: "Select HF_PoiHead. In the Properties panel → Modifiers, expand PoiHeadGN. Find the Variant field (labelled from the socket name). Type 1 — the geometry instantly changes to the drum cylinder. Type 2 — it changes to the spike cone. Type 0 to return to the sphere. No geometry is hidden: each value triggers a different evaluation branch inside the Index Switch.",
    },
    {
      title: "Set up the variant animation",
      body: "Open record.py in the Text Editor and click ▶ Run Script. The script inserts CONSTANT-interpolated keyframes at frames 1, 151, and 301 (sphere, drum, spike) and adds a 450-frame camera orbit. Press Space in the 3D Viewport to preview. Press Ctrl+F12 to render the full 15 s animation to viewport.mp4.",
    },
    {
      title: "Export all three variants as separate GLBs",
      body: "Append this loop to blueprint.py or run it in the Console: for v, s in [(0,'sphere'),(1,'drum'),(2,'spike')]: set mod[variant_id]=v, call view_layer.update(), then bpy.ops.export_scene.gltf(..., filepath=f'//hf_poi_head_{s}.glb', export_apply=True, export_yup=True, export_draco_mesh_compression_enable=True, export_draco_mesh_compression_level=6). Three separate baked GLBs appear alongside the blend file.",
    },
    {
      title: "Add the node group to the Asset Library",
      body: "Select the HF_PoiHead_v1 node group in the outliner (header → Node Groups). Right-click → Mark as Asset. Set the catalogue to 'Holoflow/Poi'. Save the file. The modifier is now available via the Asset Browser for drag-drop onto any object in any scene. See the Python Asset Library tutorial for scripting this step.",
    },
  ],
  troubleshooting: [
    {
      symptom: "AttributeError: 'NodeTree' object has no attribute 'inputs'",
      cause:
        "The script was written for Blender 3.6 or earlier. ng.inputs and ng.outputs are removed in Blender 4.0.",
      fix: "Replace ng.inputs.new(...) with ng.interface.new_socket(name=..., in_out='INPUT', socket_type=...). Same for ng.outputs.new — use in_out='OUTPUT'.",
    },
    {
      symptom: "All three Index Switch item sockets show the same geometry type but linking fails",
      cause:
        "data_type was set after items were added (or after a link was attempted). Changing data_type resets all item sockets to the new type but severs existing links.",
      fix: "Set sw.data_type = 'GEOMETRY' immediately after ng.nodes.new('GeometryNodeIndexSwitch') and before any sw.index_switch_items.new() calls or ng.links.new() calls targeting the switch.",
    },
    {
      symptom: "mod[variant_id] raises KeyError or mod[variant_id] has no effect",
      cause:
        "The variant_id string is wrong — it may be stale from a previous run where the socket was deleted and recreated (getting a new identifier like 'Socket_4' instead of 'Socket_2').",
      fix: "Always look up the identifier via ng.interface.items_tree immediately before use: for item in ng.interface.items_tree: if item.name == 'Variant' and item.item_type == 'SOCKET': variant_id = item.identifier. Never hardcode 'Socket_2'.",
    },
    {
      symptom: "GLB export bakes the wrong variant (always exports sphere regardless of mod setting)",
      cause:
        "view_layer.update() was not called after setting mod[variant_id] — the depsgraph has not re-evaluated the modifier.",
      fix: "Always call bpy.context.view_layer.update() after setting any modifier property and before calling export_scene.gltf with export_apply=True.",
    },
    {
      symptom: "Index Switch shows only two item sockets (not three) after index_switch_items.new()",
      cause:
        "The node was created and .new() was called before data_type was set. When data_type was subsequently changed, item sockets were reset — but because the node started with data_type='INT' (default), the new item socket type is INT, not GEOMETRY, so the Mesh links fail silently.",
      fix: "Set data_type before calling new(). If you need to fix an existing node: set data_type, then call index_switch_items.clear() if available, otherwise remove the node and recreate it in the correct order.",
    },
  ],
  externalLinks: [
    {
      label:
        "Blender Python API — bpy.types.NodeTreeInterface — CC BY-SA 4.0 — Blender Foundation — ng.interface.new_socket() reference for Blender 4.0+",
      href: "https://docs.blender.org/api/5.1/bpy.types.NodeTreeInterface.html",
    },
    {
      label:
        "Blender Python API — GeometryNodeIndexSwitch — CC BY-SA 4.0 — Blender Foundation — index_switch_items, data_type reference",
      href: "https://docs.blender.org/api/5.1/bpy.types.GeometryNodeIndexSwitch.html",
    },
    {
      label:
        "njanakiev/blender-scripting — MIT — Nicolas Janakiev — Practical Geometry Nodes via Python examples and related spatial tools",
      href: "https://github.com/njanakiev/blender-scripting",
    },
  ],
  relatedTutorials: [
    {
      label:
        "GN Socket Panels — NodeTreeInterfacePanel: building collapsible modifier UI sections from Python",
      href: "/tutorials/blender-tutorial-gn-socket-panels-interface-collapsible-modifier-ui",
    },
    {
      label:
        "GN Matrix Nodes — FK Chain: compound transform multiplication inside a GN group",
      href: "/tutorials/blender-tutorial-gn-matrix-nodes-fk-chain-articulated-poi-staff",
    },
    {
      label:
        "Python bpy — Action & NLA: programmatic FCurve keyframe insertion — same keyframe API used for CONSTANT variant animation",
      href: "/tutorials/blender-tutorial-python-bpy-action-nla-fcurve-keyframe-poi-performance-webxr",
    },
    {
      label:
        "Python Asset Library: marking GN groups and GLBs for the Blender Asset Browser",
      href: "/tutorials/blender-tutorial-python-asset-library-mark-catalogue",
    },
  ],
};

export const entry: Entry = buildInstructable(
  {
    slug: "blender-tutorial-python-bpy-gn-tree-from-python-index-switch-poi-head-webxr",
    title: data.title,
    lede: data.lede,
    date: data.date,
    tags: ["blender", "scripting", "geometry-nodes", "webxr", "tools"],
    body: Body,
  },
  data,
);
