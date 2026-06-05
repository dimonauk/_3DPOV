# holoflow_macros/grease_pencil_lineart.py
# Blender 5.1 | CC0
#
# Reusable helper: wrap any mesh object in a GP_LINEART ink overlay.
# Import and call setup_lineart() from any blueprint script.

import bpy
import math


def setup_lineart(
    source_obj: bpy.types.Object,
    layer_name: str = "Lines",
    ink_color: tuple = (0.0, 0.0, 0.0, 1.0),
    crease_deg: float = 30.0,
    thickness: int = 3,
    use_contour: bool = True,
    use_crease: bool = True,
) -> bpy.types.Object:
    """
    Creates a GPv2 GPENCIL object with a GP_LINEART modifier targeting source_obj.

    Returns the GP object.  The modifier writes strokes into layer_name every
    frame — contour (silhouette) and/or crease edges above crease_deg degrees.

    API note: uses GPv2 (GPENCIL + GP_LINEART), stable in Blender 5.1.
    GPv3 migration: swap to bpy.ops.object.grease_pencil_add() and
    modifier type 'GREASE_PENCIL_LINEART' once that API stabilises in 5.2.
    """
    # GP data + object
    gp_name = f"{source_obj.name}_lineart"
    gp_data = bpy.data.grease_pencils.new(gp_name)
    gp_obj  = bpy.data.objects.new(gp_name, gp_data)
    bpy.context.scene.collection.objects.link(gp_obj)

    # Layer — Line Art modifier targets this by name string
    layer             = gp_data.layers.new(layer_name, set_active=True)
    layer.line_change = 0   # don't override modifier thickness per-layer

    # GP material: solid stroke, no fill
    mat_name = f"{gp_name}_mat"
    gp_mat   = bpy.data.materials.new(mat_name)
    bpy.data.materials.create_gpencil_data(gp_mat)
    gp              = gp_mat.grease_pencil
    gp.show_stroke  = True
    gp.stroke_style = "SOLID"
    gp.color        = ink_color
    gp.show_fill    = False
    gp_data.materials.append(gp_mat)

    # Line Art modifier
    la = gp_obj.modifiers.new("LineArt", "GP_LINEART")
    la.target_layer      = layer_name
    la.target_material   = gp_mat
    la.source_type       = "OBJECT"
    la.source_object     = source_obj
    la.use_contour       = use_contour
    la.use_crease        = use_crease
    la.crease_threshold  = math.radians(crease_deg)
    la.thickness         = thickness
    la.opacity           = 1.0

    return gp_obj
