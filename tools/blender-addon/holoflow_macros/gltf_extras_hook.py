"""
holoflow_macros/gltf_extras_hook.py
Reusable macro: register / unregister the Holoflow glTF extras export hook.

Import and call register_gltf_extras_hook() from the main add-on register()
to activate the hook on add-on load. Call unregister_gltf_extras_hook() in
the main unregister() to remove the subclass before the exporter can use it.

Requires io_scene_gltf2 (the built-in glTF 2.0 exporter, enabled by default
in Blender 5.1) — bpy.types.glTF2ExportUserExtension must be present.
"""

import bpy

STUDIO_NAME    = "Holoflow Studio"
STUDIO_VERSION = "1.0.0"


class HOLOFLOW_FacetExtrasExportHook(bpy.types.glTF2ExportUserExtension):
    """
    Injects holoflow:facet = 1 into glTF node.extras for tagged mesh objects.

    Discovered automatically by io_scene_gltf2 via __subclasses__() during
    File > Export > glTF 2.0.  Safe to register alongside other user extensions;
    namespace-prefixed keys (holoflow:*) avoid collisions.
    """

    def gather_node_hook(self, gltf2_node, blender_object, export_settings):
        """Fires once per exported node.  Mutate gltf2_node.extras before returning."""
        if blender_object is None:
            return
        tag = blender_object.get("holoflow:facet")
        if not tag:
            return
        if gltf2_node.extras is None:
            gltf2_node.extras = {}
        gltf2_node.extras["holoflow:facet"] = int(tag)

    def gather_gltf_extensions_hook(self, gltf2_plan, export_settings):
        """Fires once per export pass.  Writes studio manifest to asset.extras."""
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


_HOOK_CLASSES = [HOLOFLOW_FacetExtrasExportHook]


def register_gltf_extras_hook() -> None:
    if not hasattr(bpy.types, "glTF2ExportUserExtension"):
        return  # io_scene_gltf2 not loaded; skip silently
    for cls in _HOOK_CLASSES:
        try:
            bpy.utils.register_class(cls)
        except ValueError:
            pass


def unregister_gltf_extras_hook() -> None:
    for cls in reversed(_HOOK_CLASSES):
        try:
            bpy.utils.unregister_class(cls)
        except RuntimeError:
            pass
