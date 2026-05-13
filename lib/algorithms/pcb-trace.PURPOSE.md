# `pcb-trace.ts` — purpose twin

## Role

Scatters nodes on a grid, routes them with Manhattan (right-angle)
traces over a thin extruded ground plane, and drops via-ring
cylinders at every corner. Fills the `pcb-trace` slot in the
30-algorithm catalogue.

## Public surface

- `PCBTraceParams` — alias of `CommonParams`. `complexity` selects
  grid size (5..12 per axis); `density` raises node occupancy and
  thickens traces.
- `defaultParams()` — `{ seed: 1212, complexity: 0.5, scale: 1.0, density: 0.5 }`.
- `generate(params)` — raw vertex/index arrays.
- `generateGeometry(params)` — merged `THREE.BufferGeometry`,
  normalised to the unit cube.

## Internal

- `Node` — `{ row, col }` grid coordinate.
- `scatterNodes(rows, cols, rng, density)` — Bernoulli scatter with
  threshold biased by `density`. Each surviving cell becomes a pad
  position.
- `buildFrame(width, height, margin, depth)` — the ground-plane
  rectangle with a rectangular hole, extruded at 40 % of `depth`.
  Stays thin so traces and vias dominate the silhouette.
- Pad pucks drop at every node (not just routed corners) so the
  board doesn't read as a sparse set of disconnected tubes when
  routing skips a pair.
- `horizFirst` coin-flip per pair distributes elbows across both
  axes; without it every route bends the same way and the board
  reads as a comb.

## Depends on

- `three`.
- `./_base` for `seededRng`, `mergeAll`, `normalise`, `attrsOf`,
  `CommonParams`, `GeneratedMesh`.

## Does not

- **Does not implement a true routing solver.** No A*, no maze
  router, no congestion penalty. Each consecutive node pair gets a
  one-corner Manhattan path; routes can and do cross. The visual is
  "PCB-flavoured," not a working schematic.
- **Does not include 45° traces.** The Hangar catalogue note
  mentions them; the brief asks for right-angle routing, and the
  L-route reads cleanly without the diagonal mode.
- **Does not stack layers.** Single substrate, single trace plane,
  vias as visual decor rather than layer-bridges.

## Bordering files

- `lib/algorithms/_base.ts` — shared helpers.
- `lib/algorithms/index.ts` — registry (user-controlled).
- `lib/assets/algorithms.ts` — catalogue entry id 12, slug `pcb-trace`.
- Hangar source: `D:\The_Hangar\Dolly_OS\src\systems\jewel-array\geometry\algorithms\algo_12_PCBTrace.ts`.
