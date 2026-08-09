"""
holoflow_macros/klein_bottle_poi.py
Reusable helpers for Klein-bottle surface generation.
Blender 5.1 | Python 3.11+ | no bpy dependency (pure numpy)

Provides:
  figure8_klein(u, v, R, r)   → (x, y, z) numpy arrays
  saddled_klein(u, v, R, r)   → (x, y, z)
  pinched_klein(u, v, R, r)   → (x, y, z)
  build_grid_verts(fn, U, V)  → (N, 3) float64 array
  build_quads(U, V)            → list of (a, b, c, d) tuples
  detect_seam_verts(verts, U, V, threshold) → bool mask

Import in blueprint scripts:
  import sys, importlib
  sys.path.insert(0, "//tools/blender-addon/")
  from holoflow_macros.klein_bottle_poi import figure8_klein, build_grid_verts, build_quads
"""

import numpy as np

TAU = 2.0 * np.pi


def figure8_klein(u_arr, v_arr, R: float = 1.0, r: float = 0.36):
    """
    Figure-8 immersion of the Klein bottle in ℝ³.

    WHY sin(2v): the double-frequency lateral term creates a figure-8
    cross-section in the transverse plane.  Without it the surface is
    a torus; with it, combined with the u/2 half-angle frame, the tube
    closes with a π-rotation rather than a 2π-rotation — the Klein bottle
    identification (u, v) ↦ (u+2π, v+π).

    Args:
        u_arr:  float array, values in [0, 2π]
        v_arr:  float array, same shape as u_arr
        R:      major radius of the spine circle
        r:      tube radius

    Returns:
        (x, y, z) — three arrays, same shape as u_arr / v_arr
    """
    cos_u2 = np.cos(u_arr / 2)
    sin_u2 = np.sin(u_arr / 2)
    sin_2v = np.sin(2 * v_arr)
    cos_v  = np.cos(v_arr)

    radial = R + r * (cos_v * cos_u2 - sin_2v * sin_u2)
    x = radial * np.cos(u_arr) - r * sin_2v * np.sin(u_arr)
    y = radial * np.sin(u_arr) + r * sin_2v * np.cos(u_arr)
    z = r * (cos_v * sin_u2 + sin_2v * cos_u2)
    return x, y, z


def saddled_klein(u_arr, v_arr, R: float = 1.0, r: float = 0.36):
    """
    Saddled variant using sin(3v/2).  Three-pronged saddle cross-section;
    still a valid Klein-bottle immersion (same π₁ = ℤ ⋊ ℤ).
    """
    cos_u2 = np.cos(u_arr / 2)
    sin_u2 = np.sin(u_arr / 2)
    sin_hv = np.sin(3 * v_arr / 2)
    cos_v  = np.cos(v_arr)

    radial = R + r * (cos_v * cos_u2 - sin_hv * sin_u2)
    x = radial * np.cos(u_arr) - r * sin_hv * np.sin(u_arr)
    y = radial * np.sin(u_arr) + r * sin_hv * np.cos(u_arr)
    z = r * (cos_v * sin_u2 + sin_hv * cos_u2)
    return x, y, z


def pinched_klein(u_arr, v_arr, R: float = 1.0, r: float = 0.36):
    """
    Pinched (classical bottle) immersion.  Neck shrinks to near-zero at
    u = π then the neck passes back through the body wall.
    """
    neck = np.abs(np.sin(u_arr / 2))
    rr   = r * (0.3 + 0.7 * neck)
    cos_v = np.cos(v_arr)
    sin_v = np.sin(v_arr)
    sin_u2 = np.sin(u_arr / 2)

    radial = R + rr * cos_v
    x = radial * np.cos(u_arr)
    y = radial * np.sin(u_arr)
    z = rr * sin_v + R * sin_u2 * 0.6
    return x, y, z


def build_grid_verts(fn, U: int, V: int):
    """
    Sample fn on a (U+1)×(V+1) grid.

    Args:
        fn: callable(u_arr, v_arr) → (x, y, z)
        U:  number of longitude segments
        V:  number of latitude segments

    Returns:
        (N, 3) float64 array, N = (U+1)*(V+1)
    """
    u = np.linspace(0, TAU, U + 1)
    v = np.linspace(0, TAU, V + 1)
    uu, vv = np.meshgrid(u, v, indexing="ij")
    x, y, z = fn(uu.ravel(), vv.ravel())
    return np.column_stack([x, y, z])


def build_quads(U: int, V: int):
    """Quad face list for an (U+1)×(V+1) vertex grid (no closing seam)."""
    faces = []
    for i in range(U):
        for j in range(V):
            a = i * (V + 1) + j
            b = (i + 1) * (V + 1) + j
            c = (i + 1) * (V + 1) + (j + 1)
            d = i * (V + 1) + (j + 1)
            faces.append((a, b, c, d))
    return faces


def detect_seam_verts(verts_nm, U: int, V: int, threshold: float):
    """
    Flag vertices in the neck region (u ≈ π) that are within `threshold`
    of vertices in the non-adjacent region (u << π).

    Returns: bool mask of shape (len(verts_nm),)
    """
    neck_lo = int(U * 3 / 8)
    neck_hi = int(U * 5 / 8)
    seam = np.zeros(len(verts_nm), dtype=bool)

    for i in range(neck_lo, neck_hi + 1):
        rs = i * (V + 1)
        re = rs + V + 1
        rp = verts_nm[rs:re]

        for j in range(0, neck_lo):
            js = j * (V + 1)
            je = js + V + 1
            jp = verts_nm[js:je]

            diff = rp[:, None, :] - jp[None, :, :]
            dist = np.linalg.norm(diff, axis=-1)
            seam[rs:re][np.any(dist < threshold, axis=1)] = True
            seam[js:je][np.any(dist < threshold, axis=0)] = True

    return seam
