/**
 * lib/math/laban.ts — Laban Movement Analysis (LMA) effort math.
 *
 * The eight Basic Efforts sit at the corners of a cube whose axes are
 * (Space, Weight, Time). Flow is the fourth axis and modulates each
 * corner. This module provides:
 *
 *   - typed 4D effort coordinates (each axis in -1..+1)
 *   - canonical coordinates for the 8 named corners
 *   - linear blending between two efforts (a choreographic crossfade)
 *   - nearest-corner classification for an arbitrary 4D point
 *
 * Source canon: choreography_engine.js (D:\The_Hangar\apps\prototypes\poi-sculptor\),
 * the EFFORT object — see /lib/assets/flow-arts.ts for the named
 * corners with hex colours and trail widths.
 */

import {
  labanCorners,
  type LabanCorner,
} from "lib/assets/flow-arts";

/**
 * 4D effort point. Each axis is in -1..+1:
 *   space  : -1 = indirect, +1 = direct
 *   weight : -1 = light,    +1 = strong
 *   time   : -1 = sustained, +1 = sudden
 *   flow   : -1 = free,     +1 = bound
 */
export type LabanPoint = {
  space: number;
  weight: number;
  time: number;
  flow: number;
};

/** Convert a named Laban corner into a 4D point at +/-1 on each axis. */
export function cornerToPoint(corner: LabanCorner): LabanPoint {
  return {
    space: corner.space === "direct" ? 1 : -1,
    weight: corner.weight === "strong" ? 1 : -1,
    time: corner.time === "sudden" ? 1 : -1,
    flow: corner.flow === "bound" ? 1 : -1,
  };
}

/** Linear interpolation between two effort points. */
export function lerpEffort(
  a: LabanPoint,
  b: LabanPoint,
  t: number,
): LabanPoint {
  return {
    space: a.space + (b.space - a.space) * t,
    weight: a.weight + (b.weight - a.weight) * t,
    time: a.time + (b.time - a.time) * t,
    flow: a.flow + (b.flow - a.flow) * t,
  };
}

/** Euclidean distance in the 4D effort cube. */
export function effortDistance(a: LabanPoint, b: LabanPoint): number {
  const ds = a.space - b.space;
  const dw = a.weight - b.weight;
  const dt = a.time - b.time;
  const df = a.flow - b.flow;
  return Math.sqrt(ds * ds + dw * dw + dt * dt + df * df);
}

/**
 * Find the nearest named Laban corner for an arbitrary 4D effort
 * point. Returns the corner and the distance.
 */
export function nearestCorner(point: LabanPoint): {
  corner: LabanCorner;
  distance: number;
} {
  let best: { corner: LabanCorner; distance: number } | null = null;
  for (const corner of labanCorners) {
    const d = effortDistance(point, cornerToPoint(corner));
    if (best === null || d < best.distance) {
      best = { corner, distance: d };
    }
  }
  // labanCorners is non-empty, so best is always set.
  return best as { corner: LabanCorner; distance: number };
}

/**
 * Blend two named corners by weight in 0..1; useful for staging a
 * gesture that lives between two efforts (e.g. 0.3 PRESS + 0.7 GLIDE).
 */
export function blendCorners(
  from: LabanCorner,
  to: LabanCorner,
  t: number,
): LabanPoint {
  return lerpEffort(cornerToPoint(from), cornerToPoint(to), t);
}
