"""
bpy.types.AssetMetaData — Studio Asset Tagging & Batch GLB Export
=================================================================
Mark a set of scene objects as Blender assets using the direct
ID-level API, attach studio tags and author metadata, then batch-
export every object carrying the 'webxr' tag to its own Draco-
compressed GLB — skipping render-only assets automatically.

WHY bpy.types.ID.asset_mark() OVER bpy.ops.asset.mark()
  The operator variant requires the target object to be the active
  selection inside a 3D Viewport or Asset Browser context. In a
  background script (blender --background --python ...) there is no
  viewport, so the operator call raises a RuntimeError or silently
  exits without marking anything. The direct method ob.asset_mark()
  works on any ID block in any context and is idempotent — safe to
  call again on an already-marked asset.

WHY tag-based filtering OVER collection filtering
  A single object may belong to multiple collections and may be
  toggled between collections as the scene evolves. Asset tags are
  metadata that travels with the asset through library links and
  override instances. Filtering by tag at export time means the
  pipeline survives scene restructuring without revisiting the export
  script's collection assumptions.

Blender 5.1 notes
  - ob.asset_mark()  — marks the ID, returns the AssetMetaData
  - ob.asset_data    — the AssetMetaData block, or None if unmarked
  - ad.tags.new(name) — TagSet.new(); existing name is a no-op (safe to
    call on every build run without accumulating duplicates)
  - ad.description / ad.author — free-text metadata fields
  - Catalog assignment via ad.catalog_id requires a UUID that matches
    an entry in blender_assets.cats.txt in the library root. That file
    must exist before the .blend is saved; see CATALOG NOTE below.
  - use_selection=True in export_scene.gltf exports only the active
    selection; deselect everything first to avoid exporting the whole
    scene into each per-asset GLB.
"""

import json
import bpy

# ── parameters ──────────────────────────────────────────────────────────────
BLEND_PATH    = "//asset_library_demo.blend"
EXPORT_PREFIX = "//"                   # same dir as the .blend
MANIFEST_PATH = "//asset_manifest.json"
WEBXR_TAG     = "webxr"
STUDIO_TAGS   = ["webxr", "low-poly", "holoflow"]
AUTHOR        = "Holoflow Studio"
# ────────────────────────────────────────────────────────────────────────────


def _clear_scene() -> None:
    for ob in list(bpy.data.objects):
        bpy.data.objects.remove(ob, do_unlink=True)
    for me in list(bpy.data.meshes):
        bpy.data.meshes.remove(me)
    for ma in list(bpy.data.materials):
        bpy.data.materials.remove(ma)


def _primitive(kind: str, name: str, loc: tuple) -> bpy.types.Object:
    """Create one mesh primitive; kind in {'cube', 'sphere', 'cone'}."""
    if kind == "cube":
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=loc)
    elif kind == "sphere":
        bpy.ops.mesh.primitive_ico_sphere_add(
            subdivisions=2, radius=0.6, location=loc)
    elif kind == "cone":
        bpy.ops.mesh.primitive_cone_add(
            vertices=6, radius1=0.5, depth=1.2, location=loc)
    ob = bpy.context.active_object
    ob.name = name
    ob.data.name = name + "_mesh"
    return ob


def _mark_asset(ob: bpy.types.Object, desc: str, tags: list) -> None:
    """
    ob.asset_mark() stamps the ID block; subsequent calls are no-ops.
    Setting ad.tags.new() with a name that already exists is also silently
    ignored in 5.1 — so this function is safe to re-run on any object.
    """
    ob.asset_mark()
    ad = ob.asset_data
    ad.description = desc
    ad.author      = AUTHOR
    for t in tags:
        ad.tags.new(t)


def _material(ob: bpy.types.Object, rgb: tuple) -> None:
    mat = bpy.data.materials.new(ob.name + "_mat")
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs["Base Color"].default_value = (*rgb, 1.0)
        bsdf.inputs["Roughness"].default_value  = 0.35
    ob.data.materials.clear()
    ob.data.materials.append(mat)


