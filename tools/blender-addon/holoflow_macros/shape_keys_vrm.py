"""
holoflow_macros/shape_keys_vrm.py — Shape Key helpers for VRM expression pipelines
Blender 5.1 · CC0 · Holoflow Studio

Reusable utilities extracted from the shape-keys-morph-targets tutorial blueprint.
Import in any script:

    import sys, pathlib
    sys.path.insert(0, str(pathlib.Path(__file__).parent))
    from shape_keys_vrm import zone, add_key, export_morph_glb

These functions assume the caller has already created a mesh object with a Basis
shape key.  They handle nothing about scene setup or mesh topology — that belongs
in the caller's blueprint.py.
"""

from __future__ import annotations
import bpy
from mathutils import Vector  # type: ignore[import]
from pathlib import Path


def zone(
    verts,
    *,
    x: tuple = (None, None),
    y: tuple = (None, None),
    z: tuple = (None, None),
) -> list[int]:
    """
    Return indices of mesh vertices whose world-space co falls within the box.

    Pass (None, None) for an axis to leave it unconstrained.  Position-based
    selection survives topology changes between Blender patch releases, unlike
    hard-coded index lists.

    Example — left upper eyelid on a face proxy scaled to (0.75, 0.55, 1.05):
        lid_L = zone(obj.data.vertices, x=(-0.55, -0.10), y=(0.05, 9), z=(0.10, 0.55))
    """
    xlo = x[0] if x[0] is not None else -1e9
    xhi = x[1] if x[1] is not None else  1e9
    ylo = y[0] if y[0] is not None else -1e9
    yhi = y[1] if y[1] is not None else  1e9
    zlo = z[0] if z[0] is not None else -1e9
    zhi = z[1] if z[1] is not None else  1e9
    return [
        v.index for v in verts
        if xlo <= v.co.x <= xhi
        and ylo <= v.co.y <= yhi
        and zlo <= v.co.z <= zhi
    ]


def add_key(obj, name: str, offsets: dict[int, Vector]) -> "bpy.types.ShapeKey":
    """
    Add a Relative shape key to obj from the Basis, then apply vertex offsets.

    offsets: {vertex_index: Vector(dx, dy, dz)}

    from_mix=False ensures the key starts from the Basis rest pose regardless
    of current slider state.  KEY_LINEAR interpolation matches glTF morph
    target blending semantics.

    key_block.data[i].co is an absolute coordinate, not a delta.  Adding the
    delta Vector to it works because the key starts as a copy of the Basis —
    the result is Basis_position + delta, which is the correct absolute position
    for that expression.
    """
    kb = obj.shape_key_add(name=name, from_mix=False)
    kb.interpolation = "KEY_LINEAR"
    for idx, delta in offsets.items():
        kb.data[idx].co += delta
    return kb


def export_morph_glb(obj, filepath: str | Path) -> None:
    """
    Export obj as a GLB with morph targets.

    Draco compression is deliberately disabled — KHR_draco_mesh_compression and
    KHR_mesh_morph_targets are mutually exclusive in the glTF 2.0 spec.  Use
    HTTP transport compression (gzip/brotli) for size reduction instead.

    export_apply is False because Blender cannot apply modifiers to a mesh that
    has shape keys — the modifier stack and the shape key data arrays must have
    the same vertex count, and applying transforms the mesh in place.
    """
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj

    bpy.ops.export_scene.gltf(
        filepath=str(filepath),
        export_format="GLB",
        use_selection=True,
        export_apply=False,
        export_normals=True,
        export_morph=True,
        export_morph_normal=True,
        export_morph_tangent=False,
        export_yup=True,
        export_texcoords=True,
        export_materials="EXPORT",
    )


def vrm_expression_names() -> dict[str, str]:
    """
    Map of Fcl_ shape key names to VRM 1.0 expression preset names.

    Fcl_ names originate from AliciaSolid's reference avatar and are the
    convention recognised by the VRM-Blender-IO add-on's expression mapper.
    """
    return {
        "Fcl_EYE_Close_L": "blinkLeft",
        "Fcl_EYE_Close_R": "blinkRight",
        "Fcl_ALL_Joy":     "happy",
        "Fcl_ALL_Angry":   "angry",
        "Fcl_ALL_Sorrow":  "sad",
        "Fcl_ALL_Fun":     "surprised",
        "Fcl_MTH_A":       "aa",
        "Fcl_MTH_I":       "ih",
        "Fcl_MTH_U":       "ou",
        "Fcl_MTH_E":       "ee",
        "Fcl_MTH_O":       "oh",
    }
