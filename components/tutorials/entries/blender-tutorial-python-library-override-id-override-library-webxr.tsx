import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        Blender&apos;s <strong>Library Override</strong> system (stable in 5.1,
        overhauled in 4.0) solves a problem that{" "}
        <code>bpy.ops.wm.append()</code> cannot: keep a{" "}
        <em>live connection</em> to a shared asset library while permitting
        per-instance edits — position, material tint, shape-key values,
        custom properties — that survive a re-link when the canonical asset
        is updated.{" "}
        <code>ID.override_create(remap_local_usages=True)</code> is the data-API
        entry point, producing a local proxy whose{" "}
        <code>override_library.reference</code> keeps pointing back to the
        library ID. See the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-library-link-append-blend-files"
          className={lk}
        >
          library link &amp; append tutorial
        </Link>{" "}
        for the foundational{" "}
        <code>bpy.ops.wm.link()</code> / <code>bpy.ops.wm.append()</code>{" "}
        patterns that precede overrides.
      </p>
      <p>
        After <code>override_create()</code>, writing{" "}
        <code>override_obj.location = (1.4, 0, 0)</code> sets a local value
        that diverges from the library default. Blender auto-registers the
        property as overridden on the next depsgraph flush. To <em>enforce</em>{" "}
        a property — prevent future resyncs from ever resetting it —
        call{" "}
        <code>id_override_library_property_add(rna_path, init_from_final=True)</code>{" "}
        and set the returned operation to{" "}
        <code>&apos;REPLACE&apos;</code>. The Properties panel renders enforced
        overrides with a blue background. Compare this with the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bpy-collection-link-visibility-override-batch-glb-webxr"
          className={lk}
        >
          collection visibility override tutorial
        </Link>{" "}
        which uses <code>bpy.types.Collection</code> instance overrides rather
        than full library overrides, and with the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-asset-library-mark-catalogue"
          className={lk}
        >
          asset library catalogue tutorial
        </Link>{" "}
        for the marking and cataloguing side of the same pipeline.
      </p>
      <p>
        For WebXR export, the override layer is entirely transparent to the GLB
        consumer. <code>bpy.ops.export_scene.gltf(export_apply=True)</code>{" "}
        evaluates the full dependency graph with overrides applied — Three.js
        receives the composed values (custom position, tinted material) with no
        knowledge of the library relationship. The{" "}
        <Link
          href="/tutorials/blender-tutorial-python-batch-glb-exporter"
          className={lk}
        >
          batch GLB exporter tutorial
        </Link>{" "}
        shows how to extend this pattern across many linked assets in a single
        export pass. Outside references:{" "}
        <a
          href="https://docs.blender.org/manual/en/5.1/files/linked_libraries/library_overrides.html"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          Library Overrides — Blender 5.1 Manual (Blender Foundation, CC BY-SA 4.0)
        </a>
        , API siblings{" "}
        <a
          href="https://docs.blender.org/api/5.1/bpy.types.IDOverrideLibrary.html"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          bpy.types.IDOverrideLibrary
        </a>{" "}
        and{" "}
        <a href="https://projects.blender.org/blender/blender" className={lk} target="_blank" rel="noopener noreferrer">projects.blender.org</a>
        ;{" "}
        <a
          href="https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          glTF 2.0 Specification — scene composition model (Khronos Group, Apache-2.0)
        </a>
        , siblings{" "}
        <a
          href="https://github.com/KhronosGroup/glTF"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          KhronosGroup/glTF
        </a>{" "}
        and{" "}
        <a href="https://github.com/KhronosGroup/glTF-Sample-Models" className={lk} target="_blank" rel="noopener noreferrer">glTF-Sample-Models</a>
        .
      </p>
    </>
  );
}

