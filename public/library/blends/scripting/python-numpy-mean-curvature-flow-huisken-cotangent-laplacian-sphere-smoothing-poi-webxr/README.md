# Discrete Mean-Curvature Flow — Huisken 1984

**Blender 5.1 · Python scripting · NumPy · Holoflow Studio**

Gerhard Huisken proved in 1984 that any smooth, compact, convex surface
evolves under the PDE ∂X/∂t = H·n (mean-curvature flow, MCF) to a round
sphere — shrinking to a point in finite time while remaining convex
throughout.  This script implements the discrete cotangent-Laplacian
formulation on a noise-perturbed icosphere (4 subdivisions: 2 562 vertices,
5 120 triangles) and records five shape keys that show the flow in action.

## Contents

| File | Description |
|------|-------------|
| `blueprint.py` | Production script — run once inside Blender 5.1 |
| `record.py` | Viewport animation render (180 frames, EEVEE Next) |
| `SCREEN-RECORDING-NOTES.md` | OBS / Game Bar capture instructions |
| `.expected-artefacts.json` | Build manifest with cross-references |

## Algorithm

1. **Cotangent Laplacian** — for each face vertex acting as the "tip", the
   cotangent of its interior angle is `dot(u,v) / |u×v|`.  Half of this
   weight is scattered (via `np.add.at`) to both endpoints of the opposite
   edge, building the degree vector D and weighted-position sum WX without
   any sparse-matrix library.

2. **Discrete H·n** — `L_cot(X)_i / (2 A_i)` where A_i is the mixed
   Voronoi area around vertex i (one-third of each adjacent face area).

3. **Explicit Euler** — `X ← X + dt · H·n` with `dt = 0.0015`.  After
   each step the mean vertex radius is restored so the sphere does not
   collapse to zero (a visualisation convenience that does not alter the
   shape of the flow).

4. **Shape keys** at steps 0 (noisy Basis), 50, 200, 500, 800 let a
   WebXR viewer scrub through the smoothing progression.

5. **MCF_Curvature** FLOAT_COLOR POINT attribute maps the initial
   |H·n| magnitude to a cobalt (low) → amber (high) gradient so the
   high-frequency noise regions are immediately visible.

## Licence

CC0-1.0 (public domain dedication).

## References

- Huisken G (1984) Flow by mean curvature of convex surfaces into spheres.
  *J Differential Geometry* 20, 237–266.
  <https://doi.org/10.4310/jdg/1214438998>
- Meyer M, Desbrun M, Schröder P, Barr AH (2003) Discrete differential-geometry
  operators for triangulated 2-manifolds. *Visualization and Mathematics III*,
  Springer, pp 35–57. <https://doi.org/10.1007/978-3-662-05105-4_2>
- NumPy (BSD-3-Clause) <https://numpy.org/>
