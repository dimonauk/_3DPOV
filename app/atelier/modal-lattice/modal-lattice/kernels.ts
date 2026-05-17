/**
 * app/atelier/modal-lattice/modal-lattice/kernels.ts — Separable 1D
 * lattice-interpolation kernels: linear, B-spline (uniform cubic
 * smoothing), Catmull-Rom (interpolating, tangent-continuous),
 * Cardinal (interpolating with tension = 0.25).
 *
 * Extracted from modal-lattice-client.tsx per ARCHITECTURE.md
 * Rule 1.
 */

import type { Kernel } from "./types";

/**
 * Evaluate four kernel weights for a parameter t in [0, n-1], given
 * n control points along an axis. Returns { i0, w[4] } where the
 * sample is sum_{k=0..3} w[k] * P[clamp(i0 + k, 0, n-1)].
 * For n == 1, returns a degenerate kernel that just picks index 0.
 */
export function kernelWeights(
  kernel: Kernel,
  t: number,
  n: number,
): { i0: number; w: [number, number, number, number] } {
  if (n <= 1) return { i0: 0, w: [1, 0, 0, 0] };
  const tc = Math.max(0, Math.min(n - 1, t));

  if (kernel === "linear") {
    const i = Math.floor(tc);
    const i0 = Math.max(0, Math.min(n - 2, i));
    const f = tc - i0;
    return { i0: i0 - 1, w: [0, 1 - f, f, 0] };
  }

  // Cubic kernels: take four neighbouring points and a local parameter
  // f in [0, 1] between the middle two.
  const i = Math.floor(tc);
  const i0 = i - 1;
  const f = tc - i;
  const f2 = f * f;
  const f3 = f2 * f;

  if (kernel === "bspline") {
    // Uniform cubic B-spline basis: smoothing, doesn't interpolate.
    const w0 = (1 - 3 * f + 3 * f2 - f3) / 6;
    const w1 = (4 - 6 * f2 + 3 * f3) / 6;
    const w2 = (1 + 3 * f + 3 * f2 - 3 * f3) / 6;
    const w3 = f3 / 6;
    return { i0, w: [w0, w1, w2, w3] };
  }

  if (kernel === "catmull") {
    // Catmull-Rom: tension = 0.5 cardinal, tangent-continuous.
    const w0 = -0.5 * f3 + f2 - 0.5 * f;
    const w1 = 1.5 * f3 - 2.5 * f2 + 1;
    const w2 = -1.5 * f3 + 2 * f2 + 0.5 * f;
    const w3 = 0.5 * f3 - 0.5 * f2;
    return { i0, w: [w0, w1, w2, w3] };
  }

  // Cardinal with tension = 0.25 (crisper than catmull-rom).
  const c = 0.25;
  const w0 = -c * f + 2 * c * f2 - c * f3;
  const w1 = 1 + (c - 3) * f2 + (2 - c) * f3;
  const w2 = c * f + (3 - 2 * c) * f2 + (c - 2) * f3;
  const w3 = -c * f2 + c * f3;
  return { i0, w: [w0, w1, w2, w3] };
}
