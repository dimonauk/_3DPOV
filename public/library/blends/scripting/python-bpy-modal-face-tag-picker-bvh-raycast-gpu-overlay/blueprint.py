"""
Modal Face-Tag Picker with BVH Raycast & GPU Overlay — Blender 5.1 Blueprint
Holoflow Studio | CC0 | 2026-07-26

Technique:
  A modal operator that turns the mouse into a face-tagging brush.  Pressing F
  enters picker mode.  LMB-drag stamps holoflow_facet=1 on every face the ray
  hits; Ctrl+LMB-drag erases.  Esc or RMB exits and preserves the result.

  The BVH tree (mathutils.bvhtree.BVHTree) stores axis-aligned bounding boxes
  for every triangle and lets a single ray query run in O(log n) time.  It is
  built once at invoke() from the base mesh (no modifier evaluation) and cached
  for the session — rebuilding on every MOUSEMOVE event would be 10-100× slower
  on dense meshes.  The ray is unprojected from 2D screen space to world space
  via bpy_extras.view3d_utils, then transformed into the object's local space
  before being handed to the BVH.

  Per-face integer attributes (bm.faces.layers.int) are the right storage for
  mesh metadata: they persist through undo, survive GLB export as
  mesh.userData custom attributes, and are directly readable in Three.js via
  mesh.geometry.attributes.  The holoflow_facet attribute is the signal read
  by holoflow_webxr_exporter at export time (see tools/blender-addon/).

  The GPU draw handler (SpaceView3D.draw_handler_add POST_PIXEL) draws a
  screen-space amber quad at each tagged face centre projected with
  view3d_utils.location_3d_to_region_2d().  The batch is rebuilt whenever a
  face attribute changes — cheap because the relevant mesh is small.

External attribution:
  Blender Python API — bpy_extras.view3d_utils — CC BY-SA 4.0 — Blender Foundation
  https://docs.blender.org/api/current/bpy_extras.view3d_utils.html

  Blender Python API — mathutils.bvhtree — CC BY-SA 4.0 — Blender Foundation
  https://docs.blender.org/api/current/mathutils.bvhtree.html

  Blender Python API — gpu module — CC BY-SA 4.0 — Blender Foundation
  https://docs.blender.org/api/current/gpu.html
"""

import bpy
import bmesh
import gpu
from mathutils import Vector
from mathutils.bvhtree import BVHTree
from bpy_extras import view3d_utils
from gpu_extras.batch import batch_for_shader

# ── PARAMETERS ─────────────────────────────────────────────────────────────────
ATTRIBUTE_NAME = "holoflow_facet"    # integer face attribute
TAG_VALUE      = 1                   # written on LMB pick
CLEAR_VALUE    = 0                   # written on Ctrl+LMB pick
TAGGED_COLOUR  = (1.0, 0.40, 0.08)  # warm amber (holoflow brand)
OVERLAY_ALPHA  = 0.45                # fill transparency
MARKER_PX      = 8                   # half-size of screen-space quad marker (px)
KEYMAP_KEY     = 'F'


