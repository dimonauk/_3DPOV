/**
 * lib/algorithms/wing-venation.ts — Moth / dragonfly wing graph.
 *
 * Ported from D:\The_Hangar\Dolly_OS\src\systems\jewel-array\geometry\
 * algorithms\algo_15_WingVenation.ts. Costal leading-edge spine,
 * radiating main veins, cross-vein bridges, eyespot torii.
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

export type WingVenationParams = CommonParams;

export function defaultParams(): WingVenationParams {
  return { seed: 1515, complexity: 0.5, scale: 1.0, density: 0.5 };
}

export function generateGeometry(
  p: WingVenationParams,
): THREE.BufferGeometry {
  const rng = seededRng(p.seed);
  const mainVeins = 4 + Math.floor(p.complexity * 5);
  const s = p.scale;
  const tubeR = 0.016 * s * (0.3 + (p.density ?? 0.5) * 0.9);
  const geos: THREE.BufferGeometry[] = [];

  const costalPts: THREE.Vector3[] = [];
  for (let i = 0; i <= 12; i++) {
    const t = i / 12;
    costalPts.push(
      new THREE.Vector3(
        (t - 0.5) * s * 0.9,
        s * 0.3 + t * s * 0.1,
        (rng() - 0.5) * s * 0.04,
      ),
    );
  }
  geos.push(
    new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3(costalPts),
      12,
      tubeR * 1.5,
      6,
      false,
    ),
  );

  const root = new THREE.Vector3(-s * 0.44, s * 0.3, 0);

  for (let v = 0; v < mainVeins; v++) {
    const t = (v + 0.5) / mainVeins;
    const tipX = (t - 0.5) * s * 0.85;
    const tipY = -s * (0.2 + rng() * 0.2);
    const midPts = [
      root.clone(),
      new THREE.Vector3(
        tipX * 0.4 + (rng() - 0.5) * s * 0.08,
        s * 0.12,
        (rng() - 0.5) * s * 0.05,
      ),
      new THREE.Vector3(tipX * 0.75, -s * 0.05, (rng() - 0.5) * s * 0.04),
      new THREE.Vector3(tipX, tipY, 0),
    ];
    geos.push(
      new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3(midPts),
        8,
        tubeR,
        5,
        false,
      ),
    );

    if (v > 0 && rng() > 0.35) {
      const c1 = new THREE.Vector3(tipX * 0.5, -s * 0.04, 0);
      const c2 = new THREE.Vector3(
        tipX * 0.5 - s * 0.07,
        -s * 0.04 + (rng() - 0.5) * s * 0.06,
        0,
      );
      geos.push(
        new THREE.TubeGeometry(
          new THREE.LineCurve3(c1, c2),
          1,
          tubeR * 0.65,
          4,
          false,
        ),
      );
    }
  }

  const spotX = s * 0.3;
  const spotY = -s * 0.28;
  const rings = 2 + Math.floor(p.complexity * 2);
  for (let ring = 0; ring < rings; ring++) {
    const ringR = s * (0.04 + ring * 0.028);
    const eye = new THREE.TorusGeometry(ringR, tubeR * (1.1 - ring * 0.2), 6, 20);
    eye.translate(spotX, spotY, 0);
    geos.push(eye);
  }

  return normalise(mergeAll(geos), p.scale);
}

export function generate(p: WingVenationParams): GeneratedMesh {
  return attrsOf(generateGeometry(p));
}
