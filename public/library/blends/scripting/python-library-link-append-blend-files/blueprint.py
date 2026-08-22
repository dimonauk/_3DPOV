"""
Python bpy.data.libraries.load — Library Linking, Appending & Override System
Blender 5.1 | Holoflow Studio | CC0 / Public Domain

Technique summary
─────────────────
bpy.data.libraries.load() is a context manager that opens a .blend file on
disk without making it the active file. Inside the with-block you copy
datablocks from that file's bpy.data into the current scene by assigning to
the temporary library object's attribute list.

Two fundamentally different operations:
  link=True   — creates a persistent external reference; the datablock lives in
                the source file and Blender re-reads it every session. You cannot
                edit linked data except via Library Overrides.
  link=False  — appends a local copy; the datablock is embedded in the current
                file and the external file is no longer referenced after save.

Why this matters for the Holoflow pipeline
───────────────────────────────────────────
Scene composition: characters, props and environment modules each live in their
own .blend. The assembly scene links them all, keeping the source files editable
by separate passes. Library Overrides (make_override_library()) let you change
pose, material slot assignments, and object transforms in the assembly scene
without modifying the source asset.

Reference: https://docs.blender.org/manual/en/latest/files/linked_libraries/index.html
"""

import bpy, os, pathlib, sys

# ── PARAMETERS ────────────────────────────────────────────────────────────────
ASSETS_BLEND   = str(pathlib.Path.home() / "holoflow_assets.blend")
OUTPUT_BLEND   = str(pathlib.Path.home() / "holoflow_assembly.blend")
COLLECTION_NAME = "HF_PropKit"        # collection in ASSETS_BLEND to link
MATERIAL_NAME   = "HF_Faceted_Flat"  # material in ASSETS_BLEND to append
LOG_PREFIX      = "[library-link-append]"

# ── STEP 0: build the source asset file (run once to seed ASSETS_BLEND) ──────

def _build_asset_file() -> None:
    """Create ASSETS_BLEND with a collection + three props + one material."""
    bpy.ops.wm.read_homefile(use_empty=True)

    coll = bpy.data.collections.new(COLLECTION_NAME)
    bpy.context.scene.collection.children.link(coll)

    shapes = [("CrystalProp_A", (1.2, 0, 0)),
              ("CrystalProp_B", (0,   0, 0)),
              ("CrystalProp_C", (-1.2, 0, 0))]

    for name, loc in shapes:
        bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1, radius=0.45, location=loc)
        ob = bpy.context.active_object
        ob.name = name
        # Move to asset collection, remove from scene root
        bpy.context.scene.collection.objects.unlink(ob)
        coll.objects.link(ob)

    mat = bpy.data.materials.new(MATERIAL_NAME)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = (0.18, 0.45, 0.85, 1.0)
    bsdf.inputs["Roughness"].default_value  = 0.75

    # Mark both as assets so the Asset Browser can also reach them
    coll.asset_mark()
    coll.asset_data.description = "Holoflow prop kit — three faceted crystals."
    mat.asset_mark()
    mat.asset_data.description  = "Studio flat Principled. Pairs with holoflow:facet flag."

    bpy.ops.wm.save_as_mainfile(filepath=ASSETS_BLEND, check_existing=False)
    print(f"{LOG_PREFIX} wrote asset file: {ASSETS_BLEND}")

# ── STEP 1: link a collection from the asset file ─────────────────────────────

def link_collection_from_file(source_blend: str, collection_name: str) -> bpy.types.Collection:
    """
    Link a collection by name from an external .blend.

    Linking keeps the data in the source file. The collection's objects show a
    thin orange outline in the viewport and ob.library is non-None. You CANNOT
    directly edit the object data — attempt to enter Edit Mode and Blender will
    refuse with "Cannot edit external library data". Use make_override_library()
    for that.
    """
    with bpy.data.libraries.load(source_blend, link=True) as (src, dst):
        if collection_name not in src.collections:
            raise KeyError(f"Collection '{collection_name}' not found in {source_blend}. "
                           f"Available: {src.collections}")
        dst.collections = [collection_name]

    linked_coll = dst.collections[0]
    if linked_coll is None:
        raise RuntimeError("Library load returned None — check the source .blend is valid.")

    # Link the collection into the active scene
    bpy.context.scene.collection.children.link(linked_coll)
    print(f"{LOG_PREFIX} linked collection '{collection_name}' from {source_blend}")
    return linked_coll

# ── STEP 2: append a material (local copy) ────────────────────────────────────

def append_material_from_file(source_blend: str, material_name: str) -> bpy.types.Material:
    """
    Append a material — creates a local copy, no ongoing external reference.

    link=False is the key difference. After this call the material lives in the
    current file's bpy.data.materials and can be freely edited. mat.library is
    None. Use append when you need a starting point to diverge from; use link
    when you want future updates in the source file to propagate automatically.
    """
    with bpy.data.libraries.load(source_blend, link=False) as (src, dst):
        if material_name not in src.materials:
            raise KeyError(f"Material '{material_name}' not in {source_blend}. "
                           f"Available: {src.materials}")
        dst.materials = [material_name]

    mat = dst.materials[0]
    print(f"{LOG_PREFIX} appended material '{material_name}' — library={mat.library}")
    return mat

