import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        Blender&apos;s scene-organisation API lives in two parallel data
        structures that are trivially easy to conflate:{" "}
        <code>bpy.types.Collection</code> — the actual data block stored in{" "}
        <code>bpy.data.collections</code> — and{" "}
        <code>bpy.types.LayerCollection</code> — a per-ViewLayer wrapper
        accessible only by walking the tree rooted at{" "}
        <code>scene.view_layers[n].layer_collection</code>. Every render- and
        viewport-visibility flag that matters lives on the{" "}
        <em>LayerCollection</em>. Setting <code>collection.hide_render</code> on
        the data block has no effect at render time; the flag that controls
        render exclusion is <code>layer_collection.exclude</code>. This is the
        single most common source of silent failures in collection-management
        scripts.
      </p>

      <p>
        The blueprint walks the complete lifecycle: create named collections,
        link them as children of the scene root, populate each with distinct
        geometry, locate their LayerCollections via recursive traversal, apply
        per-ViewLayer visibility overrides, and batch-export each collection to
        its own GLB. The batch-export pattern — select only the members of one
        collection, call the GLTF exporter with <code>use_selection=True</code>,
        repeat — produces a set of independently loadable assets suited to
        per-chunk progressive streaming in a WebXR scene. Compare the
        selection-based approach here with the depsgraph-instance traversal in
        the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-depsgraph-evaluated-geometry-gn-instances-batch-export"
          className={lk}
        >
          depsgraph batch export tutorial
        </Link>
        , which handles GN-instanced geometry that does not appear in{" "}
        <code>collection.objects</code>.
      </p>

      <p>
        Three visibility flags are covered in depth:{" "}
        <code>layer_collection.exclude</code> removes the collection from the
        view layer entirely — objects are not evaluated and cannot contribute
        to shadows, indirect lighting, or any render pass;{" "}
        <code>layer_collection.hide_viewport</code> hides objects in the
        interactive viewport while leaving them renderable;{" "}
        <code>layer_collection.indirect_only</code> causes the collection to
        contribute to global illumination and shadows without appearing in the
        direct render output. The last flag is the correct choice for a light
        collection in a baked-lighting WebXR pipeline: the area lights shade
        the scene during the EEVEE bake but are never exported as visible
        geometry. This connects directly to the light-group bake pattern in
        the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bpy-light-rig-3point-eevee-lightgroup-webxr-bake"
          className={lk}
        >
          3-point light rig and EEVEE light-group bake tutorial
        </Link>
        .
      </p>

      <p>
        The <code>find_layer_collection</code> helper is the correct tool for
        locating a LayerCollection by name. There is no hash-map lookup from
        collection name to LayerCollection in the 5.1 API; you must recurse the
        children tree. The function uses a depth-first search and returns{" "}
        <code>None</code> rather than raising, which is safer inside a batch
        loop where a missing collection should skip rather than abort. The
        per-ViewLayer visibility overrides interact with the multi-pass
        rendering pipeline described in the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-viewlayer-multi-pass-collection-mask-eevee-webxr"
          className={lk}
        >
          ViewLayer multi-pass collection masking tutorial
        </Link>
        . Combining <code>indirect_only</code> on the lights collection with
        a holdout mask on the environment collection produces a clean matte
        output suitable for mixed-reality overlays.
      </p>
    </>
  );
}

