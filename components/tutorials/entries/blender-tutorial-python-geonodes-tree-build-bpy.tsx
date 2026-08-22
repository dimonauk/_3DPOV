import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        A Geometry Nodes tree is just data — <code>bpy.types.GeometryNodeTree</code> with
        a <code>nodes</code> collection, a <code>links</code> collection, and an{" "}
        <code>interface</code> object that owns the group&apos;s input/output sockets.
        Build one entirely in Python and you get a reproducible, version-controllable
        spec of every connection: no clicking in the editor, no risk of a stray link
        ruining a 200-node rig.  The script in this tutorial assembles a noise-displacement
        group from scratch, assigns it to a UV Sphere as a modifier, and keyframes the
        displacement amplitude — all without touching the Geometry Node Editor UI.
      </p>

      <h2>Why the interface changed in Blender 5.x</h2>
      <p>
        Blender 4.0 replaced the old <code>node_group.inputs</code> /{" "}
        <code>node_group.outputs</code> lists with a unified{" "}
        <code>node_group.interface</code> (<code>NodeTreeInterface</code>).  The
        old lists are gone in 5.x — any script that writes{" "}
        <code>ng.inputs.new(&quot;NodeSocketFloat&quot;, &quot;Scale&quot;)</code> will
        raise <code>AttributeError</code>.  The new call is:
      </p>
      <pre>
        <code>{`ng.interface.new_socket(
    "Scale",
    in_out='INPUT',
    socket_type='NodeSocketFloat'
)`}</code>
      </pre>
      <p>
        <code>in_out</code> must be the string literal <code>&apos;INPUT&apos;</code> or{" "}
        <code>&apos;OUTPUT&apos;</code> — there is no enum import required.  The returned
        socket reference lets you set <code>.default_value</code>,{" "}
        <code>.min_value</code>, and <code>.max_value</code> immediately after
        creation.
      </p>

      <h2>Node type strings in Geometry Nodes context</h2>
      <p>
        <code>nodes.new(bl_idname)</code> takes the node&apos;s Python class name, not the
        label shown in the editor.  Two naming conventions coexist in the same node
        tree:
      </p>
      <ul>
        <li>
          <strong>GeometryNode* prefix</strong> — native GN nodes:{" "}
          <code>GeometryNodeSetPosition</code>, <code>GeometryNodeInputPosition</code>,
          <code>GeometryNodeMeshUVSphere</code>.
        </li>
        <li>
          <strong>ShaderNode* prefix</strong> — math/texture nodes shared with the
          Shader Editor:{" "}
          <code>ShaderNodeTexNoise</code>, <code>ShaderNodeVectorMath</code>,{" "}
          <code>ShaderNodeCombineXYZ</code>.
        </li>
      </ul>
      <p>
        The fastest way to discover a node&apos;s <code>bl_idname</code> is to add it
        in the GN Editor, then hover over the node and read{" "}
        <code>bpy.context.active_node.bl_idname</code> in the Python console.  The{" "}
        <Link
          href="/tutorials/blender-tutorial-python-gpu-viewport-draw-overlay"
          className={lk}
        >
          gpu viewport overlay tutorial
        </Link>{" "}
        uses the same console introspection pattern to discover operator names.
      </p>

      <h2>Wiring links correctly</h2>
      <p>
        <code>links.new(from_socket, to_socket)</code> — the order is
        source then destination, matching the visual data-flow direction
        (left → right).  Pass <code>node.outputs[&quot;Name&quot;]</code> for source and{" "}
        <code>node.inputs[&quot;Name&quot;]</code> for destination.  Index access (e.g.{" "}
        <code>node.outputs[0]</code>) works but is fragile if node socket order
        changes between Blender versions; name-based access is preferable.
      </p>
      <p>
        The displacement graph in this tutorial fans the Group Input&apos;s{" "}
        <code>&quot;Scale&quot;</code> float into three <code>CombineXYZ</code> inputs so
        all three axes scale identically.  This is the same fan-out pattern used
        in the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-store-named-attribute-shader-data-bridge"
          className={lk}
        >
          Store Named Attribute shader-data bridge
        </Link>{" "}
        where a single computed value drives multiple downstream nodes.
      </p>

      <h2>Assigning the group to a modifier</h2>
      <p>
        Adding a Geometry Nodes modifier via the data API is two lines:
      </p>
      <pre>
        <code>{`mod = obj.modifiers.new("GN_ScriptedDisplace", 'NODES')
mod.node_group = ng`}</code>
      </pre>
      <p>
        The modifier&apos;s user-facing socket values are stored as custom properties on
        the modifier object with auto-generated keys like <code>&quot;Socket_2&quot;</code>.
        These keys are stable within a single Blender session but can shift if you
        add/remove interface sockets — store them under the socket identifier
        instead for robustness (accessible via{" "}
        <code>ng.interface.items_tree[i].identifier</code>).
      </p>

      <h2>Keyframing modifier socket values</h2>
      <p>
        The Scale parameter is animated from 0 (flat sphere, frame 1) to 0.28 m
        (full displacement, frame 60):
      </p>
      <pre>
        <code>{`scene.frame_set(1)
mod["Socket_2"] = 0.0
mod.keyframe_insert(data_path='["Socket_2"]', frame=1)

scene.frame_set(60)
mod["Socket_2"] = 0.28
mod.keyframe_insert(data_path='["Socket_2"]', frame=60)`}</code>
      </pre>
      <p>
        Note the <code>data_path</code> uses the custom-property bracket syntax —
        the same form used in the{" "}
        <Link
          href="/tutorials/blender-tutorial-animation-drivers-parametric-shader"
          className={lk}
        >
          animation drivers tutorial
        </Link>{" "}
        for driver expressions that read modifier parameters.
      </p>

      <h2>Exporting a GLB snapshot</h2>
      <p>
        <code>export_scene.gltf</code> with <code>export_apply=True</code> bakes
        the modifier at the current frame before export.  The script sets{" "}
        <code>scene.frame_set(60)</code> immediately before export so the GLB
        captures the maximum-displacement state.  Draco level 6 and WebP textures
        match the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-extrude-mesh-panel-inset-procedural"
          className={lk}
        >
          holoflow_webxr_exporter conventions
        </Link>
        .
      </p>

      <h2>Cross-references</h2>
      <ul>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-shader-node-group-batch-material"
            className={lk}
          >
            Python — Shader Node Groups
          </Link>{" "}
          — the same <code>nodes.new()</code> / <code>links.new()</code> pattern in
          the Material node tree (not Geometry Nodes, but identical API shape).
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-bmesh-extrude-scale-fractal-spikes"
            className={lk}
          >
            bmesh Fractal Spike-Ball
          </Link>{" "}
          — direct mesh construction without modifiers; compare with this tutorial&apos;s
          non-destructive approach.
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-gn-gizmo-nodes-interactive-viewport-controls"
            className={lk}
          >
            GN Gizmo Nodes
          </Link>{" "}
          — the next level after scripted trees: interactive viewport handles written
          in the same node-group interface API.
        </li>
      </ul>

      <h2>Outside sources</h2>
      <ul>
        <li>
          <a
            href="https://docs.blender.org/api/5.1/bpy.types.NodeTreeInterface.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Blender API — NodeTreeInterface
          </a>{" "}
          (CC-BY-SA-4.0, Blender Documentation Team). Canonical reference for
          all <code>interface.new_socket()</code> arguments and socket type strings.
          Related: blender main at{" "}
          <a
            href="https://projects.blender.org/blender/blender"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            projects.blender.org
          </a>
          .
        </li>
        <li>
          <a
            href="https://docs.blender.org/api/5.1/bpy.types.GeometryNodeSetPosition.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Blender API — GeometryNodeSetPosition
          </a>{" "}
          (CC-BY-SA-4.0, Blender Documentation Team). Documents input socket
          names and expected types — critical for correct <code>links.new()</code>
          calls. Related:{" "}
          <a
            href="https://docs.blender.org/manual/en/5.1/modeling/geometry_nodes/index.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Geometry Nodes manual
          </a>
          .
        </li>
      </ul>
    </>
  );
}

