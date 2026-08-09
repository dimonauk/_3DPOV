"""
holoflow_macros/elastica_curve.py
==================================
Reusable macro: Euler oval elastica curve builder.

Build the closed non-inflectional elastica with curvature
κ(s) = 2b·dn(b·s, m) as a numpy point array.

Usage
-----
    from holoflow_macros.elastica_curve import build_oval_elastica
    pts, cn_vals = build_oval_elastica(m=0.3476, n=160, poi_diam=0.060)

API
---
    build_oval_elastica(m, n, poi_diam, z_lift=0.008, b=1.0)
        m        : Jacobi modulus in (0, 1)
                   m* ≈ 0.3476 is the exact closed oval elastica
                   (satisfies E(m)/K(m) = (2-m²)/2)
        n        : number of curve segments
        poi_diam : bounding diameter in metres (curve is rescaled)
        z_lift   : sinusoidal z-lift amplitude in metres (0 = flat)
        b        : curvature frequency parameter (scales arc length)
        returns  : (pts: (n,3) float64, cn_vals: (n,) float64)

    agm_K(m)    : complete elliptic integral K(m) via AGM
    agm_E(m)    : complete elliptic integral E(m) via AGM
    jacobi_arrays(m, n) : RK4 [sn, cn, dn] over [0, 2K(m)]

Source
------
Euler 1744 De Curvis Elasticis (PD); Langer & Singer 1984 (math PD).
"""

import numpy as np
from math import pi, sqrt, sin


# ──────────────────────────────────────────────────────────────────────────────
def agm_K(m: float) -> float:
    """Complete elliptic integral K(m) via AGM; ~15 dp in 7 iterations."""
    if m >= 1.0:
        return float('inf')
    a, b = 1.0, sqrt(max(0.0, 1.0 - m))
    for _ in range(64):
        a2, b2 = (a + b) * 0.5, sqrt(a * b)
        if abs(a2 - b2) < 1e-14:
            return pi / (2.0 * a2)
        a, b = a2, b2
    return pi / (2.0 * a)


def agm_E(m: float) -> float:
    """Complete elliptic integral E(m) via descending AGM."""
    if m >= 1.0:
        return 1.0
    a, b = 1.0, sqrt(max(0.0, 1.0 - m))
    power, acc = 1.0, m / 2.0
    for _ in range(64):
        a2, b2, c2 = (a + b) * 0.5, sqrt(a * b), (a - b) * 0.5
        power *= 2.0
        acc += power * c2 * c2
        if abs(c2) < 1e-14:
            break
        a, b = a2, b2, c2
    return (pi / (2.0 * a)) * (1.0 - acc)


def jacobi_arrays(m: float, n: int):
    """
    RK4 integration of the Jacobi system over half-period [0, 2K(m)].
    Returns (sn, cn, dn) each of length n+1.
    """
    Km = agm_K(m)
    dt = 2.0 * Km / n
    sn = np.zeros(n + 1)
    cn = np.zeros(n + 1)
    dn = np.zeros(n + 1)
    sn[0], cn[0], dn[0] = 0.0, 1.0, 1.0

    def f(s, c, d):
        return c * d, -s * d, -(m ** 2) * s * c

    for i in range(n):
        s, c, d = sn[i], cn[i], dn[i]
        ds1, dc1, dd1 = f(s, c, d)
        ds2, dc2, dd2 = f(s + dt/2*ds1, c + dt/2*dc1, d + dt/2*dd1)
        ds3, dc3, dd3 = f(s + dt/2*ds2, c + dt/2*dc2, d + dt/2*dd2)
        ds4, dc4, dd4 = f(s + dt*ds3,   c + dt*dc3,   d + dt*dd3)
        sn[i+1] = s + dt * (ds1 + 2*ds2 + 2*ds3 + ds4) / 6
        cn[i+1] = c + dt * (dc1 + 2*dc2 + 2*dc3 + dc4) / 6
        dn[i+1] = d + dt * (dd1 + 2*dd2 + 2*dd3 + dd4) / 6

    return sn, cn, dn


def build_oval_elastica(
    m: float,
    n: int = 160,
    poi_diam: float = 0.060,
    z_lift: float = 0.008,
    b: float = 1.0,
):
    """
    Returns (pts, cn_vals):
      pts      shape (n, 3) — 3-D positions of the elastica curve
      cn_vals  shape (n,)   — Jacobi cn at each point (curvature proxy)

    The curve is the closed non-inflectional Euler elastica:
      κ(s) = 2b · dn(b·s, m)
      x(s) = (2/b) ∫ cn(b·t, m) dt
      y(s) = (2/b) ∫ sn(b·t, m) dt
      z(s) = z_lift · sin(2π·s/L)

    Closure: y(2K/b) = 0 always; x(2K/b) = 0 when m = m* ≈ 0.3476.
    For other m values a linear blend corrects the gap over the last 10%.
    """
    sn_a, cn_a, _ = jacobi_arrays(m, n)
    Km = agm_K(m)
    ds = 2.0 * Km / n   # arc-length step per segment

    x = np.zeros(n + 1)
    y = np.zeros(n + 1)
    for i in range(n):
        x[i+1] = x[i] + ds * (cn_a[i] + cn_a[i+1])
        y[i+1] = y[i] + ds * (sn_a[i] + sn_a[i+1])

    # closure correction for x
    gap_x = x[n]
    if abs(gap_x) > 1e-9:
        blend_start = int(0.90 * n)
        for i in range(blend_start, n + 1):
            frac = (i - blend_start) / max(1, n - blend_start)
            x[i] -= frac * gap_x

    pts2d = np.stack([x[:n], y[:n]], axis=1)
    r_max = np.max(np.linalg.norm(pts2d, axis=1)) or 1.0
    pts2d *= (poi_diam / 2) / r_max

    phase = np.linspace(0, 2*pi, n, endpoint=False)
    z = z_lift * np.sin(phase)
    pts = np.column_stack([pts2d, z])

    return pts, cn_a[:n]
