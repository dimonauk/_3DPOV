import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function AssetLibraryMarkCatalogueBody() {
  return (
    <>
      <p>
        Every Blender project eventually accumulates materials, node groups, and
        objects that you want to reach again without hunting through old
        <code>.blend</code> files. The Asset Library system solves that: any
        datablock you mark becomes addressable from the Asset Browser panel in
        any future session. The Python API lets you mark dozens of assets in a
        single script run, attach tags and descriptions, assign catalogue
        categories, and save to a shared library file — a task that would take
        an afternoon of clicking in the UI.
      </p>

      <p className="mt-3">
        The key distinction is between an <em>asset</em> and a
        <em>datablock</em>. Every material in a <code>.blend</code> is a
        datablock; only those with{" "}
        <code>asset_data</code> written (via <code>asset_mark()</code>) appear
        in the Asset Browser. The metadata includes a description string, a set
        of string tags for searching, and — critically — a <strong>catalog
        UUID</strong> that links to a row in a plain-text{" "}
        <code>.cats.txt</code> file sitting alongside the library{" "}
        <code>.blend</code>. Blender reads that file when it indexes the
        library folder, building the category tree shown in the Asset Browser
        left panel. Because the link is by UUID rather than by path string,
        renaming a category in <code>.cats.txt</code> does not break existing
        assets — their UUIDs remain intact.
      </p>

      <h3 className="text-lg font-semibold mt-6 mb-2">
        The <code>asset_mark()</code> / <code>AssetMetaData</code> API
      </h3>
      <pre className="bg-zinc-900 rounded p-4 text-sm overflow-x-auto whitespace-pre">{`mat = bpy.data.materials["HF_Faceted_Flat"]
mat.asset_mark()           # writes AssetMetaData struct; datablock is now an asset

ad = mat.asset_data        # bpy.types.AssetMetaData
ad.description = "Studio flat-shaded Principled. Pairs with holoflow:facet geometry."
ad.catalog_id  = "ho10f1ow-0001-0001-0000-000000000001"   # must match .cats.txt UUID
ad.tags.new("vrm",      skip_if_exists=True)
ad.tags.new("low-poly", skip_if_exists=True)

# Re-running the script is safe: asset_mark() is idempotent after 4.0.`}</pre>
      <p>
        The <code>skip_if_exists=True</code> flag on{" "}
        <code>tags.new()</code> is what makes the script safe to re-run: it
        does not raise an error if the tag is already present. Without it you
        get duplicate tag entries on subsequent runs.
      </p>

      <h3 className="text-lg font-semibold mt-6 mb-2">
        Catalogue UUIDs and <code>.cats.txt</code>
      </h3>
      <pre className="bg-zinc-900 rounded p-4 text-sm overflow-x-auto whitespace-pre">{`# ~/holoflow_asset_lib.cats.txt
VERSION 1

ho10f1ow-0000-0000-0000-000000000000:Holoflow:Holoflow Studio
ho10f1ow-0001-0000-0000-000000000001:Holoflow/Materials:Materials
ho10f1ow-0001-0001-0000-000000000001:Holoflow/Materials/PBR:PBR
ho10f1ow-0001-0002-0000-000000000001:Holoflow/Materials/NPR:NPR`}</pre>
      <p>
        Format: <code>UUID:path/with/slashes:Display Name</code>. Blender
        reads it once per library-folder index pass (triggered by opening the
        Asset Browser or via Edit → Preferences → File Paths → Asset Libraries
        → Refresh). Write it with Python so it stays in version control alongside
        the <code>blueprint.py</code>; never hand-edit the UUIDs.
      </p>

      <h3 className="text-lg font-semibold mt-6 mb-2">
        Preview thumbnails
      </h3>
      <p>
        <code>bpy.ops.ed.lib_id_generate_preview()</code> triggers an
        off-screen render of the datablock&apos;s preview image — the
        thumbnail shown in the Asset Browser grid. In interactive sessions
        (Blender window open) this works immediately. In{" "}
        <code>--background</code> mode there is no display context and the
        call is silently ignored; Blender generates previews the first time
        the library is opened interactively. The script wraps the call in a{" "}
        <code>try/except</code> so background runs do not abort.
      </p>

      <h3 className="text-lg font-semibold mt-6 mb-2">
        Saving to an external library
      </h3>
      <pre className="bg-zinc-900 rounded p-4 text-sm overflow-x-auto whitespace-pre">{`bpy.ops.wm.save_as_mainfile(
    filepath="/home/user/holoflow_asset_lib.blend",
    copy=True,      # saves a copy without making it the active file
)
# Register the folder in:
# Edit → Preferences → File Paths → Asset Libraries → (+) → path = ~/`}</pre>
      <p>
        The <code>copy=True</code> flag is essential in a scripted context: it
        saves to the library path without redirecting subsequent autosaves
        there. Without it, the next <kbd>Ctrl+S</kbd> overwrites the library
        file with whatever you have open — which is usually wrong.
      </p>

      <h3 className="text-lg font-semibold mt-6 mb-2">
        Four studio-standard materials in this blueprint
      </h3>
      <ul className="list-disc ml-5 space-y-1 text-sm">
        <li>
          <strong>HF_Faceted_Flat</strong> — Principled BSDF, Roughness 0.85,
          steel blue. Designed for flat-shaded low-poly geometry with the{" "}
          <code>holoflow:facet</code> flag. Tagged{" "}
          <code>vrm, low-poly, faceted, pbr</code>.
        </li>
        <li>
          <strong>HF_Toon_Cel</strong> — Shader-to-RGB → CONSTANT ColorRamp →
          Emission. Two-stop shadow/lit posterisation. EEVEE-native; Cycles
          degrades gracefully. Tagged <code>vrm, cel, toon, eevee, npr</code>.
          See the{" "}
          <Link href="/tutorials/blender-tutorial-eevee-toon-cel-shader" className={lk}>
            EEVEE Toon Cel Shader tutorial
          </Link>
          .
        </li>
        <li>
          <strong>HF_Glass_Clear</strong> — Principled, IOR 1.50, Transmission
          Weight 1.0. API handles the 4.x rename from{" "}
          <code>Transmission</code> to{" "}
          <code>Transmission Weight</code> via <code>try/except</code>. See the{" "}
          <Link href="/tutorials/blender-tutorial-shader-principled-transmission-iridescence" className={lk}>
            Principled Transmission tutorial
          </Link>
          .
        </li>
        <li>
          <strong>HF_Emissive_Grid</strong> — procedural sci-fi grid via
          Texture Coordinate → fract(UV × scale) → smoothstep → Emission. No
          UV bake required.
        </li>
      </ul>

      <h3 className="text-lg font-semibold mt-6 mb-2">Outside sources</h3>
      <ul className="list-disc ml-5 space-y-1 text-sm">
        <li>
          <a
            href="https://docs.blender.org/manual/en/latest/files/asset_libraries/introduction.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Blender Manual — Asset Libraries
          </a>{" "}
          (CC-BY 4.0, Blender Foundation &amp; contributors). Primary reference
          for library registration, catalogue file format, and operator list.
          Related project:{" "}
          <a
            href="https://developer.blender.org/docs/features/asset_system/"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Blender Developer Portal — Asset System design docs
          </a>
          .
        </li>
        <li>
          <a
            href="https://docs.blender.org/api/current/bpy.types.AssetMetaData.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            bpy.types.AssetMetaData API reference
          </a>{" "}
          (CC-BY 4.0, Blender Foundation). Authoritative list of fields:
          <code>description</code>, <code>catalog_id</code>,{" "}
          <code>tags</code>, <code>author</code>, <code>copyright</code>.
        </li>
      </ul>

      <p className="mt-4">
        For related scripting patterns see the{" "}
        <Link href="/tutorials/blender-tutorial-python-addon-custom-panel-property-group" className={lk}>
          custom panel &amp; PropertyGroup tutorial
        </Link>{" "}
        (building operator UIs that automate asset workflows) and the{" "}
        <Link href="/tutorials/blender-tutorial-python-batch-glb-exporter" className={lk}>
          batch GLB exporter
        </Link>{" "}
        (the other half of a studio pipeline: export what you asset-manage).
        Node group assets follow the same API — use{" "}
        <code>bpy.data.node_groups["name"].asset_mark()</code> — and integrate
        with the{" "}
        <Link href="/tutorials/blender-tutorial-python-bpy-geonodes-tree-api" className={lk}>
          GN tree API tutorial
        </Link>{" "}
        once you have programmatically built a node group worth sharing.
      </p>
    </>
  );
}

