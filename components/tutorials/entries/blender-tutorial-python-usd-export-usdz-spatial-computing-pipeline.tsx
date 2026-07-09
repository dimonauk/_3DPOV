import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        USD — Universal Scene Description — is a family of three formats that
        share the same schema:{" "}
        <code>.usda</code> (human-readable ASCII), <code>.usdc</code> (binary
        &lsquo;crate&rsquo; format, fast to parse), and <code>.usdz</code> (a
        ZIP_STORED archive containing a <code>.usdc</code> plus all referenced
        textures). Apple&rsquo;s visionOS RealityKit reads only
        <code>.usdz</code> and <code>.reality</code>; iOS/iPadOS Quick Look
        reads <code>.usdz</code> natively from Safari, Files, and Mail.
        GLB is not supported in these contexts. If your asset pipeline targets
        both WebXR (Three.js / Babylon.js) and spatial computing (visionOS,
        iOS AR), you must export <em>two</em> formats: GLB for the browser, USDZ
        for the Apple spatial runtime. Blender 5.1 handles both from the same
        scene; the only requirement is that you call{" "}
        <code>bpy.ops.wm.usd_export()</code> <em>and</em>{" "}
        <code>bpy.ops.export_scene.gltf()</code> in sequence inside the same
        script.
      </p>

      <p>
        The most important export flag for visionOS is{" "}
        <code>generate_preview_surface=True</code>. Apple RealityKit reads{" "}
        <code>USDPreviewSurface</code> shader nodes; it does <em>not</em> read
        MDL, MaterialX, or raw texture files wired to geometry. Without this
        flag, every mesh renders as solid grey regardless of the material you
        authored in Blender. The Principled BSDF maps to USDPreviewSurface as
        follows: <code>Base Color</code> → <code>diffuseColor</code>,{" "}
        <code>Roughness</code> → <code>roughness</code>, <code>Metallic</code>{" "}
        → <code>metallic</code>, <code>IOR</code> → <code>ior</code>, and{" "}
        <code>Transmission Weight</code> → <code>opacity</code> (inverted:
        transmission&nbsp;0.9 → opacity&nbsp;0.1). The{" "}
        <Link
          href="/tutorials/blender-tutorial-shader-principled-bsdf-v2-gltf-pbr-webxr"
          className={lk}
        >
          Principled BSDF → glTF PBR export tutorial
        </Link>{" "}
        maps the same shader graph to glTF extensions; the USD mapping is
        almost identical, making this tutorial a natural companion for
        dual-format delivery.
      </p>

      <p>
        <code>bpy.types.USDHook</code> is the equivalent of the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-gltf-user-extension-export-extras-hook"
          className={lk}
        >
          GLTF2 user extension hook
        </Link>{" "}
        for the USD exporter. You register a subclass with{" "}
        <code>bpy.utils.register_class()</code> before calling the export
        operator, then Blender fires <code>on_export(export_context)</code>{" "}
        once (giving you the live <code>pxr.Usd.Stage</code> object) and{" "}
        <code>on_material_export(export_context, bl_material,
        usd_material)</code>{" "}
        once per material. Inside these callbacks the full{" "}
        <code>pxr</code> Python API is available — Blender 4.1+ ships its own
        OpenUSD build internally. The blueprint uses this to stamp every Mesh
        prim with <code>holoflow:facet</code> and{" "}
        <code>holoflow:export_source</code> custom data, and every material prim
        with <code>holoflow:material_class</code>. Always call{" "}
        <code>bpy.utils.unregister_class()</code> in a <code>finally</code>{" "}
        block — failing to do so causes a{" "}
        <code>RuntimeError: class already registered</code> on the next script
        run in the same Blender session, because Blender&rsquo;s type registry
        is persistent across Scripting workspace executions.
      </p>

      <p>
        Pre-export scene hygiene matters for USD just as it does for GLB. The{" "}
        <Link
          href="/tutorials/blender-tutorial-python-modifier-stack-pre-export-apply"
          className={lk}
        >
          modifier stack pre-export apply tutorial
        </Link>{" "}
        covers the canonical approach for GLB; the USD exporter applies
        modifiers automatically during <code>evaluation_mode='VIEWPORT'</code>{" "}
        depsgraph evaluation, so manual application is usually not required.
        However, the <code>convert_orientation=True</code> flag is essential:
        Blender is Z-up; USD (and therefore visionOS) expects Y-up. Omitting
        it produces an asset that appears sideways in Quick Look. If you also
        export GLB for WebXR, the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-blender-extensions-platform-manifest-build-package"
          className={lk}
        >
          Blender Extensions Platform tutorial
        </Link>{" "}
        shows how to package both exporters as a single-button extension that
        runs the full dual-format pipeline.
        The{" "}
        <a
          href="https://docs.blender.org/manual/en/5.1/files/import_export/usd.html"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          Blender Foundation USD Export manual (CC-BY-4.0)
        </a>{" "}
        lists every operator parameter; the{" "}
        <a
          href="https://github.com/PixarAnimationStudios/OpenUSD"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          PixarAnimationStudios/OpenUSD repository (Apache-2.0)
        </a>{" "}
        contains the <code>pxr.UsdUtils.CreateNewUsdzPackage()</code> utility
        that rewrites internal texture paths automatically when packaging — the
        production-grade alternative to the manual{" "}
        <code>zipfile.ZipFile</code> approach demonstrated in the blueprint.
        The sibling{" "}
        <a
          href="https://github.com/usd-wg/usd-working-group"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          usd-wg/usd-working-group (Apache-2.0)
        </a>{" "}
        tracks evolving USD interchange conventions between DCC tools, game
        engines, and spatial computing runtimes.
      </p>
    </>
  );
}

