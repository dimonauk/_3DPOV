import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        Every Geometry Nodes tutorial you have seen was built by dragging nodes
        around an editor.  This one builds the entire node tree — interface
        sockets, node instances, and every link between them — from a single
        Python script using <code>bpy.data.node_groups.new()</code>.  The result
        is a procedural billboard scatter modifier that Blender adds to a ground
        plane and evaluates live; the modifier is identical to one you could build
        by hand, except it takes 300&thinsp;ms to create, runs headlessly in a
        background process, and is reproducible on any machine.
      </p>
      <p>
        The scatter produces vertical quad billboards distributed across a
        subdivided plane, each scaled independently by a per-point random value.
        The finished GLB exports with Draco compression for drop-in use in a
        Three.js / WebXR scene.  The approach generalises to any GN modifier: the
        same API calls create a Curve to Mesh modifier, a Voronoi fracture rig,
        or a custom deformer — without touching the editor at all.
      </p>

      <h2>Why build node trees from Python rather than the editor?</h2>
      <p>
        Three reasons matter for a studio pipeline.  First, <strong>determinism
        </strong>: a script produces the same node tree on every machine and every
        run.  Second, <strong>parameterisation</strong>: constants live at the top
        of the file; changing one line rewires the entire tree.  Third,
        <strong>headless execution</strong>: the API has no editor-context
        requirement — it runs in <code>blender -b --python blueprint.py</code>
        without a display.{" "}
        <Link
          href="/tutorials/blender-tutorial-python-depsgraph-evaluated-geometry-gn-instances-batch-export"
          className={lk}
        >
          The depsgraph batch-export tutorial
        </Link>{" "}
        shows how to consume the evaluated instances from a GN modifier in
        exactly this headless mode, making the two scripts a natural pipeline
        pair.
      </p>
      <p>
        The downside is legibility: socket names must be exact strings matching
        the internal identifiers (not always the UI label), and a typo silently
        creates an unlinked node.  The troubleshooting section below covers the
        most common failures.
      </p>

      <h2>The interface API — Blender 5.1 socket registration</h2>
      <p>
        Blender 4.0 removed the old <code>tree.inputs.new()</code> and{" "}
        <code>tree.outputs.new()</code> methods.  The replacement is:
      </p>
      <pre>{`tree.interface.new_socket(
    "Density",
    in_out="INPUT",
    socket_type="NodeSocketFloat",
)`}</pre>
      <p>
        The <code>in_out</code> parameter is a string enum:{" "}
        <code>&apos;INPUT&apos;</code> for group inputs (visible on the left of
        the group node when used as a node group), <code>&apos;OUTPUT&apos;</code>
        for outputs.  The <code>socket_type</code> string must be a valid Blender
        RNA type — <code>NodeSocketGeometry</code>, <code>NodeSocketFloat</code>,
        <code>NodeSocketInt</code>, <code>NodeSocketVector</code>, and so on.
      </p>
      <p>
        Once sockets are registered, the <code>NodeGroupInput</code> and{" "}
        <code>NodeGroupOutput</code> nodes expose them on their respective
        <code>.outputs</code> and <code>.inputs</code> collections.  Access them
        by name string — <code>n_in.outputs[&apos;Density&apos;]</code> — not by
        integer index, which shifts whenever you add a socket earlier in the list.
      </p>
      <p>
        Setting modifier defaults uses the auto-generated identifier strings
        rather than the socket name.  The robust pattern iterates the interface:
      </p>
      <pre>{`for item in tree.interface.items_tree:
    if item.in_out != "INPUT":
        continue
    if item.name == "Density":
        mod[item.identifier] = DENSITY`}</pre>
      <p>
        Compare this with the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-world-node-tree-hdri-environment-lighting-rig"
          className={lk}
        >
          World node tree tutorial
        </Link>
        , which builds a ShaderNodeTree using the same socket API — the pattern
        is identical across all three tree types (ShaderNodeTree, GeometryNodeTree,
        CompositorNodeTree).
      </p>

      <h2>Node type strings — the bl_idname vs the UI label</h2>
      <p>
        Every node has a <code>bl_idname</code> string that differs from what you
        see in the Add menu.  <code>nodes.new(type=&apos;...&apos;)</code> requires
        the <code>bl_idname</code>.  The reliable way to find it: add the node
        manually in the editor, hover over it, and read the tooltip — or run{" "}
        <code>bpy.ops.node.add_node?</code> from the Python console after adding
        it to see the type parameter that was used.
      </p>
      <p>
        For this tutorial the critical ones are:
      </p>
      <pre>{`"NodeGroupInput"                         # Group Input
"NodeGroupOutput"                        # Group Output
"GeometryNodeDistributePointsOnFaces"    # Distribute Points on Faces
"GeometryNodeInputIndex"                 # Index
"FunctionNodeRandomValue"                # Random Value
"ShaderNodeCombineXYZ"                   # Combine XYZ (valid in GN trees)
"GeometryNodeObjectInfo"                 # Object Info
"GeometryNodeInstanceOnPoints"           # Instance on Points`}</pre>
      <p>
        Note <code>ShaderNodeCombineXYZ</code> — it carries the Shader prefix but
        is fully usable in a GeometryNodeTree.  Blender&rsquo;s converter nodes
        are shared across tree types.
      </p>

      <h2>Per-point randomness — why the Index node is essential</h2>
      <p>
        <code>FunctionNodeRandomValue</code> has two seed inputs: <code>ID</code>
        (the primary per-element seed) and <code>Seed</code> (a secondary global
        offset).  If <code>ID</code> is left disconnected, all points receive the
        same random float — every billboard is the same size.  Connecting a{" "}
        <code>GeometryNodeInputIndex</code> output to <code>ID</code> injects the
        point index as the seed, producing distinct values per instance:
      </p>
      <pre>{`n_idx  = nodes.new("GeometryNodeInputIndex")
n_rand = nodes.new("FunctionNodeRandomValue")
n_rand.data_type = "FLOAT"
n_rand.inputs["Min"].default_value = SCALE_MIN
n_rand.inputs["Max"].default_value = SCALE_MAX

links.new(n_idx.outputs["Index"], n_rand.inputs["ID"])`}</pre>
      <p>
        The Random Value returns a scalar float.{" "}
        <code>GeometryNodeInstanceOnPoints</code> expects a <em>vector</em> for
        its <code>Scale</code> input.  A{" "}
        <code>ShaderNodeCombineXYZ</code> node fans the single float into all
        three axes — one output socket connecting to three input sockets — to
        produce a uniform-scale vector:
      </p>
      <pre>{`links.new(n_rand.outputs["Value"], n_xyz.inputs["X"])
links.new(n_rand.outputs["Value"], n_xyz.inputs["Y"])
links.new(n_rand.outputs["Value"], n_xyz.inputs["Z"])
links.new(n_xyz.outputs["Vector"], n_inst.inputs["Scale"])`}</pre>
      <p>
        The same fan pattern appears in{" "}
        <Link
          href="/tutorials/blender-tutorial-python-mathutils-bvhtree-raycast-surface-scatter-webxr"
          className={lk}
        >
          the BVHTree surface scatter tutorial
        </Link>
        , where a single computed normal feeds three different shader node inputs.
      </p>

      <h2>Applying the modifier and live parameter update</h2>
      <p>
        Creating the node tree is insufficient — a modifier must adopt it:
      </p>
      <pre>{`mod = ground.modifiers.new("GN Scatter", "NODES")
mod.node_group = tree`}</pre>
      <p>
        Once adopted, the modifier evaluates automatically on every depsgraph
        update.  The <code>Density</code> and <code>Seed</code> sockets appear in
        the modifier properties panel.  Changing <code>Seed</code> interactively
        re-scatters without re-running the script.  That live linkage is why the
        script exposes them as interface sockets rather than hard-coding the
        values inside the node tree.
      </p>
      <p>
        The{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-instance-on-points"
          className={lk}
        >
          GN Instance on Points tutorial
        </Link>{" "}
        explores the editor-side of the same modifier; pairing the two gives a
        complete picture of both the build and the authoring workflow.
      </p>

      <h2>Troubleshooting — five silent failures</h2>
      <p>
        <strong>Wrong node type string.</strong>{" "}
        <code>nodes.new(&apos;GeometryNodeDistributePoints&apos;)</code> raises no
        error — it falls back to a generic node with no sockets.  Always verify
        with the tooltip.
      </p>
      <p>
        <strong>Socket name mismatch.</strong>{" "}
        <code>n_dist.inputs[&apos;Density&apos;]</code> only exists in RANDOM
        distribute mode.  Switch <code>distribute_method</code> before any socket
        lookup; POISSON mode exposes different sockets.
      </p>
      <p>
        <strong>Old interface API.</strong> If your target machine runs Blender
        3.x, <code>tree.interface.new_socket()</code> does not exist — use{" "}
        <code>tree.inputs.new()</code> instead.  The blueprint targets 5.1
        exclusively; a version guard at the top of the file prevents silent
        breakage on older builds.
      </p>
      <p>
        <strong>Object Info resolves at scene level.</strong> The billboard source
        object must be in the scene collection that Blender evaluates.{" "}
        <code>hide_viewport = True</code> breaks Object Info resolution; use{" "}
        <code>hide_render = True</code> and <code>hide_viewport = False</code>
        as the script does.
      </p>
      <p>
        <strong>Modifier socket identifier drift.</strong> If you add or remove an
        interface socket, Blender renumbers the auto-generated identifiers.  The
        interface-iteration pattern above survives this; hard-coded{" "}
        <code>mod[&apos;Socket_2&apos;]</code> references do not.
      </p>

      <h2>Export for WebXR</h2>
      <p>
        <code>export_apply=True</code> in the GLTF exporter realises the GN
        modifier before export — the GLB contains the evaluated scatter geometry,
        not the modifier stack.  For a vegetation scene this may be intentional
        (static bake); for a scene that needs live density control at runtime, the
        scatter must be reimplemented in Three.js using{" "}
        <code>THREE.InstancedMesh</code> with the same density and seed parameters.
      </p>

      <h2>Outside sources</h2>
      <ul>
        <li>
          <strong>Blender Python API — bpy.types.NodeTree</strong>{" "}
          (CC-BY-SA-4.0 · Blender Foundation):{" "}
          <a
            href="https://docs.blender.org/api/current/bpy.types.NodeTree.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            docs.blender.org/api/current/bpy.types.NodeTree.html
          </a>
          .  Primary reference for the <code>nodes</code>, <code>links</code>,
          and <code>interface</code> sub-APIs.
        </li>
        <li>
          <strong>blender-scripting</strong> by njankowski (MIT):{" "}
          <a
            href="https://github.com/njankowski/blender-scripting"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            github.com/njankowski/blender-scripting
          </a>
          .  A catalogue of concise bpy recipes covering modifier, mesh, and
          material scripting patterns.  Sibling project:{" "}
          <a
            href="https://github.com/njankowski/blenderpy"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            blenderpy
          </a>
          .
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable({
  slug: "blender-tutorial-python-geometry-nodetree-build-scatter-modifier-api",
  title:
    "Python bpy.data.node_groups — Build a GeometryNodeTree via the Python API: Procedural Billboard Scatter for WebXR (Blender 5.1)",
  libraryPath:
    "blends/scripting/python-geometry-nodetree-build-scatter-modifier-api",
  blenderVersion: "5.1",
  date: "2026-07-04",
  tags: [
    "blender",
    "python",
    "geometry-nodes",
    "scripting",
    "scatter",
    "webxr",
    "node-tree",
  ],
  Body,
});
