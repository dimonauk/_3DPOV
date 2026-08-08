"""
holoflow_macros/delaunay_cmc_revolution.py
==========================================
Reusable macro: integrate the Delaunay CMC meridian ODE by RK4 and build
a surface of revolution in a given BMesh.

Public API
----------
    integrate_cmc_meridian(r0, theta0_deg, H, n_steps, ds) -> np.ndarray (N,2)
    build_revolution(bm, meridian, n_az, max_half_height) -> list[list[BMVert]]

Usage example (in a blueprint.py):
    from holoflow_macros.delaunay_cmc_revolution import (
        integrate_cmc_meridian, build_revolution
    )
    pts = integrate_cmc_meridian(r0=0.70, theta0_deg=60.0, H=0.5)
    bm  = bmesh.new()
    build_revolution(bm, pts, n_az=80, max_half_height=1.5)
"""

import math
import numpy as np


def integrate_cmc_meridian(
    r0: float,
    theta0_deg: float,
    H: float = 0.50,
    n_steps: int = 2000,
    ds: float = 0.002,
) -> np.ndarray:
    """
    Integrate the CMC surface-of-revolution meridian ODE by 4th-order
    Runge-Kutta and return shape (N, 2) array of (r, z) coordinates.

    ODE:
        dr/ds = cos θ
        dz/ds = sin θ
        dθ/ds = 2H − sin θ / r

    Parameters
    ----------
    r0        : initial meridian radius (m, unscaled)
    theta0_deg: initial tangent angle in degrees (90 = tangent to axis)
    H         : target mean curvature (1/(2·sphere_radius) for a sphere)
    n_steps   : maximum RK4 steps
    ds        : arc-length step size (smaller = more accurate, slower)

    Returns
    -------
    pts : ndarray shape (N, 2), columns [r, z]
    """
    th = math.radians(theta0_deg)
    r, z = r0, 0.0
    pts = [(r, z)]

    def _d(r_, th_):
        return (
            math.cos(th_),
            math.sin(th_),
            2.0 * H - math.sin(th_) / max(r_, 1e-8),
        )

    for _ in range(n_steps):
        if r < 0.01:  # nodoid self-intersection guard
            break
        dr1, dz1, dt1 = _d(r, th)
        dr2, dz2, dt2 = _d(r + 0.5 * ds * dr1, th + 0.5 * ds * dt1)
        dr3, dz3, dt3 = _d(r + 0.5 * ds * dr2, th + 0.5 * ds * dt2)
        dr4, dz4, dt4 = _d(r + ds * dr3,        th + ds * dt3)
        r  += ds * (dr1 + 2 * dr2 + 2 * dr3 + dr4) / 6.0
        z  += ds * (dz1 + 2 * dz2 + 2 * dz3 + dz4) / 6.0
        th += ds * (dt1 + 2 * dt2 + 2 * dt3 + dt4) / 6.0
        pts.append((r, z))

    return np.array(pts)


def build_revolution(
    bm,
    meridian: np.ndarray,
    n_az: int = 80,
    max_half_height: float = 1.5,
) -> list:
    """
    Revolve the (r, z) meridian around the z-axis into a bmesh surface.

    Parameters
    ----------
    bm               : bmesh.types.BMesh to add geometry into
    meridian         : shape (N, 2) array from integrate_cmc_meridian
    n_az             : number of azimuthal divisions
    max_half_height  : clip meridian rows to |z| ≤ max_half_height

    Returns
    -------
    verts : list of lists, shape [n_rows][n_az], BMVert objects
    """
    mask = np.abs(meridian[:, 1]) <= max_half_height
    pts  = meridian[mask]

    az_angles = np.linspace(0.0, 2.0 * math.pi, n_az, endpoint=False)
    cos_a = np.cos(az_angles)
    sin_a = np.sin(az_angles)

    verts = []
    for ri, (r_i, z_i) in enumerate(pts):
        row = [
            bm.verts.new((r_i * cos_a[j], r_i * sin_a[j], z_i))
            for j in range(n_az)
        ]
        verts.append(row)
        if ri > 0:
            prev = verts[-2]
            for j in range(n_az):
                jn = (j + 1) % n_az
                try:
                    bm.faces.new((prev[j], prev[jn], row[jn], row[j]))
                except ValueError:
                    pass

    return verts
