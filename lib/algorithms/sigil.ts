/**
 * lib/algorithms/sigil.ts — Procedural sigil plotter.
 *
 * Ported from D:\The_Hangar\Dolly_OS\src\systems\jewel-array\geometry\
 * algorithms\algo_19_Sigil.ts. Outer ring, optional inner rings,
 * star polygon (every-Nth chord), radial spokes, central eye, outer
 * polygon at high complexity.
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

export type SigilParams = CommonParams;

export function defaultParams(): SigilParams {
  return { seed: 1919, complexity: 0.5, scale: 1.0, density: 0.5 };
}

export function generateGeometry(p: SigilParams): THREE.BufferGeometry {
  const rng = seededRng(p.seed);
  const s = p.scale;
  const tubeR = 0.018 * s * (0.25 + (p.density ?? 0.5) * 0.9);
  const depth = 0.055 * s;
  const geos: THREE.BufferGeometry[] = [];

  geos.push(new THREE.TorusGeometry(s * 0.42, tubeR * 0.7, 6, 40));

  const innerRings = 1 + Math.floor(p.complexity * 2);
  for (let ring = 0; ring < innerRings; ring++) {
    const r = s * (0.28 - ring * 0.09);
    if (r > s * 0.04) {
      geos.push(new THREE.TorusGeometry(r, tubeR * 0.55, 6, 32));
    }
  }

  const pts = 5 + Math.floor(rng() * 5);
  const circleR = s * 0.42;
  const nodes: THREE.Vector3[] = [];
  for (let i = 0; i < pts; i++) {
    const a = (i / pts) * Math.PI * 2 - Math.PI / 2;
    nodes.push(
      new THREE.Vector3(Math.cos(a) * circleR, Math.sin(a) * circleR, 0),
    );
  }

  const step = 2 + Math.floor(rng() * Math.floor(pts / 2 - 1));
  for (let i = 0; i < pts; i++) {
    const j = (i + step) % pts;
    const a = nodes[i];
    const b = nodes[j];
    if (!a || !b) continue;
    geos.push(
      new THREE.TubeGeometry(new THREE.LineCurve3(a, b), 1, tubeR, 5, false),
    );
  }

  const centre = new THREE.Vector3(0, 0, depth * 0.3);
  for (let i = 0; i < pts; i++) {
    const node = nodes[i];
    if (!node) continue;
    if (rng() > 0.4) {
      geos.push(
        new THREE.TubeGeometry(
          new THREE.LineCurve3(node, centre),
          1,
          tubeR * 0.6,
          4,
          false,
        ),
      );
    }
  }

  geos.push(new THREE.SphereGeometry(s * 0.055, 8, 6));
  geos.push(new THREE.CylinderGeometry(s * 0.03, s * 0.03, depth * 0.8, 16));

  if (p.complexity > 0.5) {
    const triPts = 3 + Math.floor(rng() * 2);
    const triR = s * 0.44;
    for (let i = 0; i < triPts; i++) {
      const a1 = (i / triPts) * Math.PI * 2;
      const a2 = ((i + 1) / triPts) * Math.PI * 2;
      const v1 = new THREE.Vector3(
        Math.cos(a1) * triR,
        Math.sin(a1) * triR,
        0,
      );
      const v2 = new THREE.Vector3(
        Math.cos(a2) * triR,
        Math.sin(a2) * triR,
        0,
      );
      geos.push(
        new THREE.TubeGeometry(
          new THREE.LineCurve3(v1, v2),
          1,
          tubeR * 0.8,
          5,
          false,
        ),
      );
    }
  }

  return normalise(mergeAll(geos), p.scale);
}

export function generate(p: SigilParams): GeneratedMesh {
  return attrsOf(generateGeometry(p));
}
