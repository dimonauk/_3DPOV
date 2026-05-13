/**
 * lib/algorithms/swept-sinuous.ts — Art-Nouveau tendril tubes.
 *
 * Ported from D:\The_Hangar\Dolly_OS\src\systems\jewel-array\geometry\
 * algorithms\algo_11_SweptSinuous.ts. Sinuous curves swept along
 * tapered profiles with an optional petal cap.
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

export type SweptSinuousParams = CommonParams;

export function defaultParams(): SweptSinuousParams {
  return { seed: 1111, complexity: 0.5, scale: 1.0, density: 0.5 };
}

export function generateGeometry(
  p: SweptSinuousParams,
): THREE.BufferGeometry {
  const rng = seededRng(p.seed);
  const tendrils = 3 + Math.floor(p.complexity * 5);
  const geos: THREE.BufferGeometry[] = [];
  const baseR = 0.018 * p.scale * (0.3 + (p.density ?? 0.5) * 0.9);

  for (let t = 0; t < tendrils; t++) {
    const phase = (t / tendrils) * Math.PI * 2 + rng() * 0.5;
    const amp = p.scale * (0.12 + rng() * 0.2);
    const freq = 1.5 + rng() * 2;
    const twist = (rng() - 0.5) * 0.8;
    const pts: THREE.Vector3[] = [];
    const segs = 60;
    for (let i = 0; i <= segs; i++) {
      const u = i / segs;
      const x = Math.sin(phase + u * Math.PI * freq) * amp * (1 - u * 0.5);
      const y = (u - 0.5) * p.scale * 0.8;
      const z =
        Math.cos(phase + u * Math.PI * freq * 0.7 + twist) * amp * 0.35;
      pts.push(new THREE.Vector3(x, y, z));
    }
    const curve = new THREE.CatmullRomCurve3(pts);
    const tubeGeo = new THREE.TubeGeometry(
      curve,
      50,
      baseR * (0.7 + rng() * 0.5),
      7,
      false,
    );
    geos.push(tubeGeo);

    if (rng() > 0.4) {
      const tip = pts[pts.length - 1];
      if (tip) {
        const leafGeo = new THREE.SphereGeometry(
          baseR * (1.5 + rng() * 2),
          8,
          6,
        );
        leafGeo.scale(1, 1.6, 0.5);
        leafGeo.translate(tip.x, tip.y, tip.z);
        geos.push(leafGeo);
      }
    }
  }

  return normalise(mergeAll(geos), p.scale);
}

export function generate(p: SweptSinuousParams): GeneratedMesh {
  return attrsOf(generateGeometry(p));
}
