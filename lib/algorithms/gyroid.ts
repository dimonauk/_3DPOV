/**
 * lib/algorithms/gyroid.ts — Approximate gyroid isosurface patch.
 *
 * Ported from D:\The_Hangar\Dolly_OS\src\systems\jewel-array\geometry\
 * algorithms\algo_02_Gyroid.ts. The original used Three.js
 * ParametricGeometry; that helper was removed from three core, so we
 * inline the parametric-surface construction here.
 *
 * The gyroid is Schoen's triply-periodic minimal surface:
 *   sin(x)cos(y) + sin(y)cos(z) + sin(z)cos(x) = 0
 * The patch below solves the isosurface as z = asin(...) over the
 * (u, v) parameter square — a single-sheet approximation, enough for
 * the visual preview.
 */

import * as THREE from "three";
import {
  type CommonParams,
  type GeneratedMesh,
  attrsOf,
  normalise,
} from "./_base";

export type GyroidParams = CommonParams;

export function defaultParams(): GyroidParams {
  return { seed: 42, complexity: 0.5, scale: 1.0, density: 0.5 };
}

function parametricSurface(
  fn: (u: number, v: number, target: THREE.Vector3) => void,
  segsU: number,
  segsV: number,
): THREE.BufferGeometry {
  const positions: number[] = [];
  const indices: number[] = [];
  const uvs: number[] = [];
  const v = new THREE.Vector3();
  for (let i = 0; i <= segsU; i++) {
    for (let j = 0; j <= segsV; j++) {
      const u = i / segsU;
      const w = j / segsV;
      fn(u, w, v);
      positions.push(v.x, v.y, v.z);
      uvs.push(u, w);
    }
  }
  const stride = segsV + 1;
  for (let i = 0; i < segsU; i++) {
    for (let j = 0; j < segsV; j++) {
      const a = i * stride + j;
      const b = a + 1;
      const c = a + stride;
      const d = c + 1;
      indices.push(a, b, c, b, d, c);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

export function generateGeometry(p: GyroidParams): THREE.BufferGeometry {
  const freq = 1.5 + p.complexity * 2.5;
  const res = 40;
  const geo = parametricSurface(
    (u, v, target) => {
      const x = (u - 0.5) * Math.PI * 2 * freq;
      const y = (v - 0.5) * Math.PI * 2 * freq;
      const denom = Math.sin(y) * Math.cos(x) || 0.001;
      const z = Math.asin(
        Math.max(-1, Math.min(1, (-Math.sin(x) * Math.cos(y)) / denom)),
      );
      target.set(
        (u - 0.5) * p.scale,
        (v - 0.5) * p.scale,
        z * 0.15 * p.scale,
      );
    },
    res,
    res,
  );
  return normalise(geo, p.scale);
}

export function generate(p: GyroidParams): GeneratedMesh {
  return attrsOf(generateGeometry(p));
}
