/**
 * lib/algorithms/mon.ts — Edo family-crest generator.
 *
 * Ported from D:\The_Hangar\Dolly_OS\src\systems\jewel-array\geometry\
 * algorithms\algo_23_Mon.ts. Radial symmetry of order 5..8, multiple
 * concentric layers, optional petal / rhombus / spoke primitive per
 * node, central disc.
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

export type MonParams = CommonParams;

export function defaultParams(): MonParams {
  return { seed: 23, complexity: 0.6, scale: 1.0, density: 0.7 };
}

export function generateGeometry(p: MonParams): THREE.BufferGeometry {
  const rng = seededRng(p.seed);
  const s = p.scale * 0.5;
  const order = 5 + Math.floor(rng() * 4);
  const layers = 1 + Math.floor(rng() * 3);
  const geos: THREE.BufferGeometry[] = [];

  geos.push(new THREE.TorusGeometry(s * 0.9, s * 0.04, 8, 64));

  for (let layer = 0; layer < layers; layer++) {
    const r = s * (0.75 - layer * 0.22);
    for (let i = 0; i < order; i++) {
      const angle = (i / order) * Math.PI * 2;
      const type = Math.floor(rng() * 3);
      let g: THREE.BufferGeometry;
      if (type === 0) {
        g = new THREE.SphereGeometry(s * 0.08, 6, 4);
        g.scale(1, 2.2, 0.4);
      } else if (type === 1) {
        g = new THREE.BoxGeometry(s * 0.06, s * 0.18, s * 0.06);
      } else {
        g = new THREE.CylinderGeometry(s * 0.025, s * 0.025, r * 0.45, 6);
        g.rotateX(Math.PI / 2);
      }
      g.translate(Math.cos(angle) * r, Math.sin(angle) * r, 0);
      geos.push(g);

      const sp = new THREE.CylinderGeometry(s * 0.015, s * 0.015, r * 0.35, 5);
      sp.rotateZ(Math.PI / 2 + angle);
      sp.translate(Math.cos(angle) * r * 0.45, Math.sin(angle) * r * 0.45, 0);
      geos.push(sp);
    }
    if (layer < layers - 1) {
      geos.push(new THREE.TorusGeometry(r * 0.55, s * 0.025, 6, order * 2));
    }
  }
  geos.push(new THREE.CylinderGeometry(s * 0.12, s * 0.12, s * 0.07, order));

  return normalise(mergeAll(geos), p.scale);
}

export function generate(p: MonParams): GeneratedMesh {
  return attrsOf(generateGeometry(p));
}
