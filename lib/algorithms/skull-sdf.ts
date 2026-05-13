/**
 * lib/algorithms/skull-sdf.ts — Bilateral cranial topology.
 *
 * Ported from D:\The_Hangar\Dolly_OS\src\systems\jewel-array\geometry\
 * algorithms\algo_14_SkullSDF.ts. Sphere-boolean blend of cranium,
 * cheekbones, eye-torii, nasal ridge, teeth row. Not a real SDF
 * marching-cubes pass — the name is from the original; the
 * implementation is sphere-union.
 */

import * as THREE from "three";
import {
  type CommonParams,
  type GeneratedMesh,
  attrsOf,
  mergeAll,
  seededRng,
} from "./_base";

export type SkullSdfParams = CommonParams;

export function defaultParams(): SkullSdfParams {
  return { seed: 42, complexity: 0.5, scale: 1.0, density: 0.5 };
}

export function generateGeometry(p: SkullSdfParams): THREE.BufferGeometry {
  const rng = seededRng(p.seed);
  const s = p.scale;
  const geos: THREE.BufferGeometry[] = [];

  const cranium = new THREE.SphereGeometry(s * 0.35, 20, 16);
  cranium.scale(1, 1.05, 0.95);
  geos.push(cranium);

  for (const side of [-1, 1]) {
    const cheek = new THREE.SphereGeometry(s * 0.12, 12, 10);
    cheek.translate(side * s * 0.22, -s * 0.12, s * 0.08);
    geos.push(cheek);
  }

  for (const side of [-1, 1]) {
    const eye = new THREE.TorusGeometry(s * 0.075, s * 0.022, 8, 16);
    eye.rotateX(Math.PI * 0.1);
    eye.translate(side * s * 0.13, s * 0.07, s * 0.28);
    geos.push(eye);
  }

  const nose = new THREE.CapsuleGeometry(s * 0.03, s * 0.06, 4, 8);
  nose.rotateX(Math.PI / 2);
  nose.translate(0, -s * 0.06, s * 0.3);
  geos.push(nose);

  const teethCount = 4 + Math.floor(p.complexity * 6);
  for (let i = 0; i < teethCount; i++) {
    const toothW = (s * 0.3) / teethCount;
    const tooth = new THREE.BoxGeometry(toothW * 0.8, s * 0.05, s * 0.04);
    tooth.translate(
      (i - teethCount / 2 + 0.5) * toothW,
      -s * 0.32,
      s * 0.2 + rng() * s * 0.02,
    );
    geos.push(tooth);
  }

  if (p.complexity > 0.6) {
    const inner = new THREE.SphereGeometry(s * 0.08, 8, 6);
    inner.translate(0, s * 0.1, 0);
    geos.push(inner);
  }

  return mergeAll(geos);
}

export function generate(p: SkullSdfParams): GeneratedMesh {
  return attrsOf(generateGeometry(p));
}
