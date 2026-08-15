"""
holoflow_macros/mandelbulb_field.py
====================================
Reusable NumPy-vectorised Mandelbulb escape-time field.

Usage:
    from holoflow_macros.mandelbulb_field import mandelbulb_field, extract_isosurface

    field = mandelbulb_field(N=26, extent=1.25, power=8, max_iter=14, bail=2.0)
    verts, faces = extract_isosurface(field, N=26, extent=1.25, iso=0.5)

Both functions are pure NumPy — no Blender dependency — so they can be
imported in any Python 3.9+ environment that has NumPy installed.
"""

import numpy as np

# Six tetrahedra per voxel (Doi & Koide 1991 body-diagonal decomposition).
_CUBE_TETS = (
    (0, 1, 5, 6), (0, 1, 2, 6), (0, 2, 3, 6),
    (0, 3, 7, 6), (0, 4, 7, 6), (0, 4, 5, 6),
)
_CUBE_OFF = np.array(
    [(0,0,0),(1,0,0),(1,1,0),(0,1,0),
     (0,0,1),(1,0,1),(1,1,1),(0,1,1)],
    dtype=np.float64,
)


def mandelbulb_field(N=26, extent=1.25, power=8, max_iter=14, bail=2.0):
    """
    Compute the smooth escape-time scalar field over an N³ grid covering
    [−extent, extent]³.

    Returns
    -------
    field : ndarray, shape (N, N, N), dtype float64
        0.0 for trapped (inside) points; smooth_iter ≥ 1.0 for escaped.
        smooth_iter = i − log₂(log₂|z|) removes discrete step artefacts.

    Parameters
    ----------
    N       : grid resolution per axis
    extent  : half-edge of the bounding cube (Mandelbulb fits within 1.25)
    power   : triplex exponent (8 = classic, 4 = cauliflower variant)
    max_iter: iteration cap
    bail    : escape radius (standard = 2.0)
    """
    coords = np.linspace(-extent, extent, N)
    cx, cy, cz = np.meshgrid(coords, coords, coords, indexing='ij')
    cx = cx.ravel(); cy = cy.ravel(); cz = cz.ravel()

    zx = np.zeros_like(cx); zy = np.zeros_like(cy); zz = np.zeros_like(cz)
    smooth  = np.zeros(len(cx), dtype=np.float64)
    trapped = np.ones(len(cx),  dtype=bool)

    for i in range(1, max_iter + 1):
        r   = np.sqrt(zx*zx + zy*zy + zz*zz)
        th  = np.arctan2(np.sqrt(zx*zx + zy*zy), zz)
        phi = np.arctan2(zy, zx)
        rn  = r ** power
        sth = np.sin(power * th)
        cth = np.cos(power * th)
        zx  = rn * sth * np.cos(power * phi) + cx
        zy  = rn * sth * np.sin(power * phi) + cy
        zz  = rn * cth                        + cz
        r2  = zx*zx + zy*zy + zz*zz
        esc = trapped & (r2 > bail * bail)
        if esc.any():
            r_esc = np.sqrt(r2[esc])
            smooth[esc] = float(i) - np.log2(np.log2(r_esc.clip(1.001)))
            trapped[esc] = False
        if not trapped.any():
            break

    return smooth.reshape(N, N, N)


def extract_isosurface(field, N, extent, iso=0.5):
    """
    Marching-tetrahedra isosurface extraction.

    Parameters
    ----------
    field  : (N, N, N) float64 scalar field
    N      : grid resolution (must match field.shape)
    extent : half-edge of the bounding cube
    iso    : isosurface threshold (0.5 for Mandelbulb boundary)

    Returns
    -------
    verts : (V, 3) float64 — world-space vertex positions
    faces : list of [int, int, int] — triangle indices
    """
    step = 2.0 * extent / (N - 1)
    corners = np.stack(
        [field[a:a+N-1, b:b+N-1, c:c+N-1]
         for a, b, c in [(0,0,0),(1,0,0),(1,1,0),(0,1,0),
                         (0,0,1),(1,0,1),(1,1,1),(0,1,1)]],
        axis=0,
    )
    active = np.argwhere((corners.min(axis=0) < iso) & (corners.max(axis=0) > iso))

    verts_out: list = []
    faces_out: list = []
    idx_map:   dict = {}

    for ix, iy, iz in active:
        base = np.array([ix, iy, iz], dtype=np.float64) * step - extent
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


def _lerp(va, vb, fa, fb, iso):
    t = np.clip((iso - fa) / (fb - fa + 1e-30), 0.0, 1.0)
    return va + t * (vb - va)


def _march_cube(cv, cf, iso):
    tris = []
    for ti in _CUBE_TETS:
        vs = cv[list(ti)]; fs = cf[list(ti)]
        ins = fs < iso; n_in = int(ins.sum())
        if n_in == 0 or n_in == 4:
            continue
        cuts: dict = {}
        for a in range(4):
            for b in range(a + 1, 4):
                if ins[a] != ins[b]:
                    cuts[(a, b)] = _lerp(vs[a], vs[b], fs[a], fs[b], iso)
        if n_in == 1 or n_in == 3:
            tris.append(np.array(list(cuts.values())))
        else:
            iv = [k for k in range(4) if ins[k]]
            ov = [k for k in range(4) if not ins[k]]
            i0, i1 = iv; j0, j1 = ov
            q = [cuts[(min(i0,j0), max(i0,j0))],
                 cuts[(min(i0,j1), max(i0,j1))],
                 cuts[(min(i1,j1), max(i1,j1))],
                 cuts[(min(i1,j0), max(i1,j0))]]
            tris.append(np.array([q[0], q[1], q[2]]))
            tris.append(np.array([q[0], q[2], q[3]]))
    return tris
