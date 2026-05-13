/**
 * Laban Effort &mdash; the maths, in pure functions.
 *
 * Rudolf Laban&rsquo;s four motion factors, each a continuous axis in [-1, 1]:
 *
 *   Space   &mdash; flexible (-1) &harr; direct (+1)
 *   Time    &mdash; sustained (-1) &harr; sudden (+1)
 *   Weight  &mdash; light (-1) &harr; strong (+1)
 *   Flow    &mdash; free (-1) &harr; bound (+1)
 *
 * The first three (Space, Time, Weight) compose Laban&rsquo;s &ldquo;Action
 * Drive&rdquo; cube; their eight corners are the named Basic Efforts. Flow is
 * the fourth dimension &mdash; it conditions the others rather than naming a
 * new corner.
 *
 * The eight Basic Efforts (canonical Laban naming) at the corners of the
 * Space&times;Time&times;Weight cube:
 *
 *   Float  (-1, -1, -1)   flexible, sustained, light
 *   Wring  (-1, -1, +1)   flexible, sustained, strong
 *   Punch  (+1, +1, +1)   direct,   sudden,    strong
 *   Dab    (+1, +1, -1)   direct,   sudden,    light
 *   Press  (+1, -1, +1)   direct,   sustained, strong
 *   Glide  (+1, -1, -1)   direct,   sustained, light
 *   Slash  (-1, +1, +1)   flexible, sudden,    strong
 *   Flick  (-1, +1, -1)   flexible, sudden,    light
 *
 * Pure functions; no React, no Three.js; importable anywhere.
 */

export type LabanEffort = {
  /** Flexible (-1) to direct (+1). */
  space: number;
  /** Sustained (-1) to sudden (+1). */
  time: number;
  /** Light (-1) to strong (+1). */
  weight: number;
  /** Free (-1) to bound (+1). */
  flow: number;
};

export const EFFORT_FACTORS = ["space", "time", "weight", "flow"] as const;

export type EffortFactor = (typeof EFFORT_FACTORS)[number];

/**
 * Pole labels for each factor, in [negative, positive] order. Match the
 * sign convention above.
 */
export const EFFORT_POLES: Record<EffortFactor, readonly [string, string]> = {
  space: ["flexible", "direct"],
  time: ["sustained", "sudden"],
  weight: ["light", "strong"],
  flow: ["free", "bound"],
};

/** Laban&rsquo;s eight Basic Efforts at the corners of the cube. */
export type BasicEffortName =
  | "Float"
  | "Wring"
  | "Punch"
  | "Dab"
  | "Press"
  | "Glide"
  | "Slash"
  | "Flick";

export type BasicEffort = {
  name: BasicEffortName;
  /** The (space, time, weight) corner. Flow is independent. */
  vertex: [number, number, number];
};

export const BASIC_EFFORTS: ReadonlyArray<BasicEffort> = [
  { name: "Float", vertex: [-1, -1, -1] },
  { name: "Wring", vertex: [-1, -1, 1] },
  { name: "Punch", vertex: [1, 1, 1] },
  { name: "Dab", vertex: [1, 1, -1] },
  { name: "Press", vertex: [1, -1, 1] },
  { name: "Glide", vertex: [1, -1, -1] },
  { name: "Slash", vertex: [-1, 1, 1] },
  { name: "Flick", vertex: [-1, 1, -1] },
];

/**
 * Closest named Basic Effort to the supplied (space, time, weight) point.
 * Returns null if the point is too far from every corner (i.e. sitting in
 * the interior of the cube). The default tolerance of 0.45 is the radius of
 * a sphere around each corner; outside that sphere the effort reads as a
 * blend rather than a named action.
 */
export function effortName(
  effort: LabanEffort,
  tolerance = 0.45,
): BasicEffortName | null {
  let bestName: BasicEffortName | null = null;
  let bestDist = Infinity;
  for (const be of BASIC_EFFORTS) {
    const dx = effort.space - be.vertex[0];
    const dy = effort.time - be.vertex[1];
    const dz = effort.weight - be.vertex[2];
    const d = Math.sqrt(dx * dx + dy * dy + dz * dz);
    if (d < bestDist) {
      bestDist = d;
      bestName = be.name;
    }
  }
  if (bestDist > tolerance) return null;
  return bestName;
}

/**
 * Look up a Basic Effort&rsquo;s vertex by name. Flow is supplied
 * separately because Basic Efforts don&rsquo;t name a flow value.
 */
export function basicEffortByName(
  name: BasicEffortName,
): BasicEffort | null {
  for (const be of BASIC_EFFORTS) {
    if (be.name === name) return be;
  }
  return null;
}

/**
 * Compose a LabanEffort from a set of weighted Basic Efforts plus an
 * independent flow value. Weights are normalised to sum to 1 internally; an
 * empty / zero-sum input returns the centre of the cube at the given flow.
 */
export function blendBasicEfforts(
  efforts: ReadonlyArray<{ name: BasicEffortName; weight: number }>,
  flow = 0,
): LabanEffort {
  let totalW = 0;
  for (const e of efforts) totalW += Math.max(0, e.weight);
  if (totalW <= 0) return { space: 0, time: 0, weight: 0, flow };

  let s = 0;
  let t = 0;
  let w = 0;
  for (const e of efforts) {
    const be = basicEffortByName(e.name);
    if (!be) continue;
    const wt = Math.max(0, e.weight) / totalW;
    s += be.vertex[0] * wt;
    t += be.vertex[1] * wt;
    w += be.vertex[2] * wt;
  }
  return { space: s, time: t, weight: w, flow };
}

/** Clamp a single factor to the canonical [-1, 1] range. */
export function clampFactor(v: number): number {
  if (v < -1) return -1;
  if (v > 1) return 1;
  return v;
}

/** Clamp every factor in a LabanEffort to [-1, 1]. */
export function clampEffort(e: LabanEffort): LabanEffort {
  return {
    space: clampFactor(e.space),
    time: clampFactor(e.time),
    weight: clampFactor(e.weight),
    flow: clampFactor(e.flow),
  };
}