def _deselect_all() -> None:
    for ob in bpy.data.objects:
        ob.select_set(False)


def _export_glb(ob: bpy.types.Object) -> str:
    """
    Per-object export: deselect all, select only this object, then run
    the GLTF exporter with use_selection=True. Each asset lands in its
    own snake-cased GLB file alongside the .blend.

    Draco L6 + WebP + Y-up per studio convention (holoflow_webxr_exporter).
    """
    _deselect_all()
    ob.select_set(True)
    bpy.context.view_layer.objects.active = ob

    out = EXPORT_PREFIX + ob.name.lower().replace(" ", "_") + ".glb"
    bpy.ops.export_scene.gltf(
        filepath                             = out,
        export_format                        = 'GLB',
        export_yup                           = True,
        export_apply                         = True,
        export_draco_mesh_compression_enable = True,
        export_draco_mesh_compression_level  = 6,
        export_image_format                  = 'WEBP',
        use_selection                        = True,
    )
    return out


def _tagged(tag: str) -> list:
    """Return all scene objects marked as assets that carry *tag*."""
    return [
        ob for ob in bpy.data.objects
        if ob.asset_data is not None
        and any(t.name == tag for t in ob.asset_data.tags)
    ]


def main() -> None:
    _clear_scene()

    # (kind, name, location, tags, description, colour)
    PROPS = [
        ("cube",   "hf_crate_a",    ( 0.0, 0.0, 0.5), STUDIO_TAGS,
         "Low-poly crate — WebXR prop",            (0.72, 0.48, 0.22)),
        ("sphere", "hf_lantern_b",  ( 2.2, 0.0, 0.6), STUDIO_TAGS,
         "Faceted lantern — WebXR light prop",     (0.90, 0.80, 0.20)),
        ("cone",   "hf_spike_c",    ( 4.4, 0.0, 0.6), STUDIO_TAGS,
         "Hex-base spike — WebXR decorative prop", (0.30, 0.55, 0.80)),
        # render-only control — same mark pipeline, different tags
        ("cube",   "hf_hero_block", (-2.2, 0.0, 0.5),
         ["render", "hero", "holoflow"],
         "Hero render block — NOT for WebXR",      (0.50, 0.50, 0.50)),
    ]

    for kind, name, loc, tags, desc, col in PROPS:
        ob = _primitive(kind, name, loc)
        _material(ob, col)
        _mark_asset(ob, desc, tags)

    bpy.ops.wm.save_as_mainfile(filepath=BLEND_PATH)

    webxr = _tagged(WEBXR_TAG)
    exported = []
    for ob in webxr:
        path = _export_glb(ob)
        exported.append({
            "name":        ob.name,
            "tags":        [t.name for t in ob.asset_data.tags],
            "description": ob.asset_data.description,
            "author":      ob.asset_data.author,
            "glb":         path,
        })
        print(f"[blueprint] {ob.name} → {path}")

    all_assets = [o for o in bpy.data.objects if o.asset_data]
    skipped    = [o.name for o in all_assets if o not in webxr]

    manifest = {
        "generator": "blueprint.py",
        "exported":  exported,
        "skipped":   skipped,
    }
    import os
    blend_dir = os.path.dirname(bpy.data.filepath) if bpy.data.filepath else ""
    mpath = os.path.join(blend_dir, "asset_manifest.json")
    with open(mpath, "w") as fh:
        json.dump(manifest, fh, indent=2)

    print(f"[blueprint] exported={len(exported)}  skipped={skipped}")


main()

# CATALOG NOTE
# To place assets inside a named catalog visible in the Asset Browser:
#   1. Create blender_assets.cats.txt in the library root:
#      import uuid
#      uid = str(uuid.uuid4())
#      with open("blender_assets.cats.txt", "w") as f:
#          f.write(f"VERSION 1\n{uid}:holoflow/props:Holoflow Props\n")
#   2. Then: ob.asset_data.catalog_id = uid
#   Blender resolves the human path (holoflow/props) from the UUID at
#   runtime; storing the UUID directly avoids locale-sensitive string ops.
