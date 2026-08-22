import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function PythonBatchGlbExporterBody() {
  return (
    <>
      <p>
        Most Blender pipelines export GLBs one object at a time from the File
        menu. That works for a single prop; it breaks the moment you have twelve
        collections — a hero asset, a set of environment pieces, a UI panel
        cluster — each destined for its own file in the WebXR asset library.
        This tutorial replaces that manual round-trip with a Python script you
        run once from the Scripting workspace: every top-level collection whose
        name starts with <code>HF_EXPORT_</code> is exported as a separate
        Draco-compressed GLB, and a <code>manifest.json</code> is written
        listing every slug, polygon count, and file size. Run it again and the
        outputs are overwritten; the script is idempotent.
      </p>

      <p>
        The two subtleties that trip people up are the{" "}
        <strong>LayerCollection vs Collection distinction</strong> and the{" "}
        <strong>export_apply flag</strong>. The glTF exporter&apos;s
        <code>use_active_collection</code> parameter reads from
        <code>bpy.context.view_layer.active_layer_collection</code>, which is a{" "}
        <code>LayerCollection</code> — a thin wrapper that represents a{" "}
        <code>Collection</code> within one specific view layer&apos;s hierarchy.{" "}
        <code>bpy.data.collections</code> returns bare <code>Collection</code>{" "}
        objects; you cannot assign one directly. The fix is a nine-line recursive
        traversal of <code>view_layer.layer_collection</code> that maps a
        collection name back to its <code>LayerCollection</code>. That traversal
        is the only piece of non-obvious plumbing in the entire script.
      </p>

      <p>
        <code>export_apply=True</code> is the other essential flag. It tells the
        exporter to evaluate the full dependency graph — modifiers, transforms,
        shape keys at rest — before building the export mesh. This is the
        headless equivalent of Object ▸ Convert ▸ Mesh, but without mutating
        the source data in the .blend. Without it, a Subdivision Surface modifier
        at Level 2 produces a low-res quad mesh in the GLB that does not match
        what renders in the viewport. The flag has been stable since the
        Khronos{" "}
        <a
          href="https://github.com/KhronosGroup/glTF-Blender-IO"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          glTF-Blender-IO
        </a>{" "}
        rewrite in Blender 3.3 and remains the recommended approach in 5.1.
        Compare with the manual apply-transforms step in the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bpy-geonodes-tree-api"
          className={lk}
        >
          bpy GN Tree API tutorial
        </Link>
        , which modifies the source mesh because it builds the geometry from
        scratch rather than re-using existing assets.
      </p>

      <p>
        Draco compression is specified via four parameters:{" "}
        <code>export_draco_mesh_compression_level</code> (0–10, where 6 is the
        sweet spot) and three quantisation-bit depths for positions, normals, and
        UVs. Quantisation discards sub-bit precision: at 14 bits for position you
        retain roughly 0.06 mm accuracy over a 1 m object — imperceptible in a
        WebXR scene. Dropping to 10 bits halves the position data size but
        introduces visible stepping on smooth curves. The defaults in this
        blueprint (14 / 10 / 12) follow the same conventions used by{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-curve-to-mesh"
          className={lk}
        >
          the GN Curve to Mesh tutorial
        </Link>{" "}
        and the{" "}
        <code>holoflow_webxr_exporter</code> add-on, so the output is
        byte-for-byte compatible with the site&apos;s asset loader.
      </p>

      <p>
        The naming convention is load-bearing. Each collection name after the
        <code>HF_EXPORT_</code> prefix becomes the GLB filename: a collection
        named <code>HF_EXPORT_gem_cluster</code> produces{" "}
        <code>gem_cluster.glb</code>. Root object names inside each collection
        are normalised to snake_case before export so the glTF node names are
        clean identifiers (no spaces, dots, or capitals). This mirrors the
        snake_case root-name requirement enforced by the{" "}
        <Link href="/tutorials/blender-tutorial-python-addon-custom-panel-property-group" className={lk}>
          custom panel and PropertyGroup add-on
        </Link>
        , where Python identifiers for custom properties follow the same
        convention for the same reason: the runtime expects stable, script-safe
        names, not localised display strings.
      </p>
    </>
  );
}

const base = {
  slug: "blender-tutorial-python-batch-glb-exporter",
  title: "Python: Batch GLB Scene Exporter — Collection-per-GLB Pipeline",
  date: "2026-06-18",
  kind: "tutorial" as const,
  excerpt:
    "Iterate every HF_EXPORT_ collection, export each as a Draco-compressed GLB via bpy.ops.export_scene.gltf(use_active_collection=True, export_apply=True), and write a manifest JSON. Expert depth on LayerCollection traversal, Draco quantisation bit depths, WebP texture conversion, and snake_case node naming for Three.js scene graphs.",
  tags: ["blender", "scripting", "python", "glb", "pipeline", "draco", "webxr"],
  Body: PythonBatchGlbExporterBody,
};

export const entry: Entry = buildInstructable(
  {
    steps: [
      {
        title: "Prefix convention and collection discovery",
        body:
          "Name every collection you want to export with a shared prefix — HF_EXPORT_ in this blueprint:\n\n  EXPORT_PREFIX = 'HF_EXPORT_'\n  export_cols = [\n      c for c in bpy.data.collections\n      if c.name.startswith(EXPORT_PREFIX)\n  ]\n\nbpy.data.collections is a flat list of ALL Collection objects in the .blend, regardless of view-layer membership or nesting. Filtering by prefix is simpler and more reliable than checking scene.collection.children, which only covers top-level children of the master collection and misses nested collections.\n\nWHY prefix rather than a custom property:\n  A bl_rna custom property (e.g. obj['holoflow:export'] = True) would require opening each collection's Properties panel to set. The prefix is visible directly in the Outliner, survives copy-paste between files, and is searchable with Ctrl+F. It is the same approach used by many production pipelines (e.g. UE4's SM_ / SK_ prefix convention for static/skeletal meshes).\n\nSort the result by name so GLBs are written in a deterministic order and the manifest is diff-friendly across runs:\n  export_cols = sorted(export_cols, key=lambda c: c.name)",
      },
      {
        title: "LayerCollection vs Collection: the traversal",
        body:
          "bpy.ops.export_scene.gltf reads from bpy.context.view_layer.active_layer_collection. This must be a LayerCollection, not a bare Collection. The two are different types:\n\n  bpy.types.Collection     — the collection DATA (name, objects, children)\n  bpy.types.LayerCollection — a view-layer node wrapping that data, with its own exclude/hide_viewport per-view-layer flags\n\nbpy.data.collections[n] returns Collection. view_layer.active_layer_collection needs LayerCollection.\n\nThe mapping is not direct; you must walk the tree:\n\n  def find_layer_collection(root_lc, name):\n      if root_lc.collection.name == name:\n          return root_lc\n      for child in root_lc.children:\n          found = find_layer_collection(child, name)\n          if found:\n              return found\n      return None\n\n  root_lc = bpy.context.view_layer.layer_collection  # always the scene master\n  lc = find_layer_collection(root_lc, col.name)\n  bpy.context.view_layer.active_layer_collection = lc\n\nThis works for collections nested arbitrarily deep in the Outliner. The recursion depth is bounded by the Outliner nesting depth — in practice never more than 5–6 levels.\n\nIf find_layer_collection returns None, the collection exists in bpy.data but is not linked to the current view layer (common with linked libraries). Skip it with a warning rather than crashing.",
      },
      {
        title: "export_apply=True: what it bakes and what it does not",
        body:
          "bpy.ops.export_scene.gltf(export_apply=True) evaluates the full Blender dependency graph for each object before writing the mesh to the GLB:\n\n  Modifier stack  — SubDiv, Boolean, GN, Array, etc. are baked at export time\n  Object transforms — location / rotation / scale are applied to vertex positions\n  Shape keys       — all shape keys are collapsed into the Basis at rest\n\nWhat export_apply does NOT cover:\n  Drivers          — evaluated at the current scene frame (set scene.frame_current first)\n  NLA / Actions    — pose channels are baked at the current frame, not animated\n  Constraints      — world matrix is baked at current frame\n\nFor a static prop this is exactly what you want. For a character with a rig, you typically export at rest pose (frame 0) and include vertex weights instead:\n  bpy.ops.export_scene.gltf(\n      export_skins = True,    # vertex weights → glTF skin\n      export_apply = False,   # leave modifiers symbolic; weights drive deform at runtime\n  )\n\nSee the armature weight-paint tutorial for the skinned-export variant.\n\nUnder the hood, export_apply=True calls ob.evaluated_get(depsgraph) where depsgraph = bpy.context.evaluated_depsgraph_get(). The evaluated object has its modifier results baked into its .data, without touching the source object in the .blend.",
      },
      {
        title: "Draco parameters: compression level and quantisation bits",
        body:
          "Draco is a Google geometry-compression codec built into the Khronos glTF-Blender-IO exporter. Two independent axes control the output size:\n\n1. Compression LEVEL (0–10):\n  Controls the Draco encoder's effort at rearranging triangles and attributes to improve entropy coding. Level 6 (this blueprint's default) halves the uncompressed mesh size with imperceptible visual difference. Level 10 is ~20 % smaller than level 6 but 5× slower to encode; not worth it in a live pipeline.\n\n2. Quantisation BITS (per attribute type):\n  Position   : 14 bits → ~0.06 mm error on a 1 m mesh. 10 bits → ~1 mm error.\n  Normals    : 10 bits → ~0.1° angular error. Sufficient for smooth shading.\n  UVs        : 12 bits → 1/4096 precision — preserves sub-texel alignment on 1024 px maps.\n\n  bpy.ops.export_scene.gltf(\n      export_draco_mesh_compression_enable     = True,\n      export_draco_mesh_compression_level      = 6,\n      export_draco_position_quantization       = 14,\n      export_draco_normal_quantization         = 10,\n      export_draco_texcoord_quantization       = 12,\n  )\n\nDraco is decoded by three.js DRACOLoader at runtime. The Holoflow site already bundles the Draco WASM decoder, so no additional setup is needed for assets produced by this script.\n\nNote: Draco is lossy by design. Never use it as your archive format. Keep the uncompressed .blend as the authoritative source; GLBs are derived outputs.",
      },
      {
        title: "WebP textures: export_image_format='WEBP'",
        body:
          "Setting export_image_format='WEBP' in the glTF exporter converts all embedded textures to WebP at export time:\n\n  bpy.ops.export_scene.gltf(\n      export_image_format = 'WEBP',\n      export_image_quality = 90,   # 0–100; 90 = visually lossless for most textures\n  )\n\nWebP at quality 90 is typically 25–40 % smaller than JPEG at equivalent quality, and 60–70 % smaller than lossless PNG. For a 1024 px PBR texture set (base colour + roughness + normal), switching from PNG to WebP typically saves 300–500 KB per GLB.\n\nLimitations:\n  1. WebP is not supported in glTF 2.0 by the core spec — it is an extension (KHR_materials_unlit does not mandate it). Three.js r150+ and Babylon.js 6+ support embedded WebP in GLB via the WEBP fallback path. The Holoflow asset loader (Three.js r168) handles it correctly.\n  2. Safari < 14 does not support WebP at all. On older iOS devices the texture falls back to a generated PNG (Three.js manages this via HTMLImageElement). For maximum compat, use export_image_format='AUTO' (which keeps source format) and convert separately with cwebp.\n  3. Normal maps encoded as WebP lossy (even at quality 95) can show slight banding on very fine surface detail. For hero character assets, consider exporting the normal map as lossless WebP (export_image_quality=100) or as PNG.",
      },
      {
        title: "Snake-case naming and the manifest JSON",
        body:
          "glTF node names directly map to Three.js mesh names (scene.getObjectByName('arch_column_shaft')). Spaces, dots, and mixed case all work technically, but they produce fragile JavaScript:\n  scene.getObjectByName('Arch Column Shaft.001')  // breaks if name changes\n  scene.getObjectByName('arch_column_shaft')       // stable; grep-able; lint-friendly\n\nThe script renames root objects (objects with no parent inside the collection) before export:\n\n  def snake_case(s):\n      return s.lower().replace(' ','_').replace('-','_').replace('.','_')\n\n  for obj in col.all_objects:\n      if obj.parent is None or obj.parent not in set(col.all_objects):\n          obj.name = snake_case(obj.name)\n\nParented children inherit the rename indirectly via glTF hierarchy. Only rename root objects to avoid double-processing children whose parent was already renamed.\n\nThe manifest JSON records what was exported:\n  {\n    'blender_version': '5.1.0',\n    'blend_file': 'batch_pipeline.blend',\n    'draco_level': 6,\n    'webp_textures': true,\n    'exports': [\n      { 'slug': 'arch_column', 'collection': 'HF_EXPORT_arch_column',\n        'filepath': '/.../arch_column.glb', 'objects': 3, 'polygons': 256, 'size_kb': 12 },\n      ...\n    ],\n    'total_exported': 3\n  }\n\nThis manifest is consumed by MANIFEST.md automation and by the site's asset-loader sanity check, which verifies that every GLB in the library has a corresponding manifest entry before deploying.",
      },
      {
        title: "Save blend, run export, verify output",
        body:
          "The exporter resolves OUTPUT_DIR = '//../../glbs/...' relative to the .blend file path. If the file has never been saved, bpy.data.filepath is an empty string and os.path.dirname of that is the process working directory — not the library root. Always save first:\n\n  bpy.ops.wm.save_as_mainfile(filepath=blend_path)\n\nThen call run_batch_export(). Each collection's LayerCollection is set active, the GLB is written, and the result dict is appended to results. After all collections are processed, the manifest is written to OUTPUT_DIR/manifest.json.\n\nVerify output:\n  import os\n  for r in results:\n      assert os.path.exists(r['filepath']), f\"Missing: {r['filepath']}\"\n      assert r['size_kb'] > 0, f\"Empty GLB: {r['slug']}\"\n\nA size_kb of 0 indicates the export silently failed (usually because use_active_collection found nothing to export — check that the LayerCollection is not set to Excluded in the view layer).",
      },
    ],
    finalResult:
      "A Python script and demo .blend with three HF_EXPORT_ collections (arch column, gem cluster, cable bundle). Running blueprint.py from the Scripting workspace produces three Draco-compressed GLBs with WebP textures and a manifest.json in public/library/glbs/scripting/python-batch-glb-exporter/. The script is idempotent: re-running it overwrites outputs without side effects.",
    variations: [
      "Per-LOD export: add a second pass that duplicates each collection, runs the Decimate modifier at ratio 0.25 (targeting 25 % poly count), and exports to a separate /lod1/ subfolder. Name GLBs with a _lod1 suffix so Three.js LOD switching (THREE.LOD) can reference both.",
      "Git-commit integration: after the manifest is written, call subprocess.run(['git', 'add', output_abs, 'public/library/MANIFEST.md']) and optionally auto-commit. Dangerous if run carelessly; gate it behind an AUTOCOMMIT = False flag.",
      "Texture atlasing: after export, run a second pass with a custom node-group that bakes all material outputs (Base Color, Roughness, Normal) onto a single UV layout using bpy.ops.object.bake(type='COMBINED'). Then strip individual textures and embed the atlas. Reduces draw calls in Three.js from N materials to 1.",
      "Asset Library publishing: after export, call bpy.ops.asset.mark() on each exported object and use bpy.ops.wm.lib_relocate() to push the .blend into a shared Blender Asset Library directory. The batch exporter GLBs and the Asset Library .blend stay in sync because they are both derived from the same HF_EXPORT_ collections.",
    ],
    troubleshooting: [
      {
        symptom: "find_layer_collection returns None for a valid collection",
        cause:
          "The collection exists in bpy.data.collections but is not linked to the scene's view layer. This happens with linked library collections (File ▸ Link) that are present in bpy.data but excluded from the current view layer.",
        fix:
          "Check scene.collection.children_recursive — if the collection is absent, it is not in the scene's master collection at all. Link it via bpy.context.scene.collection.children.link(col). If it is linked but excluded at the view-layer level, find its LayerCollection and set lc.exclude = False.",
      },
      {
        symptom: "GLB is exported but contains no geometry (0-byte or tiny file)",
        cause:
          "use_active_collection=True exports only objects visible in the viewport within the active LayerCollection. If the collection's visibility is off in the current view layer (eye icon in Outliner), the exporter finds nothing to write.",
        fix:
          "Before exporting, ensure lc.hide_viewport = False and lc.exclude = False. Add a guard:\n  if lc.exclude: lc.exclude = False\n  if lc.hide_viewport: lc.hide_viewport = False",
      },
      {
        symptom: "Curve objects export as empty GLB even with export_apply=True",
        cause:
          "Blender curves with bevel_depth > 0 generate mesh geometry in the viewport but the glTF exporter in some 5.1 builds requires converting the curve to mesh before export when export_apply=True is not sufficient.",
        fix:
          "Add a convert step before export for CURVE objects:\n  for obj in col.all_objects:\n      if obj.type == 'CURVE':\n          bpy.context.view_layer.objects.active = obj\n          bpy.ops.object.convert(target='MESH')\nThis mutates the source data; run on a copy if the source .blend should remain unchanged.",
      },
      {
        symptom: "manifest.json is written with 'unsaved' for blend_file",
        cause:
          "bpy.data.filepath is empty because the .blend was never saved before running the exporter.",
        fix:
          "Call bpy.ops.wm.save_as_mainfile(filepath=...) before run_batch_export(). The script's main() already does this; if running the exporter functions standalone, ensure filepath is set first.",
      },
    ],
  },
  base,
);
