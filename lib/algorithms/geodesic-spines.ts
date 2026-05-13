/**
 * lib/algorithms/geodesic-spines.ts — Radiolarian-style spined sphere.
 *
 * Ported from D:\The_Hangar\Dolly_OS\src\systems\jewel-array\geometry\
 * algorithms\algo_09_GeodesicSpines.ts. Cones rise from the verts of
 * an icosahedron-derived sphere.
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

export type GeodesicSpinesParams = CommonParams;

export function defaultParams(): GeodesicSpinesParams {
  return { seed: 909, complexity: 0.5, scale: 1.0, density: 0.5 };
}

export function generateGeometry(
  p: GeodesicSpinesParams,
): THREE.BufferGeometry {
  const rng = seededRng(p.seed);
  const detail = 1 + Math.floor(p.complexity * 2);
  const s = p.scale;
  const geos: THREE.BufferGeometry[] = [];
  geos.push(new THREE.SphereGeometry(s * 0.35, 16 + detail * 4, 12 + detail * 2));
  const ico = new THREE.IcosahedronGeometry(s * 0.35, detail);
  const pos = ico.attributes.position;
  if (!pos) {
    ico.dispose();
    return normalise(mergeAll(geos), p.scale);
  }
  const seen = new Set<string>();
  for (let i = 0; i < pos.count; i++) {
    const v = new THREE.Vector3().fromBufferAttribute(
      pos as THREE.BufferAttribute,
      i,
    );
    const key = `${v.x.toFixed(2)},${v.y.toFixed(2)},${v.z.toFixed(2)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const spineLen = s * (0.1 + rng() * 0.22 * (0.3 + p.complexity));
    const dir = v.clone().normalize();
    const cone = new THREE.ConeGeometry(s * 0.018, spineLen, 5);
    cone.applyQuaternion(
      new THREE.Quaternion().setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        dir,
      ),
    );
    const tip = dir.clone().multiplyScalar(s * 0.37);
    cone.translate(tip.x, tip.y, tip.z);
    geos.push(cone);
  }
  ico.dispose();
  return normalise(mergeAll(geos), p.scale);
}

export function generate(p: GeodesicSpinesParams): GeneratedMesh {
  return attrsOf(generateGeometry(p));
}
