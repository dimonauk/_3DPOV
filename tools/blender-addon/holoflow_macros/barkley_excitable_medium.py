"""
holoflow_macros/barkley_excitable_medium.py
============================================
Reusable Barkley excitable medium simulation macro.

Public API
----------
  simulate_barkley(n=128, dt=0.05, steps=1200, a=0.75, b=0.06, eps=0.02, d=1.0,
                   snap_steps=(800, 895, 990), seed=42)
      → dict[int, np.ndarray]   (step → u_field 2D array in [0,1])

  apply_to_sphere(obj, u_field, poi_radius=0.075, disp_scale=0.022,
                  n_phi=64, n_theta=128)
      → None   (displaces vertex positions in-place on obj)

Usage example
-------------
  from holoflow_macros.barkley_excitable_medium import simulate_barkley, apply_to_sphere

  snaps = simulate_barkley()
  # build a UV sphere with n_phi=64, n_theta=128 first, then:
  apply_to_sphere(bpy.context.object, snaps[800])
"""

import numpy as np


# ── Simulation ────────────────────────────────────────────────────────────────

def _laplacian_periodic(f, dx=1.0):
    return (np.roll(f, -1, 0) + np.roll(f, 1, 0) +
            np.roll(f, -1, 1) + np.roll(f, 1, 1) - 4.0 * f) / (dx * dx)


def _du(u, v, a, b, eps, d, dx):
    thresh = (v + b) / a
    kinetics = u * (1.0 - u) * (u - thresh) / eps
    return kinetics + d * _laplacian_periodic(u, dx)


def _dv(u, v):
    return u - v


def _rk2(u, v, dt, a, b, eps, d, dx):
    k1u = _du(u, v, a, b, eps, d, dx)
    k1v = _dv(u, v)
    u2  = np.clip(u + 0.5 * dt * k1u, 0.0, 1.0)
    v2  = np.clip(v + 0.5 * dt * k1v, 0.0, 1.0)
    un  = np.clip(u + dt * _du(u2, v2, a, b, eps, d, dx), 0.0, 1.0)
    vn  = np.clip(v + dt * _dv(u2, v2), 0.0, 1.0)
    return un, vn


def simulate_barkley(n=128, dt=0.05, steps=1200,
                     a=0.75, b=0.06, eps=0.02, d=1.0,
                     snap_steps=(800, 895, 990), seed=42):
    """
    Integrate the Barkley model on an n×n periodic grid.

    Returns
    -------
    dict[int, np.ndarray]
        Keys are values in snap_steps; values are copies of the u-field.
    """
    rng  = np.random.default_rng(seed)
    u    = np.zeros((n, n), dtype=np.float32)
    v    = np.zeros((n, n), dtype=np.float32)
    half = n // 2
    u[:half, :]  = 1.0
    v[:, :half]  = np.linspace(0, 0.5, half, dtype=np.float32)
    u           += (0.01 * rng.standard_normal((n, n))).astype(np.float32)
    u            = np.clip(u, 0.0, 1.0)

    snap_set = set(snap_steps)
    snaps    = {}
    for step in range(steps + 1):
        if step in snap_set:
            snaps[step] = u.copy()
        u, v = _rk2(u, v, dt, a, b, eps, d, 1.0)
    return snaps


# ── Sphere displacement ───────────────────────────────────────────────────────

def apply_to_sphere(obj, u_field, poi_radius=0.075, disp_scale=0.022,
                    n_phi=64, n_theta=128):
    """
    Displace vertex positions on `obj` (a UV sphere with n_phi+1 latitude rows
    and n_theta longitude columns) using bilinear-sampled u_field values.

    Modifies obj.data.vertices in-place.
    """
    import math
    n = u_field.shape[0]
    mesh = obj.data

    phi_arr    = [math.pi * i / n_phi   for i in range(n_phi + 1)]
    theta_arr  = [2 * math.pi * j / n_theta for j in range(n_theta)]

    def sample(phi, theta):
        gx = (theta / (2 * math.pi)) * (n - 1)
        gy = (phi   / math.pi)       * (n - 1)
        ix, iy = int(gx), int(gy)
        fx, fy = gx - ix, gy - iy
        ix1 = min(ix + 1, n - 1)
        iy1 = min(iy + 1, n - 1)
        return float(u_field[iy, ix]  * (1-fx) * (1-fy) +
                     u_field[iy, ix1] *    fx  * (1-fy) +
                     u_field[iy1, ix] * (1-fx) *    fy  +
                     u_field[iy1, ix1]*    fx  *    fy)

    vi = 0
    for i, phi in enumerate(phi_arr):
        for j, theta in enumerate(theta_arr):
            u_val = sample(phi, theta)
            r = poi_radius + u_val * disp_scale
            mesh.vertices[vi].co = (
                r * math.sin(phi) * math.cos(theta),
                r * math.sin(phi) * math.sin(theta),
                r * math.cos(phi),
            )
            vi += 1
    mesh.update()
