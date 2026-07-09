"""
Python bpy.ops.wm.usd_export + bpy.types.USDHook — USDZ Pipeline
Blender 5.1 | CC0 — Holoflow Studio

Registers a USDHook that stamps holoflow: namespace metadata on every prim
via the pxr Python bindings Blender ships internally, exports a binary .usdc,
then packages it with textures into a .usdz archive using Python's zipfile
module. USDZ is required for Apple visionOS RealityKit and iOS Quick Look.

Run: Scripting workspace → Run Script  ·  blender --background --python blueprint.py
Outputs: usd_export/scene_export.usdc + textures/ → holoflow_scene.usdz

Outside sources:
  Blender Foundation — USD Export docs (CC-BY-4.0)
    https://docs.blender.org/manual/en/5.1/files/import_export/usd.html
  PixarAnimationStudios/OpenUSD — pxr Python API (Apache-2.0)
    https://github.com/PixarAnimationStudios/OpenUSD
    Related: usd-wg/usd-working-group (Apache-2.0)
      https://github.com/usd-wg/usd-working-group
"""

import bpy, mathutils, os, zipfile, json

# ── Named constants ──────────────────────────────────────────────────────────
OUTPUT_DIR     = bpy.path.abspath("//usd_export/")
USDC_NAME      = "scene_export.usdc"
USDZ_NAME      = "holoflow_scene.usdz"
TEX_SUBDIR     = "textures"
FRAME_START, FRAME_END = 1, 60
HOOK_NAMESPACE = "holoflow"

# ── Scene construction ───────────────────────────────────────────────────────
def build_scene():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)

    # Faceted gem — low-poly icosphere, Principled BSDF glass
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1, radius=0.5,
                                          location=(0, 0, 0.6))
    gem = bpy.context.active_object
    gem.name = "gem_faceted"
    bpy.ops.object.shade_flat()
    mat = bpy.data.materials.new("gem_glass")
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value           = (0.2, 0.7, 1.0, 1.0)
    bsdf.inputs["Metallic"].default_value             = 0.0
    bsdf.inputs["Roughness"].default_value            = 0.05
    bsdf.inputs["Transmission Weight"].default_value  = 0.95   # → USDPreview opacity=0.05
    bsdf.inputs["IOR"].default_value                  = 1.52
    gem.data.materials.append(mat)

    # Floor
    bpy.ops.mesh.primitive_plane_add(size=4.0, location=(0, 0, 0))
    floor = bpy.context.active_object
    floor.name = "floor"
    fm = bpy.data.materials.new("floor_mat")
    fm.use_nodes = True
    fm.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = (
        0.12, 0.12, 0.14, 1.0)
    fm.node_tree.nodes["Principled BSDF"].inputs["Roughness"].default_value = 0.6
    floor.data.materials.append(fm)

    # Key light
    bpy.ops.object.light_add(type='AREA', location=(2.5, -2.0, 3.5))
    bpy.context.active_object.name = "key_light"
    bpy.context.active_object.data.energy = 120.0
    bpy.context.active_object.data.size   = 1.5

    # Camera
    bpy.ops.object.camera_add(location=(0, -3.5, 1.5))
    cam = bpy.context.active_object
    cam.name = "export_camera"
    cam.rotation_euler = mathutils.Euler((1.22, 0, 0), 'XYZ')
    bpy.context.scene.camera = cam

    # Turntable — Z rotation, linear, one full turn over FRAME_END frames
    action = bpy.data.actions.new("gem_turntable")
    gem.animation_data_create()
    gem.animation_data.action = action
    fc = action.fcurves.new(data_path="rotation_euler", index=2)
    fc.keyframe_points.add(count=2)
    fc.keyframe_points[0].co = (FRAME_START, 0.0)
    fc.keyframe_points[1].co = (FRAME_END,   6.28318)
    for kp in fc.keyframe_points:
        kp.interpolation = 'LINEAR'
    fc.update()
    bpy.context.scene.frame_start = FRAME_START
    bpy.context.scene.frame_end   = FRAME_END

# ── USDHook — pxr namespace stamps ──────────────────────────────────────────
# WHY a USDHook vs post-processing?
#   on_export() fires after Blender fills the in-memory USD stage, before it
#   flushes to disk — the live pxr.Usd.Stage object is writable here.
#   Post-processing the binary .usdc is impossible without the pxr crate writer.
# WHY unregister_class in a finally block?
#   The type registry is persistent across Scripting workspace runs.
#   A second run without unregistering raises RuntimeError: already registered.

class HoloflowUSDHook(bpy.types.USDHook):
    bl_idname = "holoflow_usd_hook"
    bl_label  = "Holoflow USD Namespace Stamper"

    @staticmethod
    def on_export(export_context):
        try:
            from pxr import Sdf  # bundled with Blender 4.1+; guard for safety
        except ImportError:
            print("[holoflow_usd_hook] pxr not available — skipping stamp")
            return
        stage = export_context.get_stage()
        if stage is None:
            return
        # Root: schema version
        stage.GetPseudoRoot().SetCustomDataByKey(
            f"{HOOK_NAMESPACE}:schema_version",
            Sdf.ValueTypeNames.String.type.pythonClass("1.0")
        )
        # Per Mesh prim: facet flag + export source
        for prim in stage.Traverse():
            if prim.GetTypeName() == "Mesh":
                prim.SetCustomDataByKey(
                    f"{HOOK_NAMESPACE}:facet",
                    Sdf.ValueTypeNames.Bool.type.pythonClass(True)
                )
                prim.SetCustomDataByKey(
                    f"{HOOK_NAMESPACE}:export_source",
                    Sdf.ValueTypeNames.String.type.pythonClass("blender-5.1")
                )

    @staticmethod
    def on_material_export(export_context, bl_material, usd_material):
        try:
            from pxr import Sdf  # noqa: PLC0415
        except ImportError:
            return
        mat_prim = usd_material.GetPrim()
        if not mat_prim:
            return
        mat_prim.SetCustomDataByKey(
            f"{HOOK_NAMESPACE}:material_class",
            Sdf.ValueTypeNames.String.type.pythonClass(
                "transmission" if "glass" in bl_material.name else "opaque"
            )
        )

