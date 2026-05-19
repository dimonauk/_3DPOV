# Holoflow WebXR exporter — operators.
#
# Two operators:
#   * HOLOFLOW_OT_export_scene_glb — runs the canonical glTF export with
#     studio defaults baked in. Mostly a wrapper around the built-in
#     `export_scene.gltf` operator with our argument shape.
#   * HOLOFLOW_OT_validate_scene — runs the validators in validators.py
#     and writes results to the info bar.

import os
import re

import bpy

from . import validators


# Per-preset tri-count budgets pulled from docs/WEBXR-DEVICE-TARGETS.md
# (section 3, the hard deck rows). The numbers are *per-object* working
# budgets, not whole-scene; the gallery cap is enforced at scene level
# elsewhere.
PRESET_BUDGETS = {
    "sculpture_piece": 80_000,    # gallery piece, three on screen at once
    "sculpture_wall": 20_000,     # wall reliefs are flat by design
    "splat_prop": 250_000,        # splat-walker hero props, desktop class
    "scenestage_prop": 60_000,    # middling demo prop
    "generic_gltf": 100_000,      # default until the author picks better
}


# Per-preset export overrides applied on top of the canonical defaults.
PRESET_OVERRIDES = {
    "sculpture_piece": {
        "export_draco_mesh_compression_level": 6,
        "export_image_format": "WEBP",
        "export_animations": False,  # gallery pieces don't animate
    },
    "sculpture_wall": {
        "export_draco_mesh_compression_level": 7,  # bias smaller
        "export_image_format": "WEBP",
        "export_animations": False,
    },
    "splat_prop": {
        "export_draco_mesh_compression_level": 5,  # less aggressive, keep detail
        "export_image_format": "WEBP",
        "export_animations": True,
    },
    "scenestage_prop": {
        "export_draco_mesh_compression_level": 6,
        "export_image_format": "WEBP",
        "export_animations": True,
    },
    "generic_gltf": {
        "export_draco_mesh_compression_level": 6,
        "export_image_format": "WEBP",
        "export_animations": True,
    },
}


_SLUG_RE = re.compile(r"[^a-z0-9_]+")


def slugify(name: str) -> str:
    """Snake_case slugger for object names.

    Trims, lowercases, swaps every non-[a-z0-9_] run for a single
    underscore, collapses repeats, strips leading/trailing underscores.
    """
    s = name.strip().lower().replace("-", "_").replace(" ", "_")
    s = _SLUG_RE.sub("_", s)
    s = re.sub(r"_+", "_", s).strip("_")
    return s or "object"


def _apply_flat_facets(context):
    """For every object marked holoflow:facet, force flat normals.

    The high-facet aesthetic relies on per-face normals — the moment a
    mesh ships smooth-shaded the look collapses. glTF doesn't carry the
    Blender "Shade Flat" bit directly; we have to bake it into custom
    split normals so it round-trips.

    Saves and restores active object + selection so calling this from
    the export operator doesn't surprise the author.
    """
    prev_active = context.view_layer.objects.active
    prev_selected = list(context.selected_objects)

    touched = []
    for obj in context.scene.objects:
        if obj.type != "MESH":
            continue
        if not getattr(obj, "holoflow_facet", False):
            continue

        # Make the object the sole active selection for the operator.
        for o in context.selected_objects:
            o.select_set(False)
        obj.select_set(True)
        context.view_layer.objects.active = obj

        mesh = obj.data
        # Flat shade every polygon — sets the per-poly flag.
        for poly in mesh.polygons:
            poly.use_smooth = False

        # Bake custom split normals from the flat-shaded state, so the
        # glTF exporter has something concrete to emit.
        try:
            bpy.ops.mesh.customdata_custom_splitnormals_clear()
        except RuntimeError:
            # Mesh has no custom split normals yet — that's fine.
            pass
        bpy.ops.mesh.customdata_custom_splitnormals_add()
        mesh.use_auto_smooth = True
        mesh.auto_smooth_angle = 0.0  # zero radians = every edge is a crease

        touched.append(obj.name)

    # Restore prior selection.
    for o in context.selected_objects:
        o.select_set(False)
    for o in prev_selected:
        if o.name in context.scene.objects:
            o.select_set(True)
    context.view_layer.objects.active = prev_active

    return touched


def _enforce_root_naming(context):
    """Rename top-level scene objects to snake_case slugs.

    Only renames objects whose parent is None — children keep their
    artist-friendly names because the JSON schema only addresses roots.
    """
    renamed = []
    for obj in list(context.scene.objects):
        if obj.parent is not None:
            continue
        slug = slugify(obj.name)
        if slug != obj.name:
            old = obj.name
            obj.name = slug
            renamed.append((old, obj.name))
    return renamed