const base: Omit<Entry, "body"> = {
  slug: "blender-tutorial-python-geonodes-tree-build-bpy",
  publishedAt: "2026-06-21",
  title: "Python — Programmatic Geometry Nodes Tree Construction via bpy (Blender 5.1)",
  subtitle:
    "Build a complete node group — interface sockets, nodes, and links — in a Python script using the Blender 5.1 NodeTreeInterface API, then assign it as a modifier and keyframe a displacement animation.",
  tags: ["blender", "python", "geometry-nodes", "scripting", "bpy", "node-tree", "automation"],
  category: "tutorial",
  series: "holoflow-blender",
};

export const entry: Entry = buildInstructable(
  Body,
  {
    difficulty: "advanced",
    cost: "free",
    goal: "Write a self-contained bpy script that constructs a Geometry Nodes group from scratch — declaring interface sockets via NodeTreeInterface, adding nodes, wiring links, assigning the group as a modifier, and keyframing a displacement socket — without touching the GN Editor UI.",
    supplies: {
      software: [
        {
          name: "Blender",
          version: "5.1",
          url: "https://www.blender.org/download/",
          cost: "free",
          platforms: ["windows", "macos", "linux"],
        },
      ],
      materials: [],
      tools: [],
    },
    steps: [
      {
        title: "Open blueprint.py in the Scripting workspace",
        body: "Blender 5.1 → Scripting workspace → Open → navigate to public/library/blends/scripting/python-geonodes-tree-build-bpy/blueprint.py. Read the parameter block at the top: NODE_GROUP_NAME, NOISE_SCALE, NOISE_STRENGTH.",
      },
      {
        title: "Run the script",
        body: "Press Run Script (Alt+P). The Info editor shows [holoflow] print lines confirming the node group name, node count, link count, and file paths. If a NameError appears, check that the Scripting workspace is active — it sets the correct bpy.context.",
      },
      {
        title: "Inspect the scripted node group",
        body: "Open the Geometry Node Editor (shift+F3 or header dropdown). Select the sphere object. The HF_ScriptedDisplace group appears — six nodes connected left-to-right: Group Input → Position → Noise Texture → CombineXYZ → VectorMath → SetPosition → Group Output.",
      },
      {
        title: "Verify interface sockets in the N-panel",
        body: "With the GN Editor active, press N → Group tab. The panel lists the Scale socket with default 0.28, min 0.0, max 2.0 — these were set in build_node_group() via socket.default_value / .min_value / .max_value immediately after interface.new_socket().",
      },
      {
        title: "Scrub the keyframed animation",
        body: "In the Timeline (or bottom strip), drag the playhead from frame 1 to 60. The sphere morphs from a smooth UV sphere to a noise-displaced organic blob. Both keyframes were inserted by the script via mod.keyframe_insert(data_path='[\"Socket_2\"]').",
      },
      {
        title: "Experiment: add a second socket",
        body: "In blueprint.py, add a new socket after the Scale one: ng.interface.new_socket('NoiseSeed', in_out='INPUT', socket_type='NodeSocketInt'). Wire n_input.outputs['NoiseSeed'] to n_noise.inputs['W'] (change noise_dimensions to '4D' first). Rerun the script to see the new socket appear in the modifier panel.",
      },
      {
        title: "Export GLB and verify",
        body: "Call export_assets() from the Python console. Drag geonodes_script_demo.glb into gltf.report — confirm: node 'gn_scripted_sphere', Draco decoded, Y-up, no embedded node group (modifier was applied).",
      },
    ],
    troubleshooting: [
      {
        symptom: "AttributeError: 'GeometryNodeTree' object has no attribute 'inputs'",
        cause: "Script uses the Blender 3.x API (ng.inputs.new()) which was removed in 4.0.",
        fix: "Replace with ng.interface.new_socket(name, in_out='INPUT', socket_type='NodeSocketFloat'). This tutorial's blueprint.py uses the correct 5.x form.",
      },
      {
        symptom: "KeyError on links.new() — 'Color' not found on Noise node outputs",
        cause: "In some Blender versions the Noise Texture Color output is named 'Color' and in others 'Fac' is a separate float. In 5.1 it is 'Color' (RGB) and 'Fac' (float).",
        fix: "Confirm with: bpy.data.node_groups['HF_ScriptedDisplace'].nodes['Noise Texture'].outputs.keys() in the Python console. Use index 1 (Color) if the name differs.",
      },
      {
        symptom: "Modifier shows 'Socket_2' key but changing it does nothing",
        cause: "The socket identifier may have changed because sockets were added/removed before the current run, shifting Socket_1, Socket_2, etc.",
        fix: "Use ng.interface.items_tree to inspect actual identifiers: [i.identifier for i in ng.interface.items_tree]. Use the printed identifier as the data_path key.",
      },
      {
        symptom: "GLB export fails with 'no context' error",
        cause: "bpy.ops.export_scene.gltf() requires an active area with a VIEW_3D context when called from a Script not run as background.",
        fix: "Run blueprint.py from the Scripting workspace (not a text editor in a non-3D area), or use blender --background --python blueprint.py from the terminal — headless mode always has a valid context for file ops.",
      },
    ],
  },
  base,
);
