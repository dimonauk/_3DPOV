# `reaction-diffusion.ts` — purpose twin

## Role

Runs the Gray-Scott reaction-diffusion model on a 64×64 toroidal
grid and builds a heightmap mesh from the final v-field. Fills the
`reaction-diffusion` slot in the 30-algorithm catalogue.

## Public surface

- `ReactionDiffusionParams` — alias of `CommonParams`. `complexity`
  drives the number of simulation steps (200 → 400); `density`
  scales the heightmap amplitude.
- `defaultParams()` — `{ seed: 1717, complexity: 0.5, scale: 1.0, density: 0.5 }`.
- `generate(params)` — raw vertex arrays.
- `generateGeometry(params)` — `THREE.BufferGeometry` plane with
  per-vertex Z displaced by the v-field, normalised to unit cube.

## Internal

- `N = 64`, `F = 0.055`, `K = 0.062`, `DU = 0.16`, `DV = 0.08` —
  the canonical spot-kernel constants. Held as module-scope
  numbers because the simulation loop must avoid any per-step lookups.
- `simulate(seed, complexity)` — runs the timestepping with reused
  ping-pong buffers and returns the final v-field.
- The seed perturbation count `8 + rng() * 5` keeps the initial
  conditions interesting without choking the small grid.

## Depends on

- `three`.
- `./_base` for `seededRng`, `normalise`, `attrsOf`, `CommonParams`,
  `GeneratedMesh`.

## Does not

- **Does not run async.** Synchronous like every other algorithm in
  the registry. 64×64 × 400 steps × 9 reads-per-cell is fast enough
  on modern hardware for a one-shot preview build.
- **Does not vary the Gray-Scott preset.** The brief specified the
  F=0.055 / k=0.062 spot configuration; the Hangar's three-preset
  switch is dropped on entry.
- **Does not stream intermediate frames.** Only the final field is
  exported. An animation hook can be added later if needed.
- **Does not bake the heightmap into a Canvas texture.** The
  algorithm's output is geometry. Texturing belongs in the renderer.

## Bordering files

- `lib/algorithms/_base.ts` — shared helpers.
- `lib/algorithms/index.ts` — registry (user-controlled).
- `lib/assets/algorithms.ts` — catalogue entry id 17, slug `reaction-diffusion`.
- Hangar source: `D:\The_Hangar\Dolly_OS\src\systems\jewel-array\geometry\algorithms\algo_17_ReactionDiffusion.ts`.
