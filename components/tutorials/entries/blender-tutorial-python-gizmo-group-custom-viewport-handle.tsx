import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function PythonGizmoGroupBody() {
  return (
    <>
      <p>
        Blender's <code>bpy.types.GizmoGroup</code> is the mechanism behind the
        Move/Rotate/Scale handles you see in every viewport — and you can
        register your own. Unlike a{" "}
        <Link href="/tutorials/blender-tutorial-gn-gizmo-nodes-interactive-viewport-controls" className={lk}>
          Geometry Nodes gizmo node
        </Link>
        , which only appears while a Node Tool is active, a Python GizmoGroup
        with <code>{'{"3D", "PERSISTENT"}'}</code> in <code>bl_options</code>{" "}
        floats above the scene regardless of which tool is selected. This
        tutorial registers a persistent overlay that plants a green circle above
        every mesh tagged with <code>holoflow:facet = 1</code> and an arrow
        showing its local +Y (the WebXR export axis) — extending the{" "}
        <Link href="/tutorials/blender-tutorial-python-workspace-tool-custom-toolbar-facet-tag" className={lk}>
          Facet Tag toolbar tool
        </Link>{" "}
        with always-on spatial feedback.
      </p>

      <h2 className="mt-6 text-lg font-semibold">
        GizmoGroup vs draw_handler_add
      </h2>
      <p className="mt-2">
        <code>SpaceView3D.draw_handler_add</code> runs unconditionally every
        frame with zero hover semantics and zero undo participation — right for
        HUD readouts, wrong for interactive spatial tags.{" "}
        <code>bpy.types.GizmoGroup</code> is polled per-frame, colour-changes
        on hover, fires operators on click, and participates in the undo stack
        when <code>bl_options = {'{"REGISTER", "UNDO"}'}</code> is on the target
        operator. The same contrast applies to the{" "}
        <Link href="/tutorials/blender-tutorial-python-app-handler-frame-change-depsgraph" className={lk}>
          frame-change handler
        </Link>
        : persistent callbacks suit scene-level reactions, not viewport picks.
      </p>

      <h2 className="mt-6 text-lg font-semibold">
        setup() vs refresh() — the allocation boundary
      </h2>
      <p className="mt-2">
        <strong>setup()</strong> is called once when the group is first
        materialised. Allocate every gizmo you will ever need here via{" "}
        <code>self.gizmos.new(type_id)</code>. Gizmo count cannot change after
        setup — hide surplus gizmos with <code>gz.hide = True</code> rather
        than trying to remove them.
      </p>
      <p className="mt-2">
        <strong>refresh()</strong> is called whenever Blender detects a context
        change — object selection, mode switch, property edit. Update{" "}
        <code>gz.matrix_basis</code>, colours, and <code>gz.hide</code> here.
        Never call <code>bpy.ops.*</code> in refresh.
      </p>
      <pre className="mt-2 overflow-x-auto rounded bg-neutral-900 p-3 text-xs text-green-300">
        {`class HOLOFLOW_GGT_facet_overlay(bpy.types.GizmoGroup):
    bl_idname      = "HOLOFLOW_GGT_facet_overlay"
    bl_space_type  = 'VIEW_3D'
    bl_region_type = 'WINDOW'
    bl_options     = {'3D', 'PERSISTENT'}

    @classmethod
    def poll(cls, context):
        return context.space_data.overlay.show_overlays

    def setup(self, context):
        gz = self.gizmos.new("GIZMO_GT_primitive_3d")
        gz.draw_style = 'CIRCLE'
        gz.scale_basis = 0.18
        gz.use_draw_hover = True
        op = gz.target_set_operator("holoflow.toggle_facet_tag")
        op.object_name = "MyProp"

    def refresh(self, context):
        gz = self.gizmos[0]
        gz.matrix_basis = mathutils.Matrix.Translation((0, 0, 1.5))`}
      </pre>

      <h2 className="mt-6 text-lg font-semibold">
        bl_options — {'{"3D"}'} and {'{"PERSISTENT"}'}
      </h2>
      <ul className="mt-2 list-disc pl-6 space-y-1 text-sm">
        <li>
          <strong>{'{"3D"}'}</strong> — enables world-space positioning via{" "}
          <code>matrix_basis</code>. Without it, <code>matrix_basis</code> is
          ignored and gizmos render at screen (0,0).
        </li>
        <li>
          <strong>{'{"PERSISTENT"}'}</strong> — keeps the group visible even
          when the user switches to another tool. Without it, the group only
          shows while the group's registering tool is active.
        </li>
        <li>
          <strong>{'{"SCALE"}'}</strong> (optional) — maps{" "}
          <code>scale_basis</code> to world-space units instead of screen-space
          pixels. Omit if you want circles that stay the same visual size
          regardless of zoom level.
        </li>
      </ul>

      <h2 className="mt-6 text-lg font-semibold">
        Gizmo types and target binding
      </h2>
      <ul className="mt-2 list-disc pl-6 space-y-1 text-sm">
        <li>
          <code>GIZMO_GT_primitive_3d</code> — display-only shape (set{" "}
          <code>draw_style</code> to <code>'CIRCLE'</code>,{" "}
          <code>'CROSS_2D'</code>, or <code>'SQUARE_I'</code>). Pair with{" "}
          <code>target_set_operator()</code> for click interaction.
        </li>
        <li>
          <code>GIZMO_GT_arrow_3d</code> — directional arrow, draggable along
          its axis. Bind target <code>"offset"</code> (scalar float) via{" "}
          <code>target_set_prop("offset", data, prop_path)</code>.
        </li>
        <li>
          <code>GIZMO_GT_dial_3d</code> / <code>GIZMO_GT_move_3d</code> —
          rotation ring and three-axis translation handle. Both use target{" "}
          <code>"offset"</code>.
        </li>
      </ul>
      <p className="mt-2">
        <code>target_set_operator(idname)</code> returns an operator-properties
        object. Assign any <code>bpy.props</code>-typed attributes on it before
        the first draw — they are passed to <code>execute()</code> on click.
        This is how the circle gizmo fires{" "}
        <code>HOLOFLOW_OT_toggle_facet_tag</code> with the correct{" "}
        <code>object_name</code> pre-filled — the same mechanism the{" "}
        <Link href="/tutorials/blender-tutorial-python-bpy-collection-property-uilist-export-queue" className={lk}>
          export queue panel
        </Link>{" "}
        uses to pass object references into operators.
      </p>

      <h2 className="mt-6 text-lg font-semibold">
        matrix_basis — world-space placement
      </h2>
      <pre className="mt-2 overflow-x-auto rounded bg-neutral-900 p-3 text-xs text-green-300">
        {`# Flat circle at a point — Matrix.Translation gives identity rotation
gz.matrix_basis = mathutils.Matrix.Translation((x, y, z))

# Arrow aligned to object's local axes — MUST normalise to strip
# non-uniform scale, otherwise scale bakes into the arrow length
gz.matrix_basis = obj.matrix_world.normalized()`}
      </pre>

      <h2 className="mt-6 text-lg font-semibold">poll() and the Overlays toggle</h2>
      <p className="mt-2">
        Checking <code>context.space_data.overlay.show_overlays</code> in{" "}
        <code>poll()</code> makes the GizmoGroup respect the artist's global
        Overlays toggle (top-right of the 3D View). When the artist toggles
        overlays, poll is re-evaluated and the group vanishes or reappears with
        no extra code. Runtime registration (calling{" "}
        <code>bpy.utils.register_class</code> /
        <code>unregister_class</code> from panel buttons) forces{" "}
        <code>setup()</code> to re-run with current scene state, which is the
        correct way to refresh gizmo count after objects are added or deleted.
      </p>

      <h2 className="mt-6 text-lg font-semibold">Troubleshooting</h2>
      <ul className="mt-2 list-disc pl-6 space-y-1 text-sm">
        <li>
          <strong>Gizmos not appearing</strong>: confirm <code>bl_options</code>{" "}
          includes <code>'3D'</code>. Without it matrices are ignored and the
          gizmo sits at screen (0,0).
        </li>
        <li>
          <strong>Circles not tracking moving objects</strong>: you updated{" "}
          <code>matrix_basis</code> in <code>setup()</code>. Move it to{" "}
          <code>refresh()</code> — setup runs once, refresh runs on each context
          change.
        </li>
        <li>
          <strong>Arrow distorted on non-uniform scaled objects</strong>: use{" "}
          <code>obj.matrix_world.normalized()</code>, not raw{" "}
          <code>obj.matrix_world</code>.
        </li>
        <li>
          <strong>target_set_operator props not reaching execute()</strong>:
          properties must be declared as <code>bpy.props</code> annotations on
          the operator class. Plain Python attributes are not serialised through
          the operator call path.
        </li>
      </ul>

      <h2 className="mt-6 text-lg font-semibold">Outside sources</h2>
      <ul className="mt-2 list-disc pl-6 space-y-1 text-sm">
        <li>
          Blender Foundation —{" "}
          <a
            href="https://docs.blender.org/api/current/bpy.types.GizmoGroup.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            bpy.types.GizmoGroup API reference
          </a>{" "}
          — CC-BY Blender Foundation. Parent org:{" "}
          <a
            href="https://projects.blender.org/blender/blender"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            blender/blender
          </a>
          {"; "}sibling repos: blender/blender-addons, blender/blender-extensions.
        </li>
        <li>
          Blender Foundation —{" "}
          <a
            href="https://projects.blender.org/blender/blender/src/branch/main/scripts/templates_py/gizmo_custom_geometry.py"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            gizmo_custom_geometry.py template
          </a>{" "}
          — MIT / CC0. Access via Blender Text Editor → Templates → Python →
          Gizmo Custom Geometry. The canonical minimal example from the Blender
          source tree. Sibling repo: blender/blender-addons.
        </li>
      </ul>

      <p className="mt-4 text-sm text-neutral-400">
        Reusable macro at{" "}
        <code>tools/blender-addon/holoflow_macros/gizmo_facet_overlay.py</code>
        — import <code>register_facet_overlay</code> /{" "}
        <code>unregister_facet_overlay</code> into the main add-on register
        functions to activate the overlay on add-on load.
      </p>
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
        body: "Open Blender 5.1 → Scripting workspace → open blueprint.py → Run Script. Three cubes appear: Prop_Tagged_A, Prop_Tagged_B (holoflow:facet = 1), and Prop_Untagged.",
      },
      {
        title: "Verify gizmo circles",
        body: "Switch to Layout workspace. Green circles should appear above Prop_Tagged_A and Prop_Tagged_B; Prop_Untagged has a dim grey circle. Hover over a green circle — it highlights yellow.",
      },
      {
        title: "Click to toggle",
        body: "Click the green circle above Prop_Tagged_A. The circle dims to grey and the arrow disappears. Check Object Properties → Custom Properties: holoflow:facet = 0. Press Ctrl+Z — circle turns green again (undo chain works).",
      },
      {
        title: "Move an object",
        body: "Select Prop_Tagged_B. Press G → move it to a new position. The green circle tracks the object — this is refresh() responding to context changes.",
      },
      {
        title: "Rotate and watch the arrow pivot",
        body: "With Prop_Tagged_B selected, press R → X → 45 Enter. The arrow gizmo pivots because gz_a.matrix_basis = obj.matrix_world.normalized() is recalculated in refresh().",
      },
      {
        title: "Toggle Overlays",
        body: "Click the Overlays button (top-right of the 3D View). All gizmos disappear. Toggle back on — gizmos reappear. This demonstrates poll() checking show_overlays.",
      },
      {
        title: "Run record.py for viewport.mp4",
        body: "Open record.py → Run Script. 120 PNG frames render via Workbench. Copy and run the printed ffmpeg command to produce viewport.mp4 in the videos/ directory.",
      },
      {
        title: "Capture screen.mp4",
        body: "Follow SCREEN-RECORDING-NOTES.md. Key takes: draw_handler contrast, setup/refresh walkthrough, click-toggle with undo, arrow pivot on rotate, Overlays toggle. Save to videos/scripting/python-gizmo-group-custom-viewport-handle/screen.mp4.",
      },
    ],
  },
  {
    slug: "blender-tutorial-python-gizmo-group-custom-viewport-handle",
    title:
      "Python bpy.types.GizmoGroup — Persistent Viewport Gizmo Overlay for Holoflow Facet Tags (Blender 5.1)",
    date: "2026-07-03",
    kind: "tutorial",
    excerpt:
      "Register a persistent 3D viewport overlay using bpy.types.GizmoGroup — the same API that drives Blender's own Move/Rotate/Scale handles. The group polls for holoflow:facet tagged objects, plants a GIZMO_GT_primitive_3d circle above each one, and aligns a GIZMO_GT_arrow_3d to its local +Y export axis. Covers the setup() vs refresh() allocation boundary, bl_options {'3D','PERSISTENT'}, target_set_operator() for click-toggle with full undo support, matrix_basis from mathutils, and poll() integration with the global Overlays toggle. Distinct from GN Gizmo nodes (require an active Node Tool) and draw_handler_add (no hover or undo semantics).",
    Body: PythonGizmoGroupBody,
  },
);
