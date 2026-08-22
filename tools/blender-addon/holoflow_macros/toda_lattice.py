"""
holoflow_macros/toda_lattice.py
Reusable Toda-lattice integrator for Blender 5.1 scripting sessions.

API:
  from holoflow_macros.toda_lattice import integrate_toda, make_toda_disc

integrate_toda(N, T_STEPS, dt, ic_q, ic_p) -> np.ndarray (T_STEPS × N)
  Integrate the Toda lattice (periodic BC) using 4th-order Runge-Kutta.
  Returns the displacement field Δqₙ(t) = qₙ(t) − qₙ(0).

make_toda_disc(snaps, R_in, R_out, disp_scale) -> (verts, faces)
  Build polar-grid mesh data from a (T, N) displacement array.

ic_2soliton(N, kappa1, kappa2, n1_frac, n2_frac) -> (q0, p0)
ic_1soliton(N, kappa) -> (q0, p0)
ic_phonon(N, kappa, k_mode) -> (q0, p0)
  Standard initial conditions.
"""

import numpy as np

__all__ = [
    "integrate_toda",
    "make_toda_disc",
    "ic_2soliton",
    "ic_1soliton",
    "ic_phonon",
]


# ── CORE DYNAMICS ──────────────────────────────────────────────────────────

def _toda_force(q: np.ndarray) -> np.ndarray:
    """
    Fₙ = exp(−(qₙ−qₙ₋₁)) − exp(−(qₙ₊₁−qₙ))   (periodic BC).

    WHY np.roll works: r[n] = q[(n+1)%N] − q[n]  via np.roll(q,-1)−q.
    Then r_left[n] = r[(n−1)%N]  via np.roll(r,+1).
    Force = exp(−r_left) − exp(−r).
    """
    r = np.roll(q, -1) - q
    return np.exp(-np.roll(r, 1)) - np.exp(-r)


def _rk4_step(q: np.ndarray, p: np.ndarray, dt: float):
    """Standard 4th-order Runge-Kutta step for Hamiltonian system."""
    def f(q, p): return _toda_force(q)
    k1q, k1p = p, f(q, p)
    k2q, k2p = p + 0.5*dt*k1p,  f(q + 0.5*dt*k1q, p + 0.5*dt*k1p)
    k3q, k3p = p + 0.5*dt*k2p,  f(q + 0.5*dt*k2q, p + 0.5*dt*k2p)
    k4q, k4p = p + dt*k3p,       f(q +     dt*k3q, p +     dt*k3p)
    return (q + dt/6*(k1q + 2*k2q + 2*k3q + k4q),
            p + dt/6*(k1p + 2*k2p + 2*k3p + k4p))


def integrate_toda(
    N: int,
    T_STEPS: int,
    dt: float,
    ic_q: np.ndarray,
    ic_p: np.ndarray,
) -> np.ndarray:
    """
    Integrate the periodic N-particle Toda lattice for T_STEPS RK4 steps.

    Parameters
    ----------
    N        : number of particles
    T_STEPS  : number of snapshots (one per RK4 step)
    dt       : time step
    ic_q, ic_p : initial conditions, shape (N,)

    Returns
    -------
    snaps : ndarray of shape (T_STEPS, N)
        Displacement field Δqₙ(t) = qₙ(t) − qₙ(0).
    """
    q, p = ic_q.copy(), ic_p.copy()
    q0   = q.copy()
    snaps = np.empty((T_STEPS, N), dtype=float)
    for t in range(T_STEPS):
        snaps[t] = q - q0
        q, p = _rk4_step(q, p, dt)
    return snaps


# ── MESH BUILDER ───────────────────────────────────────────────────────────

def make_toda_disc(
    snaps: np.ndarray,
    R_in: float  = 0.015,
    R_out: float = 0.060,
    disp_scale: float = 0.018,
):
    """
    Build (verts, faces) for a polar grid from a (T, N) displacement field.

    Mapping:
      azimuth φₙ = 2π·n / N   (particle index → angle)
      radius  rₜ  = R_in + (R_out−R_in)·t/(T−1)
      height  z    = disp_scale · snaps[t, n]

    Returns: (list_of_tuples, list_of_tuples)
    """
    T, N = snaps.shape
    phis  = 2 * np.pi * np.arange(N) / N
    radii = np.linspace(R_in, R_out, T)

    verts, faces = [], []
    vid = np.empty((T, N), dtype=int)

    for t in range(T):
        r = radii[t]
        for n in range(N):
            phi = phis[n]
            z   = snaps[t, n] * disp_scale
            vid[t, n] = len(verts)
            verts.append((r * np.cos(phi), r * np.sin(phi), z))

    for t in range(T - 1):
        for n in range(N):
            np1 = (n + 1) % N
            faces.append((vid[t, n], vid[t, np1],
                          vid[t+1, np1], vid[t+1, n]))

    return verts, faces


# ── INITIAL CONDITIONS ─────────────────────────────────────────────────────

def ic_2soliton(
    N: int,
    kappa1: float = 0.80,
    kappa2: float = 0.32,
    n1_frac: float = 0.25,
    n2_frac: float = 0.75,
):
    """Two momentum humps; fast soliton catches slow over the ring."""
    idx = np.arange(N, dtype=float)
    n1, n2 = N * n1_frac, N * n2_frac
    p = (kappa1 / np.cosh(kappa1 * (idx - n1))**2 +
         kappa2 / np.cosh(kappa2 * (idx - n2))**2)
    return np.zeros(N), p


def ic_1soliton(N: int, kappa: float = 0.80, n0_frac: float = 0.5):
    """Single soliton at the centre of the chain."""
    idx = np.arange(N, dtype=float)
    n0  = N * n0_frac
    p   = kappa / np.cosh(kappa * (idx - n0))**2
    return np.zeros(N), p


def ic_phonon(N: int, kappa: float = 0.10, k_mode: int = 2):
    """
    Small-amplitude sinusoidal wave (linearised phonon).
    Frequency ω_k = 2|sin(πk/N)|; amplitude kappa ≪ 1 for linearity.
    """
    idx = np.arange(N, dtype=float)
    p   = kappa * np.sin(2 * np.pi * k_mode * idx / N)
    return np.zeros(N), p
