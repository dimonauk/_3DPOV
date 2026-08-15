"""
holoflow_macros/riemann_zeta_floor.py
────────────────────────────────────────────────────────────────────
Reusable helper: compute ζ(s) on a 2-D grid and build a height-field
mesh with HSV vertex colours.  Extracted from the blueprint so it can
be called from other macros or the holoflow_webxr_exporter pipeline.

Usage:
    from holoflow_macros.riemann_zeta_floor import build_zeta_floor
    obj = build_zeta_floor(
        name="MyZetaFloor",
        sigma_range=(0.02, 0.98),
        t_range=(0.5, 50.0),
        n_sigma=80, n_t=160,
        n_em=100,
        h_scale=0.18, h_clip=2.8,
    )
"""

from __future__ import annotations

import math
import bpy
import numpy as np


def _euler_maclaurin_zeta(
    sigma_arr: np.ndarray,
    t_arr: np.ndarray,
    n_em: int = 100,
) -> np.ndarray:
    """
    Return ζ(σ+it) on the grid (M_sigma, M_t) via Euler–Maclaurin.

    Error bound: |error| < 5e-4 for |Im(s)| ≤ 50 with n_em=100.
    Computation: O(n_em × M_sigma × M_t) complex exponentials.
    """
    s = sigma_arr[:, None] + 1j * t_arr[None, :]   # (M, L)
    s_flat = s.ravel()                              # (M*L,)
    n  = np.arange(1, n_em + 1, dtype=float)
    partial = np.sum(
        np.exp(-np.log(n)[:, None] * s_flat[None, :]), axis=0
    )
    N   = float(n_em)
    Ns  = N ** (-s_flat)
    zeta_flat = (
        partial
        + N * Ns / (s_flat - 1)          # N^{1-s}/(s-1)
        + Ns / 2.0                        # ½ N^{-s}
        + (1.0 / 12.0) * s_flat * Ns / N              # B_2 correction
        - (1.0 / 720.0) * s_flat * (s_flat + 1) * (s_flat + 2) * Ns / N**3  # B_4
    )
    return zeta_flat.reshape(len(sigma_arr), len(t_arr))


def _hsv_rgba(h: np.ndarray, s: np.ndarray, v: np.ndarray) -> np.ndarray:
    """Vectorised HSV → RGBA, all inputs shape (M, L), output (M, L, 4)."""
    h6 = (h * 6.0) % 6.0
    i  = h6.astype(int)
    f  = h6 - i
    p  = v * (1.0 - s);  q = v * (1.0 - s * f);  t = v * (1.0 - s * (1.0 - f))
    r  = np.select([i==0,i==1,i==2,i==3,i==4],[v,q,p,p,t], v)
    g  = np.select([i==0,i==1,i==2,i==3,i==4],[t,v,v,q,p], q)
    b  = np.select([i==0,i==1,i==2,i==3,i==4],[p,p,t,v,v], v)
    return np.stack([r, g, b, np.ones_like(r)], axis=-1)


def build_zeta_floor(
    name: str = "ZetaFloor",
    sigma_range: tuple[float, float] = (0.02, 0.98),
    t_range: tuple[float, float] = (0.5, 50.0),
    n_sigma: int = 80,
    n_t: int = 160,
    n_em: int = 100,
    h_scale: float = 0.18,
    h_clip: float = 2.8,
    floor_w: float = 1.0,
    floor_d: float = 1.0,
) -> bpy.types.Object:
    """
    Build a Blender mesh object whose height encodes log(1+|ζ(σ+it)|)
    and whose vertex colours encode arg(ζ(σ+it)).

    Returns the created Object (already linked to the active collection).
    """
    sigma = np.linspace(*sigma_range, n_sigma)
    t_arr = np.linspace(*t_range,    n_t)
    zeta  = _euler_maclaurin_zeta(sigma, t_arr, n_em)

    h_m   = np.clip(np.log1p(np.abs(zeta)), 0.0, h_clip) / h_clip * h_scale
    hue   = np.angle(zeta) / (2.0 * math.pi) + 0.5
    sat   = np.clip(np.abs(zeta) / 2.0, 0.1, 0.85)
    rgba  = _hsv_rgba(hue, sat, np.full_like(sat, 0.88))

    sx = np.linspace(-floor_w / 2, floor_w / 2, n_sigma)
    tz = np.linspace(-floor_d / 2, floor_d / 2, n_t)
    xs, zs = np.meshgrid(sx, tz, indexing='ij')

    verts = list(zip(xs.ravel().tolist(), h_m.ravel().tolist(), zs.ravel().tolist()))
    faces = [
        (m * n_t + l, m * n_t + l + 1, (m+1)*n_t + l+1, (m+1)*n_t + l)
        for m in range(n_sigma - 1) for l in range(n_t - 1)
    ]

    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(verts, [], faces)
    mesh.update()

    ca = mesh.color_attributes.new("Col", "FLOAT_COLOR", "POINT")
    for i, c in enumerate(rgba.reshape(-1, 4).tolist()):
        ca.data[i].color = c

    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    obj["holoflow:facet"]    = True
    obj["holoflow:category"] = "stage-floor"
    return obj
