"""
holoflow_macros/torus_knot_bishop_tube.py
==========================================
Reusable Blender 5.1 macro: build a closed tube mesh along a
torus knot T(p,q) centreline using Bishop's parallel-transport frame.

Usage in the Scripting workspace::

    from tools.blender_addon.holoflow_macros import torus_knot_bishop_tube as tkbt
    verts, faces, colors = tkbt.build(p=2, q=3)
    me = tkbt.make_mesh("my_knot", verts, faces, colors)

Or call the all-in-one helper::

    ob = tkbt.build_object(p=3, q=5, name="trefoil_T35")

Licence: CC0
"""

from __future__ import annotations

import bpy
import numpy as np
from mathutils import Vector

# ── Defaults (override per-call) ──────────────────────────────────────
DEFAULT_N_CURVE   = 480
DEFAULT_N_TUBE    = 10
DEFAULT_TUBE_R    = 0.048   # metres
DEFAULT_TORUS_R   = 1.0
DEFAULT_TORUS_r   = 0.42
DEFAULT_POI_DIAM  = 0.18    # metres — target bounding-box width


def knot_curve(
    p: int,
    q: int,
    n: int = DEFAULT_N_CURVE,
    R: float = DEFAULT_TORUS_R,
    r: float = DEFAULT_TORUS_r,
) -> np.ndarray:
    """
    Return (n, 3) float64 positions for T(p, q) on the torus.

    Parameters
    ----------
    p, q : int
        Winding numbers.  gcd(p, q) must be 1 for a knot (not a link).
    n    : int
        Number of sample points (endpoint=False — no duplicated seam vertex).
    R, r : float
        Major and minor radii of the host torus.
    """
    t = np.linspace(0.0, 2.0 * np.pi, n, endpoint=False)
    x = (R + r * np.cos(q * t)) * np.cos(p * t)
    y = (R + r * np.cos(q * t)) * np.sin(p * t)
    z =      r * np.sin(q * t)
    return np.column_stack([x, y, z])