const base = {
  slug: "blender-tutorial-python-usd-export-usdz-spatial-computing-pipeline",
  title:
    "Python bpy.ops.wm.usd_export + bpy.types.USDHook — USDZ Pipeline: Blender 5.1 to Spatial Computing",
  lede: "Register a USDHook to stamp pxr namespace metadata on every exported prim, call bpy.ops.wm.usd_export() with full production settings (USDPreviewSurface, Y-up orientation, texture export), then package the result as a self-contained .usdz archive for Apple visionOS RealityKit and iOS Quick Look.",
  date: "2026-07-09",
  author: "Holoflow Studio",
  tags: [
    "blender",
    "python",
    "bpy",
    "usd",
    "usdz",
    "usdc",
    "spatial-computing",
    "visionos",
    "apple",
    "realitykit",
    "usd-hook",
    "pxr",
    "scripting",
    "export",
    "webxr",
  ],
  Body,
};

export const entry: Entry = buildInstructable(
  {
    blenderVersion: "5.1",
    libraryPath:
      "blends/scripting/python-usd-export-usdz-spatial-computing-pipeline",
    time: "forty minutes",
    difficulty: "intermediate",
    software: [
      {
        name: "Blender",
        version: "5.1",
        url: "https://www.blender.org/download/",
        cost: "free",
      },
    ],
    prerequisites: [
      "Comfortable in the Scripting workspace; understands bpy.data vs bpy.ops",
      "Familiarity with Principled BSDF and PBR material authoring",
      "Has reviewed the GLTF2 user extension hook tutorial (recommended)",
    ],
    steps: [
      {
        title:
          "Understand the USD format family — usda vs usdc vs usdz, and when each applies",
        body: "# USD FORMAT FAMILY\n#\n# .usda  — Human-readable ASCII. Slow to parse (text scanning), large on disk.\n#          Useful for debugging and hand-editing prims. Never ship to a device.\n#\n# .usdc  — Binary 'crate' format. Fast random-access reads, compact on disk.\n#          This is what bpy.ops.wm.usd_export() writes when filepath ends in\n#          .usdc or .usd (Blender auto-detects). Fast to load in RealityKit.\n#\n# .usdz  — ZIP archive containing one .usdc + all textures at the root.\n#          - ZIP_STORED (no compression) — required; compressed zips are\n#            rejected by Apple's parser because it needs byte-aligned random access.\n#          - The .usdc MUST be the first entry in the archive (index 0).\n#          - All texture paths inside the .usdc must be FLAT (basename only),\n#            not subdirectory-relative. Blender exports them under textures/;\n#            pxr.UsdUtils.CreateNewUsdzPackage() fixes the paths automatically.\n#          - visionOS, iOS Quick Look, and macOS Preview all accept .usdz.\n#            Unity accepts it via its USD importer. Unreal via Datasmith.\n#\n# GLB vs USDZ: not either/or\n#   Three.js/WebXR: GLB (no native USD support in browsers as of 2025).\n#   Apple visionOS / iOS AR:  USDZ (no native GLB support in RealityKit).\n#   Strategy: export both from the same Blender scene. Same geometry and\n#   materials — different format wrapping. Script sequence:\n#     bpy.ops.wm.usd_export(filepath='//out/scene.usdc', ...)\n#     package_usdz('//out/scene.usdc', '//out/textures/', '//out/scene.usdz')\n#     bpy.ops.export_scene.gltf(filepath='//out/scene.glb', ...)\n\n# WHY bpy.ops.wm.usd_export() not a direct pxr stage write?\n#   The operator handles 20+ sub-tasks: mesh triangulation, UV layout, custom\n#   normal encoding, modifier evaluation via depsgraph, material→USDPreview-\n#   Surface node graph construction, instancing → USD PointInstancer,\n#   frame-by-frame animation baking, and .usdc crate serialisation.\n#   Writing that from scratch with the pxr API alone is several thousand lines.\n#   Reserve raw pxr writes for post-export layer composition (subLayers, refs).\n\n# TROUBLESHOOTING:\n#   'usd_export operator not found':\n#     Blender must be compiled with USD support (all official builds 3.0+).\n#     Check bpy.ops.wm.usd_export has a __doc__; if AttributeError, USD is absent.\n#   'pxr import fails inside USDHook':\n#     Wrap in try/except; fallback to a no-op hook.  pxr is bundled but only\n#     reachable from within Blender's Python environment, not system Python.\n\nprint('USD format check:', hasattr(bpy.ops.wm, 'usd_export'))",
      },
      {
        title:
          "Build an export-ready scene — gem, floor, key light, camera",
        body: "import bpy, mathutils\n\nbpy.ops.object.select_all(action='SELECT')\nbpy.ops.object.delete(use_global=False)\n\n# Gem — low-poly icosphere, flat shading, glass Principled BSDF\n# WHY icosphere subdivisions=1 (20 faces)?\n#   The lowest-polygon sphere that still reads as 'gem' when flat-shaded.\n#   USD PointInstancer duplicates can be 2000+ copies of this; keeping\n#   face count low matters.  Subdivide in the RealityKit scene if detail needed.\nbpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1, radius=0.5,\n                                      location=(0, 0, 0.6))\ngem = bpy.context.active_object\ngem.name = 'gem_faceted'\nbpy.ops.object.shade_flat()\n\nmat = bpy.data.materials.new('gem_glass')\nmat.use_nodes = True\nbsdf = mat.node_tree.nodes['Principled BSDF']\nbsdf.inputs['Base Color'].default_value           = (0.2, 0.7, 1.0, 1.0)\nbsdf.inputs['Metallic'].default_value             = 0.0\nbsdf.inputs['Roughness'].default_value            = 0.05\nbsdf.inputs['Transmission Weight'].default_value  = 0.95   # → opacity 0.05\nbsdf.inputs['IOR'].default_value                  = 1.52   # → ior 1.52\ngem.data.materials.append(mat)\n\n# Floor — dark plane, diffuse only\nbpy.ops.mesh.primitive_plane_add(size=4.0, location=(0, 0, 0))\nfloor = bpy.context.active_object\nfloor.name = 'floor'\nfm = bpy.data.materials.new('floor_mat')\nfm.use_nodes = True\nfm.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value = (\n    0.12, 0.12, 0.14, 1.0)\nfm.node_tree.nodes['Principled BSDF'].inputs['Roughness'].default_value = 0.6\nfloor.data.materials.append(fm)\n\n# Key light\nbpy.ops.object.light_add(type='AREA', location=(2.5, -2.0, 3.5))\nkey = bpy.context.active_object\nkey.name = 'key_light'\nkey.data.energy = 120.0\nkey.data.size   = 1.5\n\n# Camera\nbpy.ops.object.camera_add(location=(0, -3.5, 1.5))\ncam = bpy.context.active_object\ncam.name = 'export_camera'\ncam.rotation_euler = mathutils.Euler((1.22, 0, 0), 'XYZ')\nbpy.context.scene.camera = cam\n\n# Turntable — 60-frame Z rotation on the gem\naction = bpy.data.actions.new('gem_turntable')\ngem.animation_data_create()\ngem.animation_data.action = action\nfc = action.fcurves.new(data_path='rotation_euler', index=2)\nfc.keyframe_points.add(count=2)\nfc.keyframe_points[0].co = (1, 0.0)\nfc.keyframe_points[1].co = (60, 6.28318)\nfor kp in fc.keyframe_points:\n    kp.interpolation = 'LINEAR'\nfc.update()\nbpy.context.scene.frame_start = 1\nbpy.context.scene.frame_end   = 60\n\nprint('Scene ready:', [o.name for o in bpy.context.scene.objects])\n\n# TROUBLESHOOTING:\n#   'Transmission Weight input not found on Principled BSDF':\n#     In Blender < 4.0 the input was called 'Transmission'; renamed in 4.0.\n#     Blueprint targets Blender 5.1.  On older builds use 'Transmission'.\n#   'camera_add returns CANCELLED':\n#     Must be in OBJECT mode.  Run bpy.ops.object.mode_set(mode='OBJECT') first.",
      },
      {
        title:
          "Register HoloflowUSDHook — stamp every prim with holoflow: namespace metadata",
        body: "import bpy\n\nHOOK_NAMESPACE = 'holoflow'\n\nclass HoloflowUSDHook(bpy.types.USDHook):\n    bl_idname = 'holoflow_usd_hook'\n    bl_label  = 'Holoflow USD Namespace Stamper'\n\n    @staticmethod\n    def on_export(export_context):\n        \"\"\"\n        Called ONCE after Blender fills the in-memory USD stage, BEFORE the\n        crate is flushed to disk.  Modifying the stage here is zero-overhead\n        and type-safe through the pxr API.\n\n        WHY not post-process the .usdc file?\n          The binary crate format is undocumented outside the pxr crate writer.\n          Post-processing .usda (ASCII) is fragile and requires a re-export.\n          The hook is the only correct hook point for stage-level edits.\n        \"\"\"\n        try:\n            from pxr import Sdf  # noqa: PLC0415 — guarded; pxr is Blender-internal\n        except ImportError:\n            print('[holoflow_usd_hook] pxr not available — skipping')\n            return\n\n        stage = export_context.get_stage()\n        if stage is None:\n            return\n\n        # Root metadata — schema version + export timestamp placeholder\n        root = stage.GetPseudoRoot()\n        root.SetCustomDataByKey(\n            f'{HOOK_NAMESPACE}:schema_version',\n            Sdf.ValueTypeNames.String.type.pythonClass('1.0')\n        )\n\n        # Per-Mesh prim — facet flag and export source\n        # WHY check prim.GetTypeName() == 'Mesh'?\n        #   USD prims include Xform, Camera, DistantLight, Mesh, etc.\n        #   Stamping non-Mesh prims with holoflow:facet would be semantically\n        #   incorrect (facet is a mesh topology property, not a light property).\n        for prim in stage.Traverse():\n            if prim.GetTypeName() == 'Mesh':\n                prim.SetCustomDataByKey(\n                    f'{HOOK_NAMESPACE}:facet',\n                    Sdf.ValueTypeNames.Bool.type.pythonClass(True)\n                )\n                prim.SetCustomDataByKey(\n                    f'{HOOK_NAMESPACE}:export_source',\n                    Sdf.ValueTypeNames.String.type.pythonClass('blender-5.1')\n                )\n\n    @staticmethod\n    def on_material_export(export_context, bl_material, usd_material):\n        \"\"\"Called once per exported material — add material class tag.\"\"\"\n        try:\n            from pxr import Sdf  # noqa: PLC0415\n        except ImportError:\n            return\n        mat_prim = usd_material.GetPrim()\n        if not mat_prim:\n            return\n        mat_prim.SetCustomDataByKey(\n            f'{HOOK_NAMESPACE}:material_class',\n            Sdf.ValueTypeNames.String.type.pythonClass(\n                'transmission' if 'glass' in bl_material.name else 'opaque'\n            )\n        )\n\n# Register before calling the export operator\nbpy.utils.register_class(HoloflowUSDHook)\nprint('HoloflowUSDHook registered')\n\n# TROUBLESHOOTING:\n#   'RuntimeError: class HoloflowUSDHook already registered':\n#     The class is still registered from a previous run in this Blender session.\n#     Always unregister in a finally block (see main() in blueprint.py).\n#     Quick fix: bpy.utils.unregister_class(HoloflowUSDHook) then re-run.\n#   'on_export fires but stage is None':\n#     export_context.get_stage() returns None when the operator was called\n#     from a context that deferred stage creation.  This should not occur\n#     with bpy.ops.wm.usd_export() called from the Scripting workspace.\n#     If it does, file a bug at projects.blender.org.",
      },
      {
        title:
          "Export USDC — bpy.ops.wm.usd_export() with full production parameters",
        body: "import bpy, os\n\nOUTPUT_DIR = bpy.path.abspath('//usd_export/')\nos.makedirs(OUTPUT_DIR, exist_ok=True)\nUSADC_PATH  = os.path.join(OUTPUT_DIR, 'scene_export.usdc')\nTEX_DIR     = os.path.join(OUTPUT_DIR, 'textures')\nos.makedirs(TEX_DIR, exist_ok=True)\n\n# ── bpy.ops.wm.usd_export() — annotated parameter reference ─────────────────\n#\n# generate_preview_surface=True\n#   CRITICAL for visionOS. Generates a USDPreviewSurface shader node from each\n#   Principled BSDF. Without it: solid grey in RealityKit / Quick Look.\n#\n# export_textures=True, overwrite_textures=True\n#   Exports baked texture images to textures/ alongside the .usdc.\n#   Required for USDZ packaging — all textures must be co-located.\n#\n# convert_orientation=True, export_global_forward_selection='NEG_Z', up='Y'\n#   Rotates the scene 90° so Blender's Z-up becomes USD Y-up.\n#   visionOS expects Y-up; omit and the asset appears sideways in Quick Look.\n#\n# merge_transform_and_shape=True\n#   Collapses Xform+Mesh prim pairs into a single Mesh prim with inline\n#   transform.  Simpler hierarchy, smaller file.  Set False for VFX pipelines\n#   that need separate override of transform vs geometry.\n#\n# use_instancing=True\n#   Geometry Nodes instances → USD PointInstancer.  Crucial for scattered\n#   assets (foliage, pebbles, crystals) — PointInstancer is GPU-instanced in\n#   RealityKit, not geometry-duplicated.\n#\n# relative_paths=False\n#   Use absolute paths inside the .usdc. Required when packaging into USDZ —\n#   the zip archiver needs to find the textures by absolute path.  After\n#   packaging the paths are irrelevant (self-contained archive).\n#\n# export_animation=True, start_frame=1, end_frame=60\n#   Bake the 60-frame turntable to USD time samples.  visionOS loops the\n#   animation automatically when autoPlay is set on the RealityView.\n\noverride = bpy.context.copy()\nwith bpy.context.temp_override(**override):\n    bpy.ops.wm.usd_export(\n        filepath                       = USDC_PATH,\n        check_existing                 = False,\n        selected_objects_only          = False,\n        visible_objects_only           = True,\n        export_animation               = True,\n        export_hair                    = False,\n        export_uvmaps                  = True,\n        export_normals                 = True,\n        export_materials               = True,\n        export_meshes                  = True,\n        export_lights                  = True,\n        export_cameras                 = True,\n        export_curves                  = False,\n        use_instancing                 = True,\n        evaluation_mode                = 'VIEWPORT',\n        generate_preview_surface       = True,\n        export_textures                = True,\n        overwrite_textures             = True,\n        relative_paths                 = False,\n        export_custom_properties       = True,\n        merge_transform_and_shape      = True,\n        convert_orientation            = True,\n        export_global_forward_selection = 'NEG_Z',\n        export_global_up_selection     = 'Y',\n        start_frame                    = 1,\n        end_frame                      = 60,\n    )\n\nprint('[holoflow] USDC written →', USDC_PATH,\n      '(', os.path.getsize(USDC_PATH) // 1024, 'KB )')\n\n# TROUBLESHOOTING:\n#   'context is incorrect':\n#     Some USD export flags require OBJECT mode.  Ensure:\n#       bpy.ops.object.mode_set(mode='OBJECT') before calling the operator.\n#   'textures/ directory is empty after export':\n#     export_materials=True alone does not write textures.  export_textures\n#     must also be True.  Materials using only Principled BSDF constant values\n#     (no Image Texture nodes) produce no texture files — that is correct.\n#   'generate_preview_surface=True causes slow export':\n#     Blender bakes each image texture node and writes PNGs.  For large scenes\n#     set overwrite_textures=False to skip re-baking unchanged textures.",
      },
      {
        title:
          "Package USDZ — ZIP_STORED archive, .usdc first, textures flat at root",
        body: "import os, zipfile\n\nUSADC_PATH = os.path.join(OUTPUT_DIR, 'scene_export.usdc')\nTEX_DIR    = os.path.join(OUTPUT_DIR, 'textures')\nUSDZ_PATH  = os.path.join(OUTPUT_DIR, 'holoflow_scene.usdz')\n\n# Collect textures from the textures/ export subdirectory\ntextures = []\nif os.path.isdir(TEX_DIR):\n    textures = [os.path.join(TEX_DIR, f)\n                for f in os.listdir(TEX_DIR)\n                if f.lower().endswith(('.png', '.jpg', '.webp', '.exr'))]\n\n# WHY ZIP_STORED (no compression)?\n#   The USDZ spec (Apple WWDC 2018) requires uncompressed storage because\n#   the USD crate reader uses byte-offset random access into the archive.\n#   A deflated entry cannot be seeked into without full decompression.\n#   Apple's arUtilityCreateUSDZArchive(), RealityKit's .init(named:),\n#   and iOS Quick Look all reject .usdz with compressed entries.\n#   Using zipfile.ZIP_DEFLATED produces a file that opens on desktop\n#   (macOS Preview decompresses first) but fails on device.\n\n# WHY .usdc first in the archive?\n#   The USDZ format spec requires the .usdc (or .usda) to be the very first\n#   entry (index 0) in the ZIP.  Quick Look uses the first entry as the root\n#   layer; entries are not sorted alphabetically after extraction.\n\n# LIMITATION — texture path flattening:\n#   Blender writes texture references as textures/<file>.png inside the .usdc.\n#   When we flatten the textures into the zip root, those relative paths\n#   become broken inside the self-contained archive.  The production fix:\n#     from pxr import UsdUtils\n#     UsdUtils.CreateNewUsdzPackage(usdc_path, usdz_path)\n#   CreateNewUsdzPackage rewrites all internal paths to flat basenames\n#   before zipping. Use the manual approach below only for learning / testing.\n\nwith zipfile.ZipFile(USDZ_PATH, 'w', compression=zipfile.ZIP_STORED) as zf:\n    zf.write(USDC_PATH, os.path.basename(USDC_PATH))   # .usdc MUST be index 0\n    for tex in textures:\n        zf.write(tex, os.path.basename(tex))            # flat root — no subdir\n\nsize_kb = os.path.getsize(USDZ_PATH) // 1024\nprint(f'[holoflow] USDZ → {USDZ_PATH}  ({size_kb} KB, {len(textures)} tex)')\n\n# Verify the first entry is the .usdc\nwith zipfile.ZipFile(USDZ_PATH, 'r') as zf:\n    first = zf.namelist()[0]\n    assert first.endswith('.usdc') or first.endswith('.usda'), (\n        f'USDZ first entry must be .usdc/.usda, got {first}')\n    print('[holoflow] Archive validated — first entry:', first)\n\n# TROUBLESHOOTING:\n#   'Quick Look shows blank / grey on iPhone':\n#     1. Verify the .usdc is entry index 0 (check above assertion).\n#     2. Verify generate_preview_surface=True was used in the export.\n#     3. Use pxr.UsdUtils.CreateNewUsdzPackage to fix path rewriting.\n#   'Large USDZ file (>50 MB) fails to open on device':\n#     iOS/visionOS has a Quick Look memory budget.  Reduce texture resolution\n#     and simplify mesh face count before packaging.\n#   'macOS Preview opens the .usdz but visionOS refuses it':\n#     macOS Preview falls back to full decompression; the device parser does not.\n#     Always use ZIP_STORED regardless of whether macOS opens the file.",
      },
      {
        title:
          "Write export manifest, unregister hook, and verify output",
        body: "import bpy, json, os\n\n# ── Export manifest ──────────────────────────────────────────────────────────\nmanifest = {\n    'schema':           'holoflow-usd-export/1.0',\n    'blender':          '5.1',\n    'usdc':             'scene_export.usdc',\n    'usdz':             'holoflow_scene.usdz',\n    'frame_range':      [1, 60],\n    'up_axis':          'Y',\n    'spatial_targets':  ['visionOS', 'iOS-QuickLook', 'Unity-USD'],\n}\nmanifest_path = os.path.join(OUTPUT_DIR, 'export_manifest.json')\nwith open(manifest_path, 'w') as f:\n    json.dump(manifest, f, indent=2)\nprint('[holoflow] manifest →', manifest_path)\n\n# ── Unregister the hook ───────────────────────────────────────────────────────\n# WHY unregister in a finally block, not here?\n#   If package_usdz() or export_usdc() raises an exception, this code line\n#   is never reached and the hook remains registered.  On the next Run Script\n#   Blender raises 'RuntimeError: class HoloflowUSDHook already registered'.\n#   Wrapping in try/finally (as shown in main() in blueprint.py) guarantees\n#   cleanup even on script error.\nbpy.utils.unregister_class(HoloflowUSDHook)\nprint('[holoflow] HoloflowUSDHook unregistered')\n\n# ── Verify outputs ────────────────────────────────────────────────────────────\nfor fname, label in [\n    ('scene_export.usdc',      'USDC binary'),\n    ('holoflow_scene.usdz',    'USDZ archive'),\n    ('export_manifest.json',   'Manifest JSON'),\n]:\n    path = os.path.join(OUTPUT_DIR, fname)\n    exists = os.path.exists(path)\n    size   = os.path.getsize(path) // 1024 if exists else 0\n    status = 'OK' if exists else 'MISSING'\n    print(f'  [{status}] {label}: {fname}  ({size} KB)')\n\nprint('[holoflow] USD/USDZ export pipeline complete.')\n\n# FULL PIPELINE SUMMARY:\n#\n# 1. build_scene()            — gem + floor + light + camera + turntable action\n# 2. register_class(Hook)     — USDHook stamps holoflow: metadata on every prim\n# 3. usd_export()             — USDC + textures to usd_export/\n# 4. package_usdz()           — ZIP_STORED archive, .usdc first, textures flat\n# 5. write_manifest()         — JSON sidecar for asset pipeline\n# 6. unregister_class(Hook)   — cleanup for repeated runs\n#\n# GLB COMPANION (WebXR):\n#   After step 5, add:\n#     bpy.ops.export_scene.gltf(\n#         filepath   = os.path.join(OUTPUT_DIR, 'scene.glb'),\n#         use_draco_mesh_compression = True,\n#         draco_mesh_compression_level = 6,\n#         export_yup = True,\n#     )\n#   Same scene → same geometry → two delivery formats from one script run.\n#\n# PRODUCTION RECOMMENDATION:\n#   Replace the manual zipfile packaging with:\n#     from pxr import UsdUtils\n#     UsdUtils.CreateNewUsdzPackage(\n#         os.path.join(OUTPUT_DIR, 'scene_export.usdc'),\n#         os.path.join(OUTPUT_DIR, 'holoflow_scene.usdz')\n#     )\n#   This rewrites all internal texture paths to flat basenames automatically\n#   and verifies the archive structure complies with the USDZ specification.",
      },
    ],
  },
  base
);
