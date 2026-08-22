"""
holoflow_macros/torus_knot_tube.py — Reusable torus-knot tube mesh builder
Blender 5.1 — Holoflow Studio — CC0

Usage:
    from holoflow_macros.torus_knot_tube import build_torus_knot_tube
    verts, faces = build_torus_knot_tube(p=2, q=3)
    me = bpy.data.meshes.new('my_knot')
    me.from_pydata(verts, [], faces)
    me.update()
"""

import math
from mathutils import Vector


def _gcd(a: int, b: int) -> int:
    while b:
        a, b = b, a % b
    return a


def build_torus_knot_tube(
    p: int        = 2,
    q: int        = 3,
    torus_r: float = 1.00,
    torus_minor: float = 0.38,
    tube_radius: float = 0.045,
    n_long: int   = 240,
    n_circ: int   = 14,
):
    """
    Return (verts, faces) for a T(p,q) torus-knot tube mesh.

    Frames are parallel-transported (Bishop frame) with a linear holonomy
    correction so the tube closes seamlessly.  GCD(p,q) must equal 1.

    Parameters
    ----------
    p          : longitudinal wraps around the hole
    q          : meridional wraps around the tube
    torus_r    : major torus radius
    torus_minor: minor torus radius
    tube_radius: cross-section radius of the knot strand
    n_long     : rings along the knot (quality control)
    n_circ     : vertices per ring
    """
    if _gcd(p, q) != 1:
        raise ValueError(
            f"T({p},{q}): GCD = {_gcd(p,q)}.  "
            "Use coprime (p,q) for a single-component knot."
        )

    def _pos(t: float) -> Vector:
        r = torus_r + torus_minor * math.cos(q * t)
        return Vector((r * math.cos(p * t), r * math.sin(p * t), torus_minor * math.sin(q * t)))

    def _tan(t: float) -> Vector:
        h = 4e-5
        return (_pos(t + h) - _pos(t - h)).normalized()

    step      = math.tau / n_long
    positions = [_pos(i * step) for i in range(n_long)]
    tangents  = [_tan(i * step) for i in range(n_long)]

    seed = Vector((0.0, 0.0, 1.0))
    if abs(seed.dot(tangents[0])) > 0.9:
        seed = Vector((0.0, 1.0, 0.0))
    if abs(seed.dot(tangents[0])) > 0.9:
        seed = Vector((1.0, 0.0, 0.0))

    normals    = [None] * n_long
    normals[0] = (seed - seed.dot(tangents[0]) * tangents[0]).normalized()
    for i in range(1, n_long):
        t_i        = tangents[i]
        proj       = normals[i - 1] - normals[i - 1].dot(t_i) * t_i
        normals[i] = proj.normalized()

    # Closure holonomy correction
    n_l, n_0 = normals[-1], normals[0]
    cos_h    = max(-1.0, min(1.0, n_l.dot(n_0)))
    sin_h    = n_l.cross(n_0).dot(tangents[0])
    theta_h  = math.atan2(sin_h, cos_h)

    verts, faces = [], []
    for i, (pos, T, N_raw) in enumerate(zip(positions, tangents, normals)):
        frac  = i / n_long
        delta = frac * theta_h
        cos_d = math.cos(delta);  sin_d = math.sin(delta)
        B_raw = T.cross(N_raw).normalized()
        N = cos_d * N_raw + sin_d * B_raw
        B = -sin_d * N_raw + cos_d * B_raw
        for j in range(n_circ):
            ang = math.tau * j / n_circ
            verts.append(pos + (math.cos(ang) * N + math.sin(ang) * B) * tube_radius)

    for i in range(n_long):
        ni = (i + 1) % n_long
        for j in range(n_circ):
            nj = (j + 1) % n_circ
            faces.append((i  * n_circ + j,
                          i  * n_circ + nj,
                          ni * n_circ + nj,
                          ni * n_circ + j))

    return verts, faces
