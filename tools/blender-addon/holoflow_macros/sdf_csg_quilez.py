"""
holoflow_macros/sdf_csg_quilez.py — Reusable SDF CSG primitive library
Blender 5.1 · Python 3.11 · CC0

Drop into any blueprint.py that needs compound SDF geometry.  All functions
accept an (N, 3) float32 numpy array `pts` and return an (N,) float32 SDF.

Source: Inigo Quilez, "Distance Functions", CC0.
    https://iquilezles.org/articles/distfunctions/
"""

import numpy as np

# ── Primitives ────────────────────────────────────────────────────────────────

def sdf_sphere(pts: np.ndarray, r: float) -> np.ndarray:
    return np.linalg.norm(pts, axis=-1) - r

def sdf_box(pts: np.ndarray, b) -> np.ndarray:
    b = np.asarray(b, dtype=np.float32)
    q = np.abs(pts) - b
    return np.linalg.norm(np.maximum(q, 0.0), axis=-1) + np.minimum(np.max(q, axis=-1), 0.0)

def sdf_rounded_box(pts: np.ndarray, b, r: float) -> np.ndarray:
    # Box with uniform corner rounding radius r.
    return sdf_box(pts, b) - r

def sdf_torus(pts: np.ndarray, R: float, r: float) -> np.ndarray:
    # Equatorial plane = XZ, axis = Y.
    xz = np.linalg.norm(np.stack([pts[:, 0], pts[:, 2]], axis=-1), axis=-1) - R
    return np.sqrt(xz ** 2 + pts[:, 1] ** 2) - r

def sdf_capsule(pts: np.ndarray, a, b, r: float) -> np.ndarray:
    a, b   = np.asarray(a, np.float32), np.asarray(b, np.float32)
    ab     = b - a
    denom  = float(np.dot(ab, ab)) + 1e-12
    t      = np.clip(np.einsum('ij,j->i', pts - a, ab) / denom, 0.0, 1.0)
    return np.linalg.norm(pts - (a + t[:, None] * ab), axis=-1) - r

def sdf_cylinder(pts: np.ndarray, r: float, h: float) -> np.ndarray:
    # Axis-aligned cylinder along Y, centred at origin, half-height h.
    d = np.stack([np.linalg.norm(np.stack([pts[:, 0], pts[:, 2]], axis=-1), axis=-1) - r,
                  np.abs(pts[:, 1]) - h], axis=-1)
    return np.linalg.norm(np.maximum(d, 0.0), axis=-1) + np.minimum(np.max(d, axis=-1), 0.0)

def sdf_cone(pts: np.ndarray, sin_a: float, cos_a: float, h: float) -> np.ndarray:
    # Solid cone along +Y axis, apex at origin, half-angle α where sin/cos are given.
    q = np.stack([np.linalg.norm(np.stack([pts[:, 0], pts[:, 2]], axis=-1), axis=-1),
                  pts[:, 1]], axis=-1)
    k1 = np.array([sin_a, cos_a])
    k2 = np.array([-cos_a, sin_a])
    d  = q - k1 * np.clip(np.einsum('ij,j->i', q, k1), 0.0, h)[:, None]
    d2 = q - k2 * np.clip(np.einsum('ij,j->i', q, k2), 0.0, 1.0)[:, None]
    D  = np.where(np.einsum('ij,j->i', q, np.array([0.0, 1.0])) < 0,
                  np.minimum(np.sum(d * d, axis=-1), np.sum(d2 * d2, axis=-1)),
                  np.sum(d2 * d2, axis=-1))
    sgn = np.sign(d[:, 0] * cos_a - d[:, 1] * sin_a)
    return sgn * np.sqrt(np.maximum(D, 0.0))

# ── Domain operations ─────────────────────────────────────────────────────────

def op_translate(pts: np.ndarray, offset) -> np.ndarray:
    return pts - np.asarray(offset, dtype=np.float32)

def op_twist_y(pts: np.ndarray, k: float) -> np.ndarray:
    c, s = np.cos(k * pts[:, 1]), np.sin(k * pts[:, 1])
    x2   = c * pts[:, 0] - s * pts[:, 2]
    z2   = s * pts[:, 0] + c * pts[:, 2]
    return np.stack([x2, pts[:, 1], z2], axis=-1)

# ── Boolean operations ────────────────────────────────────────────────────────

