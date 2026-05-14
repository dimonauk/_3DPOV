/**
 * Marching cubes &mdash; the algorithm core, in pure functions.
 *
 * Algorithm in one sentence: at every cell of a 3D scalar field, classify the
 * eight corners as &ldquo;above&rdquo; or &ldquo;below&rdquo; the iso-value,
 * pack those eight booleans into a 0&ndash;255 index, look that index up in the
 * pre-computed triangle table (`./marching-cubes-table.ts`), and emit the
 * triangles. Edges crossed by the iso-surface are linearly interpolated for
 * sub-cell precision.
 *
 * References:
 *   - Lorensen, W. E. &amp; Cline, H. E. &mdash; &ldquo;Marching Cubes&hellip;&rdquo;,
 *     SIGGRAPH 1987.
 *   - Bourke, P. &mdash; &ldquo;Polygonising a scalar field&rdquo;, 1994.
 *     http://paulbourke.net/geometry/polygonise/
 *
 * This file re-exports the samplers (`./marching-cubes-samplers.ts`) so the
 * public API stays at `lib/visualiser/marching-cubes-math`.
 *
 * Pure functions; no React, no Three.js; importable from a server component
 * or a Node test runner.
 */

import {
  CORNER_OFFSETS,
  EDGE_CORNERS,
  TRIANGULATION,
  cellToWorld,
} from "./marching-cubes-table";

export {
  sampleSphere,
  sampleGyroid,
  sampleNoise,
} from "./marching-cubes-samplers";

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

// ── Field accessors ───────────────────────────────────────────────────────

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

export function cellCount(field: ScalarField): number {
  const [cx, cy, cz] = cellDims(field);
  return cx * cy * cz;
}

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
 * convention the triangulation table is keyed to.
 */
export function caseIndexFromCorners(states: boolean[]): number {
  let idx = 0;
  for (let c = 0; c < 8; c++) {
    if (!states[c]) idx |= 1 << c;
  }
  return idx;
}

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
