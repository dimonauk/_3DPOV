/**
 * lib/algorithms/interlace.ts — Byzantine star-polygon weave.
 *
 * Ported from D:\The_Hangar\Dolly_OS\src\systems\jewel-array\geometry\
 * algorithms\algo_22_Interlace.ts. Concentric star-polygon layers
 * with an over-under Z oscillation and radial connectors.
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

export type InterlaceParams = CommonParams;

export function defaultParams(): InterlaceParams {
  return { seed: 2222, complexity: 0.5, scale: 1.0, density: 0.5 };
}

export function generateGeometry(p: InterlaceParams): THREE.BufferGeometry {
  const rng = seededRng(p.seed);
  const s = p.scale;
  const tubeR = 0.016 * s * (0.3 + (p.density ?? 0.5) * 0.85);
  const geos: THREE.BufferGeometry[] = [];
  const folds = 4 + Math.floor(rng() * 4);
  const layers = 2 + Math.floor(p.complexity * 2);

  for (let layer = 0; layer < layers; layer++) {
    const r = s * (0.15 + layer * 0.13);
    const pts: THREE.Vector3[] = [];
    const segs = folds * 8;
    for (let i = 0; i <= segs; i++) {
      const t = (i / segs) * Math.PI * 2;
      const starR = r * (1 + 0.35 * Math.cos(t * folds));
      const z = s * 0.04 * Math.sin(t * folds * 2 + layer * 1.3);
      pts.push(new THREE.Vector3(starR * Math.cos(t), starR * Math.sin(t), z));
    }
    const curve = new THREE.CatmullRomCurve3(pts, true);
    geos.push(new THREE.TubeGeometry(curve, segs, tubeR, 6, true));
  }

  const connectorCount = folds * 2;
  for (let i = 0; i < connectorCount; i++) {
    const a = (i / connectorCount) * Math.PI * 2;
    const inner = new THREE.Vector3(
      Math.cos(a) * s * 0.15,
      Math.sin(a) * s * 0.15,
      0,
    );
    const outer = new THREE.Vector3(
      Math.cos(a) * s * 0.42,
      Math.sin(a) * s * 0.42,
      0,
    );
    if (rng() > 0.45) {
      geos.push(
        new THREE.TubeGeometry(
          new THREE.LineCurve3(inner, outer),
          1,
          tubeR * 0.55,
          4,
          false,
        ),
      );
    }
  }

  geos.push(new THREE.CylinderGeometry(s * 0.06, s * 0.08, s * 0.04, folds));

  return normalise(mergeAll(geos), p.scale);
}

export function generate(p: InterlaceParams): GeneratedMesh {
  return attrsOf(generateGeometry(p));
}
