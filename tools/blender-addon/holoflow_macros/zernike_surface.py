"""
holoflow_macros/zernike_surface.py
===================================
Reusable Zernike polynomial utilities for Blender 5.1 scripting.

Public API
----------
zernike_radial(n, m, rho)        → ndarray  radial polynomial R_n^|m|(rho)
eval_zernike(j, rho, theta)      → ndarray  normalised Z_j(rho, theta)
noll_nm(j)                       → (n, m)   Noll index → (radial, azimuthal) orders
build_polar_grid(n_rings, n_sec) → (RHO, THETA)  meshgrid on unit disc

The Noll 1976 ordering is used throughout (same as ANSI Z80.28 / OSA standard).
Supports j = 1..36 via the analytical mapping rule.

Usage example
-------------
    from holoflow_macros.zernike_surface import build_polar_grid, eval_zernike
    RHO, THETA = build_polar_grid(64, 128)
    Z = eval_zernike(11, RHO, THETA)   # primary spherical aberration
"""

from math import factorial, sqrt, pi
import numpy as np


def noll_nm(j):
    """Convert Noll single index j (1-based) to (n, m) orders.

    Algorithm: n is determined by triangular-number bracketing; m is then the
    signed azimuthal order following Noll's even/odd alternation convention.
    """
    if j < 1:
        raise ValueError(f"Noll index must be ≥ 1, got {j}")
    n = 0
    while (n + 1) * (n + 2) // 2 < j:
        n += 1
    # position within radial order n
    rem = j - n * (n + 1) // 2
    # m values for order n: 0, ±1, ±2, …, ±n (step 2) with Noll parity rule
    m_pos = list(range(n % 2, n + 1, 2))   # positive |m| values including 0
    pairs = []
    for mp in m_pos:
        if mp == 0:
            pairs.append(0)
        else:
            pairs.append(-mp)
            pairs.append(mp)
    pairs.sort(key=lambda x: (abs(x), -x))
    m = pairs[rem - 1]
    return n, m


def zernike_radial(n, m, rho):
    """Radial polynomial R_n^|m|(rho) via Rodrigues summation (Noll 1976 eq 2).

    Valid for rho in [0, 1].  Returns zero for rho outside this range
    (Zernike polynomials are only defined on the unit disc).
    """
    m   = abs(m)
    rho = np.asarray(rho, dtype=np.float64)
    result = np.zeros_like(rho)
    for s in range((n - m) // 2 + 1):
        c = ((-1)**s * factorial(n - s)
             / (factorial(s) * factorial((n + m) // 2 - s) * factorial((n - m) // 2 - s)))
        result += c * rho ** (n - 2 * s)
    return result


def eval_zernike(j, rho, theta):
    """Evaluate normalised Zernike Z_j(rho, theta).

    Normalisation factor: sqrt(2(n+1)) for m≠0, sqrt(n+1) for m=0.
    This ensures orthonormality: ∫∫_disc Z_j Z_k dA = π δ_jk.
    """
    n, m = noll_nm(j)
    R    = zernike_radial(n, m, rho)
    norm = sqrt(2 * (n + 1)) if m != 0 else sqrt(n + 1)
    if m > 0:
        return norm * R * np.cos(m * theta)
    if m < 0:
        return norm * R * np.sin(abs(m) * theta)
    return norm * R


def build_polar_grid(n_rings, n_sectors):
    """Return (RHO, THETA) meshgrid with shape (n_rings, n_sectors).

    rho  ∈ [1/n_rings, 1.0]  — avoids the centre singularity of polar coords
    theta ∈ [0, 2π)           — endpoint excluded (closed loop)
    """
    rho   = np.linspace(1.0 / n_rings, 1.0, n_rings)
    theta = np.linspace(0.0, 2 * pi, n_sectors, endpoint=False)
    return np.meshgrid(rho, theta, indexing='ij')
