# `clash-compositor.ts` — purpose twin

## Role

Spatially interleaves two sibling algorithms (gyroid + step-fret) by
dropping a small instance of one or the other into each chunk of a
3D grid, producing a single merged "clash" mesh. Fills the
`clash-compositor` slot (catalogue id 24).

## Public surface

- `ClashCompositorParams` — alias of `CommonParams`. `complexity`
  drives the chunk grid side (2 → 5); `density` controls the
  probability that a chunk is non-empty.
- `defaultParams()` — `{ seed: 2424, complexity: 0.5, scale: 1.0, density: 0.5 }`.
- `generate(params)` — raw vertex arrays.
- `generateGeometry(params)` — merged `THREE.BufferGeometry`,
  normalised to the unit cube.

## Internal

- `Source` — a thin wrapper exposing the sibling algorithm's
  `generateGeometry`. The `SOURCES` array binds gyroid and step-fret.
- A per-chunk seeded RNG decides include/exclude, source choice,
  per-chunk subseed, and a per-chunk Euler rotation.

## Depends on

- `three`.
- `./_base` for `seededRng`, `mergeAll`, `normalise`, `attrsOf`,
  `CommonParams`, `GeneratedMesh`.
- `./gyroid` and `./step-fret` for source patterns.

## Does not

- **Does not use dynamic `import()`.** The registry's
  `generateGeometry` contract is synchronous; static imports of the
  two siblings achieve the same composition without breaking the
  contract.
- **Does not clip the sources to chunk volumes.** Each chunk holds
  a small full instance scaled to the chunk size — that's the
  "Memphis interleave" reading, much cheaper than per-triangle
  CSG clipping.
- **Does not depend on a runtime registry lookup.** It binds its
  two sources at import time so the clash is deterministic for a
  given (seed, complexity, density).
- **Does not vary the source pair at runtime.** Gyroid + step-fret
  is the canonical pairing for this slot. A future composer can
  parameterise the pair.

## Bordering files

- `lib/algorithms/_base.ts` — shared helpers.
- `lib/algorithms/gyroid.ts` — source A.
- `lib/algorithms/step-fret.ts` — source B.
- `lib/algorithms/index.ts` — registry (user-controlled).
- `lib/assets/algorithms.ts` — catalogue entry id 24, slug `clash-compositor`.
