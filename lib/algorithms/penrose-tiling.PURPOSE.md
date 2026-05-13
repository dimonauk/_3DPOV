# `penrose-tiling.ts` — purpose twin

## Role

Builds an aperiodic P3 (rhombus) Penrose tiling via golden-ratio
deflation and extrudes each half-tile into a thin prism. Fills the
`penrose-tiling` slot in the 30-algorithm catalogue.

## Public surface

- `PenroseTilingParams` — alias of `CommonParams`. `complexity`
  selects 3–5 deflation iterations; `density` scales the prism
  depth.
- `defaultParams()` — `{ seed: 1616, complexity: 0.5, scale: 1.0, density: 0.5 }`.
- `generate(params)` — raw vertex arrays.
- `generateGeometry(params)` — merged `THREE.BufferGeometry`,
  normalised to unit cube.

## Internal

- `PHI` — golden ratio, the deflation step size.
- `Tri` — `readonly [tileType, A, B, C]` half-tile record. Type 0
  is the thick rhombus half (kite); type 1 is the thin rhombus
  half (dart). The deflation rules act on these halves and
  preserve the matching constraints.
- `initialStar()` — the seed 10-half-tile pinwheel. Half the
  triangles are mirrored so the deflation rules apply
  consistently across the star.
- `deflate(tris)` — one iteration of the standard P3 split (thick
  → thick+thin; thin → thin+thin+thick).
- The 1500-tile output cap prevents far-end `complexity` values
  from queueing minutes of `ExtrudeGeometry` work.

## Depends on

- `three`.
- `./_base` for `seededRng`, `mergeAll`, `normalise`, `attrsOf`,
  `CommonParams`, `GeneratedMesh`.

## Does not

- **Does not pair half-tiles back into full rhombs before
  extruding.** Each half is its own prism; the tile boundaries on
  the rhomb's long diagonal show up faintly in the mesh. This is a
  conscious choice — pairing is a separate algorithm the studio can
  ship if asked.
- **Does not de-duplicate overlapping tiles.** Penrose deflation
  produces unique tiles by construction, but the initial star has
  shared edges; the merge is via geometry union, so the topology
  is correct visually even where tiles touch.
- **Does not run async.** Synchronous.
- **Does not install a Penrose library.** The 60-line deflation
  pass is enough.

## Bordering files

- `lib/algorithms/_base.ts` — shared helpers.
- `lib/algorithms/index.ts` — registry (user-controlled).
- `lib/assets/algorithms.ts` — catalogue entry id 16, slug `penrose-tiling`.
- Hangar source: `D:\The_Hangar\Dolly_OS\src\systems\jewel-array\geometry\algorithms\algo_16_PenroseTiling.ts`.
