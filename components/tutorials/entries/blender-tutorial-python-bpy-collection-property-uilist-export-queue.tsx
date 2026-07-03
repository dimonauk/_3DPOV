import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        Every list widget in Blender — material slots, shape keys, vertex
        groups, NLA tracks — shares one underlying mechanism:{" "}
        <code>CollectionProperty</code> on the data-block,{" "}
        <code>UIList</code> for the rows, and an <code>IntProperty</code>{" "}
        tracking the active index. This tutorial exposes that mechanism by
        building a real pipeline tool: a reorderable export queue in the
        Holoflow N-panel where each slot carries its own Draco level, format
        override, and non-destructive include toggle.{" "}
        <Link
          href="/tutorials/blender-tutorial-python-addon-custom-panel-property-group"
          className={lk}
        >
          The custom panel + PropertyGroup tutorial
        </Link>{" "}
        covers the base three-class architecture; this tutorial extends it
        with a fourth class — <code>UIList</code> — and the typed list that
        feeds it.
      </p>
      <p>
        The{" "}
        <Link
          href="/tutorials/blender-tutorial-python-batch-glb-exporter"
          className={lk}
        >
          batch GLB exporter tutorial
        </Link>{" "}
        shows how to collect and export every mesh in a scene without
        selection; the export queue here is the complement — Dimona hand-picks
        which objects go out, in what order, with what settings. The queue is
        stored as RNA (not a Python list), so every Add, Remove, and Move
        survives <kbd>Ctrl+Z</kbd> and is serialised into the <code>.blend</code>{" "}
        with zero extra code. <code>PointerProperty(type=bpy.types.Object)</code>{" "}
        is used rather than a name string: when Dimona renames a mesh, the
        pointer follows it — a string would silently break. See the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-file-handler-gltf-drag-drop-extension-extractor"
          className={lk}
        >
          GLB drag-drop extension extractor tutorial
        </Link>{" "}
        for the complementary ingestion side of the same pipeline.
      </p>
      <p>
        <code>UIList.draw_item()</code> is called once per visible row by
        Blender&rsquo;s <code>template_list()</code>; scroll, selection
        highlight, and drag-reorder handle are all provided for free.{" "}
        <code>draw_item()</code> receives the item as <code>data</code> and the
        collection as <code>active_data</code> — the naming is counterintuitive
        but consistent: <em>data</em> is the container, <em>item</em> is the
        current row. The row&rsquo;s <code>alert</code> property turns the
        object picker red when the slot is empty, giving instant visual
        feedback without a separate validation pass. Compare this reactive
        colouring approach with the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-msgbus-reactive-property-subscriptions"
          className={lk}
        >
          msgbus reactive subscription tutorial
        </Link>
        , which registers callbacks instead of polling in <code>draw()</code>.
      </p>
    </>
  );
}

const base: Entry = {
  slug: "blender-tutorial-python-bpy-collection-property-uilist-export-queue",
  title:
    "Python — bpy.props.CollectionProperty + bpy.types.UIList: Dynamic Export Queue Panel (Blender 5.1)",
  date: "2026-07-03",
  kind: "tutorial",
  excerpt:
    "Build a reorderable batch-export queue in Blender's N-panel using CollectionProperty " +
    "and UIList — the same mechanism as material slots and shape keys, now wired to a " +
    "per-item Draco level, format override, and non-destructive include toggle.",
  Body,
};

