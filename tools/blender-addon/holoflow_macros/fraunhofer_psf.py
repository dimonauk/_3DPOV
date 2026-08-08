"""
holoflow_macros.fraunhofer_psf
Reusable helpers for Fraunhofer diffraction PSF computation.
Blender 5.1 | CC0 | Holoflow Studio

Usage:
    from holoflow_macros.fraunhofer_psf import circular_pupil, hexagonal_pupil, annular_pupil, compute_log_psf
    psf = compute_log_psf(circular_pupil(512))
"""

import math
import numpy as np


def circular_pupil(n: int, r: float = 0.45) -> np.ndarray:
    """Hard-edged circular aperture on an n×n grid normalised to [-1,1)."""
    c = np.linspace(-1.0, 1.0, n, endpoint=False)
    xx, yy = np.meshgrid(c, c)
    return (np.hypot(xx, yy) <= r).astype(np.float64)


def hexagonal_pupil(n: int, r: float = 0.43) -> np.ndarray:
    """
    Regular flat-top hexagon pupil.
    L∞ norm on hexagonal lattice: max(|x|, |x/2+√3y/2|, |x/2-√3y/2|) ≤ r.
    Produces 6-spike PSF (JWST / Keck primary mirror pattern).
    """
    c = np.linspace(-1.0, 1.0, n, endpoint=False)
    xx, yy = np.meshgrid(c, c)
    s3h = math.sqrt(3) / 2.0
    p0 = np.abs(xx)
    p1 = np.abs(0.5 * xx + s3h * yy)
    p2 = np.abs(0.5 * xx - s3h * yy)
    return (np.maximum(p0, np.maximum(p1, p2)) <= r).astype(np.float64)


def annular_pupil(n: int, r_outer: float = 0.45, eps: float = 0.35) -> np.ndarray:
    """
    Annular aperture: outer circle minus central obstruction of ratio eps.
    Models Cassegrain telescopes (secondary mirror blocks the centre).
    eps = r_inner / r_outer; JWST ≈ 0.10, Hubble ≈ 0.33.
    """
    c = np.linspace(-1.0, 1.0, n, endpoint=False)
    xx, yy = np.meshgrid(c, c)
    R = np.hypot(xx, yy)
    return ((R <= r_outer) & (R >= r_outer * eps)).astype(np.float64)


def compute_log_psf(
    aperture: np.ndarray,
    mesh_n: int = 96,
    zoom_frac: float = 0.12,
) -> np.ndarray:
    """
    Compute a log-scaled, normalised PSF cropped to mesh_n × mesh_n.

    Pipeline:
    1. Zero-pad to 2N (separates periodic replicas by one Rayleigh range).
    2. 2D FFT + fftshift — DC at centre.
    3. Intensity I = |F|², normalised to peak.
    4. Log compress: 10 log₁₀(I + 1e-7) → [0, 1].
    5. Crop ± zoom_frac × N bins, subsample to mesh_n × mesh_n.

    Parameters
    ----------
    aperture   : binary mask, shape (N, N)
    mesh_n     : output vertex count per axis
    zoom_frac  : half-width of PSF crop as fraction of N
    """
    n = aperture.shape[0]
    padded = np.zeros((2 * n, 2 * n), dtype=np.float64)
    padded[n // 2 : n // 2 + n, n // 2 : n // 2 + n] = aperture

    F = np.fft.fftshift(np.fft.fft2(padded))
    intensity = np.abs(F) ** 2
    intensity /= intensity.max()

    log_I = 10.0 * np.log10(intensity + 1e-7)
    log_I -= log_I.min()
    log_I /= log_I.max()

    cx, cy = n, n
    half = max(int(zoom_frac * n), mesh_n // 2 + 1)
    crop = log_I[cx - half : cx + half, cy - half : cy + half]

    step = max(1, crop.shape[0] // mesh_n)
    return crop[::step, ::step][:mesh_n, :mesh_n].copy()
