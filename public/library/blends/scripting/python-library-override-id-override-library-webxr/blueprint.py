"""
Holoflow Studio — Blender 5.1 Blueprint
Python bpy.types.IDOverrideLibrary — Library Override System
Link, Override & Propagate Linked Hero Assets for WebXR Scene Composition

Blender's Library Override system (stable in 5.1, introduced in 2.91, overhauled
in 4.0) lets a scene keep a LIVE LINK to an external .blend asset library while
permitting per-instance edits — position, material slot, shape-key values,
custom properties — that survive a re-link.  This is fundamentally different from
bpy.ops.wm.append(), which severs the library connection and imports a static copy.

WHY this matters for WebXR:
  A studio asset library holds canonical hero props (a faceted gem, a VRM
  character, a glowing orb).  Multiple scenes may instance the same prop with
  different positions or tints.  When the canonical asset is updated and the
  scenes are re-linked, ONLY the non-overridden properties update automatically.
  Overridden properties (position, custom tint) stay as authored.  The final
  GLB export bakes the evaluated override geometry — Three.js / WebXR sees the
  composed result with no knowledge of the override layer.

Key API surface (Blender 5.1):
  ID.override_library               — IDOverrideLibrary block, None if not overridden
  ID.override_create(remap_local_usages=True)
                                    — creates a LOCAL copy with an override pointer
  IDOverrideLibrary.reference       — the original library ID
  IDOverrideLibrary.is_in_progress  — True while override creation is still building
  IDOverrideLibraryProperty         — per-property override record
  ID.override_library_property_add(rna_path) — programmatically lock a property
  bpy.ops.object.make_override_library()  — operator path (needs selection context)
  bpy.ops.outliner.liboverride_resync_hierarchy_enforce()
                                    — re-reads library, preserves override properties

Blueprint scene:
  1. Build a minimal library .blend in memory and save it to //hero_library.blend.
     Contains: one faceted gem mesh + material (named 'gem_hero').
  2. In the composition scene, link the gem_hero object from the library.
  3. Create a library override via ID.override_create().
  4. Override-lock the object's location and material[0] slot colour so they
     survive any future re-link.
  5. Export the composition as Draco-compressed GLB.
  6. Save the composition as //library_override_demo.blend.

Outputs:
    hero_library.blend              — source asset library (canonical prop)
    library_override_demo.blend     — composition scene with live linked + overridden prop
    override_composed.glb           — Draco 6 GLB, evaluated final geometry
    override_meta.json              — manifest: library path, overridden property paths
"""

import bpy
import json
import os
import mathutils

# ─── Parameters ──────────────────────────────────────────────────────────────
SLUG              = "python-library-override-id-override-library-webxr"
GEM_NAME          = "gem_hero"
GEM_MAT           = "gem_hero_mat"
OVERRIDE_LOCATION = mathutils.Vector((1.4, 0.0, 0.0))
OVERRIDE_COLOUR   = (0.12, 0.72, 0.85, 1.0)   # studio teal override
LIBRARY_BLEND     = "//hero_library.blend"
COMP_BLEND        = "//library_override_demo.blend"
OUT_GLB           = "//override_composed.glb"
OUT_META          = "//override_meta.json"
DRACO_LEVEL       = 6

# ─── 1. Build the hero library .blend ─────────────────────────────────────────
def build_hero_library(library_path: str) -> None:
    """
    Create a self-contained library .blend that holds one faceted gem object.
    We save it, then reload the composition scene from a blank start.

    The gem is a UV-sphere with flat shading (polygon.use_smooth = False) to
    produce the studio faceted aesthetic.  It gets a named Principled BSDF
    material whose Base Color we later override in the composition scene.

    save_as_mainfile() flushes all datablocks to disk.  The subsequent
    bpy.ops.wm.read_homefile(use_empty=True) resets to a blank scene so the
    composition context starts clean — critical because any stale library
    references from the library-build phase would confuse the link step.
    """
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()
    for blk in (bpy.data.meshes, bpy.data.materials, bpy.data.collections):
        for item in list(blk):
            blk.remove(item)

    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.5, segments=8, ring_count=6)
    gem = bpy.context.active_object
    gem.name = GEM_NAME
    gem.data.name = GEM_NAME

    # flat shading — every polygon gets its geometric normal, no smooth interpolation
    for poly in gem.data.polygons:
        poly.use_smooth = False

    mat = bpy.data.materials.new(GEM_MAT)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value  = (0.08, 0.55, 0.75, 1.0)  # library default
    bsdf.inputs["Roughness"].default_value   = 0.22
    bsdf.inputs["Metallic"].default_value    = 0.06
    bsdf.inputs["IOR"].default_value         = 1.45
    gem.data.materials.append(mat)

    abs_path = bpy.path.abspath(library_path)
    bpy.ops.wm.save_as_mainfile(filepath=abs_path)
    print(f"[{SLUG}] library saved → {abs_path}")


