# Heat Method for Geodesic Distance — Crane et al. 2013

**Blender 5.1 | Python + scipy.sparse | CC0**

Implements the "Geodesics in Heat" algorithm (Crane, de Goes, Desbrun & Alliez,
ACM Trans. Graphics 2013) to compute intrinsic geodesic distances on a
triangle mesh entirely inside Blender's Python environment.

## What it builds

A subdivided icosphere (poi-head scale, radius 0.18 m) with:
- **GeodesicDist** vertex colour attribute — plasma isoline rings centred on the
  north-pole source vertex, each ring one unit of geodesic distance apart
- **Wave01–Wave05** shape keys — radial push wavefront propagating from source
- Emission material driven by vertex colour, WebXR-ready GLB export

## Algorithm in three steps

| Step | Equation | Meaning |
|------|----------|---------|
| Heat flow | (M − t·L) u = δₛ | Diffuse heat from source vertex |
| Normalise | X = −∇u / \|∇u\| | Unit gradient pointing away from source |
| Poisson | L φ = ∇·X | Recover distance from gradient divergence |

`t = h²` where `h` = mean edge length — Crane's theoretically motivated step size.

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Full implementation — run in Blender Scripting workspace |
| `record.py` | Animated viewport render → `viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for `screen.mp4` |
| `hf_geodesic_heat.glb` | Generated GLB for WebXR (Draco-6) |

## How to run

1. Open Blender 5.1, new file, delete default cube.
2. Switch to **Scripting** workspace.
3. Open `blueprint.py`, click **Run Script**.
4. Open `record.py`, click **Run Script** (writes `viewport.mp4`).

## Dependencies

- `scipy` — pre-installed on most Blender Python builds; otherwise
  install via Blender's bundled pip:
  `<blender>/python/bin/python -m pip install scipy`

## Licence

CC0 — no rights reserved. Algorithm credit: Crane, de Goes, Desbrun & Alliez (2013).
