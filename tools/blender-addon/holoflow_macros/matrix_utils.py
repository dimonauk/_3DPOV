"""
holoflow_macros/matrix_utils.py
Reusable mathutils.Matrix helpers for Holoflow Studio scripts.
CC0 — No rights reserved.

Import within Blender's Script Editor:
    import sys, pathlib
    sys.path.insert(0, str(pathlib.Path(bpy.utils.script_path_user()) / "addons" / "holoflow_macros"))
    from matrix_utils import compose_trs, pivot_rotate, mat_to_threejs
"""

import math
from mathutils import Matrix, Vector, Quaternion

# Blender (+Y up, −Y forward) → THREE.js (+Y up, +Z forward).
# Applied before converting a matrix to THREE.js column-major float[16].
BLENDER_TO_THREEJS: Matrix = Matrix.Rotation(math.radians(90), 4, 'X')


def compose_trs(t: Vector, r: Quaternion, s: Vector) -> Matrix:
    """Build a 4×4 TRS matrix without touching object.location/rotation/scale."""
    T = Matrix.Translation(t)
    R = r.to_matrix().to_4x4()
    S = Matrix.Diagonal((*s, 1.0))
    return T @ R @ S


def decompose_safe(mat: Matrix) -> tuple:
    """
    Decompose a 4×4 matrix into (translation, quaternion, scale).
    Returns identity rotation if scale is near-zero (degenerate matrix).
    """
    t, r, s = mat.decompose()
    if s.length < 1e-9:
        r = Quaternion()
    return t, r, s


def pivot_rotate(ob, pivot: Vector, axis: Vector, angle_rad: float) -> None:
    """Rotate *ob* in world space around an arbitrary pivot point."""
    R          = Matrix.Rotation(angle_rad, 4, axis.normalized())
    T_to_org   = Matrix.Translation(-pivot)
    T_from_org = Matrix.Translation(pivot)
    ob.matrix_world = (T_from_org @ R @ T_to_org) @ ob.matrix_world


def world_to_local(ob, world_point: Vector) -> Vector:
    """Convert a world-space point to ob's local coordinate space."""
    return ob.matrix_world.inverted() @ world_point


def local_to_world(ob, local_point: Vector) -> Vector:
    """Convert ob's local-space point to world coordinates."""
    return ob.matrix_world @ local_point


def mat_to_threejs(mat: Matrix) -> list:
    """Return a THREE.js-ready column-major float[16] from a Blender matrix."""
    converted = BLENDER_TO_THREEJS @ mat
    return [v for row in converted.transposed() for v in row]


def mat_lerp(a: Matrix, b: Matrix, t: float) -> Matrix:
    """
    Linearly interpolate two matrices element-wise (not SLERP).
    Good for colour/scale blending; for rotation use Quaternion.slerp instead.
    """
    result = Matrix()
    for r in range(4):
        for c in range(4):
            result[r][c] = a[r][c] * (1.0 - t) + b[r][c] * t
    return result
