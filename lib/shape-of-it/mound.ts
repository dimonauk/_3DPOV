/**
 * lib/shape-of-it/mound.ts
 *
 * Pure math for the spine geometry: the mound silhouette function, the
 * per-height tightness modulator, and the body-thread brightness gradient
 * that goes dark across The Break and slowly rekindles upward.
 *
 * No three.js imports — these are runnable in any environment.
 * Helpers, not a content registry; kept here next to the data it serves.
 */

import { BREAK_T, Y_BOTTOM, Y_RANGE } from "./chambers";

/**
 * How tightly the threads coil at height t (0..1). Tightest at The Break,
 * slowly loosening upward.
 */
export function getTightness(t: number): number {
  const bDist = Math.abs(t - BREAK_T);
  return Math.max(0.08, 0.52 - t * 0.25 + Math.exp(-bDist * 8) * 0.44);
}

/**
 * Brightness of the dark-section body threads at height t (0..1). Drops
 * to near-zero through The Break and rekindles toward the top.
 */
export function getBodyBright(t: number): number {
  const rekT = (0.5 - Y_BOTTOM) / Y_RANGE;
  if (t < BREAK_T - 0.05) return 1.0;
  if (t < BREAK_T + 0.04) {
    const p = (t - (BREAK_T - 0.05)) / 0.09;
    return Math.max(0.04, 1 - p * p);
  }
  const rp = Math.max(0, Math.min(1, (t - BREAK_T - 0.04) / (rekT - BREAK_T)));
  return 0.04 + rp * rp * 0.88;
}

/**
 * Mound profile — the silhouette width factor at normalised height t.
 * Two named bulges (Living Education at t≈3, Convergence at t≈9) and a
 * crack through The Break.
 */
export function moundR(t: number): number {
  const base = Math.sin(t * Math.PI) * 0.8 + 0.18;
  const boost3 =
    Math.exp(-Math.pow((t - (-2.1 - Y_BOTTOM) / Y_RANGE) * 5.5, 2)) * 0.22;
  const boost9 =
    Math.exp(-Math.pow((t - (3.8 - Y_BOTTOM) / Y_RANGE) * 5.0, 2)) * 0.18;
  const crack = Math.exp(-Math.pow((t - BREAK_T) * 22, 2)) * 0.4;
  return Math.max(0.03, base + boost3 + boost9 - crack);
}
