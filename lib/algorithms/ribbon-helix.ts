/**
 * lib/algorithms/ribbon-helix.ts — Protein alpha-helix pleated ribbon.
 *
 * Ported from D:\The_Hangar\Dolly_OS\src\systems\jewel-array\geometry\
 * algorithms\algo_28_RibbonHelix.ts. One to three twisted ribbons,
 * each a sequence of small box segments along a CatmullRom backbone,
 * with periodic side-chain nubs.
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

export type RibbonHelixParams = CommonParams;

export function defaultParams(): RibbonHelixParams {
  return { seed: 28, complexity: 0.65, scale: 1.0, density: 0.55 };
}

export function generateGeometry(
  p: RibbonHelixParams,
): THREE.BufferGeometry {
  const rng = seededRng(p.seed);
  const s = p.scale;
  const geos: THREE.BufferGeometry[] = [];

  const strands = 1 + Math.floor(rng() * 3);
  const turns = 2 + rng() * 3;
  const radius = s * 0.28;
  const ribbonW = s * (0.06 + rng() * 0.1);
  const ribbonT = s * 0.025;
  const stepsPerTurn = 32;
  const totalSteps = Math.floor(turns * stepsPerTurn);

  for (let strand = 0; strand < strands; strand++) {
    const phaseOffset = (strand / strands) * Math.PI * 2;

    const backbonePts: THREE.Vector3[] = [];
    for (let i = 0; i <= totalSteps; i++) {
      const t = i / totalSteps;
      const angle = t * Math.PI * 2 * turns + phaseOffset;
      const z = (t - 0.5) * s;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      backbonePts.push(new THREE.Vector3(x, y, z));
    }

    for (let i = 0; i < backbonePts.length - 1; i++) {
      const p0 = backbonePts[i];
      const p1 = backbonePts[i + 1];
      if (!p0 || !p1) continue;
      const dir = new THREE.Vector3().subVectors(p1, p0);
      const len = dir.length();

      const ribbon = new THREE.BoxGeometry(ribbonW, len + 0.001, ribbonT);
      ribbon.applyMatrix4(
        new THREE.Matrix4().lookAt(p0, p1, new THREE.Vector3(0, 0, 1)),
      );
      ribbon.translate(
        (p0.x + p1.x) / 2,
        (p0.y + p1.y) / 2,
        (p0.z + p1.z) / 2,
      );
      geos.push(ribbon);
    }

    const curve = new THREE.CatmullRomCurve3(backbonePts);
    geos.push(new THREE.TubeGeometry(curve, totalSteps, s * 0.018, 5, false));

    const hbondFreq = 3 + Math.floor(rng() * 3);
    for (let i = 0; i < totalSteps; i += hbondFreq) {
      const pt = backbonePts[i];
      if (!pt) continue;
      const nub = new THREE.SphereGeometry(s * 0.035, 5, 4);
      nub.translate(pt.x * 1.35, pt.y * 1.35, pt.z);
      geos.push(nub);
    }
  }

  return normalise(mergeAll(geos), p.scale);
}

export function generate(p: RibbonHelixParams): GeneratedMesh {
  return attrsOf(generateGeometry(p));
}
