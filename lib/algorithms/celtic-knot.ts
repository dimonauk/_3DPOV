/**
 * lib/algorithms/celtic-knot.ts — Multi-strand braided torus knot.
 *
 * Ported from D:\The_Hangar\Dolly_OS\src\systems\jewel-array\geometry\
 * algorithms\algo_10_CelticKnot.ts. Interlocking tubes with a Z-axis
 * oscillation that fakes the over-under weave at the resolution of a
 * .glb preview.
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

export type CelticKnotParams = CommonParams;

export function defaultParams(): CelticKnotParams {
  return { seed: 1010, complexity: 0.5, scale: 1.0, density: 0.5 };
}

export function generateGeometry(
  p: CelticKnotParams,
): THREE.BufferGeometry {
  const rng = seededRng(p.seed);
  const s = p.scale;
  const strands = 2 + Math.floor(p.complexity * 3);
  const loops = 2 + Math.floor(rng() * 3);
  const r = s * 0.36;
  const tubeR = s * 0.028 * (0.5 + (p.density ?? 0.5));
  const geos: THREE.BufferGeometry[] = [];
  for (let st = 0; st < strands; st++) {
    const phase = (st / strands) * Math.PI * 2;
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 140; i++) {
      const t = (i / 140) * Math.PI * 2;
      const x = r * Math.cos(t * loops + phase);
      const y = r * Math.sin(t * loops + phase);
      const z = s * 0.07 * Math.sin(t * loops * 2 + phase * 1.5);
      pts.push(new THREE.Vector3(x, y, z));
    }
    geos.push(
      new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3(pts, true),
        140,
        tubeR,
        8,
        true,
      ),
    );
  }
  geos.push(new THREE.TorusGeometry(r * 0.15, tubeR * 0.8, 8, 32));
  return normalise(mergeAll(geos), p.scale);
}

export function generate(p: CelticKnotParams): GeneratedMesh {
  return attrsOf(generateGeometry(p));
}
