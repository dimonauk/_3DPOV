/**
 * Marching cubes &mdash; the maths, in pure functions.
 *
 * Algorithm in one sentence: at every cell of a 3D scalar field, classify the
 * eight corners as &ldquo;above&rdquo; or &ldquo;below&rdquo; the iso-value,
 * pack those eight booleans into a 0&ndash;255 index, look that index up in a
 * pre-computed triangle table, and emit the triangles. Edges crossed by the
 * iso-surface are linearly interpolated for sub-cell precision.
 *
 * The 256-entry triangulation table below is the canonical Bourke /
 * Lorensen-Cline table:
 *
 *   - Lorensen, W. E. &amp; Cline, H. E. &mdash; &ldquo;Marching Cubes: A High
 *     Resolution 3D Surface Construction Algorithm&rdquo;, SIGGRAPH 1987.
 *   - Bourke, P. &mdash; &ldquo;Polygonising a scalar field&rdquo;, 1994.
 *     http://paulbourke.net/geometry/polygonise/
 *
 * The table is public-domain; reproduced here in TypeScript form. Each row
 * holds up to five triangles as triples of edge indices (0&ndash;11), padded
 * to length 16 with -1. We chose the explicit 256-row form over the
 * 15-canonical-cases-plus-symmetry form: the explicit table is one O(1)
 * lookup, no rotation matrices, easier to step through visually for the
 * &ldquo;case index = N&rdquo; readout this visualiser leans on.
 *
 * Pure functions; no React, no Three.js; importable from a server component
 * or a Node test runner.
 */

export type ScalarField = {
  /** [nx, ny, nz] &mdash; number of samples per axis. */
  dims: [number, number, number];
  /** Flat row-major Float32 buffer of length nx&middot;ny&middot;nz. */
  values: Float32Array;
  /** World-space extent of the sampled box, on each axis: [min, max]. */
  bounds: [number, number];
};

export type TriangleSet = {
  /** Flat [x, y, z, x, y, z, &hellip;] triangle vertices in world space. */
  positions: Float32Array;
  /** Triangle count. */
  count: number;
};

// ── Geometry of one unit cube ─────────────────────────────────────────────
// Corner indices follow the Bourke convention:
//
//       4---------5
//      /|        /|
//     7---------6 |
//     | |       | |
//     | 0-------|-1
//     |/        |/
//     3---------2
//
// X increases right, Y increases up, Z increases out of the page (towards the
// viewer). Corner 0 is the bottom-back-left vertex; corner 6 is the
// top-front-right.

const CORNER_OFFSETS: ReadonlyArray<readonly [number, number, number]> = [
  [0, 0, 0], // 0
  [1, 0, 0], // 1
  [1, 0, 1], // 2
  [0, 0, 1], // 3
  [0, 1, 0], // 4
  [1, 1, 0], // 5
  [1, 1, 1], // 6
  [0, 1, 1], // 7
];

// The 12 edges as (cornerA, cornerB) pairs, in the canonical Bourke order.
const EDGE_CORNERS: ReadonlyArray<readonly [number, number]> = [
  [0, 1], //  0 — bottom-back
  [1, 2], //  1 — bottom-right
  [2, 3], //  2 — bottom-front
  [3, 0], //  3 — bottom-left
  [4, 5], //  4 — top-back
  [5, 6], //  5 — top-right
  [6, 7], //  6 — top-front
  [7, 4], //  7 — top-left
  [0, 4], //  8 — back-left vertical
  [1, 5], //  9 — back-right vertical
  [2, 6], // 10 — front-right vertical
  [3, 7], // 11 — front-left vertical
];

// The 256-entry triangulation table. Each row is up to 16 entries; entries
// past the last triangle are -1. The "edge" indices refer to EDGE_CORNERS
// above. Generated form: each set of three consecutive entries is one
// triangle; emission stops at the first -1.
//
// Source: Paul Bourke, Polygonising a Scalar Field, 1994.
// http://paulbourke.net/geometry/polygonise/
//
// Public domain.

