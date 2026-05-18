/**
 * app/atelier/sculpture-gallery/sculpture-gallery/build-geometry.ts —
 * Marches a scalar field at the given iso level into a Three
 * BufferGeometry. Pure helper — no React, no global state.
 *
 * Extracted from sculpture-gallery-client.tsx per ARCHITECTURE.md
 * Rule 1.
 */

import * as THREE from "three";

import { marchingCubes } from "../marching";
import type { Field } from "../voxels";

export function buildGeometry(field: Field, iso: number): THREE.BufferGeometry {
  const { positions, normals } = marchingCubes(field, iso);
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  g.setAttribute("normal", new THREE.BufferAttribute(normals, 3));
  return g;
}
