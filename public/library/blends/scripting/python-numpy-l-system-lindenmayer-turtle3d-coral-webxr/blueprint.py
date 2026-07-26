# blueprint.py — Lindenmayer L-System: 3D Turtle → Branching Coral GLB
# Holoflow Studio / CC0  |  Blender 5.1 scripting workspace
#
# ALGORITHM
# An L-System rewrites a seed string (axiom) through N rounds of
# simultaneous symbol substitution (production rules) then interprets
# the result with a 3D turtle carrying a local (fwd, up, right) frame.
# '[' pushes the frame onto a stack and begins a child branch; ']' pops
# it and terminates the child.  The turtle here uses Rodrigues rotation:
#   v' = v cosθ + (axis×v) sinθ + axis(axis·v)(1−cosθ)
# so the frame drifts with accumulated rotations — no gimbal lock.
#
# BLENDER GEOMETRY
# All branches are POLY splines inside one bpy.types.Curve object.
# Per-point .radius multiplies bevel_depth → taper without extra meshes.
# After export the curve is evaluated via obj.evaluated_get(depsgraph)
# and converted to a mesh, giving a single Draco-compressed GLB.
#
# SOURCE:  Prusinkiewicz & Lindenmayer, "The Algorithmic Beauty of Plants"
#          (1990), pp. 8–9, Fig. 1.24c coral preset — public domain.
# ─────────────────────────────────────────────────────────────────────────

import math
import bpy
from mathutils import Vector

# ─── PARAMETERS ──────────────────────────────────────────────────────────
AXIOM       = "A"
RULES       = {"A": "F[+&A][-&A][^A]"}  # coral: 3-branch tri-axial spread
GENERATIONS = 5            # 3⁵=243 leaf branches; raise to 6 for denser coral

STEP_ROOT   = 0.50         # m — root trunk step length
TAPER_STEP  = 0.72         # child step = parent × TAPER_STEP
ANGLE_DEG   = 27.0         # degrees per yaw/pitch/roll symbol

BEVEL_DEPTH = 0.022        # m — trunk tube radius at depth 0
TAPER_RAD   = 0.70         # child radius multiplier per depth level

BEVEL_RES   = 3            # 3 → 8-sided tube cross-section
EMIT_COL    = (0.25, 0.85, 0.95, 1.0)   # bioluminescent teal
EMIT_STR    = 4.0          # emission strength (EEVEE viewport glow)

OUTPUT_GLB  = "//hf_l_system_coral.glb"

# ─── SYMBOL GLOSSARY ─────────────────────────────────────────────────────
# F   draw forward (emit segment, advance pos)
# f   step forward without drawing (gap)
# +   yaw left   (rotate fwd, right around up)
# -   yaw right
# &   pitch down  (rotate fwd, up around right)
# ^   pitch up
# \   roll left   (rotate up, right around fwd)
# /   roll right
# |   U-turn (reverse fwd, negate right — preserves up)
# [   push state → start child branch, depth += 1
# ]   pop state  → end child branch

# ─── STRING EXPANSION ────────────────────────────────────────────────────
def expand(axiom: str, rules: dict, n: int) -> str:
    """Rewrite axiom n times. O(|string| * n)."""
    s = axiom
    for _ in range(n):
        s = "".join(rules.get(c, c) for c in s)
    return s

# ─── RODRIGUES ROTATION ──────────────────────────────────────────────────
def _rot(v: Vector, axis: Vector, angle_rad: float) -> Vector:
    axis = axis.normalized()
    c, s = math.cos(angle_rad), math.sin(angle_rad)
    return v * c + axis.cross(v) * s + axis * (axis.dot(v) * (1.0 - c))

# ─── 3D TURTLE WALK ──────────────────────────────────────────────────────
def turtle_walk(s: str):
    """
    Returns list of (depth: int, points: [Vector]) tuples, one per branch.
    Each branch is a chain of positions between consecutive F moves.
    Branches are 2-point polylines; longer chains arise when multiple F
    symbols appear without intervening '['/']'.
    """
    A = math.radians(ANGLE_DEG)

    fwd   = Vector((0.0, 0.0, 1.0))   # Z-up: trunk grows toward +Z
    up    = Vector((0.0, 1.0, 0.0))
    right = Vector((1.0, 0.0, 0.0))
    pos   = Vector((0.0, 0.0, 0.0))

    depth  = 0
    step   = STEP_ROOT
    radius = 1.0   # multiplier for BEVEL_DEPTH

    # active branch being built; starts at origin
    active: list = [pos.copy()]
    stack  = []
    branches = []   # collected (depth, [Vector]) pairs

    for sym in s:
        if sym == "F":
            new_pos = pos + fwd * step
            active.append(new_pos.copy())
            pos = new_pos
        elif sym == "f":
            pos = pos + fwd * step
        elif sym == "+":
            fwd   = _rot(fwd,   up, +A);  right = _rot(right, up, +A)
        elif sym == "-":
            fwd   = _rot(fwd,   up, -A);  right = _rot(right, up, -A)
        elif sym == "&":
            fwd = _rot(fwd, right, +A);   up    = _rot(up,    right, +A)
        elif sym == "^":
            fwd = _rot(fwd, right, -A);   up    = _rot(up,    right, -A)
        elif sym == "\\":
            up    = _rot(up,    fwd, +A); right = _rot(right, fwd, +A)
        elif sym == "/":
            up    = _rot(up,    fwd, -A); right = _rot(right, fwd, -A)
        elif sym == "|":
            fwd = -fwd;  right = -right
        elif sym == "[":
            stack.append((pos.copy(), fwd.copy(), up.copy(), right.copy(),
                          depth, step, radius, active))
            active = [pos.copy()]   # child branch starts at current pos
            depth  += 1
            step   *= TAPER_STEP
            radius *= TAPER_RAD
        elif sym == "]":
            if len(active) >= 2:
                branches.append((depth, active))
            (pos, fwd, up, right, depth, step, radius, active) = stack.pop()

    if len(active) >= 2:
        branches.append((depth, active))

    return branches

