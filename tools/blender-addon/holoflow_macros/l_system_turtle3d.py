# holoflow_macros/l_system_turtle3d.py — Reusable L-System utilities
# Holoflow Studio / CC0  |  Blender 5.1
#
# Import in any blueprint.py:
#   import importlib, sys
#   sys.path.insert(0, "/path/to/holoflow_macros")
#   import l_system_turtle3d as ls
#   branches = ls.turtle_walk(ls.expand("A", {"A": "F[+&A][-&A][^A]"}, 5))

import math
from mathutils import Vector

# ─── STRING EXPANSION ────────────────────────────────────────────────────
def expand(axiom: str, rules: dict, n: int) -> str:
    """Rewrite axiom n times with simultaneous rule substitution."""
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
def turtle_walk(
    s: str,
    angle_deg: float = 27.0,
    step_root: float = 0.50,
    taper_step: float = 0.72,
    taper_radius: float = 0.70,
) -> list:
    """
    Walk an L-system string with a 3D turtle.

    Returns list of (depth: int, points: list[Vector]) — one entry per
    branch segment (contiguous F moves between push/pop pairs).

    Symbol   Meaning
    ───────────────────────────────────────────────────────────────────
    F        draw forward — add point to current branch, advance pos
    f        step forward — advance pos without drawing
    +        yaw left   (rotate fwd, right around up by +angle)
    -        yaw right  (rotate fwd, right around up by -angle)
    &        pitch down (rotate fwd, up around right by +angle)
    ^        pitch up   (rotate fwd, up around right by -angle)
    \\       roll left  (rotate up, right around fwd by +angle)
    /        roll right (rotate up, right around fwd by -angle)
    |        U-turn     (negate fwd and right)
    [        push state (start child branch, depth += 1)
    ]        pop state  (end child branch)
    """
    A = math.radians(angle_deg)

    fwd   = Vector((0.0, 0.0, 1.0))
    up    = Vector((0.0, 1.0, 0.0))
    right = Vector((1.0, 0.0, 0.0))
    pos   = Vector((0.0, 0.0, 0.0))

    depth  = 0
    step   = step_root
    radius = 1.0

    active: list = [pos.copy()]
    stack  = []
    branches: list = []

    for sym in s:
        if sym == "F":
            new_pos = pos + fwd * step
            active.append(new_pos.copy())
            pos = new_pos
        elif sym == "f":
            pos = pos + fwd * step
        elif sym == "+":
            fwd   = _rot(fwd,   up,    +A)
            right = _rot(right, up,    +A)
        elif sym == "-":
            fwd   = _rot(fwd,   up,    -A)
            right = _rot(right, up,    -A)
        elif sym == "&":
            fwd = _rot(fwd, right, +A)
            up  = _rot(up,  right, +A)
        elif sym == "^":
            fwd = _rot(fwd, right, -A)
            up  = _rot(up,  right, -A)
        elif sym == "\\":
            up    = _rot(up,    fwd, +A)
            right = _rot(right, fwd, +A)
        elif sym == "/":
            up    = _rot(up,    fwd, -A)
            right = _rot(right, fwd, -A)
        elif sym == "|":
            fwd = -fwd
            right = -right
        elif sym == "[":
            stack.append((pos.copy(), fwd.copy(), up.copy(), right.copy(),
                          depth, step, radius, active))
            active = [pos.copy()]
            depth  += 1
            step   *= taper_step
            radius *= taper_radius
        elif sym == "]":
            if len(active) >= 2:
                branches.append((depth, active))
            (pos, fwd, up, right, depth, step, radius, active) = stack.pop()

    if len(active) >= 2:
        branches.append((depth, active))

    return branches
