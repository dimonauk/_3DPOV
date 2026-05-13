/**
 * lib/algorithms/tensegrity.ts — Compression struts + tension cables.
 *
 * Ported from D:\The_Hangar\Dolly_OS\src\systems\jewel-array\geometry\
 * algorithms\algo_18_Tensegrity.ts. Random endpoints on a sphere
 * surface; thick cylinders for the struts; thin cylinders for the
 * cables that connect each endpoint to its two nearest neighbours.
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

export type TensegrityParams = CommonParams;

export function defaultParams(): TensegrityParams {
  return { seed: 1818, complexity: 0.5, scale: 1.0, density: 0.4 };
}

export function generateGeometry(p: TensegrityParams): THREE.BufferGeometry {
  const rng = seededRng(p.seed);
  const struts = 4 + Math.floor(p.complexity * 8);
  const s = p.scale;
  const strutR = 0.024 * s * (0.4 + (p.density ?? 0.5) * 0.7);
  const cableR = strutR * 0.36;
  const geos: THREE.BufferGeometry[] = [];

  const pts: THREE.Vector3[] = [];
  for (let i = 0; i < struts * 2; i++) {
    const theta = Math.acos(1 - 2 * rng());
    const phi = rng() * Math.PI * 2;
    pts.push(
      new THREE.Vector3(
        s * 0.4 * Math.sin(theta) * Math.cos(phi),
        s * 0.4 * Math.sin(theta) * Math.sin(phi),
        s * 0.25 * Math.cos(theta),
      ),
    );
  }

  for (let i = 0; i < struts; i++) {
    const a = pts[i * 2];
    const b = pts[i * 2 + 1];
    if (!a || !b) continue;
    geos.push(
      new THREE.TubeGeometry(new THREE.LineCurve3(a, b), 2, strutR, 6, false),
    );
    const ea = new THREE.SphereGeometry(strutR * 1.3, 6, 5);
    ea.translate(a.x, a.y, a.z);
    geos.push(ea);
    const eb = new THREE.SphereGeometry(strutR * 1.3, 6, 5);
    eb.translate(b.x, b.y, b.z);
    geos.push(eb);
  }

  for (let i = 0; i < pts.length; i++) {
    const here = pts[i];
    if (!here) continue;
    const sorted = pts
      .map((p2, j) => ({ j, d: here.distanceTo(p2) }))
      .filter((e) => e.j !== i)
      .sort((x, y) => x.d - y.d);
    for (const { j } of sorted.slice(0, 2)) {
      const target = pts[j];
      if (!target) continue;
      if (j > i) {
        geos.push(
          new THREE.TubeGeometry(
            new THREE.LineCurve3(here, target),
            1,
            cableR,
            4,
            false,
          ),
        );
      }
    }
  }

  return normalise(mergeAll(geos), p.scale);
}

export function generate(p: TensegrityParams): GeneratedMesh {
  return attrsOf(generateGeometry(p));
}
