# `wigner-seitz.ts` — purpose twin

## Role

Generates a 3D block of Wigner-Seitz cells on a body-centred-cubic
lattice; each cell is the canonical truncated octahedron drawn as a
tube-rib skeleton. Fills the `wigner-seitz` slot (catalogue id 26).

## Public surface

- `WignerSeitzParams` — alias of `CommonParams`. `complexity` drives
  the grid side (2 → 4 conventional cubes); `density` scales the rib
  thickness.
- `defaultParams()` — `{ seed: 2626, complexity: 0.5, scale: 1.0, density: 0.5 }`.
- `generate(params)` — raw vertex/index arrays.
- `generateGeometry(params)` — merged `THREE.BufferGeometry`,
  normalised to the unit cube.

## Internal

- `truncatedOctahedronVerts()` — the 24 permutations of (0, ±1, ±2),
  the canonical vertex set of a truncated octahedron with edge √2.
- `truncatedOctahedronEdges(verts)` — pair-distance scan for the
  36 edges of length √2.
- `cellGeometry(centre, cellScale, ribW)` — instantiates one cell
  skeleton as a list of `TubeGeometry` segments.

## Depends on

- `three`.
- `./_base` for `mergeAll`, `normalise`, `attrsOf`, `CommonParams`,
  `GeneratedMesh`.

## Does not

- **Does not run a half-space clipper at runtime.** The BCC
  Wigner-Seitz cell is algebraically the truncated octahedron with a
  known vertex/edge set; we encode that directly rather than rebuild
  the clipper. Equivalent shape, no extra ~250 lines.
- **Does not draw face panels.** The brief allowed either edges or
  extruded panels; edges read more clearly at jewellery scale.
- **Does not handle FCC.** BCC only, per the brief.
- **Does not vary by seed.** The lattice geometry is deterministic;
  the `seed` slot is kept on the param record for registry
  uniformity but unused.

## Bordering files

- `lib/algorithms/_base.ts` — shared helpers.
- `lib/algorithms/voronoi.ts` — sibling cell-tessellation algorithm
  (2D version of the same intuition).
- `lib/algorithms/index.ts` — registry (user-controlled).
- `lib/assets/algorithms.ts` — catalogue entry id 26, slug `wigner-seitz`.
