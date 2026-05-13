/**
 * lib/algorithms/step-fret.ts — Mesoamerican step-fret recursion.
 *
 * Ported from D:\The_Hangar\Dolly_OS\src\systems\jewel-array\geometry\
 * algorithms\algo_21_StepFret.ts. Each fret is four boxes arranged
 * around a corner; the algorithm recurses into smaller frets.
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

export type StepFretParams = CommonParams;

export function defaultParams(): StepFretParams {
  return { seed: 2121, complexity: 0.5, scale: 1.0, density: 0.5 };
}

export function generateGeometry(p: StepFretParams): THREE.BufferGeometry {
  const rng = seededRng(p.seed);
  const depth = 0.065 * p.scale * (0.4 + (p.density ?? 0.5) * 0.7);
  const s = p.scale;
  const geos: THREE.BufferGeometry[] = [];
  const levels = 2 + Math.floor(p.complexity * 3);

  const addFret = (
    x: number,
    y: number,
    size: number,
    angle: number,
    level: number,
  ): void => {
    if (level <= 0 || size < s * 0.03) return;
    const w = size * 0.12;
    const segs: [number, number, number, number][] = [
      [0, 0, size, w],
      [size - w, 0, w, size],
      [0, size - w, size * 0.6, w],
      [0, 0, w, size * 0.5],
    ];
    for (const [sx, sy, sw, sh] of segs) {
      const box = new THREE.BoxGeometry(sw, sh, depth);
      box.rotateZ(angle);
      box.translate(
        x + sx + sw / 2 - size / 2,
        y + sy + sh / 2 - size / 2,
        0,
      );
      geos.push(box);
    }
    addFret(
      x + size * 0.35,
      y + size * 0.35,
      size * 0.45,
      angle + Math.PI * 0.5 * (rng() > 0.5 ? 1 : -1),
      level - 1,
    );
  };

  const rootSize = s * 0.72;
  const copies = 1 + Math.floor(rng() * 3);
  for (let c = 0; c < copies; c++) {
    const angle = (c / copies) * Math.PI * 0.5;
    addFret(-rootSize / 2, -rootSize / 2, rootSize, angle, levels);
  }

  return normalise(mergeAll(geos), p.scale);
}

export function generate(p: StepFretParams): GeneratedMesh {
  return attrsOf(generateGeometry(p));
}
