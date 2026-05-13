/**
 * lib/algorithms/fermat-spiral.ts — Phyllotaxis disc packing.
 *
 * Ported from D:\The_Hangar\Dolly_OS\src\systems\jewel-array\geometry\
 * algorithms\algo_05_FermatSpiral.ts. Sunflower-seed packing at the
 * golden-angle 137.5°; each seed becomes a tapered hex cylinder.
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

export type FermatSpiralParams = CommonParams;

export function defaultParams(): FermatSpiralParams {
  return { seed: 505, complexity: 0.5, scale: 1.0, density: 0.5 };
}

export function generateGeometry(p: FermatSpiralParams): THREE.BufferGeometry {
  const rng = seededRng(p.seed);
  const n = 60 + Math.floor(p.complexity * 140);
  const golden = Math.PI * (3 - Math.sqrt(5));
  const maxR = p.scale * 0.46;
  const blobR = (maxR / Math.sqrt(n)) * (1.2 + (p.density ?? 0.5) * 0.8);
  const h = blobR * (1.5 + rng());
  const geos: THREE.BufferGeometry[] = [];

  for (let i = 0; i < n; i++) {
    const r = maxR * Math.sqrt(i / n);
    const theta = golden * i;
    const x = r * Math.cos(theta);
    const y = r * Math.sin(theta);
    const z = (rng() - 0.5) * h * 0.5;
    const geo = new THREE.CylinderGeometry(blobR * 0.7, blobR, h, 6);
    geo.translate(x, y, z);
    geos.push(geo);
  }
  return normalise(mergeAll(geos), p.scale);
}

export function generate(p: FermatSpiralParams): GeneratedMesh {
  return attrsOf(generateGeometry(p));
}
