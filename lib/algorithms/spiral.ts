/**
 * lib/algorithms/spiral.ts — Logarithmic / Fermat-style spiral tube.
 *
 * Ported from D:\The_Hangar\Dolly_OS\src\systems\jewel-array\geometry\
 * algorithms\algo_01_Spiral.ts. The Hangar's BaseAlgorithm class
 * hierarchy is dropped; this module is pure functions.
 *
 * The spiral is a CatmullRomCurve3 swept into a TubeGeometry; growth
 * rate, vertical climb and revolution count are pulled from
 * (seed, complexity, scale).
 */

import * as THREE from "three";
import {
  type CommonParams,
  type GeneratedMesh,
  attrsOf,
  normalise,
  seededRng,
} from "./_base";

export type SpiralParams = CommonParams;

export function defaultParams(): SpiralParams {
  return { seed: 42, complexity: 0.5, scale: 1.0, density: 0.5 };
}

export function generateGeometry(p: SpiralParams): THREE.BufferGeometry {
  const rng = seededRng(p.seed);
  const points: THREE.Vector3[] = [];
  const count = 200 + Math.floor(p.complexity * 800);

  const growth = 0.1 + rng() * 0.2;
  const zGrowth = 5 + rng() * 15;
  const revolutions = 3 + p.complexity * 10;

  for (let i = 0; i < count; i++) {
    const t = i / count;
    const angle = t * Math.PI * 2 * revolutions;
    const radius = Math.pow(Math.E, growth * angle) * 0.1;
    points.push(
      new THREE.Vector3(
        radius * Math.cos(angle),
        radius * Math.sin(angle),
        t * zGrowth * p.scale,
      ),
    );
  }

  const curve = new THREE.CatmullRomCurve3(points);
  const tubeR = 0.03 * p.scale * (0.5 + (p.density ?? 0.5));
  const tubeGeo = new THREE.TubeGeometry(curve, count, tubeR, 8, false);
  return normalise(tubeGeo, p.scale);
}

export function generate(p: SpiralParams): GeneratedMesh {
  return attrsOf(generateGeometry(p));
}
