# Holoflow WebXR exporter — N-panel UI.
#
# Lives under View3D → N-panel → Holoflow tab. Four sections:
#   * Scene preset dropdown — drives PRESET_OVERRIDES in operators.py.
#   * Facet mode — toggles the per-object holoflow_facet property on
#     the *active* object, plus the scene-wide "force flat normals on
#     export" switch.
#   * Mesh validation — fires the validator operator.
#   * Export — target path + the export button.

import os

import bpy


def _suggest_export_path(context) -> str:
    """Suggest <repo>/public/models/<scene>/<active>.glb when in-repo.

    The "in-repo" test is conservative: we walk up from the .blend file
    looking for a `public/models/` sibling. If found, the suggestion
    drops in there under a scene-named subdir; if not, we leave the path
    empty and let the author set it manually.
    """
    blend_path = bpy.data.filepath
    if not blend_path:
        return ""

    scene = context.scene
    active = context.view_layer.objects.active
    obj_name = active.name if active else "object"
    scene_name = scene.holoflow_preset.replace("_", "-") if scene.holoflow_preset else "scene"

    current = os.path.dirname(os.path.abspath(blend_path))
    for _ in range(8):  # don't walk the whole filesystem
        candidate = os.path.join(current, "public", "models")
        if os.path.isdir(candidate):
            return os.path.join(candidate, scene_name, f"{obj_name}.glb")
        parent = os.path.dirname(current)
        if parent == current:
            break
        current = parent
    return ""


class HOLOFLOW_PT_export_panel(bpy.types.Panel):
    """The Holoflow tab in the 3D view's N-panel."""

    bl_label = "Holoflow WebXR Exporter"
    bl_idname = "HOLOFLOW_PT_export_panel"
    bl_space_type = "VIEW_3D"
    bl_region_type = "UI"
    bl_category = "Holoflow"

    def draw(self, context):
        layout = self.layout
        scene = context.scene

        # ---- Scene preset --------------------------------------------------
        box = layout.box()
        box.label(text="Scene preset", icon="SCENE_DATA")
        box.prop(scene, "holoflow_preset", text="")

        preset_blurbs = {
            "sculpture_piece": "Tight bounds, fewer textures, high-facet look.",
            "sculpture_wall": "Wall relief — flat depth budget.",
            "splat_prop": "Hero prop — desktop-class budget.",
            "scenestage_prop": "Demo prop — middling budget.",
            "generic_gltf": "No preset overrides; canonical defaults only.",
        }
        blurb = preset_blurbs.get(scene.holoflow_preset, "")
        if blurb:
            row = box.row()
            row.alignment = "LEFT"
            row.scale_y = 0.7
            row.label(text=blurb)

        # ---- Facet mode ----------------------------------------------------
        box = layout.box()
        box.label(text="Facet mode", icon="MESH_ICOSPHERE")
        box.prop(scene, "holoflow_force_facet", text="Force flat normals on export")

        active = context.view_layer.objects.active
        if active and active.type == "MESH":
            box.prop(
                active,
                "holoflow_facet",
                text=f"Mark '{active.name}' as facet object",
            )
        else:
            row = box.row()
            row.enabled = False
            row.label(text="Select a mesh to mark it.")

        # ---- Mesh validation ----------------------------------------------
        box = layout.box()
        box.label(text="Mesh validation", icon="CHECKMARK")
        box.operator(
            "holoflow.validate_scene",
            text="Validate for Holoflow",
            icon="VIEWZOOM",
        )
        row = box.row()
        row.scale_y = 0.7
        row.label(text="Tri-count, UVs, n-gons, naming.")

        # ---- Export --------------------------------------------------------
        box = layout.box()
        box.label(text="Export", icon="EXPORT")

        # The suggestion logic runs once on first draw when the field
        # is empty — saves the author keying the same default path.
        if not scene.holoflow_export_path:
            scene.holoflow_export_path = _suggest_export_path(context)

        box.prop(scene, "holoflow_export_path", text="")

        box.operator(
            "holoflow.export_scene_glb",
            text="Export to .glb",
            icon="EXPORT",
        )

        row = box.row()
        row.scale_y = 0.7
        row.label(text="Default: <repo>/public/models/<scene>/<object>.glb")
