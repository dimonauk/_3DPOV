# Cotangent Laplacian Mesh Fairing — Blender 5.1

**Category:** scripting  
**Blender:** 5.1  
**Licence:** CC0  
**Python deps:** `scipy` (bundled in Blender 4.1+ via pip or Extensions Platform)

## What this builds

An icosphere deliberately deformed by Musgrave fBm noise, then faired with
two methods from digital geometry processing:

| Shape key | Method | Key parameter |
|-----------|--------|---------------|
| Taubin    | Taubin (1995) λ/μ filter, 8 rounds | λ=0.50, μ=−0.53 |
| Implicit  | Desbrun (1999) implicit flow | dt=1.0 |

A `dev_taubin` / `dev_implicit` POINT float attribute stores per-vertex
displacement from the original, driving the blue → amber emission colour ramp
in the material.

## Why cotangent over umbrella Laplacian

The umbrella Laplacian weights all one-ring neighbours equally.  For an
irregular mesh this biases smoothing toward dense regions — a high-valence
vertex pulls disproportionately.  The cotangent Laplacian derives its weights
from the discrete exterior calculus: edge (i,j) gets weight
`(cot α_ij + cot β_ij) / 2`, where α and β are the angles across that edge in
the two shared triangles.  This makes the discrete operator approximate the
continuous Laplace-Beltrami, so smoothing is isotropic with respect to the
surface metric.

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Main script — run in Blender Scripting workspace |
| `record.py` | Viewport render animation (run after blueprint.py) |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for screen.mp4 |
| `.expected-artefacts.json` | CI artefact manifest |

## Running

```bash
# install scipy into Blender's Python if not already present
# (Blender 4.1+ supports `pip install` via the Extensions platform)
# In Blender's Python Console:
import subprocess, sys
subprocess.run([sys.executable, "-m", "pip", "install", "scipy"])
```

Then open `blueprint.py` in the Scripting workspace and click **Run Script**.

## Artefacts produced

- `hf_fairing.glb` — sphere with 3 morph targets (Basis/Taubin/Implicit) + deviation colour
- `viewport.mp4` — 240-frame animated render (via record.py)
- `screen.mp4` — OBS screen capture (manual)

## Outside Sources

1. Desbrun, M., Meyer, M., Schröder, P., Barr, A. H. (1999). *Implicit Fairing
   of Irregular Meshes using Diffusion and Curvature Flow.* ACM SIGGRAPH 1999.
   Author PDF: http://multires.caltech.edu/pubs/ImplicitFairing.pdf
2. SciPy Contributors. *scipy.sparse.linalg* (BSD-3-Clause).
   https://docs.scipy.org/doc/scipy/reference/sparse.linalg.html
   — Related: https://github.com/scipy/scipy
3. geometry-central (MIT), N. Sharp. https://github.com/nmwsharp/geometry-central
   — Related: https://github.com/nmwsharp/polyscope
