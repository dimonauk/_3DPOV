# ====================================================================
# Blueprint: bpy.props.CollectionProperty + bpy.types.UIList
#            Dynamic Export Queue Panel — Holoflow WebXR Batch Export
# Blender 5.1 | Python Extension | CC0
# ====================================================================
#
# TECHNIQUE
# CollectionProperty is Blender's typed growable list: each item is a
# PropertyGroup instance stored in RNA (not a Python list, so Blender
# handles undo, serialisation, and ID ownership automatically).
# UIList renders the collection as a scrollable rows widget — identical
# in mechanism to the material slot list, the shape key list, or the
# vertex group list. The "active index" idiom binds them: an IntProperty
# on the same data-block tracks which row is selected; three operators
# (Add / Remove / Move) are the only valid mutation paths.
#
# WHY this over a plain Python list:
#   — RNA properties survive Ctrl+Z / Ctrl+Y intact.
#   — They are serialised into the .blend with zero extra code.
#   — PointerProperty(type=Object) tracks renames; a stored object name
#     breaks silently when the user renames the mesh.
#
# PARAMETERS ─ adjust before running Alt+P
PANEL_CATEGORY   = "Holoflow"
DRACO_DEFAULT    = 6       # studio default — Draco level 6 is a good balance
MAX_ROWS_VISIBLE = 5       # rows shown before scroll handle appears

import bpy
from bpy.props import (
    BoolProperty, CollectionProperty, EnumProperty,
    FloatProperty, IntProperty, PointerProperty,
)
from bpy.types import Operator, Panel, PropertyGroup, UIList


# ── 1. Per-item PropertyGroup ─────────────────────────────────────────────
class HLF_ExportQueueItem(PropertyGroup):
    """One row in the export queue.  Stored in Scene.hlf_export_queue."""

    obj: PointerProperty(
        name="Object",
        type=bpy.types.Object,
        description="Mesh to include in this queue slot",
    )
    include: BoolProperty(
        name="",
        description="Toggle without removing the slot",
        default=True,
    )
    export_format: EnumProperty(
        name="Fmt",
        items=[
            ("GLB",  "GLB",  "Single-file binary GLTF for Three.js / WebXR"),
            ("GLTF", "GLTF", "Separate JSON + bin (easier to inspect)"),
        ],
        default="GLB",
    )
    draco_level: IntProperty(
        name="Draco", default=DRACO_DEFAULT, min=1, max=10,
        description="Draco mesh compression level; 6 = studio default",
    )
    # PointerProperty to Object is more robust than storing the name as a
    # StringProperty: if the user renames the object the pointer follows it.


# ── 2. UIList widget ─────────────────────────────────────────────────────
class HLF_UL_ExportQueue(UIList):
    """Draws one row of the export queue.  template_list() calls draw_item()
    once per visible row; Blender owns scroll, selection, and drag-reorder."""

    bl_idname = "HLF_UL_export_queue"

    def draw_item(self, context, layout, data, item, icon, active_data,
                  active_propname, index):
        row = layout.row(align=True)

        # Left-most toggle: include / exclude without deleting the slot.
        row.prop(item, "include", emboss=False,
                 icon="CHECKBOX_HLT" if item.include else "CHECKBOX_DEHLT")

        # Object picker — colour-coded by type, empty label when None.
        sub = row.row()
        sub.alert = item.obj is None  # red tint warns when slot is empty
        sub.prop(item, "obj", text="", icon="OBJECT_DATA")

        # Compact per-item controls on the right.
        row.prop(item, "export_format", text="")
        row.prop(item, "draco_level", text="D")


# ── 3. Add operator ───────────────────────────────────────────────────────
class HLF_OT_QueueAdd(Operator):
    """Append a slot to the export queue (uses active object if any)."""
    bl_idname = "hlf.queue_add"
    bl_label  = "Add to Queue"
    bl_options = {"REGISTER", "UNDO"}

    def execute(self, context):
        queue = context.scene.hlf_export_queue
        item  = queue.add()
        # Pre-fill with the active object so one click is the common path.
        item.obj = context.active_object
        item.draco_level = DRACO_DEFAULT
        # Keep the new row selected.
        context.scene.hlf_export_queue_index = len(queue) - 1
        return {"FINISHED"}


# ── 4. Remove operator ────────────────────────────────────────────────────
class HLF_OT_QueueRemove(Operator):
    """Remove the selected slot from the export queue."""
    bl_idname = "hlf.queue_remove"
    bl_label  = "Remove from Queue"
    bl_options = {"REGISTER", "UNDO"}

    @classmethod
    def poll(cls, context):
        return bool(context.scene.hlf_export_queue)

    def execute(self, context):
        queue = context.scene.hlf_export_queue
        idx   = context.scene.hlf_export_queue_index
        queue.remove(idx)
        # Clamp active index so it stays on a valid row.
        context.scene.hlf_export_queue_index = max(0, min(idx, len(queue) - 1))
        return {"FINISHED"}


