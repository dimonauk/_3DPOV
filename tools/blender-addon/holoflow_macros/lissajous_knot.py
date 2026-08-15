"""
holoflow_macros/lissajous_knot.py
==================================
Reusable macro: build a Lissajous knot tube mesh in Blender 5.1.

Usage from another script or the add-on menu:
    from holoflow_macros.lissajous_knot import build_lissajous_poi

    obj = build_lissajous_poi(
        name       = "my_lissajous",
        nx=3, ny=4, nz=5,
        phi_x=0.0, phi_y=0.628, phi_z=0.449,
        n_curve    = 600,
        n_tube     = 12,
        tube_radius= 0.045,
        poi_diameter = 0.18,
    )

Returns the created bpy.types.Object. The caller is responsible for
material assignment and export.
"""

import numpy as np
import bpy
import bmesh
from mathutils import Vector


# ── Public API ─────────────────────────────────────────────────────────────────

def lissajous_curve(nx, ny, nz, phi_x, phi_y, phi_z, n_pts):
    """
    Sample c(t) = (cos(nx·t+φx), cos(ny·t+φy), cos(nz·t+φz))
    at n_pts equally spaced t ∈ [0, 2π), endpoint excluded.
    Returns float64 array of shape (n_pts, 3).

    Coprimality requirement: gcd(nx,ny)=gcd(ny,nz)=gcd(nx,nz)=1
    ensures single-component knot. Violating this gives a link.
    """
    t = np.linspace(0.0, 2.0 * np.pi, n_pts, endpoint=False)
    return np.column_stack([
        np.cos(nx * t + phi_x),
        np.cos(ny * t + phi_y),
        np.cos(nz * t + phi_z),
    ])


def bishop_parallel_transport(pts):
    """
    Bishop 1975 parallel-transport frame for a closed curve.
    Returns (tangents, normals, binormals) each of shape (N, 3).

    The closure correction distributes the angular mismatch linearly,
    producing a twist-free tube when the knot has zero total torsion.
    For all Lissajous knots the total geometric torsion is non-zero but
    bounded, so the residual twist is spread invisibly at this tube gauge.
    """
    N = len(pts)
    diff = np.roll(pts, -1, axis=0) - pts
    norms = np.linalg.norm(diff, axis=1, keepdims=True)
    norms = np.where(norms < 1e-12, 1.0, norms)
    T = diff / norms

    # Seed normal perpendicular to T[0]
    seed = np.array([0.0, 1.0, 0.0])
    if abs(np.dot(seed, T[0])) > 0.95:
        seed = np.array([1.0, 0.0, 0.0])
    N0 = seed - np.dot(seed, T[0]) * T[0]
    N0 /= np.linalg.norm(N0)

    Ns = np.empty((N, 3))
    Ns[0] = N0
    for i in range(1, N):
        axis = np.cross(T[i - 1], T[i])
        sin_a = np.linalg.norm(axis)
        if sin_a < 1e-12:
            Ns[i] = Ns[i - 1]
        else:
            cos_a = np.dot(T[i - 1], T[i])
            axis /= sin_a
            n = Ns[i - 1]
            Ns[i] = n * cos_a + np.cross(axis, n) * sin_a + axis * np.dot(axis, n) * (1 - cos_a)
        Ns[i] -= np.dot(Ns[i], T[i]) * T[i]
        nm = np.linalg.norm(Ns[i])
        if nm > 1e-12:
            Ns[i] /= nm

    # Closure correction
    cos_m = np.dot(Ns[-1], N0)
    sin_m = np.dot(np.cross(Ns[-1], N0), T[0])
    psi = np.arctan2(sin_m, cos_m)
    for i in range(N):
        a = psi * i / N
        n = Ns[i]; t_i = T[i]
        Ns[i] = (n * np.cos(a) + np.cross(t_i, n) * np.sin(a)
                 + t_i * np.dot(t_i, n) * (1 - np.cos(a)))
        Ns[i] -= np.dot(Ns[i], T[i]) * T[i]
        nm = np.linalg.norm(Ns[i])
        if nm > 1e-12:
            Ns[i] /= nm

    Bs = np.cross(T, Ns)
    return T, Ns, Bs


def build_tube(pts, normals, binormals, tube_radius, n_tube):
    """Build vertex and face arrays for a tube around a space curve."""
    N = len(pts)
    theta = np.linspace(0.0, 2.0 * np.pi, n_tube, endpoint=False)
    rings = (pts[:, None, :]
             + tube_radius * np.cos(theta)[None, :, None] * normals[:, None, :]
             + tube_radius * np.sin(theta)[None, :, None] * binormals[:, None, :])
    verts = rings.reshape(-1, 3)

    def vi(ci, ti):
        return (ci % N) * n_tube + (ti % n_tube)

    faces = [(vi(ci, ti), vi(ci, ti+1), vi(ci+1, ti+1), vi(ci+1, ti))
             for ci in range(N) for ti in range(n_tube)]
    return verts, faces


def build_lissajous_poi(
        name        = "hf_lissajous",
        nx=3, ny=4, nz=5,
        phi_x=0.0, phi_y=0.628, phi_z=0.449,
        n_curve     = 600,
        n_tube      = 12,
        tube_radius = 0.045,
        poi_diameter = 0.18,
):
    """
    Build a Lissajous knot poi-head mesh object in the active collection.

    Parameters
    ----------
    name         : Blender object / mesh name
    nx, ny, nz   : Integer oscillator frequencies (must be mutually coprime)
    phi_x,y,z    : Phase offsets in radians
    n_curve      : Arc-length sample count
    n_tube       : Cross-section ring vertex count
    tube_radius  : Tube cross-section radius before scaling
    poi_diameter : Target bounding-sphere diameter (metres)

    Returns
    -------
    bpy.types.Object
    """
    pts = lissajous_curve(nx, ny, nz, phi_x, phi_y, phi_z, n_curve)
    T, Ns, Bs = bishop_parallel_transport(pts)
    verts, faces = build_tube(pts, Ns, Bs, tube_radius, n_tube)

    # Scale to poi_diameter bounding sphere
    centre = (verts.max(0) + verts.min(0)) * 0.5
    verts -= centre
    max_r = np.linalg.norm(verts, axis=1).max()
    if max_r > 1e-12:
        verts *= (poi_diameter * 0.5) / max_r

    mesh = bpy.data.meshes.new(name)
    obj  = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)

    bm = bmesh.new()
    bvs = [bm.verts.new(Vector(v)) for v in verts]
    bm.verts.ensure_lookup_table()
    for f in faces:
        try:
            bm.faces.new([bvs[i] for i in f])
        except ValueError:
            pass
    bm.to_mesh(mesh)
    bm.free()

    # Default hue arc-length gradient
    col = mesh.color_attributes.new("Col", "FLOAT_COLOR", "POINT")
    N_V = n_curve * n_tube
    ci_arr = np.arange(N_V) // n_tube
    hues = (0.62 + ci_arr / n_curve) % 1.0
    for idx, h in enumerate(hues):
        c = 0.836; x_ = c * (1 - abs((h * 6) % 2 - 1)); m = 0.95 - c
        hi = int(h * 6) % 6
        rgb = [(c,x_,0),(x_,c,0),(0,c,x_),(0,x_,c),(x_,0,c),(c,0,x_)][hi]
        col.data[idx].color = (rgb[0]+m, rgb[1]+m, rgb[2]+m, 1.0)

    mesh.update()

    obj["holoflow:facet"]    = True
    obj["holoflow:category"] = "poi-head"
    return obj
