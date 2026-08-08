"""
holoflow_macros/tpms_marching_tets.py
Reusable TPMS extraction core for the Holoflow addon.
CC0 — Holoflow Studio 2026

Provides:
  extract_tpms(fn, N, iso) → (verts: ndarray (V,3), faces: list[list[int]])
  TPMS_FUNCS  — dict of ready-to-use implicit functions
  TPMS_NORMALS — dict of analytic normal functions

Algorithm: Marching Tetrahedra (Doi & Koide 1991).
Each cube in the N³ grid is split into 6 tetrahedra sharing the body-diagonal.
"""

import math
import numpy as np

# Six tets sharing the body-diagonal v₀=(0,0,0)→v₆=(1,1,1)
_CUBE_TETS = (
    (0, 1, 5, 6),
    (0, 1, 2, 6),
    (0, 2, 3, 6),
    (0, 3, 7, 6),
    (0, 4, 7, 6),
    (0, 4, 5, 6),
)

_CUBE_OFF = np.array(
    [(0,0,0),(1,0,0),(1,1,0),(0,1,0),(0,0,1),(1,0,1),(1,1,1),(0,1,1)],
    dtype=np.float64,
)


def _lerp(va, vb, fa, fb, iso=0.0):
    t = np.clip((iso - fa) / (fb - fa + 1e-30), 0.0, 1.0)
    return va + t * (vb - va)


def _march_cube(cv, cf, iso=0.0):
    """Return list of triangle vertex triplets from one cube."""
    tris = []
    for ti in _CUBE_TETS:
        vs = cv[list(ti)]
        fs = cf[list(ti)]
        ins = fs < iso
        n_in = int(ins.sum())
        if n_in == 0 or n_in == 4:
            continue
        cuts = {}
        for a in range(4):
            for b in range(a + 1, 4):
                if ins[a] != ins[b]:
                    cuts[(a, b)] = _lerp(vs[a], vs[b], fs[a], fs[b], iso)
        if n_in == 1 or n_in == 3:
            tris.append(np.array(list(cuts.values())))
        else:
            iv = [i for i in range(4) if ins[i]]
            ov = [i for i in range(4) if not ins[i]]
            i0, i1 = iv;  j0, j1 = ov
            q = [cuts[(min(i0,j0), max(i0,j0))],
                 cuts[(min(i0,j1), max(i0,j1))],
                 cuts[(min(i1,j1), max(i1,j1))],
                 cuts[(min(i1,j0), max(i1,j0))]]
            tris.append(np.array([q[0], q[1], q[2]]))
            tris.append(np.array([q[0], q[2], q[3]]))
    return tris


def extract_tpms(fn, N: int = 32, iso: float = 0.0):
    """
    Marching-Tetrahedra isosurface of fn(X,Y,Z) over [0, 2π]³.

    Parameters
    ----------
    fn  : callable(X, Y, Z) → ndarray  — implicit surface function
    N   : int  — grid resolution per axis
    iso : float — iso-level (default 0.0)

    Returns
    -------
    verts : ndarray shape (V, 3)
    faces : list of [i, j, k] index lists
    """
    step   = 2.0 * math.pi / (N - 1)
    coords = np.linspace(0.0, 2.0 * math.pi, N)
    X, Y, Z = np.meshgrid(coords, coords, coords, indexing='ij')
    field = fn(X, Y, Z)

    corners = np.stack(
        [field[a:a+N-1, b:b+N-1, c:c+N-1]
         for a, b, c in [(0,0,0),(1,0,0),(1,1,0),(0,1,0),
                         (0,0,1),(1,0,1),(1,1,1),(0,1,1)]],
        axis=0,
    )
    active = np.argwhere(
        (corners.min(axis=0) < iso) & (corners.max(axis=0) > iso)
    )

    verts_out: list = []
    faces_out: list = []
    idx_map:   dict = {}

    for ix, iy, iz in active:
        base = np.array([ix, iy, iz], dtype=np.float64) * step
        cv   = base + _CUBE_OFF * step
        cf   = corners[:, ix, iy, iz]
        for tri in _march_cube(cv, cf, iso):
            face = []
            for pt in tri:
                key = tuple(np.round(pt, 8))
                if key not in idx_map:
                    idx_map[key] = len(verts_out)
                    verts_out.append(pt)
                face.append(idx_map[key])
            faces_out.append(face)

    return (np.array(verts_out) if verts_out else np.zeros((0, 3))), faces_out


# ── TPMS function library ────────────────────────────────────────────────────
def _norm3(gx, gy, gz):
    n = np.sqrt(gx*gx + gy*gy + gz*gz) + 1e-12
    return gx/n, gy/n, gz/n


TPMS_FUNCS = {
    "schwarz_p": lambda X, Y, Z: np.cos(X) + np.cos(Y) + np.cos(Z),
    "schwarz_d": lambda X, Y, Z: (
        np.sin(X)*np.sin(Y)*np.sin(Z) + np.sin(X)*np.cos(Y)*np.cos(Z)
        + np.cos(X)*np.sin(Y)*np.cos(Z) + np.cos(X)*np.cos(Y)*np.sin(Z)
    ),
    "gyroid": lambda X, Y, Z: (
        np.sin(X)*np.cos(Y) + np.sin(Y)*np.cos(Z) + np.sin(Z)*np.cos(X)
    ),
}

TPMS_NORMALS = {
    "schwarz_p": lambda x, y, z: _norm3(-np.sin(x), -np.sin(y), -np.sin(z)),
    "gyroid":    lambda x, y, z: _norm3(
        np.cos(x)*np.cos(y) - np.sin(z)*np.sin(x),
        np.cos(y)*np.cos(z) - np.sin(x)*np.sin(y),
        np.cos(z)*np.cos(x) - np.sin(y)*np.sin(z),
    ),
    "schwarz_d": lambda x, y, z: _norm3(
        (np.cos(x)*np.sin(y)*np.sin(z) + np.cos(x)*np.cos(y)*np.cos(z)
         - np.sin(x)*np.sin(y)*np.cos(z) - np.sin(x)*np.cos(y)*np.sin(z)),
        (np.sin(x)*np.cos(y)*np.sin(z) - np.sin(x)*np.sin(y)*np.cos(z)
         + np.cos(x)*np.cos(y)*np.cos(z) - np.cos(x)*np.sin(y)*np.sin(z)),
        (np.sin(x)*np.sin(y)*np.cos(z) - np.sin(x)*np.cos(y)*np.sin(z)
         - np.cos(x)*np.sin(y)*np.sin(z) + np.cos(x)*np.cos(y)*np.cos(z)),
    ),
}
