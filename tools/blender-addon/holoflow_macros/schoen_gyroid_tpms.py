# SPDX-License-Identifier: CC0-1.0
"""
holoflow_macros.schoen_gyroid_tpms
====================================
Reusable helper: extract a Schoen Gyroid TPMS isosurface from its nodal
approximation  f = sin x cos y + sin y cos z + sin z cos x = level.

Usage (from any blueprint or operator):

    from tools.blender_addon.holoflow_macros.schoen_gyroid_tpms import (
        gyroid_f, gyroid_grad, extract_gyroid_verts_faces
    )

    verts, faces = extract_gyroid_verts_faces(N=60, half_box=6.283, level=0.0)

Reference
---------
Schoen AH (1970) NASA TN D-5541.  US government work — public domain.
https://ntrs.nasa.gov/citations/19700020490
"""

import numpy as np

# Six-tet cube decomposition — shared body diagonal v0→v6
_CUBE_OFF  = np.array(
    [(0,0,0),(1,0,0),(1,1,0),(0,1,0),(0,0,1),(1,0,1),(1,1,1),(0,1,1)],
    dtype=np.int32)
_CUBE_TETS = ((0,1,2,6),(0,2,3,6),(0,3,7,6),(0,4,5,6),(0,4,7,6),(0,1,5,6))


def gyroid_f(X, Y, Z):
    """Nodal approximation: sin x cos y + sin y cos z + sin z cos x."""
    return np.sin(X)*np.cos(Y) + np.sin(Y)*np.cos(Z) + np.sin(Z)*np.cos(X)


def gyroid_grad(X, Y, Z):
    """Analytic ∇f (surface normal direction at f=level)."""
    gx = np.cos(X)*np.cos(Y) - np.sin(Z)*np.sin(X)
    gy = -np.sin(X)*np.sin(Y) + np.cos(Y)*np.cos(Z)
    gz = -np.sin(Y)*np.sin(Z) + np.cos(Z)*np.cos(X)
    return gx, gy, gz


def _lerp(va, vb, fa, fb):
    t = np.clip(-fa / (fb - fa + 1e-30), 0.0, 1.0)
    return va + t * (vb - va)


def _march_cube(cv, cf):
    """Triangle list from one cube (cv: 8×3, cf: 8 field values at level 0)."""
    tris = []
    for ti in _CUBE_TETS:
        vs = cv[list(ti)]; fs = cf[list(ti)]
        inside = fs < 0.0
        n_in = int(inside.sum())
        if n_in == 0 or n_in == 4:
            continue
        cuts = {}
        for a in range(4):
            for b in range(a + 1, 4):
                if inside[a] != inside[b]:
                    cuts[(a, b)] = _lerp(vs[a], vs[b], fs[a], fs[b])
        if n_in in (1, 3):
            tris.append(np.array(list(cuts.values())))
        else:
            iv = [i for i in range(4) if inside[i]]
            ov = [i for i in range(4) if not inside[i]]
            i0, i1 = iv; j0, j1 = ov
            q = [cuts[(min(i0,j0),max(i0,j0))], cuts[(min(i0,j1),max(i0,j1))],
                 cuts[(min(i1,j1),max(i1,j1))], cuts[(min(i1,j0),max(i1,j0))]]
            tris += [np.array([q[0],q[1],q[2]]), np.array([q[0],q[2],q[3]])]
    return tris


def extract_gyroid_verts_faces(
    N: int = 60,
    half_box: float = 2.0 * np.pi,
    level: float = 0.0,
):
    """
    Marching-tetrahedra isosurface of the gyroid at the given level.

    Parameters
    ----------
    N        : grid resolution per axis (60 → 216 k voxels, ~45–90 s)
    half_box : domain is [−half_box, half_box]³
    level    : isosurface threshold (0 = exact gyroid)

    Returns
    -------
    verts : (V, 3) float64 — world-space vertex positions
    faces : list[list[int]] — triangle face index lists
    """
    step   = 2.0 * half_box / (N - 1)
    coords = np.linspace(-half_box, half_box, N)
    X, Y, Z = np.meshgrid(coords, coords, coords, indexing='ij')
    field = gyroid_f(X, Y, Z) - level      # shift so isosurface is at 0

    corners = np.stack(
        [field[a:a+N-1, b:b+N-1, c:c+N-1]
         for a, b, c in [(0,0,0),(1,0,0),(1,1,0),(0,1,0),
                          (0,0,1),(1,0,1),(1,1,1),(0,1,1)]],
        axis=0)
    active = np.argwhere(
        (corners.min(axis=0) < 0.0) & (corners.max(axis=0) > 0.0))

    verts_out, faces_out, idx_map = [], [], {}
    for ix, iy, iz in active:
        base = np.array([ix, iy, iz], dtype=np.float64) * step - half_box
        cv   = base + _CUBE_OFF * step
        cf   = corners[:, ix, iy, iz]
        for tri in _march_cube(cv, cf):
            face = []
            for pt in tri:
                key = tuple(np.round(pt, 7))
                if key not in idx_map:
                    idx_map[key] = len(verts_out)
                    verts_out.append(pt)
                face.append(idx_map[key])
            faces_out.append(face)

    V = np.array(verts_out) if verts_out else np.zeros((0, 3))
    return V, faces_out