// prettier-ignore
const TRIANGULATION: ReadonlyArray<ReadonlyArray<number>> = [
  [-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
  [0,8,3,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
  [0,1,9,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
  [1,8,3,9,8,1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
  [1,2,10,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
  [0,8,3,1,2,10,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
  [9,2,10,0,2,9,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
  [2,8,3,2,10,8,10,9,8,-1,-1,-1,-1,-1,-1,-1],
  [3,11,2,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
  [0,11,2,8,11,0,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
  [1,9,0,2,3,11,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
  [1,11,2,1,9,11,9,8,11,-1,-1,-1,-1,-1,-1,-1],
  [3,10,1,11,10,3,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
  [0,10,1,0,8,10,8,11,10,-1,-1,-1,-1,-1,-1,-1],
  [3,9,0,3,11,9,11,10,9,-1,-1,-1,-1,-1,-1,-1],
  [9,8,10,10,8,11,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
  [4,7,8,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
  [4,3,0,7,3,4,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
  [0,1,9,8,4,7,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
  [4,1,9,4,7,1,7,3,1,-1,-1,-1,-1,-1,-1,-1],
  [1,2,10,8,4,7,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
  [3,4,7,3,0,4,1,2,10,-1,-1,-1,-1,-1,-1,-1],
  [9,2,10,9,0,2,8,4,7,-1,-1,-1,-1,-1,-1,-1],
  [2,10,9,2,9,7,2,7,3,7,9,4,-1,-1,-1,-1],
  [8,4,7,3,11,2,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
  [11,4,7,11,2,4,2,0,4,-1,-1,-1,-1,-1,-1,-1],
  [9,0,1,8,4,7,2,3,11,-1,-1,-1,-1,-1,-1,-1],
  [4,7,11,9,4,11,9,11,2,9,2,1,-1,-1,-1,-1],
  [3,10,1,3,11,10,7,8,4,-1,-1,-1,-1,-1,-1,-1],
  [1,11,10,1,4,11,1,0,4,7,11,4,-1,-1,-1,-1],
  [4,7,8,9,0,11,9,11,10,11,0,3,-1,-1,-1,-1],
  [4,7,11,4,11,9,9,11,10,-1,-1,-1,-1,-1,-1,-1],
  [9,5,4,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
  [9,5,4,0,8,3,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
  [0,5,4,1,5,0,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
  [8,5,4,8,3,5,3,1,5,-1,-1,-1,-1,-1,-1,-1],
  [1,2,10,9,5,4,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
  [3,0,8,1,2,10,4,9,5,-1,-1,-1,-1,-1,-1,-1],
  [5,2,10,5,4,2,4,0,2,-1,-1,-1,-1,-1,-1,-1],
  [2,10,5,3,2,5,3,5,4,3,4,8,-1,-1,-1,-1],
  [9,5,4,2,3,11,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
  [0,11,2,0,8,11,4,9,5,-1,-1,-1,-1,-1,-1,-1],
  [0,5,4,0,1,5,2,3,11,-1,-1,-1,-1,-1,-1,-1],
  [2,1,5,2,5,8,2,8,11,4,8,5,-1,-1,-1,-1],
  [10,3,11,10,1,3,9,5,4,-1,-1,-1,-1,-1,-1,-1],
  [4,9,5,0,8,1,8,10,1,8,11,10,-1,-1,-1,-1],
  [5,4,0,5,0,11,5,11,10,11,0,3,-1,-1,-1,-1],
  [5,4,8,5,8,10,10,8,11,-1,-1,-1,-1,-1,-1,-1],
  [9,7,8,5,7,9,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
  [9,3,0,9,5,3,5,7,3,-1,-1,-1,-1,-1,-1,-1],
  [0,7,8,0,1,7,1,5,7,-1,-1,-1,-1,-1,-1,-1],
  [1,5,3,3,5,7,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
  [9,7,8,9,5,7,10,1,2,-1,-1,-1,-1,-1,-1,-1],
  [10,1,2,9,5,0,5,3,0,5,7,3,-1,-1,-1,-1],
  [8,0,2,8,2,5,8,5,7,10,5,2,-1,-1,-1,-1],
  [2,10,5,2,5,3,3,5,7,-1,-1,-1,-1,-1,-1,-1],
  [7,9,5,7,8,9,3,11,2,-1,-1,-1,-1,-1,-1,-1],
  [9,5,7,9,7,2,9,2,0,2,7,11,-1,-1,-1,-1],
  [2,3,11,0,1,8,1,7,8,1,5,7,-1,-1,-1,-1],
  [11,2,1,11,1,7,7,1,5,-1,-1,-1,-1,-1,-1,-1],
  [9,5,8,8,5,7,10,1,3,10,3,11,-1,-1,-1,-1],
  [5,7,0,5,0,9,7,11,0,1,0,10,11,10,0,-1],
  [11,10,0,11,0,3,10,5,0,8,0,7,5,7,0,-1],
  [11,10,5,7,11,5,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
  [10,6,5,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
  [0,8,3,5,10,6,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
  [9,0,1,5,10,6,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
  [1,8,3,1,9,8,5,10,6,-1,-1,-1,-1,-1,-1,-1],
  [1,6,5,2,6,1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
  [1,6,5,1,2,6,3,0,8,-1,-1,-1,-1,-1,-1,-1],
  [9,6,5,9,0,6,0,2,6,-1,-1,-1,-1,-1,-1,-1],
  [5,9,8,5,8,2,5,2,6,3,2,8,-1,-1,-1,-1],
  [2,3,11,10,6,5,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
  [11,0,8,11,2,0,10,6,5,-1,-1,-1,-1,-1,-1,-1],
  [0,1,9,2,3,11,5,10,6,-1,-1,-1,-1,-1,-1,-1],
  [5,10,6,1,9,2,9,11,2,9,8,11,-1,-1,-1,-1],
  [6,3,11,6,5,3,5,1,3,-1,-1,-1,-1,-1,-1,-1],
  [0,8,11,0,11,5,0,5,1,5,11,6,-1,-1,-1,-1],
  [3,11,6,0,3,6,0,6,5,0,5,9,-1,-1,-1,-1],
  [6,5,9,6,9,11,11,9,8,-1,-1,-1,-1,-1,-1,-1],
  [5,10,6,4,7,8,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
  [4,3,0,4,7,3,6,5,10,-1,-1,-1,-1,-1,-1,-1],
  [1,9,0,5,10,6,8,4,7,-1,-1,-1,-1,-1,-1,-1],
  [10,6,5,1,9,7,1,7,3,7,9,4,-1,-1,-1,-1],
  [6,1,2,6,5,1,4,7,8,-1,-1,-1,-1,-1,-1,-1],
  [1,2,5,5,2,6,3,0,4,3,4,7,-1,-1,-1,-1],
  [8,4,7,9,0,5,0,6,5,0,2,6,-1,-1,-1,-1],
  [7,3,9,7,9,4,3,2,9,5,9,6,2,6,9,-1],
  [3,11,2,7,8,4,10,6,5,-1,-1,-1,-1,-1,-1,-1],
  [5,10,6,4,7,2,4,2,0,2,7,11,-1,-1,-1,-1],
  [0,1,9,4,7,8,2,3,11,5,10,6,-1,-1,-1,-1],
  [9,2,1,9,11,2,9,4,11,7,11,4,5,10,6,-1],
  [8,4,7,3,11,5,3,5,1,5,11,6,-1,-1,-1,-1],
  [5,1,11,5,11,6,1,0,11,7,11,4,0,4,11,-1],
  [0,5,9,0,6,5,0,3,6,11,6,3,8,4,7,-1],
  [6,5,9,6,9,11,4,7,9,7,11,9,-1,-1,-1,-1],
  [10,4,9,6,4,10,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
  [4,10,6,4,9,10,0,8,3,-1,-1,-1,-1,-1,-1,-1],
  [10,0,1,10,6,0,6,4,0,-1,-1,-1,-1,-1,-1,-1],
  [8,3,1,8,1,6,8,6,4,6,1,10,-1,-1,-1,-1],
  [1,4,9,1,2,4,2,6,4,-1,-1,-1,-1,-1,-1,-1],
  [3,0,8,1,2,9,2,4,9,2,6,4,-1,-1,-1,-1],
  [0,2,4,4,2,6,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
  [8,3,2,8,2,4,4,2,6,-1,-1,-1,-1,-1,-1,-1],
  [10,4,9,10,6,4,11,2,3,-1,-1,-1,-1,-1,-1,-1],
  [0,8,2,2,8,11,4,9,10,4,10,6,-1,-1,-1,-1],
  [3,11,2,0,1,6,0,6,4,6,1,10,-1,-1,-1,-1],
  [6,4,1,6,1,10,4,8,1,2,1,11,8,11,1,-1],
  [9,6,4,9,3,6,9,1,3,11,6,3,-1,-1,-1,-1],
  [8,11,1,8,1,0,11,6,1,9,1,4,6,4,1,-1],
  [3,11,6,3,6,0,0,6,4,-1,-1,-1,-1,-1,-1,-1],
  [6,4,8,11,6,8,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
  [7,10,6,7,8,10,8,9,10,-1,-1,-1,-1,-1,-1,-1],
  [0,7,3,0,10,7,0,9,10,6,7,10,-1,-1,-1,-1],
  [10,6,7,1,10,7,1,7,8,1,8,0,-1,-1,-1,-1],
  [10,6,7,10,7,1,1,7,3,-1,-1,-1,-1,-1,-1,-1],
  [1,2,6,1,6,8,1,8,9,8,6,7,-1,-1,-1,-1],
  [2,6,9,2,9,1,6,7,9,0,9,3,7,3,9,-1],
  [7,8,0,7,0,6,6,0,2,-1,-1,-1,-1,-1,-1,-1],
  [7,3,2,6,7,2,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
  [2,3,11,10,6,8,10,8,9,8,6,7,-1,-1,-1,-1],
  [2,0,7,2,7,11,0,9,7,6,7,10,9,10,7,-1],
  [1,8,0,1,7,8,1,10,7,6,7,10,2,3,11,-1],
  [11,2,1,11,1,7,10,6,1,6,7,1,-1,-1,-1,-1],
  [8,9,6,8,6,7,9,1,6,11,6,3,1,3,6,-1],
  [0,9,1,11,6,7,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
  [7,8,0,7,0,6,3,11,0,11,6,0,-1,-1,-1,-1],
  [7,11,6,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
  [7,6,11,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
  [3,0,8,11,7,6,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
  [0,1,9,11,7,6,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
  [8,1,9,8,3,1,11,7,6,-1,-1,-1,-1,-1,-1,-1],
  [10,1,2,6,11,7,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
  [1,2,10,3,0,8,6,11,7,-1,-1,-1,-1,-1,-1,-1],
  [2,9,0,2,10,9,6,11,7,-1,-1,-1,-1,-1,-1,-1],
  [6,11,7,2,10,3,10,8,3,10,9,8,-1,-1,-1,-1],
  [7,2,3,6,2,7,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
  [7,0,8,7,6,0,6,2,0,-1,-1,-1,-1,-1,-1,-1],
  [2,7,6,2,3,7,0,1,9,-1,-1,-1,-1,-1,-1,-1],
  [1,6,2,1,8,6,1,9,8,8,7,6,-1,-1,-1,-1],
  [10,7,6,10,1,7,1,3,7,-1,-1,-1,-1,-1,-1,-1],
  [10,7,6,1,7,10,1,8,7,1,0,8,-1,-1,-1,-1],
  [0,3,7,0,7,10,0,10,9,6,10,7,-1,-1,-1,-1],
  [7,6,10,7,10,8,8,10,9,-1,-1,-1,-1,-1,-1,-1],
  [6,8,4,11,8,6,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
  [3,6,11,3,0,6,0,4,6,-1,-1,-1,-1,-1,-1,-1],
  [8,6,11,8,4,6,9,0,1,-1,-1,-1,-1,-1,-1,-1],
  [9,4,6,9,6,3,9,3,1,11,3,6,-1,-1,-1,-1],
  [6,8,4,6,11,8,2,10,1,-1,-1,-1,-1,-1,-1,-1],
  [1,2,10,3,0,11,0,6,11,0,4,6,-1,-1,-1,-1],
  [4,11,8,4,6,11,0,2,9,2,10,9,-1,-1,-1,-1],
  [10,9,3,10,3,2,9,4,3,11,3,6,4,6,3,-1],
  [8,2,3,8,4,2,4,6,2,-1,-1,-1,-1,-1,-1,-1],
  [0,4,2,4,6,2,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
  [1,9,0,2,3,4,2,4,6,4,3,8,-1,-1,-1,-1],
  [1,9,4,1,4,2,2,4,6,-1,-1,-1,-1,-1,-1,-1],
  [8,1,3,8,6,1,8,4,6,6,10,1,-1,-1,-1,-1],
  [10,1,0,10,0,6,6,0,4,-1,-1,-1,-1,-1,-1,-1],
  [4,6,3,4,3,8,6,10,3,0,3,9,10,9,3,-1],
  [10,9,4,6,10,4,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
  [4,9,5,7,6,11,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
  [0,8,3,4,9,5,11,7,6,-1,-1,-1,-1,-1,-1,-1],
  [5,0,1,5,4,0,7,6,11,-1,-1,-1,-1,-1,-1,-1],
  [11,7,6,8,3,4,3,5,4,3,1,5,-1,-1,-1,-1],
  [9,5,4,10,1,2,7,6,11,-1,-1,-1,-1,-1,-1,-1],
  [6,11,7,1,2,10,0,8,3,4,9,5,-1,-1,-1,-1],
  [7,6,11,5,4,10,4,2,10,4,0,2,-1,-1,-1,-1],
  [3,4,8,3,5,4,3,2,5,10,5,2,11,7,6,-1],
  [7,2,3,7,6,2,5,4,9,-1,-1,-1,-1,-1,-1,-1],
  [9,5,4,0,8,6,0,6,2,6,8,7,-1,-1,-1,-1],
  [3,6,2,3,7,6,1,5,0,5,4,0,-1,-1,-1,-1],
  [6,2,8,6,8,7,2,1,8,4,8,5,1,5,8,-1],
  [9,5,4,10,1,6,1,7,6,1,3,7,-1,-1,-1,-1],
  [1,6,10,1,7,6,1,0,7,8,7,0,9,5,4,-1],
  [4,0,10,4,10,5,0,3,10,6,10,7,3,7,10,-1],
  [7,6,10,7,10,8,5,4,10,4,8,10,-1,-1,-1,-1],
  [6,9,5,6,11,9,11,8,9,-1,-1,-1,-1,-1,-1,-1],
  [3,6,11,0,6,3,0,5,6,0,9,5,-1,-1,-1,-1],
  [0,11,8,0,5,11,0,1,5,5,6,11,-1,-1,-1,-1],
  [6,11,3,6,3,5,5,3,1,-1,-1,-1,-1,-1,-1,-1],
  [1,2,10,9,5,11,9,11,8,11,5,6,-1,-1,-1,-1],
  [0,11,3,0,6,11,0,9,6,5,6,9,1,2,10,-1],
  [11,8,5,11,5,6,8,0,5,10,5,2,0,2,5,-1],
  [6,11,3,6,3,5,2,10,3,10,5,3,-1,-1,-1,-1],
  [5,8,9,5,2,8,5,6,2,3,8,2,-1,-1,-1,-1],
  [9,5,6,9,6,0,0,6,2,-1,-1,-1,-1,-1,-1,-1],
  [1,5,8,1,8,0,5,6,8,3,8,2,6,2,8,-1],
  [1,5,6,2,1,6,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
  [1,3,6,1,6,10,3,8,6,5,6,9,8,9,6,-1],
  [10,1,0,10,0,6,9,5,0,5,6,0,-1,-1,-1,-1],
  [0,3,8,5,6,10,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
  [10,5,6,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
  [11,5,10,7,5,11,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
  [11,5,10,11,7,5,8,3,0,-1,-1,-1,-1,-1,-1,-1],
  [5,11,7,5,10,11,1,9,0,-1,-1,-1,-1,-1,-1,-1],
  [10,7,5,10,11,7,9,8,1,8,3,1,-1,-1,-1,-1],
  [11,1,2,11,7,1,7,5,1,-1,-1,-1,-1,-1,-1,-1],
  [0,8,3,1,2,7,1,7,5,7,2,11,-1,-1,-1,-1],
  [9,7,5,9,2,7,9,0,2,2,11,7,-1,-1,-1,-1],
  [7,5,2,7,2,11,5,9,2,3,2,8,9,8,2,-1],
  [2,5,10,2,3,5,3,7,5,-1,-1,-1,-1,-1,-1,-1],
  [8,2,0,8,5,2,8,7,5,10,2,5,-1,-1,-1,-1],
  [9,0,1,5,10,3,5,3,7,3,10,2,-1,-1,-1,-1],
  [9,8,2,9,2,1,8,7,2,10,2,5,7,5,2,-1],
  [1,3,5,3,7,5,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
  [0,8,7,0,7,1,1,7,5,-1,-1,-1,-1,-1,-1,-1],
  [9,0,3,9,3,5,5,3,7,-1,-1,-1,-1,-1,-1,-1],
  [9,8,7,5,9,7,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
  [5,8,4,5,10,8,10,11,8,-1,-1,-1,-1,-1,-1,-1],
  [5,0,4,5,11,0,5,10,11,11,3,0,-1,-1,-1,-1],
  [0,1,9,8,4,10,8,10,11,10,4,5,-1,-1,-1,-1],
  [10,11,4,10,4,5,11,3,4,9,4,1,3,1,4,-1],
  [2,5,1,2,8,5,2,11,8,4,5,8,-1,-1,-1,-1],
  [0,4,11,0,11,3,4,5,11,2,11,1,5,1,11,-1],
  [0,2,5,0,5,9,2,11,5,4,5,8,11,8,5,-1],
  [9,4,5,2,11,3,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
  [2,5,10,3,5,2,3,4,5,3,8,4,-1,-1,-1,-1],
  [5,10,2,5,2,4,4,2,0,-1,-1,-1,-1,-1,-1,-1],
  [3,10,2,3,5,10,3,8,5,4,5,8,0,1,9,-1],
  [5,10,2,5,2,4,1,9,2,9,4,2,-1,-1,-1,-1],
  [8,4,5,8,5,3,3,5,1,-1,-1,-1,-1,-1,-1,-1],
  [0,4,5,1,0,5,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
  [8,4,5,8,5,3,9,0,5,0,3,5,-1,-1,-1,-1],
  [9,4,5,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
  [4,11,7,4,9,11,9,10,11,-1,-1,-1,-1,-1,-1,-1],
  [0,8,3,4,9,7,9,11,7,9,10,11,-1,-1,-1,-1],
  [1,10,11,1,11,4,1,4,0,7,4,11,-1,-1,-1,-1],
  [3,1,4,3,4,8,1,10,4,7,4,11,10,11,4,-1],
  [4,11,7,9,11,4,9,2,11,9,1,2,-1,-1,-1,-1],
  [9,7,4,9,11,7,9,1,11,2,11,1,0,8,3,-1],
  [11,7,4,11,4,2,2,4,0,-1,-1,-1,-1,-1,-1,-1],
  [11,7,4,11,4,2,8,3,4,3,2,4,-1,-1,-1,-1],
  [2,9,10,2,7,9,2,3,7,7,4,9,-1,-1,-1,-1],
  [9,10,7,9,7,4,10,2,7,8,7,0,2,0,7,-1],
  [3,7,10,3,10,2,7,4,10,1,10,0,4,0,10,-1],
  [1,10,2,8,7,4,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
  [4,9,1,4,1,7,7,1,3,-1,-1,-1,-1,-1,-1,-1],
  [4,9,1,4,1,7,0,8,1,8,7,1,-1,-1,-1,-1],
  [4,0,3,7,4,3,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
  [4,8,7,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
  [9,10,8,10,11,8,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
  [3,0,9,3,9,11,11,9,10,-1,-1,-1,-1,-1,-1,-1],
  [0,1,10,0,10,8,8,10,11,-1,-1,-1,-1,-1,-1,-1],
  [3,1,10,11,3,10,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
  [1,2,11,1,11,9,9,11,8,-1,-1,-1,-1,-1,-1,-1],
  [3,0,9,3,9,11,1,2,9,2,11,9,-1,-1,-1,-1],
  [0,2,11,8,0,11,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
  [3,2,11,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
  [2,3,8,2,8,10,10,8,9,-1,-1,-1,-1,-1,-1,-1],
  [9,10,2,0,9,2,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
  [2,3,8,2,8,10,0,1,8,1,10,8,-1,-1,-1,-1],
  [1,10,2,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
  [1,3,8,9,1,8,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
  [0,9,1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
  [0,3,8,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
  [-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
];

// ── Field samplers ────────────────────────────────────────────────────────

/** Allocate a field with the given dims and bounds [-1, 1] on every axis. */
function allocField(
  dims: [number, number, number],
): { values: Float32Array; bounds: [number, number] } {
  const [nx, ny, nz] = dims;
  return { values: new Float32Array(nx * ny * nz), bounds: [-1, 1] };
}

/** Convert (i, j, k) integer cell coordinates to world space in [-1, 1]^3. */
function cellToWorld(
  i: number,
  j: number,
  k: number,
  dims: [number, number, number],
  bounds: [number, number],
): [number, number, number] {
  const [nx, ny, nz] = dims;
  const [lo, hi] = bounds;
  const denom = (n: number) => (n > 1 ? n - 1 : 1);
  return [
    lo + (hi - lo) * (i / denom(nx)),
    lo + (hi - lo) * (j / denom(ny)),
    lo + (hi - lo) * (k / denom(nz)),
  ];
}

/** Centred sphere of given radius in the [-1, 1]^3 box; iso = 0. */
export function sampleSphere(
  dims: [number, number, number],
  radius: number,
): ScalarField {
  const { values, bounds } = allocField(dims);
  const [nx, ny, nz] = dims;
  for (let k = 0; k < nz; k++) {
    for (let j = 0; j < ny; j++) {
      for (let i = 0; i < nx; i++) {
        const [x, y, z] = cellToWorld(i, j, k, dims, bounds);
        const d = Math.sqrt(x * x + y * y + z * z) - radius;
        values[i + j * nx + k * nx * ny] = d;
      }
    }
  }
  return { dims, values, bounds };
}

/** Gyroid SDF on [-1, 1]^3 with the given period (in units of 2π). */
export function sampleGyroid(
  dims: [number, number, number],
  period: number,
): ScalarField {
  const { values, bounds } = allocField(dims);
  const [nx, ny, nz] = dims;
  // Scale the [-1, 1] box to one period of the gyroid by 2π / period.
  const k = (Math.PI * 2) / Math.max(period, 1e-3);
  for (let kk = 0; kk < nz; kk++) {
    for (let jj = 0; jj < ny; jj++) {
      for (let ii = 0; ii < nx; ii++) {
        const [x, y, z] = cellToWorld(ii, jj, kk, dims, bounds);
        const u = x * k;
        const v = y * k;
        const w = z * k;
        const f =
          Math.sin(u) * Math.cos(v) +
          Math.sin(v) * Math.cos(w) +
          Math.sin(w) * Math.cos(u);
        values[ii + jj * nx + kk * nx * ny] = f;
      }
    }
  }
  return { dims, values, bounds };
}

/** Coherent 3D value-noise. Cheap, seedable, no external dep. */
export function sampleNoise(
  dims: [number, number, number],
  seed: number,
): ScalarField {
  const { values, bounds } = allocField(dims);
  const [nx, ny, nz] = dims;

  // Mulberry32: short, deterministic, 32-bit PRNG.
  let s = (seed | 0) >>> 0;
  const rng = () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  // A lattice of random values at half-resolution, then trilinear blur into
  // the dense grid. Plenty of structure, ~no cost.
  const lx = Math.max(2, Math.ceil(nx / 2));
  const ly = Math.max(2, Math.ceil(ny / 2));
  const lz = Math.max(2, Math.ceil(nz / 2));
  const lattice = new Float32Array(lx * ly * lz);
  for (let i = 0; i < lattice.length; i++) lattice[i] = rng() * 2 - 1;
  const latticeAt = (a: number, b: number, c: number): number => {
    const ai = Math.min(Math.max(a, 0), lx - 1);
    const bi = Math.min(Math.max(b, 0), ly - 1);
    const ci = Math.min(Math.max(c, 0), lz - 1);
    return lattice[ai + bi * lx + ci * lx * ly] ?? 0;
  };

  for (let kk = 0; kk < nz; kk++) {
    for (let jj = 0; jj < ny; jj++) {
      for (let ii = 0; ii < nx; ii++) {
        const u = (ii / Math.max(1, nx - 1)) * (lx - 1);
        const v = (jj / Math.max(1, ny - 1)) * (ly - 1);
        const w = (kk / Math.max(1, nz - 1)) * (lz - 1);
        const u0 = Math.floor(u);
        const v0 = Math.floor(v);
        const w0 = Math.floor(w);
        const fu = u - u0;
        const fv = v - v0;
        const fw = w - w0;
        const c000 = latticeAt(u0, v0, w0);
        const c100 = latticeAt(u0 + 1, v0, w0);
        const c010 = latticeAt(u0, v0 + 1, w0);
        const c110 = latticeAt(u0 + 1, v0 + 1, w0);
        const c001 = latticeAt(u0, v0, w0 + 1);
        const c101 = latticeAt(u0 + 1, v0, w0 + 1);
        const c011 = latticeAt(u0, v0 + 1, w0 + 1);
        const c111 = latticeAt(u0 + 1, v0 + 1, w0 + 1);
        const c00 = c000 + (c100 - c000) * fu;
        const c01 = c001 + (c101 - c001) * fu;
        const c10 = c010 + (c110 - c010) * fu;
        const c11 = c011 + (c111 - c011) * fu;
        const c0 = c00 + (c10 - c00) * fv;
        const c1 = c01 + (c11 - c01) * fv;
        values[ii + jj * nx + kk * nx * ny] = c0 + (c1 - c0) * fw;
      }
    }
  }
  return { dims, values, bounds };
}

// ── The algorithm itself ──────────────────────────────────────────────────

/**
 * Indexable accessor for the scalar field. Out-of-range returns 0.
 */
function fieldAt(field: ScalarField, i: number, j: number, k: number): number {
  const [nx, ny, nz] = field.dims;
  if (i < 0 || j < 0 || k < 0 || i >= nx || j >= ny || k >= nz) return 0;
  return field.values[i + j * nx + k * nx * ny] ?? 0;
}

/**
 * Number of cube cells along each axis. A field of dims `[n, n, n]` has
 * `n - 1` cube cells per axis &mdash; corners sit at sample positions, the
 * cube fills the gap between them.
 */
export function cellDims(field: ScalarField): [number, number, number] {
  const [nx, ny, nz] = field.dims;
  return [Math.max(0, nx - 1), Math.max(0, ny - 1), Math.max(0, nz - 1)];
}

/** Total cell count = product of cell dims. */
export function cellCount(field: ScalarField): number {
  const [cx, cy, cz] = cellDims(field);
  return cx * cy * cz;
}

/** Convert a flat cube index to (ci, cj, ck) cell coordinates. */
export function cubeIndexToCoords(
  field: ScalarField,
  cubeIndex: number,
): [number, number, number] {
  const [cx, cy] = cellDims(field);
  const safeCx = Math.max(1, cx);
  const safeCxCy = Math.max(1, cx * cy);
  const ck = Math.floor(cubeIndex / safeCxCy);
  const cj = Math.floor((cubeIndex - ck * safeCxCy) / safeCx);
  const ci = cubeIndex - ck * safeCxCy - cj * safeCx;
  return [ci, cj, ck];
}

/** Get the world-space position of corner `c` of cube cell `(ci, cj, ck)`. */
function cornerWorld(
  field: ScalarField,
  ci: number,
  cj: number,
  ck: number,
  c: number,
): [number, number, number] {
  const off = CORNER_OFFSETS[c] ?? [0, 0, 0];
  return cellToWorld(
    ci + off[0],
    cj + off[1],
    ck + off[2],
    field.dims,
    field.bounds,
  );
}

/** Sample-value at corner `c` of cube cell `(ci, cj, ck)`. */
function cornerValue(
  field: ScalarField,
  ci: number,
  cj: number,
  ck: number,
  c: number,
): number {
  const off = CORNER_OFFSETS[c] ?? [0, 0, 0];
  return fieldAt(field, ci + off[0], cj + off[1], ck + off[2]);
}

/**
 * Eight booleans &mdash; one per cube corner &mdash; for whether the corner
 * sits ABOVE the iso-value. Used by the visualiser to colour the corner
 * spheres.
 */
export function cornerStatesAtCube(
  field: ScalarField,
  isoValue: number,
  cubeIndex: number,
): boolean[] {
  const [ci, cj, ck] = cubeIndexToCoords(field, cubeIndex);
  const out: boolean[] = new Array(8);
  for (let c = 0; c < 8; c++) {
    out[c] = cornerValue(field, ci, cj, ck, c) > isoValue;
  }
  return out;
}

/**
 * Pack eight corner-states into a 0&ndash;255 case index. Corner 0 is bit 0,
 * corner 7 is bit 7. The bit is SET when the corner is BELOW the iso-value,
 * following the original Lorensen-Cline convention &mdash; that is the
 * convention the triangulation table above is keyed to.
 */
export function caseIndexFromCorners(states: boolean[]): number {
  let idx = 0;
  for (let c = 0; c < 8; c++) {
    // states[c] === true means "above iso"; the table is keyed on "below".
    if (!states[c]) idx |= 1 << c;
  }
  return idx;
}

/** Linearly interpolate along an edge so the resulting point sits on iso. */
function interpolate(
  pA: [number, number, number],
  pB: [number, number, number],
  vA: number,
  vB: number,
  iso: number,
): [number, number, number] {
  const denom = vB - vA;
  if (Math.abs(denom) < 1e-9) return pA;
  const t = (iso - vA) / denom;
  return [
    pA[0] + (pB[0] - pA[0]) * t,
    pA[1] + (pB[1] - pA[1]) * t,
    pA[2] + (pB[2] - pA[2]) * t,
  ];
}

/**
 * Marching cubes on ONE cube cell. The output triangles live in world space
 * (the [-1, 1]^3 box the field samples). Returns empty when the cube
 * straddles no iso surface.
 */
export function marchingCubesStep(
  field: ScalarField,
  isoValue: number,
  cubeIndex: number,
): TriangleSet {
  const [ci, cj, ck] = cubeIndexToCoords(field, cubeIndex);
  const states = cornerStatesAtCube(field, isoValue, cubeIndex);
  const caseIdx = caseIndexFromCorners(states);
  const row = TRIANGULATION[caseIdx];
  if (!row || row[0] === -1) {
    return { positions: new Float32Array(0), count: 0 };
  }

  // Build edge midpoints lazily.
  const edgePoint = (edge: number): [number, number, number] => {
    const pair = EDGE_CORNERS[edge];
    if (!pair) return [0, 0, 0];
    const a = pair[0];
    const b = pair[1];
    return interpolate(
      cornerWorld(field, ci, cj, ck, a),
      cornerWorld(field, ci, cj, ck, b),
      cornerValue(field, ci, cj, ck, a),
      cornerValue(field, ci, cj, ck, b),
      isoValue,
    );
  };

  const positions: number[] = [];
  let count = 0;
  for (let t = 0; t < row.length; t += 3) {
    const e0 = row[t];
    const e1 = row[t + 1];
    const e2 = row[t + 2];
    if (e0 === undefined || e0 === -1) break;
    if (e1 === undefined || e2 === undefined) break;
    const p0 = edgePoint(e0);
    const p1 = edgePoint(e1);
    const p2 = edgePoint(e2);
    positions.push(p0[0], p0[1], p0[2], p1[0], p1[1], p1[2], p2[0], p2[1], p2[2]);
    count += 1;
  }
  return { positions: new Float32Array(positions), count };
}

/**
 * Marching cubes on every cell. Concatenates the per-cell output into one
 * triangle stream. No vertex sharing &mdash; the visualiser draws this as a
 * `BufferGeometry` with non-indexed attributes.
 */
export function marchingCubesFull(
  field: ScalarField,
  isoValue: number,
): TriangleSet {
  const total = cellCount(field);
  const buffers: Float32Array[] = [];
  let totalTris = 0;
  for (let n = 0; n < total; n++) {
    const part = marchingCubesStep(field, isoValue, n);
    if (part.count === 0) continue;
    buffers.push(part.positions);
    totalTris += part.count;
  }
  // Concat.
  const flat = new Float32Array(totalTris * 9);
  let cursor = 0;
  for (const buf of buffers) {
    flat.set(buf, cursor);
    cursor += buf.length;
  }
  return { positions: flat, count: totalTris };
}

/**
 * Convenience: the world-space position of one corner of one cube. Exported
 * so the scene can position the eight corner spheres without re-deriving the
 * cube layout.
 */
export function cubeCornerWorld(
  field: ScalarField,
  cubeIndex: number,
  corner: number,
): [number, number, number] {
  const [ci, cj, ck] = cubeIndexToCoords(field, cubeIndex);
  return cornerWorld(field, ci, cj, ck, corner);
}

/**
 * Convenience: the eight world-space corner positions of one cube, in the
 * same 0&ndash;7 order as CORNER_OFFSETS.
 */
export function cubeCornersWorld(
  field: ScalarField,
  cubeIndex: number,
): Array<[number, number, number]> {
  const out: Array<[number, number, number]> = [];
  for (let c = 0; c < 8; c++) {
    out.push(cubeCornerWorld(field, cubeIndex, c));
  }
  return out;
}
