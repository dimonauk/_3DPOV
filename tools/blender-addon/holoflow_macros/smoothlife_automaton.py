"""
holoflow_macros/smoothlife_automaton.py — Reusable SmoothLife helper
Blender 5.1 | CC0 | Holoflow Studio

A standalone callable that runs SmoothLife and returns the frame list.
Import from other scripts:
    from holoflow_macros.smoothlife_automaton import run_smoothlife, SmoothLifeParams
"""

from dataclasses import dataclass
from typing import List
import numpy as np


@dataclass
class SmoothLifeParams:
    """Named-constant bundle for one SmoothLife configuration."""
    grid_w:     int   = 128
    grid_h:     int   = 128
    ri:         float = 7.0    # inner disk radius
    ra_factor:  float = 3.0    # outer = ri * ra_factor
    b1:         float = 0.278  # birth lower threshold
    b2:         float = 0.365  # birth upper threshold
    s1:         float = 0.267  # survival lower threshold
    s2:         float = 0.445  # survival upper threshold
    alpha_n:    float = 0.028  # softness for inner state sigmoid
    alpha_m:    float = 0.147  # softness for outer neighbourhood sigmoid
    dt:         float = 0.10   # Euler step
    warm_steps: int   = 600    # burn-in before first capture
    key_steps:  int   = 400    # steps between captures
    n_frames:   int   = 8      # number of snapshots
    seed:       int   = 42


def _sigma(x, a, alpha):
    return 1.0 / (1.0 + np.exp(-4.0 * (x - a) / alpha))


def _sigma2(x, a, b, alpha):
    return _sigma(x, a, alpha) * (1.0 - _sigma(x, b, alpha))


def _make_kernels(p: SmoothLifeParams):
    h, w    = p.grid_h, p.grid_w
    cy, cx  = h // 2, w // 2
    dist    = np.sqrt(
        (np.arange(w, dtype=np.float64) - cx)[np.newaxis, :] ** 2 +
        (np.arange(h, dtype=np.float64) - cy)[:, np.newaxis] ** 2
    )
    ra      = p.ri * p.ra_factor
    k_in    = (dist < p.ri).astype(np.float64)
    k_out   = ((dist >= p.ri) & (dist < ra)).astype(np.float64)
    k_in   /= k_in.sum()
    k_out  /= k_out.sum()

    def _shift(k):
        return np.roll(np.roll(k, -cy, axis=0), -cx, axis=1)

    return np.fft.rfft2(_shift(k_in)), np.fft.rfft2(_shift(k_out))


def _step(s, ki_fft, ko_fft, p: SmoothLifeParams):
    sf    = np.fft.rfft2(s)
    n_avg = np.fft.irfft2(sf * ki_fft, s=s.shape)
    m_avg = np.fft.irfft2(sf * ko_fft, s=s.shape)
    alive = _sigma(n_avg, 0.5, p.alpha_n)
    f_b   = _sigma2(m_avg, p.b1, p.b2, p.alpha_m)
    f_s   = _sigma2(m_avg, p.s1, p.s2, p.alpha_m)
    f     = f_b * (1.0 - alive) + f_s * alive
    np.clip(s + p.dt * (2.0 * f - 1.0), 0.0, 1.0, out=s)
    return s


def run_smoothlife(params: SmoothLifeParams = None) -> List[np.ndarray]:
    """
    Run SmoothLife and return a list of GRID_H × GRID_W float64 arrays,
    one per captured snapshot.  Suitable for feeding into a Blender mesh
    builder or any downstream numpy pipeline.
    """
    if params is None:
        params = SmoothLifeParams()
    p = params

    rng = np.random.default_rng(seed=p.seed)
    s   = np.zeros((p.grid_h, p.grid_w), dtype=np.float64)
    for _ in range(12):
        cy = rng.integers(int(p.ri), p.grid_h - int(p.ri))
        cx = rng.integers(int(p.ri), p.grid_w - int(p.ri))
        ri_i = int(p.ri)
        for dy in range(-ri_i, ri_i + 1):
            for dx in range(-ri_i, ri_i + 1):
                if dx*dx + dy*dy < p.ri*p.ri:
                    s[(cy + dy) % p.grid_h, (cx + dx) % p.grid_w] = rng.uniform(0.5, 1.0)
    s += rng.uniform(-0.01, 0.01, (p.grid_h, p.grid_w))
    np.clip(s, 0.0, 1.0, out=s)

    ki, ko = _make_kernels(p)

    for _ in range(p.warm_steps):
        s = _step(s, ki, ko, p)

    frames = []
    for _ in range(p.n_frames):
        frames.append(s.copy())
        for _ in range(p.key_steps):
            s = _step(s, ki, ko, p)

    return frames
