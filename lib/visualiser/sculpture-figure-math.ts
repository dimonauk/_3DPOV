/**
 * lib/visualiser/sculpture-figure-math.ts — Pure helpers for `<SculptureFigure>`.
 *
 * One-line role: cycle-index lookup + bounding-sphere scale-fit for the shared light-sculpture component.
 * Full purpose in sculpture-figure-math.PURPOSE.md.
 *
 * No DOM, no React, no Three.js objects. The component owns the
 * scene graph; this module owns the maths.
 */

/** Result of sizing the trajectory to a target visual radius. */
export type FitResult = {
  /** Uniform scale multiplier that maps source units → ~`targetRadius` units. */
  readonly scale: number;
  /** Centre of mass of the trajectory in source units. */
  readonly center: readonly [number, number, number];
  /** Max distance from `center` to any source point. */
  readonly radius: number;
};

/** Default visual radius the bounding-sphere maps to at `scale=1.0`. */
export const DEFAULT_TARGET_RADIUS = 1.4;

/** Default total walk duration in milliseconds. */
export const DEFAULT_CYCLE_MS = 12_000;

/**
 * Map an elapsed-millisecond reading onto a trajectory index that
 * loops continuously across `count` points in `cycleMs`.
 *
 * Returns a `Math.floor`-ed integer in `[0, count)`. Safe for any
 * positive elapsed value — modulo handles the wrap. Returns `0`
 * when `count <= 0` or `cycleMs <= 0` so callers can render an
 * empty trail without branching upstream.
 */
export function cycleIndex(
  elapsedMs: number,
  count: number,
  cycleMs: number,
): number {
  if (count <= 0 || cycleMs <= 0) return 0;
  const wrapped = ((elapsedMs % cycleMs) + cycleMs) % cycleMs;
  const t = wrapped / cycleMs;
  const idx = Math.floor(t * count);
  if (idx < 0) return 0;
  if (idx >= count) return count - 1;
  return idx;
}

/**
 * Read the `(x, y, z)` at trajectory index `i` from a flat
 * `[x0,y0,z0,...]` Float32Array. Returns zeroes for an
 * out-of-range index — keeps callers branch-free.
 */
export function readPoint(
  positions: Float32Array,
  i: number,
): readonly [number, number, number] {
  const base = i * 3;
  const x = positions[base];
  const y = positions[base + 1];
  const z = positions[base + 2];
  return [
    typeof x === "number" ? x : 0,
    typeof y === "number" ? y : 0,
    typeof z === "number" ? z : 0,
  ];
}

/**
 * Centre of mass + max-radius fit over a trajectory buffer.
 *
 * Different attractors live at different natural scales — Clifford
 * sits in ~2 unit radius, Lorenz can stretch past 30. We compute a
 * cheap bounding sphere (mean-centred, max-radius) once on mount
 * and the caller applies the returned `scale` so every sculpture
 * fits comfortably inside `targetRadius` scene units at the
 * neutral `scale=1` setting.
 */
export function fitToRadius(
  positions: Float32Array,
  targetRadius: number = DEFAULT_TARGET_RADIUS,
): FitResult {
  const count = Math.floor(positions.length / 3);
  if (count <= 0) {
    return { scale: 1, center: [0, 0, 0], radius: 0 };
  }

  let sumX = 0;
  let sumY = 0;
  let sumZ = 0;
  for (let i = 0; i < count; i++) {
    const [x, y, z] = readPoint(positions, i);
    sumX += x;
    sumY += y;
    sumZ += z;
  }
  const cx = sumX / count;
  const cy = sumY / count;
  const cz = sumZ / count;

  let maxSq = 0;
  for (let i = 0; i < count; i++) {
    const [x, y, z] = readPoint(positions, i);
    const dx = x - cx;
    const dy = y - cy;
    const dz = z - cz;
    const sq = dx * dx + dy * dy + dz * dz;
    if (sq > maxSq) maxSq = sq;
  }
  const radius = Math.sqrt(maxSq);
  const scale = radius > 0 ? targetRadius / radius : 1;
  return { scale, center: [cx, cy, cz], radius };
}
