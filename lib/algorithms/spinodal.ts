/**
 * lib/algorithms/spinodal.ts — Cahn-Hilliard spinodal-decomposition relief.
 *
 * # Purpose
 * Closes the `spinodal` slot in the 30-algorithm catalogue (id 27). The
 * Cahn-Hilliard equation drives a scalar field from a small random
 * perturbation into a bicontinuous two-phase pattern — the same
 * geometry that real metals adopt when they unmix in the solid state.
 * We run the PDE on a 2D 96×96 toroidal grid and lift the final field
 * into a heightmap relief, matching how `reaction-diffusion.ts`
 * stages its Gray-Scott field.
 *
 * # Why this shape
 * The brief offered the simpler 2D-plate reading rather than 3D
 * marching cubes; that lets us reuse the PlaneGeometry-as-relief
 * pattern from `reaction-diffusion.ts` and avoid a new MC dependency.
 * Cahn-Hilliard is solved via the standard split: compute
 * μ = −εΔφ + φ³ − φ on a 5-point Laplacian, then advance
 * ∂φ/∂t = M Δμ on the same stencil.
 */

import * as THREE from "three";
import {
  type CommonParams,
  type GeneratedMesh,
  attrsOf,
  normalise,
  seededRng,
} from "./_base";

export type SpinodalParams = CommonParams;

export function defaultParams(): SpinodalParams {
  return { seed: 2727, complexity: 0.5, scale: 1.0, density: 0.5 };
}

const N = 96;
const M = 1.0;
const EPS = 0.5;
const DT = 0.05;

/** Discrete 5-point Laplacian on a periodic N×N grid, in place into `out`. */
function laplacian(field: Float32Array, out: Float32Array): void {
  for (let y = 0; y < N; y++) {
    const yUp = (y - 1 + N) % N;
    const yDn = (y + 1) % N;
    for (let x = 0; x < N; x++) {
      const xL = (x - 1 + N) % N;
      const xR = (x + 1) % N;
      const i = y * N + x;
      out[i] =
        (field[y * N + xL] ?? 0) +
        (field[y * N + xR] ?? 0) +
        (field[yUp * N + x] ?? 0) +
        (field[yDn * N + x] ?? 0) -
        4 * (field[i] ?? 0);
    }
  }
}

/** Run Cahn-Hilliard for `steps` iterations and return the final phi field. */
function simulate(seed: number, complexity: number): Float32Array {
  const rng = seededRng(seed);
  const steps = 150 + Math.floor(complexity * 250);
  const size = N * N;
  const phi = new Float32Array(size);
  for (let i = 0; i < size; i++) phi[i] = (rng() - 0.5) * 0.2;

  const mu = new Float32Array(size);
  const lapPhi = new Float32Array(size);
  const lapMu = new Float32Array(size);

  for (let s = 0; s < steps; s++) {
    laplacian(phi, lapPhi);
    for (let i = 0; i < size; i++) {
      const v = phi[i] ?? 0;
      mu[i] = -EPS * (lapPhi[i] ?? 0) + v * v * v - v;
    }
    laplacian(mu, lapMu);
    for (let i = 0; i < size; i++) {
      phi[i] = (phi[i] ?? 0) + DT * M * (lapMu[i] ?? 0);
    }
  }
  return phi;
}

export function generateGeometry(p: SpinodalParams): THREE.BufferGeometry {
  const field = simulate(p.seed, p.complexity);
  const s = p.scale;
  const geo = new THREE.PlaneGeometry(s * 0.9, s * 0.9, N - 1, N - 1);
  const pos = geo.getAttribute("position") as THREE.BufferAttribute;
  const hScale = s * 0.16 * (0.4 + (p.density ?? 0.5) * 0.9);
  // Threshold-tinged height: a soft tanh sharpens the bicontinuous
  // domain boundaries so the relief reads as plateau-and-valley.
  for (let i = 0; i < pos.count; i++) {
    const idx = i % (N * N);
    const v = field[idx] ?? 0;
    const lifted = Math.tanh(v * 2.5);
    pos.setZ(i, lifted * hScale);
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
  return normalise(geo, p.scale);
}

export function generate(p: SpinodalParams): GeneratedMesh {
  return attrsOf(generateGeometry(p));
}
