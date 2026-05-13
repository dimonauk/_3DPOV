# `diatom-hex.ts` — purpose twin

## Role

Builds a thin hex-lattice plate where every cell is an extruded
hexagonal `Shape` with a concentric hexagonal `Path` hole — each
pore is a genuine perforation through the plate. A torus rim
traces the circular boundary so the silhouette reads as a coin.
Fills the `diatom-hex` slot in the 30-algorithm catalogue.

## Public surface

- `DiatomHexParams` — alias of `CommonParams`. `complexity` selects
  ring count (3..6); `density` thins the cell walls (larger inner
  hex).
- `defaultParams()` — `{ seed: 3030, complexity: 0.5, scale: 1.0, density: 0.7 }`.
- `generate(params)` — raw vertex/index arrays.
- `generateGeometry(params)` — merged `THREE.BufferGeometry`,
  normalised to the unit cube.

## Internal

- `hexPoints(cx, cy, r)` — six pointy-top vertices around a centre.
  Used for both the outer shape boundary and the inner hole path
  so the cell's pore stays geometrically concentric.
- `hexCell(cx, cy, outerR, innerR, depth)` — single extruded
  perforated hex via `THREE.Shape` + a `THREE.Path` hole. The hole
  is closed explicitly because Three's extrude triangulator depends
  on the path being a closed loop.
- `outerCutoff` — radial clip keeps the lattice circular; cells
  whose centre lies past the cutoff are dropped before extrusion.
- 5 % random absence per cell gives the field an organic
  (rather than mechanical) read.

## Depends on

- `three`.
- `./_base` for `seededRng`, `mergeAll`, `normalise`, `attrsOf`,
  `CommonParams`, `GeneratedMesh`.

## Does not

- **Does not assemble the shell from per-edge cylinders.** The
  Hangar source rendered every hex edge as a cylinder plus a
  central tube and central nub; the brief reads the structure as a
  thin perforated plate, which `THREE.Shape` + hole renders in a
  single ExtrudeGeometry per cell — fewer draw calls, real
  through-holes.
- **Does not include striae or a raphe line.** The Hangar version
  added decorative radial spokes and a central groove; the brief
  asks for a clean hex-lattice plate so those are dropped.
- **Does not flatten the cell into a Z-plate.** `ExtrudeGeometry`
  keeps a real wall depth so the perforations read as physical
  holes when lit, not as 2D stencils.

## Bordering files

- `lib/algorithms/_base.ts` — shared helpers.
- `lib/algorithms/index.ts` — registry (user-controlled).
- `lib/assets/algorithms.ts` — catalogue entry id 30, slug `diatom-hex`.
- Hangar source: `D:\The_Hangar\Dolly_OS\src\systems\jewel-array\geometry\algorithms\algo_30_DiatomHex.ts`
  (spirit-ported — reinterpreted as a perforated plate).
