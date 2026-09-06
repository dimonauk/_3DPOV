"""
holoflow_macros/anishchenko_astakhov_oscillator.py
===================================================
Reusable helper: integrate the Anishchenko–Astakhov self-excited oscillator
with inertial Heaviside nonlinearity, return waypoints + speed array.

Suitable for import by other macros or scripts that need a piecewise-smooth
chaotic trajectory without pulling in the full blueprint.

Licence: CC0 — public domain, no restrictions.
"""

import numpy as np


def heaviside(x: float) -> float:
    """Unit step function: 1 if x > 0, else 0."""
    return 1.0 if x > 0.0 else 0.0


def aa_deriv(state: np.ndarray, m: float, g: float) -> np.ndarray:
    """Vector field for the Anishchenko–Astakhov oscillator.

    Args:
        state: (x, y, z) current state
        m:     self-excitation parameter (bifurcation control)
        g:     inertial damping coefficient (z charging/decay rate)

    Returns:
        (dx/dt, dy/dt, dz/dt)
    """
    x, y, z = state
    th = heaviside(x)
    return np.array([
        m * x + y - x * z,         # ẋ = linear drive + velocity − inertial damp
        -x,                          # ẏ = harmonic restoring force
        -g * z + g * th * x * x,   # ż = inertial variable (charges when x > 0)
    ])


def rk4_step(state: np.ndarray, dt: float, m: float, g: float) -> np.ndarray:
    """One RK4 step; Heaviside evaluated at each intermediate state."""
    k1 = aa_deriv(state,              m, g)
    k2 = aa_deriv(state + 0.5*dt*k1, m, g)
    k3 = aa_deriv(state + 0.5*dt*k2, m, g)
    k4 = aa_deriv(state + dt   *k3,  m, g)
    return state + (dt / 6.0) * (k1 + 2.0*k2 + 2.0*k3 + k4)


def integrate(
    m: float = 1.5,
    g: float = 0.4,
    dt: float = 0.010,
    burn_in: int = 5_000,
    n_steps: int = 90_000,
    thin: int = 30,
    ic: tuple = (0.1, 0.1, 0.0),
) -> tuple[np.ndarray, np.ndarray]:
    """Integrate the AA oscillator and return thinned waypoints + speed.

    Returns:
        pts:   (N, 3) float64 array of waypoints in attractor coordinates
        speed: (N,)   float64 array of |ẋ| at each waypoint
    """
    n_wp  = n_steps // thin
    pts   = np.empty((n_wp, 3))
    speed = np.empty(n_wp)
    state = np.array(ic, dtype=float)

    for _ in range(burn_in):
        state = rk4_step(state, dt, m, g)

    i_wp = 0
    for step in range(n_steps):
        if step % thin == 0 and i_wp < n_wp:
            pts[i_wp]   = state
            speed[i_wp] = float(np.linalg.norm(aa_deriv(state, m, g)))
            i_wp += 1
        state = rk4_step(state, dt, m, g)

    return pts, speed
