"""
holoflow_macros/python_gpu_viewport_draw_overlay.py
Holoflow Studio · CC0 · Blender 5.1

Reusable drop-in for drawing coloured face-normal arrows in the 3D Viewport
via the gpu module (replaces deprecated bgl, removed in Blender 5.0).

USAGE
-----
From the Scripting workspace:

    from holoflow_macros import python_gpu_viewport_draw_overlay as ov
    ov.register_overlay()
    # ... work in the viewport ...
    ov.unregister_overlay()

Or as a one-shot from the Scripting Text Editor Run Script button —
paste this file (or import it) and call register_overlay().

PARAMETERS
----------
Override at module level before calling register_overlay():

    import holoflow_macros.python_gpu_viewport_draw_overlay as ov
    ov.NORMAL_LENGTH = 0.25
    ov.COL_DOWN      = (0.0, 0.5, 1.0, 1.0)
    ov.register_overlay()
"""

import bpy
import gpu
import mathutils
from gpu_extras.batch import batch_for_shader

# ---------------------------------------------------------------
# Parameters — override before calling register_overlay()
# ---------------------------------------------------------------
NORMAL_LENGTH: float = 0.15
LINE_WIDTH: float = 2.5
COL_DOWN: tuple[float, float, float, float] = (0.10, 0.35, 1.00, 1.0)
COL_UP:   tuple[float, float, float, float] = (1.00, 0.20, 0.10, 1.0)

# ---------------------------------------------------------------
# Internal state
# ---------------------------------------------------------------
_handle: object | None = None
_shader: gpu.types.GPUShader | None = None


def _lerp(a: float, b: float, t: float) -> float:
    return a + (b - a) * t


def _build_batch(obj: bpy.types.Object) -> gpu.types.GPUBatch:
    global _shader

    dg       = bpy.context.evaluated_depsgraph_get()
    eval_obj = obj.evaluated_get(dg)
    mesh     = eval_obj.to_mesh()

    mat   = obj.matrix_world
    inv_t = mat.inverted().transposed().to_3x3()

    verts:  list[tuple[float, ...]] = []
    colors: list[tuple[float, ...]] = []

    for poly in mesh.polygons:
        w_c = mat @ poly.center
        w_n = (inv_t @ mathutils.Vector(poly.normal)).normalized()
        tip = w_c + w_n * NORMAL_LENGTH
        t   = (w_n.z + 1.0) * 0.5
        col = (
            _lerp(COL_DOWN[0], COL_UP[0], t),
            _lerp(COL_DOWN[1], COL_UP[1], t),
            _lerp(COL_DOWN[2], COL_UP[2], t),
            1.0,
        )
        verts  += [tuple(w_c), tuple(tip)]
        colors += [col, col]

    eval_obj.to_mesh_clear()

    if _shader is None:
        _shader = gpu.shader.from_builtin("SMOOTH_COLOR")

    return batch_for_shader(_shader, "LINES", {"pos": verts, "color": colors})


def _draw_cb() -> None:
    obj = bpy.context.active_object
    if obj is None or obj.type != "MESH":
        return

    batch = _build_batch(obj)

    gpu.state.depth_test_set("LESS_EQUAL")
    gpu.state.depth_mask_set(False)
    gpu.state.line_width_set(LINE_WIDTH)

    _shader.bind()
    batch.draw(_shader)

    gpu.state.line_width_set(1.0)
    gpu.state.depth_mask_set(True)
    gpu.state.depth_test_set("LESS_EQUAL")


def register_overlay() -> None:
    """Bind the face-normal draw callback to all 3D Viewports."""
    global _handle
    if _handle is not None:
        bpy.types.SpaceView3D.draw_handler_remove(_handle, "WINDOW")
    _handle = bpy.types.SpaceView3D.draw_handler_add(
        _draw_cb, (), "WINDOW", "POST_VIEW"
    )
    for area in bpy.context.screen.areas:
        if area.type == "VIEW_3D":
            area.tag_redraw()


def unregister_overlay() -> None:
    """Remove the face-normal draw callback and release the shader cache."""
    global _handle, _shader
    if _handle is not None:
        bpy.types.SpaceView3D.draw_handler_remove(_handle, "WINDOW")
        _handle = None
        _shader = None
        for area in bpy.context.screen.areas:
            if area.type == "VIEW_3D":
                area.tag_redraw()