export const entry = buildInstructable(
  {
    blenderVersion: "5.1",
    libraryPath:
      "public/library/blends/scripting/python-bpy-collection-property-uilist-export-queue/",
    time: "one to two hours",
    difficulty: "intermediate",
    overview:
      "CollectionProperty is Blender's typed growable list — RNA-native, undo-safe, " +
      "serialised automatically into the .blend. UIList renders it as a scrollable " +
      "rows widget with selection, scroll, and drag-reorder handled by the engine. " +
      "This tutorial builds a complete Holoflow export queue: per-slot object pointer, " +
      "Draco level, format selector, and include toggle, wired to Add / Remove / Move " +
      "operators and a Batch Export button that iterates only the ticked items.",
    goal:
      "Understand the CollectionProperty → UIList → active_index → operator triangle " +
      "well enough to build any list-driven UI in a Blender add-on: export queues, " +
      "material presets, LOD variant lists, or animation clip managers.",
    software: [
      {
        name: "Blender",
        version: "5.1",
        url: "https://www.blender.org/download/",
        cost: "free",
        platforms: ["windows", "macos", "linux"],
      },
    ],
    prerequisites: [
      "Has completed or read the Custom Panel + PropertyGroup tutorial",
      "Comfortable with Python classes and type annotations",
      "Understands Blender's undo/redo and .blend serialisation model",
    ],
    steps: [
      {
        title: "Why CollectionProperty, not a Python list",
        body: `A Python list attached to a module-level variable is reset every time
Blender reloads the add-on, is invisible to Ctrl+Z, and is not saved in the .blend.

CollectionProperty stores its items as RNA — Blender's reflection system — which means:
  — Each item is a PropertyGroup instance with the same undo/redo semantics as
    any other property (scale, rotation, a Draco level).
  — The collection is serialised into the .blend alongside the scene data, no extra I/O.
  — Adding, removing, or reordering items generates an undo step automatically when
    the operator has bl_options = {"REGISTER", "UNDO"}.
  — PointerProperty(type=bpy.types.Object) inside the item group keeps a live reference
    to the Blender object — if the user renames it, the pointer follows.
    A StringProperty storing the object's name would silently break.

Register order matters: CollectionProperty MUST be attached to Scene AFTER
the item class is registered with bpy.utils.register_class(). Reverse-order
unregister is the mirror image.

bpy.types.Scene.hlf_export_queue = CollectionProperty(
    type=HLF_ExportQueueItem,   # ← must already be registered
    name="Export Queue",
)
bpy.types.Scene.hlf_export_queue_index = bpy.props.IntProperty(
    name="Active Export Item",
    default=0,
)

Delete both with del bpy.types.Scene.hlf_export_queue inside unregister().`,
      },
      {
        title: "UIList.draw_item() — drawing one row",
        body: `UIList is a class you subclass, not an operator you call. Override draw_item()
with the row layout; Blender handles everything else (scroll bar, selection highlight,
drag handle for reordering).

Signature:
  def draw_item(self, context, layout, data, item, icon, active_data,
                active_propname, index):

  — item      : current PropertyGroup instance (your HLF_ExportQueueItem)
  — data      : the object that OWNS the collection (bpy.types.Scene)
  — active_data / active_propname : used internally for selection colouring

Row layout recipe:
  row = layout.row(align=True)
  # 1. Checkbox — non-destructive include toggle.
  row.prop(item, "include", emboss=False,
           icon="CHECKBOX_HLT" if item.include else "CHECKBOX_DEHLT")
  # 2. Object picker — red when empty.
  sub = row.row()
  sub.alert = item.obj is None   # tints the picker red — no extra validation pass
  sub.prop(item, "obj", text="", icon="OBJECT_DATA")
  # 3. Compact per-item overrides.
  row.prop(item, "export_format", text="")
  row.prop(item, "draco_level",   text="D")

WHY emboss=False on the checkbox:
  The default emboss draws a raised button around bool props. Turning it off
  gives a flat icon toggle that reads as a list-cell control, matching Blender's
  own material slot eye-icon and render-visibility patterns.`,
      },
      {
        title: "template_list() — wiring UIList into the panel",
        body: `template_list() in the panel's draw() call glues the UIList class,
the CollectionProperty, and the active index together:

  row = layout.row()
  row.template_list(
      "HLF_UL_export_queue", "",           # bl_idname of your UIList subclass
      scene, "hlf_export_queue",            # data-block + collection propname
      scene, "hlf_export_queue_index",      # data-block + active index propname
      rows=5,                               # visible rows before scroll appears
  )

The column to the right holds Add / Remove / Move operators as icon-only buttons:
  col = row.column(align=True)
  col.operator("hlf.queue_add",    text="", icon="ADD")
  col.operator("hlf.queue_remove", text="", icon="REMOVE")
  col.separator()
  op = col.operator("hlf.queue_move", text="", icon="TRIA_UP")
  op.direction = "UP"
  op = col.operator("hlf.queue_move", text="", icon="TRIA_DOWN")
  op.direction = "DOWN"

This layout — list on the left, column of icon buttons on the right — is
Blender's canonical list-management idiom. Replicate it exactly so users
recognise the pattern instantly.`,
      },
      {
        title: "Add / Remove / Move — the three mutation operators",
        body: `CollectionProperty exposes three methods: .add(), .remove(index), .move(from, to).
These must be called from within bl_options={"REGISTER","UNDO"} operators — direct calls
from draw() would bypass undo.

ADD — append and select:
  item = scene.hlf_export_queue.add()
  item.obj  = context.active_object   # pre-fill with active object
  scene.hlf_export_queue_index = len(scene.hlf_export_queue) - 1

REMOVE — delete and clamp:
  idx = scene.hlf_export_queue_index
  scene.hlf_export_queue.remove(idx)
  # After remove, clamp so active_index stays on a valid row.
  scene.hlf_export_queue_index = max(0, min(idx, len(scene.hlf_export_queue) - 1))

MOVE — swap and track:
  step   = -1 if self.direction == "UP" else 1
  target = (idx + step) % len(queue)  # wraps at top/bottom
  queue.move(idx, target)
  scene.hlf_export_queue_index = target

WHY clamp on remove but wrap on move?
  Clamping on remove ensures the index is always in bounds — an out-of-bounds
  index causes a Python exception next time draw_item() runs. Wrapping on move
  is a UX choice (moving "up" from the first item cycles to the last, like many
  Blender list widgets).`,
      },
      {
        title: "Batch export — iterating the queue",
        body: `The export operator iterates the collection directly — no index needed:

  for item in context.scene.hlf_export_queue:
      if not item.include or item.obj is None:
          skipped.append(...)
          continue
      # Deselect all, activate only this object, export.
      bpy.ops.object.select_all(action="DESELECT")
      item.obj.select_set(True)
      context.view_layer.objects.active = item.obj
      bpy.ops.export_scene.gltf(
          filepath=out_file,
          export_format=item.export_format,    # "GLB" or "GLTF"
          use_selection=True,
          export_draco_mesh_compression_enable=(item.draco_level > 0),
          export_draco_mesh_compression_level=item.draco_level,
          export_yup=True,       # Three.js / WebXR convention
          export_apply=True,     # bake modifiers + transforms
      )

WHY iterate directly, not by index?
  Direct iteration is more readable and avoids off-by-one errors. RNA collections
  support Python's for-loop protocol; treating them as lists is idiomatic bpy.

Output path: bpy.path.abspath("//exports/") resolves the // prefix relative to
the .blend file location — essential for portable projects shared across machines.`,
      },
      {
        title: "Troubleshooting",
        body: `1. "CollectionProperty not registered" — RuntimeError on second Alt+P
   → The item class must be registered before the property is attached to Scene.
     Add a try/except unregister guard at the top of the script:
       try: bpy.utils.unregister_class(HLF_ExportQueueItem)
       except: pass

2. UIList draws blank rows
   → draw_item() raised an exception silently. Check the System Console
     (Window → Toggle System Console on Windows; launch from terminal on macOS/Linux).
     Common cause: item.obj is None and you accessed item.obj.name without a guard.

3. export_scene.gltf fails with "context is incorrect"
   → The operator requires an active VIEW_3D area. In a headless batch script,
     use bpy.context.temp_override(area=...) or switch to the data API:
     bpy.data.objects[name].to_mesh() + manual GLB writer.

4. CollectionProperty not saved in .blend after unregister
   → Expected — when the add-on is disabled, Scene loses the dynamic attribute.
     The items ARE saved if the add-on was registered when the file was saved;
     they are restored when the add-on is re-enabled on next open.

5. Drag-reorder in UIList not working
   → UIList drag-reorder requires bl_idname on the UIList class to match
     exactly what is passed to template_list() as the first argument.`,
      },
    ],
  },
  base
);
