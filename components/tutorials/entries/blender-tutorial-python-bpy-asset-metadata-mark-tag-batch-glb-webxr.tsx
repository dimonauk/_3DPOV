import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        Every Blender scene eventually grows a mixed population of objects:
        hero geometry destined for a Cycles render, collision proxies, camera
        rigs, WebXR-ready props, and half-finished experiments. The{" "}
        <strong>Asset Library</strong> is Blender&rsquo;s answer to that
        chaos&thinsp;—&thinsp;a taggable, searchable catalogue of data-blocks
        that survives across files and library links. This tutorial drives the
        underlying API programmatically: mark objects as assets with{" "}
        <code>ob.asset_mark()</code>, attach studio tags and author metadata
        via <code>bpy.types.AssetMetaData</code>, then batch-export every
        object carrying the <code>&ldquo;webxr&rdquo;</code> tag to its own
        Draco-compressed GLB while silently skipping render-only assets.
      </p>

      <h2>asset_mark() vs bpy.ops.asset.mark()</h2>
      <p>
        The operator <code>bpy.ops.asset.mark()</code> works interactively in
        the 3D Viewport or Asset Browser — but it requires the object to be
        selected and active <em>inside a viewport context</em>. In a background
        script (<code>blender --background --python ...</code>) there is no
        viewport, and the operator call raises a{" "}
        <code>RuntimeError</code> or exits without marking anything. The direct
        ID-level method sidesteps this entirely:
      </p>
      <pre><code>{`ob.asset_mark()          # works in any context; idempotent
ad = ob.asset_data       # AssetMetaData block (or None if unmarked)
ob.asset_clear()         # removes asset marking`}</code></pre>
      <p>
        Calling <code>asset_mark()</code> twice on the same object is a
        no-op&thinsp;—&thinsp;the existing metadata is preserved. This makes
        it safe to re-run a build script without accumulating duplicate tags or
        overwriting descriptions added in the Asset Browser. Compare the
        analogous principle in the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bpy-context-temp-override-ops-headless-scripting"
          className={lk}
        >
          context temp-override tutorial
        </Link>
        , which covers the more general problem of running operators that need
        UI context inside a headless script.
      </p>

      <h2>Attaching structured metadata</h2>
      <pre><code>{`ob.asset_mark()
ad = ob.asset_data
ad.description = "Low-poly crate — WebXR prop"
ad.author      = "Holoflow Studio"

# TagSet.new() is idempotent: calling with an existing name is a no-op
for tag in ["webxr", "low-poly", "holoflow"]:
    ad.tags.new(tag)`}</code></pre>
      <p>
        Tags in the Asset Browser are a flat set&thinsp;—&thinsp;there is no
        hierarchy within the tag list itself. Use the catalog path (
        <code>ad.catalog_id</code>) for hierarchical organisation and tags for
        orthogonal concerns like render-target (<code>webxr</code>,{" "}
        <code>render</code>), quality tier (<code>low-poly</code>,{" "}
        <code>hi-res</code>), or ownership (<code>holoflow</code>). A single
        asset can carry as many tags as needed; filtering by tag is{" "}
        <em>O(n)</em> in the number of tags per object, not in the number of
        objects.
      </p>

      <h2>Filtering by tag at export time</h2>
      <pre><code>{`def tagged(tag: str) -> list:
    return [
        ob for ob in bpy.data.objects
        if ob.asset_data is not None
        and any(t.name == tag for t in ob.asset_data.tags)
    ]

webxr_props = tagged("webxr")`}</code></pre>
      <p>
        This pattern survives scene restructuring without revisiting the export
        script. Objects can move between collections, be linked from different
        libraries, or be renamed — the tag travels with the data-block. Compare
        the collection-based batch export in the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bpy-collection-link-visibility-override-batch-glb-webxr"
          className={lk}
        >
          collection link & visibility tutorial
        </Link>
        : collections are scene-organisation tools; tags are asset-identity
        labels. Use both together&thinsp;—&thinsp;collections for viewport
        grouping, tags for export routing.
      </p>

      <h2>Per-object GLB export</h2>
      <pre><code>{`def export_glb(ob: bpy.types.Object, out_dir: str) -> str:
    # Deselect everything first — export_scene.gltf with use_selection=True
    # exports only the active selection; stale selections add unwanted geometry.
    for o in bpy.data.objects:
        o.select_set(False)
    ob.select_set(True)
    bpy.context.view_layer.objects.active = ob

    path = out_dir + ob.name.lower() + ".glb"
    bpy.ops.export_scene.gltf(
        filepath                             = path,
        export_format                        = 'GLB',
        export_yup                           = True,
        export_apply                         = True,       # apply modifiers
        export_draco_mesh_compression_enable = True,
        export_draco_mesh_compression_level  = 6,
        export_image_format                  = 'WEBP',
        use_selection                        = True,
    )
    return path`}</code></pre>
      <p>
        The critical step is deselecting all objects before each export.{" "}
        <code>use_selection=True</code> exports the current selection, not just
        the active object — leaving previous selections active contaminates the
        output with geometry from the prior iteration. See the companion piece
        on{" "}
        <Link
          href="/tutorials/blender-tutorial-python-mathutils-kdtree-nearest-attribute-transfer-webxr"
          className={lk}
        >
          KDTree attribute transfer to low-poly proxy
        </Link>{" "}
        for the interaction between attribute data on the exported mesh and the
        GLB accessor layout consumed by Three.js and Babylon.js.
      </p>

      <h2>Catalog assignment</h2>
      <p>
        The Asset Browser organises assets into a tree of{" "}
        <strong>catalogs</strong> stored in a plain-text file (
        <code>blender_assets.cats.txt</code>) in the library root. Catalog
        entries are UUID-keyed; the human-readable path (
        <code>holoflow/props</code>) is purely display metadata. To assign a
        catalog from a script:
      </p>
      <pre><code>{`import uuid

# Write the catalog definition file (once, during library setup)
uid = str(uuid.uuid4())
with open("path/to/library/blender_assets.cats.txt", "w") as f:
    f.write(f"VERSION 1\\n{uid}:holoflow/props:Holoflow Props\\n")

# Then assign the UUID to each asset
ob.asset_data.catalog_id = uid`}</code></pre>
      <p>
        Blender resolves the UUID to the human path at runtime. Storing the
        UUID (not the path string) in your build script avoids locale-sensitive
        string comparisons and survives catalog renames without breaking
        existing assignments.
      </p>

      <h2>Generating the manifest</h2>
      <pre><code>{`import json, os

manifest = {
    "generator": "blueprint.py",
    "exported": [
        {
            "name":        ob.name,
            "tags":        [t.name for t in ob.asset_data.tags],
            "description": ob.asset_data.description,
            "glb":         glb_path,
        }
        for ob, glb_path in zip(webxr_props, exported_paths)
    ],
    "skipped": [o.name for o in all_assets if o not in webxr_props],
}

with open(os.path.join(blend_dir, "asset_manifest.json"), "w") as f:
    json.dump(manifest, f, indent=2)`}</code></pre>
      <p>
        The manifest makes the export auditable: a CI step can diff it against
        the previous run to detect assets added, removed, or re-tagged without
        a matching GLB update. The <code>skipped</code> array is equally
        important&thinsp;—&thinsp;it documents the intentional exclusions so
        nothing is silently dropped.
      </p>

      <h2>Failure modes</h2>
      <ul>
        <li>
          <strong>ob.asset_data is None after asset_mark()</strong>&thinsp;—&thinsp;
          calling <code>asset_mark()</code> on an object whose type is not
          supported (e.g. a Light or Camera) returns <code>None</code> instead
          of an <code>AssetMetaData</code> block. Only mesh, armature, curve,
          material, node group, and action ID types support asset marking in 5.1.
        </li>
        <li>
          <strong>Export contains extra geometry</strong>&thinsp;—&thinsp;missed
          a <code>deselect_all()</code> call before setting the target. Each
          per-object export must start with a full deselect.
        </li>
        <li>
          <strong>Tags accumulating across script runs</strong>&thinsp;—&thinsp;
          <code>tags.new()</code> is idempotent in 5.1 but was NOT in earlier
          versions (pre-4.2 it would add a second tag with the same name).
          Verify with <code>print(list(ad.tags.keys()))</code> after marking if
          you are targeting a range of Blender versions.
        </li>
        <li>
          <strong>catalog_id UUID not resolving</strong>&thinsp;—&thinsp;the
          <code>blender_assets.cats.txt</code> file must exist <em>before</em>{" "}
          the <code>.blend</code> is saved. Writing the catalog file after
          saving will not retroactively associate assets with their catalog in
          the Asset Browser until the file is reloaded.
        </li>
        <li>
          <strong>RuntimeError from bpy.ops.asset.mark()</strong>&thinsp;—&thinsp;
          you used the operator variant in a headless script. Switch to{" "}
          <code>ob.asset_mark()</code> directly.
        </li>
      </ul>

      <h2>Outside sources</h2>
      <p>
        Asset Library system architecture: Blender Foundation (CC-BY-SA-4.0,{" "}
        <a
          href="https://docs.blender.org/manual/en/5.1/files/asset_libraries/index.html"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          docs.blender.org/manual/en/5.1/files/asset_libraries
        </a>
        ), Blender Foundation contributors. Related Blender Foundation projects:
        Blender Studio open movies (CC-BY), blender-git, blender-addons.
      </p>
      <p>
        GLB exporter reference implementation: KhronosGroup/glTF-Blender-IO
        (Apache-2.0,{" "}
        <a
          href="https://github.com/KhronosGroup/glTF-Blender-IO"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          github.com/KhronosGroup/glTF-Blender-IO
        </a>
        ), Khronos Group contributors. Related Khronos projects:
        glTF-Sample-Models, glTF-Sample-Renderer, KTX-Software — all Apache-2.0.
      </p>
    </>
  );
}

