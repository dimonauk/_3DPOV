/**
 * app/atelier/modal-lattice/modal-lattice/lattice.ts — Rest-lattice
 * construction + the tensor-product deform that maps every base
 * vertex through the chosen kernel.
 *
 * Extracted from modal-lattice-client.tsx per ARCHITECTURE.md
 * Rule 1.
 */

import { kernelWeights } from "./kernels";
import type { Kernel, LatticeDims } from "./types";

/** Generate a flat array of (u*v*w * 3) rest-position lattice points
 *  evenly distributed across [-0.5, 0.5]^3. */
export function makeRestLattice(dims: LatticeDims): Float32Array {
  const { u, v, w } = dims;
  const out = new Float32Array(u * v * w * 3);
  const idx = (i: number, j: number, k: number) => ((k * v + j) * u + i) * 3;
  for (let k = 0; k < w; k++) {
    const tw = w > 1 ? k / (w - 1) - 0.5 : 0;
    for (let j = 0; j < v; j++) {
      const tv = v > 1 ? j / (v - 1) - 0.5 : 0;
      for (let i = 0; i < u; i++) {
        const tu = u > 1 ? i / (u - 1) - 0.5 : 0;
        const o = idx(i, j, k);
        out[o] = tu;
        out[o + 1] = tv;
        out[o + 2] = tw;
      }
    }
  }
  return out;
}

/** Deform: read rest verts (uvw in [0,1]^3), write deformed positions
 *  by sampling the lattice with the chosen kernel. Mutates `outPos`. */
export function deform(
  uvw: Float32Array,
  lattice: Float32Array,
  dims: LatticeDims,
  kernel: Kernel,
  outPos: Float32Array,
): void {
  const { u, v, w } = dims;
  const latIdx = (i: number, j: number, k: number) =>
    ((Math.max(0, Math.min(w - 1, k)) * v +
      Math.max(0, Math.min(v - 1, j))) *
      u +
      Math.max(0, Math.min(u - 1, i))) *
    3;

  const nVerts = uvw.length / 3;
  for (let vi = 0; vi < nVerts; vi++) {
    const tu = (uvw[vi * 3] as number) * (u - 1);
    const tv = (uvw[vi * 3 + 1] as number) * (v - 1);
    const tw = (uvw[vi * 3 + 2] as number) * (w - 1);

    const ku = kernelWeights(kernel, tu, u);
    const kv = kernelWeights(kernel, tv, v);
    const kw = kernelWeights(kernel, tw, w);

    let x = 0,
      y = 0,
      z = 0;
    for (let dw = 0; dw < 4; dw++) {
      const wwt = kw.w[dw] as number;
      if (wwt === 0) continue;
      const ki = kw.i0 + dw;
      for (let dv = 0; dv < 4; dv++) {
        const wvt = kv.w[dv] as number;
        if (wvt === 0) continue;
        const ji = kv.i0 + dv;
        for (let du = 0; du < 4; du++) {
          const wut = ku.w[du] as number;
          if (wut === 0) continue;
          const ii = ku.i0 + du;
          const o = latIdx(ii, ji, ki);
          const ww = wut * wvt * wwt;
          x += (lattice[o] as number) * ww;
          y += (lattice[o + 1] as number) * ww;
          z += (lattice[o + 2] as number) * ww;
        }
      }
    }
    outPos[vi * 3] = x;
    outPos[vi * 3 + 1] = y;
    outPos[vi * 3 + 2] = z;
  }
}
