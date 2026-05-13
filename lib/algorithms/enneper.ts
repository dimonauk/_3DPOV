/**
 * lib/algorithms/enneper.ts — Enneper minimal surface patch.
 *
 * Ported in the spirit of D:\The_Hangar\Dolly_OS\src\systems\jewel-array\
 * geometry\algorithms\algo_29_Enneper.ts. The brief asks for the classic
 * Enneper parametric form (u - u³/3 + uv², v - v³/3 + vu², u² - v²) on
 * a tessellated (u, v) grid; the Hangar's generalised-order / twist
 * machinery is dropped to keep this under 150 lines.
 *
 * Visually: a four-lobed self-intersecting saddle — Enneper's surface
 * read as a soap-film fossil. A thin border tube traces the patch
 * outline so the silhouette stays crisp against dark backgrounds.
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

export type EnneperParams = CommonParams;

export function defaultParams(): EnneperParams {
  return { seed: 2929, complexity: 0.5, scale: 1.0, density: 0.4 };
}

/** Build the Enneper patch as an indexed grid mesh. */
function buildPatch(
  res: number,
  range: number,
  s: number,
): THREE.BufferGeometry {
  const positions: number[] = [];
  const indices: number[] = [];
  for (let i = 0; i <= res; i++) {
    for (let j = 0; j <= res; j++) {
      const u = (i / res - 0.5) * 2 * range;
      const v = (j / res - 0.5) * 2 * range;
      const x = u - (u * u * u) / 3 + u * v * v;
      const y = v - (v * v * v) / 3 + v * u * u;
      const z = u * u - v * v;
      // Quarter-scale on Z so the saddle doesn't dominate the unit cube
      // before normalise() rescales the whole patch.
      positions.push(x * s, y * s, z * s * 0.5);
    }
  }
  const stride = res + 1;
  for (let i = 0; i < res; i++) {
    for (let j = 0; j < res; j++) {
      const a = i * stride + j;
      const b = a + 1;
      const c = a + stride;
      const d = c + 1;
      indices.push(a, b, c, b, d, c);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

/** Trace the patch border as a closed Catmull-Rom tube. */
function buildBorder(
  res: number,
  range: number,
  s: number,
  r: number,
): THREE.BufferGeometry {
  const ring: THREE.Vector3[] = [];
  const sample = (u: number, v: number): THREE.Vector3 => {
    const x = u - (u * u * u) / 3 + u * v * v;
    const y = v - (v * v * v) / 3 + v * u * u;
    const z = u * u - v * v;
    return new THREE.Vector3(x * s, y * s, z * s * 0.5);
  };
  for (let i = 0; i < res; i++) {
    const t = (i / res - 0.5) * 2 * range;
    ring.push(sample(t, -range));
  }
  for (let i = 0; i < res; i++) {
    const t = (i / res - 0.5) * 2 * range;
    ring.push(sample(range, t));
  }
  for (let i = 0; i < res; i++) {
    const t = -((i / res - 0.5) * 2 * range);
    ring.push(sample(t, range));
  }
  for (let i = 0; i < res; i++) {
    const t = -((i / res - 0.5) * 2 * range);
    ring.push(sample(-range, t));
  }
  return new THREE.TubeGeometry(
    new THREE.CatmullRomCurve3(ring, true),
    ring.length,
    r,
    6,
    true,
  );
}

export function generateGeometry(p: EnneperParams): THREE.BufferGeometry {
  const rng = seededRng(p.seed);
  const res = 28 + Math.floor(p.complexity * 24);
  const range = 1.4 + rng() * 0.4;
  const s = p.scale * 0.35;
  const borderR = 0.018 * p.scale * (0.5 + (p.density ?? 0.5));

  const patch = buildPatch(res, range, s);
  const border = buildBorder(Math.max(24, res), range, s, borderR);
  return normalise(mergeAll([patch, border]), p.scale);
}

export function generate(p: EnneperParams): GeneratedMesh {
  return attrsOf(generateGeometry(p));
}
