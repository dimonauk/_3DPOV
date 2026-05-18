/**
 * lib/aura-tron/geometry.ts
 *
 * Builds the three static buffer geometries the AuraTron landscape relies on:
 *   • face mesh  — a (COLS+1)×(ROWS+1) lattice indexed for two-triangle quads
 *   • wireframe  — line segments running both axes, with per-segment baked
 *                  colour band (LILAC/BLUSH/MINT) and pulse seeds
 *   • particles  — `count` points that orbit randomly chosen wire segments
 *
 * Lifted from
 * `D:\The_Hangar\Dolly_OS\src\components\void\aura-tron-landscape\geometry.ts`,
 * touched only for the site's stricter `noUncheckedIndexedAccess`: the
 * `wires` random-pick now uses a non-null assertion (the index is bounded by
 * `wires.length`, so the value is always defined).
 */
import * as THREE from "three";

import { COLS, ROWS } from "./terrain";

export function buildFaceGeo(): THREE.BufferGeometry {
  const verts: number[] = [];
  const idx: number[] = [];
  for (let zi = 0; zi <= ROWS; zi++) {
    for (let xi = 0; xi <= COLS; xi++) {
      verts.push(xi, 0, zi);
    }
  }
  for (let zi = 0; zi < ROWS; zi++) {
    for (let xi = 0; xi < COLS; xi++) {
      const tl = zi * (COLS + 1) + xi;
      const tr = tl + 1;
      const bl = (zi + 1) * (COLS + 1) + xi;
      const br = bl + 1;
      idx.push(tl, bl, br, tl, br, tr);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(verts), 3));
  g.setIndex(idx);
  return g;
}

export function buildWireGeo(): THREE.BufferGeometry {
  const pos: number[] = [];
  const col: number[] = [];

  const LILAC: [number, number, number] = [0.784, 0.608, 1.0];
  const BLUSH: [number, number, number] = [1.0, 0.627, 0.784];
  const MINT: [number, number, number] = [0.549, 1.0, 0.784];

  function colorFor(xi: number): [number, number, number] {
    const xn = xi / COLS;
    const dc = Math.abs(xn - 0.5) * 2.0;
    return dc < 0.35 ? LILAC : dc < 0.65 ? BLUSH : MINT;
  }

  for (let zi = 0; zi <= ROWS; zi++) {
    for (let xi = 0; xi < COLS; xi++) {
      const c = colorFor(xi);
      pos.push(xi, 0, zi, xi + 1, 0, zi);
      col.push(...c, ...c);
    }
  }
  for (let xi = 0; xi <= COLS; xi++) {
    const c = colorFor(xi);
    for (let zi = 0; zi < ROWS; zi++) {
      pos.push(xi, 0, zi, xi, 0, zi + 1);
      col.push(...c, ...c);
    }
  }

  const seed: number[] = [];
  const tVal: number[] = [];
  const totalVerts = pos.length / 3;
  for (let i = 0; i < totalVerts; i += 2) {
    const s = Math.random();
    const dir = Math.random() > 0.5 ? 1 : 0;
    seed.push(s, s);
    if (dir === 0) {
      tVal.push(0.0, 1.0);
    } else {
      tVal.push(1.0, 0.0);
    }
  }

  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(pos), 3));
  g.setAttribute("aColor", new THREE.BufferAttribute(new Float32Array(col), 3));
  g.setAttribute("aSeed", new THREE.BufferAttribute(new Float32Array(seed), 1));
  g.setAttribute("aT", new THREE.BufferAttribute(new Float32Array(tVal), 1));
  return g;
}

export function buildParticleGeo(count: number): THREE.BufferGeometry {
  const COLS_L = 48;
  const ROWS_L = 64;
  const wires: Array<[number, number, number, number]> = [];
  for (let zi = 0; zi <= ROWS_L; zi++) {
    for (let xi = 0; xi < COLS_L; xi++) {
      wires.push([xi, zi, xi + 1, zi]);
    }
  }
  for (let xi = 0; xi <= COLS_L; xi++) {
    for (let zi = 0; zi < ROWS_L; zi++) {
      wires.push([xi, zi, xi, zi + 1]);
    }
  }

  const starts = new Float32Array(count * 2);
  const ends = new Float32Array(count * 2);
  const speeds = new Float32Array(count);
  const seeds = new Float32Array(count);
  const pos = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    // The index is bounded by wires.length, so the entry is always defined.
    const w = wires[Math.floor(Math.random() * wires.length)]!;
    const fwd = Math.random() > 0.5;
    starts[i * 2] = fwd ? w[0] : w[2];
    starts[i * 2 + 1] = fwd ? w[1] : w[3];
    ends[i * 2] = fwd ? w[2] : w[0];
    ends[i * 2 + 1] = fwd ? w[3] : w[1];
    speeds[i] = 0.15 + Math.random() * 0.7;
    seeds[i] = Math.random();
  }

  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  g.setAttribute("aWireStart", new THREE.BufferAttribute(starts, 2));
  g.setAttribute("aWireEnd", new THREE.BufferAttribute(ends, 2));
  g.setAttribute("aSpeed", new THREE.BufferAttribute(speeds, 1));
  g.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
  return g;
}