def bishop_frame(pts: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    """
    Return (normals, binormals) arrays via Bishop parallel transport.

    Uses central-difference tangents and a linear end-closure correction
    to distribute the torsion mismatch so the tube closes seamlessly.

    Parameters
    ----------
    pts : (n, 3) float64
        Centreline positions (closed curve — last point connects to first).

    Returns
    -------
    normals  : (n, 3) float64
    binormals: (n, 3) float64
    """
    n    = len(pts)
    tang = np.empty_like(pts)
    tang[1:-1] = pts[2:] - pts[:-2]
    tang[0]    = pts[1]  - pts[n - 1]
    tang[-1]   = pts[0]  - pts[n - 2]
    lens = np.linalg.norm(tang, axis=1, keepdims=True)
    tang /= lens

    # Seed normal
    T0     = tang[0]
    helper = np.array([0.0, 0.0, 1.0]) if abs(T0[2]) < 0.9 else np.array([1.0, 0.0, 0.0])
    N0     = helper - np.dot(helper, T0) * T0
    N0    /= np.linalg.norm(N0)

    normals = np.empty_like(pts)
    normals[0] = N0
    for i in range(1, n):
        Tp, Tc = tang[i - 1], tang[i]
        axis   = np.cross(Tp, Tc)
        sin_a  = np.linalg.norm(axis)
        cos_a  = float(np.dot(Tp, Tc))
        if sin_a < 1e-12:
            normals[i] = normals[i - 1]
        else:
            axis  /= sin_a
            Np     = normals[i - 1]
            normals[i] = (
                Np * cos_a
                + np.cross(axis, Np) * sin_a
                + axis * np.dot(axis, Np) * (1.0 - cos_a)
            )

    # Closure correction
    Nf      = normals[-1]
    cos_m   = float(np.clip(np.dot(Nf, normals[0]), -1.0, 1.0))
    sin_m   = float(np.dot(np.cross(Nf, normals[0]), tang[0]))
    mismatch = np.arctan2(sin_m, cos_m)
    for i in range(n):
        a  = mismatch * i / n
        Bi = np.cross(tang[i], normals[i])
        normals[i] = normals[i] * np.cos(a) - Bi * np.sin(a)

    binormals = np.cross(tang, normals)
    return normals, binormals


def build(
    p: int = 2,
    q: int = 3,
    n_curve: int = DEFAULT_N_CURVE,
    n_tube: int  = DEFAULT_N_TUBE,
    tube_r: float = DEFAULT_TUBE_R,
    torus_R: float = DEFAULT_TORUS_R,
    torus_r: float = DEFAULT_TORUS_r,
) -> tuple[np.ndarray, list[tuple[int, int, int, int]], np.ndarray]:
    """
    Build tube geometry for T(p, q).

    Returns
    -------
    verts  : (n_curve * n_tube, 3) float64  world positions
    faces  : list of (a, b, c, d) quad index tuples
    colors : (n_curve * n_tube, 3) float64  sRGB in [0, 1]
    """
    pts               = knot_curve(p, q, n_curve, torus_R, torus_r)
    normals, binormals = bishop_frame(pts)

    theta  = np.linspace(0.0, 2.0 * np.pi, n_tube, endpoint=False)
    ct, st = np.cos(theta), np.sin(theta)
    verts  = np.empty((n_curve, n_tube, 3))
    for i in range(n_curve):
        verts[i] = pts[i] + tube_r * (ct[:, None] * normals[i] + st[:, None] * binormals[i])
    verts = verts.reshape(-1, 3)

    faces: list[tuple[int, int, int, int]] = []
    for i in range(n_curve):
        for j in range(n_tube):
            a = i * n_tube + j
            b = i * n_tube + (j + 1) % n_tube
            c = ((i + 1) % n_curve) * n_tube + (j + 1) % n_tube
            d = ((i + 1) % n_curve) * n_tube + j
            faces.append((a, b, c, d))

    # Arc-length colour (cool-to-warm HSV cycle)
    def _hsv(h: float) -> tuple[float, float, float]:
        i  = int(h * 6.0) % 6
        f  = h * 6.0 - int(h * 6.0)
        v, q_ = 1.0, 1.0 - f
        return [(1, f, 0), (q_, 1, 0), (0, 1, f), (0, q_, 1), (f, 0, 1), (1, 0, q_)][i]

    t_p    = np.linspace(0.0, 1.0, n_curve, endpoint=False)
    hues   = (0.60 + t_p * 0.90) % 1.0
    colors = np.empty((n_curve, n_tube, 3))
    for i in range(n_curve):
        colors[i, :] = _hsv(hues[i])
    colors = colors.reshape(-1, 3)

    return verts, faces, colors


def make_mesh(
    name: str,
    verts: np.ndarray,
    faces: list[tuple[int, int, int, int]],
    colors: np.ndarray,
) -> bpy.types.Mesh:
    """Create a Blender mesh from pre-built geometry arrays."""
    me = bpy.data.meshes.new(name)
    me.from_pydata(list(map(tuple, verts)), [], faces)
    me.update()
    attr = me.attributes.new("Col", "FLOAT_COLOR", "POINT")
    for vi, c in enumerate(colors):
        attr.data[vi].color = (float(c[0]), float(c[1]), float(c[2]), 1.0)
    return me


def build_object(
    p: int = 2,
    q: int = 3,
    name: str = "hf_torus_knot",
    poi_diameter: float = DEFAULT_POI_DIAM,
    **kwargs,
) -> bpy.types.Object:
    """
    One-call helper: build tube, link to active collection, scale to POI diameter.

    Extra kwargs are forwarded to ``build()``.
    """
    verts, faces, colors = build(p, q, **kwargs)
    span = np.ptp(verts, axis=0).max()
    if span > 0:
        verts *= poi_diameter / span
        colors_scaled = colors  # colours don't need scaling
    me = make_mesh(name, verts, faces, colors)
    ob = bpy.data.objects.new(name, me)
    bpy.context.collection.objects.link(ob)
    ob["holoflow:facet"] = False
    ob["holoflow:knot"]  = f"T({p},{q})"
    return ob
