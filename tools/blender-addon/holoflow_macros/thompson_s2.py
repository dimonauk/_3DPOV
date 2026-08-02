"""
holoflow_macros/thompson_s2.py — Reusable Thomson problem solver for S²  (Blender 5.1)
=======================================================================================
Standalone module: import into any blueprint that needs optimal sphere point placement.

Usage:
    from holoflow_macros.thompson_s2 import fibonacci_sphere, optimise_thomson, coulomb_energy

    pts = fibonacci_sphere(32)
    pts_opt = optimise_thomson(pts, n_steps=6000)
    print(coulomb_energy(pts_opt))
"""

import numpy as np


def fibonacci_sphere(n: int) -> np.ndarray:
    """Quasi-uniform N points on S² via golden-angle longitude, equal-area latitude.
    Returns float64 array of shape (N, 3), all rows unit vectors."""
    i    = np.arange(n, dtype=np.float64)
    cosT = 1.0 - (2.0 * i + 1.0) / n
    sinT = np.sqrt(np.clip(1.0 - cosT**2, 0.0, 1.0))
    phi  = np.pi * (1.0 + np.sqrt(5.0)) * i
    return np.column_stack([sinT * np.cos(phi), sinT * np.sin(phi), cosT])


def random_sphere(n: int, seed: int = 0) -> np.ndarray:
    """Uniform random N points on S² via Gaussian normalisation."""
    rng = np.random.default_rng(seed)
    pts = rng.standard_normal((n, 3))
    pts /= np.linalg.norm(pts, axis=1, keepdims=True)
    return pts


def coulomb_energy(pts: np.ndarray) -> float:
    """Total Coulomb potential E = Σᵢ<ⱼ 1/|pᵢ−pⱼ|."""
    diff = pts[:, None, :] - pts[None, :, :]
    r    = np.linalg.norm(diff, axis=2)
    r[np.arange(len(pts)), np.arange(len(pts))] = np.inf
    return float(0.5 * np.nansum(1.0 / r))


def per_vertex_energy(pts: np.ndarray) -> np.ndarray:
    """Per-vertex contribution Vᵢ = Σⱼ≠ᵢ 1/|pᵢ−pⱼ|, shape (N,)."""
    diff = pts[:, None, :] - pts[None, :, :]
    r    = np.linalg.norm(diff, axis=2)
    r[np.arange(len(pts)), np.arange(len(pts))] = np.inf
    return np.sum(1.0 / r, axis=1)


def optimise_thomson(pts: np.ndarray, n_steps: int = 5000,
                     lr: float = 0.025, decay: float = 0.9994,
                     snapshot_at: int | None = None) -> tuple:
    """Riemannian projected gradient descent on S² minimising Coulomb energy.

    Parameters
    ----------
    pts         : (N, 3) float array of unit vectors — initial positions
    n_steps     : total gradient descent iterations
    lr          : initial learning rate
    decay       : per-step exponential LR decay factor
    snapshot_at : if given, also returns pts at this step index

    Returns
    -------
    (final_pts, snapshot_pts)  — snapshot_pts is None unless snapshot_at given
    """
    pts      = pts.astype(np.float64).copy()
    snapshot = None
    n        = len(pts)
    idx      = np.arange(n)
    for step in range(n_steps):
        if snapshot_at is not None and step == snapshot_at:
            snapshot = pts.copy()
        alpha   = lr * (decay ** step)
        diff    = pts[:, None, :] - pts[None, :, :]
        r       = np.linalg.norm(diff, axis=2)
        r[idx, idx] = np.inf
        inv_r3  = 1.0 / r**3
        eucl_g  = -np.sum(diff * inv_r3[:, :, None], axis=1)
        radial  = np.sum(eucl_g * pts, axis=1, keepdims=True)
        riem_g  = eucl_g - radial * pts
        pts     = pts - alpha * riem_g
        pts    /= np.linalg.norm(pts, axis=1, keepdims=True)
    return pts, snapshot
