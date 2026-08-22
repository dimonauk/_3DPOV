"""
holoflow_macros/laplace_beltrami_eigenmodes.py
Reusable helper: build cotangent Laplacian + lumped mass matrix for a Blender
mesh and compute the first K Laplace-Beltrami eigenmodes via scipy.sparse.

Usage (from Blender Scripting tab or another macro):
    from holoflow_macros.laplace_beltrami_eigenmodes import (
        build_cotangent_laplacian, compute_eigenmodes
    )
    mesh_obj = bpy.context.active_object
    L, M = build_cotangent_laplacian(mesh_obj.data)
    eigenvalues, eigenvectors = compute_eigenmodes(L, M, k=8)

Licence: CC0 — no rights reserved.
"""

import numpy as np
from scipy.sparse import lil_matrix, diags
from scipy.sparse.linalg import eigsh


def build_cotangent_laplacian(mesh):
    """
    Build sparse cotangent Laplacian L and lumped mass vector M for a triangle mesh.

    Parameters
    ----------
    mesh : bpy.types.Mesh
        Must be a triangle mesh (icosphere, geodesic sphere, etc.).
        Do not call bpy.ops.object.convert() beforehand — pass the raw data.

    Returns
    -------
    L_csr : scipy.sparse.csr_matrix, shape (N, N)
        Symmetric positive semi-definite cotangent Laplacian.
    M_diag : scipy.sparse.dia_matrix, shape (N, N)
        Diagonal lumped barycentric mass matrix.
    """
    N = len(mesh.vertices)
    vco = np.array([v.co[:] for v in mesh.vertices])

    L_acc = lil_matrix((N, N), dtype=np.float64)
    M_area = np.zeros(N, dtype=np.float64)

    for face in mesh.polygons:
        vi = list(face.vertices)
        area = face.calc_area()
        for idx in vi:
            M_area[idx] += area / 3.0
        # Cotangent weight for each edge: sum cot(opposite angle)/2 from both tris
        for k in range(3):
            i_opp = vi[(k + 1) % 3]
            j_opp = vi[(k + 2) % 3]
            u = vco[i_opp] - vco[vi[k]]
            v = vco[j_opp] - vco[vi[k]]
            cos_a = float(np.dot(u, v))
            sin_a = float(np.linalg.norm(np.cross(u, v)))
            cot = cos_a / sin_a if sin_a > 1e-14 else 0.0
            L_acc[i_opp, j_opp] += cot * 0.5
            L_acc[j_opp, i_opp] += cot * 0.5

    diag_vals = np.array(L_acc.sum(axis=1)).ravel()
    L_csr = diags(diag_vals) - L_acc.tocsr()
    M_diag = diags(M_area)
    return L_csr, M_diag


def compute_eigenmodes(L, M, k=8, tol=1e-8):
    """
    Compute the first k non-trivial eigenmodes of the generalised problem L φ = λ M φ.

    The trivial zero mode (constant function, λ ≈ 0) is always discarded.

    Parameters
    ----------
    L : sparse matrix — cotangent Laplacian (PSD)
    M : sparse matrix — lumped mass matrix (diagonal PSD)
    k : int — number of eigenmodes to return (default 8)
    tol : float — eigsh convergence tolerance (default 1e-8)

    Returns
    -------
    eigenvalues  : np.ndarray, shape (k,)
    eigenvectors : np.ndarray, shape (N, k)  — columns are eigenvectors
    """
    vals, vecs = eigsh(L, M=M, k=k + 1, which="SM", tol=tol, maxiter=20_000)
    order = np.argsort(vals)
    vals = vals[order]
    vecs = vecs[:, order]
    # Discard mode 0 (λ ≈ 0, constant eigenvector)
    return vals[1:k + 1], vecs[:, 1:k + 1]
