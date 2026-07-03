import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        A Blender pie menu is a radial context menu that appears at the cursor
        position when you press a hotkey — eight directional slots arranged in a
        compass rose, each triggered by moving the mouse and releasing. This
        tutorial registers a custom <code>bpy.types.Menu</code> subclass bound
        to <strong>Shift+Space</strong> in the 3D View, surfacing eight
        Holoflow studio operations without a single sidebar trip: facet tagging,
        GLB export, UV seam marking, modifier application, delta-transform
        reset, pose freeze, sidebar toggle, and a quick UV split. After twenty
        minutes of use the direction-to-action mapping becomes proprioceptive —
        no eyes-to-panel glance needed.
      </p>

      <h2 className="mt-6 text-lg font-semibold">
        bpy.types.Menu vs bpy.types.Panel — which to subclass
      </h2>
      <p className="mt-2">
        <code>bpy.types.Panel</code> is persistent, anchored to a sidebar or
        properties region, and survives between interactions. A{" "}
        <Link
          href="/tutorials/blender-tutorial-python-custom-panel-operator-n-panel-sidebar"
          className={lk}
        >
          custom N-Panel
        </Link>{" "}
        is the right choice when you need configuration inputs. A{" "}
        <code>bpy.types.Menu</code> is transient — it dismisses on any click or
        Escape — and costs nothing in UI real estate. Pie menus (a subtype
        invoked with <code>wm.call_menu_pie</code>) add spatial memory: slot
        direction is constant so the gesture becomes reflexive rather than
        deliberate.
      </p>

      <h2 className="mt-6 text-lg font-semibold">
        layout.menu_pie() — the slot order contract
      </h2>
      <p className="mt-2">
        Inside <code>draw(self, ctx)</code>, call{" "}
        <code>pie = self.layout.menu_pie()</code> first. Every subsequent{" "}
        <code>pie.operator()</code> / <code>pie.menu()</code> /{" "}
        <code>pie.separator()</code> fills slots in strict order:
      </p>
      <pre className="mt-2 overflow-x-auto rounded bg-neutral-900 p-3 text-xs text-green-300">
        {`call 1 → W     call 2 → E     call 3 → S     call 4 → N
call 5 → NW    call 6 → NE    call 7 → SW    call 8 → SE`}
      </pre>
      <p className="mt-2">
        A <code>pie.separator()</code> burns a slot to keep neighbours in their
        expected positions. The WHY: diagonals (NW/NE/SW/SE) are always calls
        5–8, so you must fill all four cardinal slots even if one is unused.
      </p>

      <h2 className="mt-6 text-lg font-semibold">
        Keymap registration — addon keyconfig scope
      </h2>
      <p className="mt-2">
        The keymap entry must live in{" "}
        <code>wm.keyconfigs.addon</code>, not{" "}
        <code>keyconfigs.user</code>, so it is removed cleanly on
        unregister. The pattern matches the one used in the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-addon-preferences-keymap-hotkey-exporter"
          className={lk}
        >
          Addon Preferences & Keymap tutorial
        </Link>
        :
      </p>
      <pre className="mt-2 overflow-x-auto rounded bg-neutral-900 p-3 text-xs text-green-300">
        {`_ADDON_KEYMAPS = []

def register():
    for cls in CLASSES:
        bpy.utils.register_class(cls)

    wm = bpy.context.window_manager
    kc = wm.keyconfigs.addon
    if kc:
        km  = kc.keymaps.new(name='3D View', space_type='VIEW_3D')
        kmi = km.keymap_items.new(
            'holoflow.call_pie_rigging_export',
            type='SPACE', value='PRESS', shift=True,
        )
        _ADDON_KEYMAPS.append((km, kmi))

def unregister():
    for km, kmi in _ADDON_KEYMAPS:
        km.keymap_items.remove(kmi)
    _ADDON_KEYMAPS.clear()
    for cls in reversed(CLASSES):
        bpy.utils.unregister_class(cls)`}
      </pre>
      <p className="mt-2">
        <strong>WHY reversed(CLASSES) on unregister?</strong>{" "}
        Blender&apos;s class registry maintains internal references between
        operator, menu, and panel types. Unregistering in reverse insertion
        order ensures that a class which references another (e.g. a Panel that
        draws an Operator button) is always removed before its dependencies.
      </p>

      <h2 className="mt-6 text-lg font-semibold">
        The invoker pattern — why a wrapper operator
      </h2>
      <p className="mt-2">
        <code>wm.call_menu_pie(name="HOLOFLOW_MT_pie_rigging_export")</code>{" "}
        cannot be called directly from a keymap entry in all Blender versions —
        the keymap expects an operator <code>bl_idname</code>, not a menu id.
        The thin wrapper <code>HOLOFLOW_OT_call_pie</code> is the canonical
        workaround from Blender&apos;s own template scripts:
      </p>
      <pre className="mt-2 overflow-x-auto rounded bg-neutral-900 p-3 text-xs text-green-300">
        {`class HOLOFLOW_OT_call_pie(bpy.types.Operator):
    bl_idname = 'holoflow.call_pie_rigging_export'
    bl_label  = 'Holoflow Pie Menu'

    def invoke(self, ctx, event):
        bpy.ops.wm.call_menu_pie(name='HOLOFLOW_MT_pie_rigging_export')
        return {'FINISHED'}`}
      </pre>

      <h2 className="mt-6 text-lg font-semibold">
        Slot design rationale
      </h2>
      <p className="mt-2">
        Muscle memory maps thumb-up to North, thumb-down to South. North
        gets the most frequent action — <strong>Tag Facet</strong> — because in
        a dress rehearsal session that is pressed once per prop. East gets
        export (the terminal action, dominant-hand direction). South gets
        destructive Apply Modifiers (low = danger zone in the UI mental model).
        West gets Mark Seams (preparatory, returns you to normal workflow).
        Diagonals carry secondary utility: sidebar toggle, delta-transform
        reset, pose freeze, and UV split.
      </p>
      <p className="mt-2">
        The <strong>UV split</strong> slot (SE) opens a new editor region
        rather than switching a panel — this is intentional. Switching space
        type would lose the 3D viewport context. A vertical split preserves
        both, letting you immediately see the UV seam result from the W slot
        action without a workspace switch. Compare with the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-workspace-tool-custom-toolbar-facet-tag"
          className={lk}
        >
          custom toolbar tool
        </Link>{" "}
        which operates on a single selected object; the pie is a workflow-level
        orchestration above that.
      </p>

      <h2 className="mt-6 text-lg font-semibold">
        GLB export operator — extras flag carries holoflow:facet
      </h2>
      <p className="mt-2">
        The <code>export_extras=True</code> kwarg on{" "}
        <code>bpy.ops.export_scene.gltf</code> serialises all custom object
        properties into the GLB&apos;s <code>extras</code> JSON object. This is
        how <code>holoflow:facet = 1</code> survives the export pipeline and
        arrives in the Three.js scene. The same flag is used in the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-cycles-batch-bake-normal-ao-emission-webxr"
          className={lk}
        >
          batch bake pipeline
        </Link>{" "}
        and the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-gltf-user-extension-export-extras-hook"
          className={lk}
        >
          glTF user-extension hook
        </Link>
        .
      </p>

      <h2 className="mt-6 text-lg font-semibold">Outside sources</h2>
      <ul className="mt-2 list-disc space-y-2 pl-6 text-sm">
        <li>
          Blender Foundation —{" "}
          <a
            href="https://projects.blender.org/blender/blender/src/branch/main/scripts/templates_py/ui_pie_menu.py"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            scripts/templates/ui_pie_menu.py
          </a>{" "}
          — <strong>Apache-2.0</strong>. The canonical minimal pie menu example
          shipped with Blender (Text Editor → Templates → Python → Pie Menu).
          The slot-order contract and invoker pattern in this tutorial derive
          from that template. Parent repo:{" "}
          <a
            href="https://projects.blender.org/blender/blender"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            blender/blender
          </a>
          ; siblings: blender/blender-addons, blender/blender-extensions.
        </li>
        <li>
          Blender Foundation —{" "}
          <a
            href="https://docs.blender.org/api/current/bpy.types.Menu.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            bpy.types.Menu API reference
          </a>{" "}
          — CC-BY-SA Blender Foundation. Covers{" "}
          <code>bl_idname</code>, <code>bl_label</code>, and the{" "}
          <code>draw()</code> context. Parent repo: blender/blender.
        </li>
      </ul>

      <p className="mt-4 text-sm text-neutral-400">
        Reusable macro at{" "}
        <code>tools/blender-addon/holoflow_macros/pie_menu_toolkit.py</code> —
        call <code>register()</code> / <code>unregister()</code> from your
        add-on&apos;s registration hooks to activate the Shift+Space pie on
        add-on load.
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
        body: "Open Blender 5.1 → Scripting workspace → open blueprint.py → Run Script (Alt+P). Three mesh props appear: Prop_Panel_A, Prop_Panel_B (holoflow:facet = 1), and Prop_Untagged. The pie menu is now registered.",
      },
      {
        title: "Open pie in 3D View",
        body: "Switch to Layout workspace. Click anywhere in the 3D View. Press Shift+Space — the eight-slot Holoflow pie appears at the cursor. Move the mouse slowly across each slot without clicking.",
      },
      {
        title: "Tag Facet (N slot)",
        body: "Select Prop_Untagged. Press Shift+Space and move the cursor North. Click Tag Facet. In Object Properties → Custom Properties: holoflow:facet = 1 appears. Press Ctrl+Z to confirm undo works.",
      },
      {
        title: "Quick GLB Export (E slot)",
        body: "Save the .blend file (Ctrl+S) so the // path resolves. Select Prop_Panel_A. Press Shift+Space → East → Quick GLB. Confirm the Info bar reports a path ending in .glb. Find it in the exports/ folder.",
      },
      {
        title: "Mark Seams (W slot)",
        body: "Select any prop. Press Shift+Space → West → Mark Seams. Press Tab to enter Edit mode — red seam edges trace the sharp-edge boundary. Tab back to Object mode.",
      },
      {
        title: "Apply All Modifiers (S slot)",
        body: "Press A to select all three props. Press Shift+Space → South → Apply Modifiers. In Properties Editor → Modifier tab: the Bevel_Demo modifier is gone from all three objects.",
      },
      {
        title: "Run record.py",
        body: "Open record.py → Run Script. 90 PNG frames render via Workbench. The console prints the ffmpeg command — run it to produce viewport.mp4 in the videos/ directory.",
      },
      {
        title: "Capture screen.mp4",
        body: "Follow SCREEN-RECORDING-NOTES.md. Key takes: script intro, pie overview hover, Tag Facet with undo, Quick GLB, Apply Modifiers, Mark Seams. Save to videos/scripting/python-custom-pie-menu-rigging-export-toolkit/screen.mp4.",
      },
    ],
  },
  {
    slug: "blender-tutorial-python-custom-pie-menu-rigging-export-toolkit",
    title:
      "Python bpy.types.Menu + Pie Menu — 8-Slot Radial Toolset for Holoflow Studio (Blender 5.1)",
    date: "2026-07-03",
    kind: "tutorial",
    excerpt:
      "Register a custom bpy.types.Menu subclass as a pie menu bound to Shift+Space in the 3D View. Eight compass slots surface the Holoflow studio's most-used operations — facet tagging, GLB export, UV seam marking, modifier application, delta-transform reset, pose freeze, sidebar toggle, and UV split — without leaving the viewport. Covers the layout.menu_pie() slot-order contract (W E S N NW NE SW SE), the wm.call_menu_pie invoker pattern, addon keyconfig scope, reversed() unregister ordering, and the export_extras flag that carries holoflow:facet through the GLB pipeline.",
    Body,
  },
);
