# `lsystem-tube.ts` — purpose twin

## Role

Rewrites a Lindenmayer grammar into a 3D turtle-graphics walk and
sweeps each segment as a tubular branch with sphere buds at branch
tips. Fills the `lsystem-tube` slot in the 30-algorithm catalogue.

## Public surface

- `LSystemTubeParams` — alias of `CommonParams`. `complexity` selects
  3–5 rewrite iterations; `density` thickens the stem radius.
- `defaultParams()` — `{ seed: 808, complexity: 0.5, scale: 1.0, density: 0.5 }`.
- `generate(params)` — raw vertex/index arrays.
- `generateGeometry(params)` — merged `THREE.BufferGeometry`,
  normalised to the unit cube.

## Internal

- `AXIOM` / `RULE` — single Honda-style grammar
  (`F → F[+F][-F][/F][\F]F`). Four bracketed branches per `F` so the
  turtle yaws AND pitches each iteration; this is what makes the
  output 3D rather than the planar fan a simpler rule gives.
- `rewrite(iters)` — bog-standard left-to-right rule expansion.
- `TurtleState` — `{ pos, dir, up, r, depth }`. The `up` vector is
  carried explicitly so pitch rotations stay consistent across
  branches; without it the pitch axis would precess.
- `rotate(v, axis, angle)` — thin wrapper over `applyAxisAngle` to
  keep the per-character switch readable.
- Truncation at 3000 chars caps deep iterations from queueing
  thousands of tube allocations.

## Depends on

- `three`.
- `./_base` for `seededRng`, `mergeAll`, `normalise`, `attrsOf`,
  `CommonParams`, `GeneratedMesh`.

## Does not

- **Does not duplicate `lsystem.ts`.** That file is a 2D
  space-colonisation graph (no grammar, no turtle, no `up` vector,
  branches grow toward random attractors). This file is a true 3D
  Lindenmayer-grammar rewrite with a turtle walker — different
  algorithm family despite the shared "L-system" name in the
  catalogue.
- **Does not run async / use a worker.** The Hangar source had a
  worker path; the studio's `generate(...)` contract is
  synchronous, and 3000-char interpretation is comfortably within
  the per-call budget.
- **Does not vary grammars by seed.** The Hangar source picked one
  of three rule presets at random; the brief asks for a single
  meaningful grammar — picked one, kept the variation in angle
  jitter + iteration count.

## Bordering files

- `lib/algorithms/_base.ts` — shared helpers.
- `lib/algorithms/lsystem.ts` — neighbouring slot, different
  algorithm (space-colonisation, 2D).
- `lib/algorithms/index.ts` — registry (user-controlled).
- `lib/assets/algorithms.ts` — catalogue entry id 8, slug `lsystem-tube`.
- Hangar source: `D:\The_Hangar\Dolly_OS\src\systems\jewel-array\geometry\algorithms\algo_08_LSystemTube.ts`.
