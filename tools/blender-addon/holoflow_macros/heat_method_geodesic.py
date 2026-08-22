"""
holoflow_macros/heat_method_geodesic.py
Reusable Heat Method for Geodesic Distance — Crane et al. 2013
Blender 5.1 | CC0 | Holoflow Studio

Usage:
    from holoflow_macros.heat_method_geodesic import geodesic_distance
    phi = geodesic_distance(bm, source_index=0)
"""
import numpy as np
from scipy import sparse
from scipy.sparse.linalg import spsolve


def geodesic_distance(bm, source_index: int = 0) -> np.ndarray:
    """
    Compute geodesic distance from source_index to all vertices of bm.

    Parameters
    ----------
    bm            : bmesh.types.BMesh  — triangulated, lookup tables refreshed
    source_index  : int               — source vertex index (distance = 0)

    Returns
    -------
    phi : np.ndarray shape (nv,), dtype float64
        Non-negative geodesic distance from source to each vertex.
    """
    bm.verts.ensure_lookup_table()
    bm.faces.ensure_lookup_table()
    nv = len(bm.verts)

    rows, cols, vals = [], [], []
    mass_diag = np.zeros(nv)

    for f in bm.faces:
        vidx = [lo.vert.index for lo in f.loops]
        pts  = [np.array(bm.verts[vi].co) for vi in vidx]
        e01  = pts[1] - pts[0]; e02 = pts[2] - pts[0]
        area = 0.5 * np.linalg.norm(np.cross(e01, e02))
        for vi in vidx:
            mass_diag[vi] += area / 3.0
        for k in range(3):
            i, j   = vidx[k], vidx[(k+1) % 3]
            opp    = vidx[(k+2) % 3]
            ea     = np.array(bm.verts[i].co)   - np.array(bm.verts[opp].co)
            eb     = np.array(bm.verts[j].co)   - np.array(bm.verts[opp].co)
            sin_v  = np.linalg.norm(np.cross(ea, eb))
            cot    = np.dot(ea, eb) / max(sin_v, 1e-8)
            w      = 0.5 * cot
            rows  += [i, j, i, j]; cols += [j, i, i, j]; vals += [-w, -w, w, w]

    L = sparse.csr_matrix((vals, (rows, cols)), shape=(nv, nv))
    M = sparse.diags(mass_diag, format="csr")

    h = np.mean([
        np.linalg.norm(np.array(e.verts[0].co) - np.array(e.verts[1].co))
        for e in bm.edges
    ])
    t = h * h

    delta        = np.zeros(nv); delta[source_index] = 1.0
    u            = spsolve(M - t * L, delta)
    u            = np.maximum(u, 0.0)

    # Per-face gradient → normalise
    grad_u = np.zeros((len(bm.faces), 3))
    face_X = np.zeros((len(bm.faces), 3))
    for fi, f in enumerate(bm.faces):
        vidx = [lo.vert.index for lo in f.loops]
        p    = [np.array(bm.verts[vi].co) for vi in vidx]
        n_raw = np.cross(p[1]-p[0], p[2]-p[0])
        A     = 0.5 * np.linalg.norm(n_raw)
        n     = n_raw / (np.linalg.norm(n_raw) + 1e-14)
        g = np.zeros(3)
        for k in range(3):
            opp_e = p[(k+2)%3] - p[(k+1)%3]
            g    += u[vidx[k]] * np.cross(n, opp_e)
        g /= (2.0 * A + 1e-14)
        grad_u[fi] = g
        face_X[fi] = -g / (np.linalg.norm(g) + 1e-14)

    # Divergence at vertices
    div_vec = np.zeros(nv)
    for fi, f in enumerate(bm.faces):
        vidx = [lo.vert.index for lo in f.loops]
        p    = [np.array(bm.verts[vi].co) for vi in vidx]
        Xf   = face_X[fi]
        for k in range(3):
            vi   = vidx[k]; vj = vidx[(k+1)%3]; vopp = vidx[(k+2)%3]
            ea   = p[vi] - p[vopp]; eb = p[vj] - p[vopp]
            cot1 = np.dot(ea, eb) / max(np.linalg.norm(np.cross(ea, eb)), 1e-8)
            ec   = p[vi] - p[vj];  ed = p[vopp] - p[vj]
            cot2 = np.dot(ec, ed) / max(np.linalg.norm(np.cross(ec, ed)), 1e-8)
            div_vec[vi] += 0.5*(cot1*np.dot(Xf, p[vj]-p[vi]) +
                                cot2*np.dot(Xf, p[vopp]-p[vi]))

    L_reg = L + sparse.eye(nv, format="csr") * 1e-8
    phi   = spsolve(L_reg, div_vec)
    phi  -= phi[source_index]
    return np.abs(phi)
