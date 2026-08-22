import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function PythonLibraryLinkAppendBody() {
  return (
    <>
      <p>
        Every serious Blender pipeline eventually separates assets from assembly
        scenes. Characters live in one <code>.blend</code>, props in another, the
        lighting rig in a third — and a master composition file pulls them
        together. The mechanism that makes this work is{" "}
        <code>bpy.data.libraries.load()</code>: a context manager that opens an
        external <code>.blend</code> on disk, lets you inspect its datablocks,
        and copies selected ones into the current file. Whether that copy is a
        live external reference (linking) or a self-contained local duplicate
        (appending) is controlled by a single boolean.
      </p>

      <p className="mt-3">
        The distinction matters enormously. A linked datablock stays in the
        source file — open the source later and update a material, and every
        assembly scene that links it reflects the change automatically. An
        appended datablock breaks that connection: it is yours to modify freely,
        but it will never see updates from the source. Studio practice is to
        link for living assets (characters, reusable props) and append for
        one-off starting points that will diverge immediately.
      </p>

      <h3 className="text-lg font-semibold mt-6 mb-2">
        The <code>bpy.data.libraries.load()</code> pattern
      </h3>
      <pre className="bg-zinc-900 rounded p-4 text-sm overflow-x-auto whitespace-pre">{`# The context manager opens the .blend without making it the active file.
# src  — the source library object (read-only catalogue)
# dst  — accumulator you assign into; items assigned are copied on __exit__

with bpy.data.libraries.load("/path/to/assets.blend", link=True) as (src, dst):
    print(src.collections)   # list all collection names in the source
    dst.collections = ["HF_PropKit"]   # schedule this collection for linking

# After the with-block, dst.collections[0] is the live bpy.types.Collection
linked_coll = dst.collections[0]
bpy.context.scene.collection.children.link(linked_coll)`}</pre>
      <p>
        The <code>src</code> object exposes all the usual{" "}
        <code>bpy.data</code> attributes (<code>.objects</code>,{" "}
        <code>.materials</code>, <code>.node_groups</code>, etc.) as plain
        Python lists of name strings. Assign a subset of those names to the
        same attribute on <code>dst</code> and they are loaded when the context
        exits. Assigning an empty list or leaving an attribute unset loads
        nothing — so the pattern is safe to use as a catalogue pass if you
        assign nothing to <code>dst</code>.
      </p>

      <h3 className="text-lg font-semibold mt-6 mb-2">
        Link vs. append: what changes in the file
      </h3>
      <pre className="bg-zinc-900 rounded p-4 text-sm overflow-x-auto whitespace-pre">{`# ── LINK ──────────────────────────────────────────────────────────────────
with bpy.data.libraries.load(ASSETS_BLEND, link=True) as (src, dst):
    dst.collections = ["HF_PropKit"]

ob = list(dst.collections[0].all_objects)[0]
print(ob.library)          # <Library "//assets.blend">  ← external reference
print(ob.override_library) # None  ← cannot edit yet

# ── APPEND ─────────────────────────────────────────────────────────────────
with bpy.data.libraries.load(ASSETS_BLEND, link=False) as (src, dst):
    dst.materials = ["HF_Faceted_Flat"]

mat = dst.materials[0]
print(mat.library)         # None  ← fully local, no ongoing link`}</pre>
      <p>
        Linked objects display a thin orange outline in the viewport. Attempting
        to enter Edit Mode on a linked object raises Blender&apos;s{" "}
        <em>&quot;Cannot edit external library data&quot;</em> message — the data
        lives in the source file and Blender refuses to modify it in place.
        Appended datablocks have no outline and can be edited freely; their{" "}
        <code>.library</code> attribute is <code>None</code>.
      </p>

      <h3 className="text-lg font-semibold mt-6 mb-2">
        Cataloguing without loading
      </h3>
      <pre className="bg-zinc-900 rounded p-4 text-sm overflow-x-auto whitespace-pre">{`# Read-only catalogue pass — assign nothing to dst
with bpy.data.libraries.load(ASSETS_BLEND, link=False) as (src, _dst):
    for attr in ("collections", "objects", "materials", "node_groups"):
        items = getattr(src, attr, [])
        if items:
            print(f"  {attr}: {items}")

# Output (example):
#   collections: ['HF_PropKit']
#   materials: ['HF_Faceted_Flat']
#   node_groups: ['HF_CelShader']`}</pre>
      <p>
        This catalogue pass is the right way to build a picker UI or validate
        that expected assets exist before a batch job runs. It opens the file
        header only — no mesh data, texture images, or Python drivers are
        evaluated — so it is cheap even for large library files.
      </p>

      <h3 className="text-lg font-semibold mt-6 mb-2">
        Library Overrides — making linked data editable
      </h3>
      <p>
        A Library Override creates a local copy of the linked hierarchy where
        individual properties can diverge from the source. The classic use is
        posing a linked character in a shot scene without modifying the source
        armature. Overridden objects gain a purple tint in the viewport and an{" "}
        <code>override_library</code> attribute pointing back to the source
        datablock.
      </p>
      <pre className="bg-zinc-900 rounded p-4 text-sm overflow-x-auto whitespace-pre">{`# Link a collection first, then make its hierarchy overridable
with bpy.data.libraries.load(ASSETS_BLEND, link=True) as (src, dst):
    dst.collections = ["HF_PropKit"]

linked_coll = dst.collections[0]
bpy.context.scene.collection.children.link(linked_coll)

# Select all objects in the collection
for ob in linked_coll.all_objects:
    ob.select_set(True)
bpy.context.view_layer.objects.active = list(linked_coll.all_objects)[0]

bpy.ops.object.make_override_library()

# Now each object has:
for ob in linked_coll.all_objects:
    print(ob.name, ob.override_library is not None)  # → True`}</pre>
      <p>
        After an override, object transforms and material slot assignments can
        be changed per-scene. The source file still controls the mesh data and
        original materials. Re-syncing with the source file (via{" "}
        <strong>Object → Library Override → Resync</strong> or{" "}
        <code>bpy.ops.object.library_override_objects_resync()</code>) pulls
        in any changes from the source while preserving your local overrides.
      </p>

      <h3 className="text-lg font-semibold mt-6 mb-2">
        Inspecting provenance at runtime
      </h3>
      <pre className="bg-zinc-900 rounded p-4 text-sm overflow-x-auto whitespace-pre">{`for ob in bpy.context.scene.objects:
    lib = ob.library
    ovr = ob.override_library

    if lib and ovr:
        status = f"overridden  (src={lib.filepath})"
    elif lib:
        status = f"linked      (src={lib.filepath})"
    else:
        status = "local"

    print(f"{ob.name:<24} {status}")`}</pre>
      <p>
        This pattern is useful at the start of any batch export or validation
        script: knowing whether each object is local, linked, or overridden
        changes which operations are safe to run on it.
      </p>

      <h3 className="text-lg font-semibold mt-6 mb-2">
        Relocating a library after moving files
      </h3>
      <pre className="bg-zinc-900 rounded p-4 text-sm overflow-x-auto whitespace-pre">{`# If the source .blend moved, update the library's filepath and reload
lib = bpy.data.libraries.get("holoflow_assets.blend")
if lib:
    lib.filepath = "/new/path/holoflow_assets.blend"
    with bpy.context.temp_override(library=lib):
        bpy.ops.wm.lib_relocate(filepath=lib.filepath)
# Equivalent to File → External Data → Find Missing Files, but scriptable.`}</pre>
      <p>
        This is essential for CI pipelines where asset paths differ between a
        local machine and the build server. The{" "}
        <code>temp_override(library=lib)</code> context sets{" "}
        <code>context.library</code> which the operator reads; without it the
        operator has no target and raises a poll-failure RuntimeError.
      </p>

      <h3 className="text-lg font-semibold mt-6 mb-2">
        Holoflow pipeline pattern
      </h3>
      <p>
        The Holoflow studio composes each export scene from three layers:
      </p>
      <ul className="list-disc ml-5 space-y-1 text-sm mt-2">
        <li>
          <strong>Asset library</strong> (<code>holoflow_assets.blend</code>) —
          props, VRM character, reusable materials. Marked as assets for the
          Asset Browser. Maintained by the prop-building pipeline; never opened
          directly in assembly sessions.
        </li>
        <li>
          <strong>Assembly scene</strong> (<code>holoflow_assembly.blend</code>)
          — links the prop collection and armature, makes Library Overrides for
          scene-specific transforms and material variants. This is the file
          rendered and exported to GLB.
        </li>
        <li>
          <strong>Batch exporter script</strong> — walks{" "}
          <code>bpy.context.scene.objects</code>, filters by{" "}
          <code>ob.library is None or ob.override_library is not None</code>{" "}
          (local + overridden only), then calls{" "}
          <code>bpy.ops.export_scene.gltf()</code>. See the{" "}
          <Link
            href="/tutorials/blender-tutorial-python-batch-glb-exporter"
            className={lk}
          >
            Python Batch GLB Exporter
          </Link>{" "}
          tutorial for the full export pass.
        </li>
      </ul>

      <h3 className="text-lg font-semibold mt-6 mb-2">
        Relation to the Asset Browser
      </h3>
      <p>
        The Asset Browser drag-and-drop is a UI wrapper around exactly this
        API. When you drag a material from the Asset Browser into a viewport,
        Blender internally calls{" "}
        <code>bpy.data.libraries.load(library_blend, link=False)</code> and
        appends the asset. Marking a datablock with{" "}
        <code>asset_mark()</code> (covered in the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-asset-library-mark-catalogue"
          className={lk}
        >
          Asset Library Mark &amp; Catalogue
        </Link>{" "}
        tutorial) makes it discoverable in the browser without changing how it
        is technically loaded.
      </p>

      <h3 className="text-lg font-semibold mt-6 mb-2">
        Failure modes
      </h3>
      <ul className="list-disc ml-5 space-y-1 text-sm">
        <li>
          <strong>
            <code>dst.collections[0]</code> is <code>None</code>
          </strong>{" "}
          — the name in the assignment list did not match anything in the source
          file. Run the catalogue pass first to print available names; check for
          trailing spaces or Unicode differences in asset names.
        </li>
        <li>
          <strong>
            <code>make_override_library()</code> RuntimeError
          </strong>{" "}
          — the linked collection must be in the active view layer. Add it with{" "}
          <code>bpy.context.scene.collection.children.link(coll)</code> before
          calling the override operator.
        </li>
        <li>
          <strong>Orange outline, purple tint differences</strong> — orange =
          linked, no override; purple = linked with override. If you see neither
          colour, the object was appended (local copy) and has no ongoing link.
        </li>
        <li>
          <strong>External data broken after render farm</strong> — farm nodes
          use a different root path. Store all paths relative to the project
          root and open files with{" "}
          <code>bpy.ops.file.make_paths_relative()</code> before dispatching.
          On the farm, set <code>bpy.context.preferences.filepaths.use_relative_paths = True</code>.
        </li>
      </ul>

      <h3 className="text-lg font-semibold mt-6 mb-2">Outside sources</h3>
      <ul className="list-disc ml-5 space-y-1 text-sm">
        <li>
          <a
            href="https://docs.blender.org/manual/en/latest/files/linked_libraries/index.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Blender Manual — Linked Libraries &amp; Library Overrides
          </a>{" "}
          (CC-BY 4.0, Blender Foundation &amp; contributors). Primary reference
          for the full linking system, override resync workflow, and proxy
          deprecation note. Sibling project:{" "}
          <a
            href="https://github.com/blender/blender"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            github.com/blender/blender
          </a>{" "}
          — source for <code>bpy_extras/wm_utils/progress_report.py</code> and{" "}
          the Library Override merge logic in{" "}
          <code>source/blender/blenkernel/intern/lib_override.cc</code>.
        </li>
        <li>
          <a
            href="https://docs.blender.org/api/current/bpy.types.BlendDataLibraries.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Blender Python API — bpy.types.BlendDataLibraries
          </a>{" "}
          (CC-BY 4.0, Blender Foundation). Full attribute list on{" "}
          <code>src</code> and <code>dst</code>; all datablock types that can
          be loaded; notes on ID property handling across library boundaries.
          Related: the{" "}
          <a
            href="https://developer.blender.org/docs/features/asset_system/"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Asset System developer docs
          </a>{" "}
          on developer.blender.org (Apache-2.0).
        </li>
      </ul>

      <p className="mt-4 text-sm text-zinc-400">
        See also:{" "}
        <Link
          href="/tutorials/blender-tutorial-python-depsgraph-object-instances-gn-scatter-glb-export"
          className={lk}
        >
          Python depsgraph — GN Scatter GLB Export
        </Link>{" "}
        for harvesting instanced geometry after linking, and{" "}
        <Link
          href="/tutorials/blender-tutorial-python-context-temp-override-mesh-repair-pipeline"
          className={lk}
        >
          Python Context Temp Override — Mesh Repair Pipeline
        </Link>{" "}
        for the <code>bpy.context.temp_override()</code> pattern used in the
        relocate step.
      </p>
    </>
  );
}