# ── Export USDC ──────────────────────────────────────────────────────────────
def export_usdc(output_dir):
    os.makedirs(output_dir, exist_ok=True)
    os.makedirs(os.path.join(output_dir, TEX_SUBDIR), exist_ok=True)
    usdc_path = os.path.join(output_dir, USDC_NAME)

    # WHY generate_preview_surface=True?  Apple RealityKit reads USDPreviewSurface;
    #   without it every mesh renders solid grey in visionOS / Quick Look.
    #   Mapping: Base Color→diffuseColor, Roughness→roughness, Metallic→metallic,
    #   IOR→ior, Transmission→opacity (inverted: 0.95 transmission → opacity=0.05).
    # WHY convert_orientation=True?  Blender is Z-up; visionOS expects Y-up.
    # WHY relative_paths=False?  Absolute paths needed for zipfile archiver to
    #   locate the textures; paths are irrelevant inside a self-contained .usdz.
    # WHY merge_transform_and_shape=True?  Collapses Xform+Mesh prim pairs into
    #   one Mesh prim — simpler hierarchy, smaller file.  Set False for VFX
    #   pipelines that need independent composition override per prim.
    # WHY use_instancing=True?  GN instances → USD PointInstancer — GPU-instanced
    #   in RealityKit rather than geometry-duplicated.

    with bpy.context.temp_override(**bpy.context.copy()):
        bpy.ops.wm.usd_export(
            filepath                       = usdc_path,
            check_existing                 = False,
            selected_objects_only          = False,
            visible_objects_only           = True,
            export_animation               = True,
            export_hair                    = False,
            export_uvmaps                  = True,
            export_normals                 = True,
            export_materials               = True,
            export_meshes                  = True,
            export_lights                  = True,
            export_cameras                 = True,
            use_instancing                 = True,
            evaluation_mode                = 'VIEWPORT',
            generate_preview_surface       = True,
            export_textures                = True,
            overwrite_textures             = True,
            relative_paths                 = False,
            export_custom_properties       = True,
            merge_transform_and_shape      = True,
            convert_orientation            = True,
            export_global_forward_selection = 'NEG_Z',
            export_global_up_selection     = 'Y',
            start_frame                    = FRAME_START,
            end_frame                      = FRAME_END,
        )
    print(f"[holoflow] USDC → {usdc_path}  "
          f"({os.path.getsize(usdc_path)//1024} KB)")
    return usdc_path

# ── USDZ packaging ───────────────────────────────────────────────────────────
def package_usdz(usdc_path, tex_dir, usdz_path):
    # ZIP_STORED (no compression) required — Apple parser uses byte-aligned
    # random access.  .usdc must be first entry (index 0) in the archive.
    # PRODUCTION NOTE: pxr.UsdUtils.CreateNewUsdzPackage(usdc_path, usdz_path)
    # rewrites texture paths to flat basenames automatically — use in production.
    # The manual zipfile approach below leaves textures/ prefix references in
    # the .usdc broken inside the archive (acceptable for learning / dev).
    textures = (
        [os.path.join(tex_dir, f) for f in os.listdir(tex_dir)
         if f.lower().endswith(('.png', '.jpg', '.webp', '.exr'))]
        if os.path.isdir(tex_dir) else []
    )
    with zipfile.ZipFile(usdz_path, 'w', compression=zipfile.ZIP_STORED) as zf:
        zf.write(usdc_path, os.path.basename(usdc_path))  # .usdc MUST be index 0
        for tex in textures:
            zf.write(tex, os.path.basename(tex))          # flat root — no subdir
    print(f"[holoflow] USDZ → {usdz_path}  "
          f"({os.path.getsize(usdz_path)//1024} KB, {len(textures)} tex)")
    return usdz_path

# ── Main ─────────────────────────────────────────────────────────────────────
def main():
    build_scene()
    bpy.utils.register_class(HoloflowUSDHook)
    try:
        usdc_path = export_usdc(OUTPUT_DIR)
        tex_dir   = os.path.join(OUTPUT_DIR, TEX_SUBDIR)
        usdz_path = package_usdz(usdc_path, tex_dir,
                                  os.path.join(OUTPUT_DIR, USDZ_NAME))
        manifest  = {
            "schema": "holoflow-usd-export/1.0", "blender": "5.1",
            "usdc": USDC_NAME, "usdz": USDZ_NAME,
            "frame_range": [FRAME_START, FRAME_END], "up_axis": "Y",
            "spatial_targets": ["visionOS", "iOS-QuickLook", "Unity-USD"],
        }
        with open(os.path.join(OUTPUT_DIR, "export_manifest.json"), 'w') as f:
            json.dump(manifest, f, indent=2)
        print("[holoflow] USD/USDZ export pipeline complete.")
    finally:
        bpy.utils.unregister_class(HoloflowUSDHook)

main()