export const entry: Entry = buildInstructable(
  {
    blenderVersion: "5.1",
    libraryPath: "public/library/blends/scripting/python-asset-library-mark-catalogue/",
    time: "one focused session (≈ 45 minutes)",
    difficulty: "intermediate",
    cost: "free — all tools are part of Blender",
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
      "Basic familiarity with Blender materials (Principled BSDF, node editor)",
      "Understand what the Asset Browser panel is (Edit → Asset Browser)",
    ],
    steps: [
      {
        title: "Open blueprint.py in the Scripting workspace",
        body: "File → New → General. Switch to the Scripting workspace (top tab). In the Text Editor press New, paste the full contents of blueprint.py, and save as blueprint.py. Read through the named-constant block at the top — LIBRARY_BLEND and CATALOG_PATH default to your home directory.",
      },
      {
        title: "Run the script",
        body: "Press Alt+P (or the ▶ Run Script button). Watch the Info header at the top of the Blender window. If it shows no red error lines, the script ran cleanly. The four preview spheres appear in the 3D Viewport. Check the system console (Window → Toggle System Console on Windows; launch from terminal on Linux/Mac) for the [blueprint] log lines.",
      },
      {
        title: "Inspect assets in the Asset Browser",
        body: "Split the 3D Viewport and change one half to Asset Browser (editor-type dropdown). Set Source → Current File. You should see four material thumbnails. Click HF_Toon_Cel — the Metadata panel on the right shows its description, tags, and catalogue path (Holoflow/Materials/NPR).",
      },
      {
        title: "Verify the .cats.txt file",
        body: "Open a text editor outside Blender (or Blender's built-in Text Editor via File → Open). Navigate to your home directory and open holoflow_asset_lib.cats.txt. Confirm VERSION 1 is on line one and four UUID lines follow. These are the category registry entries Blender reads when it indexes the library folder.",
      },
      {
        title: "Register the library folder in Preferences",
        body: "Edit → Preferences → File Paths → Asset Libraries. Press (+). Set the path to your home directory (~). Name it Holoflow Studio. Click Save Preferences. Return to the Asset Browser and set Source → Holoflow Studio. The four materials appear, now accessible from any .blend file.",
      },
      {
        title: "Drag an asset into a new scene",
        body: "File → New → General. Open the Asset Browser alongside the 3D Viewport. Navigate Source → Holoflow Studio → Holoflow → Materials → PBR. Drag HF_Faceted_Flat onto the default cube. The material appears in the Material Properties slot. This is the complete drag-and-drop workflow for reusing studio assets.",
      },
      {
        title: "Extend the library",
        body: "Add your own material at the end of blueprint.py using the same four-line pattern: make_*_mat(), asset_mark(), ad.description, ad.catalog_id, ad.tags.new(). For node groups: bpy.data.node_groups['name'].asset_mark(). Re-run the script to update the library .blend. Blender re-indexes on the next Asset Browser Source switch.",
      },
    ],
    troubleshooting: [
      {
        symptom: "Asset Browser Source → Holoflow Studio shows empty",
        cause: "The library folder path in Preferences points to the wrong directory, or holoflow_asset_lib.blend has not been saved yet.",
        fix: "Confirm LIBRARY_BLEND path in blueprint.py, re-run the script, then verify the .blend file exists on disk before registering the folder.",
      },
      {
        symptom: "Materials appear but have no catalogue path (shown as 'Unassigned')",
        cause: "The catalog_id UUID in the script does not match any UUID in the .cats.txt file, or the .cats.txt file is in a different directory from the .blend.",
        fix: "Both files must be in the same folder. Check that CATALOG_PATH and LIBRARY_BLEND share the same os.path.dirname().",
      },
      {
        symptom: "KeyError: 'Transmission Weight'",
        cause: "Running on Blender 3.x where the input name was still 'Transmission'. The script handles this with try/except but if you remove that block it will crash.",
        fix: "Keep the try/except block or update to Blender 5.1 where 'Transmission Weight' is the correct name.",
      },
      {
        symptom: "Preview thumbnails are all grey in the Asset Browser",
        cause: "Script was run in --background mode; thumbnails require an interactive display context to render.",
        fix: "Open the .blend interactively. Blender generates previews automatically on the first Asset Browser view.",
      },
    ],
    finalResult: "Four studio-standard materials marked, tagged, catalogued in a .cats.txt file, and saved to ~/holoflow_asset_lib.blend. Any .blend on the machine can reach them via Asset Browser → Holoflow Studio with a single drag-and-drop.",
  },
  {
    slug: "blender-tutorial-python-asset-library-mark-catalogue",
    title: "Python — Asset Library API: Batch-Mark Materials & Node Groups as Catalogue Assets",
    date: "2026-06-19",
    kind: "tutorial",
    excerpt:
      "Use bpy's asset_mark() API to batch-mark studio materials, write a .cats.txt catalogue, and save to an external library .blend — making every material drag-and-droppable in the Asset Browser from any project.",
    Body: AssetLibraryMarkCatalogueBody,
  },
);