class HF_OT_FaceTagPicker(bpy.types.Operator):
    """Click-drag over mesh faces to stamp the holoflow_facet attribute (F key)."""
    bl_idname  = "holoflow.face_tag_picker"
    bl_label   = "Holoflow Face Tag Picker"
    bl_options = {'REGISTER', 'UNDO'}

    # ── Internal state ───────────────────────────────────────────────────────
    _bvh          = None   # BVHTree (local space)
    _bm           = None   # shadow BMesh for attribute writes
    _face_layer   = None   # int layer handle
    _draw_handle  = None   # SpaceView3D draw handler
    _ob_matrix    = None   # object world matrix (cached at invoke)
    _ob_matrix_inv = None
    _tagged_wco   = []     # world-space face centres for overlay
    _is_painting  = False
    _mode_clear   = False

    @classmethod
    def poll(cls, context):
        return (
            context.area is not None
            and context.area.type == 'VIEW_3D'
            and context.active_object is not None
            and context.active_object.type == 'MESH'
            and context.mode == 'OBJECT'
        )

    # ── Setup & teardown ─────────────────────────────────────────────────────

    def _build_bvh(self, ob):
        if self._bm:
            self._bm.free()
        bm = bmesh.new()
        bm.from_mesh(ob.data)
        bm.faces.ensure_lookup_table()
        bm.verts.ensure_lookup_table()
        self._bvh = BVHTree.FromBMesh(bm, epsilon=1e-5)
        self._bm  = bm
        layer = bm.faces.layers.int.get(ATTRIBUTE_NAME)
        if layer is None:
            layer = bm.faces.layers.int.new(ATTRIBUTE_NAME)
        self._face_layer   = layer
        self._ob_matrix    = ob.matrix_world.copy()
        self._ob_matrix_inv = self._ob_matrix.inverted()
        self._refresh_overlay()

    def _refresh_overlay(self):
        self._tagged_wco = [
            self._ob_matrix @ f.calc_center_median()
            for f in self._bm.faces
            if f[self._face_layer] == TAG_VALUE
        ]

    # ── Ray casting ──────────────────────────────────────────────────────────

    def _raycast(self, context, event):
        region   = context.region
        rv3d     = context.space_data.region_3d
        mouse_co = Vector((event.mouse_region_x, event.mouse_region_y))
        w_orig   = view3d_utils.region_2d_to_origin_3d(region, rv3d, mouse_co)
        w_dir    = view3d_utils.region_2d_to_vector_3d(region, rv3d, mouse_co)
        # BVH lives in local space — transform ray accordingly
        l_orig = self._ob_matrix_inv @ w_orig
        l_dir  = (self._ob_matrix_inv.to_3x3() @ w_dir).normalized()
        _, _, face_idx, _ = self._bvh.ray_cast(l_orig, l_dir)
        return face_idx if face_idx is not None else -1

    # ── Attribute write ──────────────────────────────────────────────────────

    def _tag_face(self, face_idx, value, ob):
        if face_idx < 0 or face_idx >= len(self._bm.faces):
            return
        face = self._bm.faces[face_idx]
        if face[self._face_layer] == value:
            return   # idempotent — skip flush when nothing changed
        face[self._face_layer] = value
        self._bm.to_mesh(ob.data)
        ob.data.update()
        self._refresh_overlay()

    # ── GPU draw ─────────────────────────────────────────────────────────────

    def _draw_callback(self, context):
        if not self._tagged_wco:
            return
        region = context.region
        rv3d   = context.space_data.region_3d
        shader = gpu.shader.from_builtin('UNIFORM_COLOR')
        shader.bind()
        shader.uniform_float("color", (*TAGGED_COLOUR, OVERLAY_ALPHA))
        R  = MARKER_PX
        verts = []
        for wco in self._tagged_wco:
            co2d = view3d_utils.location_3d_to_region_2d(region, rv3d, wco)
            if co2d is None:
                continue
            x, y = co2d
            verts += [(x-R,y-R),(x+R,y-R),(x+R,y+R),
                      (x-R,y-R),(x+R,y+R),(x-R,y+R)]
        if verts:
            batch = batch_for_shader(shader, 'TRIS', {"pos": verts})
            gpu.state.blend_set('ALPHA')
            batch.draw(shader)
            gpu.state.blend_set('NONE')

    # ── Operator lifecycle ────────────────────────────────────────────────────

    def invoke(self, context, event):
        ob = context.active_object
        self._build_bvh(ob)
        self._is_painting = False
        self._draw_handle = bpy.types.SpaceView3D.draw_handler_add(
            self._draw_callback, (context,), 'WINDOW', 'POST_PIXEL'
        )
        context.window_manager.modal_handler_add(self)
        context.area.header_text_set(
            "Face Tag Picker  LMB paint · Ctrl+LMB erase · RMB/Esc exit"
        )
        return {'RUNNING_MODAL'}

    def modal(self, context, event):
        context.area.tag_redraw()

        if event.type in {'MIDDLEMOUSE', 'WHEELUPMOUSE', 'WHEELDOWNMOUSE'}:
            return {'PASS_THROUGH'}

        if event.type in {'ESC', 'RIGHTMOUSE'} and event.value == 'PRESS':
            return self._finish(context)

        if event.type == 'LEFTMOUSE':
            if event.value == 'PRESS':
                self._is_painting = True
                self._mode_clear  = event.ctrl
                idx = self._raycast(context, event)
                self._tag_face(idx,
                               CLEAR_VALUE if self._mode_clear else TAG_VALUE,
                               context.active_object)
            elif event.value == 'RELEASE':
                self._is_painting = False
            return {'RUNNING_MODAL'}

        if event.type == 'MOUSEMOVE' and self._is_painting:
            idx = self._raycast(context, event)
            self._tag_face(idx,
                           CLEAR_VALUE if self._mode_clear else TAG_VALUE,
                           context.active_object)

        return {'RUNNING_MODAL'}

    def _finish(self, context):
        context.area.header_text_set(None)
        if self._draw_handle:
            bpy.types.SpaceView3D.draw_handler_remove(self._draw_handle, 'WINDOW')
            self._draw_handle = None
        if self._bm:
            self._bm.free()
            self._bm = None
        context.area.tag_redraw()
        return {'FINISHED'}

    def cancel(self, context):
        self._finish(context)


# ── Keymap registration ────────────────────────────────────────────────────────
_addon_keymaps: list = []


def register():
    bpy.utils.register_class(HF_OT_FaceTagPicker)
    wm = bpy.context.window_manager
    kc = wm.keyconfigs.addon
    if kc:
        km  = kc.keymaps.new(name='3D View', space_type='VIEW_3D')
        kmi = km.keymap_items.new(
            HF_OT_FaceTagPicker.bl_idname,
            type=KEYMAP_KEY, value='PRESS',
        )
        _addon_keymaps.append((km, kmi))


def unregister():
    for km, kmi in _addon_keymaps:
        km.keymap_items.remove(kmi)
    _addon_keymaps.clear()
    bpy.utils.unregister_class(HF_OT_FaceTagPicker)


if __name__ == "__main__":
    register()