def op_union(a: np.ndarray, b: np.ndarray) -> np.ndarray:
    return np.minimum(a, b)

def op_isect(a: np.ndarray, b: np.ndarray) -> np.ndarray:
    return np.maximum(a, b)

def op_diff(a: np.ndarray, b: np.ndarray) -> np.ndarray:
    return np.maximum(a, -b)

def op_smin(a: np.ndarray, b: np.ndarray, k: float = 0.12) -> np.ndarray:
    # Polynomial smooth minimum (Quilez, CC0).  C¹ continuity everywhere.
    h = np.clip(0.5 + 0.5 * (b - a) / k, 0.0, 1.0)
    return a * h + b * (1.0 - h) - k * h * (1.0 - h)

def op_smax(a: np.ndarray, b: np.ndarray, k: float = 0.12) -> np.ndarray:
    return -op_smin(-a, -b, k)

def op_sdiff(a: np.ndarray, b: np.ndarray, k: float = 0.12) -> np.ndarray:
    return op_smax(a, -b, k)

def op_sisect(a: np.ndarray, b: np.ndarray, k: float = 0.12) -> np.ndarray:
    return -op_smin(-a, -b, k)

# ── Surface Nets extractor (Gibson 1998) ──────────────────────────────────────

def surface_nets(F: np.ndarray, coords: np.ndarray, iso: float = 0.0):
    """
    F     : (N, N, N) float32 SDF grid
    coords: (N,) float32 axis coordinates (same for x, y, z)
    iso   : isosurface level

    Returns (verts, faces) where verts is (M, 3) float32 and faces is a list
    of 4-tuples (quad vertex indices).  Normals not computed here — use
    bmesh.ops.recalc_face_normals after assembly.
    """
    N      = F.shape[0]
    INSIDE = F < iso
    FWDS   = ((0, 1, 0, 0), (1, 0, 1, 0), (2, 0, 0, 1))

    mark = np.zeros((N, N, N), dtype=bool)
    for ax, di, dj, dk in FWDS:
        lo = [slice(None)] * 3; lo[ax] = slice(None, N - 1)
        hi = [slice(None)] * 3; hi[ax] = slice(1,    None)
        diff = INSIDE[tuple(lo)] != INSIDE[tuple(hi)]
        mark[tuple(lo)] |= diff;  mark[tuple(hi)] |= diff

    surf_ijk = np.argwhere(mark)
    M        = len(surf_ijk)
    verts    = np.empty((M, 3), dtype=np.float32)
    cell_map = {}

    for m, (ci, cj, ck) in enumerate(surf_ijk):
        ep = []
        for ax, di, dj, dk in FWDS:
            ni, nj, nk = ci + di, cj + dj, ck + dk
            if ni < N and nj < N and nk < N:
                va, vb = float(F[ci, cj, ck]), float(F[ni, nj, nk])
                if (va < iso) != (vb < iso):
                    t  = (iso - va) / (vb - va + 1e-12)
                    pa = np.array([coords[ci], coords[cj], coords[ck]])
                    pb = np.array([coords[ni], coords[nj], coords[nk]])
                    ep.append(pa + t * (pb - pa))
        verts[m] = np.mean(ep, axis=0) if ep else np.array([coords[ci], coords[cj], coords[ck]])
        cell_map[(ci, cj, ck)] = m

    faces = []
    for ci, cj, ck in surf_ijk:
        for ax, di, dj, dk in FWDS:
            ni, nj, nk = ci + di, cj + dj, ck + dk
            if ni >= N or nj >= N or nk >= N: continue
            if INSIDE[ci, cj, ck] == INSIDE[ni, nj, nk]: continue
            if ax == 0:
                ring = [(ci,cj,ck),(ci,cj-1,ck),(ci,cj-1,ck-1),(ci,cj,ck-1)]
            elif ax == 1:
                ring = [(ci,cj,ck),(ci-1,cj,ck),(ci-1,cj,ck-1),(ci,cj,ck-1)]
            else:
                ring = [(ci,cj,ck),(ci-1,cj,ck),(ci-1,cj-1,ck),(ci,cj-1,ck)]
            ids = [cell_map.get(r) for r in ring]
            if all(v is not None for v in ids):
                faces.append(ids if INSIDE[ci, cj, ck] else ids[::-1])

    return verts, faces
