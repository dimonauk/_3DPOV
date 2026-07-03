"""
Blender 5.1 | bpy.types.glTF2ExportUserExtension
Holoflow Facet Tag — glTF Extras Export Hook

Subclass bpy.types.glTF2ExportUserExtension and io_scene_gltf2 discovers
it automatically via __subclasses__() when File > Export > glTF 2.0 runs.
No monkey-patching; no post-process script.  The hook injects
{"holoflow:facet": 1} into the glTF node.extras of every tagged mesh so
the property travels inside the binary glTF to Three.js as
mesh.userData["holoflow:facet"].

WHY glTF extras vs a sidecar JSON file?
  extras are embedded in the .glb binary, survive CDN caching, and are
  read by every conformant glTF loader.  Sidecars need a second HTTP
  request and separate cache lifetime management.

TECHNIQUE:
  • Subclass bpy.types.glTF2ExportUserExtension (registered like any type)
  • gather_node_hook() — fires once per exported node; mutate gltf2_node.extras
  • gather_gltf_extensions_hook() — fires once; write studio manifest to
    gltf2_plan.asset.extras
  • N-panel sidebar shows per-object tag status and a one-click toggle

PARAMETERS:
"""

import bpy
import mathutils

STUDIO_NAME    = "Holoflow Studio"
STUDIO_VERSION = "1.0.0"

bl_info = {
    "name": "Holoflow Facet Extras Export Hook",
    "author": "Holoflow Studio",
    "version": (1, 0, 0),
    "blender": (5, 1, 0),
    "category": "Import-Export",
}


# ---------------------------------------------------------------------------
# TOGGLE OPERATOR
# ---------------------------------------------------------------------------

class HOLOFLOW_OT_toggle_facet_tag(bpy.types.Operator):
    """Toggle holoflow:facet on the active object"""
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


# ---------------------------------------------------------------------------
# N-PANEL SIDEBAR
# ---------------------------------------------------------------------------

class HOLOFLOW_PT_facet_tag_sidebar(bpy.types.Panel):
    """Shows holoflow:facet status for the active object and export preview."""
    bl_label       = "Facet Export Tag"
    bl_idname      = "HOLOFLOW_PT_facet_tag_sidebar"
    bl_space_type  = 'VIEW_3D'
    bl_region_type = 'UI'
    bl_category    = 'Holoflow'

    def draw(self, context):
        obj = context.active_object
        layout = self.layout
        if obj is None or obj.type != 'MESH':
            layout.label(text="Select a mesh object")
            return
        tagged = bool(obj.get("holoflow:facet", 0))
        row = layout.row()
        row.alert = not tagged
        row.label(text="Tagged" if tagged else "Untagged",
                  icon='CHECKMARK' if tagged else 'X')
        op = layout.operator(
            "holoflow.toggle_facet_tag",
            text="Remove Tag" if tagged else "Mark as Facet",
            icon='REMOVE' if tagged else 'ADD',
        )
        op.object_name = obj.name
        layout.separator()
        col = layout.column(align=True)
        col.label(text="glTF node.extras preview:")
        col.label(text='  "holoflow:facet": ' + ("1" if tagged else "<absent>"))


# ---------------------------------------------------------------------------
# GLTF EXPORT HOOK
# ---------------------------------------------------------------------------

class HOLOFLOW_FacetExtrasExportHook(bpy.types.glTF2ExportUserExtension):
    """
    Injects holoflow:facet into glTF node extras at export time.

    Discovered by io_scene_gltf2 via
        bpy.types.glTF2ExportUserExtension.__subclasses__()
    No explicit reference in the exporter is required — registering this
    class with bpy.utils.register_class() is sufficient.
    """

    def gather_node_hook(self, gltf2_node, blender_object, export_settings):
        """Fires once per exported node (mesh, light, camera, empty)."""
        if blender_object is None:
            return
        tag = blender_object.get("holoflow:facet")
        if not tag:
            return
        if gltf2_node.extras is None:
            gltf2_node.extras = {}
        gltf2_node.extras["holoflow:facet"] = int(tag)

    def gather_gltf_extensions_hook(self, gltf2_plan, export_settings):
        """Fires once after all nodes; write studio manifest to asset.extras."""
        tagged = [
            o.name for o in bpy.context.scene.objects
            if o.type == 'MESH' and o.get("holoflow:facet")
        ]
        if not tagged:
            return
        if gltf2_plan.asset.extras is None:
            gltf2_plan.asset.extras = {}
        gltf2_plan.asset.extras["holoflow:studio"]        = STUDIO_NAME
        gltf2_plan.asset.extras["holoflow:version"]       = STUDIO_VERSION
        gltf2_plan.asset.extras["holoflow:facet_objects"] = tagged


# ---------------------------------------------------------------------------
# DEMO SCENE
# ---------------------------------------------------------------------------

def build_demo_scene() -> None:
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()

    for pos, name, tag in [
        ((0, 0, 0),   "Facet_Prop_A", 1),
        ((3, 0, 0),   "Facet_Prop_B", 1),
        ((-3, 0, 0),  "Regular_Prop", 0),
    ]:
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=pos)
        obj = bpy.context.active_object
        obj.name = name
        if tag:
            obj["holoflow:facet"] = 1

    cam_data = bpy.data.cameras.new("Camera")
    cam_obj  = bpy.data.objects.new("Camera", cam_data)
    bpy.context.scene.collection.objects.link(cam_obj)
    cam_obj.location        = mathutils.Vector((0, -8, 4))
    cam_obj.rotation_euler  = (1.1, 0, 0)
    bpy.context.scene.camera = cam_obj


# ---------------------------------------------------------------------------
# REGISTER / UNREGISTER
# ---------------------------------------------------------------------------

CLASSES = [
    HOLOFLOW_OT_toggle_facet_tag,
    HOLOFLOW_PT_facet_tag_sidebar,
    HOLOFLOW_FacetExtrasExportHook,
]


def register():
    if not hasattr(bpy.types, "glTF2ExportUserExtension"):
        raise RuntimeError(
            "Enable 'glTF 2.0 format' (io_scene_gltf2) in Preferences > Add-ons first."
        )
    for cls in CLASSES:
        bpy.utils.register_class(cls)


def unregister():
    for cls in reversed(CLASSES):
        try:
            bpy.utils.unregister_class(cls)
        except RuntimeError:
            pass


if __name__ == "__main__":
    try:
        unregister()
    except Exception:
        pass
    register()
    build_demo_scene()
    print(
        "Blueprint loaded. Tag cubes in the Holoflow N-panel, "
        "then File > Export > glTF 2.0 to see extras in the JSON."
    )
