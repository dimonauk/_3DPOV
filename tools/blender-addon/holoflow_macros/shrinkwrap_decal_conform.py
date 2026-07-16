"""
holoflow_macros.shrinkwrap_decal_conform
Reusable helper: conform a subdivided flat quad to any target mesh surface
using ShrinkwrapModifier in PROJECT/-Z/ABOVE_SURFACE mode.

Usage:
    from holoflow_macros.shrinkwrap_decal_conform import conform_decal_to_surface

    conform_decal_to_surface(
        decal   = bpy.data.objects["hf_decal"],
        target  = bpy.data.objects["hf_terrain"],
        offset  = 0.002,
        vg_name = None,   # optional vertex group mask
    )
"""

import bpy
import bmesh


def conform_decal_to_surface(
    decal:   bpy.types.Object,
    target:  bpy.types.Object,
    offset:  float = 0.002,
    vg_name: str   = "",
) -> None:
    """
    Apply a ShrinkwrapModifier (PROJECT/-Z/ABOVE_SURFACE) to `decal` targeting
    `target`, then apply and recalculate normals.

    Parameters
    ----------
    decal   : Object to project (the source mesh).
    target  : Surface to project onto (the target mesh).
    offset  : Above-surface normal lift in metres (default 0.002 = 2 mm).
    vg_name : Optional vertex group name on `decal` to restrict conform.
              Empty string = no mask (all verts conform).
    """
    bpy.context.view_layer.objects.active = decal
    mod = decal.modifiers.new("HF_Shrinkwrap", 'SHRINKWRAP')
    mod.wrap_method            = 'PROJECT'
    mod.target                 = target
    mod.offset                 = offset
    mod.wrap_mode              = 'ABOVE_SURFACE'
    mod.use_project_z          = True
    mod.use_negative_direction = True
    mod.use_positive_direction = False
    mod.use_invert_cull        = False

    if vg_name:
        mod.vertex_group = vg_name

    with bpy.context.temp_override(selected_objects=[decal]):
        bpy.ops.object.modifier_apply(modifier="HF_Shrinkwrap")

    bpy.ops.object.mode_set(mode='EDIT')
    bm = bmesh.from_edit_mesh(decal.data)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.normal_update()
    bmesh.update_edit_mesh(decal.data)
    bpy.ops.object.mode_set(mode='OBJECT')
