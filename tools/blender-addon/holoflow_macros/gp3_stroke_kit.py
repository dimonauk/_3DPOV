"""
holoflow_macros/gp3_stroke_kit.py

Reusable helpers for Grease Pencil 3 stroke authoring (Blender 5.1).
Provides:
  - ensure_gp3_object()    create or retrieve a named GP3 object
  - gp3_material()         build a filled/stroked GP material
  - add_closed_stroke()    append a closed polyline stroke to a GP3 frame
  - add_open_stroke()      append an open polyline stroke
  - add_taper_modifiers()  install Smooth + Thickness + optional Trim modifier

All functions operate on the direct data API — no bpy.ops context dependencies.
Safe to call from headless --background sessions and from the Scripting workspace.
"""

import bpy
import math
from typing import Sequence

# ── GP3 object ────────────────────────────────────────────────────────────────

def ensure_gp3_object(name: str) -> bpy.types.Object:
    """Return an existing GP3 object by name, or create one."""
    existing = bpy.data.objects.get(name)
    if existing and existing.type == "GREASE_PENCIL_V3":
        return existing
    if existing:
        bpy.data.objects.remove(existing, do_unlink=True)

    bpy.ops.object.grease_pencil_add(type="EMPTY")
    obj = bpy.context.active_object
    obj.name = name
    return obj

# ── GP3 material ──────────────────────────────────────────────────────────────

def gp3_material(
    name: str,
    stroke_rgba: tuple = (0.0, 0.0, 0.0, 1.0),
    fill_rgba: tuple | None = None,
) -> bpy.types.Material:
    """
    Return a GP3 material (create if it doesn't exist).
    If fill_rgba is None the material is stroke-only (show_fill=False).
    """
    mat = bpy.data.materials.get(name)
    if mat is None:
        mat = bpy.data.materials.new(name)
    if not mat.grease_pencil:
        bpy.data.materials.create_gpencil_data(mat)
    gp = mat.grease_pencil
    gp.show_stroke = True
    gp.color       = stroke_rgba
    if fill_rgba is not None:
        gp.show_fill  = True
        gp.fill_color = fill_rgba
    else:
        gp.show_fill = False
    return mat

# ── stroke helpers ────────────────────────────────────────────────────────────

def _write_points(
    stroke,
    pts: Sequence[tuple[float, float, float]],
    radius: float,
    opacity: float,
) -> None:
    stroke.resize(len(pts))
    for i, (x, y, z) in enumerate(pts):
        stroke.points[i].position = (x, y, z)
        stroke.points[i].radius   = radius
        stroke.points[i].opacity  = opacity

def add_closed_stroke(
    frame: bpy.types.GreasePencilFrame,
    pts_2d: Sequence[tuple[float, float]],
    mat_index: int = 0,
    radius: float = 1.0,
    opacity: float = 1.0,
    z: float = 0.0,
) -> None:
    """
    Append a closed polyline stroke to a GP3 frame.
    pts_2d: list of (x, y); the first point is repeated as the last to close.
    """
    pts_3d = [(x, y, z) for x, y in pts_2d]
    # close the loop
    if pts_3d[0] != pts_3d[-1]:
        pts_3d.append(pts_3d[0])

    frame.drawing.add_strokes(1)
    s = frame.drawing.strokes[-1]
    s.material_index = mat_index
    _write_points(s, pts_3d, radius, opacity)

def add_open_stroke(
    frame: bpy.types.GreasePencilFrame,
    pts_2d: Sequence[tuple[float, float]],
    mat_index: int = 0,
    radius: float = 1.0,
    opacity: float = 1.0,
    z: float = 0.0,
) -> None:
    """Append an open polyline stroke — no loop closure."""
    pts_3d = [(x, y, z) for x, y in pts_2d]
    frame.drawing.add_strokes(1)
    s = frame.drawing.strokes[-1]
    s.material_index = mat_index
    _write_points(s, pts_3d, radius, opacity)

# ── modifier stack ────────────────────────────────────────────────────────────

def add_taper_modifiers(
    obj: bpy.types.Object,
    thickness_px: float = 4.0,
    smooth_iterations: int = 3,
    add_trim: bool = False,
) -> dict[str, bpy.types.Modifier]:
    """
    Install GREASE_PENCIL_SMOOTH + GREASE_PENCIL_THICKNESS (bell taper curve).
    If add_trim=True, also install GREASE_PENCIL_TRIM at the top of the stack.
    Returns {modifier_name: modifier} dict for caller to further configure.
    """
    mods = {}

    sm = obj.modifiers.new("GP_Smooth", "GREASE_PENCIL_SMOOTH")
    sm.iterations          = smooth_iterations
    sm.smooth_factor       = 0.5
    sm.use_smooth_position = True
    sm.use_smooth_radius   = False
    sm.use_smooth_opacity  = False
    mods["smooth"] = sm

    tk = obj.modifiers.new("GP_Thickness", "GREASE_PENCIL_THICKNESS")
    tk.thickness         = thickness_px
    tk.use_custom_curve  = True
    crv = tk.custom_curve
    crv.curves[0].points.new(0.0, 0.0)
    crv.curves[0].points.new(0.5, 1.0)
    crv.curves[0].points.new(1.0, 0.0)
    crv.update()
    mods["thickness"] = tk

    if add_trim:
        tr = obj.modifiers.new("GP_Trim", "GREASE_PENCIL_TRIM")
        tr.start_factor = 0.0
        tr.end_factor   = 0.0
        bpy.ops.object.modifier_move_to_index(modifier=tr.name, index=0)
        mods["trim"] = tr

    return mods

# ── convenience: regular polygon ─────────────────────────────────────────────

def regular_polygon_pts(n: int, radius: float, phase_deg: float = 0.0) -> list[tuple]:
    phase = math.radians(phase_deg)
    return [
        (radius * math.cos(2 * math.pi * k / n + phase),
         radius * math.sin(2 * math.pi * k / n + phase))
        for k in range(n)
    ]
