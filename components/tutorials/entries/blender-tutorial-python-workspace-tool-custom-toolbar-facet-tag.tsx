import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function PythonWorkspaceToolFacetTagBody() {
  return (
    <>
      <p>
        Blender exposes three distinct paths for custom Python UI: the{" "}
        <Link href="/tutorials/blender-tutorial-python-custom-panel-operator-n-panel-sidebar" className={lk}>
          N-panel sidebar
        </Link>{" "}
        (<code>bpy.types.Panel</code>), the{" "}
        <Link href="/tutorials/blender-tutorial-gn-node-tool-face-push-panel-stamp" className={lk}>
          GN Node Tool
        </Link>{" "}
        (<code>bl_space_type='NODE_EDITOR'</code>), and the Toolbar Tool
        (<code>bpy.types.WorkSpaceTool</code>). WorkSpaceTools are
        the highest-integration path: the tool appears in the T-panel
        beside Blender's own Select/Transform tools, fires operators via a
        keymap you define, and injects a custom widget row into the viewport
        header bar. This tutorial registers an HF Facet Tag tool that
        click-assigns the <code>holoflow:facet</code> INT attribute to any
        clicked face in Edit-Mesh mode — the same attribute the{" "}
        <Link href="/tutorials/blender-tutorial-python-bpy-collection-property-uilist-export-queue" className={lk}>
          export queue panel
        </Link>{" "}
        reads when deciding which objects to export.
      </p>

      <h2 className="mt-6 text-lg font-semibold">
        WorkSpaceTool vs Panel vs GN Node Tool
      </h2>
      <p className="mt-2">
        The three paths differ on <em>where</em> the UI lives and{" "}
        <em>how</em> it is registered:
      </p>
      <ul className="mt-2 list-disc pl-6 space-y-1 text-sm">
        <li>
          <strong>N-panel (bpy.types.Panel)</strong> — sidebar region of a
          specific space; always visible while you are in that space regardless
          of the active tool. Registered via{" "}
          <code>bpy.utils.register_class()</code>.
        </li>
        <li>
          <strong>GN Node Tool (bl_context_mode=&apos;NODE_EDITOR&apos;)</strong> — appears
          in the Geometry Nodes toolbar; the operator receives a{" "}
          <code>is_tool=True</code> socket. Also uses{" "}
          <code>register_class()</code>.
        </li>
        <li>
          <strong>WorkSpaceTool (bpy.types.WorkSpaceTool)</strong> — appears
          in the Toolbar (T) of a viewport, one entry per
          space-type/context-mode pair. Only active when the user explicitly
          selects it. Registered via <code>bpy.utils.register_tool()</code> —
          a completely separate call that takes the class but never
          instantiates it.
        </li>
      </ul>
      <p className="mt-2">
        The key consequence: <code>register_tool()</code> reads the tool&apos;s
        class attributes statically. Nothing is instantiated; you must not
        write <code>self.something</code> anywhere in a WorkSpaceTool class.
      </p>

      <h2 className="mt-6 text-lg font-semibold">
        bl_keymap — class attribute, not a method
      </h2>
      <p className="mt-2">
        The most common mistake when writing a WorkSpaceTool is putting{" "}
        <code>bl_keymap</code> in a <code>@classmethod</code>. It must be a
        bare class-level tuple of 3-tuples:
      </p>
      <pre className="mt-2 overflow-x-auto rounded bg-neutral-900 p-3 text-xs text-green-300">
        {`bl_keymap = (
    (
        "mesh.holoflow_facet_tag_click",  # operator bl_idname
        {"type": "LEFTMOUSE", "value": "PRESS"},  # event filter
        {},                               # operator kwargs
    ),
)`}
      </pre>
      <p className="mt-2">
        The event filter dict accepts the same keys as{" "}
        <code>bpy.types.KeyMapItem</code> properties:{" "}
        <code>type</code>, <code>value</code>, <code>any</code>,{" "}
        <code>shift</code>, <code>ctrl</code>, <code>alt</code>,{" "}
        <code>oskey</code>, <code>key_modifier</code>. Using{" "}
        <code>value=&apos;PRESS&apos;</code> fires immediately on mouse-down; using{" "}
        <code>value=&apos;CLICK&apos;</code> waits for press-then-release without drag —
        safer for workflows where accidental drag is a concern.
      </p>

      <h2 className="mt-6 text-lg font-semibold">
        draw_settings — filling the header bar
      </h2>
      <p className="mt-2">
        <code>draw_settings(context, layout, tool)</code> is a{" "}
        <strong>@staticmethod</strong> — not a regular or class method. Blender
        calls it every viewport redraw while the tool is active, appending
        widgets to the header row after the built-in tool-name label:
      </p>
      <pre className="mt-2 overflow-x-auto rounded bg-neutral-900 p-3 text-xs text-green-300">
        {`@staticmethod
def draw_settings(context, layout, tool):
    props = context.window_manager.hlf_tag_tool_props
    row = layout.row(align=True)
    row.prop(props, "enable", text="Enable", toggle=True)`}
      </pre>
      <p className="mt-2">
        State for the header widget must live somewhere persistent across
        frames. <code>WindowManager</code> properties (attached via{" "}
        <code>bpy.types.WindowManager.hlf_tag_tool_props</code>) reset each
        Blender session and are never saved to the .blend — correct for
        transient tool settings. For persistent per-file settings use{" "}
        <code>bpy.types.Scene</code> or{" "}
        <code>bpy.types.Object</code> PropertyGroups instead.
      </p>

      <h2 className="mt-6 text-lg font-semibold">
        Attribute write: bmesh in Edit Mode vs attributes API in Object Mode
      </h2>
      <p className="mt-2">
        The face attribute must be written differently depending on which mode
        is active:
      </p>
      <ul className="mt-2 list-disc pl-6 space-y-1 text-sm">
        <li>
          <strong>Edit Mode</strong> — the mesh data block is locked inside{" "}
          <code>bmesh.from_edit_mesh(me)</code>. Writing to{" "}
          <code>me.attributes</code> directly while in Edit Mode writes to a{" "}
          <em>separate copy</em> that the depsgraph will discard when you leave
          Edit Mode. The only safe path is the bmesh layer API:{" "}
          <code>bm.faces.layers.int.get(name)</code> /
          <code>.new(name)</code>, then write to{" "}
          <code>face[int_layer]</code>, then{" "}
          <code>bmesh.update_edit_mesh(me)</code>.
        </li>
        <li>
          <strong>Object Mode</strong> — use{" "}
          <code>me.attributes.new(name, type=&apos;INT&apos;, domain=&apos;FACE&apos;)</code>{" "}
          and write <code>attr.data[i].value</code> directly. This is what{" "}
          <code>build_scene()</code> in blueprint.py uses to create the
          initial checkerboard pattern.
        </li>
      </ul>
      <p className="mt-2">
        Both paths refer to the same underlying <code>CustomData</code> layer;
        the difference is which copy of the mesh the depsgraph considers
        authoritative at that moment.
      </p>

      <h2 className="mt-6 text-lg font-semibold">
        register_tool() — after= and separator=
      </h2>
      <p className="mt-2">
        The two optional keyword arguments control toolbar positioning:
      </p>
      <pre className="mt-2 overflow-x-auto rounded bg-neutral-900 p-3 text-xs text-green-300">
        {`bpy.utils.register_tool(
    HLF_WT_facet_tag,
    after={"builtin.select"},   # set of idname strings, NOT class refs
    separator=True,             # draws a divider line above our tool
)`}
      </pre>
      <p className="mt-2">
        The <code>after=</code> set accepts <em>string</em> idnames only —
        passing class objects raises a <code>TypeError</code>. The built-in
        select tool idname is <code>&apos;builtin.select&apos;</code>; you can inspect
        all built-in idnames via the Python console:{" "}
        <code>bpy.utils.manual_map()</code> or by right-clicking any toolbar
        button and selecting &quot;Edit Source&quot;.
      </p>

      <h2 className="mt-6 text-lg font-semibold">
        bl_cursor — cursor icon while active
      </h2>
      <p className="mt-2">
        <code>bl_cursor = &apos;CROSSHAIR&apos;</code> changes the system cursor when the
        tool is active in the viewport. Valid strings are the same enum as{" "}
        <code>bpy.types.Window.cursor_set()</code>: <code>DEFAULT</code>,{" "}
        <code>CROSSHAIR</code>, <code>HAND</code>, <code>MOVE_X</code>,{" "}
        <code>MOVE_Y</code>, <code>KNIFE</code>, <code>TEXT</code>, etc.
        CROSSHAIR is conventional for point-and-click attribution tools
        because it signals precision targeting.
      </p>

      <h2 className="mt-6 text-lg font-semibold">
        WebXR pipeline: holoflow:facet in glTF extras
      </h2>
      <p className="mt-2">
        The <code>holoflow:facet</code> attribute (INT, FACE domain) is read
        by the Holoflow WebXR Exporter add-on at{" "}
        <code>tools/blender-addon/</code>. When{" "}
        <code>export_extras=True</code> is set in the GLB export call, each
        mesh&apos;s face attributes that carry the <code>holoflow:</code> namespace
        are serialised into the glTF <code>extras</code> JSON block, accessible
        in Three.js at <code>mesh.userData[&quot;holoflow:facet&quot;]</code>. The{" "}
        <Link href="/tutorials/blender-tutorial-python-cycles-batch-bake-normal-ao-emission-webxr" className={lk}>
          batch bake tutorial
        </Link>{" "}
        shows how face attributes survive the bake pipeline when working with
        high-poly to low-poly transfers.
      </p>
      <p className="mt-2">
        One gotcha: the colon in <code>holoflow:facet</code> is legal in
        Python dict keys and Blender attribute names but some JSON parsers
        treat it as a namespace separator. Khronos&apos;s glTF Validator accepts
        it in extras objects; Three.js <code>mesh.userData</code> preserves it
        verbatim. Always use the colon-key style for Holoflow attributes — it
        distinguishes them from application-specific properties (single word)
        and Blender internals (underscore-prefixed).
      </p>

      <h2 className="mt-6 text-lg font-semibold">Troubleshooting</h2>
      <ul className="mt-2 list-disc pl-6 space-y-1 text-sm">
        <li>
          <strong>Tool not visible in toolbar</strong>: confirm{" "}
          <code>bl_context_mode = &apos;EDIT_MESH&apos;</code> and that you are in
          Edit Mode for a Mesh object. WorkSpaceTools with a context-mode
          restriction are invisible in all other modes.
        </li>
        <li>
          <strong>AttributeError on register_tool()</strong>: the tool class
          was passed to <code>register_class()</code> instead of{" "}
          <code>register_tool()</code>. These two registries are separate;{" "}
          <code>register_class()</code> raises an AttributeError on
          WorkSpaceTool subclasses.
        </li>
        <li>
          <strong>draw_settings not appearing</strong>: ensure it is a{" "}
          <code>@staticmethod</code> — an instance method or classmethod is
          silently ignored because Blender reads it via Python&apos;s descriptor
          protocol and expects a bare callable, not a bound method.
        </li>
        <li>
          <strong>Attribute value not persisting after Tab</strong>: you wrote
          to <code>me.attributes</code> while in Edit Mode. Use the bmesh
          layer path instead; call{" "}
          <code>bmesh.update_edit_mesh(me, destructive=False)</code> to flush.
        </li>
        <li>
          <strong>Cursor not changing</strong>: check the{" "}
          <code>bl_cursor</code> string against the enum values of{" "}
          <code>bpy.types.Window.cursor_set()</code>. Invalid strings silently
          fall back to <code>DEFAULT</code>.
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable(
  {
    time: "an afternoon",
    difficulty: "intermediate",
    cost: "free",
    supplies: {
      materials: ["Blender 5.1"],
      tools: ["blueprint.py", "record.py", "ffmpeg (for viewport.mp4)"],
    },
    steps: [
      {
        title: "Run blueprint.py",
        body: "Open Blender 5.1 → Scripting workspace → open blueprint.py → Run Script. A 10×10 grid named facet_demo_grid appears with an orange/grey checkerboard pattern from the pre-tagged holoflow:facet attribute.",
      },
      {
        title: "Confirm the attribute in Object Data",
        body: "Switch to Layout workspace, select facet_demo_grid. Open Properties → Object Data (mesh icon) → Attributes. Confirm holoflow:facet with type=INT and domain=Face.",
      },
      {
        title: "Enter Edit Mode and open the Toolbar",
        body: "Press Tab to enter Edit Mode. Press T to toggle the Toolbar. Scroll down past the separator line — HF Facet Tag tool should appear with the brush icon.",
      },
      {
        title: "Activate HF Facet Tag and inspect the header",
        body: "Click HF Facet Tag in the toolbar. The viewport header bar now shows an Enable toggle and a label reading 'writes holoflow:facet = 1 (tagged)'. Confirm the cursor changes to a crosshair.",
      },
      {
        title: "Click faces to tag",
        body: "Click several grey faces. They should turn orange (value 1). Open the Spreadsheet editor, set Domain = Face — watch the holoflow:facet column update on each click.",
      },
      {
        title: "Toggle Enable off and clear faces",
        body: "Uncheck Enable in the header. Click several orange faces. They turn grey (value 0). Spreadsheet column confirms 0. Press Ctrl+Z a few times — confirm the undo chain reverts values correctly.",
      },
      {
        title: "Tab to Object Mode and verify attribute persists",
        body: "Press Tab to leave Edit Mode. Object Data → Attributes → holoflow:facet still present with the values you set. This confirms bmesh.update_edit_mesh() flushed correctly.",
      },
      {
        title: "Export as GLB with extras",
        body: "File → Export → glTF 2.0. Under Include, tick Custom Properties. Export. Open the .glb in a text editor or the Khronos glTF Validator — the JSON chunk's extras object contains holoflow:facet per mesh.",
      },
      {
        title: "Run record.py for viewport.mp4",
        body: "Open record.py → Run Script. 180 PNG frames render to the frames/ subdirectory. Copy and run the printed ffmpeg command to produce viewport.mp4.",
      },
      {
        title: "Capture screen.mp4",
        body: "Follow SCREEN-RECORDING-NOTES.md. Key takes: Attributes panel, Spreadsheet live update, header-bar toggle, undo chain, glTF extras JSON. Save to videos/scripting/python-workspace-tool-custom-toolbar-facet-tag/screen.mp4.",
      },
    ],
  },
  {
    slug: "blender-tutorial-python-workspace-tool-custom-toolbar-facet-tag",
    title:
      "Python bpy.types.WorkSpaceTool — Custom Toolbar Tool: Click-Tag holoflow:facet Attribute (Blender 5.1)",
    date: "2026-07-03",
    kind: "tutorial",
    excerpt:
      "Build a fully integrated Blender toolbar tool using bpy.types.WorkSpaceTool — the highest-integration scripting path, distinct from N-panel sidebars and GN Node Tools. The tool appears in the T-panel in Edit-Mesh mode, fires a click operator via bl_keymap, injects an Enable toggle into the viewport header via draw_settings, and writes the holoflow:facet INT attribute to clicked faces through the bmesh layer API. Covers register_tool() vs register_class(), bl_keymap tuple syntax, the staticmethod requirement for draw_settings, Edit-Mode vs Object-Mode attribute write paths, bl_cursor values, and GLB export_extras serialisation of colon-key face attributes.",
    Body: PythonWorkspaceToolFacetTagBody,
  },
);
