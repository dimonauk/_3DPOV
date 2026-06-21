"""
Python — gpu Module: Custom Viewport Overlay
Blender 5.1 | CC0 | Holoflow Studio

TECHNIQUE
---------
Every render engine exposes the 3D Viewport via two hook points:
  POST_PIXEL  — draws in screen-pixel coordinates after all geometry.
  POST_VIEW   — draws in world-space after all geometry; depth buffer is live.

We use POST_VIEW so arrow tips respect object occlusion: a face whose
normal points into the mesh is partially hidden, which is exactly the
visual feedback a rigger or modeller needs.

The gpu module (stable since Blender 4.0, replacing the deprecated bgl
OpenGL wrapper) provides:
  gpu.types.GPUVertFormat  — declare per-vertex attribute layout.
  gpu.types.GPUVertBuf     — fill vertex data from Python sequences.
  gpu.types.GPUBatch       — pair a vertex buffer with a draw primitive.
  gpu.shader.from_builtin  — pre-compiled GLSL programs bundled with Blender.
  gpu_extras.batch.batch_for_shader  — convenience wrapper (5.1 recommended).

bpy.types.SpaceView3D.draw_handler_add() binds a Python callable to the
viewport draw loop. The returned handle is required for cleanup — losing
it leaks the callback until Blender restarts.
"""

import bpy
import gpu
import mathutils
from gpu_extras.batch import batch_for_shader

# ============================================================
# PARAMETERS — adjust here, not scattered through the logic
# ============================================================
NORMAL_LENGTH = 0.15          # world-space metres per arrow
LINE_WIDTH    = 2.5           # pixel width; integer on most drivers
# Colour gradient: blue = normal pointing toward -Z, red = toward +Z.
# Tuple layout: (R, G, B, A) linear colour space.
COL_DOWN = (0.10, 0.35, 1.00, 1.0)
COL_UP   = (1.00, 0.20, 0.10, 1.0)

# ============================================================
# MODULE STATE
# ============================================================
# draw_handler_add returns an opaque handle.  We keep it at module level
# so unregister_overlay() can remove it without needing a class.
_handle: object | None = None
# Cache the compiled shader between frames — compiling shaders on every
# draw call wastes ~10 ms per frame on first call.
_shader: gpu.types.GPUShader | None = None


# ============================================================
# VERTEX BUFFER CONSTRUCTION
# ============================================================
def _build_batch(obj: bpy.types.Object) -> gpu.types.GPUBatch:
    """
    Evaluate obj through the modifier stack, walk its faces, and build a
    LINES batch where each face contributes a root (face centre) and a tip
    (centre + world_normal * NORMAL_LENGTH).

    WHY inverse-transpose for normals?
    The correct transform for direction vectors under a matrix M is the
    inverse-transpose of M's 3×3 sub-matrix.  For uniform-scale objects
    M.to_3x3() alone is fine; for non-uniform scale (squashed meshes,
    stretch bones) it is wrong — the normal would shear toward the
    stretched axis.  We always use inv_T to be safe.
    """
    global _shader

    dg       = bpy.context.evaluated_depsgraph_get()
    eval_obj = obj.evaluated_get(dg)
    mesh     = eval_obj.to_mesh()          # temporary Mesh, must be cleared

    mat   = obj.matrix_world               # object → world
    inv_t = mat.inverted().transposed().to_3x3()

    roots  : list[tuple[float, ...]] = []
    tips   : list[tuple[float, ...]] = []
    colors : list[tuple[float, ...]] = []

    for poly in mesh.polygons:
        w_centre = mat @ poly.center
        w_normal = (inv_t @ mathutils.Vector(poly.normal)).normalized()

        tip = w_centre + w_normal * NORMAL_LENGTH

        # t=0 → COL_DOWN (normal points to -Z), t=1 → COL_UP (+Z)
        t = (w_normal.z + 1.0) * 0.5
        r = COL_DOWN[0] + (COL_UP[0] - COL_DOWN[0]) * t
        g = COL_DOWN[1] + (COL_UP[1] - COL_DOWN[1]) * t
        b = COL_DOWN[2] + (COL_UP[2] - COL_DOWN[2]) * t
        col = (r, g, b, 1.0)

        roots.append(tuple(w_centre))
        tips.append(tuple(tip))
        colors.append(col)    # root colour
        colors.append(col)    # tip colour (same; monochrome arrows)

    eval_obj.to_mesh_clear()   # release the temporary Mesh

    if _shader is None:
        # 'SMOOTH_COLOR' interpolates colour linearly between vertices.
        # Attribute names: "pos" (vec3 position), "color" (vec4 rgba).
        _shader = gpu.shader.from_builtin("SMOOTH_COLOR")

    # Interleave roots and tips: [root0, tip0, root1, tip1, ...]
    # batch_for_shader LINES interprets pairs of consecutive vertices as
    # individual line segments — no index buffer needed.
    verts = []
    for r, t in zip(roots, tips):
        verts.append(r)
        verts.append(t)

    return batch_for_shader(_shader, "LINES", {"pos": verts, "color": colors})


