"""
holoflow_macros/sheen_coat_preset.py
Blender 5.1  ·  Holoflow Studio  ·  CC0

Apply Sheen (velvet/microfibre) or Coat (lacquer/clearcoat) presets to any
active Principled BSDF material via the Python data API.

Usage from the Scripting workspace:
    from holoflow_macros.sheen_coat_preset import apply_velvet, apply_lacquer
    mat = bpy.context.active_object.active_material
    apply_velvet(mat, tint=0.36)
    apply_lacquer(mat, coat_roughness=0.04, coat_ior=1.49)

Both functions are idempotent — safe to call multiple times.
"""

import bpy
from typing import Tuple

Color4 = Tuple[float, float, float, float]


def _get_pbsdf(mat: bpy.types.Material) -> bpy.types.Node:
    if not mat.use_nodes:
        raise ValueError(f"Material '{mat.name}' has use_nodes=False")
    for n in mat.node_tree.nodes:
        if n.type == "BSDF_PRINCIPLED":
            return n
    raise ValueError(f"No Principled BSDF found in '{mat.name}'")


def _set(node: bpy.types.Node, socket: str, val) -> None:
    inp = node.inputs[socket]
    dv  = inp.default_value
    if hasattr(dv, "__len__"):
        for i, v in enumerate(val):
            dv[i] = v
    else:
        inp.default_value = val


def apply_velvet(
    mat: bpy.types.Material,
    sheen_weight: float = 0.92,
    sheen_roughness: float = 0.22,
    tint: float = 0.35,
) -> None:
    """
    Apply a velvet sheen preset (Charlier–Estevez retroreflective lobe).

    sheen_weight:    0.85–1.0 for deep pile velvet, 0.5–0.7 for satin
    sheen_roughness: 0.15–0.30 = sharp velvet peak; 0.7–0.95 = microfibre
    tint:            0.0 = white edge; 1.0 = fully tinted by Base Color
    """
    bsdf = _get_pbsdf(mat)
    _set(bsdf, "Sheen Weight",    sheen_weight)
    _set(bsdf, "Sheen Roughness", sheen_roughness)
    _set(bsdf, "Sheen Tint",      tint)
    # Velvet has no coat layer
    _set(bsdf, "Coat Weight", 0.0)


def apply_lacquer(
    mat: bpy.types.Material,
    coat_weight: float = 0.85,
    coat_roughness: float = 0.05,
    coat_ior: float = 1.49,
    suede_sheen: float = 0.10,
) -> None:
    """
    Apply a lacquer/clearcoat preset.

    coat_weight:    0.6–0.9 for strong gloss coat
    coat_roughness: 0.02–0.08 = mirror lacquer; 0.3–0.5 = satin
    coat_ior:       1.33=water, 1.49=acrylic lacquer, 1.52=glass
    suede_sheen:    faint suede bloom beneath the coat (0 = disable)
    """
    bsdf = _get_pbsdf(mat)
    _set(bsdf, "Coat Weight",     coat_weight)
    _set(bsdf, "Coat Roughness",  coat_roughness)
    _set(bsdf, "Coat IOR",        coat_ior)
    if suede_sheen > 0.0:
        _set(bsdf, "Sheen Weight",    suede_sheen)
        _set(bsdf, "Sheen Roughness", 0.80)   # wide, soft — not a velvet peak


def apply_satin(mat: bpy.types.Material) -> None:
    """Mid-gloss satin coat (mid Roughness, moderate Sheen)."""
    apply_lacquer(mat, coat_weight=0.55, coat_roughness=0.35, suede_sheen=0.18)
    bsdf = _get_pbsdf(mat)
    _set(bsdf, "Sheen Tint", 0.50)


# ── Quick demo ───────────────────────────────────────────────────────────────
if __name__ == "__main__":
    obj = bpy.context.active_object
    if obj and obj.active_material:
        apply_velvet(obj.active_material)
        print(f"[holoflow] velvet preset applied to '{obj.active_material.name}'")
    else:
        print("[holoflow] select an object with an active material first")
