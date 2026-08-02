"""
holoflow_macros/gray_scott_field.py
Reusable Gray-Scott simulation core for use inside the Holoflow addon.
CC0 — Holoflow Studio 2026

Provides `run_gray_scott(n, steps, Du, Dv, f, k)` returning (U, V) grids.
Import from other macros or call from a panel operator.
"""

import numpy as np


def _laplacian(field: np.ndarray) -> np.ndarray:
    """5-point periodic Laplacian — O(N²) with numpy roll, no loop overhead."""
    return (
        np.roll(field, +1, axis=0) + np.roll(field, -1, axis=0) +
        np.roll(field, +1, axis=1) + np.roll(field, -1, axis=1) -
        4.0 * field
    )


def run_gray_scott(
    n: int = 64,
    steps: int = 6000,
    Du: float = 0.210,
    Dv: float = 0.105,
    f: float = 0.035,
    k: float = 0.060,
    dt: float = 1.0,
    seed_radius: int = 3,
    rng_seed: int = 42,
) -> tuple[np.ndarray, np.ndarray]:
    """Integrate Gray-Scott PDEs and return (U, V) concentration grids.

    Parameters
    ----------
    n : grid size (n×n); 64 is fast, 128 gives finer pattern detail.
    steps : integration depth; 4000 sufficient for spots, 6000+ for mazes.
    Du / Dv : diffusion coefficients; keep Dv < Du for Turing instability.
    f : substrate feed rate; controls pattern type together with k.
    k : activator kill rate.
    dt : explicit-Euler time step; stable when dt·Du < 0.5 (with dx=1).
    seed_radius : half-width of central V seed (grid cells).
    rng_seed : reproducible random state for the sparse noise perturbation.

    Pearson (1993) regimes
    ----------------------
    spots    f=0.035  k=0.060
    stripes  f=0.035  k=0.065
    mazes    f=0.040  k=0.060
    worms    f=0.062  k=0.061
    """
    rng = np.random.default_rng(rng_seed)
    U = np.ones((n, n), dtype=np.float64)
    V = np.zeros((n, n), dtype=np.float64)

    cx, cy = n // 2, n // 2
    U[cx-seed_radius:cx+seed_radius, cy-seed_radius:cy+seed_radius] = 0.50
    V[cx-seed_radius:cx+seed_radius, cy-seed_radius:cy+seed_radius] = 0.25

    pts = rng.integers(0, n, size=(n // 4, 2))
    V[pts[:, 0], pts[:, 1]] += rng.uniform(0.01, 0.05, size=n // 4)
    np.clip(U, 0, 1, out=U)
    np.clip(V, 0, 1, out=V)

    for _ in range(steps):
        lap_U = _laplacian(U)
        lap_V = _laplacian(V)
        uvv = U * V * V
        U += dt * (Du * lap_U - uvv + f * (1.0 - U))
        V += dt * (Dv * lap_V + uvv - (f + k) * V)
        np.clip(U, 0, 1, out=U)
        np.clip(V, 0, 1, out=V)

    return U, V


# ── quick test when run directly (not inside Blender) ──────────
if __name__ == "__main__":
    U, V = run_gray_scott(n=32, steps=500)
    print(f"V range: {V.min():.4f} – {V.max():.4f}")
    print("OK" if V.max() > 0.05 else "WARNING: no pattern formed")
