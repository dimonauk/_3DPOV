/**
 * lib/algorithms/non-euclidean.ts — Poincaré-disk hyperbolic warp.
 *
 * Ported from D:\The_Hangar\Dolly_OS\src\systems\jewel-array\geometry\
 * algorithms\algo_25_NonEuclidean.ts. Radial spokes + concentric
 * rings mapped through the Poincaré-disk model so the geometry
 * compresses near the disc boundary the way hyperbolic space does.
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

export type NonEuclideanParams = CommonParams;

export function defaultParams(): NonEuclideanParams {
  return { seed: 25, complexity: 0.8, scale: 1.0, density: 0.55 };
}

function poincare(
  x: number,
  y: number,
  strength: number,
): [number, number] {
  const r2 = x * x + y * y;
  const factor = 1 / (1 + strength * r2);
  return [x * factor, y * factor];
}

export function generateGeometry(
  p: NonEuclideanParams,
): THREE.BufferGeometry {
  const rng = seededRng(p.seed);
  const s = p.scale * 0.48;
  const geos: THREE.BufferGeometry[] = [];
  const warpStr = 0.5 + rng() * 1.5;
  const rings = 4 + Math.floor(rng() * 4);
  const spokeCount = 5 + Math.floor(rng() * 5);

  for (let sp = 0; sp < spokeCount; sp++) {
    const baseAngle = (sp / spokeCount) * Math.PI * 2;
    const pts: THREE.Vector3[] = [];
    for (let t = 0; t <= 20; t++) {
      const frac = t / 20;
      const ux = Math.cos(baseAngle) * frac;
      const uy = Math.sin(baseAngle) * frac;
      const [wx, wy] = poincare(ux, uy, warpStr);
      pts.push(new THREE.Vector3(wx * s, wy * s, 0));
    }
    const curve = new THREE.CatmullRomCurve3(pts);
    geos.push(new THREE.TubeGeometry(curve, 20, s * 0.025, 5, false));
  }

  for (let ri = 0; ri < rings; ri++) {
    const r = (ri + 1) / (rings + 1);
    const pts: THREE.Vector3[] = [];
    const steps = 48 + ri * 8;
    for (let t = 0; t <= steps; t++) {
      const a = (t / steps) * Math.PI * 2;
      const [wx, wy] = poincare(Math.cos(a) * r, Math.sin(a) * r, warpStr);
      pts.push(new THREE.Vector3(wx * s, wy * s, 0));
    }
    const curve = new THREE.CatmullRomCurve3(pts, true);
    const thickness = s * (0.02 + 0.015 * ri);
    geos.push(new THREE.TubeGeometry(curve, steps, thickness, 5, true));
  }

  for (let sp = 0; sp < spokeCount; sp++) {
    for (let ri = 1; ri < rings; ri++) {
      const angle = (sp / spokeCount) * Math.PI * 2;
      const r = (ri + 1) / (rings + 1);
      const [wx, wy] = poincare(Math.cos(angle) * r, Math.sin(angle) * r, warpStr);
      const node = new THREE.SphereGeometry(s * 0.04, 5, 4);
      node.translate(wx * s, wy * s, 0);
      geos.push(node);
    }
  }

  return normalise(mergeAll(geos), p.scale);
}

export function generate(p: NonEuclideanParams): GeneratedMesh {
  return attrsOf(generateGeometry(p));
}
