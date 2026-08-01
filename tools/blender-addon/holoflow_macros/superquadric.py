"""
holoflow_macros/superquadric.py — reusable superquadric surface generator.

Usage:
    from holoflow_macros.superquadric import sq_verts, build_superquadric
"""

import math
import numpy as np
import bpy


def _fexp(s: np.ndarray, e: float) -> np.ndarray:
    """Signed power: sgn(s)·|s|^e. Safe for negative bases."""
    return np.sign(s) * np.abs(s) ** e


def sq_verts(radius: float, e1: float, e2: float, nu: int, nv: int) -> np.ndarray:
    """
    Return float32 (nu+1)×(nv+2) superquadric vertex positions.
    Poles at v=±π/2 are included as separate rows.
    """
    v = np.linspace(-math.pi / 2, math.pi / 2, nv + 2)
    u = np.linspace(-math.pi, math.pi, nu + 1)
    vv, uu = np.meshgrid(v, u, indexing="ij")
    x = radius * _fexp(np.cos(vv), e1) * _fexp(np.cos(uu), e2)
    y = radius * _fexp(np.cos(vv), e1) * _fexp(np.sin(uu), e2)
    z = radius * _fexp(np.sin(vv), e1)
    return np.column_stack([x.ravel(), y.ravel(), z.ravel()]).astype(np.float32)


def build_superquadric(
    name: str,
    radius: float = 0.55,
    e1: float = 1.0,
    e2: float = 1.0,
    nu: int = 48,
    nv: int = 24,
) -> bpy.types.Object:
    """
    Build and link a superquadric mesh object.  Flat-shaded for faceted look.
    Returns the object; caller links material / shape keys.
    """
    verts_np = sq_verts(radius, e1, e2, nu, nv)
    n_lat = nv + 2
    n_lon = nu + 1
    faces = [
        (ri * n_lon + ci, ri * n_lon + ci + 1,
         (ri + 1) * n_lon + ci + 1, (ri + 1) * n_lon + ci)
        for ri in range(n_lat - 1)
        for ci in range(n_lon - 1)
    ]
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata([tuple(v) for v in verts_np], [], faces)
    for p in mesh.polygons:
        p.use_smooth = False
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    return obj
