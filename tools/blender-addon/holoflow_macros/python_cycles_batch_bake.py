"""
holoflow_macros/python_cycles_batch_bake.py
Reusable batch bake helpers for the Holoflow Studio pipeline.
Licence: CC0

Usage (from the Scripting workspace or a pipeline script):
    from holoflow_macros.python_cycles_batch_bake import run_batch_bake
    run_batch_bake(["lo_prop_a", "lo_prop_b"], {"lo_prop_a": "hi_prop_a"})

This file exposes the same API as the standalone blueprint.py but imports
cleanly as a module from within the holoflow_webxr_exporter add-on context.
"""

from __future__ import annotations

import bpy
import os
from typing import Optional

# Defaults — callers may override per invocation
DEFAULT_OUTPUT_DIR   = "//bake_output"
DEFAULT_IMAGE_WIDTH  = 1024
DEFAULT_IMAGE_HEIGHT = 1024
DEFAULT_SAMPLES      = 64
DEFAULT_MARGIN_PX    = 16
DEFAULT_CAGE_EXTRUDE = 0.02

DEFAULT_PASSES: list[dict] = [
    {"type": "NORMAL", "bits": 32, "suffix": "_nm"},
    {"type": "AO",     "bits": 8,  "suffix": "_ao"},
    {"type": "EMIT",   "bits": 8,  "suffix": "_em"},
]


def _ensure_dir(blend_rel: str) -> str:
    path = bpy.path.abspath(blend_rel)
    os.makedirs(path, exist_ok=True)
    return path


def _require_uv(obj: bpy.types.Object) -> None:
    if not obj.data.uv_layers:
        obj.data.uv_layers.new(name="BakeST")
    obj.data.uv_layers.active = obj.data.uv_layers[0]


def _new_image(
    name: str, w: int, h: int, bits: int
) -> bpy.types.Image:
    img = bpy.data.images.new(
        name=name, width=w, height=h,
        alpha=False, float_buffer=(bits == 32), is_data=(bits == 32),
    )
    img.colorspace_settings.name = "Non-Color" if bits == 32 else "sRGB"
    return img


def _inject_node(mat: bpy.types.Material, img: bpy.types.Image) -> None:
    mat.use_nodes = True
    node = mat.node_tree.nodes.new("ShaderNodeTexImage")
    node.image = img
    node.label = "_HF_BAKE"
    node.location = (0.0, -500.0)
    mat.node_tree.nodes.active = node


def _remove_node(mat: bpy.types.Material) -> None:
    for n in list(mat.node_tree.nodes):
        if n.label == "_HF_BAKE":
            mat.node_tree.nodes.remove(n)


def _save_webp(img: bpy.types.Image, out_dir: str) -> str:
    scene = bpy.context.scene
    scene.render.image_settings.file_format = "WEBP"
    scene.render.image_settings.quality = (
        100 if img.name.endswith("_nm") else 90
    )
    fp = os.path.join(out_dir, img.name + ".webp")
    img.file_format = "WEBP"
    img.filepath_raw = fp
    img.save_render(filepath=fp, scene=scene)
    return fp


def bake_object(
    lo_poly: bpy.types.Object,
    hi_poly: Optional[bpy.types.Object],
    out_dir: str,
    passes: list[dict] = DEFAULT_PASSES,
    width: int = DEFAULT_IMAGE_WIDTH,
    height: int = DEFAULT_IMAGE_HEIGHT,
    margin_px: int = DEFAULT_MARGIN_PX,
    cage_extrude: float = DEFAULT_CAGE_EXTRUDE,
) -> list[str]:
    """Bake all passes for one lo-poly object. Returns list of WebP paths."""
    _require_uv(lo_poly)
    saved: list[str] = []

    for p in passes:
        img = _new_image(lo_poly.name + p["suffix"], width, height, p["bits"])
        for slot in lo_poly.material_slots:
            if slot.material:
                _inject_node(slot.material, img)

        bpy.ops.object.select_all(action="DESELECT")
        lo_poly.select_set(True)
        bpy.context.view_layer.objects.active = lo_poly
        use_s2a = hi_poly is not None and p["type"] == "NORMAL"
        if use_s2a:
            hi_poly.select_set(True)

        bpy.ops.object.bake(
            type=p["type"],
            use_selected_to_active=use_s2a,
            cage_extrusion=cage_extrude if use_s2a else 0.0,
            margin=margin_px,
            margin_type="EXTEND",
            save_mode="INTERNAL",
        )

        path = _save_webp(img, out_dir)
        saved.append(path)

        for slot in lo_poly.material_slots:
            if slot.material:
                _remove_node(slot.material)
        bpy.data.images.remove(img)

    return saved


def run_batch_bake(
    lo_poly_names: list[str],
    hi_poly_map: Optional[dict[str, str]] = None,
    output_dir: str = DEFAULT_OUTPUT_DIR,
    samples: int = DEFAULT_SAMPLES,
    passes: list[dict] = DEFAULT_PASSES,
) -> list[str]:
    """
    Batch bake entry point. Temporarily switches to Cycles, bakes all objects,
    restores the original engine. Returns all saved WebP paths.
    """
    scene = bpy.context.scene
    prev_engine = scene.render.engine
    prev_samples = scene.cycles.samples
    scene.render.engine = "CYCLES"
    scene.cycles.samples = samples

    out_dir = _ensure_dir(output_dir)
    hi_map = hi_poly_map or {}
    all_saved: list[str] = []

    for lo_name in lo_poly_names:
        lo = bpy.data.objects.get(lo_name)
        if lo is None:
            continue
        hi_name = hi_map.get(lo_name)
        hi = bpy.data.objects.get(hi_name) if hi_name else None
        all_saved.extend(bake_object(lo, hi, out_dir, passes=passes))

    scene.render.engine = prev_engine
    scene.cycles.samples = prev_samples
    return all_saved
