# `dla.ts` — purpose twin

## Role

Generates a diffusion-limited aggregation cluster as a merged
BufferGeometry of spheres at each occupied lattice site. Fills the
`dla` slot in the 30-algorithm catalogue and surfaces a live preview
on `/atelier/algorithms/dla`.

## Public surface

- `DLAParams` — alias of `CommonParams` (seed / complexity / scale /
  density); no extra knobs because the lattice walk has no other
  meaningful axes to expose to the slider strip.
- `defaultParams()` — `{ seed: 606, complexity: 0.5, scale: 1.0, density: 0.4 }`.
- `generate(params)` — returns the raw `{ positions, indices, normals, uvs }`.
- `generateGeometry(params)` — returns a `THREE.BufferGeometry`
  centred and scaled to fit the unit cube.

## Internal

- `DX` / `DY` — cardinal-direction lookup constants for the random
  walk, kept module-private so the inner loop has no allocations.
- `key(x, y)` — packs the (x, y) lattice coordinate into an integer
  Set key. Bias `+16384` keeps negatives non-negative; the shift
  keeps the result well inside the JS safe-integer range.
- The walker drift-back clamp inside the step loop is an internal
  optimisation, not a tunable.

## Depends on

- `three`.
- `./_base` for `seededRng`, `mergeAll`, `normalise`, `attrsOf`,
  `CommonParams`, `GeneratedMesh`.

## Does not

- **Does not run async.** The studio's `generate(...)` contract is
  synchronous; the legacy `generateAsync` / worker-backed path from
  the Hangar source is dropped on entry.
- **Does not install new npm dependencies.** No spatial-hash library;
  the integer Set is sufficient up to the ≤500-particle cap.
- **Does not register itself.** `lib/algorithms/index.ts` owns
  registration; this file is a pure mesh generator.
- **Does not validate parameters.** Out-of-range values produce
  geometry within the same shape; the catalogue is the source of
  truth for slider limits.

## Bordering files

- `lib/algorithms/_base.ts` — shared helpers.
- `lib/algorithms/index.ts` — registry (the user flips this entry on).
- `lib/assets/algorithms.ts` — catalogue entry id 6, slug `dla`.
- Hangar source: `D:\The_Hangar\Dolly_OS\src\systems\jewel-array\geometry\algorithms\algo_06_DLA.ts`.