# ─── BUILD CURVE OBJECT ──────────────────────────────────────────────────
def build_curve(branches: list) -> bpy.types.Object:
    """
    One POLY spline per branch inside a single Curve data-block.
    .radius per point scales bevel_depth → continuous taper root→tip.
    """
    cd = bpy.data.curves.new("hf_coral_curve", type="CURVE")
    cd.dimensions       = "3D"
    cd.bevel_mode       = "ROUND"
    cd.bevel_depth      = BEVEL_DEPTH
    cd.bevel_resolution = BEVEL_RES
    cd.use_fill_caps    = True
    cd.twist_mode       = "MINIMUM"   # parallel-transport frame = least twist

    max_depth = max((d for d, _ in branches), default=0) or 1

    for branch_depth, pts in branches:
        n = len(pts)
        sp = cd.splines.new(type="POLY")
        sp.points.add(n - 1)   # starts with 1 point; add n-1 more
        depth_r = TAPER_RAD ** branch_depth
        for j, pt in enumerate(pts):
            t = j / max(n - 1, 1)
            r = depth_r * max(1.0 - 0.8 * t, 0.05)   # 5% floor at tip
            sp.points[j].co     = (pt.x, pt.y, pt.z, 1.0)   # w=1 for POLY
            sp.points[j].radius = r

    obj = bpy.data.objects.new("hf_l_system_coral", cd)
    bpy.context.collection.objects.link(obj)
    return obj

# ─── MATERIAL ────────────────────────────────────────────────────────────
def build_material(obj: bpy.types.Object):
    mat = bpy.data.materials.new("hf_coral_emit")
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()
    out  = nt.nodes.new("ShaderNodeOutputMaterial")
    emit = nt.nodes.new("ShaderNodeEmission")
    emit.inputs["Color"].default_value    = EMIT_COL
    emit.inputs["Strength"].default_value = EMIT_STR
    nt.links.new(emit.outputs["Emission"], out.inputs["Surface"])
    out.location, emit.location = (300, 0), (0, 0)
    obj.data.materials.append(mat)

# ─── MESH CONVERSION + GLB EXPORT ────────────────────────────────────────
def export_glb(curve_obj: bpy.types.Object) -> bpy.types.Object:
    """
    Convert curve to evaluated mesh without UI context.
    depsgraph.evaluated_get() bakes all modifiers (incl. bevel) in-memory
    then new_from_object() materialises it as a Mesh data-block.
    Flat shading on every polygon → faceted WebXR aesthetic matching the
    studio's low-poly surface language.
    """
    dg       = bpy.context.evaluated_depsgraph_get()
    ev_obj   = curve_obj.evaluated_get(dg)
    mesh     = bpy.data.meshes.new_from_object(ev_obj)

    for poly in mesh.polygons:
        poly.use_smooth = False

    mesh_obj = bpy.data.objects.new("hf_l_system_coral_mesh", mesh)
    bpy.context.collection.objects.link(mesh_obj)
    mesh_obj.matrix_world = curve_obj.matrix_world.copy()

    if curve_obj.data.materials:
        mesh_obj.data.materials.append(curve_obj.data.materials[0])

    bpy.context.view_layer.update()
    bpy.ops.object.select_all(action="DESELECT")
    mesh_obj.select_set(True)
    bpy.context.view_layer.objects.active = mesh_obj

    # Y-up axis convention: Blender Z → export Y (studio standard for WebXR)
    bpy.ops.wm.gltf2_export(
        filepath                             = bpy.path.abspath(OUTPUT_GLB),
        export_format                        = "GLB",
        export_draco_mesh_compression_enable = True,
        export_draco_mesh_compression_level  = 6,
        export_image_format                  = "WEBP",
        use_selection                        = True,
    )

    bpy.data.objects.remove(curve_obj, do_unlink=True)
    return mesh_obj

# ─── MAIN ────────────────────────────────────────────────────────────────
def main():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete()

    l_str    = expand(AXIOM, RULES, GENERATIONS)
    branches = turtle_walk(l_str)
    curve    = build_curve(branches)
    build_material(curve)
    mesh_obj = export_glb(curve)

    print(
        f"[HF] L-System coral — gen={GENERATIONS}, "
        f"string={len(l_str)} chars, branches={len(branches)}, "
        f"exported → {OUTPUT_GLB}"
    )

main()