# ============================================================
# DRAW CALLBACK
# ============================================================
def _draw_normals() -> None:
    """
    Registered as a POST_VIEW draw handler.  Blender calls this after
    rendering all solid/material/wireframe passes for the active viewport.

    GPU state we restore:
      depth_mask — we read depth (for occlusion) but do not write to it,
                   so partially-occluded arrows are clipped correctly while
                   the depth buffer stays intact for Blender's own overlays.
      line_width — reset to 1 px after drawing so Blender's own wireframes
                   (which call gpu.state.line_width_set internally) are
                   not affected by our wider lines.
    """
    ctx = bpy.context
    obj = ctx.active_object
    if obj is None or obj.type != "MESH":
        return

    batch = _build_batch(obj)

    # Depth test reads depth so arrows respect geometry occlusion.
    gpu.state.depth_test_set("LESS_EQUAL")
    gpu.state.depth_mask_set(False)     # read-only depth pass
    gpu.state.line_width_set(LINE_WIDTH)

    _shader.bind()
    batch.draw(_shader)

    # Restore Blender defaults
    gpu.state.line_width_set(1.0)
    gpu.state.depth_mask_set(True)
    gpu.state.depth_test_set("LESS_EQUAL")


# ============================================================
# REGISTER / UNREGISTER
# ============================================================
def register_overlay() -> None:
    """
    Bind _draw_normals to every 3D Viewport on the active screen.
    draw_handler_add is per-SpaceView3D type (not per instance), so one
    call covers all 3D Viewport panels simultaneously.

    'WINDOW' is the draw region that owns the 3D projection matrix;
    'POST_VIEW' fires after geometry, before screen-space overlays (UI).
    """
    global _handle
    if _handle is not None:
        # Guard: remove any existing handler before re-registering.
        # Without this, reloading the script adds a second handler and
        # the overlay is drawn twice, doubling GPU cost.
        bpy.types.SpaceView3D.draw_handler_remove(_handle, "WINDOW")

    _handle = bpy.types.SpaceView3D.draw_handler_add(
        _draw_normals, (), "WINDOW", "POST_VIEW"
    )

    # Trigger an immediate redraw so the overlay appears without
    # requiring the user to mouse over the viewport.
    for area in bpy.context.screen.areas:
        if area.type == "VIEW_3D":
            area.tag_redraw()

    print("[gpu-overlay] Normal arrows registered — handle:", id(_handle))


def unregister_overlay() -> None:
    """
    Remove the draw handler.  Call this before script reload, add-on
    unregister, or file close to prevent a dangling callback that would
    crash Blender with 'EXCEPTION_ACCESS_VIOLATION' on the next draw.
    """
    global _handle, _shader
    if _handle is not None:
        bpy.types.SpaceView3D.draw_handler_remove(_handle, "WINDOW")
        _handle = None
        _shader = None
        for area in bpy.context.screen.areas:
            if area.type == "VIEW_3D":
                area.tag_redraw()
        print("[gpu-overlay] Normal arrows unregistered.")
    else:
        print("[gpu-overlay] Nothing registered — no-op.")


# ============================================================
# ENTRY POINT — paste into Scripting workspace Text Editor, Run Script
# ============================================================
register_overlay()
