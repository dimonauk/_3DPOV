"""
Holoflow Studio — holoflow_macros/mesh_repair_pipeline.py
One-click mesh repair operator for the Holoflow 3D Viewport toolbar.

Blender 5.1  |  CC0 1.0 Universal

Registers: HOLOFLOW_OT_mesh_repair_batch
Panel:     VIEW_3D > Sidebar (N) > Holoflow > Repair

Usage (from script or another operator):
    bpy.ops.holoflow.mesh_repair_batch(
        collection_name="holoflow_props",
        merge_threshold=0.0001,
    )
"""

import bpy
from bpy.props import StringProperty, FloatProperty, BoolProperty
from bpy.types import Operator, Panel


class HOLOFLOW_OT_mesh_repair_batch(Operator):
    """Merge-by-Distance, Recalculate Normals & Tris-to-Quads for a whole collection."""
    bl_idname  = "holoflow.mesh_repair_batch"
    bl_label   = "Holoflow: Batch Mesh Repair"
    bl_options = {'REGISTER', 'UNDO'}

    collection_name: StringProperty(
        name="Collection",
        default="holoflow_props",
        description="Name of the collection whose meshes will be repaired",
    )
    merge_threshold: FloatProperty(
        name="Merge Distance",
        default=0.0001,
        min=0.0,
        max=0.01,
        precision=5,
        unit='LENGTH',
        description="Weld tolerance for merge-by-distance pass",
    )
    recalc_normals: BoolProperty(name="Recalculate Normals", default=True)
    tris_to_quads:  BoolProperty(name="Tris to Quads",       default=True)

    def _find_view3d(self, context):
        for window in context.window_manager.windows:
            for area in window.screen.areas:
                if area.type != 'VIEW_3D':
                    continue
                for region in area.regions:
                    if region.type == 'WINDOW':
                        return window, area, region
        return None, None, None

    def execute(self, context):
        coll = bpy.data.collections.get(self.collection_name)
        if coll is None:
            self.report({'WARNING'}, f"Collection '{self.collection_name}' not found.")
            return {'CANCELLED'}

        mesh_objects = [o for o in coll.all_objects if o.type == 'MESH']
        if not mesh_objects:
            self.report({'WARNING'}, "No MESH objects found.")
            return {'CANCELLED'}

        window, area, region = self._find_view3d(context)
        if window is None:
            self.report({'ERROR'}, "No 3D Viewport open — cannot run edit-mode operators.")
            return {'CANCELLED'}

        repaired = 0
        for obj in mesh_objects:
            context.view_layer.objects.active = obj
            for o in context.view_layer.objects:
                o.select_set(False)
            obj.select_set(True)

            with context.temp_override(window=window, area=area, region=region):
                bpy.ops.object.mode_set(mode='EDIT')
                bpy.ops.mesh.select_all(action='SELECT')
                bpy.ops.mesh.remove_doubles(
                    threshold=self.merge_threshold,
                    use_unselected=False,
                )
                if self.recalc_normals:
                    bpy.ops.mesh.normals_make_consistent(inside=False)
                if self.tris_to_quads:
                    bpy.ops.mesh.tris_convert_to_quads(
                        face_threshold=0.698,
                        shape_threshold=0.698,
                    )
                bpy.ops.object.mode_set(mode='OBJECT')
            repaired += 1

        self.report({'INFO'}, f"Repaired {repaired} mesh(es) in '{self.collection_name}'.")
        return {'FINISHED'}

    def invoke(self, context, event):
        return context.window_manager.invoke_props_dialog(self)

    def draw(self, context):
        layout = self.layout
        layout.prop(self, "collection_name")
        layout.prop(self, "merge_threshold")
        layout.prop(self, "recalc_normals")
        layout.prop(self, "tris_to_quads")


class HOLOFLOW_PT_mesh_repair(Panel):
    bl_space_type  = 'VIEW_3D'
    bl_region_type = 'UI'
    bl_category    = 'Holoflow'
    bl_label       = 'Repair'

    def draw(self, context):
        self.layout.operator(HOLOFLOW_OT_mesh_repair_batch.bl_idname, icon='SHADERFX')


def register():
    bpy.utils.register_class(HOLOFLOW_OT_mesh_repair_batch)
    bpy.utils.register_class(HOLOFLOW_PT_mesh_repair)


def unregister():
    bpy.utils.unregister_class(HOLOFLOW_PT_mesh_repair)
    bpy.utils.unregister_class(HOLOFLOW_OT_mesh_repair_batch)
