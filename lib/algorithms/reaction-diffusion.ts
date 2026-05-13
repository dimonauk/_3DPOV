/**
 * lib/algorithms/reaction-diffusion.ts — Gray-Scott heightmap.
 *
 * Ported in the spirit of D:\The_Hangar\Dolly_OS\src\systems\jewel-
 * array\geometry\algorithms\algo_17_ReactionDiffusion.ts. The Hangar
 * version ran on a 28×28 grid with three Gray-Scott presets and an
 * async worker path; the studio brief picks a fixed 64×64 grid, the
 * canonical F=0.055 / k=0.062 spot kernel, and a synchronous loop of
 * 200–400 steps governed by `complexity`. The simulation produces a
 * scalar field that becomes the Z height of a PlaneGeometry.
 *
 * Visually: leopard-spot / coral-pore pattern raised out of a flat
 * plane.
 */

import * as THREE from "three";
import {
  type CommonParams,
  type GeneratedMesh,
  attrsOf,
  normalise,
  seededRng,
} from "./_base";

export type ReactionDiffusionParams = CommonParams;

export function defaultParams(): ReactionDiffusionParams {
  return { seed: 1717, complexity: 0.5, scale: 1.0, density: 0.5 };
}

const N = 64;
const F = 0.055;
const K = 0.062;
const DU = 0.16;
const DV = 0.08;

/** Run the simulation and return the final v-field as a length-N*N Float32Array. */
function simulate(seed: number, complexity: number): Float32Array {
  const rng = seededRng(seed);
  const steps = 200 + Math.floor(complexity * 200);
  const size = N * N;
  let u = new Float32Array(size);
  let v = new Float32Array(size);
  for (let i = 0; i < size; i++) u[i] = 1;

  // Seed perturbation: 8–12 small v=1 blobs.
  const blobs = 8 + Math.floor(rng() * 5);
  for (let b = 0; b < blobs; b++) {
    const cx = Math.floor(rng() * N);
    const cy = Math.floor(rng() * N);
    for (let dy = -2; dy <= 2; dy++) {
      for (let dx = -2; dx <= 2; dx++) {
        const ix = ((cx + dx) % N + N) % N;
        const iy = ((cy + dy) % N + N) % N;
        const idx = iy * N + ix;
        v[idx] = 1;
        u[idx] = 0;
      }
    }
  }

  const nu = new Float32Array(size);
  const nv = new Float32Array(size);
  for (let step = 0; step < steps; step++) {
    for (let y = 0; y < N; y++) {
      const yUp = (y - 1 + N) % N;
      const yDn = (y + 1) % N;
      for (let x = 0; x < N; x++) {
        const i = y * N + x;
        const xL = (x - 1 + N) % N;
        const xR = (x + 1) % N;
        const ui = u[i] ?? 0;
        const vi = v[i] ?? 0;
        const lapU =
          (u[y * N + xL] ?? 0) + (u[y * N + xR] ?? 0) +
          (u[yUp * N + x] ?? 0) + (u[yDn * N + x] ?? 0) -
          4 * ui;
        const lapV =
          (v[y * N + xL] ?? 0) + (v[y * N + xR] ?? 0) +
          (v[yUp * N + x] ?? 0) + (v[yDn * N + x] ?? 0) -
          4 * vi;
        const uvv = ui * vi * vi;
        nu[i] = Math.min(1, Math.max(0, ui + DU * lapU - uvv + F * (1 - ui)));
        nv[i] = Math.min(1, Math.max(0, vi + DV * lapV + uvv - (F + K) * vi));
      }
    }
    // Swap by copying — keeps the two buffers reused, no per-step alloc.
    u.set(nu);
    v.set(nv);
  }
  return v;
}

export function generateGeometry(
  p: ReactionDiffusionParams,
): THREE.BufferGeometry {
  const field = simulate(p.seed, p.complexity);
  const s = p.scale;
  const geo = new THREE.PlaneGeometry(s * 0.9, s * 0.9, N - 1, N - 1);
  const pos = geo.getAttribute("position") as THREE.BufferAttribute;
  const hScale = s * 0.18 * (0.4 + (p.density ?? 0.5) * 0.8);
  for (let i = 0; i < pos.count; i++) {
    const idx = i % (N * N);
    pos.setZ(i, (field[idx] ?? 0) * hScale);
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
  return normalise(geo, p.scale);
}

export function generate(p: ReactionDiffusionParams): GeneratedMesh {
  return attrsOf(generateGeometry(p));
}
