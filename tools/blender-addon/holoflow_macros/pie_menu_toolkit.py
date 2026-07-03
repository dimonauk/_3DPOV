"""
Holoflow Pie Menu Toolkit — reusable macro
==========================================
Import into any Holoflow add-on:

    from holoflow_macros.pie_menu_toolkit import register, unregister

    def register():
        pie_menu_toolkit.register()

    def unregister():
        pie_menu_toolkit.unregister()

Hotkey: Shift+Space in the 3D View (VIEW_3D / WINDOW region).
No collision with Blender's default Space (Play) which is scoped to
Timeline/Dopesheet spaces, not the 3D View window region.
"""
import bpy
import os

# ── constants ────────────────────────────────────────────────────────────────
PIE_IDNAME   = 'HOLOFLOW_MT_pie_rigging_export'
GLB_OUT_DIR  = '//exports/'   # resolved relative to the saved .blend

# ── operators ────────────────────────────────────────────────────────────────

class HOLOFLOW_OT_tag_facet(bpy.types.Operator):
    """Toggle holoflow:facet custom property on selected mesh objects"""
    bl_idname  = 'holoflow.pie_tag_facet'
    bl_label   = 'Tag holoflow:facet'
    bl_options = {'REGISTER', 'UNDO'}

    @classmethod
    def poll(cls, ctx):
        return bool(ctx.selected_objects) and ctx.mode in ('OBJECT', 'POSE')

    def execute(self, ctx):
        n = 0
        for obj in ctx.selected_objects:
            if obj.type != 'MESH':
                continue
            obj['holoflow:facet'] = 0 if obj.get('holoflow:facet', 0) else 1
            n += 1
        self.report({'INFO'}, f'holoflow:facet toggled on {n} mesh(es)')
        return {'FINISHED'}


class HOLOFLOW_OT_quick_glb_export(bpy.types.Operator):
    """Export selection as GLB: Draco 6 / +Y up / apply modifiers + transforms"""
    bl_idname  = 'holoflow.pie_quick_glb_export'
    bl_label   = 'Quick GLB Export'
    bl_options = {'REGISTER', 'UNDO'}

    @classmethod
    def poll(cls, ctx):
        return bool(ctx.selected_objects) and bpy.data.is_saved

    def execute(self, ctx):
        base   = bpy.path.abspath(GLB_OUT_DIR)
        os.makedirs(base, exist_ok=True)
        anchor = ctx.active_object or ctx.selected_objects[0]
        path   = os.path.join(base,
                              bpy.path.clean_name(anchor.name.lower()) + '.glb')
        bpy.ops.export_scene.gltf(
            filepath                             = path,
            use_selection                        = True,
            export_apply                         = True,
            export_yup                           = True,
            export_draco_mesh_compression_enable = True,
            export_draco_mesh_compression_level  = 6,
            export_image_format                  = 'WEBP',
            export_extras                        = True,
        )
        self.report({'INFO'}, f'GLB → {path}')
        return {'FINISHED'}


class HOLOFLOW_OT_mark_seams_sharp(bpy.types.Operator):
    """Mark UV seams on active mesh from sharp edges"""
    bl_idname  = 'holoflow.pie_mark_seams_sharp'
    bl_label   = 'Mark Seams from Sharp'
    bl_options = {'REGISTER', 'UNDO'}

    @classmethod
    def poll(cls, ctx):
        return ctx.active_object and ctx.active_object.type == 'MESH'

    def execute(self, ctx):
        in_edit = ctx.mode == 'EDIT_MESH'
        if not in_edit:
            bpy.ops.object.mode_set(mode='EDIT')
        bpy.ops.mesh.select_all(action='SELECT')
        bpy.ops.mesh.mark_seam(clear=False)
        if not in_edit:
            bpy.ops.object.mode_set(mode='OBJECT')
        return {'FINISHED'}


class HOLOFLOW_OT_apply_all_modifiers(bpy.types.Operator):
    """Apply every modifier on selected mesh objects"""
    bl_idname  = 'holoflow.pie_apply_all_modifiers'
    bl_label   = 'Apply All Modifiers'
    bl_options = {'REGISTER', 'UNDO'}

    @classmethod
    def poll(cls, ctx):
        return any(o.type == 'MESH' for o in ctx.selected_objects)

    def execute(self, ctx):
        n = 0
        for obj in list(ctx.selected_objects):
            if obj.type != 'MESH':
                continue
            with bpy.context.temp_override(object=obj):
                for mod in list(obj.modifiers):
                    try:
                        bpy.ops.object.modifier_apply(modifier=mod.name)
                        n += 1
                    except RuntimeError as e:
                        self.report({'WARNING'}, f'{obj.name}/{mod.name}: {e}')
        self.report({'INFO'}, f'Applied {n} modifier(s)')
        return {'FINISHED'}


# ── pie ──────────────────────────────────────────────────────────────────────

class HOLOFLOW_MT_pie_rigging_export(bpy.types.Menu):
    bl_idname = PIE_IDNAME
    bl_label  = 'Holoflow Studio'

    def draw(self, ctx):
        pie = self.layout.menu_pie()
        # slot order: W E S N NW NE SW SE
        pie.operator('holoflow.pie_mark_seams_sharp',
                     icon='UV_ISLANDSEL', text='Mark Seams')
        pie.operator('holoflow.pie_quick_glb_export',
                     icon='EXPORT', text='Quick GLB')
        pie.operator('holoflow.pie_apply_all_modifiers',
                     icon='MODIFIER', text='Apply Modifiers')
        pie.operator('holoflow.pie_tag_facet',
                     icon='MESH_DATA', text='Tag Facet')
        op = pie.operator('wm.context_toggle',
                          icon='PROPERTIES', text='Sidebar')
        op.data_path = 'space_data.show_region_ui'
        pie.operator('object.transforms_to_deltas',
                     icon='EMPTY_AXIS', text='Reset Xform').mode = 'ALL'
        pie.operator('object.visual_transform_apply',
                     icon='ARMATURE_DATA', text='Freeze Pose')
        pie.operator('screen.area_split',
                     icon='UV', text='Split UV').direction = 'VERTICAL'


class HOLOFLOW_OT_call_pie(bpy.types.Operator):
    """Invoke the Holoflow pie — used as the keymap target"""
    bl_idname = 'holoflow.call_pie_rigging_export'
    bl_label  = 'Holoflow Pie Menu'

    def invoke(self, ctx, event):
        bpy.ops.wm.call_menu_pie(name=PIE_IDNAME)
        return {'FINISHED'}


# ── registration ──────────────────────────────────────────────────────────────

_ADDON_KEYMAPS: list = []

_CLASSES = [
    HOLOFLOW_OT_tag_facet,
    HOLOFLOW_OT_quick_glb_export,
    HOLOFLOW_OT_mark_seams_sharp,
    HOLOFLOW_OT_apply_all_modifiers,
    HOLOFLOW_MT_pie_rigging_export,
    HOLOFLOW_OT_call_pie,
]


def register():
    for cls in _CLASSES:
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
    for cls in reversed(_CLASSES):
        bpy.utils.unregister_class(cls)
