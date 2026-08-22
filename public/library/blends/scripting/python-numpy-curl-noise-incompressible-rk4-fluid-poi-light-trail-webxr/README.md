# Curl Noise — Spectral Vector Potential, ∇×ψ Incompressible Field & RK4 Particle Advection for Poi Light Trails

**Blender 5.1 · Python · numpy · CC0**

Produces 40 divergence-free poi light-trail NURBS curves that swirl like
smoke filaments — guaranteed never to converge to sinks or diverge from
sources.

## Theory

Bridson, Houriham & Nordenstam (SIGGRAPH 2007) pointed out a simple fact
from vector calculus: `div(curl ψ) = 0` for any smooth potential `ψ`.  So
instead of solving the full incompressible Navier–Stokes equations, you can
just *define* your velocity field as the curl of a potential you build from
noise.  The incompressibility is free — it is a mathematical identity.

The potential field is synthesised in the Fourier domain with a 1/|k|²
power spectrum (Brownian noise), then IFFT'd to real space.  Taking the curl
via `np.gradient` gives a velocity field with a Kolmogorov-like energy
spectrum.  Particles are integrated through this field using 4th-order
Runge-Kutta.

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Run in Blender Scripting workspace — builds scene, exports GLB |
| `record.py` | Camera-animation render → `viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for `screen.mp4` |
| `.expected-artefacts.json` | Expected output manifest |

## Quick start

1. Open Blender 5.1.
2. Scripting workspace → New → paste `blueprint.py` → Run Script.
3. Find `hf_curl_noise_poi.glb` next to the `.blend`.

## Parameters to experiment with

| Parameter | Default | Effect |
|-----------|---------|--------|
| `POWER_LAW` | `2.0` | Higher → smoother, lazier spirals; lower → chaotic, tangled |
| `N_PARTICLES` | `40` | More trails → denser cloud |
| `T_STEPS` | `120` | Longer paths |
| `DT` | `0.04` | Smaller → more accurate but slower |
| `SPEED_SCALE` | `0.8` | Overall swirl intensity |
| `GRID_RES` | `48` | Higher → finer vortex detail, but more RAM |

## Artefacts

- `hf_curl_noise_poi.glb` — 40 NURBS tube curves, emissive cyan, Draco L6
- `viewport.mp4` — 8 s camera orbit through the trail cloud
- `screen.mp4` — screen recording of the scripting session

## Attribution

- Bridson, R., Houriham, J. & Nordenstam, M. (2007). "Turbulence without tears:
  Incompressible noise for stochastic simulations." *ACM SIGGRAPH 2007 Papers*.
  Mathematical algorithm — public domain.
- NumPy Developers. *NumPy*. BSD-3-Clause. <https://numpy.org>
