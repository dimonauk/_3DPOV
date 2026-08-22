"""
holoflow_macros/library_link_append.py
Reusable helpers for the Holoflow multi-file pipeline.
Blender 5.1+ | CC0

Usage:
    from holoflow_macros.library_link_append import (
        list_datablocks, link_collection, append_material, relocate_library
    )
"""

import bpy, os
from typing import Optional


def list_datablocks(blend_path: str) -> dict[str, list[str]]:
    """Return a dict of {attr: [names]} for all non-empty datablock types."""
    catalog: dict[str, list[str]] = {}
    with bpy.data.libraries.load(blend_path, link=False) as (src, _):
        for attr in ("collections", "objects", "materials",
                     "meshes", "node_groups", "actions", "armatures"):
            names = getattr(src, attr, [])
            if names:
                catalog[attr] = list(names)
    return catalog


def link_collection(
    blend_path: str,
    collection_name: str,
    into_scene: Optional[bpy.types.Scene] = None,
) -> bpy.types.Collection:
    """
    Link a named collection from blend_path into into_scene (default: active scene).
    Returns the linked bpy.types.Collection.
    """
    scene = into_scene or bpy.context.scene
    with bpy.data.libraries.load(blend_path, link=True) as (src, dst):
        if collection_name not in src.collections:
            raise KeyError(
                f"'{collection_name}' not in {blend_path}. "
                f"Available: {src.collections}"
            )
        dst.collections = [collection_name]

    coll = dst.collections[0]
    if coll is None:
        raise RuntimeError(f"Library load returned None for '{collection_name}'.")

    if coll.name not in scene.collection.children:
        scene.collection.children.link(coll)
    return coll


def append_material(blend_path: str, material_name: str) -> bpy.types.Material:
    """Append (local copy) a named material from blend_path."""
    with bpy.data.libraries.load(blend_path, link=False) as (src, dst):
        if material_name not in src.materials:
            raise KeyError(
                f"'{material_name}' not in {blend_path}. "
                f"Available: {src.materials}"
            )
        dst.materials = [material_name]

    mat = dst.materials[0]
    if mat is None:
        raise RuntimeError(f"Library load returned None for material '{material_name}'.")
    return mat


def relocate_library(old_name_or_path: str, new_path: str) -> None:
    """Update the filepath of an existing library and force a reload."""
    key = os.path.basename(old_name_or_path)
    lib = bpy.data.libraries.get(key)
    if lib is None:
        # Try matching by full filepath fragment
        for candidate in bpy.data.libraries:
            if old_name_or_path in candidate.filepath:
                lib = candidate
                break
    if lib is None:
        raise KeyError(f"Library '{old_name_or_path}' not found in bpy.data.libraries.")

    lib.filepath = new_path
    with bpy.context.temp_override(library=lib):
        bpy.ops.wm.lib_relocate(filepath=new_path)


def provenance_report(scene: Optional[bpy.types.Scene] = None) -> list[dict]:
    """
    Return a list of dicts describing library provenance for every scene object.

    Each dict: {name, status, library_path}
    status: 'local' | 'linked' | 'overridden'
    """
    scene = scene or bpy.context.scene
    report = []
    for ob in scene.objects:
        if ob.library and ob.override_library:
            status = "overridden"
        elif ob.library:
            status = "linked"
        else:
            status = "local"
        report.append({
            "name": ob.name,
            "status": status,
            "library_path": ob.library.filepath if ob.library else None,
        })
    return report
