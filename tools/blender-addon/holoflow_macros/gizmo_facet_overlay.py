"""
holoflow_macros/gizmo_facet_overlay.py
Reusable macro: register / unregister the Facet Tag GizmoGroup overlay.

Import and call register_facet_overlay() from the main add-on register()
to activate the overlay on add-on load. Call unregister_facet_overlay() in
the main unregister() to clean up without leaving orphaned gizmo types.
"""

import bpy
import mathutils

COLOR_TAGGED   = (0.05, 0.95, 0.40)
COLOR_HIGHLIGHT = (1.00, 0.85, 0.10)
COLOR_UNTAGGED = (0.30, 0.30, 0.30)
CIRCLE_SCALE   = 0.18
ARROW_SCALE    = 0.45
CIRCLE_OFFSET_Z = 0.30


class HOLOFLOW_OT_toggle_facet_tag(bpy.types.Operator):
    """Toggle holoflow:facet on the named object"""
    bl_idname  = "holoflow.toggle_facet_tag"
    bl_label   = "Toggle Facet Tag"
    bl_options = {'REGISTER', 'UNDO'}
    object_name: bpy.props.StringProperty()

    def execute(self, context):
        obj = bpy.data.objects.get(self.object_name)
        if obj is None:
            return {'CANCELLED'}
        obj["holoflow:facet"] = 0 if int(obj.get("holoflow:facet", 0)) else 1
        context.region.tag_redraw()
        return {'FINISHED'}


def _top_z(obj):
    corners = [obj.matrix_world @ mathutils.Vector(c) for c in obj.bound_box]
    return max(c.z for c in corners)


class HOLOFLOW_GGT_facet_overlay(bpy.types.GizmoGroup):
    bl_idname      = "HOLOFLOW_GGT_facet_overlay"
    bl_label       = "Holoflow Facet Overlay"
    bl_space_type  = 'VIEW_3D'
    bl_region_type = 'WINDOW'
    bl_options     = {'3D', 'PERSISTENT'}

    @classmethod
    def poll(cls, context):
        return (context.space_data.overlay.show_overlays
                and any(o.type == 'MESH' for o in context.scene.objects))

    def setup(self, context):
        self._circles, self._arrows, self._names = [], [], []
        for obj in context.scene.objects:
            if obj.type != 'MESH':
                continue
            gz_c = self.gizmos.new("GIZMO_GT_primitive_3d")
            gz_c.draw_style = 'CIRCLE'
            gz_c.scale_basis = CIRCLE_SCALE
            gz_c.use_draw_hover = True
            gz_c.line_width = 2.0
            op = gz_c.target_set_operator("holoflow.toggle_facet_tag")
            op.object_name = obj.name
            gz_a = self.gizmos.new("GIZMO_GT_arrow_3d")
            gz_a.scale_basis = ARROW_SCALE
            gz_a.use_draw_hover = False
            gz_a.line_width = 1.5
            self._circles.append(gz_c)
            self._arrows.append(gz_a)
            self._names.append(obj.name)
        self.refresh(context)

    def refresh(self, context):
        objs = {o.name: o for o in context.scene.objects}
        for gz_c, gz_a, name in zip(self._circles, self._arrows, self._names):
            obj = objs.get(name)
            if not obj:
                gz_c.hide = gz_a.hide = True
                continue
            tagged = bool(obj.get("holoflow:facet", 0))
            gz_c.color = COLOR_TAGGED if tagged else COLOR_UNTAGGED
            gz_c.color_highlight = COLOR_HIGHLIGHT if tagged else COLOR_UNTAGGED
            gz_c.alpha = 0.80 if tagged else 0.25
            gz_c.hide = False
            gz_a.color = COLOR_TAGGED if tagged else COLOR_UNTAGGED
            gz_a.alpha = 0.80 if tagged else 0.25
            gz_a.hide = not tagged
            origin = obj.matrix_world.to_translation()
            top_z  = _top_z(obj) + CIRCLE_OFFSET_Z
            gz_c.matrix_basis = mathutils.Matrix.Translation(
                mathutils.Vector((origin.x, origin.y, top_z))
            )
            if tagged:
                mat = obj.matrix_world.normalized()
                mat.col[3][:3] = (origin.x, origin.y, origin.z + 0.05)
                gz_a.matrix_basis = mat

    def draw_prepare(self, context):
        pass


_OVERLAY_CLASSES = [HOLOFLOW_OT_toggle_facet_tag, HOLOFLOW_GGT_facet_overlay]


def register_facet_overlay():
    for cls in _OVERLAY_CLASSES:
        try:
            bpy.utils.register_class(cls)
        except ValueError:
            pass


def unregister_facet_overlay():
    for cls in reversed(_OVERLAY_CLASSES):
        try:
            bpy.utils.unregister_class(cls)
        except RuntimeError:
            pass