# ── 5. Move operator ─────────────────────────────────────────────────────
class HLF_OT_QueueMove(Operator):
    """Shift the selected slot up or down."""
    bl_idname = "hlf.queue_move"
    bl_label  = "Move Queue Item"
    bl_options = {"REGISTER", "UNDO"}

    direction: EnumProperty(items=[("UP", "Up", ""), ("DOWN", "Down", "")])

    @classmethod
    def poll(cls, context):
        return len(context.scene.hlf_export_queue) > 1

    def execute(self, context):
        queue = context.scene.hlf_export_queue
        idx   = context.scene.hlf_export_queue_index
        step  = -1 if self.direction == "UP" else 1
        target = (idx + step) % len(queue)
        queue.move(idx, target)
        context.scene.hlf_export_queue_index = target
        return {"FINISHED"}


# ── 6. Batch export operator ──────────────────────────────────────────────
class HLF_OT_BatchExport(Operator):
    """Export all ticked queue items to //exports/<name>.<fmt>."""
    bl_idname  = "hlf.batch_export"
    bl_label   = "Batch Export Queue"
    bl_options = {"REGISTER"}

    def execute(self, context):
        exported = []
        skipped  = []
        for item in context.scene.hlf_export_queue:
            if not item.include or item.obj is None:
                skipped.append(item.obj.name if item.obj else "<empty>")
                continue
            # Build output path relative to .blend file location.
            out_dir  = bpy.path.abspath("//exports/")
            out_file = f"{out_dir}{item.obj.name}.{item.export_format.lower()}"
            # Deselect all, select only this object, then export.
            bpy.ops.object.select_all(action="DESELECT")
            item.obj.select_set(True)
            context.view_layer.objects.active = item.obj
            bpy.ops.export_scene.gltf(
                filepath=out_file,
                export_format=item.export_format,
                use_selection=True,
                export_draco_mesh_compression_enable=(item.draco_level > 0),
                export_draco_mesh_compression_level=item.draco_level,
                export_yup=True,
                export_apply=True,
            )
            exported.append(item.obj.name)
        self.report(
            {"INFO"},
            f"Exported {len(exported)} item(s); skipped {len(skipped)}.",
        )
        return {"FINISHED"}


# ── 7. Sidebar panel ─────────────────────────────────────────────────────
class HLF_PT_ExportQueue(Panel):
    """View3D → N-panel → Holoflow → Export Queue."""
    bl_label       = "Export Queue"
    bl_idname      = "HLF_PT_export_queue"
    bl_space_type  = "VIEW_3D"
    bl_region_type = "UI"
    bl_category    = PANEL_CATEGORY

    def draw(self, context):
        layout = self.layout
        scene  = context.scene

        # UIList + active index + Add / Remove column beside it.
        row = layout.row()
        row.template_list(
            "HLF_UL_export_queue", "",           # listtype_name, list_id
            scene, "hlf_export_queue",            # data, propname
            scene, "hlf_export_queue_index",      # active_data, active_propname
            rows=MAX_ROWS_VISIBLE,
        )
        col = row.column(align=True)
        col.operator("hlf.queue_add",    text="", icon="ADD")
        col.operator("hlf.queue_remove", text="", icon="REMOVE")
        col.separator()
        op = col.operator("hlf.queue_move", text="", icon="TRIA_UP")
        op.direction = "UP"
        op = col.operator("hlf.queue_move", text="", icon="TRIA_DOWN")
        op.direction = "DOWN"

        layout.separator()
        layout.operator("hlf.batch_export", icon="EXPORT")


# ── Registration ─────────────────────────────────────────────────────────
_CLASSES = [
    HLF_ExportQueueItem,
    HLF_UL_ExportQueue,
    HLF_OT_QueueAdd,
    HLF_OT_QueueRemove,
    HLF_OT_QueueMove,
    HLF_OT_BatchExport,
    HLF_PT_ExportQueue,
]


def register():
    for cls in _CLASSES:
        bpy.utils.register_class(cls)
    # Attach the collection and its active-index sibling to Scene.
    # CollectionProperty MUST be registered AFTER its item class.
    bpy.types.Scene.hlf_export_queue = CollectionProperty(
        type=HLF_ExportQueueItem,
        name="Export Queue",
    )
    bpy.types.Scene.hlf_export_queue_index = bpy.props.IntProperty(
        name="Active Export Item", default=0,
    )


def unregister():
    del bpy.types.Scene.hlf_export_queue
    del bpy.types.Scene.hlf_export_queue_index
    for cls in reversed(_CLASSES):
        bpy.utils.unregister_class(cls)


def _seed_demo_queue():
    """Populate the queue with demo objects for a fresh test scene."""
    scene = bpy.context.scene
    demo_names = ["env_wall_a", "accent_gem", "floor_tile_01"]
    for name in demo_names:
        # Create a trivial placeholder mesh for each demo slot.
        mesh = bpy.data.meshes.new(name)
        obj  = bpy.data.objects.new(name, mesh)
        scene.collection.objects.link(obj)
        item     = scene.hlf_export_queue.add()
        item.obj = obj
    scene.hlf_export_queue_index = 0


if __name__ == "__main__":
    register()
    _seed_demo_queue()
