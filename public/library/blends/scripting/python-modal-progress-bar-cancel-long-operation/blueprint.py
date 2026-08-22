"""
TUTORIAL: Python — Modal Progress Bar + Cancellable Batch Processor
Blender 5.1 | bpy.types.WindowManager · Modal Operator · TIMER event
Licence: CC0 (this file)
Tutorial: https://holoflow.co.uk/tutorials/blender-tutorial-python-modal-progress-bar-cancel-long-operation

TECHNIQUE
=========
Blender is single-threaded from Python's perspective: a tight for-loop
over hundreds of mesh objects blocks the entire UI until it completes.
The correct pattern is a cooperative chunked loop driven by a modal TIMER
event. Each tick processes a fixed slice of work, calls wm.progress_update(),
then returns PASS_THROUGH — yielding back to the event loop so the header
bar redraws, the viewport remains responsive, and ESC / RMB can cancel.

WHY NOT threading.Thread
========================
Python's GIL does not protect Blender's C internals. Blender's depsgraph
evaluation, modifier stack, and mesh data can be mutated mid-frame by
Blender's own evaluation loop; concurrent Python + bpy access produces
silent data corruption or hard crashes, not clean race conditions.
Use TIMER-based cooperative multitasking: one thread, one slice per tick.

DEMO
====
Applies a Triangulate modifier to every mesh object in the scene in
CHUNK_SIZE-object slices, showing a live header progress bar and reporting
per-object status. The user can cancel at any tick boundary with ESC or RMB.
Bake uses the depsgraph direct-API path (not bpy.ops.object.modifier_apply)
so no VIEW_3D context is required inside the TIMER handler.

OUTSIDE SOURCES
===============
- Blender Python API reference, bpy.types.WindowManager
  Blender Foundation · CC-BY-SA 4.0
  https://docs.blender.org/api/current/bpy.types.WindowManager.html
- Robert Guetzkow — blender-python-examples
  MIT Licence · https://github.com/robertguetzkow/blender-python-examples
  Related: blender/blender (GPL-v3, not used), CGCookie Python tutorials
"""

import bpy

# ── tuneable constants ──────────────────────────────────────────────────
CHUNK_SIZE   = 3        # mesh objects processed per TIMER tick
TIMER_SECS   = 0.05     # seconds between ticks  (≈20 cooperative "fps")
MOD_NAME     = "HL_Triangulate"  # modifier name — used as idempotency key
# ────────────────────────────────────────────────────────────────────────


def _collect_targets(context):
    """All mesh objects in the active view-layer, evaluation order."""
    return [o for o in context.view_layer.objects if o.type == 'MESH']


def _process_one(obj, context):
    """
    Apply Triangulate to a single mesh object.

    WHY direct data-API instead of bpy.ops.object.modifier_apply:
    bpy.ops operators require an active + selected object and a VIEW_3D
    context. Inside a TIMER handler neither is guaranteed. The depsgraph
    path (evaluated_get → new_from_object → swap mesh.data) works from
    any context, including headless --background runs.
    """
    if MOD_NAME in obj.modifiers:
        return  # idempotent: already processed this session

    mod = obj.modifiers.new(name=MOD_NAME, type='TRIANGULATE')
    mod.min_vertices       = 5      # tris and quads pass through unmodified
    mod.keep_custom_normals = True  # preserve hard edges from split normals

    depsgraph = context.evaluated_depsgraph_get()
    ob_eval   = obj.evaluated_get(depsgraph)
    new_mesh  = bpy.data.meshes.new_from_object(ob_eval, depsgraph=depsgraph)

    old_mesh  = obj.data
    obj.data  = new_mesh
    obj.modifiers.remove(mod)                       # baked; remove the entry
    bpy.data.meshes.remove(old_mesh, do_unlink=True)

    print(f"[HL] triangulated: {obj.name}")


