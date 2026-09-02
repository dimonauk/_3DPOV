"""
holoflow_macros/genesio_tesi.py — Genesio–Tesi Attractor Macro
================================================================
Reusable helper: integrate the Genesio–Tesi jerk system and return waypoints.
Suitable for procedural animation, geometry node input, or repeated builds.

Usage (inside Blender scripting workspace):
    import sys
    sys.path.append("<repo>/tools/blender-addon/")
    from holoflow_macros.genesio_tesi import integrate_genesio_tesi, build_gt_tube
    pts, speeds = integrate_genesio_tesi()
    build_gt_tube(pts, speeds)
"""

import numpy as np


def integrate_genesio_tesi(
    c1: float = 1.0,
    c2: float = 1.3,
    c3: float = 0.44,
    dt: float = 0.01,
    burn_in: int = 3000,
    n_steps: int = 90000,
    thin: int = 30,
    ic: tuple = (0.1, 0.0, 0.0),
):
    """
    RK4 integration of the Genesio–Tesi jerk attractor.

    Equations:
        ẋ = y
        ẏ = z
        ż = −c₁x − c₂y − c₃z + x²

    Returns:
        pts    : np.ndarray  shape (n_steps // thin, 3)
        speeds : np.ndarray  shape (n_steps // thin,)  — |F(state)|

    Notes:
        - burn_in steps are discarded to remove transient near P₀=(0,0,0)
        - Canonical parameters (c₁=1, c₂=1.3, c₃=0.44) give λ₁≈+0.073
        - Divergence ∇·F = −c₃ (constant)
        - Equilibria: P₀=(0,0,0) and P₁=(c₁,0,0), both unstable
    """
    def _F(s):
        x, y, z = s
        return np.array([y, z, -c1*x - c2*y - c3*z + x*x])

    def _rk4_step(s, h):
        k1 = _F(s)
        k2 = _F(s + 0.5*h*k1)
        k3 = _F(s + 0.5*h*k2)
        k4 = _F(s + h*k3)
        return s + (h / 6) * (k1 + 2*k2 + 2*k3 + k4)

    state = np.array(ic, dtype=float)

    # burn-in: remove transient (P₀ is unstable — trajectory leaves it quickly
    # but the initial spiral must be discarded for clean attractor geometry)
    for _ in range(burn_in):
        state = _rk4_step(state, dt)

    pts, speeds = [], []
    for i in range(n_steps):
        state = _rk4_step(state, dt)
        if i % thin == 0:
            pts.append(state.copy())
            speeds.append(float(np.linalg.norm(_F(state))))

    return np.array(pts), np.array(speeds)


def build_gt_tube(pts, speeds, slug="hf_genesio_tesi_poi", tube_r=0.08, segs=10):
    """
    Build a Bishop parallel-transport tube in Blender's active scene.
    Requires bpy to be importable (run inside Blender scripting workspace).

    The GT_Speed FLOAT_COLOR attribute is written onto each vertex for
    cobalt(slow) → amber(fast) visualisation.
    """
    import bpy
    import bmesh
    from mathutils import Vector

    # Remove existing object with same name
    for ob in list(bpy.data.objects):
        if ob.name == slug:
            bpy.data.objects.remove(ob, do_unlink=True)

    n = len(pts)
    tangents = np.diff(pts, axis=0)
    tangents /= np.linalg.norm(tangents, axis=1, keepdims=True) + 1e-12

    # Bishop seed
    t0 = tangents[0]
    ref = np.array([0, 0, 1]) if abs(t0[2]) < 0.9 else np.array([1, 0, 0])
    normals = np.empty((n - 1, 3))
    normals[0] = np.cross(t0, ref)
    normals[0] /= np.linalg.norm(normals[0]) + 1e-12
    for i in range(1, n - 1):
        axis = np.cross(tangents[i-1], tangents[i])
        sa = np.linalg.norm(axis)
        if sa < 1e-10:
            normals[i] = normals[i-1]
        else:
            ca = np.dot(tangents[i-1], tangents[i])
            axis /= sa
            np = normals[i-1]
            normals[i] = ca*np + sa*np.cross(axis, np) + (1-ca)*np.dot(axis, np)*axis
            normals[i] /= np.linalg.norm(normals[i]) + 1e-12
    binormals = np.cross(tangents, normals)

    angles = np.linspace(0, 2*np.pi, segs, endpoint=False)
    ca_arr, sa_arr = np.cos(angles), np.sin(angles)
    spd_lo, spd_hi = speeds.min(), speeds.max() + 1e-9

    bm = bmesh.new()
    col_lay = bm.verts.layers.float_color.new("GT_Speed")
    rings = []
    for i in range(n - 1):
        t = (speeds[i] - spd_lo) / (spd_hi - spd_lo)
        r, g, b = 0.15 + 0.85*t, 0.45 + 0.20*t, 0.95 - 0.95*t
        ring = []
        for ca, sa in zip(ca_arr, sa_arr):
            off = tube_r * (ca*normals[i] + sa*binormals[i])
            pos = pts[i] + off
            v = bm.verts.new(Vector(tuple(pos)))
            v[col_lay] = (r, g, b, 1.0)
            ring.append(v)
        rings.append(ring)

    bm.verts.ensure_lookup_table()
    for i in range(len(rings) - 1):
        r0, r1 = rings[i], rings[i+1]
        for j in range(segs):
            j1 = (j + 1) % segs
            bm.faces.new([r0[j], r0[j1], r1[j1], r1[j]])

    me = bpy.data.meshes.new(slug)
    bm.to_mesh(me)
    bm.free()
    ob = bpy.data.objects.new(slug, me)
    bpy.context.collection.objects.link(ob)
    ob["holoflow:facet"] = True
    bpy.context.view_layer.objects.active = ob
    return ob