class HOLOFLOW_OT_export_scene_glb(bpy.types.Operator):
    """Export the scene to .glb with Holoflow studio defaults."""

    bl_idname = "holoflow.export_scene_glb"
    bl_label = "Export Scene for Holoflow WebXR Game Framework"
    bl_description = (
        "Runs the canonical glTF export: binary .glb, +Y up, transforms "
        "applied, Draco level 6, WebP textures, tangents on, 30fps anim "
        "bake, snake_case root names. Optional flat-normal pass for "
        "holoflow:facet objects."
    )
    bl_options = {"REGISTER", "UNDO"}

    def execute(self, context):
        scene = context.scene
        preset = scene.holoflow_preset
        path = bpy.path.abspath(scene.holoflow_export_path or "")
        if not path:
            self.report({"ERROR"}, "Holoflow: target path is empty.")
            return {"CANCELLED"}

        # Make sure the directory exists.
        target_dir = os.path.dirname(path)
        if target_dir and not os.path.isdir(target_dir):
            try:
                os.makedirs(target_dir, exist_ok=True)
            except OSError as exc:
                self.report({"ERROR"}, f"Holoflow: cannot create {target_dir}: {exc}")
                return {"CANCELLED"}

        # 1. Snake_case root names so the JSON schema is predictable.
        renamed = _enforce_root_naming(context)
        if renamed:
            self.report(
                {"INFO"},
                f"Holoflow: renamed {len(renamed)} root object(s) to snake_case.",
            )

        # 2. Force flat normals on every holoflow:facet object.
        if scene.holoflow_force_facet:
            touched = _apply_flat_facets(context)
            if touched:
                self.report(
                    {"INFO"},
                    f"Holoflow: flat-normalled {len(touched)} facet object(s).",
                )

        # 3. Canonical export defaults + preset overrides.
        overrides = PRESET_OVERRIDES.get(preset, {})
        kwargs = {
            "filepath": path,
            "export_format": "GLB",
            "export_yup": True,                          # +Y up — glTF standard
            "export_apply": True,                        # bake transforms
            "export_draco_mesh_compression_enable": True,
            "export_draco_mesh_compression_level": 6,    # balance size vs decode
            "export_image_format": "WEBP",               # smaller than PNG/JPEG
            "export_tangents": True,                     # for normal-mapped mats
            "export_animations": True,
            "export_frame_range": True,
            "export_force_sampling": True,
            "export_anim_single_armature": True,
            "export_skins": True,
            "export_morph": True,
            "export_morph_normal": True,
            "export_cameras": False,
            "export_lights": False,
            "export_extras": True,                       # carries custom props
            "export_apply_modifiers": True,
        }
        kwargs.update(overrides)

        # Animation bake rate — locked to 30 fps to match the site's
        # render loop budget. Set the scene fps first so the exporter
        # samples at the right rate.
        prev_fps = scene.render.fps
        prev_fps_base = scene.render.fps_base
        scene.render.fps = 30
        scene.render.fps_base = 1.0
        try:
            bpy.ops.export_scene.gltf(**kwargs)
        except Exception as exc:  # noqa: BLE001 — Blender raises bare exc here
            scene.render.fps = prev_fps
            scene.render.fps_base = prev_fps_base
            self.report({"ERROR"}, f"Holoflow: glTF export failed: {exc}")
            return {"CANCELLED"}
        finally:
            scene.render.fps = prev_fps
            scene.render.fps_base = prev_fps_base

        self.report({"INFO"}, f"Holoflow: exported {path}")
        return {"FINISHED"}


class HOLOFLOW_OT_validate_scene(bpy.types.Operator):
    """Run the Holoflow validation checks against the active scene."""

    bl_idname = "holoflow.validate_scene"
    bl_label = "Validate for Holoflow"
    bl_description = (
        "Walks the scene and checks tri-count, UV presence, n-gons, "
        "naming. Prints results to the info bar."
    )

    def execute(self, context):
        scene = context.scene
        budget = PRESET_BUDGETS.get(scene.holoflow_preset, 100_000)
        messages = []
        messages.extend(validators.validate_tri_count(scene, budget))
        messages.extend(validators.validate_uvs(scene))
        messages.extend(validators.validate_ngons(scene))
        messages.extend(validators.validate_naming(scene))

        if not messages:
            self.report({"INFO"}, "Holoflow: scene passes every check.")
            return {"FINISHED"}

        for msg in messages:
            severity = msg["severity"]
            label = {"info": "INFO", "warning": "WARNING", "error": "ERROR"}[severity]
            self.report({label}, f"Holoflow [{msg['object_name']}]: {msg['message']}")

        errors = sum(1 for m in messages if m["severity"] == "error")
        if errors:
            self.report({"WARNING"}, f"Holoflow: {errors} error(s) — fix before export.")
        return {"FINISHED"}