export const entry: Entry = buildInstructable(
  {
    time: "one evening",
    difficulty: "advanced",
    cost: "free",
    software: [
      {
        name: "Blender",
        version: "5.1",
        url: "https://www.blender.org/download/",
        cost: "free",
      },
    ],
    supplies: {
      materials: [],
      tools: [
        {
          name: "Blender 5.1",
          url: "https://www.blender.org/download/",
          notes: "Script Editor + GLTF exporter (bundled)",
        },
      ],
    },
    steps: [
      {
        title: "Understand Collection vs LayerCollection",
        body: `Two objects, one name: bpy.types.Collection is the data block in
bpy.data.collections; bpy.types.LayerCollection is the per-ViewLayer wrapper.
All visibility flags that matter for rendering and compositing live on the
LayerCollection.  Setting collection.hide_render = True on the data block
does nothing at render time.

Access the root LayerCollection via:
    root_lc = bpy.context.scene.view_layers[0].layer_collection

The scene root Collection (scene.collection) is NOT in bpy.data.collections —
querying bpy.data.collections['Scene'] raises KeyError in 5.1.`,
      },
      {
        title: "Create and link named collections",
        body: `def make_collection(name, parent_col=None):
    col = bpy.data.collections.new(name)
    if parent_col is None:
        parent_col = bpy.context.scene.collection
    parent_col.children.link(col)
    return col

scene_root = bpy.context.scene.collection
env_col    = make_collection("hf_env",    scene_root)
props_col  = make_collection("hf_props",  scene_root)
lights_col = make_collection("hf_lights", scene_root)

# A bare bpy.data.collections.new() is invisible until linked.
# parent_col.children.link(col) is the correct link site — NOT
# scene.collection.objects.link() (that links objects, not collections).`,
      },
      {
        title: "Link objects into the correct collection",
        body: `def add_to_collection(obj, col):
    # New objects land in the ACTIVE collection, not the one you want.
    # Unlink from every current collection first to avoid duplicates.
    for c in list(obj.users_collection):
        c.objects.unlink(obj)
    col.objects.link(obj)

# Example: three icosphere props
for i, (x, radius) in enumerate([(-2.0, 0.3), (0.0, 0.5), (2.0, 0.4)]):
    bm = bmesh.new()
    bmesh.ops.create_icosphere(bm, subdivisions=1, radius=radius)
    me  = bpy.data.meshes.new(f"prop_{i}")
    bm.to_mesh(me); bm.free()
    obj = bpy.data.objects.new(f"prop_{i}", me)
    obj.location = (x, 0.0, radius)
    bpy.context.scene.collection.objects.link(obj)  # temporary
    add_to_collection(obj, props_col)               # permanent`,
      },
      {
        title: "Locate LayerCollections by name",
        body: `def find_layer_collection(root_lc, name):
    """Depth-first search — there is no direct lookup in 5.1."""
    if root_lc.collection.name == name:
        return root_lc
    for child in root_lc.children:
        found = find_layer_collection(child, name)
        if found:
            return found
    return None

vl      = bpy.context.scene.view_layers[0]
root_lc = vl.layer_collection

lc_lights = find_layer_collection(root_lc, "hf_lights")
lc_props  = find_layer_collection(root_lc, "hf_props")`,
      },
      {
        title: "Set per-ViewLayer visibility overrides",
        body: `# indirect_only: contributes to GI/shadows but not the direct render.
# Use for light collections in baked-lighting WebXR pipelines.
if lc_lights:
    lc_lights.indirect_only = True

# exclude: completely removes the collection from the view layer.
# Objects are not evaluated — no shadows, no GI contribution.
if lc_props:
    lc_props.exclude = False      # default: included
    lc_props.hide_viewport = False

# Flags summary:
#   exclude         — not in view layer at all
#   hide_viewport   — hidden in viewport, still renders
#   hide_render     — rendered, but invisible in viewport
#   holdout         — renders as an alpha cut-out mask
#   indirect_only   — GI/shadows only, not direct output

# GOTCHA: LayerCollection flags are NOT keyframeable via the standard
# insert_keyframe() API.  To animate visibility, use a frame_change
# handler or render segments with flags toggled between bpy.ops.render.render()
# calls (the record.py segment approach in this entry).`,
      },
      {
        title: "Batch-export each collection to a separate GLB",
        body: `import os

EXPORT_DIR = bpy.path.abspath("//batch_glb/")
os.makedirs(EXPORT_DIR, exist_ok=True)

def export_collection_glb(col, out_dir):
    bpy.ops.object.select_all(action='DESELECT')
    members = list(col.objects)   # direct objects only — not recursive
    for obj in members:
        obj.select_set(True)
        bpy.context.view_layer.objects.active = obj
    if not members:
        return None
    filepath = os.path.join(out_dir, f"{col.name}.glb")
    bpy.ops.export_scene.gltf(
        filepath=filepath,
        use_selection=True,
        export_format='GLB',
        export_apply=True,
        export_yup=True,
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_image_format='WEBP',
        export_lights=True,
    )
    return filepath

# GOTCHA: col.objects is NOT recursive.  Objects in child collections
# are excluded.  For a recursive gather you must walk col.children.
# Here each collection is intentionally flat.

for col_name in ["hf_env", "hf_props", "hf_lights"]:
    col = bpy.data.collections.get(col_name)
    if col:
        export_collection_glb(col, EXPORT_DIR)`,
      },
      {
        title: "Write the collection manifest",
        body: `import json

manifest = {}
for col_name in ["hf_env", "hf_props", "hf_lights"]:
    col = bpy.data.collections.get(col_name)
    if col:
        manifest[col_name] = {
            "glb": f"batch_glb/{col_name}.glb",
            "object_count": len(col.objects),
        }

with open(bpy.path.abspath("//collection_manifest.json"), "w") as fh:
    json.dump({"collections": manifest}, fh, indent=2)

# In Three.js / WebXR, load each GLB independently:
#
#   import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
#   const loader = new GLTFLoader()
#
#   fetch('/library/collection_manifest.json')
#     .then(r => r.json())
#     .then(({ collections }) => {
#       for (const [name, meta] of Object.entries(collections)) {
#         loader.load(\`/library/\${meta.glb}\`, gltf => {
#           scene.add(gltf.scene)
#         })
#       }
#     })
#
# This pattern lets you defer loading props or lights until needed,
# reducing initial bundle size — a common WebXR streaming technique.`,
      },
    ],
  },
  {
    slug: "blender-tutorial-python-bpy-collection-link-visibility-override-batch-glb-webxr",
    title:
      "Python bpy.types.Collection — Collection Linking, Visibility Overrides & Multi-Collection Batch GLB Export for WebXR",
    date: "2026-07-10",
    kind: "tutorial",
    excerpt:
      "Master Blender 5.1's two-layer collection API: bpy.types.Collection (the data block) and bpy.types.LayerCollection (the per-ViewLayer wrapper). Set exclude, holdout, indirect_only and hide_viewport flags correctly, locate LayerCollections by recursive tree traversal, and batch-export each named collection to its own GLB for progressive streaming in WebXR.",
    Body,
  }
);
