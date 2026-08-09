"""
implicit_polynomial_surface_nets.py
=====================================
Reusable macro: evaluate an arbitrary polynomial implicit surface f(x,y,z)=0
on an N³ grid and extract it using Surface Nets.

Returns a bmesh ready for triangulation, scaling and export.

Usage
-----
    import sys, os
    sys.path.insert(0, "/path/to/holoflow_macros")
    from implicit_polynomial_surface_nets import surface_nets_from_func

    import numpy as np

    def my_surface(X, Y, Z):
        # Clebsch cubic
        S = X + Y + Z + 1.0
        return X**3 + Y**3 + Z**3 + 1.0 - S**3

    bm = surface_nets_from_func(my_surface, half_box=2.0, n=90)
    # ... apply bmesh.ops.scale, triangulate, bm.to_mesh, export GLB ...

API
---
surface_nets_from_func(func, half_box, n, iso=0.0) -> bmesh.types.BMesh

    func     : callable (X, Y, Z) -> ndarray[float32]
                X, Y, Z are 3-D meshgrid arrays (shape N×N×N, float32).
                Must return a float32 array of the same shape.
    half_box : float — world-space half-extent of the cubic sampling domain.
    n        : int   — grid resolution per axis (n³ cells).
    iso      : float — isovalue (default 0.0, the zero-locus of f).

Surface Nets reference
-----------------------
Gibson, S.F.F. (1998). "Constrained elastic surface nets: generating smooth
models from binary segmented data." MICCAI 1998. Springer LNCS 1496.
Algorithm: one vertex per sign-change cell at the centroid of ISO-interpolated
edge crossings; quads stitched from adjacent sign-change cells.

Licence: CC0 1.0 Universal (public domain dedication).
"""

import bmesh
import numpy as np


def surface_nets_from_func(func, half_box: float, n: int, iso: float = 0.0):
    """
    Evaluate func on an n³ grid in [-half_box, half_box]³ and extract the
    isosurface {func=iso} using the Surface Nets algorithm.

    Returns a bmesh.types.BMesh containing quads.  Caller is responsible for:
      - bmesh.ops.remove_doubles(bm, ...)
      - bmesh.ops.triangulate(bm, ...)
      - bmesh.ops.scale(bm, ...)
      - bm.to_mesh(mesh)
      - bm.free()
    """
    coords = np.linspace(-half_box, half_box, n, dtype=np.float32)
    X, Y, Z = np.meshgrid(coords, coords, coords, indexing='ij')

    F = func(X, Y, Z).astype(np.float32)
    del X, Y, Z

    INSIDE = F >= iso

    # ── Mark sign-change cells ────────────────────────────────────────────────
    mark = np.zeros((n, n, n), dtype=bool)
    for ax in range(3):
        lo = [slice(None)] * 3;  lo[ax] = slice(None, n - 1)
        hi = [slice(None)] * 3;  hi[ax] = slice(1, None)
        diff        = INSIDE[tuple(lo)] != INSIDE[tuple(hi)]
        mark[tuple(lo)] |= diff
        mark[tuple(hi)] |= diff

    surf_ijk = np.argwhere(mark)
    M = len(surf_ijk)

    # ── Vertex placement ──────────────────────────────────────────────────────
    DIRS = ((0, 1, 0, 0), (1, 0, 1, 0), (2, 0, 0, 1))
    verts_w = np.empty((M, 3), dtype=np.float32)
    for m, (ci, cj, ck) in enumerate(surf_ijk):
        pts = []
        for ax, di, dj, dk in DIRS:
            ni, nj, nk = ci + di, cj + dj, ck + dk
            if ni < n and nj < n and nk < n:
                va = float(F[ci, cj, ck])
                vb = float(F[ni, nj, nk])
                if (va < iso) != (vb < iso):
                    t = (iso - va) / (vb - va + 1e-12)
                    pa = np.array([coords[ci], coords[cj], coords[ck]])
                    pb = np.array([coords[ni], coords[nj], coords[nk]])
                    pts.append(pa + t * (pb - pa))
        verts_w[m] = (np.mean(pts, axis=0) if pts
                      else np.array([coords[ci], coords[cj], coords[ck]]))

    # ── Cell → vertex lookup ──────────────────────────────────────────────────
    cell_map = np.full((n, n, n), -1, dtype=np.int32)
    cell_map[surf_ijk[:, 0], surf_ijk[:, 1], surf_ijk[:, 2]] = np.arange(M, dtype=np.int32)

    # ── Quad stitching ────────────────────────────────────────────────────────
    quads = []
    for ax in range(3):
        a1, a2 = [x for x in range(3) if x != ax]
        lo = [slice(None)] * 3;  lo[ax] = slice(None, n - 1)
        hi = [slice(None)] * 3;  hi[ax] = slice(1, None)
        edges = np.argwhere(INSIDE[tuple(lo)] != INSIDE[tuple(hi)])
        for e in edges:
            corners = []
            ok = True
            for d1, d2 in ((0, 0), (-1, 0), (-1, -1), (0, -1)):
                c      = e.copy()
                c[a1] += d1
                c[a2] += d2
                if not (0 <= c[0] < n and 0 <= c[1] < n and 0 <= c[2] < n):
                    ok = False; break
                vi = cell_map[c[0], c[1], c[2]]
                if vi < 0:
                    ok = False; break
                corners.append(vi)
            if ok:
                quads.append(corners if INSIDE[e[0], e[1], e[2]]
                             else corners[::-1])

    del F, INSIDE, cell_map

    # ── Assemble bmesh ────────────────────────────────────────────────────────
    bm       = bmesh.new()
    bm_verts = [bm.verts.new((float(v[0]), float(v[1]), float(v[2]))) for v in verts_w]
    bm.verts.ensure_lookup_table()

    for q in quads:
        try:
            bm.faces.new([bm_verts[i] for i in q])
        except ValueError:
            pass

    cell_sz = float(coords[1] - coords[0])
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=cell_sz * 0.05)
    return bm
