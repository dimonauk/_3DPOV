/**
 * app/atelier/modal-lattice/modal-lattice/shape-factory.ts — Builds
 * the three base geometries (sphere / torus / icosa) + maps each
 * rest-space vertex into normalised lattice coordinates derived
 * from the geometry's bounding box.
 *
 * Extracted from modal-lattice-client.tsx per ARCHITECTURE.md
 * Rule 1.
 */

import * as THREE from "three";

import type { Shape } from "./types";

export function makeShape(shape: Shape): THREE.BufferGeometry {
  switch (shape) {
    case "sphere":
      return new THREE.SphereGeometry(0.42, 64, 48);
    case "torus":
      return new THREE.TorusGeometry(0.32, 0.12, 32, 96);
    case "icosa":
      return new THREE.IcosahedronGeometry(0.45, 4);
  }
}

/** From a base geometry, compute the rest positions and the
 *  normalised lattice coordinates uvw in [0,1]^3 derived from the
 *  geometry's bounding box. */
export function shapeToLatticeSpace(geom: THREE.BufferGeometry): {
  rest: Float32Array;
  uvw: Float32Array;
} {
  geom.computeBoundingBox();
  const bb = geom.boundingBox!;
  const min = bb.min;
  const size = new THREE.Vector3().subVectors(bb.max, bb.min);
  const posAttr = geom.attributes.position;
  if (!posAttr) throw new Error("geometry has no position attribute");
  const pos = posAttr.array as Float32Array;
  const rest = new Float32Array(pos.length);
  const uvw = new Float32Array(pos.length);
  for (let i = 0; i < pos.length; i += 3) {
    const px = pos[i] as number;
    const py = pos[i + 1] as number;
    const pz = pos[i + 2] as number;
    rest[i] = px;
    rest[i + 1] = py;
    rest[i + 2] = pz;
    uvw[i] = (px - min.x) / Math.max(1e-6, size.x);
    uvw[i + 1] = (py - min.y) / Math.max(1e-6, size.y);
    uvw[i + 2] = (pz - min.z) / Math.max(1e-6, size.z);
  }
  return { rest, uvw };
}
