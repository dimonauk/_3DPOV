"""
holoflow_macros/jacobi_elliptic_poi.py
=======================================
Reusable utility: Jacobi elliptic dn-surface for Holoflow poi heads.

Public API
----------
agm_K(m)
    Complete elliptic integral K(m) via the arithmetic-geometric mean (m = k²).
    Six to twelve iterations yield full float64 precision.  Returns ∞ for m ≥ 1.

jacobi_dn_array(u_arr, m)
    Evaluate dn(u, m) at every u in the NumPy array u_arr.
    Uses scipy.special.ellipj when available; falls back to RK4 integration of
    the canonical pendulum ODE system.

dn_modulated_sphere(k, n_theta, n_phi, R)
    Build a (n_theta × n_phi, 3) vertex array and a same-length (,) dn colour
    array for the surface ρ(θ) = R · dn(θ · 2K(k²)/π, k²) rotated around z.
    Returns (verts_np, dn_colour_01).

Usage from blueprint.py
-----------------------
    import sys, os
    sys.path.insert(0, os.path.join(bpy.utils.resource_path('LOCAL'), 'scripts'))
    # or adjust to the holoflow_macros location in your pipeline.
    from holoflow_macros.jacobi_elliptic_poi import dn_modulated_sphere
    verts, colours = dn_modulated_sphere(k=0.80, n_theta=40, n_phi=64, R=0.05)

Licence: CC0 1.0 Universal
"""

from __future__ import annotations
import math
import numpy as np

# ── scipy detection ────────────────────────────────────────────────────────────
try:
    from scipy.special import ellipj as _scipy_ellipj  # type: ignore
    _HAVE_SCIPY = True
except ImportError:
    _HAVE_SCIPY = False


# ── AGM ────────────────────────────────────────────────────────────────────────

def agm_K(m: float) -> float:
    """
    K(m) = ∫₀^(π/2) dθ/√(1−m·sin²θ)  via arithmetic-geometric mean.

    Parameters
    ----------
    m : float
        Modulus squared, m = k² ∈ [0, 1).  Returns math.inf for m ≥ 1.

    Returns
    -------
    float
        Complete elliptic integral of the first kind.
    """
    if m >= 1.0:
        return math.inf
    a, b = 1.0, math.sqrt(max(0.0, 1.0 - m))
    for _ in range(64):
        a, b = (a + b) * 0.5, math.sqrt(a * b)
        if abs(a - b) < 1e-15:
            break
    return math.pi / (2.0 * a)


# ── Jacobi dn ─────────────────────────────────────────────────────────────────

def jacobi_dn_array(u_arr: np.ndarray, m: float) -> np.ndarray:
    """
    dn(u, m) at every point in u_arr.

    Parameters
    ----------
    u_arr : np.ndarray of shape (N,)
        Argument array (real values).
    m : float
        Modulus squared k².

    Returns
    -------
    np.ndarray of shape (N,)
        Values of dn in [√(1−m), 1].
    """
    if _HAVE_SCIPY:
        _sn, _cn, dn, _ = _scipy_ellipj(u_arr, m)
        return dn

    # --- Pure-numpy RK4 fallback ---
    # ODE: d/du [sn, cn, dn] = [cn·dn, −sn·dn, −m·sn·cn]
    k2 = float(m)
    n  = len(u_arr)
    order     = np.argsort(u_arr)
    u_sorted  = u_arr[order]
    u_max     = float(u_sorted[-1]) if n > 0 else 1.0
    n_steps   = max(n * 8, 512)
    u_dense   = np.linspace(0.0, u_max, n_steps)
    du        = u_dense[1] - u_dense[0] if n_steps > 1 else 1e-6

    s, c, d = 0.0, 1.0, 1.0
    dn_out = np.ones(n)
    j = 0
    for u_i in u_dense:
        while j < n and u_sorted[j] <= u_i:
            dn_out[j] = d
            j += 1
        if j >= n:
            break
        def f(s_, c_, d_):
            return c_ * d_, -s_ * d_, -k2 * s_ * c_
        k1s, k1c, k1d = f(s, c, d)
        k2s, k2c, k2d = f(s+.5*du*k1s, c+.5*du*k1c, d+.5*du*k1d)
        k3s, k3c, k3d = f(s+.5*du*k2s, c+.5*du*k2c, d+.5*du*k2d)
        k4s, k4c, k4d = f(s+du*k3s, c+du*k3c, d+du*k3d)
        s += du*(k1s+2*k2s+2*k3s+k4s)/6.0
        c += du*(k1c+2*k2c+2*k3c+k4c)/6.0
        d += du*(k1d+2*k2d+2*k3d+k4d)/6.0

    result = np.empty(n)
    result[order] = dn_out
    return result


# ── Surface builder ────────────────────────────────────────────────────────────

def dn_modulated_sphere(
    k: float,
    n_theta: int = 40,
    n_phi:   int = 64,
    R: float = 0.05,
) -> tuple[np.ndarray, np.ndarray]:
    """
    dn-modulated sphere vertices and colour values.

    Surface equation:
        ρ(θ)   = R · dn(θ · 2K(k²)/π, k²)
        x, y, z = ρ·sinθ·cosφ, ρ·sinθ·sinφ, ρ·cosθ

    Parameters
    ----------
    k       : float  — modulus ∈ [0, 0.999]
    n_theta : int    — colatitude rings (including poles)
    n_phi   : int    — longitude segments
    R       : float  — metres, pole radius at k=0

    Returns
    -------
    verts   : np.ndarray, shape (n_theta*n_phi, 3)
    dn_01   : np.ndarray, shape (n_theta*n_phi,), values in [0, 1]
              (1 at poles, 0 at equator in the k→1 limit)
    """
    k  = min(float(k), 0.999)
    m  = k * k
    K  = agm_K(m)

    theta = np.linspace(0.0, math.pi, n_theta)
    u_arr = theta * (2.0 * K / math.pi)

    dn_col = jacobi_dn_array(u_arr, m)
    rho    = R * dn_col

    phi  = np.linspace(0.0, 2.0 * math.pi, n_phi, endpoint=False)

    RHO   = rho[:, None]
    THETA = theta[:, None]
    PHI   = phi[None, :]

    X = RHO * np.sin(THETA) * np.cos(PHI)
    Y = RHO * np.sin(THETA) * np.sin(PHI)
    Z = RHO * np.cos(THETA)

    verts   = np.stack([X, Y, Z], axis=-1).reshape(-1, 3)
    dn_flat = np.broadcast_to(dn_col[:, None], (n_theta, n_phi)).reshape(-1)
    lo, hi  = dn_flat.min(), dn_flat.max()
    dn_01   = (dn_flat - lo) / max(hi - lo, 1e-9)

    return verts, dn_01
