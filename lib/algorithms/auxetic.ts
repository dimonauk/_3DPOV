/**
 * lib/algorithms/auxetic.ts — Re-entrant honeycomb auxetic lattice.
 *
 * Ported from D:\The_Hangar\Dolly_OS\src\systems\jewel-array\geometry\
 * algorithms\algo_04_AuxeticCorrugation.ts. Cells of three thin tube
 * ribs in a V shape with occasional cross-rib and a node sphere at
 * the apex. Re-entrant geometry gives the negative-Poisson-ratio
 * property in the physical realisation.
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

export type AuxeticParams = CommonParams;

export function defaultParams(): AuxeticParams {
  return { seed: 404, complexity: 0.5, scale: 1.0, density: 0.5 };
}

export function generateGeometry(p: AuxeticParams): THREE.BufferGeometry {
  const rng = seededRng(p.seed);
  const rows = 4 + Math.floor(p.complexity * 5);
  const cols = 4 + Math.floor(p.complexity * 5);
  const cellW = (p.scale * 0.88) / cols;
  const cellH = (p.scale * 0.88) / rows;
  const ribW = cellW * 0.14 * (0.3 + (p.density ?? 0.5) * 0.9);
  const depth = 0.055 * p.scale;
  const angle = (0.28 + rng() * 0.22) * Math.PI;
  const geos: THREE.BufferGeometry[] = [];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cx = (c - cols / 2 + 0.5) * cellW;
      const cy = (r - rows / 2 + 0.5) * cellH;
      const jitter = rng() * 0.06 * cellW;
      const v1 = new THREE.Vector3(
        cx - cellW * 0.4 + jitter,
        cy - cellH * 0.3,
        0,
      );
      const v2 = new THREE.Vector3(
        cx + jitter,
        cy + cellH * 0.32 * Math.cos(angle),
        depth * (rng() - 0.5),
      );
      const v3 = new THREE.Vector3(
        cx + cellW * 0.4 + jitter,
        cy - cellH * 0.3,
        0,
      );
      geos.push(
        new THREE.TubeGeometry(
          new THREE.LineCurve3(v1, v2),
          1,
          ribW,
          4,
          false,
        ),
      );
      geos.push(
        new THREE.TubeGeometry(
          new THREE.LineCurve3(v2, v3),
          1,
          ribW,
          4,
          false,
        ),
      );
      if (rng() > 0.55) {
        const v4 = new THREE.Vector3(
          cx + jitter,
          cy - cellH * 0.3,
          depth * rng() * 0.3,
        );
        geos.push(
          new THREE.TubeGeometry(
            new THREE.LineCurve3(v2, v4),
            1,
            ribW * 0.7,
            4,
            false,
          ),
        );
      }
      const node = new THREE.SphereGeometry(ribW * 1.6, 6, 5);
      node.translate(v2.x, v2.y, v2.z);
      geos.push(node);
    }
  }
  return normalise(mergeAll(geos), p.scale);
}

export function generate(p: AuxeticParams): GeneratedMesh {
  return attrsOf(generateGeometry(p));
}
