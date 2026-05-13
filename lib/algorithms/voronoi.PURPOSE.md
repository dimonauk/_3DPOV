# `voronoi.ts` — purpose twin

## Role

Generates a 2D Voronoi tessellation extruded into a tile mosaic.
Fills the `voronoi` slot in the 30-algorithm catalogue.

## Public surface

- `VoronoiParams` — alias of `CommonParams`. The number of seeds is
  driven by `complexity`; per-cell prism height jitter is seeded.
- `defaultParams()` — `{ seed: 707, complexity: 0.5, scale: 1.0, density: 0.5 }`.
- `generate(params)` — raw vertex/index arrays.
- `generateGeometry(params)` — merged `THREE.BufferGeometry`,
  normalised to the unit cube.

## Internal

- `Seed` — `{ x, y }` in unit-square coordinates.
- `classifyGrid(seeds, res)` — naïve nearest-seed classification of
  an 80×80 grid into an `Int16Array` tag map.
- `cellHull(tag, res, id)` — extracts boundary pixels for a tagged
  region and returns the convex hull as a CCW polygon. Voronoi
  cells of point seeds are always convex, so the hull is both
  correct and a cheap way to denoise grid-sampling jaggies.
- `convexHull(pts)` — Andrew's monotone-chain hull. Kept local to
  avoid a new npm dependency.

## Depends on

- `three`.
- `./_base` for `seededRng`, `mergeAll`, `normalise`, `attrsOf`,
  `CommonParams`, `GeneratedMesh`.

## Does not

- **Does not import a Voronoi library.** The brief forbids new npm
  packages; the local grid+hull pipeline is ~100 lines and fast at
  res=80, n≤30.
- **Does not Lloyd-relax the seeds.** The Hangar version did; the
  brief preferred raw "scatter + nearest" so the seed jitter remains
  visible. Easy to add later if needed.
- **Does not clip cells against an explicit frame polygon.** Seeds
  are inset 6 % so the natural nearest-neighbour boundary stays
  inside the unit square; that's cheaper than a Sutherland–Hodgman
  clip and good enough for jewellery preview.
- **Does not run async.** Synchronous like every other algorithm in
  the registry.

## Bordering files

- `lib/algorithms/_base.ts` — shared helpers.
- `lib/algorithms/index.ts` — registry (the user flips this entry on).
- `lib/assets/algorithms.ts` — catalogue entry id 7, slug `voronoi`.
- Hangar source: `D:\The_Hangar\Dolly_OS\src\systems\jewel-array\geometry\algorithms\algo_07_Voronoi.ts`
  (spirit-ported — the brief asked for extruded cells, not tube edges).
