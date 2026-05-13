/**
 * lib/algorithms/lsystem.ts — Space-colonisation branching.
 *
 * Ported from D:\The_Hangar\Dolly_OS\src\systems\jewel-array\geometry\
 * algorithms\algo_03_LSystem.ts. Despite the file name in the
 * registry, the algorithm here is the space-colonisation method
 * (Runions, Lane & Prusinkiewicz 2007) rather than a true Lindenmayer
 * grammar — it grows a node graph toward random attractors and
 * tube-meshes the parent links.
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

export type LSystemParams = CommonParams;

export function defaultParams(): LSystemParams {
  return { seed: 123, complexity: 0.5, scale: 1.0, density: 0.4 };
}

export function generateGeometry(p: LSystemParams): THREE.BufferGeometry {
  const rng = seededRng(p.seed);
  const attractors: THREE.Vector3[] = [];
  const count = 40 + Math.floor(p.complexity * 80);
  for (let i = 0; i < count; i++) {
    attractors.push(
      new THREE.Vector3(
        (rng() - 0.5) * p.scale,
        rng() * p.scale * 0.8 + 0.1,
        (rng() - 0.5) * p.scale * 0.3,
      ),
    );
  }
  const segLen = 0.08 * p.scale;
  const killR = segLen * 1.5;
  const infR = p.scale * 0.6;
  const nodes: { pos: THREE.Vector3; parent: number }[] = [
    { pos: new THREE.Vector3(0, -p.scale * 0.4, 0), parent: -1 },
  ];
  const dead = new Set<number>();
  const maxIter = 60 + Math.floor(p.complexity * 60);
  for (let iter = 0; iter < maxIter; iter++) {
    const growDir = new Map<number, THREE.Vector3>();
    for (let ai = 0; ai < attractors.length; ai++) {
      if (dead.has(ai)) continue;
      const att = attractors[ai];
      if (!att) continue;
      let closest = -1;
      let minD = Infinity;
      for (let ni = 0; ni < nodes.length; ni++) {
        const node = nodes[ni];
        if (!node) continue;
        const d = node.pos.distanceTo(att);
        if (d < minD) {
          minD = d;
          closest = ni;
        }
      }
      if (closest < 0) continue;
      if (minD < killR) {
        dead.add(ai);
        continue;
      }
      if (minD < infR) {
        const closestNode = nodes[closest];
        if (!closestNode) continue;
        const dir = att.clone().sub(closestNode.pos).normalize();
        const existing = growDir.get(closest);
        if (existing) {
          existing.add(dir);
        } else {
          growDir.set(closest, dir.clone());
        }
      }
    }
    growDir.forEach((dir, ni) => {
      dir.normalize();
      const parent = nodes[ni];
      if (!parent) return;
      const newPos = parent.pos.clone().add(dir.multiplyScalar(segLen));
      nodes.push({ pos: newPos, parent: ni });
    });
    if (growDir.size === 0) break;
  }
  const geos: THREE.BufferGeometry[] = [];
  const r = 0.018 * p.scale * (0.5 + (p.density ?? 0.5));
  for (const n of nodes) {
    if (n.parent < 0) continue;
    const parent = nodes[n.parent];
    if (!parent) continue;
    const curve = new THREE.LineCurve3(parent.pos, n.pos);
    geos.push(new THREE.TubeGeometry(curve, 1, r, 5, false));
  }
  return normalise(mergeAll(geos), p.scale);
}

export function generate(p: LSystemParams): GeneratedMesh {
  return attrsOf(generateGeometry(p));
}