export const entry: Entry = buildInstructable(
  {
    time: "one session",
    difficulty: "intermediate",
    cost: "free",
    supplies: {
      tools: [
        { name: "Blender 5.1", url: "https://www.blender.org/download/" },
      ],
    },
    code: [
      {
        filename: "blueprint.py",
        language: "python",
        content: `import json, os, bpy

BLEND_PATH = "//asset_library_demo.blend"
EXPORT_PREFIX = "//"
WEBXR_TAG = "webxr"
STUDIO_TAGS = ["webxr", "low-poly", "holoflow"]
AUTHOR = "Holoflow Studio"

def _clear_scene():
    for ob in list(bpy.data.objects): bpy.data.objects.remove(ob, do_unlink=True)
    for me in list(bpy.data.meshes):  bpy.data.meshes.remove(me)
    for ma in list(bpy.data.materials): bpy.data.materials.remove(ma)

def _primitive(kind, name, loc):
    if kind == "cube":
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=loc)
    elif kind == "sphere":
        bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2, radius=0.6, location=loc)
    elif kind == "cone":
        bpy.ops.mesh.primitive_cone_add(vertices=6, radius1=0.5, depth=1.2, location=loc)
    ob = bpy.context.active_object; ob.name = name; ob.data.name = name + "_mesh"
    return ob

def _mark_asset(ob, desc, tags):
    ob.asset_mark()          # idempotent; works in any context
    ad = ob.asset_data
    ad.description = desc; ad.author = AUTHOR
    for t in tags: ad.tags.new(t)   # existing name is a no-op in 5.1

def _material(ob, rgb):
    mat = bpy.data.materials.new(ob.name + "_mat"); mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs["Base Color"].default_value = (*rgb, 1.0)
        bsdf.inputs["Roughness"].default_value  = 0.35
    ob.data.materials.clear(); ob.data.materials.append(mat)

def _deselect_all():
    for ob in bpy.data.objects: ob.select_set(False)

def _export_glb(ob):
    _deselect_all(); ob.select_set(True); bpy.context.view_layer.objects.active = ob
    out = EXPORT_PREFIX + ob.name.lower() + ".glb"
    bpy.ops.export_scene.gltf(
        filepath=out, export_format='GLB', export_yup=True, export_apply=True,
        export_draco_mesh_compression_enable=True, export_draco_mesh_compression_level=6,
        export_image_format='WEBP', use_selection=True,
    )
    return out

def tagged(tag):
    return [ob for ob in bpy.data.objects
            if ob.asset_data and any(t.name == tag for t in ob.asset_data.tags)]

_clear_scene()
PROPS = [
    ("cube",   "hf_crate_a",   ( 0.0,0.0,0.5), STUDIO_TAGS, "Low-poly crate — WebXR prop",           (0.72,0.48,0.22)),
    ("sphere", "hf_lantern_b", ( 2.2,0.0,0.6), STUDIO_TAGS, "Faceted lantern — WebXR light prop",    (0.90,0.80,0.20)),
    ("cone",   "hf_spike_c",   ( 4.4,0.0,0.6), STUDIO_TAGS, "Hex-base spike — WebXR decorative",     (0.30,0.55,0.80)),
    ("cube",   "hf_hero_block",(-2.2,0.0,0.5), ["render","hero","holoflow"], "Hero render — NOT webxr", (0.5,0.5,0.5)),
]
for kind,name,loc,tags,desc,col in PROPS:
    ob = _primitive(kind,name,loc); _material(ob,col); _mark_asset(ob,desc,tags)

bpy.ops.wm.save_as_mainfile(filepath=BLEND_PATH)
webxr = tagged(WEBXR_TAG)
exported = []
for ob in webxr:
    path = _export_glb(ob)
    exported.append({"name":ob.name,"tags":[t.name for t in ob.asset_data.tags],"glb":path})
    print(f"[blueprint] {ob.name} → {path}")

all_assets = [o for o in bpy.data.objects if o.asset_data]
skipped = [o.name for o in all_assets if o not in webxr]
blend_dir = os.path.dirname(bpy.data.filepath) if bpy.data.filepath else ""
with open(os.path.join(blend_dir,"asset_manifest.json"),"w") as f:
    json.dump({"exported":exported,"skipped":skipped},f,indent=2)
print(f"[blueprint] exported={len(exported)} skipped={skipped}")`,
      },
    ],
  },
  {
    slug: "blender-tutorial-python-bpy-asset-metadata-mark-tag-batch-glb-webxr",
    title:
      "Python bpy.types.AssetMetaData — Studio Asset Tagging: Mark, Tag & Batch-Export Tagged Assets to GLB for WebXR (Blender 5.1)",
    blurb:
      "bpy.types.ID.asset_mark() stamps any data-block as a Blender asset without requiring UI context. This tutorial builds a production tagging pipeline: mark scene objects programmatically, attach studio tags and author metadata via AssetMetaData, then batch-export every object carrying the 'webxr' tag to its own Draco-compressed GLB — filtering out render-only assets automatically and writing a JSON manifest for CI diffing.",
    Body,
    createdAt: new Date("2026-07-16"),
    tags: [
      "blender",
      "python",
      "scripting",
      "webxr",
      "asset-library",
      "metadata",
      "glb",
      "pipeline",
      "batch-export",
      "low-poly",
    ],
    difficulty: "intermediate",
  }
);
