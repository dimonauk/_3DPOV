/**
 * lib/algorithms/torus-knot.ts — Parametric (p,q) torus knot.
 *
 * Ported from D:\The_Hangar\Dolly_OS\src\systems\jewel-array\geometry\
 * algorithms\algo_20_TorusKnot.ts. Seeded random (p,q) pair from a
 * small canonical pool — three.js builds the rest.
 */

import * as THREE from "three";
import {
  type CommonParams,
  type GeneratedMesh,
  attrsOf,
  normalise,
  seededRng,
} from "./_base";

export type TorusKnotParams = CommonParams;

export function defaultParams(): TorusKnotParams {
  return { seed: 777, complexity: 0.3, scale: 1.0, density: 0.4 };
}

const P_POOL = [2, 3, 3, 5, 2] as const;
const Q_POOL = [3, 4, 5, 3, 7] as const;

export function generateGeometry(p: TorusKnotParams): THREE.BufferGeometry {
  const rng = seededRng(p.seed);
  const pIdx = Math.floor(rng() * P_POOL.length);
  const qIdx = Math.floor(rng() * Q_POOL.length);
  const pk = P_POOL[pIdx] ?? 2;
  const qk = Q_POOL[qIdx] ?? 3;
  const geo = new THREE.TorusKnotGeometry(
    0.38 * p.scale,
    0.07 * p.scale * (0.5 + (p.density ?? 0.5)),
    120,
    12,
    pk,
    qk,
  );
  return normalise(geo, p.scale);
}

export function generate(p: TorusKnotParams): GeneratedMesh {
  return attrsOf(generateGeometry(p));
}
