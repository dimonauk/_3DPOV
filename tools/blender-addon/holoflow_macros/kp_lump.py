"""
holoflow_macros/kp_lump.py
──────────────────────────
Reusable helper: exact KP-I lump soliton field (Manakov et al. 1977).

The Kadomtsev–Petviashvili equation (KP-I variant):
    ( u_t  +  6u·u_x  +  u_xxx )_x  −  u_yy  =  0

1-lump exact solution via tau-function u = 2∂²_x ln τ:
    τ = (x − vt)²  +  y²  +  C²,   v = 3/C²

    u(x, y, t)  =  4·(C² + y² − (x−vt)²)
                   ─────────────────────────────
                   (C² + y² + (x−vt)²)²

Import from blueprint.py or any Blender Python session:
    from holoflow_macros.kp_lump import kp_lump_u, kp_lump_height_field

Licence: CC0 (mathematical content PD, implementation CC0)
Outside source: Manakov SV et al. 1977 Physics Letters A 63:205-206 PD
"""

import numpy as np


def kp_lump_u(
    x: "np.ndarray",
    y: "np.ndarray",
    t: float,
    c: float = 1.0,
    x0: float = 0.0,
    y0: float = 0.0,
) -> "np.ndarray":
    """
    Compute the KP-I lump soliton field at arrays x, y and scalar time t.

    Parameters
    ----------
    x, y  : numpy arrays of shape (Nx, Ny) (or broadcastable).
    t     : time (scalar).
    c     : width parameter C > 0.
              Peak amplitude = 4/C²; velocity v = 3/C².
    x0, y0: lump centre offset at t=0.

    Returns
    -------
    u     : numpy array, same shape as x / y.

    Notes
    -----
    The bilinear constraint v = 3/C² is automatically satisfied.
    No finite-difference approximation — this is the exact closed form.
    Algebraic decay: u → 4C²/r² for large r = sqrt((x-vt)²+y²).
    """
    v   = 3.0 / c ** 2
    Xi  = x - x0 - v * t         # co-moving x coordinate
    Yi  = y - y0
    tau = c ** 2 + Yi ** 2 + Xi ** 2
    return 4.0 * (c ** 2 + Yi ** 2 - Xi ** 2) / tau ** 2


def kp_lump_height_field(
    nx: int = 128,
    ny: int = 128,
    domain_x: tuple = (-8.0, 8.0),
    domain_y: tuple = (-5.0, 5.0),
    t: float = 0.0,
    c: float = 1.0,
    height_scale: float = 0.45,
) -> "tuple[np.ndarray, np.ndarray, np.ndarray]":
    """
    Return (xs, ys, zs) arrays for a height-field grid at time t.

    xs, ys : 1D coordinate arrays of length nx and ny respectively.
    zs     : 2D height array of shape (nx, ny) in Blender units.

    Example usage in a blueprint::

        from holoflow_macros.kp_lump import kp_lump_height_field
        xs, ys, zs = kp_lump_height_field(t=0.0, c=1.0)
        # build bpy mesh from xs, ys, zs …
    """
    xs = np.linspace(*domain_x, nx)
    ys = np.linspace(*domain_y, ny)
    XX, YY = np.meshgrid(xs, ys, indexing="ij")
    u  = kp_lump_u(XX, YY, t, c=c)
    zs = u * height_scale
    return xs, ys, zs


# ── quick self-test ───────────────────────────────────────────────────────────
if __name__ == "__main__":
    xs, ys, zs = kp_lump_height_field(t=0.0, c=1.0)
    peak = float(zs.max())
    print(f"KP lump (c=1, t=0): peak z = {peak:.4f} m  "
          f"(expected {4.0*0.45:.4f} = 1.8000 m)")
    assert abs(peak - 1.8) < 0.01, f"Unexpected peak: {peak}"
    print("kp_lump macro self-test passed.")
