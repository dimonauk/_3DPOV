/**
 * lib/algorithms/penrose-tiling.ts — P3 (rhombus) Penrose tiling.
 *
 * Ported from D:\The_Hangar\Dolly_OS\src\systems\jewel-array\geometry\
 * algorithms\algo_16_PenroseTiling.ts. The algorithm starts from a
 * 5-fold symmetric star of 10 thick-rhombus half-tiles, then deflates
 * each tile using the standard golden-ratio subdivision rules. After
 * 3–5 deflations there are 250–1500 tiles; each becomes a thin
 * extruded triangle (the deflation works on half-tiles, so this is
 * what we render).
 *
 * Visually: aperiodic five-fold-symmetric mosaic of thin and thick
 * rhomb-halves, slightly varied in height so the surface reads three-
 * dimensional rather than printed.
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

export type PenroseTilingParams = CommonParams;

export function defaultParams(): PenroseTilingParams {
  return { seed: 1616, complexity: 0.5, scale: 1.0, density: 0.5 };
}

const PHI = (1 + Math.sqrt(5)) / 2;

/** [tileType, A, B, C]. tileType 0 = thick (kite-half), 1 = thin (dart-half). */
type Tri = readonly [0 | 1, THREE.Vector2, THREE.Vector2, THREE.Vector2];

function initialStar(): Tri[] {
  const tris: Tri[] = [];
  for (let i = 0; i < 10; i++) {
    const a = ((2 * i - 1) * Math.PI) / 10;
    const b = ((2 * i + 1) * Math.PI) / 10;
    const A = new THREE.Vector2(0, 0);
    let B = new THREE.Vector2(Math.cos(a), Math.sin(a));
    let C = new THREE.Vector2(Math.cos(b), Math.sin(b));
    // Mirror every other triangle so the deflation rules apply consistently.
    if (i % 2 === 0) {
      const tmp = B;
      B = C;
      C = tmp;
    }
    tris.push([0, A, B, C]);
  }
  return tris;
}

function deflate(tris: Tri[]): Tri[] {
  const next: Tri[] = [];
  for (const t of tris) {
    const [tp, A, B, C] = t;
    if (tp === 0) {
      // Thick rhombus half.
      const P = A.clone().addScaledVector(B.clone().sub(A), 1 / PHI);
      next.push([0, C, P, B]);
      next.push([1, P, C, A]);
    } else {
      // Thin rhombus half.
      const Q = B.clone().addScaledVector(A.clone().sub(B), 1 / PHI);
      const R = B.clone().addScaledVector(C.clone().sub(B), 1 / PHI);
      next.push([1, R, C, A]);
      next.push([1, Q, R, B]);
      next.push([0, R, Q, A]);
    }
  }
  return next;
}

export function generateGeometry(
  p: PenroseTilingParams,
): THREE.BufferGeometry {
  const rng = seededRng(p.seed);
  const iters = 3 + Math.floor(p.complexity * 2);
  const depthBase = 0.06 * p.scale * (0.3 + (p.density ?? 0.5) * 0.8);

  let tris = initialStar();
  for (let i = 0; i < iters; i++) tris = deflate(tris);

  const scale = p.scale * 0.44;
  const geos: THREE.BufferGeometry[] = [];
  // Cap at 1500 tiles so deep iters stay snappy.
  const capped = tris.length > 1500 ? tris.slice(0, 1500) : tris;
  for (const t of capped) {
    const tp = t[0];
    const A = t[1];
    const B = t[2];
    const C = t[3];
    const h = depthBase * (tp === 0 ? 1 : 0.55) * (0.6 + rng() * 0.5);
    const shape = new THREE.Shape([
      new THREE.Vector2(A.x * scale, A.y * scale),
      new THREE.Vector2(B.x * scale, B.y * scale),
      new THREE.Vector2(C.x * scale, C.y * scale),
    ]);
    geos.push(new THREE.ExtrudeGeometry(shape, { depth: h, bevelEnabled: false }));
  }

  return normalise(mergeAll(geos), p.scale);
}

export function generate(p: PenroseTilingParams): GeneratedMesh {
  return attrsOf(generateGeometry(p));
}