# ─── 2. Link the hero asset from the library ─────────────────────────────────
def link_from_library(library_path: str) -> bpy.types.Object:
    """
    bpy.ops.wm.link() links a named datablock into the current scene while keeping
    a REFERENCE back to the library file.  The linked object is read-only: you
    cannot move it, change its material, or key its properties directly.

    The with-block structure matches Blender's own link operator signature — the
    'filepath' is the full inner path using Blender's double-slash encoded syntax:
      library_path + /Object/ + object_name
    'directory' = library_path + /Object/
    'filename'  = GEM_NAME

    After linking, the object lives in bpy.data.objects with .library set to the
    library datablock, .override_library == None (not yet overridden).
    """
    abs_lib = bpy.path.abspath(library_path)
    inner_dir  = abs_lib + "/Object/"
    inner_file = GEM_NAME

    bpy.ops.wm.link(
        filepath  = inner_dir + inner_file,
        directory = inner_dir,
        filename  = inner_file,
        link      = True,         # live link, not append
    )

    # find the newly linked object (library reference, not yet overridden)
    linked_obj = bpy.data.objects.get(GEM_NAME)
    if linked_obj is None or linked_obj.library is None:
        raise RuntimeError(f"[{SLUG}] link failed — {GEM_NAME} not found in library")

    print(f"[{SLUG}] linked '{GEM_NAME}' from library "
          f"'{linked_obj.library.filepath}' — override_library: {linked_obj.override_library}")
    return linked_obj


# ─── 3. Create a library override ────────────────────────────────────────────
def create_override(linked_obj: bpy.types.Object) -> bpy.types.Object:
    """
    ID.override_create(remap_local_usages=True) performs the override in the
    data API — no 3-D View context required, unlike bpy.ops.object.make_override_library().

    It returns a NEW local ID (a copy) whose .override_library points back to
    the original linked ID.  The original 'linked_obj' is REPLACED in scene
    collections by the override copy when remap_local_usages=True.

    After this call:
      override.library              → None  (it is local, not a library datablock)
      override.override_library     → IDOverrideLibrary
      override.override_library.reference → the original linked ID
      override.is_library_indirect  → False

    WHY remap_local_usages=True: any existing use of the linked ID inside THIS
    .blend (collection slots, constraints, drivers) automatically points to the
    override instead.  Omitting it leaves dangling library references for those
    existing usages.
    """
    override_obj = linked_obj.override_create(remap_local_usages=True)

    print(f"[{SLUG}] override created: '{override_obj.name}' "
          f"library={override_obj.library} "
          f"override_library.reference='{override_obj.override_library.reference.name}'")
    return override_obj


# ─── 4. Apply overrides (location + material colour) ─────────────────────────
def apply_overrides(override_obj: bpy.types.Object) -> None:
    """
    Setting a property on the override object writes a LOCAL value that diverges
    from the library.  Blender tracks which properties differ via the
    IDOverrideLibraryProperty list, but in 5.1 you DO NOT need to call
    override_library_property_add() manually for simple RNA properties on objects —
    setting the value is enough; Blender auto-registers the property as overridden
    on next depsgraph evaluation.

    For properties you want to ENFORCE (prevent library updates from ever overwriting
    them even if the library resets them), call id_override_library_property_add()
    explicitly and set the operation to REPLACE.

    The material slot: mesh.materials[0] is the material datablock pointer.  To
    override it, we reroute the slot to a NEW local material — a copy of the library
    material with a modified colour.  This is the standard pattern for per-instance
    tinting without editing the canonical library asset.
    """
    # Location override: move the prop to its composition position
    override_obj.location = OVERRIDE_LOCATION

    # Explicitly lock location as an enforced override so future resyncs don't reset it
    # ID.override_library_property_add(rna_path) returns (prop, created_bool)
    loc_prop, _ = override_obj.id_override_library_property_add(rna_path="location", init_from_final=True)
    for item in loc_prop.operations:
        item.operation = 'REPLACE'

    # Material colour override: duplicate library material and apply custom colour
    lib_mat = override_obj.data.materials[0] if override_obj.data.materials else None
    if lib_mat:
        local_mat = lib_mat.copy()                    # .copy() breaks the library link
        local_mat.name = GEM_MAT + "_override"
        bsdf = local_mat.node_tree.nodes.get("Principled BSDF")
        if bsdf:
            bsdf.inputs["Base Color"].default_value = OVERRIDE_COLOUR
        override_obj.data.materials[0] = local_mat   # slot reassignment
        print(f"[{SLUG}] material override: '{local_mat.name}' colour={OVERRIDE_COLOUR[:3]}")

    # Trigger depsgraph update so override_library.properties populates
    bpy.context.view_layer.update()

    print(f"[{SLUG}] override properties registered: "
          f"{[p.rna_path for p in override_obj.override_library.properties]}")


