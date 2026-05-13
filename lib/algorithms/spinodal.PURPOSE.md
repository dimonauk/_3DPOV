# `spinodal.ts` — purpose twin

## Role

Solves a 2D Cahn-Hilliard PDE on a 96×96 toroidal grid and lifts the
final phase field into a heightmap relief. Fills the `spinodal` slot
(catalogue id 27) in the 30-algorithm registry.

## Public surface

- `SpinodalParams` — alias of `CommonParams`. `complexity` drives the
  number of time steps (150 → 400); `density` scales the relief
  amplitude.
- `defaultParams()` — `{ seed: 2727, complexity: 0.5, scale: 1.0, density: 0.5 }`.
- `generate(params)` — raw vertex arrays.
- `generateGeometry(params)` — a `THREE.BufferGeometry`
  plane with per-vertex Z displaced by `tanh(phi * 2.5)`, normalised
  to the unit cube.

## Internal

- `N = 96`, `M = 1.0`, `EPS = 0.5`, `DT = 0.05` — the brief-specified
  Cahn-Hilliard constants. Module scope to keep the simulation inner
  loop pointer-light.
- `laplacian(field, out)` — 5-point periodic stencil, written into a
  reused buffer so the inner loop is allocation-free.
- `simulate(seed, complexity)` — split Cahn-Hilliard: compute
  μ = −εΔφ + φ³ − φ, then advance ∂φ/∂t = M Δμ.

## Depends on

- `three`.
- `./_base` for `seededRng`, `normalise`, `attrsOf`, `CommonParams`,
  `GeneratedMesh`.

## Does not

- **Does not run marching cubes.** The brief asked for the cheaper 2D
  relief over the 3D MC variant. A future port can re-use the field
  generator and swap in MC if a true bicontinuous mesh is needed.
- **Does not threshold to a binary mask.** A soft `tanh` keeps the
  relief readable as a continuous surface; binary thresholding would
  fight the vertex-normal step.
- **Does not vary the boundary condition.** Periodic on the torus is
  the cleanest and matches how spinodal patterns are studied in
  practice.
- **Does not stream intermediate frames.** One-shot final field.

## Bordering files

- `lib/algorithms/_base.ts` — shared helpers.
- `lib/algorithms/reaction-diffusion.ts` — sibling PDE-relief
  algorithm; identical heightmap pattern, different chemistry.
- `lib/algorithms/index.ts` — registry (user-controlled).
- `lib/assets/algorithms.ts` — catalogue entry id 27, slug `spinodal`.
