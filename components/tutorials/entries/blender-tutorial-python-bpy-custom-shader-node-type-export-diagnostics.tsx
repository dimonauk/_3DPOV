import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function PythonCustomShaderNodeBody() {
  return (
    <>
      <p>
        Every node in Blender&rsquo;s Shader Editor — Principled BSDF, Image
        Texture, Mix Shader — is a Python class registered with{" "}
        <code>bpy.utils.register_class()</code>. You can write your own.{" "}
        <code>bpy.types.ShaderNode</code> is the base class for custom Shader
        Editor nodes; subclass it, declare output sockets in{" "}
        <code>init()</code>, draw inline UI with <code>draw_buttons()</code>,
        react to tree changes via <code>update()</code>, and register an
        Add-menu category through <code>nodeitems_utils.NodeCategory</code>.
        The result: a node that appears in the Add menu alongside built-in
        nodes, behaves exactly like one, and runs arbitrary Python logic.
      </p>
      <p className="mt-2">
        This tutorial builds an <strong>HF Export Diagnostics</strong> node
        that interrogates the material that owns its tree and checks three
        Holoflow WebXR export constraints: WebP textures, a linked UV Map,
        and Principled BSDF usage. Socket pins change colour — green for pass,
        red for fail — so status is visible at a glance in the node graph.
        Compare with the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-shader-node-group-batch-material"
          className={lk}
        >
          Shader Node Group batch-material tutorial
        </Link>
        , which manipulates existing nodes via the data API. That pattern is
        right for building node trees programmatically; this one is right when
        you want the node itself to embody logic as a first-class citizen of
        the Shader Editor.
      </p>

      <h2 className="mt-6 text-lg font-semibold">
        ShaderNode vs ShaderNodeCustomGroup
      </h2>
      <p className="mt-2">
        <code>bpy.types.ShaderNodeCustomGroup</code> wraps an existing node
        group: its inputs and outputs mirror whatever the group interface
        exposes, and the group tree holds all the real logic as connected
        nodes. <code>bpy.types.ShaderNode</code> (bare subclass) owns its
        socket list and <code>draw_buttons()</code> entirely — no inner tree,
        no group overhead. Use <em>CustomGroup</em> when the node is a
        reusable preset of existing Blender nodes; use a bare{" "}
        <em>ShaderNode</em> subclass when the node executes Python logic or
        reads scene data that no built-in node provides.
      </p>

      <h2 className="mt-6 text-lg font-semibold">
        Custom sockets with draw_color()
      </h2>
      <p className="mt-2">
        <code>bpy.types.NodeSocket</code> subclasses define their pin colour
        via <code>draw_color()</code>. Built-in socket types have fixed colours
        (grey for Shader, yellow for Float, purple for Vector). A custom socket
        can return a colour that reflects runtime state — here, green when the
        check passes and red when it fails, making the node graph a live
        status board.
      </p>
      <pre className="mt-2 overflow-x-auto rounded bg-neutral-900 p-3 text-xs text-green-300">
        {`class HFSocketBoolStatus(bpy.types.NodeSocket):
    bl_idname = "HFSocketBoolStatus"
    bl_label  = "Bool Status"
    default_value: BoolProperty(default=False)

    def draw(self, context, layout, node, text):
        if self.is_output or self.is_linked:
            layout.label(text=text)
        else:
            layout.prop(self, "default_value", text=text)

    def draw_color(self, context, node):
        # Green = pass, red = fail — the pin IS the status indicator
        return (0.0, 0.78, 0.22, 1.0) if self.default_value else (0.80, 0.12, 0.12, 1.0)`}
      </pre>

      <h2 className="mt-6 text-lg font-semibold">
        init(), update(), draw_buttons()
      </h2>
      <p className="mt-2">
        Three methods define the node&rsquo;s lifecycle.{" "}
        <strong>init()</strong> is called once when the node is first dragged
        into a tree. Add sockets here via{" "}
        <code>self.outputs.new(&quot;HFSocketBoolStatus&quot;, &quot;WebP Ready&quot;)</code>.
        The socket type must be a registered <code>bl_idname</code>, either
        built-in or your own subclass.{" "}
        <strong>update()</strong> fires whenever any connection in the tree
        changes. Push computed values to socket{" "}
        <code>default_value</code> here so downstream scripts can read them
        without wiring anything.{" "}
        <strong>draw_buttons()</strong> is called every redraw. Run checks
        here too — they are cheap reads of scene data, not heavy computations
        — so the display stays current without waiting for a connection event.
      </p>
      <pre className="mt-2 overflow-x-auto rounded bg-neutral-900 p-3 text-xs text-green-300">
        {`class ShaderNodeHFExportDiagnostics(bpy.types.ShaderNode):
    bl_idname = "ShaderNodeHFExportDiagnostics"
    bl_label  = "HF Export Diagnostics"
    bl_icon   = "EXPORT"
    bl_width_default = 200

    webp_ok : BoolProperty(default=False)
    uv_ok   : BoolProperty(default=False)
    bsdf_ok : BoolProperty(default=False)

    @classmethod
    def poll(cls, ntree):
        return ntree.bl_idname == "ShaderNodeTree"   # Shader Editor only

    def init(self, context):
        self.outputs.new("HFSocketBoolStatus", "WebP Ready")
        self.outputs.new("HFSocketBoolStatus", "UV Valid")
        self.outputs.new("HFSocketBoolStatus", "BSDF OK")
        self._run_checks()
        self._push_to_sockets()

    def update(self):
        self._run_checks()
        self._push_to_sockets()

    def draw_buttons(self, context, layout):
        self._run_checks(); self._push_to_sockets()
        col = layout.column(align=True)
        for label, ok in [("WebP textures", self.webp_ok),
                          ("UV map linked", self.uv_ok),
                          ("Principled BSDF", self.bsdf_ok)]:
            col.label(text=label, icon="CHECKMARK" if ok else "CANCEL")`}
      </pre>

      <h2 className="mt-6 text-lg font-semibold">
        Diagnostic logic — reading the owning material
      </h2>
      <p className="mt-2">
        Inside <code>draw_buttons()</code>, <code>self.id_data</code> is the{" "}
        <code>bpy.types.Material</code> that owns this node tree. From there,{" "}
        <code>mat.node_tree.nodes</code> gives the full node list. Filtering by{" "}
        <code>node.type</code> (e.g. <code>&quot;TEX_IMAGE&quot;</code>) and
        inspecting <code>node.image.file_format</code> or{" "}
        <code>node.outputs[0].is_linked</code> covers the three checks
        entirely without any operator calls.
      </p>

      <h2 className="mt-6 text-lg font-semibold">
        nodeitems_utils — Add-menu registration
      </h2>
      <p className="mt-2">
        Since Blender 2.7x, the node Add menu is populated by{" "}
        <code>nodeitems_utils.register_node_categories()</code>. In 5.1 this
        module still ships with Blender as a bundled legacy module. The
        pattern: subclass <code>NodeCategory</code>, give it a{" "}
        <code>poll()</code> that restricts to{" "}
        <code>context.space_data.tree_type == &quot;ShaderNodeTree&quot;</code>,
        and list <code>NodeItem(NODE_IDNAME)</code> entries. The Geometry Nodes
        editor uses a different successor API
        (<code>bpy.types.NodeTree.interface</code>), but Shader Editor custom
        nodes still rely on <code>nodeitems_utils</code> in 5.1.
      </p>
      <pre className="mt-2 overflow-x-auto rounded bg-neutral-900 p-3 text-xs text-green-300">
        {`from nodeitems_utils import NodeCategory, NodeItem, register_node_categories

class HoloflowShaderNodeCategory(NodeCategory):
    @classmethod
    def poll(cls, context):
        return context.space_data.tree_type == "ShaderNodeTree"

register_node_categories("HOLOFLOW_SHADER_NODES", [
    HoloflowShaderNodeCategory(
        "HOLOFLOW_SHADER_NODES", "Holoflow",
        items=[NodeItem("ShaderNodeHFExportDiagnostics")]
    ),
])`}
      </pre>

      <h2 className="mt-6 text-lg font-semibold">
        Querying sockets from Python scripts
      </h2>
      <p className="mt-2">
        Because <code>_push_to_sockets()</code> writes the check results to{" "}
        <code>node.outputs[&quot;WebP Ready&quot;].default_value</code>, a batch-export
        script can gate GLB export without re-running the checks itself.
        The{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bpy-collection-property-uilist-export-queue"
          className={lk}
        >
          Export Queue UIList tutorial
        </Link>{" "}
        shows how to drive a panel button from such a gate. The downstream
        consumer is the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-gltf-user-extension-export-extras-hook"
          className={lk}
        >
          GLTF User Extension hook
        </Link>
        , which reads per-material data at export time.
      </p>
      <pre className="mt-2 overflow-x-auto rounded bg-neutral-900 p-3 text-xs text-green-300">
        {`# Gate export: only proceed if all checks pass
for mat in bpy.data.materials:
    if not mat.use_nodes:
        continue
    for node in mat.node_tree.nodes:
        if node.bl_idname != "ShaderNodeHFExportDiagnostics":
            continue
        webp = node.outputs["WebP Ready"].default_value
        uv   = node.outputs["UV Valid"].default_value
        bsdf = node.outputs["BSDF OK"].default_value
        if all((webp, uv, bsdf)):
            print(f"{mat.name}: export ready")
        else:
            print(f"{mat.name}: NOT ready  webp={webp}  uv={uv}  bsdf={bsdf}")`}
      </pre>

      <h2 className="mt-6 text-lg font-semibold">Outside sources</h2>
      <ul className="mt-2 list-disc pl-5 space-y-1">
        <li>
          Blender Python API —{" "}
          <a
            href="https://docs.blender.org/api/current/bpy.types.Node.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            bpy.types.Node + nodeitems_utils
          </a>{" "}
          (CC-BY-SA-4.0, Blender Foundation). Sibling repos:{" "}
          <a
            href="https://github.com/blender/blender"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            blender/blender
          </a>
          ,{" "}
          <a
            href="https://github.com/blender/blender-developer-docs"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            blender/blender-developer-docs
          </a>
          .
        </li>
        <li>
          <a
            href="https://github.com/njanakiev/blender-scripting"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            njanakiev/blender-scripting
          </a>{" "}
          (MIT, Nikolai Janakiev) — Python scripting examples for Blender.
          Sibling repos: njanakiev/scikit-spatial, njanakiev/python-snippets.
        </li>
      </ul>

      <h2 className="mt-6 text-lg font-semibold">Further reading</h2>
      <ul className="mt-2 list-disc pl-5 space-y-1">
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-custom-panel-operator-n-panel-sidebar"
            className={lk}
          >
            Custom N-Panel sidebar
          </Link>{" "}
          — the <code>bpy.types.Panel</code> pattern that complements custom
          node UIs for properties outside the node tree.
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-gizmo-group-custom-viewport-handle"
            className={lk}
          >
            GizmoGroup persistent overlay
          </Link>{" "}
          — another Python-registered UI element with its own{" "}
          <code>poll()</code> and <code>draw_color()</code> equivalents.
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable(
  {
    steps: [
      {
        title: "Open a new Blender file and a Text Editor area",
        body: "File → New → General. Split the screen: drag the top-right corner of the 3D Viewport to the left. Set the right panel to Text Editor. Create a new text block and paste blueprint.py.",
      },
      {
        title: "Register the custom node",
        body: "Press Alt+P or click Run Script in the Text Editor header. The Info log should show no errors. The Python console prints: [HF] 'HF Export Diagnostics' node registered — Add › Holoflow › HF Export Diagnostics.",
      },
      {
        title: "Open the Shader Editor",
        body: "In the right panel, switch from Text Editor to Shader Editor. Select the default Cube. Its material is already shown. If there is no material, click New in the Shader Editor header.",
      },
      {
        title: "Add the HF Export Diagnostics node",
        body: "Press Shift+A in the Shader Editor. Scroll to the bottom of the Add menu — a new Holoflow category appears. Click HF Export Diagnostics. The node appears with three red sockets (WebP and UV checks fail; BSDF OK is red too until the Principled BSDF output is linked to Material Output).",
      },
      {
        title: "Wire the Principled BSDF to Material Output",
        body: "The default material already has this connection. If not: drag from Principled BSDF → BSDF output to Material Output → Surface. The BSDF OK socket on the diagnostics node turns green.",
      },
      {
        title: "Add an Image Texture and a UV Map node",
        body: "Shift+A → Texture → Image Texture. Load any PNG image. Connect Color → Base Color on Principled BSDF. Add Shift+A → Input → UV Map and wire it to the Image Texture's Vector input. The UV Valid socket turns green. The WebP Ready socket remains red because the loaded image is PNG.",
      },
      {
        title: "Convert texture to WebP",
        body: "In the Image Editor (or Properties → Image section), save a copy of the texture as WebP (Image → Save a Copy → Format: WebP). Reload that WebP file into the Image Texture node. The WebP Ready socket turns green. All three sockets are now green.",
      },
      {
        title: "Query sockets from a batch script",
        body: "Open a new Text block in the Text Editor. Paste the batch-query snippet from the tutorial. Run Script. The Info header (or System Console) prints the pass/fail state for each material in the scene — showing the node as a programmatically queryable data source.",
      },
      {
        title: "Inspect unregister behaviour",
        body: "Call unregister() in the console: bpy.ops... actually call unregister() directly (the module is registered as __main__ when run as a script). The node disappears from the Add menu. Any existing HF Export Diagnostics nodes in open .blend files show as Unknown Node until re-registered. This is expected — the bl_idname is only valid while the class is registered.",
      },
      {
        title: "Run record.py",
        body: "Open record.py in the Text Editor. Run Script. 120 PNG frames render to /tmp/hf_diag_frames/. Copy and run the printed ffmpeg command to produce viewport.mp4 in the videos directory.",
      },
      {
        title: "Capture screen.mp4",
        body: "Follow SCREEN-RECORDING-NOTES.md. Key takes: Shift+A showing the Holoflow category, socket colour change on UV Map link, socket colour change on WebP image load, batch-query script output. Save to videos/scripting/python-bpy-custom-shader-node-type-export-diagnostics/screen.mp4.",
      },
    ],
  },
  {
    slug: "blender-tutorial-python-bpy-custom-shader-node-type-export-diagnostics",
    title:
      "Python bpy.types.ShaderNode + NodeSocket — Custom Export Diagnostics Node for the Shader Editor (Blender 5.1)",
    date: "2026-07-03",
    kind: "tutorial",
    excerpt:
      "Register a custom node type in Blender's Shader Editor by subclassing bpy.types.ShaderNode and bpy.types.NodeSocket. The HF Export Diagnostics node interrogates the owning material, checks three Holoflow WebXR export constraints (WebP textures, linked UV Map, Principled BSDF), and exposes the results as Boolean output sockets whose pin colour changes green or red at runtime. Covers init() socket allocation, update() reactivity, draw_buttons() inline UI, draw_color() on custom sockets, poll() to restrict to ShaderNodeTree, nodeitems_utils.NodeCategory Add-menu registration, and programmatic socket querying from batch-export scripts. Distinct from ShaderNodeCustomGroup (wraps an existing group tree) and from Python node group creation via the data API.",
    Body: PythonCustomShaderNodeBody,
  },
);