# ── STEP 3: Library Override — make linked objects locally editable ────────────

def make_collection_override(linked_coll: bpy.types.Collection) -> bpy.types.Collection:
    """
    Create a Library Override hierarchy from a linked collection.

    make_override_library() duplicates the hierarchy into the current file
    with thin purple override indicators. Each overridden object gets an
    override_library attribute pointing back to the source datablock. The
    linked originals remain untouched; only the local override diverges.

    Use cases:
    - Change object transforms in an assembly scene without touching the source
    - Swap material slots on a linked prop
    - Pose a linked armature for a specific shot
    """
    # Select linked objects via collection
    for ob in linked_coll.all_objects:
        ob.select_set(True)
    bpy.context.view_layer.objects.active = list(linked_coll.all_objects)[0]

    # id_data is the root ID that anchors the override hierarchy
    bpy.ops.object.make_override_library()

    # The override collection is created with the same name; find it
    override_coll = bpy.data.collections.get(COLLECTION_NAME)
    print(f"{LOG_PREFIX} override collection: {override_coll.name}, "
          f"is_override_data={override_coll.override_library is not None}")
    return override_coll

# ── STEP 4: inspect library provenance ────────────────────────────────────────

def report_library_status() -> None:
    """
    Walk all objects in the scene and print their library status.

    ob.library → bpy.types.Library or None
    ob.override_library → bpy.types.ObjectOverrideLibrary or None

    Linked:    ob.library is not None, ob.override_library is None
    Overridden: ob.library is not None, ob.override_library is not None
    Local:     ob.library is None, ob.override_library is None
    """
    for ob in bpy.context.scene.objects:
        status = "local"
        if ob.library and ob.override_library:
            status = f"overridden  (src={ob.library.filepath})"
        elif ob.library:
            status = f"linked      (src={ob.library.filepath})"
        print(f"{LOG_PREFIX}  {ob.name:<24} {status}")

# ── STEP 5: relocate library path ─────────────────────────────────────────────

def relocate_library(old_path: str, new_path: str) -> None:
    """
    Update a library's filepath — equivalent to File → External Data → Find Missing Files
    but scriptable for CI/CD relinking after folder restructures.

    bpy.ops.wm.lib_relocate() requires the library filepath as operator context.
    The context-override dance is necessary because the operator reads
    context.library, not an argument.
    """
    lib = bpy.data.libraries.get(os.path.basename(old_path))
    if lib is None:
        print(f"{LOG_PREFIX} library '{old_path}' not found in bpy.data.libraries")
        return
    # Update filepath directly; Blender re-reads on the next depsgraph update
    lib.filepath = new_path
    # Force an immediate reload
    with bpy.context.temp_override(library=lib):
        bpy.ops.wm.lib_relocate(filepath=new_path)
    print(f"{LOG_PREFIX} relocated library to {new_path}")

# ── STEP 6: enumerate datablocks available in an external file ────────────────

def list_datablocks(source_blend: str) -> dict[str, list[str]]:
    """
    Read the datablock catalogue from a .blend without loading anything.

    Opening with link=False and assigning nothing is a read-only catalogue pass.
    Useful for building a picker UI or CI validation that confirms expected
    assets exist before a batch import run.
    """
    catalog: dict[str, list[str]] = {}
    with bpy.data.libraries.load(source_blend, link=False) as (src, _dst):
        for attr in ("collections", "objects", "materials",
                     "meshes", "node_groups", "actions"):
            items = getattr(src, attr, [])
            if items:
                catalog[attr] = list(items)
    return catalog

# ── MAIN ──────────────────────────────────────────────────────────────────────

def main() -> None:
    # 0. Build the source asset file if it doesn't exist
    if not os.path.exists(ASSETS_BLEND):
        _build_asset_file()
        # Reload a clean scene for the assembly pass
        bpy.ops.wm.read_homefile(use_empty=True)

    # 1. Catalogue what's available
    print(f"\n{LOG_PREFIX} -- datablocks in {ASSETS_BLEND} --")
    catalog = list_datablocks(ASSETS_BLEND)
    for kind, names in catalog.items():
        print(f"  {kind}: {names}")

    # 2. Link the prop collection
    linked_coll = link_collection_from_file(ASSETS_BLEND, COLLECTION_NAME)

    # 3. Append a local copy of the material
    mat = append_material_from_file(ASSETS_BLEND, MATERIAL_NAME)
    # Assign to the first object we find that isn't in the linked collection
    for ob in bpy.context.scene.objects:
        if ob.type == "MESH" and ob.library is None:
            ob.data.materials.append(mat)
            break

    # 4. Report provenance of every object
    print(f"\n{LOG_PREFIX} -- object library status --")
    report_library_status()

    # 5. Save the assembly scene
    bpy.ops.wm.save_as_mainfile(filepath=OUTPUT_BLEND, check_existing=False)
    print(f"\n{LOG_PREFIX} assembly saved to: {OUTPUT_BLEND}")
    print(f"{LOG_PREFIX} open {OUTPUT_BLEND} in Blender to see linked props + library indicator.")

main()