export const entry: Entry = buildInstructable(
  {
    time: "one focused session (≈ 40 minutes)",
    difficulty: "intermediate",
    cost: "free — built-in Blender Python API",
    software: [
      {
        name: "Blender",
        version: "5.1",
        url: "https://www.blender.org/download/",
        cost: "free",
      },
    ],
    prerequisites: [
      "Comfortable opening the Scripting workspace and running a Python script",
      "Know what a Blender Collection is (Outliner hierarchy)",
      "Basic familiarity with the Asset Browser panel",
    ],
    steps: [
      {
        title: "Build the asset library file",
        body: "Open Blender 5.1. File → New → General. Switch to Scripting workspace. Paste the _build_asset_file() section of blueprint.py into a new text block and press Alt+P. Watch the Info header — it should confirm holoflow_assets.blend was written to your home directory. Open that file and verify: Outliner shows HF_PropKit collection with three CrystalProp objects.",
      },
      {
        title: "Catalogue an external file without loading it",
        body: "In a fresh scene, paste and run the list_datablocks() call. The Info header and system console should print the available collection, material, and node group names. This confirms the file is reachable and contains what you expect before committing to a link operation.",
      },
      {
        title: "Link the collection",
        body: "Run link_collection_from_file(ASSETS_BLEND, COLLECTION_NAME). Switch to the 3D Viewport. The three crystal props appear with a thin orange outline — the linked-data indicator. Confirm in the Item tab (N panel) that the Object properties show a chain-link icon. Try pressing Tab to enter Edit Mode — Blender refuses: 'Cannot edit external library data.' This is expected and correct.",
      },
      {
        title: "Append a material (local copy)",
        body: "Run append_material_from_file(ASSETS_BLEND, MATERIAL_NAME). In the Python console, type bpy.data.materials['HF_Faceted_Flat'].library — the result should be None, confirming the material is a local copy. Select the default cube, open Material Properties, and assign the appended material. Edit its colour — this change stays in the assembly file and does not affect holoflow_assets.blend.",
      },
      {
        title: "Make a Library Override",
        body: "In the Outliner, right-click HF_PropKit → Library Override → Make. Alternatively run the make_collection_override() function. The linked objects now show purple tint instead of orange. Press Tab on one object — Edit Mode is now allowed. Verify in the Python console: bpy.data.objects['CrystalProp_A'].override_library is not None.",
      },
      {
        title: "Inspect provenance of every scene object",
        body: "Run report_library_status(). The console prints each object's name alongside 'local', 'linked', or 'overridden (src=…)'. This is the check any batch export script should do before processing objects — only local and overridden objects can have their data exported without triggering a library-access error.",
      },
      {
        title: "Save the assembly file",
        body: "Run bpy.ops.wm.save_as_mainfile(filepath=OUTPUT_BLEND). Close Blender. Re-open holoflow_assembly.blend. Check File → External Data → Report Missing Files — it should list zero missing. The link to holoflow_assets.blend is live and healthy.",
      },
    ],
    troubleshooting: [
      {
        symptom: "dst.collections[0] is None after the with-block",
        cause: "The name assigned to dst.collections did not match any collection name in the source file (case-sensitive, including spaces).",
        fix: "Run list_datablocks(ASSETS_BLEND) first and use the exact string from src.collections. Common pitfall: Asset Browser renames on mark can append .001 suffixes.",
      },
      {
        symptom: "make_override_library() raises RuntimeError: poll failed",
        cause: "The linked collection is in bpy.data but not in the active scene's view layer. The operator needs at least one selected object from the collection to be in the scene graph.",
        fix: "Confirm bpy.context.scene.collection.children.link(linked_coll) ran successfully. Then ensure ob.select_set(True) and bpy.context.view_layer.objects.active is set before calling the operator.",
      },
      {
        symptom: "After moving files, objects show as pink (missing data)",
        cause: "The source .blend path stored in the assembly file no longer exists at the recorded location.",
        fix: "Call relocate_library(old_path, new_path) or use File → External Data → Find Missing Files → Recursively and point to the new folder. Save the assembly file to persist the updated path.",
      },
      {
        symptom: "Overridden object reverts on file reload",
        cause: "Override was created but the assembly file was not saved. Library Overrides exist as local datablocks; if the file is not saved they exist only in RAM.",
        fix: "Always save immediately after make_override_library(). The override hierarchy is written into the .blend as local datablocks distinct from the external library datablocks.",
      },
    ],
    finalResult: "holoflow_assembly.blend with HF_PropKit linked from holoflow_assets.blend, a local copy of HF_Faceted_Flat material appended and assigned, and the collection converted to Library Override so individual objects can be posed or retextured per-scene.",
  },
  {
    slug: "blender-tutorial-python-library-link-append-blend-files",
    title: "Python — bpy.data.libraries.load: Linking, Appending & Overriding Datablocks Across .blend Files",
    date: "2026-07-02",
    kind: "tutorial",
    excerpt:
      "Use bpy.data.libraries.load() to link collections and append materials from an external .blend file, inspect provenance with ob.library, make Library Overrides for scene-specific edits, and relocate broken paths — the complete multi-file pipeline foundation for Blender 5.1.",
    Body: PythonLibraryLinkAppendBody,
  },
);
