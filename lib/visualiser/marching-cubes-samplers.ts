/**
 * lib/visualiser/marching-cubes-samplers.ts — Scalar-field samplers.
 *
 * Pure builders for the three field presets the visualiser exposes:
 * sphere (signed-distance), gyroid (triply periodic minimal surface),
 * coherent value-noise (Mulberry32 PRNG → trilinear blur). Each returns
 * a `ScalarField` over the [-1, 1]^3 box. No React, no Three.js.
 */

import type { ScalarField } from "./marching-cubes-math";
import { cellToWorld } from "./marching-cubes-table";

function allocField(
  dims: [number, number, number],
): { values: Float32Array; bounds: [number, number] } {
  const [nx, ny, nz] = dims;
  return { values: new Float32Array(nx * ny * nz), bounds: [-1, 1] };
}

/** Centred sphere of given radius in the [-1, 1]^3 box; iso = 0. */
export function sampleSphere(
  dims: [number, number, number],
  radius: number,
): ScalarField {
  const { values, bounds } = allocField(dims);
  const [nx, ny, nz] = dims;
  for (let k = 0; k < nz; k++) {
    for (let j = 0; j < ny; j++) {
      for (let i = 0; i < nx; i++) {
        const [x, y, z] = cellToWorld(i, j, k, dims, bounds);
        const d = Math.sqrt(x * x + y * y + z * z) - radius;
        values[i + j * nx + k * nx * ny] = d;
      }
    }
  }
  return { dims, values, bounds };
}

/** Gyroid SDF on [-1, 1]^3 with the given period (in units of 2π). */
export function sampleGyroid(
  dims: [number, number, number],
  period: number,
): ScalarField {
  const { values, bounds } = allocField(dims);
  const [nx, ny, nz] = dims;
  const k = (Math.PI * 2) / Math.max(period, 1e-3);
  for (let kk = 0; kk < nz; kk++) {
    for (let jj = 0; jj < ny; jj++) {
      for (let ii = 0; ii < nx; ii++) {
        const [x, y, z] = cellToWorld(ii, jj, kk, dims, bounds);
        const u = x * k;
        const v = y * k;
        const w = z * k;
        const f =
          Math.sin(u) * Math.cos(v) +
          Math.sin(v) * Math.cos(w) +
          Math.sin(w) * Math.cos(u);
        values[ii + jj * nx + kk * nx * ny] = f;
      }
    }
  }
  return { dims, values, bounds };
}

/** Coherent 3D value-noise. Cheap, seedable, no external dep. */
export function sampleNoise(
  dims: [number, number, number],
  seed: number,
): ScalarField {
  const { values, bounds } = allocField(dims);
  const [nx, ny, nz] = dims;

  let s = (seed | 0) >>> 0;
  const rng = () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const lx = Math.max(2, Math.ceil(nx / 2));
  const ly = Math.max(2, Math.ceil(ny / 2));
  const lz = Math.max(2, Math.ceil(nz / 2));
  const lattice = new Float32Array(lx * ly * lz);
  for (let i = 0; i < lattice.length; i++) lattice[i] = rng() * 2 - 1;
  const latticeAt = (a: number, b: number, c: number): number => {
    const ai = Math.min(Math.max(a, 0), lx - 1);
    const bi = Math.min(Math.max(b, 0), ly - 1);
    const ci = Math.min(Math.max(c, 0), lz - 1);
    return lattice[ai + bi * lx + ci * lx * ly] ?? 0;
  };

  for (let kk = 0; kk < nz; kk++) {
    for (let jj = 0; jj < ny; jj++) {
      for (let ii = 0; ii < nx; ii++) {
        const u = (ii / Math.max(1, nx - 1)) * (lx - 1);
        const v = (jj / Math.max(1, ny - 1)) * (ly - 1);
        const w = (kk / Math.max(1, nz - 1)) * (lz - 1);
        const u0 = Math.floor(u);
        const v0 = Math.floor(v);
        const w0 = Math.floor(w);
        const fu = u - u0;
        const fv = v - v0;
        const fw = w - w0;
        const c000 = latticeAt(u0, v0, w0);
        const c100 = latticeAt(u0 + 1, v0, w0);
        const c010 = latticeAt(u0, v0 + 1, w0);
        const c110 = latticeAt(u0 + 1, v0 + 1, w0);
        const c001 = latticeAt(u0, v0, w0 + 1);
        const c101 = latticeAt(u0 + 1, v0, w0 + 1);
        const c011 = latticeAt(u0, v0 + 1, w0 + 1);
        const c111 = latticeAt(u0 + 1, v0 + 1, w0 + 1);
        const c00 = c000 + (c100 - c000) * fu;
        const c01 = c001 + (c101 - c001) * fu;
        const c10 = c010 + (c110 - c010) * fu;
        const c11 = c011 + (c111 - c011) * fu;
        const c0 = c00 + (c10 - c00) * fv;
        const c1 = c01 + (c11 - c01) * fv;
        values[ii + jj * nx + kk * nx * ny] = c0 + (c1 - c0) * fw;
      }
    }
  }
  return { dims, values, bounds };
}
