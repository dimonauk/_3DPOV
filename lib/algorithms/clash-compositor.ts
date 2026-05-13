/**
 * lib/algorithms/clash-compositor.ts — Memphis-style two-algorithm clash.
 *
 * # Purpose
 * Closes the `clash-compositor` slot (catalogue id 24). The
 * Memphis-Cyber family aesthetic is built on deliberate visual
 * collision between unrelated geometries; this algorithm samples a
 * 3D chunk grid and, for each chunk, drops a small scaled copy of
 * one of two sibling algorithms (gyroid or step-fret). The result
 * is a single merged mesh whose alternating chunks read as two
 * disagreeing patterns interlocked in space.
 *
 * # Why this shape
 * The brief allowed dynamic imports across siblings; the registry's
 * `generateGeometry` contract is synchronous, so we use static
 * imports instead — the spatial-assignment logic is the
 * load-bearing part, not the import shape. Per-chunk we instantiate
 * a fresh small geometry from the chosen sibling with a per-chunk
 * seed, then translate it into the chunk's slot. That keeps the
 * variety in the clash high without leaking shared state between
 * chunks.
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
import * as gyroid from "./gyroid";
import * as stepFret from "./step-fret";

export type ClashCompositorParams = CommonParams;

export function defaultParams(): ClashCompositorParams {
  return { seed: 2424, complexity: 0.5, scale: 1.0, density: 0.5 };
}

type Source = {
  generateGeometry: (p: CommonParams) => THREE.BufferGeometry;
};

const SOURCES: Source[] = [
  { generateGeometry: gyroid.generateGeometry },
  { generateGeometry: stepFret.generateGeometry },
];

export function generateGeometry(
  p: ClashCompositorParams,
): THREE.BufferGeometry {
  const rng = seededRng(p.seed);
  // `complexity` drives chunk count (2³ → 5³).
  const grid = 2 + Math.floor(p.complexity * 3);
  const half = (grid - 1) / 2;
  const cellSize = p.scale / grid;
  const chunkScale = cellSize * 0.92;
  const density = p.density ?? 0.5;

  const geos: THREE.BufferGeometry[] = [];

  for (let z = 0; z < grid; z++) {
    for (let y = 0; y < grid; y++) {
      for (let x = 0; x < grid; x++) {
        // Drop empty chunks at low density so the clash has air.
        if (rng() > 0.35 + density * 0.6) continue;
        const choice = rng() < 0.5 ? 0 : 1;
        const src = SOURCES[choice];
        if (!src) continue;
        const subSeed = Math.floor(rng() * 9973) ^ ((x * 73 + y * 31 + z * 17) | 0);
        const sub = src.generateGeometry({
          seed: subSeed,
          complexity: 0.3 + rng() * 0.4,
          scale: chunkScale,
          density,
        });
        // Slight rotation jitter to amplify the clash.
        sub.rotateX(rng() * Math.PI);
        sub.rotateY(rng() * Math.PI);
        sub.rotateZ(rng() * Math.PI);
        sub.translate(
          (x - half) * cellSize,
          (y - half) * cellSize,
          (z - half) * cellSize,
        );
        geos.push(sub);
      }
    }
  }

  if (geos.length === 0) {
    // Guarantee a non-empty mesh even if seed/density collude to empty.
    const fallback = stepFret.generateGeometry({
      seed: p.seed + 1,
      complexity: 0.4,
      scale: p.scale * 0.6,
      density,
    });
    geos.push(fallback);
  }

  return normalise(mergeAll(geos), p.scale);
}

export function generate(p: ClashCompositorParams): GeneratedMesh {
  return attrsOf(generateGeometry(p));
}
