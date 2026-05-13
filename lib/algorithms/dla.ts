/**
 * lib/algorithms/dla.ts — Diffusion-Limited Aggregation cluster.
 *
 * Ported from D:\The_Hangar\Dolly_OS\src\systems\jewel-array\geometry\
 * algorithms\algo_06_DLA.ts. We drop the worker-backed `generateAsync`
 * path because the studio's `generate(...)` contract is synchronous,
 * keep the lattice random-walk core, and stay snappy by clamping the
 * particle count to ≤500 (the legacy class capped at 160 — we expand
 * that proportionally with `complexity`).
 *
 * Each occupied lattice site becomes a small sphere; the spheres are
 * merged into one BufferGeometry and normalised to the unit cube. The
 * visual is a fractal coral / snowflake aggregate clustered around the
 * seed at the origin.
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

export type DLAParams = CommonParams;

export function defaultParams(): DLAParams {
  return { seed: 606, complexity: 0.5, scale: 1.0, density: 0.4 };
}

/** Cardinal-direction lookup, declared once to keep the inner loop tight. */
const DX = [1, -1, 0, 0] as const;
const DY = [0, 0, 1, -1] as const;

export function generateGeometry(p: DLAParams): THREE.BufferGeometry {
  const rng = seededRng(p.seed);
  const particles = Math.min(500, 80 + Math.floor(p.complexity * 420));

  // Lattice occupancy. We pack (x, y) into a single int key (offset by
  // 1<<14 so negatives stay non-negative inside the safe int range).
  const occ = new Set<number>();
  const stuck: Array<[number, number]> = [[0, 0]];
  const key = (x: number, y: number): number => ((x + 16384) << 15) | (y + 16384);
  occ.add(key(0, 0));
  let maxR = 0;

  for (let i = 0; i < particles; i++) {
    const angle = rng() * Math.PI * 2;
    const r = maxR + 5;
    let x = Math.round(r * Math.cos(angle));
    let y = Math.round(r * Math.sin(angle));
    for (let step = 0; step < 2000; step++) {
      const dir = Math.floor(rng() * 4);
      const dx = DX[dir] ?? 0;
      const dy = DY[dir] ?? 0;
      x += dx;
      y += dy;
      // Drift back if walker escapes far past the active radius.
      const rr = Math.sqrt(x * x + y * y);
      if (rr > maxR + 20) {
        const k = (maxR + 18) / rr;
        x = Math.round(x * k);
        y = Math.round(y * k);
      }
      if (
        occ.has(key(x - 1, y)) ||
        occ.has(key(x + 1, y)) ||
        occ.has(key(x, y - 1)) ||
        occ.has(key(x, y + 1))
      ) {
        occ.add(key(x, y));
        stuck.push([x, y]);
        maxR = Math.max(maxR, Math.sqrt(x * x + y * y));
        break;
      }
    }
  }

  const scale = p.scale * 0.4;
  const radius = scale * 0.1 * (0.5 + (p.density ?? 0.5));
  const step = scale * 0.16;
  const geos: THREE.BufferGeometry[] = [];
  for (const site of stuck) {
    const sx = site[0];
    const sy = site[1];
    const g = new THREE.SphereGeometry(radius, 6, 5);
    g.translate(sx * step, 0, sy * step);
    geos.push(g);
  }

  return normalise(mergeAll(geos), p.scale);
}

export function generate(p: DLAParams): GeneratedMesh {
  return attrsOf(generateGeometry(p));
}
