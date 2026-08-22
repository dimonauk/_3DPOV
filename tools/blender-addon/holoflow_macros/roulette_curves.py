"""
holoflow_macros/roulette_curves.py
Reusable roulette-curve geometry helpers — hypotrochoid, epitrochoid,
Bishop-frame tube.  Imported by blueprint.py and by the holoflow MCP adapter.

Blender 5.1 · CC0
"""

import math
import numpy as np


def sample_roulette(R: float, r: float, d: float, N: int,
                    roulette_type: str = "hypo") -> tuple:
    """Sample one closed period of a hypotrochoid or epitrochoid.

    Parameters
    ----------
    R              Fixed-circle radius.
    r              Rolling-circle radius.
    d              Pen-arm length (distance from rolling-circle centre to pen).
    N              Number of sample points (power of 2 recommended).
    roulette_type  'hypo' (rolling inside) or 'epi' (rolling outside).

    Returns
    -------
    x, y  numpy arrays of length N.

    Notes
    -----
    Closed-curve condition: the curve closes after q = r/gcd(R,r) revolutions
    of the rolling circle.  Period = 2π·q.  We always integrate exactly one
    closed period so downstream tube-mesh code needs no special seam handling.
    """
    g = math.gcd(int(round(R)), int(round(r)))
    period = 2.0 * math.pi * (r / g)
    t = np.linspace(0.0, period, N, endpoint=False)
    if roulette_type == "hypo":
        ratio = (R - r) / r
        x = (R - r) * np.cos(t) + d * np.cos(ratio * t)
        y = (R - r) * np.sin(t) - d * np.sin(ratio * t)
    else:
        ratio = (R + r) / r
        x = (R + r) * np.cos(t) - d * np.cos(ratio * t)
        y = (R + r) * np.sin(t) - d * np.sin(ratio * t)
    return x, y


def normalise_to_scale(x: np.ndarray, y: np.ndarray, target: float) -> tuple:
    """Centre on origin, uniform-scale so the max radius equals target."""
    x = x - x.mean()
    y = y - y.mean()
    r_max = np.hypot(x, y).max()
    s = target / r_max if r_max > 1e-9 else 1.0
    return x * s, y * s


def bishop_frame(pts3d: np.ndarray) -> tuple:
    """Parallel-transport (Bishop) frame for a closed 3-D curve.

    Parameters
    ----------
    pts3d  (N, 3) array of spine positions.

    Returns
    -------
    T, Nx, Bx  Each (N, 3).  T = tangent, Nx = normal, Bx = binormal.

    The end-correction step distributes residual twist uniformly so the
    frame is periodic (Nx[0] == Nx[N] up to floating-point tolerance),
    which is required for a seamless closed-tube mesh.
    """
    N = len(pts3d)
    T = np.zeros((N, 3))
    for i in range(N):
        T[i] = pts3d[(i + 1) % N] - pts3d[(i - 1) % N]
    norms = np.linalg.norm(T, axis=1, keepdims=True)
    T /= np.where(norms < 1e-12, 1.0, norms)

    seed = np.array([0.0, 0.0, 1.0])
    if abs(np.dot(T[0], seed)) > 0.99:
        seed = np.array([0.0, 1.0, 0.0])
    Nx = np.zeros((N, 3))
    Bx = np.zeros((N, 3))
    n0 = seed - np.dot(seed, T[0]) * T[0]
    n0 /= np.linalg.norm(n0)
    Nx[0] = n0
    Bx[0] = np.cross(T[0], n0)

    for i in range(1, N):
        c = np.dot(T[i - 1], T[i])
        if c > 0.99999:
            Nx[i] = Nx[i - 1]
        else:
            axis = np.cross(T[i - 1], T[i])
            axis /= max(np.linalg.norm(axis), 1e-12)
            angle = math.acos(min(max(c, -1.0), 1.0))
            Nx[i] = (Nx[i - 1] * math.cos(angle)
                     + np.cross(axis, Nx[i - 1]) * math.sin(angle)
                     + axis * np.dot(axis, Nx[i - 1]) * (1 - math.cos(angle)))
        Bx[i] = np.cross(T[i], Nx[i])

    # Closure correction
    dot = np.clip(np.dot(Nx[-1], Nx[0]), -1.0, 1.0)
    cross_z = np.dot(np.cross(Nx[-1], Nx[0]), T[0])
    residual = math.atan2(cross_z, dot)
    for i in range(N):
        theta = residual * i / N
        c, s = math.cos(theta), math.sin(theta)
        Nx[i] = c * Nx[i] + s * Bx[i]
        Bx[i] = np.cross(T[i], Nx[i])
    return T, Nx, Bx


def build_tube_verts(pts3d: np.ndarray, Nx: np.ndarray, Bx: np.ndarray,
                     tube_r: float, n_circ: int) -> list:
    """Circular cross-section vertices for a tube around pts3d."""
    verts = []
    for i in range(len(pts3d)):
        for j in range(n_circ):
            angle = 2.0 * math.pi * j / n_circ
            v = pts3d[i] + tube_r * (math.cos(angle) * Nx[i]
                                     + math.sin(angle) * Bx[i])
            verts.append(v.tolist())
    return verts


def build_tube_faces(N: int, n_circ: int) -> list:
    """Quad face list for the tube mesh (closed along both axes)."""
    faces = []
    for i in range(N):
        i1 = (i + 1) % N
        for j in range(n_circ):
            j1 = (j + 1) % n_circ
            faces.append((i * n_circ + j,
                           i * n_circ + j1,
                           i1 * n_circ + j1,
                           i1 * n_circ + j))
    return faces