export const entry: Entry = buildInstructable(
  {
    supplies: { materials: [], tools: [] },
    steps: [
      {
        title: "Build the hero library .blend (canonical asset source)",
        body: `"""
Save a self-contained library .blend containing one faceted gem ('gem_hero').
bpy.ops.wm.save_as_mainfile() flushes all datablocks to disk.
Flat shading (polygon.use_smooth = False) gives the studio faceted aesthetic.
After saving, bpy.ops.wm.read_homefile(use_empty=True) resets to a blank scene
so the composition context starts clean — any stale library references from
this build phase would confuse the subsequent wm.link() call.
"""
import bpy
SLUG = "python-library-override-id-override-library-webxr"
LIBRARY_BLEND = "//hero_library.blend"

bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete()
for blk in (bpy.data.meshes, bpy.data.materials):
    for item in list(blk): blk.remove(item)

bpy.ops.mesh.primitive_uv_sphere_add(radius=0.5, segments=8, ring_count=6)
gem = bpy.context.active_object
gem.name = "gem_hero"; gem.data.name = "gem_hero"
for poly in gem.data.polygons: poly.use_smooth = False

mat = bpy.data.materials.new("gem_hero_mat")
mat.use_nodes = True
bsdf = mat.node_tree.nodes["Principled BSDF"]
bsdf.inputs["Base Color"].default_value = (0.08, 0.55, 0.75, 1.0)
bsdf.inputs["Roughness"].default_value  = 0.22
bsdf.inputs["IOR"].default_value        = 1.45
gem.data.materials.append(mat)

bpy.ops.wm.save_as_mainfile(filepath=bpy.path.abspath(LIBRARY_BLEND))
print(f"[{SLUG}] library saved")`,
      },
      {
        title: "Link the asset + create a library override",
        body: `"""
bpy.ops.wm.link() links a named object datablock into the scene as a LIVE
REFERENCE (library=non-None, override_library=None, read-only).

ID.override_create(remap_local_usages=True) creates a LOCAL COPY (library=None,
override_library=IDOverrideLibrary) and remaps any existing scene-level
usages of the linked ID to the new override.  The override is editable;
the original linked ID moves to an indirect slot and is no longer used
directly by the scene.

WHY NOT the operator?  bpy.ops.object.make_override_library() polls for an
active 3-D View context and selected objects — unavailable in headless or
Script Editor runs.  ID.override_create() has no context dependency.
"""
bpy.ops.wm.read_homefile(use_empty=True)

abs_lib   = bpy.path.abspath("//hero_library.blend")
inner_dir = abs_lib + "/Object/"
bpy.ops.wm.link(filepath=inner_dir + "gem_hero",
                directory=inner_dir, filename="gem_hero", link=True)

linked_obj = bpy.data.objects.get("gem_hero")
assert linked_obj and linked_obj.library, "link failed"

override_obj = linked_obj.override_create(remap_local_usages=True)
print(f"override_library.reference: {override_obj.override_library.reference.name}")
# → 'gem_hero'  (the original linked ID)`,
      },
      {
        title: "Apply overrides: enforce location + material slot tint",
        body: `"""
Setting override_obj.location writes a LOCAL value diverging from the library.
id_override_library_property_add(rna_path, init_from_final=True) registers
the property explicitly so future resyncs (liboverride_resync_hierarchy_enforce)
never reset it — without this call, Blender may overwrite a property whose
value happens to match the library default at resync time.

Material override: mat.copy() breaks the library link, producing a fully
local material.  Reassigning override_obj.data.materials[0] = local_mat is
NOT a registered RNA override — it is a direct slot pointer change on the
local override ID's mesh datablock, which is already local after override_create.
"""
import mathutils

OVERRIDE_LOCATION = mathutils.Vector((1.4, 0.0, 0.0))
OVERRIDE_COLOUR   = (0.12, 0.72, 0.85, 1.0)

override_obj.location = OVERRIDE_LOCATION

loc_prop, _ = override_obj.id_override_library_property_add(
    rna_path="location", init_from_final=True)
for op in loc_prop.operations:
    op.operation = 'REPLACE'

lib_mat = override_obj.data.materials[0]
local_mat = lib_mat.copy()
local_mat.name = "gem_hero_mat_override"
local_mat.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = OVERRIDE_COLOUR
override_obj.data.materials[0] = local_mat

bpy.context.view_layer.update()
overridden = [p.rna_path for p in override_obj.override_library.properties]
print(f"enforced paths: {overridden}")  # → ['location']`,
      },
      {
        title: "Resync from library + export GLB",
        body: `"""
liboverride_resync_hierarchy_enforce() re-reads the library .blend, propagates
any upstream changes (new polygons, shader tweaks) to the override while
PRESERVING all registered override properties (location stays at 1.4 m;
material slot stays overridden).

export_scene.gltf evaluates the depsgraph with overrides fully applied.
The GLB contains the local override values — Three.js sees no library layer.
"""
import json

# demonstrate resync (safe: location stays because it is REPLACE-enforced)
bpy.ops.outliner.liboverride_resync_hierarchy_enforce(
    do_hierarchy_descendants=True)

bpy.ops.mesh.primitive_plane_add(size=4.0, location=(0.0, 0.0, -0.5))
floor = bpy.context.active_object; floor.name = "floor_plane"

bpy.ops.export_scene.gltf(
    filepath=bpy.path.abspath("//override_composed.glb"),
    export_format='GLB', use_selection=False, export_apply=True,
    export_draco_mesh_compression_enable=True,
    export_draco_mesh_compression_level=6,
    export_image_format='WEBP', export_yup=True)

meta = {
    "library_path":      bpy.path.abspath("//hero_library.blend"),
    "override_object":   override_obj.name,
    "overridden_paths":  [p.rna_path for p in override_obj.override_library.properties],
    "override_location": list(override_obj.location),
}
with open(bpy.path.abspath("//override_meta.json"), "w") as fh:
    json.dump(meta, fh, indent=2)

bpy.ops.wm.save_as_mainfile(filepath=bpy.path.abspath("//library_override_demo.blend"))
print(f"[{SLUG}] done")`,
      },
    ],
  },
  {
    slug: "blender-tutorial-python-library-override-id-override-library-webxr",
    title:
      "Python bpy.types.IDOverrideLibrary — Library Override System: Link, Override & Propagate Linked Hero Assets for WebXR (Blender 5.1)",
    description:
      "Link a canonical hero prop from an external .blend library, create a live local override with ID.override_create(), enforce position and material tint via id_override_library_property_add(rna_path, operation=REPLACE), resync the override hierarchy without losing authored values, and export the composed scene as a Draco-compressed GLB for Three.js / WebXR in Blender 5.1.",
    topic: "scripting",
    tags: [
      "blender",
      "python",
      "library-override",
      "IDOverrideLibrary",
      "override_create",
      "wm.link",
      "linked-libraries",
      "resync",
      "asset-pipeline",
      "glb",
      "webxr",
      "scripting",
      "bpy",
    ],
    date: "2026-07-13",
    body: <Body />,
  }
);
