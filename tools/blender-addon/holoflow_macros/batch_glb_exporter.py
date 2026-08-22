"""
holoflow_macros/batch_glb_exporter.py
Reusable macro: export every HF_EXPORT_ collection as a Draco GLB.
Blender 5.1  ·  CC0  ·  Holoflow Studio

Usage from Text Editor or another macro:
  import importlib, sys
  sys.path.insert(0, '/path/to/tools/blender-addon')
  from holoflow_macros import batch_glb_exporter
  importlib.reload(batch_glb_exporter)
  batch_glb_exporter.run(output_dir='//../../glbs/my_scene/', draco_level=6)
"""

import bpy
import json
import os

# ── Defaults (override via run() kwargs) ──────────────────────────────────────
_DEFAULTS = {
    "export_prefix"    : "HF_EXPORT_",
    "draco_level"      : 6,
    "draco_pos_bits"   : 14,
    "draco_nrm_bits"   : 10,
    "draco_uv_bits"    : 12,
    "webp_textures"    : True,
    "webp_quality"     : 90,
    "export_cameras"   : False,
    "export_lights"    : False,
    "snake_case_names" : True,
    "manifest_filename": "manifest.json",
}


# ── Internal helpers ──────────────────────────────────────────────────────────
def _find_layer_collection(root_lc, name):
    if root_lc.collection.name == name:
        return root_lc
    for child in root_lc.children:
        found = _find_layer_collection(child, name)
        if found:
            return found
    return None


def _snake_case(s):
    return s.lower().replace(' ', '_').replace('-', '_').replace('.', '_')


def _resolve_dir(path):
    if path.startswith('//'):
        blend_dir = os.path.dirname(bpy.path.abspath('//'))
        return os.path.normpath(os.path.join(blend_dir, path[2:]))
    return os.path.abspath(path)


# ── Public API ────────────────────────────────────────────────────────────────
def run(output_dir: str = "//batch_glbs/", **kwargs) -> list[dict]:
    """
    Export all HF_EXPORT_* collections as Draco GLBs.
    Returns list of result dicts (same schema as manifest['exports']).
    """
    cfg = {**_DEFAULTS, **kwargs}
    prefix = cfg["export_prefix"]

    export_cols = sorted(
        [c for c in bpy.data.collections if c.name.startswith(prefix)],
        key=lambda c: c.name,
    )
    if not export_cols:
        print(f"[batch_glb_exporter] No '{prefix}*' collections found.")
        return []

    out_abs = _resolve_dir(output_dir)
    os.makedirs(out_abs, exist_ok=True)

    root_lc = bpy.context.view_layer.layer_collection
    results = []

    for col in export_cols:
        lc = _find_layer_collection(root_lc, col.name)
        if lc is None:
            print(f"  [SKIP] '{col.name}' not in view layer")
            continue

        # Ensure visible
        lc.exclude      = False
        lc.hide_viewport = False
        bpy.context.view_layer.active_layer_collection = lc

        slug     = _snake_case(col.name[len(prefix):])
        glb_path = os.path.join(out_abs, f"{slug}.glb")

        if cfg["snake_case_names"]:
            for obj in col.all_objects:
                if obj.parent is None or obj.parent not in set(col.all_objects):
                    obj.name = _snake_case(obj.name)

        poly_count = sum(
            len(o.data.polygons)
            for o in col.all_objects
            if o.type == 'MESH' and o.data
        )

        bpy.ops.export_scene.gltf(
            filepath                             = glb_path,
            export_format                        = 'GLB',
            use_active_collection                = True,
            use_selection                        = False,
            export_apply                         = True,
            export_cameras                       = cfg["export_cameras"],
            export_lights                        = cfg["export_lights"],
            export_yup                           = True,
            export_image_format                  = 'WEBP' if cfg["webp_textures"] else 'AUTO',
            export_image_quality                 = cfg["webp_quality"],
            export_draco_mesh_compression_enable = True,
            export_draco_mesh_compression_level  = cfg["draco_level"],
            export_draco_position_quantization   = cfg["draco_pos_bits"],
            export_draco_normal_quantization     = cfg["draco_nrm_bits"],
            export_draco_texcoord_quantization   = cfg["draco_uv_bits"],
        )

        size_kb = os.path.getsize(glb_path) // 1024 if os.path.exists(glb_path) else 0
        entry = {
            "slug"      : slug,
            "collection": col.name,
            "filepath"  : glb_path,
            "objects"   : len(col.all_objects),
            "polygons"  : poly_count,
            "size_kb"   : size_kb,
        }
        results.append(entry)
        print(f"  ✓ {slug}.glb ({poly_count} polys · {size_kb} KB)")

    manifest = {
        "blender_version": ".".join(str(v) for v in bpy.app.version),
        "blend_file"     : os.path.basename(bpy.data.filepath) or "(unsaved)",
        "draco_level"    : cfg["draco_level"],
        "webp_textures"  : cfg["webp_textures"],
        "exports"        : results,
        "total_exported" : len(results),
    }
    manifest_path = os.path.join(out_abs, cfg["manifest_filename"])
    with open(manifest_path, 'w') as fh:
        json.dump(manifest, fh, indent=2)

    print(f"[batch_glb_exporter] {len(results)} GLB(s) → {out_abs}")
    return results