# ─── 5. Add a floor plane for visual grounding ───────────────────────────────
def add_floor() -> None:
    bpy.ops.mesh.primitive_plane_add(size=4.0, location=(0.0, 0.0, -0.5))
    floor = bpy.context.active_object
    floor.name = "floor_plane"
    mat = bpy.data.materials.new("floor_mat")
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = (0.18, 0.18, 0.22, 1.0)
    bsdf.inputs["Roughness"].default_value  = 0.85
    floor.data.materials.append(mat)


# ─── 6. Export GLB ────────────────────────────────────────────────────────────
def export_glb(out_path: str) -> None:
    """
    bpy.ops.export_scene.gltf evaluates the dependency graph with all overrides
    FULLY APPLIED — the GLB contains the local positions and material colours, not
    the library defaults.  The GLB consumer (Three.js) receives the final composed
    scene with no knowledge of the override layer.  This is the canonical export
    path for WebXR: the override system is a Blender-side authoring tool, invisible
    to the runtime.
    """
    bpy.ops.object.select_all(action='DESELECT')
    for obj in bpy.data.objects:
        if obj.type == 'MESH':
            obj.select_set(True)
    bpy.context.view_layer.objects.active = bpy.data.objects.get("gem_hero")

    bpy.ops.export_scene.gltf(
        filepath                             = bpy.path.abspath(out_path),
        export_format                        = 'GLB',
        use_selection                        = False,
        export_apply                         = True,
        export_draco_mesh_compression_enable = True,
        export_draco_mesh_compression_level  = DRACO_LEVEL,
        export_image_format                  = 'WEBP',
        export_yup                           = True,
    )
    print(f"[{SLUG}] GLB exported → {bpy.path.abspath(out_path)}")


# ─── 7. Write manifest JSON ───────────────────────────────────────────────────
def write_meta(override_obj: bpy.types.Object, out_path: str) -> None:
    overridden_props = [p.rna_path for p in override_obj.override_library.properties]
    meta = {
        "slug":              SLUG,
        "blender_version":   list(bpy.app.version),
        "library_path":      bpy.path.abspath(LIBRARY_BLEND),
        "override_object":   override_obj.name,
        "library_reference": override_obj.override_library.reference.name,
        "overridden_rna_paths": overridden_props,
        "override_location": list(OVERRIDE_LOCATION),
        "override_colour":   list(OVERRIDE_COLOUR[:3]),
    }
    abs_path = bpy.path.abspath(out_path)
    with open(abs_path, "w", encoding="utf-8") as fh:
        json.dump(meta, fh, indent=2)
    print(f"[{SLUG}] meta → {abs_path}")


# ─── 8. Save composition .blend ──────────────────────────────────────────────
def save_composition(comp_path: str) -> None:
    """
    Saving with the library link ACTIVE preserves the override relationship.
    Re-opening this file will re-link from hero_library.blend automatically.
    If hero_library.blend is updated (new topology, new shader), the override
    system re-applies only the non-overridden properties, leaving location and
    material tint unchanged.
    """
    bpy.ops.wm.save_as_mainfile(filepath=bpy.path.abspath(comp_path))
    print(f"[{SLUG}] composition saved → {bpy.path.abspath(comp_path)}")


# ─── Main ─────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    # Phase A: build library (saves to disk, resets scene internally)
    build_hero_library(LIBRARY_BLEND)

    # Phase B: fresh composition scene — link → override → configure
    bpy.ops.wm.read_homefile(use_empty=True)
    linked  = link_from_library(LIBRARY_BLEND)
    overridden = create_override(linked)
    apply_overrides(overridden)
    add_floor()

    # Phase C: export + save
    export_glb(OUT_GLB)
    write_meta(overridden, OUT_META)
    save_composition(COMP_BLEND)
    print(f"[{SLUG}] complete")