class HL_OT_BatchProgress(bpy.types.Operator):
    """
    Batch-process all scene meshes with a header progress bar.
    Runs in cooperative chunks; cancel with ESC or RMB at any tick.
    """
    bl_idname  = "holoflow.batch_progress"
    bl_label   = "Holoflow Batch with Progress Bar"
    bl_options = {'REGISTER', 'UNDO'}

    # Per-invocation state stored as instance attributes.
    # Class-level type annotations are for clarity only — Python sets them
    # on self inside invoke(), not on the class.
    _targets : list
    _index   : int
    _total   : int
    _timer   : object   # bpy.types.Timer handle

    @classmethod
    def poll(cls, context):
        return context.mode == 'OBJECT'

    # ------------------------------------------------------------------
    def invoke(self, context, event):
        self._targets = _collect_targets(context)
        self._total   = len(self._targets)
        self._index   = 0

        if not self._total:
            self.report({'WARNING'}, "No mesh objects in scene.")
            return {'CANCELLED'}

        wm = context.window_manager
        wm.progress_begin(0, self._total)   # open the header progress bar

        # TIMER fires every TIMER_SECS seconds, keeping the operator alive
        # in the modal loop between ticks.
        self._timer = wm.event_timer_add(TIMER_SECS, window=context.window)
        wm.modal_handler_add(self)

        return {'RUNNING_MODAL'}

    # ------------------------------------------------------------------
    def modal(self, context, event):
        if event.type == 'TIMER':
            return self._tick(context)

        # User cancel via keyboard / RMB.
        if event.type in {'ESC', 'RIGHTMOUSE'} and event.value == 'PRESS':
            return self.cancel(context)

        # All other events (MOUSEMOVE, etc.) pass through so the viewport
        # stays interactive — orbit, pan, zoom all work during the batch.
        return {'PASS_THROUGH'}

    # ------------------------------------------------------------------
    def _tick(self, context):
        """Process CHUNK_SIZE objects; update progress bar; yield."""
        wm = context.window_manager

        for _ in range(CHUNK_SIZE):
            if self._index >= self._total:
                break
            obj = self._targets[self._index]
            try:
                _process_one(obj, context)
            except Exception as exc:
                self.report({'WARNING'}, f"Skipped {obj.name}: {exc}")
            self._index += 1
            wm.progress_update(self._index)

        # Force the header area to repaint so the progress bar moves.
        for area in context.screen.areas:
            if area.type == 'VIEW_3D':
                area.tag_redraw()
                break

        if self._index >= self._total:
            return self._finish(context)

        return {'RUNNING_MODAL'}

    # ------------------------------------------------------------------
    def _finish(self, context):
        self._cleanup(context)
        self.report({'INFO'}, f"Done — {self._total} meshes processed.")
        return {'FINISHED'}

    def cancel(self, context):
        done = self._index
        self._cleanup(context)
        self.report({'INFO'}, f"Cancelled after {done} / {self._total}.")
        return {'CANCELLED'}

    def _cleanup(self, context):
        """MUST be called on all exit paths — removes timer + closes bar."""
        wm = context.window_manager
        if self._timer is not None:
            wm.event_timer_remove(self._timer)
            self._timer = None
        wm.progress_end()          # closes the header progress widget


# ── Trigger panel ───────────────────────────────────────────────────────

class HL_PT_BatchProgress(bpy.types.Panel):
    bl_label       = "Holoflow Batch"
    bl_space_type  = 'VIEW_3D'
    bl_region_type = 'UI'
    bl_category    = 'Holoflow'

    def draw(self, context):
        self.layout.operator("holoflow.batch_progress", icon='FILE_REFRESH')


# ── Register ────────────────────────────────────────────────────────────

CLASSES = [HL_OT_BatchProgress, HL_PT_BatchProgress]


def register():
    for cls in CLASSES:
        bpy.utils.register_class(cls)


def unregister():
    for cls in reversed(CLASSES):
        bpy.utils.unregister_class(cls)


if __name__ == "__main__":
    register()
    bpy.ops.holoflow.batch_progress('INVOKE_DEFAULT')
