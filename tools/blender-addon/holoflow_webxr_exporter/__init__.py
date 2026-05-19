# Holoflow WebXR Game Framework exporter — Blender add-on entry point.
#
# Registers the operator, the N-panel, and the bl_info that Blender's
# preferences pane reads at install time. Keep this file boring: all
# the work happens in operators.py, panel.py and validators.py.

bl_info = {
    "name": "Holoflow WebXR Game Framework Exporter",
    "author": "Holoflow Studio",
    "version": (0, 1, 0),
    "blender": (4, 0, 0),
    "location": "View3D > N-panel > Holoflow",
    "description": (
        "Codifies the Holoflow studio's glTF export conventions for the "
        "WebXR Game Framework. Presets per scene type, mesh validation "
        "against the device hard-deck, the flat-normals trick for the "
        "high-facet aesthetic, and a one-click export to public/models/."
    ),
    "warning": "",
    "doc_url": "https://github.com/holoflow/_3DPOV/blob/main/docs/BLENDER-ADDON.md",
    "category": "Import-Export",
}

import bpy

from . import operators
from . import panel
from . import validators  # noqa: F401 — kept so reload picks the module up


# ---------------------------------------------------------------------------
# Scene-level properties.
#
# Stored on the Scene so they survive save/load and so the panel can read
# them without juggling a separate WindowManager state. Per-object facet
# mode goes on the object itself (see panel.py).
# ---------------------------------------------------------------------------

SCENE_PRESETS = [
    (
        "sculpture_piece",
        "Sculpture gallery piece",
        "Floor sculpture for /atelier/sculpture-gallery — tighter bounds, "
        "fewer textures, high-facet aesthetic.",
    ),
    (
        "sculpture_wall",
        "Sculpture gallery wall relief",
        "Belt-printed wall relief — flat depth budget, single material slot.",
    ),
    (
        "splat_prop",
        "Splat-walker prop",
        "Hero prop for the splat walker scenes — max detail, full PBR.",
    ),
    (
        "scenestage_prop",
        "SceneStage demo prop",
        "Generic demo prop for SceneStage — middling budget, full materials.",
    ),
    (
        "generic_gltf",
        "Generic glTF",
        "No preset overrides; ships canonical export defaults only.",
    ),
]


def _register_scene_props():
    """Add the panel-driven properties to bpy.types.Scene."""
    bpy.types.Scene.holoflow_preset = bpy.props.EnumProperty(
        name="Scene preset",
        description="Which Holoflow scene this asset is destined for",
        items=SCENE_PRESETS,
        default="generic_gltf",
    )
    bpy.types.Scene.holoflow_export_path = bpy.props.StringProperty(
        name="Target path",
        description=(
            "Output .glb path. Defaults to <repo>/public/models/<scene>/"
            "<object>.glb when the .blend lives inside the repo."
        ),
        subtype="FILE_PATH",
        default="",
    )
    bpy.types.Scene.holoflow_force_facet = bpy.props.BoolProperty(
        name="Force flat normals on facet objects",
        description=(
            "When ON, every object marked with custom property "
            "'holoflow:facet' = True gets Shade Flat + custom-split-normals "
            "before export so the high-facet look survives glTF round-trip."
        ),
        default=True,
    )
    bpy.types.Object.holoflow_facet = bpy.props.BoolProperty(
        name="Holoflow: facet object",
        description=(
            "Mark this object as part of the high-facet aesthetic. "
            "On export the add-on will force flat normals."
        ),
        default=False,
    )


def _unregister_scene_props():
    for attr in (
        "holoflow_preset",
        "holoflow_export_path",
        "holoflow_force_facet",
    ):
        if hasattr(bpy.types.Scene, attr):
            delattr(bpy.types.Scene, attr)
    if hasattr(bpy.types.Object, "holoflow_facet"):
        del bpy.types.Object.holoflow_facet


# ---------------------------------------------------------------------------
# Registration.
# ---------------------------------------------------------------------------

_CLASSES = (
    operators.HOLOFLOW_OT_export_scene_glb,
    operators.HOLOFLOW_OT_validate_scene,
    panel.HOLOFLOW_PT_export_panel,
)


def register():
    for cls in _CLASSES:
        bpy.utils.register_class(cls)
    _register_scene_props()


def unregister():
    _unregister_scene_props()
    for cls in reversed(_CLASSES):
        bpy.utils.unregister_class(cls)


if __name__ == "__main__":
    register()
