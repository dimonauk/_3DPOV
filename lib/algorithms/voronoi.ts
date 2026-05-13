/**
 * lib/algorithms/voronoi.ts — Voronoi tessellation, extruded cells.
 *
 * Ported in the spirit of D:\The_Hangar\Dolly_OS\src\systems\jewel-array\
 * geometry\algorithms\algo_07_Voronoi.ts, but the brief asked for the
 * "extrude each cell slightly" reading rather than the Hangar's tube-
 * edge interpretation, so the cells themselves are built here: scatter
 * N seeds, classify a grid by nearest seed, walk the boundary of each
 * cell to a polygon, and extrude it into a thin prism. No new npm
 * dependencies — the polygon-from-grid walker is local.
 *
 * The result is a flat mosaic of 8–30 convex cells, each prism a few
 * mm tall (heights jittered per cell so the tessellation reads as
 * three-dimensional).
 */

import * as THREE from "three";
import {
  type CommonParams,
  type GeneratedMesh,
  attrsOf,
  mergeAll,
  normalise,
  seededRng,
} from "./_base";

export type VoronoiParams = CommonParams;

export function defaultParams(): VoronoiParams {
  return { seed: 707, complexity: 0.5, scale: 1.0, density: 0.5 };
}

type Seed = { x: number; y: number };

/** Sample the unit-square grid and tag each cell with its nearest-seed index. */
function classifyGrid(seeds: Seed[], res: number): Int16Array {
  const tag = new Int16Array(res * res);
  for (let yi = 0; yi < res; yi++) {
    const ny = yi / (res - 1);
    for (let xi = 0; xi < res; xi++) {
      const nx = xi / (res - 1);
      let bestI = 0;
      let bestD = Infinity;
      for (let i = 0; i < seeds.length; i++) {
        const s = seeds[i];
        if (!s) continue;
        const dx = s.x - nx;
        const dy = s.y - ny;
        const d = dx * dx + dy * dy;
        if (d < bestD) {
          bestD = d;
          bestI = i;
        }
      }
      tag[yi * res + xi] = bestI;
    }
  }
  return tag;
}

/**
 * Convex-hull of every grid cell tagged `id`, returned as a closed
 * polygon in unit-square coordinates [0,1]. Convex is correct here
 * because Voronoi cells of point seeds are convex; the hull cleans up
 * the grid-sampling jaggies the boundary walker would otherwise show.
 */
function cellHull(tag: Int16Array, res: number, id: number): THREE.Vector2[] {
  const pts: THREE.Vector2[] = [];
  for (let yi = 0; yi < res; yi++) {
    for (let xi = 0; xi < res; xi++) {
      if (tag[yi * res + xi] !== id) continue;
      // Boundary-only sampling: keep a pixel if any 4-neighbour differs
      // (including off-grid neighbours, so frame edges count).
      const me = id;
      const left = xi > 0 ? tag[yi * res + (xi - 1)] : -1;
      const right = xi < res - 1 ? tag[yi * res + (xi + 1)] : -1;
      const up = yi > 0 ? tag[(yi - 1) * res + xi] : -1;
      const down = yi < res - 1 ? tag[(yi + 1) * res + xi] : -1;
      if (left !== me || right !== me || up !== me || down !== me) {
        pts.push(new THREE.Vector2(xi / (res - 1), yi / (res - 1)));
      }
    }
  }
  return convexHull(pts);
}

/** Andrew's monotone-chain convex hull. Returns CCW polygon, no duplicate end. */
function convexHull(pts: THREE.Vector2[]): THREE.Vector2[] {
  if (pts.length < 3) return pts.slice();
  const sorted = pts.slice().sort((a, b) => (a.x === b.x ? a.y - b.y : a.x - b.x));
  const cross = (o: THREE.Vector2, a: THREE.Vector2, b: THREE.Vector2): number =>
    (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
  const lower: THREE.Vector2[] = [];
  for (const p of sorted) {
    while (lower.length >= 2) {
      const a = lower[lower.length - 2];
      const b = lower[lower.length - 1];
      if (a && b && cross(a, b, p) <= 0) lower.pop();
      else break;
    }
    lower.push(p);
  }
  const upper: THREE.Vector2[] = [];
  for (let i = sorted.length - 1; i >= 0; i--) {
    const p = sorted[i];
    if (!p) continue;
    while (upper.length >= 2) {
      const a = upper[upper.length - 2];
      const b = upper[upper.length - 1];
      if (a && b && cross(a, b, p) <= 0) upper.pop();
      else break;
    }
    upper.push(p);
  }
  lower.pop();
  upper.pop();
  return lower.concat(upper);
}

export function generateGeometry(p: VoronoiParams): THREE.BufferGeometry {
  const rng = seededRng(p.seed);
  const n = 8 + Math.floor(p.complexity * 22);
  const seeds: Seed[] = [];
  // Stay 6% inset so cells against the frame still close cleanly.
  for (let i = 0; i < n; i++) {
    seeds.push({ x: 0.06 + rng() * 0.88, y: 0.06 + rng() * 0.88 });
  }

  const res = 80;
  const tag = classifyGrid(seeds, res);

  const baseDepth = 0.06 * p.scale * (0.4 + (p.density ?? 0.5) * 0.9);
  const spread = p.scale * 0.9;
  const offset = -spread * 0.5;
  const geos: THREE.BufferGeometry[] = [];

  for (let id = 0; id < n; id++) {
    const poly = cellHull(tag, res, id);
    if (poly.length < 3) continue;
    const shape = new THREE.Shape(
      poly.map((v) => new THREE.Vector2(v.x * spread + offset, v.y * spread + offset)),
    );
    const depth = baseDepth * (0.55 + rng() * 0.9);
    geos.push(new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false }));
  }

  return normalise(mergeAll(geos), p.scale);
}

export function generate(p: VoronoiParams): GeneratedMesh {
  return attrsOf(generateGeometry(p));
}
